import sharp from "sharp";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { ensurePackages } from "@/domain/packages/service";
import { ensureDesignLibrary } from "@/domain/design/service";
import { createUser, assignClientToWedding } from "@/domain/auth/service";
import { loadActorForUser, type AdminActor, type ClientActor } from "@/domain/auth/access";
import { createWedding, saveDraft, publishWedding, getWedding } from "@/domain/wedding/service";
import { newId } from "@/lib/id";
import type { PackageKey } from "@/domain/packages/features";
import type { InvitationDoc } from "@/domain/doc/schema";

let counter = 0;
export const uniq = (p = "t") => `${p}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export async function bootstrap() {
  await ensurePackages();
  await ensureDesignLibrary();
  const admin = await createUser({ email: `${uniq("admin")}@example.com`, name: "Admin", role: "SUPER_ADMIN", password: "Sup3rSecret-pass" });
  return (await loadActorForUser(admin.id)) as AdminActor;
}

export async function firstTemplateAndTheme() {
  const db = await getDb();
  const [t] = await db.select().from(schema.templates).limit(1);
  const [th] = await db.select().from(schema.themes).limit(1);
  return { templateId: t.id, themeId: th.id };
}

export interface MadeWedding {
  id: string;
  slug: string;
  venueId: string;
}

export async function makeWedding(
  admin: AdminActor,
  pkg: PackageKey,
  opts: { slug?: string; date?: string; publish?: boolean; secondary?: string | null; patch?: (d: InvitationDoc) => void } = {},
): Promise<MadeWedding> {
  const { templateId, themeId } = await firstTemplateAndTheme();
  const w = await createWedding(admin, {
    title: "Anjali & Sidharth",
    slug: opts.slug ?? uniq("wed"),
    packageKey: pkg,
    templateId,
    themeId,
    weddingDate: opts.date ?? "2099-12-12",
    secondaryLocale: opts.secondary ?? null,
  });
  const full = await getWedding(admin, w.id);
  const doc = structuredClone(full.draftDoc);
  doc.couple.bride.name = { en: "Anjali" };
  doc.couple.groom.name = { en: "Sidharth" };
  const venueId = newId();
  doc.venues = [
    { id: venueId, name: { en: "Grand Hall" }, address: { en: "MG Road" }, city: { en: "Kochi" }, mapUrl: "", parking: { info: {}, mapUrl: "" }, directions: { airport: {}, railway: {}, road: {} }, landmarkMap: { pins: [] }, hotels: [], nearby: [], shuttle: { info: {}, schedule: [] }, guide: [] } as never,
  ];
  doc.events = [
    { id: "evt-ceremony", name: { en: "Wedding" }, date: opts.date ?? "2099-12-12", startTime: "10:00", endTime: "12:00", venueId, isMain: true, order: 0, description: {}, dressCode: {}, dressColors: [], notes: {}, mapUrl: "", visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: {}, body: {} } } as never,
  ];
  doc.rsvp.deadline = "";
  opts.patch?.(doc);
  await saveDraft(admin, w.id, doc);
  if (opts.publish !== false) await publishWedding(admin, w.id);
  return { id: w.id, slug: w.slug, venueId };
}

export async function makeClient(admin: AdminActor, weddingId: string): Promise<ClientActor> {
  const u = await assignClientToWedding(admin, { weddingId, email: `${uniq("client")}@example.com`, name: "Client" });
  return (await loadActorForUser(u.id)) as ClientActor;
}

export async function pngBuffer(w = 300, h = 200, color = { r: 180, g: 120, b: 60 }) {
  return sharp({ create: { width: w, height: h, channels: 3, background: color } }).png().toBuffer();
}

export async function setStatusDirect(weddingId: string, status: "DRAFT" | "PUBLISHED" | "LIVE_EVENT" | "POST_EVENT" | "MEMORY" | "ANNIVERSARY", extra: Partial<typeof schema.weddings.$inferInsert> = {}) {
  const db = await getDb();
  await db.update(schema.weddings).set({ status, autoLifecycle: false, ...extra }).where(eq(schema.weddings.id, weddingId));
}
