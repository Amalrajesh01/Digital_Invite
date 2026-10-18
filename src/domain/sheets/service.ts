import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { type Actor, requireAdmin } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { forbidden, invalid, notFound } from "@/lib/errors";
import { logError } from "@/domain/platform/logging";
import { getEntitlements } from "@/domain/packages/service";
import { canUse, type Entitlements } from "@/domain/packages/entitlements";
import { SheetError, googleConfigured, serviceAccountEmail, spreadsheetIdFrom, writeTabs, type Fetch } from "./google";
import { buildReport } from "./report";

const SYSTEM: Actor = { kind: "system" };

/**
 * The daily Google Sheet: for an invitation that has no client dashboard (Essential), the owner gives the client a Google Sheet
 * instead. Every day at 6 pm India time the sheet is rewritten with the latest numbers, guests and replies. Owner-only.
 */

/** "Instead of the dashboard": an invitation without the client dashboard is the one that gets a sheet. Dashboards are not touched. */
export const sheetEligible = (ent: Entitlements) => !canUse(ent, "client_dashboard");

export interface SheetStatus {
  configuredOnServer: boolean;
  serviceEmail: string | null;
  eligible: boolean;
  spreadsheetId: string | null;
  enabled: boolean;
  lastSyncAt: Date | null;
  lastStatus: "OK" | "ERROR" | null;
  lastMessage: string;
}

export async function getSheetStatus(actor: Actor | null, weddingId: string): Promise<SheetStatus> {
  requireAdmin(actor);
  const db = await getDb();
  const [row] = await db.select().from(schema.weddingSheets).where(eq(schema.weddingSheets.weddingId, weddingId));
  return {
    configuredOnServer: googleConfigured(), serviceEmail: serviceAccountEmail(), eligible: sheetEligible(await getEntitlements(weddingId)),
    spreadsheetId: row?.spreadsheetId ?? null, enabled: row?.enabled ?? false, lastSyncAt: row?.lastSyncAt ?? null, lastStatus: row?.lastStatus ?? null, lastMessage: row?.lastMessage ?? "",
  };
}

export async function saveSheetConfig(actor: Actor | null, weddingId: string, input: { link: string; enabled: boolean }) {
  const admin = requireAdmin(actor);
  if (!sheetEligible(await getEntitlements(weddingId))) throw forbidden("This invitation has the client dashboard, so it does not use the daily sheet.");
  const id = spreadsheetIdFrom(input.link);
  if (!id) throw invalid("That does not look like a Google Sheets link. Open the sheet and copy the address from the browser.", { link: "Paste the sheet's link" });
  const db = await getDb();
  await db.insert(schema.weddingSheets).values({ weddingId, spreadsheetId: id, enabled: input.enabled }).onConflictDoUpdate({ target: schema.weddingSheets.weddingId, set: { spreadsheetId: id, enabled: input.enabled, updatedAt: new Date() } });
  await audit(admin, "sheet.configured", { weddingId, entityType: "wedding", entityId: weddingId, metadata: { enabled: input.enabled } });
}

/** Writes the latest report into the wedding's sheet and records how it went. Never throws: the outcome is the return value. */
export async function syncWeddingSheet(weddingId: string, f: Fetch = fetch): Promise<{ ok: boolean; message: string }> {
  const db = await getDb();
  const [row] = await db.select().from(schema.weddingSheets).where(eq(schema.weddingSheets.weddingId, weddingId));
  if (!row) return { ok: false, message: "No sheet is set up for this invitation." };
  let result: { ok: boolean; message: string };
  try {
    if (!sheetEligible(await getEntitlements(weddingId))) throw new SheetError("This invitation has the client dashboard, so it does not use the daily sheet.", "FAILED");
    await writeTabs(row.spreadsheetId, await buildReport(weddingId), f);
    result = { ok: true, message: "Sheet updated." };
  } catch (e) {
    if (!(e instanceof SheetError)) void logError("sheets", e, { weddingId });
    result = { ok: false, message: e instanceof SheetError ? e.message : "Something went wrong while updating the sheet. It will be tried again tomorrow." };
  }
  await db.update(schema.weddingSheets).set({ lastSyncAt: new Date(), lastStatus: result.ok ? "OK" : "ERROR", lastMessage: result.message, updatedAt: new Date() }).where(eq(schema.weddingSheets.weddingId, weddingId));
  return result;
}

/** The owner's "Send now" button. */
export async function syncSheetNow(actor: Actor | null, weddingId: string, f: Fetch = fetch) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  const [w] = await db.select({ id: schema.weddings.id }).from(schema.weddings).where(eq(schema.weddings.id, weddingId));
  if (!w) throw notFound("We could not find that wedding.");
  const r = await syncWeddingSheet(weddingId, f);
  await audit(admin, "sheet.synced", { weddingId, entityType: "wedding", entityId: weddingId, metadata: { ok: r.ok, by: "owner" } });
  return r;
}

/** The 6 pm job: every enabled sheet. One wedding's failure never stops the others. */
export async function syncAllSheets(f: Fetch = fetch): Promise<{ synced: number; failed: number }> {
  const db = await getDb();
  const rows = await db.select({ weddingId: schema.weddingSheets.weddingId }).from(schema.weddingSheets).where(eq(schema.weddingSheets.enabled, true));
  let synced = 0, failed = 0;
  for (const r of rows) {
    const out = await syncWeddingSheet(r.weddingId, f);
    if (out.ok) synced++; else failed++;
  }
  if (rows.length) await audit(SYSTEM, "sheet.daily", { metadata: { synced, failed } });
  return { synced, failed };
}
