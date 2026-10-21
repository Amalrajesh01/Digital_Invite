import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { env } from "@/lib/env";
import { notFound } from "@/lib/errors";
import { destroyImage, uploadImage } from "@/lib/cloudinary";
import { storage } from "@/lib/storage";
import { logError } from "@/domain/platform/logging";
import type { ProcessedImage } from "./image";

/**
 * Where an invitation's photographs live, and how they get to Cloudinary and back out.
 *
 * Rules (one place, so the upload route, the editor, the template copy and the migration tool agree):
 *  - Only photographs go to Cloudinary. Audio and video stay on the STORAGE_DRIVER store.
 *  - Only public, non-guest photographs do. A guest's upload waits for moderation, a time-capsule photograph is private until the
 *    capsule opens, and a gift's photographs are private by design: those stay behind the app's access check.
 *  - Which invitations: those whose `mediaStorage` is 'cloudinary' (every invitation created from now on). Invitations that existed
 *    before keep 'legacy' until the migration tool moves them; 'pinned' is never moved by anything.
 *  - One master (the 2400px WebP) is stored; the smaller sizes are delivery URLs of the same public id, not extra files.
 */
type MediaAsset = typeof schema.mediaAssets.$inferSelect;

export interface CloudMeta {
  version: number;
  format: string;
  bytes: number;
  /** Bumped each time the picture is replaced or rotated: a replacement is a new public id, so a shared original is never overwritten. */
  rev: number;
}

export interface Placement {
  id: string;
  mediaStorage: "legacy" | "cloudinary" | "pinned";
  isDemo: boolean;
  templateId: string | null;
}

export async function loadPlacement(weddingId: string): Promise<Placement> {
  const db = await getDb();
  const [w] = await db
    .select({ id: schema.weddings.id, mediaStorage: schema.weddings.mediaStorage, isDemo: schema.weddings.isDemo, templateId: schema.weddings.templateId })
    .from(schema.weddings)
    .where(eq(schema.weddings.id, weddingId));
  if (!w) throw notFound("We could not find that invitation.");
  return w;
}

type FileFacts = { kind: string; visibility: string; source: string; category: string };

/** Is this the kind of file that belongs on Cloudinary at all (whatever invitation it is in)? */
export const qualifies = (f: FileFacts): boolean => f.kind === "IMAGE" && f.visibility !== "PRIVATE" && f.source !== "GUEST" && f.category !== "MEMORY" && f.category !== "GUEST_UPLOAD";

export const wantsCloudinary = (w: Pick<Placement, "mediaStorage">, f: FileFacts): boolean => env.cloudinary.configured && w.mediaStorage === "cloudinary" && qualifies(f);

/** Template sample photographs live under templates/<template id>; every customer's under projects/<invitation id>. Internal ids only — no names. */
export function cloudFolder(w: Pick<Placement, "id" | "isDemo" | "templateId">): string {
  return `${env.cloudinary.folder}/${w.isDemo ? `templates/${w.templateId ?? w.id}` : `projects/${w.id}`}`;
}

export const cloudPublicId = (w: Pick<Placement, "id" | "isDemo" | "templateId">, assetId: string, rev = 0) => `${cloudFolder(w)}/${assetId}${rev ? `-r${rev}` : ""}`;

export interface CloudWrite {
  storageKey: string;
  variants: Record<string, { key: string; width: number; height: number }>;
  cloud: CloudMeta;
  width: number;
  height: number;
  sizeBytes: number;
}

/** The delivery sizes the app asks for, described against one stored master (each variant keeps the width it always had). */
export function sharedVariants(publicId: string, sizes: { name: string; width: number; height: number }[]): CloudWrite["variants"] {
  return Object.fromEntries(sizes.map((v) => [v.name, { key: publicId, width: v.width, height: v.height }]));
}

/** Uploads the master of a processed photograph and checks what Cloudinary says it stored. Throws (and leaves nothing) if it does not match. */
export async function putProcessedImage(w: Placement, assetId: string, img: ProcessedImage, o: { rev?: number; category: string }): Promise<CloudWrite> {
  const master = img.variants.find((v) => v.name === "xl") ?? img.variants[0];
  const publicId = cloudPublicId(w, assetId, o.rev);
  const up = await uploadImage(publicId, master.data, { tags: [env.cloudinary.folder, w.isDemo ? "template" : "project", o.category.toLowerCase()] });
  if (up.publicId !== publicId || !up.version || up.bytes !== master.data.length || up.width !== master.width || up.height !== master.height) {
    await destroyImage(publicId).catch(() => undefined);
    throw new Error("Cloudinary stored something different from what was uploaded.");
  }
  return {
    storageKey: publicId,
    variants: sharedVariants(publicId, img.variants),
    cloud: { version: up.version, format: up.format, bytes: up.bytes, rev: o.rev ?? 0 },
    width: img.width,
    height: img.height,
    sizeBytes: up.bytes,
  };
}

type WithKeys = Pick<MediaAsset, "provider" | "storageKey" | "metadata">;
const keysIn = (storageKey: string, variants?: Record<string, { key: string }>) => [...new Set([storageKey, ...Object.values(variants ?? {}).map((v) => v.key)])];

/** Every stored object a row owns: its files on the STORAGE_DRIVER store (including the originals a migration left there) and its Cloudinary id. */
export function storedKeysOf(a: WithKeys): { legacy: string[]; cloud: string[] } {
  const meta = a.metadata as { variants?: Record<string, { key: string }>; legacy?: { storageKey: string; variants?: Record<string, { key: string }> } };
  if (a.provider === "cloudinary") return { cloud: [a.storageKey], legacy: meta.legacy ? keysIn(meta.legacy.storageKey, meta.legacy.variants) : [] };
  return { cloud: [], legacy: keysIn(a.storageKey, meta.variants) };
}

/**
 * Deletes Cloudinary images that no row refers to any more. Several rows may share one image (an invitation started from a template
 * shares the template's photographs), so a row being deleted never takes a shared image with it. Call after the rows are gone.
 */
export async function releaseCloudKeys(keys: Iterable<string>): Promise<{ deleted: number; kept: number }> {
  const mine = [...new Set(keys)].filter((k) => k.startsWith(`${env.cloudinary.folder}/`));
  if (!mine.length) return { deleted: 0, kept: 0 };
  const db = await getDb();
  const used = new Set((await db.select({ k: schema.mediaAssets.storageKey }).from(schema.mediaAssets).where(and(eq(schema.mediaAssets.provider, "cloudinary"), inArray(schema.mediaAssets.storageKey, mine)))).map((r) => r.k));
  let deleted = 0;
  for (const k of mine) {
    if (used.has(k)) continue;
    try {
      if (await destroyImage(k)) deleted++;
    } catch (e) {
      await logError("cloudinary.delete", e, { metadata: { publicId: k } });
    }
  }
  return { deleted, kept: used.size };
}

/** Removes the stored objects of rows that have just been deleted from the database. */
export async function removeStored(rows: WithKeys[]): Promise<void> {
  const legacy = new Set<string>();
  const cloud = new Set<string>();
  for (const r of rows) {
    const k = storedKeysOf(r);
    k.legacy.forEach((x) => legacy.add(x));
    k.cloud.forEach((x) => cloud.add(x));
  }
  await Promise.allSettled([...legacy].map((k) => storage().delete(k)));
  await releaseCloudKeys(cloud);
}
