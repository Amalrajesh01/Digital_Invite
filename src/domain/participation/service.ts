import { z } from "zod";
import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { invalid, notFound } from "@/lib/errors";
import { type Actor, requireWeddingAccess } from "@/domain/auth/access";
import { getEntitlements } from "@/domain/packages/service";
import { assertCanUse, canUse } from "@/domain/packages/entitlements";
import type { FeatureKey } from "@/domain/packages/features";
import { rateLimit } from "@/domain/platform/rate-limit";
import { notifyClients } from "@/domain/notify/service";
import { audit } from "@/domain/audit/audit";
import { ingestFile, toResolved, type ResolvedMedia } from "@/domain/media/service";
import type { MediaKind } from "@/domain/media/validate";
import { getWeddingRow } from "@/domain/wedding/snapshot";
import { zonedToUtc, addYears } from "@/lib/time";
import type { GuestContext } from "@/domain/guests/context";

/** Someone taking part: a personalised guest, or an anonymous visitor who typed their name. */
export interface Participant {
  weddingId: string;
  guestId: string | null;
  name: string;
  key: string; // stable rate-limit key
}

export function participantFromGuest(ctx: GuestContext): Participant {
  return { weddingId: ctx.weddingId, guestId: ctx.guestId, name: ctx.name, key: `g:${ctx.guestId}` };
}

export function participantAnonymous(weddingId: string, name: string, ip: string): Participant {
  const clean = name.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 80);
  if (!clean) throw invalid("Please tell us your name.", { name: "Required" });
  return { weddingId, guestId: null, name: clean, key: `ip:${ip}` };
}

const cleanText = (s: string, max: number) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);

async function needFeature(weddingId: string, feature: FeatureKey) {
  assertCanUse(await getEntitlements(weddingId), feature);
}

// ── text wishes / private messages / shout-outs ────────────────────────────
export const MessageInput = z.object({
  kind: z.enum(["WISH", "PRIVATE", "SHOUTOUT"]).default("WISH"),
  body: z.string().trim().min(2, "Please write a few words").max(1200),
  locale: z.string().max(8).optional(),
  /** Private messages only: keep sealed from the couple until after the wedding. */
  sealed: z.boolean().optional(),
});

export async function submitMessage(p: Participant, raw: unknown) {
  const input = MessageInput.parse(raw);
  const feature: FeatureKey = input.kind === "PRIVATE" ? "private_messages" : "guestbook";
  await needFeature(p.weddingId, feature);
  await rateLimit(`msg:${p.key}`, 12, 3600);
  const db = await getDb();
  let unlockAt: Date | null = null;
  if (input.kind === "PRIVATE" && input.sealed) {
    const w = await getWeddingRow(p.weddingId);
    if (w?.weddingDate) unlockAt = zonedToUtc(addYears(w.weddingDate, 0), "23:59", w.timezone);
  }
  const [row] = await db
    .insert(schema.guestMessages)
    .values({
      weddingId: p.weddingId,
      guestId: p.guestId,
      authorName: p.name,
      kind: input.kind,
      body: cleanText(input.body, 1200),
      locale: input.locale ?? "en",
      unlockAt,
      // Private messages are read only by the couple, so they need no public approval.
      moderation: input.kind === "PRIVATE" ? "APPROVED" : "PENDING",
    })
    .returning({ id: schema.guestMessages.id });
  await notifyClients(p.weddingId, "new_wish", { name: p.name }, `/client/${p.weddingId}/wishes`);
  return row;
}

export async function listPublicMessages(weddingId: string, opts: { limit?: number } = {}) {
  const db = await getDb();
  return db
    .select({ id: schema.guestMessages.id, authorName: schema.guestMessages.authorName, kind: schema.guestMessages.kind, body: schema.guestMessages.body, pinned: schema.guestMessages.pinned, createdAt: schema.guestMessages.createdAt })
    .from(schema.guestMessages)
    .where(and(eq(schema.guestMessages.weddingId, weddingId), inArray(schema.guestMessages.kind, ["WISH", "SHOUTOUT"]), eq(schema.guestMessages.moderation, "APPROVED")))
    .orderBy(desc(schema.guestMessages.pinned), desc(schema.guestMessages.createdAt))
    .limit(Math.min(opts.limit ?? 60, 200));
}

export async function listMessages(actor: Actor | null, weddingId: string, f: { kind?: "WISH" | "PRIVATE" | "SHOUTOUT"; moderation?: "PENDING" | "APPROVED" | "REJECTED" } = {}) {
  await requireWeddingAccess(actor, weddingId, { feature: "guestbook" });
  const db = await getDb();
  const conds = [eq(schema.guestMessages.weddingId, weddingId)];
  if (f.kind) conds.push(eq(schema.guestMessages.kind, f.kind));
  if (f.moderation) conds.push(eq(schema.guestMessages.moderation, f.moderation));
  const rows = await db.select().from(schema.guestMessages).where(and(...conds)).orderBy(desc(schema.guestMessages.createdAt)).limit(500);
  const now = Date.now();
  // Sealed private messages stay unreadable — even to the couple — until their unlock time.
  return rows.map((m) => (m.kind === "PRIVATE" && m.unlockAt && m.unlockAt.getTime() > now ? { ...m, body: "", sealed: true as const } : { ...m, sealed: false as const }));
}

export async function moderateMessage(actor: Actor | null, weddingId: string, id: string, decision: "APPROVED" | "REJECTED" | "PENDING") {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "guestbook" });
  const db = await getDb();
  const [row] = await db
    .update(schema.guestMessages)
    .set({ moderation: decision, moderatedAt: new Date(), moderatedBy: scope.actor.kind === "system" ? null : scope.actor.userId })
    .where(and(eq(schema.guestMessages.id, id), eq(schema.guestMessages.weddingId, weddingId)))
    .returning();
  if (!row) throw notFound("Message not found.");
  await audit(scope.actor, `message.${decision.toLowerCase()}`, { weddingId, entityType: "message", entityId: id });
  return row;
}

export async function pinMessage(actor: Actor | null, weddingId: string, id: string, pinned: boolean) {
  await requireWeddingAccess(actor, weddingId, { feature: "guestbook" });
  const db = await getDb();
  await db.update(schema.guestMessages).set({ pinned }).where(and(eq(schema.guestMessages.id, id), eq(schema.guestMessages.weddingId, weddingId)));
}

export async function deleteMessage(actor: Actor | null, weddingId: string, id: string) {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "guestbook" });
  const db = await getDb();
  await db.delete(schema.guestMessages).where(and(eq(schema.guestMessages.id, id), eq(schema.guestMessages.weddingId, weddingId)));
  await audit(scope.actor, "message.deleted", { weddingId, entityType: "message", entityId: id });
}

// ── guest photo / video uploads (moderated) ────────────────────────────────
export async function submitGuestUpload(p: Participant, file: { buffer: Buffer; filename: string; durationSec?: number | null }, opts: { caption?: string } = {}) {
  const ent = await getEntitlements(p.weddingId);
  assertCanUse(ent, "guest_uploads");
  await rateLimit(`upload:${p.key}`, 40, 3600);
  const allow: MediaKind[] = canUse(ent, "video_wishes") ? ["IMAGE", "VIDEO"] : ["IMAGE"];
  const asset = await ingestFile({
    weddingId: p.weddingId,
    buffer: file.buffer,
    filename: file.filename,
    category: "GUEST_UPLOAD",
    allow,
    source: "GUEST",
    uploadedByGuestId: p.guestId,
    durationSec: file.durationSec,
    title: p.name,
    caption: opts.caption ? { en: cleanText(opts.caption, 200) } : {},
    moderation: "PENDING",
    visibility: "PRIVATE",
    retention: "TEMPORARY",
  });
  await notifyClients(p.weddingId, "new_guest_upload", { name: p.name, kind: asset.kind === "IMAGE" ? "photo" : "video" }, `/client/${p.weddingId}/photos`);
  return { id: asset.id, moderation: asset.moderation };
}

export async function listGuestUploads(actor: Actor | null, weddingId: string, moderation?: "PENDING" | "APPROVED" | "REJECTED") {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_uploads" });
  const db = await getDb();
  const conds = [eq(schema.mediaAssets.weddingId, weddingId), eq(schema.mediaAssets.category, "GUEST_UPLOAD"), isNull(schema.mediaAssets.archivedAt)];
  if (moderation) conds.push(eq(schema.mediaAssets.moderation, moderation));
  return db.select().from(schema.mediaAssets).where(and(...conds)).orderBy(desc(schema.mediaAssets.createdAt)).limit(500);
}

/** Live photo wall + guest gallery: approved guest photos only. `since` enables cheap polling. */
export async function listPhotoWall(weddingId: string, opts: { since?: Date; limit?: number; kind?: "IMAGE" | "VIDEO" } = {}): Promise<(ResolvedMedia & { by: string; approvedAt: string })[]> {
  const db = await getDb();
  const conds = [
    eq(schema.mediaAssets.weddingId, weddingId),
    eq(schema.mediaAssets.category, "GUEST_UPLOAD"),
    eq(schema.mediaAssets.moderation, "APPROVED"),
    eq(schema.mediaAssets.visibility, "PUBLIC"),
    isNull(schema.mediaAssets.archivedAt),
    eq(schema.mediaAssets.kind, opts.kind ?? "IMAGE"),
  ];
  if (opts.since) conds.push(gt(schema.mediaAssets.moderatedAt, opts.since));
  const rows = await db.select().from(schema.mediaAssets).where(and(...conds)).orderBy(desc(schema.mediaAssets.moderatedAt)).limit(Math.min(opts.limit ?? 60, 200));
  return rows.map((a) => ({ ...toResolved(a), by: a.title, approvedAt: (a.moderatedAt ?? a.createdAt).toISOString() }));
}

// ── video & voice wishes ───────────────────────────────────────────────────
export async function submitMediaWish(p: Participant, kind: "VIDEO" | "VOICE", file: { buffer: Buffer; filename: string; durationSec?: number | null }, message = "") {
  await needFeature(p.weddingId, kind === "VIDEO" ? "video_wishes" : "voice_wishes");
  await rateLimit(`wish-media:${p.key}`, 10, 3600);
  const asset = await ingestFile({
    weddingId: p.weddingId,
    buffer: file.buffer,
    filename: file.filename,
    category: kind === "VIDEO" ? "VIDEO" : "MUSIC",
    allow: kind === "VIDEO" ? ["VIDEO"] : ["AUDIO", "VIDEO"], // browsers record voice as audio/webm which sniffs as WebM
    source: "GUEST",
    uploadedByGuestId: p.guestId,
    durationSec: file.durationSec,
    title: p.name,
    moderation: "PENDING",
    visibility: "PRIVATE",
    retention: "TEMPORARY",
  });
  const db = await getDb();
  const [row] = await db
    .insert(schema.mediaWishes)
    .values({ weddingId: p.weddingId, guestId: p.guestId, authorName: p.name, kind, assetId: asset.id, message: cleanText(message, 400) })
    .returning({ id: schema.mediaWishes.id });
  await notifyClients(p.weddingId, "new_wish", { name: p.name }, `/client/${p.weddingId}/${kind === "VIDEO" ? "video-wishes" : "voice-wishes"}`);
  return row;
}

export async function listMediaWishes(actor: Actor | null, weddingId: string, kind: "VIDEO" | "VOICE", moderation?: "PENDING" | "APPROVED" | "REJECTED") {
  await requireWeddingAccess(actor, weddingId, { feature: kind === "VIDEO" ? "video_wishes" : "voice_wishes" });
  const db = await getDb();
  const conds = [eq(schema.mediaWishes.weddingId, weddingId), eq(schema.mediaWishes.kind, kind)];
  if (moderation) conds.push(eq(schema.mediaWishes.moderation, moderation));
  const rows = await db
    .select({ wish: schema.mediaWishes, asset: schema.mediaAssets })
    .from(schema.mediaWishes)
    .innerJoin(schema.mediaAssets, eq(schema.mediaAssets.id, schema.mediaWishes.assetId))
    .where(and(...conds))
    .orderBy(desc(schema.mediaWishes.createdAt));
  return rows.map((r) => ({ ...r.wish, media: toResolved(r.asset) }));
}

export async function moderateMediaWish(actor: Actor | null, weddingId: string, id: string, decision: "APPROVED" | "REJECTED") {
  const db = await getDb();
  const [w] = await db.select().from(schema.mediaWishes).where(and(eq(schema.mediaWishes.id, id), eq(schema.mediaWishes.weddingId, weddingId)));
  if (!w) throw notFound("Wish not found.");
  const scope = await requireWeddingAccess(actor, weddingId, { feature: w.kind === "VIDEO" ? "video_wishes" : "voice_wishes" });
  await db.update(schema.mediaWishes).set({ moderation: decision, moderatedAt: new Date() }).where(eq(schema.mediaWishes.id, id));
  await db
    .update(schema.mediaAssets)
    .set({ moderation: decision, visibility: decision === "APPROVED" ? "PUBLIC" : "PRIVATE", retention: decision === "APPROVED" ? "PERMANENT" : "TEMPORARY", moderatedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.mediaAssets.id, w.assetId));
  await audit(scope.actor, `wish_media.${decision.toLowerCase()}`, { weddingId, entityType: "media_wish", entityId: id });
}

export async function listPublicMediaWishes(weddingId: string, kind: "VIDEO" | "VOICE") {
  const db = await getDb();
  const rows = await db
    .select({ wish: schema.mediaWishes, asset: schema.mediaAssets })
    .from(schema.mediaWishes)
    .innerJoin(schema.mediaAssets, eq(schema.mediaAssets.id, schema.mediaWishes.assetId))
    .where(and(eq(schema.mediaWishes.weddingId, weddingId), eq(schema.mediaWishes.kind, kind), eq(schema.mediaWishes.moderation, "APPROVED")))
    .orderBy(desc(schema.mediaWishes.createdAt))
    .limit(30);
  return rows.map((r) => ({ id: r.wish.id, authorName: r.wish.authorName, message: r.wish.message, media: toResolved(r.asset) }));
}

