import type { Transporter } from "nodemailer";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db/client";
import { type Actor, requireAdmin } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { forbidden, invalid, notFound } from "@/lib/errors";
import { logError } from "@/domain/platform/logging";
import { getEntitlements } from "@/domain/packages/service";
import { canUse, type Entitlements } from "@/domain/packages/entitlements";
import { MailError, mailReady, sendMail } from "@/domain/mail/transport";
import { buildReportData } from "./data";
import { composeReportEmail } from "./email";
import { renderReportPdf, reportFileName } from "./pdf";

const SYSTEM: Actor = { kind: "system" };

/**
 * The daily report: for an invitation that has no client dashboard (Essential) the owner gets a PDF by email instead.
 * Every day at 6 pm India time, and whenever the platform owner presses "Send now". Owner-only; dashboards are not touched.
 */
export const reportEligible = (ent: Entitlements) => !canUse(ent, "client_dashboard");

export interface ReportStatus {
  eligible: boolean;
  mailReady: boolean;
  /** Who gets it: what was saved, or the wedding's contact email until something is saved. */
  recipients: string;
  saved: boolean;
  enabled: boolean;
  lastSentAt: Date | null;
  lastStatus: "OK" | "ERROR" | null;
  lastMessage: string;
}

const MAX_RECIPIENTS = 5;
const ADDRESS = z.string().email();

/** "a@x.com, b@y.com" (commas, semicolons, spaces or new lines) → the list, and what could not be read. */
export function parseRecipients(text: string) {
  const parts = text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const bad = parts.filter((p) => !ADDRESS.safeParse(p).success);
  const list = [...new Set(parts.filter((p) => !bad.includes(p)).map((p) => p.toLowerCase()))];
  return { list, bad };
}

export async function getReportStatus(actor: Actor | null, weddingId: string): Promise<ReportStatus> {
  requireAdmin(actor);
  const db = await getDb();
  const [row] = await db.select().from(schema.weddingReports).where(eq(schema.weddingReports.weddingId, weddingId));
  const [w] = await db.select({ contactEmail: schema.weddings.contactEmail }).from(schema.weddings).where(eq(schema.weddings.id, weddingId));
  return {
    eligible: reportEligible(await getEntitlements(weddingId)), mailReady: await mailReady(),
    recipients: row ? row.recipients : w?.contactEmail ?? "", saved: !!row, enabled: row?.enabled ?? true,
    lastSentAt: row?.lastSentAt ?? null, lastStatus: row?.lastStatus ?? null, lastMessage: row?.lastMessage ?? "",
  };
}

export async function saveReportConfig(actor: Actor | null, weddingId: string, input: { recipients: string; enabled: boolean }) {
  const admin = requireAdmin(actor);
  if (!reportEligible(await getEntitlements(weddingId))) throw forbidden("This invitation has the client dashboard, so it does not use the daily report.");
  const { list, bad } = parseRecipients(input.recipients);
  if (bad.length) throw invalid(`This does not look like an email address: ${bad[0]}`, { recipients: `Check ${bad[0]}` });
  if (list.length > MAX_RECIPIENTS) throw invalid(`Use at most ${MAX_RECIPIENTS} email addresses.`, { recipients: "Too many addresses" });
  if (!list.length) throw invalid("Type the owner's email address.", { recipients: "Required" });
  const recipients = list.join(", ");
  const db = await getDb();
  await db.insert(schema.weddingReports).values({ weddingId, recipients, enabled: input.enabled }).onConflictDoUpdate({ target: schema.weddingReports.weddingId, set: { recipients, enabled: input.enabled, updatedAt: new Date() } });
  await audit(admin, "report.configured", { weddingId, entityType: "wedding", entityId: weddingId, metadata: { enabled: input.enabled, recipients: list.length } });
}

/** Builds the report and emails it to the saved recipients, then records how it went. Never throws: the outcome is the return value. */
export async function sendReport(weddingId: string, o: { now?: Date; transport?: Transporter } = {}): Promise<{ ok: boolean; message: string }> {
  const db = await getDb();
  const [row] = await db.select().from(schema.weddingReports).where(eq(schema.weddingReports.weddingId, weddingId));
  if (!row) return { ok: false, message: "No report is set up for this invitation." };
  let result: { ok: boolean; message: string };
  try {
    if (!reportEligible(await getEntitlements(weddingId))) throw new MailError("This invitation has the client dashboard, so it does not use the daily report.", "FAILED");
    const { list } = parseRecipients(row.recipients);
    if (!list.length) throw new MailError("There is no email address to send to.", "FAILED");
    await sendMail(await composeReportEmail(await buildReportData(weddingId, o.now), list), { transport: o.transport });
    result = { ok: true, message: `Sent to ${list.join(", ")}.` };
  } catch (e) {
    if (!(e instanceof MailError)) void logError("reports", e, { weddingId });
    result = { ok: false, message: e instanceof MailError ? e.message : "Something went wrong while preparing the report. It will be tried again tomorrow." };
  }
  await db.update(schema.weddingReports).set({ lastSentAt: new Date(), lastStatus: result.ok ? "OK" : "ERROR", lastMessage: result.message, updatedAt: new Date() }).where(eq(schema.weddingReports.weddingId, weddingId));
  return result;
}

/** The owner's "Send now" button: saves what is on the form, then sends. */
export async function sendReportNow(actor: Actor | null, weddingId: string, input: { recipients: string; enabled: boolean }, o: { transport?: Transporter } = {}) {
  const admin = requireAdmin(actor);
  await saveReportConfig(admin, weddingId, input);
  const r = await sendReport(weddingId, o);
  await audit(admin, "report.sent", { weddingId, entityType: "wedding", entityId: weddingId, metadata: { ok: r.ok, by: "owner" } });
  return r;
}

/** The PDF itself, for the "Download PDF" button (the owner checks it before it goes out). */
export async function previewReportPdf(actor: Actor | null, weddingId: string) {
  requireAdmin(actor);
  const db = await getDb();
  const [w] = await db.select({ id: schema.weddings.id }).from(schema.weddings).where(eq(schema.weddings.id, weddingId));
  if (!w) throw notFound("We could not find that wedding.");
  const data = await buildReportData(weddingId);
  return { pdf: await renderReportPdf(data), filename: reportFileName(data) };
}

/** The 6 pm job: every enabled report. One wedding's failure never stops the others. */
export async function sendAllReports(o: { now?: Date; transport?: Transporter } = {}): Promise<{ sent: number; failed: number }> {
  const db = await getDb();
  const rows = await db.select({ weddingId: schema.weddingReports.weddingId }).from(schema.weddingReports).where(eq(schema.weddingReports.enabled, true));
  let sent = 0, failed = 0;
  for (const r of rows) {
    const out = await sendReport(r.weddingId, o);
    if (out.ok) sent++; else failed++;
  }
  if (rows.length) await audit(SYSTEM, "report.daily", { metadata: { sent, failed } });
  return { sent, failed };
}
