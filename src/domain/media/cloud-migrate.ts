import { createHash } from "node:crypto";
import { and, asc, eq, inArray, notInArray, sql } from "drizzle-orm";
import sharp from "sharp";
import { getDb, schema, type Db } from "@/db/client";
import { env } from "@/lib/env";
import { probeImage, uploadImage } from "@/lib/cloudinary";
import { storage } from "@/lib/storage";
import { cloudPublicId, type CloudMeta, type Placement, qualifies, sharedVariants } from "./cloud";

/**
 * Moves existing photographs from the STORAGE_DRIVER store to Cloudinary, one invitation at a time.
 *
 * Guarantees (each is covered by tests/cloudinary-migration.test.ts):
 *  - Invitations in the exclusion list are never read for migration and never written: three independent checks (the candidate query,
 *    a guard in migrateWedding, and the UPDATE itself), and a before/after fingerprint of their rows is part of the report.
 *  - A row is repointed only after Cloudinary reports exactly the bytes and size that were sent AND the image is served back.
 *  - Nothing is deleted. The row keeps its old location in metadata.legacy, so rollbackWedding() can restore it exactly.
 *  - Re-running is harmless: migrated rows are skipped, and an upload interrupted before its row was updated is found again by its
 *    public id (never overwritten, never duplicated) and then completed.
 */

/** People whose invitations are never migrated. Matched against the real records (slug, title, contact, couple names in the draft and every
 *  published version, members, orders). A false match only skips an invitation; it can never cause one to be moved. */
export const PROTECTED_NAMES = ["surej", "akshaya"];

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const protectedPattern = () => [...PROTECTED_NAMES, ...env.cloudinary.excludedNames].filter(Boolean).map(escapeRx).join("|");

export interface Exclusion {
  weddingId: string;
  slug: string;
  title: string;
  reasons: string[];
  assets: number;
}

/** Every invitation a bulk process must leave alone, found in the database (not guessed). */
export async function findExcluded(db: Db): Promise<Exclusion[]> {
  const rx = protectedPattern();
  const w = schema.weddings;
  // drizzle leaves the table name off columns in a single-table query, so the correlated subqueries below name the outer table themselves
  const rows = await db
    .select({
      id: w.id,
      slug: w.slug,
      title: w.title,
      pinned: sql<boolean>`${w.mediaStorage} = 'pinned'`,
      inSlug: sql<boolean>`${w.slug} ~* ${rx}`,
      inTitle: sql<boolean>`${w.title} ~* ${rx}`,
      inContact: sql<boolean>`(coalesce(${w.contactEmail}, '') || ' ' || coalesce(${w.contactPhone}, '')) ~* ${rx}`,
      inDraft: sql<boolean>`${w.draftDoc}::text ~* ${rx}`,
      inPublished: sql<boolean>`exists (select 1 from published_versions pv where pv.wedding_id = weddings.id and pv.doc::text ~* ${rx})`,
      inMembers: sql<boolean>`exists (select 1 from wedding_users wu join users u on u.id = wu.user_id where wu.wedding_id = weddings.id and (u.name || ' ' || u.email) ~* ${rx})`,
      inOrders: sql<boolean>`exists (select 1 from orders o where o.wedding_id = weddings.id and (o.customer_name || ' ' || o.customer_contact || ' ' || o.notes) ~* ${rx})`,
      assets: sql<number>`(select count(*)::int from media_assets m where m.wedding_id = weddings.id)`,
    })
    .from(w);
  const fromEnv = new Set(env.cloudinary.excludedWeddingIds);
  const out: Exclusion[] = [];
  for (const r of rows) {
    const reasons = [
      r.pinned && "pinned",
      fromEnv.has(r.id.toLowerCase()) && "CLOUDINARY_EXCLUDE_WEDDING_IDS",
      r.inSlug && "name in address",
      r.inTitle && "name in title",
      r.inContact && "name in contact",
      r.inDraft && "name in draft",
      r.inPublished && "name in published version",
      r.inMembers && "name in account",
      r.inOrders && "name in order",
    ].filter(Boolean) as string[];
    if (reasons.length) out.push({ weddingId: r.id, slug: r.slug, title: r.title, reasons, assets: Number(r.assets) });
  }
  return out;
}

/** A hash of everything stored about these invitations' pictures: equal before and after a run = nothing was written to them. */
export async function fingerprint(db: Db, weddingIds: string[]): Promise<string> {
  if (!weddingIds.length) return "none";
  const w = await db.select().from(schema.weddings).where(inArray(schema.weddings.id, weddingIds)).orderBy(asc(schema.weddings.id));
  const m = await db.select().from(schema.mediaAssets).where(inArray(schema.mediaAssets.weddingId, weddingIds)).orderBy(asc(schema.mediaAssets.id));
  const a = await db.select().from(schema.galleryAlbums).where(inArray(schema.galleryAlbums.weddingId, weddingIds)).orderBy(asc(schema.galleryAlbums.id));
  const g = await db.select().from(schema.galleryItems).where(inArray(schema.galleryItems.weddingId, weddingIds)).orderBy(asc(schema.galleryItems.id));
  return createHash("sha256").update(JSON.stringify({ w, m, a, g })).digest("hex");
}

export type Outcome =
  | "migrated"
  | "would_migrate"
  | "already_cloudinary"
  | "skipped_not_image"
  | "skipped_private"
  | "missing_source"
  | "invalid_image"
  | "upload_failed"
  | "verify_failed"
  | "db_failed";

export interface AssetResult {
  assetId: string;
  weddingId: string;
  outcome: Outcome;
  sha256?: string;
  bytes?: number;
  from?: string;
  to?: string;
  error?: string;
}

type MediaAsset = typeof schema.mediaAssets.$inferSelect;
type Variants = Record<string, { key: string; width: number; height: number }>;

const SIZES = [
  { name: "xl", max: 2400 },
  { name: "lg", max: 1600 },
  { name: "md", max: 900 },
  { name: "sm", max: 420 },
];

const readAll = async (body: ReadableStream<Uint8Array> | Buffer) => (Buffer.isBuffer(body) ? body : Buffer.from(await new Response(body as ReadableStream).arrayBuffer()));
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Which stored file is the best master: the largest size that was kept. */
const sourceKey = (a: MediaAsset) => {
  const v = (a.metadata as { variants?: Variants }).variants;
  return v?.xl?.key ?? v?.lg?.key ?? a.storageKey;
};

async function migrateAsset(db: Db, a: MediaAsset, place: Placement, excludedIds: string[], apply: boolean): Promise<AssetResult> {
  const base = { assetId: a.id, weddingId: a.weddingId };
  if (a.provider === "cloudinary") return { ...base, outcome: "already_cloudinary" };
  if (a.kind !== "IMAGE") return { ...base, outcome: "skipped_not_image" };
  if (!qualifies(a)) return { ...base, outcome: "skipped_private" };

  const from = sourceKey(a);
  let buf: Buffer;
  try {
    const obj = await storage().get(from);
    if (!obj) return { ...base, outcome: "missing_source", from };
    buf = await readAll(obj.body);
  } catch (e) {
    return { ...base, outcome: "missing_source", from, error: message(e) };
  }
  const sha256 = createHash("sha256").update(buf).digest("hex");
  let dims: { width: number; height: number };
  try {
    const m = await sharp(buf, { failOn: "error" }).metadata();
    if (!m.width || !m.height) throw new Error("no size");
    dims = { width: m.width, height: m.height };
  } catch {
    return { ...base, outcome: "invalid_image", from, sha256, bytes: buf.length };
  }
  if (!apply) return { ...base, outcome: "would_migrate", from, sha256, bytes: buf.length };

  const publicId = cloudPublicId(place, a.id);
  let up;
  try {
    up = await uploadImage(publicId, buf, { tags: [env.cloudinary.folder, place.isDemo ? "template" : "project", a.category.toLowerCase(), "migrated"] });
  } catch (e) {
    return { ...base, outcome: "upload_failed", from, to: publicId, sha256, error: message(e) };
  }
  // what Cloudinary holds must be exactly what was sent — also when the id already existed (an earlier, interrupted run)
  if (up.publicId !== publicId || !up.version || up.bytes !== buf.length || up.width !== dims.width || up.height !== dims.height) {
    return { ...base, outcome: "verify_failed", from, to: publicId, sha256, error: `Cloudinary holds ${up.bytes} bytes ${up.width}x${up.height}, sent ${buf.length} bytes ${dims.width}x${dims.height}` };
  }
  try {
    const p = await probeImage(publicId);
    if (!p.ok) return { ...base, outcome: "verify_failed", from, to: publicId, sha256, error: `delivery answered ${p.status} ${p.contentType}` };
  } catch (e) {
    return { ...base, outcome: "verify_failed", from, to: publicId, sha256, error: message(e) };
  }

  const meta = a.metadata as { variants?: Variants };
  const sizes = SIZES.map(({ name, max }) => {
    const kept = meta.variants?.[name];
    if (kept) return { name, width: kept.width, height: kept.height };
    const width = Math.min(dims.width, max);
    return { name, width, height: Math.round((dims.height * width) / dims.width) };
  });
  const cloud: CloudMeta = { version: up.version, format: up.format, bytes: up.bytes, rev: 0 };
  try {
    const done = await db
      .update(schema.mediaAssets)
      .set({
        provider: "cloudinary",
        storageKey: publicId,
        sizeBytes: up.bytes,
        metadata: { ...a.metadata, variants: sharedVariants(publicId, sizes), cloudinary: cloud, legacy: { storageKey: a.storageKey, variants: meta.variants } },
      })
      .where(and(eq(schema.mediaAssets.id, a.id), eq(schema.mediaAssets.provider, "legacy"), ...(excludedIds.length ? [notInArray(schema.mediaAssets.weddingId, excludedIds)] : [])))
      .returning({ id: schema.mediaAssets.id });
    if (!done.length) return { ...base, outcome: "db_failed", from, to: publicId, sha256, error: "row changed or is excluded; left as it was" };
  } catch (e) {
    return { ...base, outcome: "db_failed", from, to: publicId, sha256, error: message(e) };
  }
  return { ...base, outcome: "migrated", from, to: publicId, sha256, bytes: buf.length };
}

export interface MigrateOptions {
  apply: boolean;
  scope?: "all" | "templates" | "projects";
  /** Wedding ids or addresses (slugs) to restrict the run to. */
  only?: string[];
  limitWeddings?: number;
  concurrency?: number;
  onAsset?: (r: AssetResult) => void;
  onWedding?: (w: { id: string; slug: string; done: number; of: number }) => void;
}

export interface MigrationReport {
  startedAt: string;
  finishedAt: string;
  apply: boolean;
  scope: string;
  weddings: { total: number; excluded: number; gifts: number; alreadyCloudinary: number; eligible: number; processed: number; completed: number };
  exclusions: Exclusion[];
  assets: Record<Outcome, number> & { rowsInProcessedWeddings: number; rowsInExcludedWeddings: number; rowsTotal: number; bytes: number; duplicateGroups: number; duplicateExtraCopies: number };
  excludedFingerprint: { before: string; after: string; unchanged: boolean };
  results: AssetResult[];
}

const OUTCOMES: Outcome[] = ["migrated", "would_migrate", "already_cloudinary", "skipped_not_image", "skipped_private", "missing_source", "invalid_image", "upload_failed", "verify_failed", "db_failed"];

export async function migrate(opts: MigrateOptions): Promise<MigrationReport> {
  const db = await getDb();
  const startedAt = new Date().toISOString();
  const exclusions = await findExcluded(db);
  const excludedIds = exclusions.map((e) => e.weddingId);
  const before = await fingerprint(db, excludedIds);

  const all = await db
    .select({ id: schema.weddings.id, slug: schema.weddings.slug, mediaStorage: schema.weddings.mediaStorage, isDemo: schema.weddings.isDemo, templateId: schema.weddings.templateId })
    .from(schema.weddings)
    .orderBy(asc(schema.weddings.createdAt));
  const gifts = new Set((await db.select({ id: schema.gifts.weddingId }).from(schema.gifts)).map((g) => g.id));
  const scope = opts.scope ?? "all";
  const only = opts.only?.map((s) => s.toLowerCase());

  let candidates = all.filter((w) => !excludedIds.includes(w.id) && !gifts.has(w.id) && w.mediaStorage === "legacy");
  if (scope === "templates") candidates = candidates.filter((w) => w.isDemo);
  if (scope === "projects") candidates = candidates.filter((w) => !w.isDemo);
  if (only?.length) candidates = candidates.filter((w) => only.includes(w.id.toLowerCase()) || only.includes(w.slug.toLowerCase()));
  const eligible = candidates.length;
  if (opts.limitWeddings) candidates = candidates.slice(0, opts.limitWeddings);

  const results: AssetResult[] = [];
  let completed = 0;
  let rowsInProcessed = 0;
  for (const w of candidates) {
    if (excludedIds.includes(w.id)) throw new Error("Refusing to process an excluded invitation."); // second, independent check
    const rows = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, w.id)).orderBy(asc(schema.mediaAssets.createdAt));
    rowsInProcessed += rows.length;
    const mine: AssetResult[] = [];
    const queue = [...rows];
    const worker = async () => {
      for (let a = queue.shift(); a; a = queue.shift()) {
        const r = await migrateAsset(db, a, w, excludedIds, opts.apply);
        mine.push(r);
        opts.onAsset?.(r);
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, opts.concurrency ?? 3) }, worker));
    results.push(...mine);
    // the invitation switches to Cloudinary for new uploads only when every photograph that belongs there has moved
    const clean = mine.every((r) => ["migrated", "already_cloudinary", "skipped_not_image", "skipped_private"].includes(r.outcome));
    if (opts.apply && clean) {
      const flipped = await db
        .update(schema.weddings)
        .set({ mediaStorage: "cloudinary" })
        .where(and(eq(schema.weddings.id, w.id), eq(schema.weddings.mediaStorage, "legacy")))
        .returning({ id: schema.weddings.id });
      if (flipped.length) completed++;
    }
    opts.onWedding?.({ id: w.id, slug: w.slug, done: results.length, of: rowsInProcessed });
  }

  const after = await fingerprint(db, excludedIds);
  const count = Object.fromEntries(OUTCOMES.map((o) => [o, results.filter((r) => r.outcome === o).length])) as Record<Outcome, number>;
  const bySha = new Map<string, number>();
  for (const r of results) if (r.sha256 && (r.outcome === "migrated" || r.outcome === "would_migrate")) bySha.set(r.sha256, (bySha.get(r.sha256) ?? 0) + 1);
  const dupes = [...bySha.values()].filter((n) => n > 1);
  const [{ n: rowsTotal }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.mediaAssets);
  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    apply: opts.apply,
    scope,
    weddings: {
      total: all.length,
      excluded: exclusions.length,
      gifts: all.filter((w) => gifts.has(w.id) && !excludedIds.includes(w.id)).length,
      alreadyCloudinary: all.filter((w) => w.mediaStorage === "cloudinary").length,
      eligible,
      processed: candidates.length,
      completed,
    },
    exclusions,
    assets: {
      ...count,
      rowsInProcessedWeddings: rowsInProcessed,
      rowsInExcludedWeddings: exclusions.reduce((n, e) => n + e.assets, 0),
      rowsTotal: Number(rowsTotal),
      bytes: results.filter((r) => r.outcome === "migrated" || r.outcome === "would_migrate").reduce((n, r) => n + (r.bytes ?? 0), 0),
      duplicateGroups: dupes.length,
      duplicateExtraCopies: dupes.reduce((n, c) => n + c - 1, 0),
    },
    excludedFingerprint: { before, after, unchanged: before === after },
    results,
  };
}

/**
 * Puts an invitation's migrated photographs back where they were (their old files were never deleted). A photograph replaced after the
 * migration has no old copy to go back to: it stays on Cloudinary and is counted, so nothing is silently lost.
 */
export async function rollbackWedding(db: Db, weddingId: string): Promise<{ restored: number; keptOnCloudinary: number }> {
  if ((await findExcluded(db)).some((e) => e.weddingId === weddingId)) throw new Error("Refusing to touch an excluded invitation.");
  const rows = await db.select().from(schema.mediaAssets).where(and(eq(schema.mediaAssets.weddingId, weddingId), eq(schema.mediaAssets.provider, "cloudinary")));
  let restored = 0;
  let kept = 0;
  for (const a of rows) {
    const legacy = (a.metadata as { legacy?: { storageKey: string; variants?: Variants } }).legacy;
    if (!legacy) {
      kept++;
      continue;
    }
    await db
      .update(schema.mediaAssets)
      .set({ provider: "legacy", storageKey: legacy.storageKey, metadata: { ...Object.fromEntries(Object.entries(a.metadata).filter(([k]) => !["legacy", "cloudinary", "variants"].includes(k))), ...(legacy.variants ? { variants: legacy.variants } : {}) } })
      .where(eq(schema.mediaAssets.id, a.id));
    restored++;
  }
  await db.update(schema.weddings).set({ mediaStorage: "legacy" }).where(and(eq(schema.weddings.id, weddingId), eq(schema.weddings.mediaStorage, "cloudinary")));
  return { restored, keptOnCloudinary: kept };
}

/** Checks that every migrated photograph (of one invitation, or all) is still served by Cloudinary. */
export async function verifyMigrated(db: Db, onBad?: (id: string, why: string) => void, weddingId?: string): Promise<{ checked: number; bad: number }> {
  const rows = await db.select({ id: schema.mediaAssets.id, key: schema.mediaAssets.storageKey }).from(schema.mediaAssets).where(and(eq(schema.mediaAssets.provider, "cloudinary"), ...(weddingId ? [eq(schema.mediaAssets.weddingId, weddingId)] : [])));
  let bad = 0;
  for (const r of rows) {
    const p = await probeImage(r.key).catch((e) => ({ ok: false, status: 0, contentType: message(e), bytes: 0 }));
    if (!p.ok) {
      bad++;
      onBad?.(r.id, `${p.status} ${p.contentType}`);
    }
  }
  return { checked: rows.length, bad };
}
