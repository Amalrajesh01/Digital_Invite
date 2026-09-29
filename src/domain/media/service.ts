import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { storage } from "@/lib/storage";
import { forbidden, invalid, notFound, uploadRejected } from "@/lib/errors";
import { type Actor, requireWeddingAccess } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { logError } from "@/domain/platform/logging";
import { type FeatureKey } from "@/domain/packages/features";
import type { LocalizedText } from "@/domain/doc/schema";
import { processImage } from "./image";
import { type MediaKind, sanitizeFilename, validateUpload } from "./validate";

export type MediaAsset = typeof schema.mediaAssets.$inferSelect;
export type MediaCategory = MediaAsset["category"];

export const MEDIA_CATEGORIES: { key: MediaCategory; label: string }[] = [
  { key: "BRIDE", label: "Bride" },
  { key: "GROOM", label: "Groom" },
  { key: "COUPLE", label: "Couple" },
  { key: "FAMILY", label: "Family" },
  { key: "GALLERY", label: "Gallery" },
  { key: "EVENT", label: "Events" },
  { key: "VENUE", label: "Venue" },
  { key: "VIDEO", label: "Videos" },
  { key: "MUSIC", label: "Music" },
  { key: "GUEST_UPLOAD", label: "Guest uploads" },
  { key: "MEMORY", label: "Memories" },
  { key: "OTHER", label: "Other" },
];

export interface ResolvedMedia {
  id: string;
  kind: MediaKind;
  mime: string;
  url: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  blur?: string;
  alt: LocalizedText;
  caption: LocalizedText;
  focal?: { x: number; y: number };
  durationSec?: number;
}

type Variants = Record<string, { key: string; width: number; height: number }>;

/** Same-origin URL that serves an asset (with access checks). R2 public buckets can bypass the app. */
export function assetUrl(assetId: string, variant: "xl" | "lg" | "md" | "sm" | "file" = "lg", version?: number): string {
  return `/api/media/${assetId}/${variant}${version ? `?v=${version}` : ""}`;
}

export function toResolved(a: MediaAsset): ResolvedMedia {
  const meta = a.metadata as { variants?: Variants; blur?: string };
  const isPublic = a.visibility === "PUBLIC" && a.moderation === "APPROVED";
  const pub = (v: "xl" | "lg" | "md" | "sm" | "file") => {
    const key = v === "file" ? a.storageKey : meta.variants?.[v]?.key;
    const direct = isPublic && key ? storage().publicUrl(key) : null;
    return direct ?? assetUrl(a.id, v, a.updatedAt.getTime());
  };
  const base: ResolvedMedia = {
    id: a.id,
    kind: a.kind,
    mime: a.mime,
    url: a.kind === "IMAGE" ? pub("lg") : pub("file"),
    alt: a.alt,
    caption: a.caption,
    width: a.width ?? undefined,
    height: a.height ?? undefined,
    blur: meta.blur,
    focal: a.focalX != null && a.focalY != null ? { x: a.focalX, y: a.focalY } : undefined,
    durationSec: a.durationSec ?? undefined,
  };
  if (a.kind === "IMAGE" && meta.variants) {
    base.srcSet = (["sm", "md", "lg", "xl"] as const)
      .filter((v) => meta.variants?.[v])
      .map((v) => `${pub(v)} ${meta.variants![v].width}w`)
      .join(", ");
    base.sizes = "(max-width: 768px) 100vw, 1200px";
  }
  return base;
}

// ── ingest ─────────────────────────────────────────────────────────────────
export interface IngestInput {
  weddingId: string;
  buffer: Buffer;
  filename: string;
  category: MediaCategory;
  allow: MediaKind[];
  source: "ADMIN" | "CLIENT" | "GUEST" | "SYSTEM";
  uploadedByUserId?: string | null;
  uploadedByGuestId?: string | null;
  moderation?: "PENDING" | "APPROVED" | "REJECTED";
  visibility?: "PUBLIC" | "PRIVATE";
  retention?: "TEMPORARY" | "PUBLISHED" | "PERMANENT";
  albumId?: string | null;
  title?: string;
  durationSec?: number | null;
  alt?: LocalizedText;
  caption?: LocalizedText;
}

/** Validate → process → store → record metadata. No authorisation here: callers own that. */
export async function ingestFile(input: IngestInput): Promise<MediaAsset> {
  const db = await getDb();
  const valid = validateUpload(input.buffer, { allow: input.allow });
  const id = randomUUID();
  const base = `w/${input.weddingId}/${id}`;
  const written: string[] = [];
  try {
    let storageKey: string;
    let width: number | null = null;
    let height: number | null = null;
    let sizeBytes = valid.size;
    const metadata: Record<string, unknown> = {};
    let mime = valid.mime;

    if (valid.kind === "IMAGE") {
      const img = await processImage(input.buffer);
      const variants: Record<string, { key: string; width: number; height: number }> = {};
      sizeBytes = 0;
      for (const v of img.variants) {
        const key = `${base}/${v.name}.webp`;
        await storage().put(key, v.data, "image/webp");
        written.push(key);
        variants[v.name] = { key, width: v.width, height: v.height };
        sizeBytes += v.bytes;
      }
      storageKey = variants.xl.key;
      width = img.width;
      height = img.height;
      metadata.variants = variants;
      metadata.blur = img.blur;
      mime = "image/webp";
    } else {
      storageKey = `${base}/file.${valid.ext}`;
      await storage().put(storageKey, input.buffer, valid.mime);
      written.push(storageKey);
    }

    const duration = input.durationSec && input.durationSec > 0 ? Math.min(input.durationSec, 3600) : null;
    const isGuest = input.source === "GUEST";
    const [row] = await db
      .insert(schema.mediaAssets)
      .values({
        id,
        weddingId: input.weddingId,
        category: input.category,
        kind: valid.kind,
        storageKey,
        mime,
        sizeBytes,
        width,
        height,
        durationSec: duration,
        filename: sanitizeFilename(input.filename),
        title: input.title ?? "",
        alt: input.alt ?? {},
        caption: input.caption ?? {},
        albumId: input.albumId ?? null,
        visibility: input.visibility ?? (isGuest ? "PRIVATE" : "PUBLIC"),
        moderation: input.moderation ?? (isGuest ? "PENDING" : "APPROVED"),
        retention: input.retention ?? (isGuest ? "TEMPORARY" : "PUBLISHED"),
        source: input.source,
        uploadedByGuestId: input.uploadedByGuestId ?? null,
        uploadedByUserId: input.uploadedByUserId ?? null,
        metadata,
      })
      .returning();
    return row;
  } catch (e) {
    // Roll back any half-written objects so a failed upload never leaves orphans.
    await Promise.allSettled(written.map((k) => storage().delete(k)));
    await logError("upload", e, { weddingId: input.weddingId, metadata: { filename: sanitizeFilename(input.filename), size: input.buffer.length } });
    throw e;
  }
}

export async function uploadAsUser(
  actor: Actor | null,
  weddingId: string,
  file: { buffer: Buffer; filename: string },
  opts: { category: MediaCategory; allow?: MediaKind[]; albumId?: string | null; durationSec?: number | null; title?: string },
): Promise<MediaAsset> {
  const scope = await requireWeddingAccess(actor, weddingId);
  if (opts.category === "VIDEO") await requireWeddingAccess(actor, weddingId, { feature: "gallery" });
  const allow = opts.allow ?? (opts.category === "MUSIC" ? ["AUDIO"] : opts.category === "VIDEO" ? ["VIDEO"] : ["IMAGE"]);
  if (allow.includes("AUDIO") && opts.category === "MUSIC") await requireWeddingAccess(actor, weddingId, { feature: "music" });
  const asset = await ingestFile({
    weddingId,
    buffer: file.buffer,
    filename: file.filename,
    category: opts.category,
    allow,
    source: scope.actor.kind === "client" ? "CLIENT" : "ADMIN",
    uploadedByUserId: scope.actor.kind === "system" ? null : scope.actor.userId,
    albumId: opts.albumId,
    durationSec: opts.durationSec,
    title: opts.title,
    retention: opts.category === "MEMORY" ? "PERMANENT" : "PUBLISHED",
  });
  await audit(scope.actor, "media.uploaded", { weddingId, entityType: "media", entityId: asset.id, metadata: { category: opts.category, kind: asset.kind } });
  return asset;
}

// ── read ───────────────────────────────────────────────────────────────────
export interface MediaFilter {
  category?: MediaCategory;
  kind?: MediaKind;
  moderation?: "PENDING" | "APPROVED" | "REJECTED";
  source?: "ADMIN" | "CLIENT" | "GUEST" | "SYSTEM";
  albumId?: string;
  q?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export async function listMedia(actor: Actor | null, weddingId: string, f: MediaFilter = {}) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  const conds = [eq(schema.mediaAssets.weddingId, weddingId)];
  if (!f.includeArchived) conds.push(isNull(schema.mediaAssets.archivedAt));
  if (f.category) conds.push(eq(schema.mediaAssets.category, f.category));
  if (f.kind) conds.push(eq(schema.mediaAssets.kind, f.kind));
  if (f.moderation) conds.push(eq(schema.mediaAssets.moderation, f.moderation));
  if (f.source) conds.push(eq(schema.mediaAssets.source, f.source));
  if (f.albumId) conds.push(eq(schema.mediaAssets.albumId, f.albumId));
  if (f.q?.trim()) {
    const like = `%${f.q.trim().replace(/[%_]/g, "")}%`;
    conds.push(or(ilike(schema.mediaAssets.filename, like), ilike(schema.mediaAssets.title, like))!);
  }
  return db
    .select()
    .from(schema.mediaAssets)
    .where(and(...conds))
    .orderBy(asc(schema.mediaAssets.sortOrder), desc(schema.mediaAssets.createdAt))
    .limit(Math.min(f.limit ?? 200, 500))
    .offset(f.offset ?? 0);
}

/** Resolve a set of asset ids (as found in an invitation document) to displayable media. */
export async function resolveMediaMap(weddingId: string, ids: string[], opts: { includePrivate?: boolean } = {}): Promise<Record<string, ResolvedMedia>> {
  const unique = [...new Set(ids)].filter((i) => /^[0-9a-f-]{36}$/i.test(i));
  if (!unique.length) return {};
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.mediaAssets)
    .where(and(eq(schema.mediaAssets.weddingId, weddingId), inArray(schema.mediaAssets.id, unique), isNull(schema.mediaAssets.archivedAt)));
  const out: Record<string, ResolvedMedia> = {};
  for (const a of rows) {
    if (!opts.includePrivate && !(a.visibility === "PUBLIC" && a.moderation === "APPROVED")) continue;
    out[a.id] = toResolved(a);
  }
  return out;
}

export function collectAssetIds(node: unknown, into = new Set<string>()): Set<string> {
  if (typeof node === "string") {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(node)) into.add(node);
  } else if (Array.isArray(node)) node.forEach((n) => collectAssetIds(n, into));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => collectAssetIds(v, into));
  return into;
}

// ── mutate ─────────────────────────────────────────────────────────────────
async function loadAsset(weddingId: string, assetId: string): Promise<MediaAsset> {
  const db = await getDb();
  const [a] = await db.select().from(schema.mediaAssets).where(and(eq(schema.mediaAssets.id, assetId), eq(schema.mediaAssets.weddingId, weddingId)));
  if (!a) throw notFound("That file could not be found.");
  return a;
}

export async function updateMedia(
  actor: Actor | null,
  weddingId: string,
  assetId: string,
  patch: { title?: string; alt?: LocalizedText; caption?: LocalizedText; category?: MediaCategory; focalX?: number | null; focalY?: number | null; visibility?: "PUBLIC" | "PRIVATE" },
) {
  await requireWeddingAccess(actor, weddingId);
  await loadAsset(weddingId, assetId);
  const db = await getDb();
  const [row] = await db
    .update(schema.mediaAssets)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(schema.mediaAssets.id, assetId), eq(schema.mediaAssets.weddingId, weddingId)))
    .returning();
  return row;
}

export async function deleteMedia(actor: Actor | null, weddingId: string, assetId: string) {
  const scope = await requireWeddingAccess(actor, weddingId);
  const a = await loadAsset(weddingId, assetId);
  if (scope.actor.kind === "client" && a.retention === "PERMANENT") throw forbidden("Permanent memories cannot be deleted from here. Please contact your designer.");
  const db = await getDb();
  const variants = (a.metadata as { variants?: Variants }).variants;
  const keys = variants ? Object.values(variants).map((v) => v.key) : [a.storageKey];
  await db.delete(schema.mediaAssets).where(and(eq(schema.mediaAssets.id, assetId), eq(schema.mediaAssets.weddingId, weddingId)));
  await Promise.allSettled(keys.map((k) => storage().delete(k)));
  await audit(scope.actor, "media.deleted", { weddingId, entityType: "media", entityId: assetId });
}

export async function rotateMedia(actor: Actor | null, weddingId: string, assetId: string, degrees: 90 | 180 | 270) {
  await requireWeddingAccess(actor, weddingId);
  const a = await loadAsset(weddingId, assetId);
  if (a.kind !== "IMAGE") throw invalid("Only photos can be rotated.");
  const src = await storage().get(a.storageKey);
  if (!src) throw notFound("The original file is unavailable.");
  const buf = Buffer.isBuffer(src.body) ? src.body : Buffer.from(await new Response(src.body as ReadableStream).arrayBuffer());
  const img = await processImage(buf, { rotate: degrees });
  const variants: Variants = {};
  for (const v of img.variants) {
    const key = `w/${weddingId}/${a.id}/${v.name}.webp`;
    await storage().put(key, v.data, "image/webp");
    variants[v.name] = { key, width: v.width, height: v.height };
  }
  const db = await getDb();
  const [row] = await db
    .update(schema.mediaAssets)
    .set({ width: img.width, height: img.height, metadata: { variants, blur: img.blur }, updatedAt: new Date() })
    .where(eq(schema.mediaAssets.id, assetId))
    .returning();
  return row;
}

/** Replace a photo's pixels (used after the browser crop tool) while keeping its id — so every place that uses it updates. */
export async function replaceImage(actor: Actor | null, weddingId: string, assetId: string, buffer: Buffer) {
  await requireWeddingAccess(actor, weddingId);
  const a = await loadAsset(weddingId, assetId);
  if (a.kind !== "IMAGE") throw invalid("Only photos can be replaced.");
  const valid = validateUpload(buffer, { allow: ["IMAGE"] });
  void valid;
  const img = await processImage(buffer);
  const variants: Variants = {};
  for (const v of img.variants) {
    const key = `w/${weddingId}/${a.id}/${v.name}.webp`;
    await storage().put(key, v.data, "image/webp");
    variants[v.name] = { key, width: v.width, height: v.height };
  }
  const db = await getDb();
  const [row] = await db
    .update(schema.mediaAssets)
    .set({ width: img.width, height: img.height, metadata: { variants, blur: img.blur }, updatedAt: new Date() })
    .where(eq(schema.mediaAssets.id, assetId))
    .returning();
  return row;
}

export async function reorderMedia(actor: Actor | null, weddingId: string, orderedIds: string[]) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(schema.mediaAssets)
        .set({ sortOrder: i })
        .where(and(eq(schema.mediaAssets.id, orderedIds[i]), eq(schema.mediaAssets.weddingId, weddingId)));
    }
  });
}

export async function moderateMedia(actor: Actor | null, weddingId: string, assetId: string, decision: "APPROVED" | "REJECTED" | "PENDING", feature?: FeatureKey) {
  const scope = await requireWeddingAccess(actor, weddingId, feature ? { feature } : {});
  const a = await loadAsset(weddingId, assetId);
  const db = await getDb();
  const approved = decision === "APPROVED";
  const [row] = await db
    .update(schema.mediaAssets)
    .set({
      moderation: decision,
      // Only approved guest media becomes publicly viewable, and approval promotes it out of "temporary".
      visibility: approved ? "PUBLIC" : "PRIVATE",
      retention: approved && a.retention === "TEMPORARY" ? "PUBLISHED" : a.retention,
      moderatedAt: new Date(),
      moderatedBy: scope.actor.kind === "system" ? null : scope.actor.userId,
      updatedAt: new Date(),
    })
    .where(eq(schema.mediaAssets.id, assetId))
    .returning();
  await audit(scope.actor, `media.${decision.toLowerCase()}`, { weddingId, entityType: "media", entityId: assetId });
  return row;
}

/** Make any asset part of the permanent memory (never auto-deleted). */
export async function markPermanent(actor: Actor | null, weddingId: string, assetId: string) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  await db.update(schema.mediaAssets).set({ retention: "PERMANENT", updatedAt: new Date() }).where(and(eq(schema.mediaAssets.id, assetId), eq(schema.mediaAssets.weddingId, weddingId)));
}

// ── albums & gallery ───────────────────────────────────────────────────────
export async function listAlbums(actor: Actor | null, weddingId: string) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  const albums = await db.select().from(schema.galleryAlbums).where(eq(schema.galleryAlbums.weddingId, weddingId)).orderBy(asc(schema.galleryAlbums.sortOrder), asc(schema.galleryAlbums.createdAt));
  const items = await db.select().from(schema.galleryItems).where(eq(schema.galleryItems.weddingId, weddingId)).orderBy(asc(schema.galleryItems.sortOrder));
  return albums.map((a) => ({ ...a, items: items.filter((i) => i.albumId === a.id) }));
}

export async function saveAlbum(
  actor: Actor | null,
  weddingId: string,
  input: { id?: string; title: LocalizedText; kind?: "OFFICIAL" | "GUEST" | "LIVE" | "MEMORY" | "EVENT"; isPublic?: boolean; coverAssetId?: string | null },
) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  if (input.id) {
    const [row] = await db
      .update(schema.galleryAlbums)
      .set({ title: input.title, kind: input.kind, isPublic: input.isPublic, coverAssetId: input.coverAssetId, updatedAt: new Date() })
      .where(and(eq(schema.galleryAlbums.id, input.id), eq(schema.galleryAlbums.weddingId, weddingId)))
      .returning();
    if (!row) throw notFound("Album not found.");
    return row;
  }
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.galleryAlbums).where(eq(schema.galleryAlbums.weddingId, weddingId));
  const [row] = await db
    .insert(schema.galleryAlbums)
    .values({ weddingId, title: input.title, kind: input.kind ?? "OFFICIAL", isPublic: input.isPublic ?? true, coverAssetId: input.coverAssetId ?? null, sortOrder: n })
    .returning();
  return row;
}

export async function deleteAlbum(actor: Actor | null, weddingId: string, albumId: string) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  await db.delete(schema.galleryAlbums).where(and(eq(schema.galleryAlbums.id, albumId), eq(schema.galleryAlbums.weddingId, weddingId)));
}

export async function addToAlbum(actor: Actor | null, weddingId: string, albumId: string, assetIds: string[]) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  const [album] = await db.select().from(schema.galleryAlbums).where(and(eq(schema.galleryAlbums.id, albumId), eq(schema.galleryAlbums.weddingId, weddingId)));
  if (!album) throw notFound("Album not found.");
  const assets = await db
    .select({ id: schema.mediaAssets.id })
    .from(schema.mediaAssets)
    .where(and(eq(schema.mediaAssets.weddingId, weddingId), inArray(schema.mediaAssets.id, assetIds), eq(schema.mediaAssets.kind, "IMAGE")));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.galleryItems).where(eq(schema.galleryItems.albumId, albumId));
  let order = n;
  for (const a of assets) {
    await db.insert(schema.galleryItems).values({ weddingId, albumId, assetId: a.id, sortOrder: order++ }).onConflictDoNothing();
  }
  if (!album.coverAssetId && assets[0]) await db.update(schema.galleryAlbums).set({ coverAssetId: assets[0].id }).where(eq(schema.galleryAlbums.id, albumId));
}

export async function removeFromAlbum(actor: Actor | null, weddingId: string, albumId: string, assetId: string) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  await db.delete(schema.galleryItems).where(and(eq(schema.galleryItems.weddingId, weddingId), eq(schema.galleryItems.albumId, albumId), eq(schema.galleryItems.assetId, assetId)));
}

export async function reorderAlbumItems(actor: Actor | null, weddingId: string, albumId: string, orderedAssetIds: string[]) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedAssetIds.length; i++) {
      await tx
        .update(schema.galleryItems)
        .set({ sortOrder: i })
        .where(and(eq(schema.galleryItems.weddingId, weddingId), eq(schema.galleryItems.albumId, albumId), eq(schema.galleryItems.assetId, orderedAssetIds[i])));
    }
  });
}

export async function setItemCaption(actor: Actor | null, weddingId: string, albumId: string, assetId: string, caption: LocalizedText) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  await db
    .update(schema.galleryItems)
    .set({ caption })
    .where(and(eq(schema.galleryItems.weddingId, weddingId), eq(schema.galleryItems.albumId, albumId), eq(schema.galleryItems.assetId, assetId)));
}

/** Public gallery for the invitation: only public albums, only approved public images. */
export async function loadPublicGallery(weddingId: string) {
  const db = await getDb();
  const albums = await db
    .select()
    .from(schema.galleryAlbums)
    .where(and(eq(schema.galleryAlbums.weddingId, weddingId), eq(schema.galleryAlbums.isPublic, true)))
    .orderBy(asc(schema.galleryAlbums.sortOrder));
  if (!albums.length) return [];
  const items = await db
    .select({ item: schema.galleryItems, asset: schema.mediaAssets })
    .from(schema.galleryItems)
    .innerJoin(schema.mediaAssets, eq(schema.mediaAssets.id, schema.galleryItems.assetId))
    .where(
      and(
        eq(schema.galleryItems.weddingId, weddingId),
        inArray(schema.galleryItems.albumId, albums.map((a) => a.id)),
        eq(schema.mediaAssets.visibility, "PUBLIC"),
        eq(schema.mediaAssets.moderation, "APPROVED"),
        isNull(schema.mediaAssets.archivedAt),
      ),
    )
    .orderBy(asc(schema.galleryItems.sortOrder));
  return albums
    .map((al) => ({
      id: al.id,
      kind: al.kind,
      title: al.title,
      cover: al.coverAssetId,
      items: items
        .filter((i) => i.item.albumId === al.id)
        .map((i) => ({ ...toResolved(i.asset), caption: Object.keys(i.item.caption).length ? i.item.caption : i.asset.caption })),
    }))
    .filter((al) => al.items.length > 0);
}

// ── music ──────────────────────────────────────────────────────────────────
export async function listTracks(actor: Actor | null, weddingId: string) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  return db.select().from(schema.musicTracks).where(eq(schema.musicTracks.weddingId, weddingId)).orderBy(asc(schema.musicTracks.sortOrder));
}

export async function saveTrack(
  actor: Actor | null,
  weddingId: string,
  input: { id?: string; assetId?: string; title: string; artist?: string; coverAssetId?: string | null; isPrimary?: boolean; inPlaylist?: boolean },
) {
  await requireWeddingAccess(actor, weddingId, { feature: "music" });
  const db = await getDb();
  if (!input.title.trim()) throw invalid("Give the song a title.", { title: "Required" });
  return db.transaction(async (tx) => {
    if (input.isPrimary) await tx.update(schema.musicTracks).set({ isPrimary: false }).where(eq(schema.musicTracks.weddingId, weddingId));
    if (input.id) {
      const [row] = await tx
        .update(schema.musicTracks)
        .set({ title: input.title, artist: input.artist ?? "", coverAssetId: input.coverAssetId ?? null, isPrimary: input.isPrimary, inPlaylist: input.inPlaylist })
        .where(and(eq(schema.musicTracks.id, input.id), eq(schema.musicTracks.weddingId, weddingId)))
        .returning();
      if (!row) throw notFound();
      return row;
    }
    if (!input.assetId) throw invalid("Upload an audio file first.");
    const [asset] = await tx
      .select({ id: schema.mediaAssets.id, kind: schema.mediaAssets.kind })
      .from(schema.mediaAssets)
      .where(and(eq(schema.mediaAssets.id, input.assetId), eq(schema.mediaAssets.weddingId, weddingId)));
    if (!asset || asset.kind !== "AUDIO") throw invalid("That file is not an audio track.");
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(schema.musicTracks).where(eq(schema.musicTracks.weddingId, weddingId));
    const [row] = await tx
      .insert(schema.musicTracks)
      .values({ weddingId, assetId: input.assetId, title: input.title, artist: input.artist ?? "", coverAssetId: input.coverAssetId ?? null, isPrimary: input.isPrimary ?? n === 0, inPlaylist: input.inPlaylist ?? false, sortOrder: n })
      .returning();
    return row;
  });
}

export async function deleteTrack(actor: Actor | null, weddingId: string, trackId: string) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  await db.delete(schema.musicTracks).where(and(eq(schema.musicTracks.id, trackId), eq(schema.musicTracks.weddingId, weddingId)));
}

export interface PublicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover?: ResolvedMedia;
  isPrimary: boolean;
  inPlaylist: boolean;
}

export async function loadPublicTracks(weddingId: string): Promise<PublicTrack[]> {
  const db = await getDb();
  const rows = await db
    .select({ t: schema.musicTracks, a: schema.mediaAssets })
    .from(schema.musicTracks)
    .innerJoin(schema.mediaAssets, eq(schema.mediaAssets.id, schema.musicTracks.assetId))
    .where(eq(schema.musicTracks.weddingId, weddingId))
    .orderBy(asc(schema.musicTracks.sortOrder));
  const covers = await resolveMediaMap(weddingId, rows.map((r) => r.t.coverAssetId).filter(Boolean) as string[]);
  return rows.map((r) => ({
    id: r.t.id,
    title: r.t.title,
    artist: r.t.artist,
    url: toResolved(r.a).url,
    cover: r.t.coverAssetId ? covers[r.t.coverAssetId] : undefined,
    isPrimary: r.t.isPrimary,
    inPlaylist: r.t.inPlaylist,
  }));
}

export { uploadRejected };
