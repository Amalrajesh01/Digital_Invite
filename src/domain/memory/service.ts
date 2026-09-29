import { z } from "zod";
import { and, asc, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { forbidden, invalid, locked, notFound } from "@/lib/errors";
import { zonedToUtc } from "@/lib/time";
import { type Actor, requireAdmin, requireWeddingAccess } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { getEntitlements } from "@/domain/packages/service";
import { assertCanUse, canUse } from "@/domain/packages/entitlements";
import { ingestFile, resolveMediaMap, toResolved, type ResolvedMedia } from "@/domain/media/service";
import type { MediaKind } from "@/domain/media/validate";
import { loadRulesDoc } from "@/domain/wedding/snapshot";
import { rateLimit } from "@/domain/platform/rate-limit";
import type { LocalizedText } from "@/domain/doc/schema";
import type { Participant } from "@/domain/participation/service";
import { enqueue } from "@/domain/notify/service";

// ── time capsule ───────────────────────────────────────────────────────────
/** Ensure the capsule row mirrors the document's configured unlock date. */
export async function syncCapsule(weddingId: string) {
  const { wedding, doc } = await loadRulesDoc(weddingId);
  const db = await getDb();
  const date = doc.timeCapsule.unlockDate;
  if (!date) return null;
  const unlockAt = zonedToUtc(date, "00:00", wedding.timezone);
  const [cur] = await db.select().from(schema.timeCapsules).where(eq(schema.timeCapsules.weddingId, weddingId));
  if (!cur) {
    const [row] = await db.insert(schema.timeCapsules).values({ weddingId, unlockAt, prompt: doc.timeCapsule.prompt }).returning();
    return row;
  }
  // Once a capsule has opened it stays open: a later edit of the date must never re-seal it.
  if (cur.unlockAt.getTime() <= Date.now()) return cur;
  // The unlock date can be moved LATER by the couple's designer but never silently earlier once items exist.
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.timeCapsuleItems).where(eq(schema.timeCapsuleItems.capsuleId, cur.id));
  if (n > 0 && unlockAt.getTime() < cur.unlockAt.getTime()) return cur;
  if (cur.unlockAt.getTime() !== unlockAt.getTime() || JSON.stringify(cur.prompt) !== JSON.stringify(doc.timeCapsule.prompt)) {
    const [row] = await db.update(schema.timeCapsules).set({ unlockAt, prompt: doc.timeCapsule.prompt, updatedAt: new Date() }).where(eq(schema.timeCapsules.id, cur.id)).returning();
    return row;
  }
  return cur;
}

export async function capsuleStatus(weddingId: string, now = new Date()) {
  const capsule = await syncCapsule(weddingId);
  if (!capsule) return null;
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.timeCapsuleItems).where(eq(schema.timeCapsuleItems.capsuleId, capsule.id));
  return { unlockAt: capsule.unlockAt.toISOString(), unlocked: capsule.unlockAt.getTime() <= now.getTime(), count: n, prompt: capsule.prompt };
}

export const CapsuleInput = z.object({
  kind: z.enum(["TEXT", "PHOTO", "VIDEO", "VOICE"]),
  body: z.string().trim().max(2000).optional(),
});

export async function submitCapsuleItem(p: Participant, raw: unknown, file?: { buffer: Buffer; filename: string; durationSec?: number | null }) {
  const input = CapsuleInput.parse(raw);
  assertCanUse(await getEntitlements(p.weddingId), "time_capsule");
  await rateLimit(`capsule:${p.key}`, 10, 3600);
  const capsule = await syncCapsule(p.weddingId);
  if (!capsule) throw invalid("The time capsule is not open for entries yet.");
  if (capsule.unlockAt.getTime() <= Date.now()) throw locked("The time capsule has already been opened.");
  const { doc } = await loadRulesDoc(p.weddingId);
  const allowed = { TEXT: true, PHOTO: doc.timeCapsule.allowPhoto, VIDEO: doc.timeCapsule.allowVideo, VOICE: doc.timeCapsule.allowVoice }[input.kind];
  if (!allowed) throw invalid("That kind of entry is not enabled for this capsule.");
  let assetId: string | null = null;
  if (input.kind === "TEXT") {
    if (!input.body || input.body.length < 2) throw invalid("Write a few words for the capsule.", { body: "Required" });
  } else {
    if (!file) throw invalid("Please attach a file.");
    const allow: MediaKind[] = input.kind === "PHOTO" ? ["IMAGE"] : input.kind === "VIDEO" ? ["VIDEO"] : ["AUDIO", "VIDEO"];
    const asset = await ingestFile({
      weddingId: p.weddingId,
      buffer: file.buffer,
      filename: file.filename,
      category: "MEMORY",
      allow,
      source: "GUEST",
      uploadedByGuestId: p.guestId,
      durationSec: file.durationSec,
      title: p.name,
      moderation: "PENDING",
      visibility: "PRIVATE",
      retention: "PERMANENT", // time-capsule content is a permanent memory
    });
    assetId = asset.id;
  }
  const db = await getDb();
  const [row] = await db
    .insert(schema.timeCapsuleItems)
    .values({ weddingId: p.weddingId, capsuleId: capsule.id, guestId: p.guestId, authorName: p.name, kind: input.kind, body: input.body ?? "", assetId })
    .returning({ id: schema.timeCapsuleItems.id });
  return row;
}

/**
 * The lock is enforced HERE, server-side. Before the unlock moment this returns nothing at all —
 * for guests, clients and (unless they explicitly unlock early with an audit entry) Super Admin too.
 */
export async function listCapsuleItems(weddingId: string, opts: { includeHidden?: boolean } = {}, now = new Date()) {
  const capsule = await syncCapsule(weddingId);
  if (!capsule || capsule.unlockAt.getTime() > now.getTime()) return [];
  const db = await getDb();
  const rows = await db
    .select({ item: schema.timeCapsuleItems, asset: schema.mediaAssets })
    .from(schema.timeCapsuleItems)
    .leftJoin(schema.mediaAssets, eq(schema.mediaAssets.id, schema.timeCapsuleItems.assetId))
    .where(and(eq(schema.timeCapsuleItems.capsuleId, capsule.id), opts.includeHidden ? undefined : eq(schema.timeCapsuleItems.hidden, false)))
    .orderBy(asc(schema.timeCapsuleItems.createdAt));
  return rows.map((r) => ({ id: r.item.id, authorName: r.item.authorName, kind: r.item.kind, body: r.item.body, hidden: r.item.hidden, createdAt: r.item.createdAt.toISOString(), media: r.asset ? toResolved(r.asset) : null }));
}

export async function listCapsuleForDashboard(actor: Actor | null, weddingId: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "time_capsule" });
  const status = await capsuleStatus(weddingId);
  const items = status?.unlocked ? await listCapsuleItems(weddingId, { includeHidden: true }) : [];
  return { status, items };
}

export async function hideCapsuleItem(actor: Actor | null, weddingId: string, itemId: string, hidden: boolean) {
  await requireWeddingAccess(actor, weddingId, { feature: "time_capsule" });
  const status = await capsuleStatus(weddingId);
  if (!status?.unlocked) throw locked("Items can be reviewed once the capsule is open.");
  const db = await getDb();
  await db.update(schema.timeCapsuleItems).set({ hidden }).where(and(eq(schema.timeCapsuleItems.id, itemId), eq(schema.timeCapsuleItems.weddingId, weddingId)));
}

/** Super Admin only, audited: open the capsule now (e.g. for a sneak-peek at the family's request). */
export async function unlockCapsuleEarly(actor: Actor | null, weddingId: string) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  const capsule = await syncCapsule(weddingId);
  if (!capsule) throw notFound("No time capsule is configured.");
  await db.update(schema.timeCapsules).set({ unlockAt: new Date(), updatedAt: new Date() }).where(eq(schema.timeCapsules.id, capsule.id));
  await audit(admin, "capsule.unlocked_early", { weddingId, entityType: "time_capsule", entityId: capsule.id });
}

/** Media of a capsule item is viewable only when its capsule is open and the item is not hidden. */
export async function capsuleAssetIsPublic(assetId: string, now = new Date()): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ unlockAt: schema.timeCapsules.unlockAt, hidden: schema.timeCapsuleItems.hidden })
    .from(schema.timeCapsuleItems)
    .innerJoin(schema.timeCapsules, eq(schema.timeCapsules.id, schema.timeCapsuleItems.capsuleId))
    .where(eq(schema.timeCapsuleItems.assetId, assetId));
  return !!row && !row.hidden && row.unlockAt.getTime() <= now.getTime();
}

// ── memory book ────────────────────────────────────────────────────────────
export async function getMemoryBook(weddingId: string) {
  const db = await getDb();
  const [b] = await db.select().from(schema.memoryBooks).where(eq(schema.memoryBooks.weddingId, weddingId));
  return b ?? null;
}

export async function saveMemoryBook(
  actor: Actor | null,
  weddingId: string,
  input: { title?: LocalizedText; intro?: LocalizedText; pinnedMessageIds?: string[]; pinnedAssetIds?: string[]; publish?: boolean },
) {
  await requireWeddingAccess(actor, weddingId, { feature: "memory_book" });
  const db = await getDb();
  const values = {
    title: input.title ?? {},
    intro: input.intro ?? {},
    pinnedMessageIds: input.pinnedMessageIds ?? [],
    pinnedAssetIds: input.pinnedAssetIds ?? [],
    publishedAt: input.publish ? new Date() : null,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(schema.memoryBooks)
    .values({ weddingId, ...values })
    .onConflictDoUpdate({ target: schema.memoryBooks.weddingId, set: values })
    .returning();
  return row;
}

export interface PublicMemoryBook {
  title: LocalizedText;
  intro: LocalizedText;
  messages: { id: string; authorName: string; body: string }[];
  photos: ResolvedMedia[];
}

export async function loadPublicMemoryBook(weddingId: string): Promise<PublicMemoryBook | null> {
  const b = await getMemoryBook(weddingId);
  if (!b || !b.publishedAt) return null;
  const db = await getDb();
  const messages = b.pinnedMessageIds.length
    ? await db
        .select({ id: schema.guestMessages.id, authorName: schema.guestMessages.authorName, body: schema.guestMessages.body })
        .from(schema.guestMessages)
        .where(and(eq(schema.guestMessages.weddingId, weddingId), inArray(schema.guestMessages.id, b.pinnedMessageIds), eq(schema.guestMessages.moderation, "APPROVED")))
    : [];
  const map = await resolveMediaMap(weddingId, b.pinnedAssetIds);
  return { title: b.title, intro: b.intro, messages, photos: b.pinnedAssetIds.map((i) => map[i]).filter(Boolean) };
}

// ── anniversary ────────────────────────────────────────────────────────────
export async function listAnniversaryEntries(weddingId: string, now = new Date()) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.anniversaryEntries)
    .where(and(eq(schema.anniversaryEntries.weddingId, weddingId), sql`(${schema.anniversaryEntries.unlocksAt} is null or ${schema.anniversaryEntries.unlocksAt} <= ${now})`))
    .orderBy(desc(schema.anniversaryEntries.year));
  const map = await resolveMediaMap(weddingId, rows.flatMap((r) => r.assetIds));
  return rows.map((r) => ({ id: r.id, year: r.year, title: r.title, body: r.body, photos: r.assetIds.map((i) => map[i]).filter(Boolean) }));
}

export async function saveAnniversaryEntry(
  actor: Actor | null,
  weddingId: string,
  input: { id?: string; year: number; title: LocalizedText; body: LocalizedText; assetIds?: string[]; unlocksAt?: Date | null },
) {
  await requireWeddingAccess(actor, weddingId, { feature: "anniversary_mode" });
  const db = await getDb();
  if (input.id) {
    const [row] = await db
      .update(schema.anniversaryEntries)
      .set({ year: input.year, title: input.title, body: input.body, assetIds: input.assetIds ?? [], unlocksAt: input.unlocksAt ?? null })
      .where(and(eq(schema.anniversaryEntries.id, input.id), eq(schema.anniversaryEntries.weddingId, weddingId)))
      .returning();
    if (!row) throw notFound();
    return row;
  }
  const [row] = await db.insert(schema.anniversaryEntries).values({ weddingId, year: input.year, title: input.title, body: input.body, assetIds: input.assetIds ?? [], unlocksAt: input.unlocksAt ?? null }).returning();
  return row;
}

export async function deleteAnniversaryEntry(actor: Actor | null, weddingId: string, id: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "anniversary_mode" });
  const db = await getDb();
  await db.delete(schema.anniversaryEntries).where(and(eq(schema.anniversaryEntries.id, id), eq(schema.anniversaryEntries.weddingId, weddingId)));
}

/** Delivered by a cron: tells the couple when their capsule has just opened. Idempotent per capsule. */
export async function processMemoryNotifications(now = new Date()) {
  const db = await getDb();
  const capsules = await db
    .select({ c: schema.timeCapsules, w: schema.weddings })
    .from(schema.timeCapsules)
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.timeCapsules.weddingId))
    .where(and(lte(schema.timeCapsules.unlockAt, now), isNull(schema.weddings.archivedAt)));
  let sent = 0;
  for (const { c, w } of capsules) {
    const ent = await getEntitlements(w.id);
    if (!canUse(ent, "memory_notifications")) continue;
    const already = await db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.weddingId, w.id), eq(schema.notifications.template, "memory_unlocked")))
      .limit(1);
    if (already.length) continue;
    const members = await db.select({ userId: schema.weddingUsers.userId, email: schema.users.email }).from(schema.weddingUsers).innerJoin(schema.users, eq(schema.users.id, schema.weddingUsers.userId)).where(eq(schema.weddingUsers.weddingId, w.id));
    for (const m of members) {
      await enqueue({ template: "memory_unlocked", channel: "INAPP", weddingId: w.id, userId: m.userId, vars: { couple: w.title }, link: `/client/${w.id}/time-capsule` });
      await enqueue({ template: "memory_unlocked", channel: "EMAIL", weddingId: w.id, userId: m.userId, to: m.email, vars: { couple: w.title }, link: `/invite/${w.slug}` });
      sent++;
    }
    void c;
  }
  return sent;
}

export { forbidden };
