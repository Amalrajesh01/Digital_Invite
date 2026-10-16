import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, asc, eq, lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { env } from "@/lib/env";
import { storage } from "@/lib/storage";
import { brand } from "@/lib/brand";
import { conflict, forbidden, invalid, notFound } from "@/lib/errors";
import { rateLimit } from "@/domain/platform/rate-limit";
import { audit } from "@/domain/audit/audit";
import type { Actor } from "@/domain/auth/access";
import { emptyDoc, LoveDoc, type InvitationDoc } from "@/domain/doc/schema";
import { ensureDesignLibrary } from "@/domain/design/service";
import { ingestFile, deleteMedia, toResolved, type ResolvedMedia } from "@/domain/media/service";
import { publishWedding } from "@/domain/wedding/service";
import { loadPreviewInvitation } from "@/domain/wedding/public";
import { LOVE_EXPERIENCE_INFO, MOOD_THEME, OCCASION_INFO, type LoveOccasion } from "@/domain/love/constants";

/**
 * “For My Love” gifts made on the public site. A gift is an ordinary invitation row (so photographs, publishing and
 * versions all work) plus a `gifts` row that holds the one thing a stranger-made gift needs: a secret that lets its
 * maker — and only its maker — change, pause or delete it. No account, no password; the secret travels in the maker's
 * own link (after a `#`, so it never reaches a server log) and only its hash is stored.
 *
 * Privacy rules, in one place:
 *   • the gift's address is 80 random bits — it cannot be guessed, and it is never indexed (see `inviteMetadata`);
 *   • photographs are private until the gift is published, and can be viewed before then only through a signed preview;
 *   • the maker can pause the link (it stops working at once) or delete the gift with every photograph, any time;
 *   • a gift nobody sends to us is deleted after 14 days; a deleted gift leaves nothing behind but a count.
 */
const SYSTEM: Actor = { kind: "system" };
export const MAX_PHOTOS = 12;
export const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const DRAFT_DAYS = 14;
export const SUBMITTED_DAYS = 60;

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const days = (n: number) => new Date(Date.now() + n * 86_400_000);

const SLUG_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
function newSlug(): string {
  let s = "";
  for (let i = 0; i < 16; i++) s += SLUG_CHARS[randomInt(SLUG_CHARS.length)];
  return s; // 31^16 ≈ 2^79
}

/** A token that lets the browser show an unpublished gift (and only that gift) in the maker's preview. */
export function giftViewToken(weddingId: string): string {
  return createHmac("sha256", env.appSecret).update(`gift-view:${weddingId}`).digest("hex").slice(0, 40);
}
export function verifyGiftViewToken(weddingId: string, token: string | null | undefined): boolean {
  return !!token && safeEq(token, giftViewToken(weddingId));
}

export const giftPublicUrl = (slug: string) => `${env.appUrl}/invite/${slug}`;
export const giftRef = (giftId: string) => giftId.slice(0, 8).toUpperCase();

// ── access ─────────────────────────────────────────────────────────────────
async function load(giftId: string) {
  const db = await getDb();
  if (!/^[0-9a-f-]{36}$/i.test(giftId)) throw notFound("We could not find that gift.");
  const [row] = await db
    .select({ gift: schema.gifts, wedding: schema.weddings })
    .from(schema.gifts)
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.gifts.weddingId))
    .where(eq(schema.gifts.id, giftId));
  if (!row) throw notFound("We could not find that gift.");
  return row;
}

/** The gift, if — and only if — the secret is right. A wrong secret looks exactly like a gift that does not exist. */
export async function openGift(giftId: string, token: string | null | undefined) {
  const row = await load(giftId);
  if (!token || !safeEq(hash(token), row.gift.editTokenHash)) throw notFound("We could not find that gift.");
  return row;
}

// ── create ─────────────────────────────────────────────────────────────────
export async function createGift(input: { occasion: LoveOccasion; ipKey: string }) {
  await rateLimit(`gift-new:${input.ipKey}`, 10, 3600);
  const db = await getDb();
  const info = OCCASION_INFO[input.occasion];
  const templateSlug = LOVE_EXPERIENCE_INFO[info.experience].slug;
  let [tpl] = await db.select().from(schema.templates).where(eq(schema.templates.slug, templateSlug));
  let [thm] = await db.select().from(schema.themes).where(eq(schema.themes.slug, MOOD_THEME[info.mood]));
  if (!tpl || !thm) {
    await ensureDesignLibrary();
    [tpl] = await db.select().from(schema.templates).where(eq(schema.templates.slug, templateSlug));
    [thm] = await db.select().from(schema.themes).where(eq(schema.themes.slug, MOOD_THEME[info.mood]));
  }
  if (!tpl || !thm) throw invalid("We could not set up your gift just now. Please try again in a moment.");

  const doc = emptyDoc();
  doc.eventType = "love_gift";
  doc.opening = { ...doc.opening, variant: "none", celebration: "off" };
  doc.love = LoveDoc.parse({ experience: info.experience, occasion: input.occasion, mood: info.mood });
  doc.sections = [];

  const token = randomBytes(24).toString("base64url"); // 192 bits
  const [w] = await db
    .insert(schema.weddings)
    .values({ slug: newSlug(), title: "Love gift", packageKey: "ESSENTIAL", customerClass: "PAID_ESSENTIAL", templateId: tpl.id, themeId: thm.id, autoLifecycle: false, draftDoc: doc })
    .returning();
  const [g] = await db.insert(schema.gifts).values({ weddingId: w.id, editTokenHash: hash(token), expiresAt: days(DRAFT_DAYS) }).returning();
  await audit(SYSTEM, "gift.created", { weddingId: w.id, entityType: "gift", entityId: g.id, metadata: { occasion: input.occasion } });
  return { id: g.id, token, weddingId: w.id, viewToken: giftViewToken(w.id) };
}

// ── read ───────────────────────────────────────────────────────────────────
/** Adds the preview signature to a media URL, so the maker's own browser can see a photograph that is not public yet. */
export function signedMedia(m: ResolvedMedia, weddingId: string): ResolvedMedia {
  const g = giftViewToken(weddingId);
  const add = (u: string) => (u.startsWith("/api/media/") ? `${u}${u.includes("?") ? "&" : "?"}g=${g}` : u);
  return { ...m, url: add(m.url), srcSet: m.srcSet?.replace(/(\/api\/media\/[^\s,]+)/g, (u) => add(u)) };
}

export async function getGiftForOwner(giftId: string, token: string) {
  const { gift, wedding } = await openGift(giftId, token);
  const db = await getDb();
  const assets = await db.select().from(schema.mediaAssets).where(and(eq(schema.mediaAssets.weddingId, wedding.id), eq(schema.mediaAssets.kind, "IMAGE"))).orderBy(asc(schema.mediaAssets.createdAt));
  const [track] = await db.select().from(schema.musicTracks).where(eq(schema.musicTracks.weddingId, wedding.id)).limit(1);
  return {
    id: gift.id,
    ref: giftRef(gift.id),
    state: gift.state,
    love: wedding.draftDoc.love,
    doc: wedding.draftDoc,
    photos: assets.map((a) => signedMedia(toResolved(a), wedding.id)),
    music: track ? { id: track.id, title: track.title } : null,
    viewToken: giftViewToken(wedding.id),
    weddingId: wedding.id,
    publicUrl: gift.state === "LIVE" || gift.state === "PAUSED" ? giftPublicUrl(wedding.slug) : null,
    expiresAt: gift.expiresAt,
    contact: { name: gift.contactName, phone: gift.contactPhone },
    published: !!wedding.publishedVersionId,
    status: wedding.status,
  };
}

// ── write ──────────────────────────────────────────────────────────────────
const MAX_TEXT = 6000;
function assertSmall(love: LoveDoc) {
  const walk = (n: unknown): void => {
    if (typeof n === "string") { if (n.length > MAX_TEXT) throw invalid("One of your texts is too long. Please shorten it a little."); }
    else if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === "object") Object.values(n).forEach(walk);
  };
  walk(love);
  if (JSON.stringify(love).length > 60_000) throw invalid("Your gift has a lot of writing in it. Please shorten it a little.");
}

export async function saveGift(giftId: string, token: string, input: unknown) {
  await rateLimit(`gift-save:${giftId}`, 600, 3600);
  const { gift, wedding } = await openGift(giftId, token);
  const parsed = LoveDoc.safeParse(input);
  if (!parsed.success) throw invalid("Something in your gift could not be saved. Please check it and try again.");
  const love = parsed.data;
  assertSmall(love);
  love.reply.whatsapp = love.reply.whatsapp.replace(/[^\d]/g, "").slice(0, 15);
  if (!love.reply.enabled) love.reply.whatsapp = "";

  const db = await getDb();
  // Only photographs that really belong to this gift may be named in it.
  const owned = new Set((await db.select({ id: schema.mediaAssets.id }).from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, wedding.id))).map((r) => r.id));
  love.photos = love.photos.filter((id) => owned.has(id));
  love.memories = love.memories.map((m) => ({ ...m, photo: m.photo && owned.has(m.photo) ? m.photo : undefined }));

  // The experience and the mood pick the template and the colours.
  const slug = LOVE_EXPERIENCE_INFO[love.experience].slug;
  const [tpl] = await db.select({ id: schema.templates.id }).from(schema.templates).where(eq(schema.templates.slug, slug));
  const [thm] = await db.select({ id: schema.themes.id }).from(schema.themes).where(eq(schema.themes.slug, MOOD_THEME[love.mood]));
  const doc: InvitationDoc = { ...wedding.draftDoc, eventType: "love_gift", love, sections: [] };
  await db
    .update(schema.weddings)
    .set({
      draftDoc: doc, draftUpdatedAt: new Date(), updatedAt: new Date(), title: love.to.trim() ? `For ${love.to.trim()}` : "Love gift",
      weddingDate: love.date || null, defaultLocale: love.language === "ml" ? "ml" : "en", templateId: tpl?.id ?? wedding.templateId, themeId: thm?.id ?? wedding.themeId,
    })
    .where(eq(schema.weddings.id, wedding.id));
  await db.update(schema.gifts).set({ updatedAt: new Date() }).where(eq(schema.gifts.id, gift.id));
  return { doc, viewToken: giftViewToken(wedding.id) };
}

export async function addGiftPhoto(giftId: string, token: string, file: { buffer: Buffer; filename: string }) {
  await rateLimit(`gift-photo:${giftId}`, 60, 3600);
  const { wedding } = await openGift(giftId, token);
  if (file.buffer.length > MAX_PHOTO_BYTES) throw invalid("That photograph is too large. Please choose one under 12 MB.");
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.mediaAssets).where(and(eq(schema.mediaAssets.weddingId, wedding.id), eq(schema.mediaAssets.kind, "IMAGE")));
  if (n >= MAX_PHOTOS) throw invalid(`A gift can hold up to ${MAX_PHOTOS} photographs. Remove one to add another.`);
  const row = await ingestFile({ weddingId: wedding.id, buffer: file.buffer, filename: file.filename, category: "COUPLE", allow: ["IMAGE"], source: "SYSTEM", visibility: "PUBLIC", retention: "PUBLISHED" });
  return signedMedia(toResolved(row), wedding.id);
}

export async function removeGiftPhoto(giftId: string, token: string, assetId: string) {
  const { wedding } = await openGift(giftId, token);
  const doc = structuredClone(wedding.draftDoc);
  doc.love.photos = doc.love.photos.filter((id) => id !== assetId);
  doc.love.memories = doc.love.memories.map((m) => (m.photo === assetId ? { ...m, photo: undefined } : m));
  const db = await getDb();
  await db.update(schema.weddings).set({ draftDoc: doc, draftUpdatedAt: new Date() }).where(eq(schema.weddings.id, wedding.id));
  await deleteMedia(SYSTEM, wedding.id, assetId);
  return doc.love;
}

export async function setGiftMusic(giftId: string, token: string, file: { buffer: Buffer; filename: string } | null) {
  await rateLimit(`gift-music:${giftId}`, 20, 3600);
  const { wedding } = await openGift(giftId, token);
  const db = await getDb();
  // one track per gift: replacing it removes the old file too
  const old = await db.select().from(schema.musicTracks).where(eq(schema.musicTracks.weddingId, wedding.id));
  for (const t of old) await deleteMedia(SYSTEM, wedding.id, t.assetId);
  if (!file) return null;
  if (file.buffer.length > MAX_AUDIO_BYTES) throw invalid("That audio file is too large. Please choose one under 10 MB.");
  const asset = await ingestFile({ weddingId: wedding.id, buffer: file.buffer, filename: file.filename, category: "MUSIC", allow: ["AUDIO"], source: "SYSTEM", visibility: "PUBLIC", retention: "PUBLISHED" });
  const title = file.filename.replace(/\.[a-z0-9]+$/i, "").slice(0, 80) || "Our song";
  const [track] = await db.insert(schema.musicTracks).values({ weddingId: wedding.id, assetId: asset.id, title, isPrimary: true, inPlaylist: false, sortOrder: 0 }).returning();
  return { id: track.id, title: track.title };
}

/** The maker hands the gift to us to publish. We keep it for 60 days while we talk. */
export async function submitGift(giftId: string, token: string, contact: { name: string; phone: string }) {
  await rateLimit(`gift-submit:${giftId}`, 10, 3600);
  const { gift, wedding } = await openGift(giftId, token);
  const name = contact.name.trim().slice(0, 80);
  const phone = contact.phone.replace(/[^\d+]/g, "").slice(0, 16);
  if (!name) throw invalid("Please tell us your name.", { name: "Required" });
  if (phone.replace(/\D/g, "").length < 8) throw invalid("Please enter the WhatsApp number we can reach you on.", { phone: "Enter a valid number" });
  const db = await getDb();
  const issues = (await import("@/domain/wedding/doc-tools")).publishReadiness({ doc: wedding.draftDoc, slug: wedding.slug, weddingDate: wedding.weddingDate, secondaryLocale: null, hasTemplate: true, hasTheme: true, galleryCount: 0, hasMusic: false }).filter((i) => i.level === "error");
  if (issues.length) throw invalid(issues[0].message);
  await db.update(schema.gifts).set({ state: gift.state === "DRAFT" ? "SUBMITTED" : gift.state, contactName: name, contactPhone: phone, submittedAt: new Date(), expiresAt: gift.state === "DRAFT" ? days(SUBMITTED_DAYS) : gift.expiresAt, updatedAt: new Date() }).where(eq(schema.gifts.id, gift.id));
  const love = wedding.draftDoc.love;
  await db.insert(schema.leads).values({ kind: "GIFT", name, phone, occasion: "for-my-love", templateSlug: LOVE_EXPERIENCE_INFO[love.experience].slug, eventDate: love.date || null, message: `Love gift (${love.occasion}) — ref ${giftRef(gift.id)}`, source: "gift-builder", weddingId: wedding.id });
  await audit(SYSTEM, "gift.submitted", { weddingId: wedding.id, entityType: "gift", entityId: gift.id });
  const text = `Hi, I made a love gift on your site. My reference is ${giftRef(gift.id)}. Please help me publish it.`;
  return { ref: giftRef(gift.id), whatsapp: `https://wa.me/${brand.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}` };
}

// ── the maker's controls ───────────────────────────────────────────────────
export async function setGiftLive(giftId: string, token: string, action: "pause" | "resume" | "update") {
  const { gift, wedding } = await openGift(giftId, token);
  const db = await getDb();
  if (gift.state === "DRAFT" || gift.state === "SUBMITTED") throw conflict("Your gift is not published yet.");
  if (action === "pause") {
    await db.update(schema.weddings).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(schema.weddings.id, wedding.id));
    await db.update(schema.gifts).set({ state: "PAUSED", updatedAt: new Date() }).where(eq(schema.gifts.id, gift.id));
  } else if (action === "resume") {
    if (!wedding.publishedVersionId) throw conflict("Your gift is not published yet.");
    await db.update(schema.weddings).set({ status: "PUBLISHED", updatedAt: new Date() }).where(eq(schema.weddings.id, wedding.id));
    await db.update(schema.gifts).set({ state: "LIVE", updatedAt: new Date() }).where(eq(schema.gifts.id, gift.id));
  } else {
    // publishing the latest changes never switches a paused link back on
    await publishWedding(SYSTEM, wedding.id, { label: "Updated by its maker" });
    await db.update(schema.weddings).set({ status: gift.state === "PAUSED" ? "DRAFT" : "PUBLISHED" }).where(eq(schema.weddings.id, wedding.id));
  }
  await audit(SYSTEM, `gift.${action}`, { weddingId: wedding.id, entityType: "gift", entityId: gift.id });
}

/** Removes every trace: photographs from storage, then the invitation row (which takes the gift, the tracks and the versions with it). */
export async function purgeGiftWedding(weddingId: string) {
  const db = await getDb();
  const assets = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, weddingId));
  const keys = new Set<string>();
  for (const a of assets) {
    keys.add(a.storageKey);
    const variants = (a.metadata as { variants?: Record<string, { key: string }> }).variants;
    if (variants) for (const v of Object.values(variants)) keys.add(v.key);
  }
  await Promise.allSettled([...keys].map((k) => storage().delete(k)));
  await db.update(schema.leads).set({ weddingId: null }).where(eq(schema.leads.weddingId, weddingId));
  await db.delete(schema.weddings).where(eq(schema.weddings.id, weddingId));
}

export async function deleteGift(giftId: string, token: string) {
  const { gift, wedding } = await openGift(giftId, token);
  await purgeGiftWedding(wedding.id);
  await audit(SYSTEM, "gift.deleted", { entityType: "gift", entityId: gift.id });
}

/** Run daily: gifts that were started and never sent to us are deleted with their photographs. */
export async function expireGifts(): Promise<number> {
  const db = await getDb();
  const stale = await db.select({ id: schema.gifts.id, weddingId: schema.gifts.weddingId }).from(schema.gifts).where(and(eq(schema.gifts.state, "DRAFT"), lt(schema.gifts.expiresAt, new Date())));
  for (const g of stale) await purgeGiftWedding(g.weddingId);
  const old = await db.select({ id: schema.gifts.id, weddingId: schema.gifts.weddingId }).from(schema.gifts).where(and(eq(schema.gifts.state, "SUBMITTED"), lt(schema.gifts.expiresAt, new Date())));
  for (const g of old) await purgeGiftWedding(g.weddingId);
  if (stale.length + old.length) await audit(SYSTEM, "gift.expired", { metadata: { count: stale.length + old.length } });
  return stale.length + old.length;
}

// ── the studio ─────────────────────────────────────────────────────────────
export async function listGiftsForAdmin(actor: Actor | null) {
  if (!actor || actor.kind !== "admin") throw forbidden("Only the platform owner can do this.");
  const db = await getDb();
  return db
    .select({ gift: schema.gifts, slug: schema.weddings.slug, title: schema.weddings.title, status: schema.weddings.status, doc: schema.weddings.draftDoc })
    .from(schema.gifts)
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.gifts.weddingId))
    .orderBy(sql`${schema.gifts.createdAt} desc`)
    .limit(200);
}

export async function adminPublishGift(actor: Actor | null, giftId: string) {
  if (!actor || actor.kind !== "admin") throw forbidden("Only the platform owner can do this.");
  const { gift, wedding } = await load(giftId);
  await publishWedding(actor, wedding.id, { label: "Gift published" });
  const db = await getDb();
  await db.update(schema.weddings).set({ status: "PUBLISHED" }).where(eq(schema.weddings.id, wedding.id));
  await db.update(schema.gifts).set({ state: "LIVE", publishedAt: new Date(), expiresAt: null, updatedAt: new Date() }).where(eq(schema.gifts.id, gift.id));
  await audit(actor, "gift.published", { weddingId: wedding.id, entityType: "gift", entityId: gift.id });
  return giftPublicUrl(wedding.slug);
}

export async function adminDeleteGift(actor: Actor | null, giftId: string) {
  if (!actor || actor.kind !== "admin") throw forbidden("Only the platform owner can do this.");
  const { gift, wedding } = await load(giftId);
  await purgeGiftWedding(wedding.id);
  await audit(actor, "gift.deleted", { entityType: "gift", entityId: gift.id });
}

export async function adminPauseGift(actor: Actor | null, giftId: string) {
  if (!actor || actor.kind !== "admin") throw forbidden("Only the platform owner can do this.");
  const { gift, wedding } = await load(giftId);
  const db = await getDb();
  await db.update(schema.weddings).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(schema.weddings.id, wedding.id));
  await db.update(schema.gifts).set({ state: "PAUSED", updatedAt: new Date() }).where(eq(schema.gifts.id, gift.id));
  await audit(actor, "gift.paused", { weddingId: wedding.id, entityType: "gift", entityId: gift.id });
}

/** Is this media file part of a gift? (Gifts' photographs are never cached publicly.) */
export async function isGiftWedding(weddingId: string): Promise<boolean> {
  const db = await getDb();
  const [g] = await db.select({ id: schema.gifts.id }).from(schema.gifts).where(eq(schema.gifts.weddingId, weddingId)).limit(1);
  return !!g;
}


/** The gift exactly as its recipient would see it, for its maker — reachable only with the signed preview token. */
export async function loadGiftPreview(giftId: string, viewToken: string | null | undefined) {
  const { wedding } = await load(giftId);
  if (!verifyGiftViewToken(wedding.id, viewToken)) throw notFound("We could not find that gift.");
  const view = await loadPreviewInvitation(wedding.id, { asStatus: "PUBLISHED" });
  if (!view) throw notFound("We could not find that gift.");
  const g = giftViewToken(wedding.id);
  const sign = (u: string) => (u.startsWith("/api/media/") ? `${u}${u.includes("?") ? "&" : "?"}g=${g}` : u);
  const media: typeof view.media = {};
  for (const [id, m] of Object.entries(view.media)) media[id] = signedMedia(m, wedding.id);
  return { ...view, media, tracks: view.tracks.map((t) => ({ ...t, url: sign(t.url) })) };
}
