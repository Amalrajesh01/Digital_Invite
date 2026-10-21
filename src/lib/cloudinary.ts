import { env } from "./env";
import { cloudinaryUrl } from "./media-url";

/**
 * The only file that talks to Cloudinary (official `cloudinary` SDK for the signed API calls; delivery URLs are plain strings).
 * The API secret never leaves the server and never appears in an error: the SDK reports failures as plain objects and a few
 * echo request details, so every failure is rewritten here.
 */
export interface CloudImage {
  publicId: string;
  version: number;
  format: string;
  bytes: number;
  width: number;
  height: number;
  /** The id was already taken and nothing was overwritten (an interrupted upload being repeated). */
  existing: boolean;
}

/** Public ids are always built by the server from stable internal ids; this is the last line of defence against a crafted one. */
const PUBLIC_ID = /^[a-z0-9][a-z0-9/_-]{0,200}$/;
export const isPublicId = (s: string) => PUBLIC_ID.test(s) && !s.includes("//") && !s.endsWith("/");

export class CloudinaryNotConfigured extends Error {
  constructor() {
    super("Image storage is not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
  }
}

/** The upload API rejects with { message, http_code }, the Admin API with { error: { message, http_code } }: read either. */
function detail(e: unknown): { message: string; code?: number } {
  const o = (typeof e === "object" && e ? ((e as { error?: unknown }).error ?? e) : {}) as { message?: unknown; http_code?: unknown };
  return { message: e instanceof Error ? e.message : o.message != null ? String(o.message) : String(e), code: o.http_code != null ? Number(o.http_code) : undefined };
}

function clean(e: unknown): Error {
  const d = detail(e);
  const msg = [env.cloudinary.apiSecret, env.cloudinary.apiKey].filter(Boolean).reduce((m, s) => m.split(s).join("***"), d.message);
  const err = new Error(`Cloudinary: ${msg}`) as Error & { status?: number };
  if (d.code) err.status = d.code;
  return err;
}

let sdk: Promise<typeof import("cloudinary").v2> | null = null;
function client() {
  if (!env.cloudinary.configured) throw new CloudinaryNotConfigured();
  return (sdk ??= import("cloudinary").then(({ v2 }) => {
    v2.config({ cloud_name: env.cloudinary.cloudName, api_key: env.cloudinary.apiKey, api_secret: env.cloudinary.apiSecret, secure: true });
    return v2;
  }));
}

/** Stores an image under a server-chosen public id. Never overwrites unless asked: repeating an upload is harmless. */
export async function uploadImage(publicId: string, data: Buffer, opts: { overwrite?: boolean; tags?: string[] } = {}): Promise<CloudImage> {
  if (!isPublicId(publicId)) throw new Error("Invalid image id.");
  const v2 = await client();
  try {
    const r = await new Promise<import("cloudinary").UploadApiResponse>((resolve, reject) => {
      v2.uploader
        .upload_stream(
          {
            public_id: publicId,
            resource_type: "image",
            type: "upload",
            overwrite: !!opts.overwrite,
            invalidate: !!opts.overwrite,
            unique_filename: false,
            use_filename: false,
            tags: opts.tags,
            timeout: 60_000,
          },
          (err, res) => (err || !res ? reject(err ?? new Error("empty response")) : resolve(res)),
        )
        .end(data);
    });
    return { publicId: r.public_id, version: r.version, format: r.format, bytes: r.bytes, width: r.width, height: r.height, existing: !!(r as { existing?: boolean }).existing };
  } catch (e) {
    throw clean(e);
  }
}

/** Removes an image. Callers must have checked that nothing else still points at it. Returns false when it was already gone. */
export async function destroyImage(publicId: string): Promise<boolean> {
  if (!isPublicId(publicId)) throw new Error("Invalid image id.");
  const v2 = await client();
  try {
    const r = await v2.uploader.destroy(publicId, { resource_type: "image", type: "upload", invalidate: true });
    return r.result === "ok";
  } catch (e) {
    throw clean(e);
  }
}

/** The delivery URL (see cloudinaryUrl): best format and quality per browser, never wider than asked, never upscaled. */
export const deliveryUrl = (publicId: string, o: { width?: number; version?: number } = {}): string => cloudinaryUrl(env.cloudinary.cloudName, publicId, o);

/** The stored file itself, untransformed (face detection, copying, rotating, checking a migration). null = not there. */
export async function fetchOriginal(publicId: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!env.cloudinary.cloudName || !isPublicId(publicId)) return null;
  const res = await fetch(`https://res.cloudinary.com/${env.cloudinary.cloudName}/image/upload/${publicId}`, { signal: AbortSignal.timeout(30_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Cloudinary: delivery answered ${res.status}.`);
  return { data: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") ?? "image/webp" };
}

/** Does this id deliver an image right now? (HEAD on the untransformed file: no transformation is spent on it.) */
export async function probeImage(publicId: string): Promise<{ ok: boolean; status: number; contentType: string; bytes: number }> {
  const res = await fetch(`https://res.cloudinary.com/${env.cloudinary.cloudName}/image/upload/${publicId}`, { method: "HEAD", signal: AbortSignal.timeout(20_000) });
  const contentType = res.headers.get("content-type") ?? "";
  return { ok: res.ok && contentType.startsWith("image/"), status: res.status, contentType, bytes: Number(res.headers.get("content-length") ?? 0) };
}

/**
 * Is this image stored right now? Asks the account itself (Admin API), because the CDN keeps delivering a file it has cached for a
 * while after the file is deleted, so a delivery check cannot prove a deletion.
 */
export async function imageExists(publicId: string): Promise<boolean> {
  if (!isPublicId(publicId)) return false;
  const v2 = await client();
  try {
    await v2.api.resource(publicId, { resource_type: "image", type: "upload" });
    return true;
  } catch (e) {
    if (detail(e).code === 404) return false;
    throw clean(e);
  }
}

export async function ping(): Promise<void> {
  const v2 = await client();
  try {
    await v2.api.ping();
  } catch (e) {
    throw clean(e);
  }
}

export interface CloudUsage {
  plan: string;
  creditsUsed: number | null;
  creditsLimit: number | null;
  creditsUsedPercent: number | null;
  storageBytes: number | null;
  bandwidthBytes: number | null;
  transformations: number | null;
  resources: number | null;
  lastUpdated: string | null;
  rateLimitRemaining: number | null;
}

/** Plan and consumption for the account the credentials belong to — for monitoring, and so a migration can refuse to start when nearly full. */
export async function usage(): Promise<CloudUsage> {
  const v2 = await client();
  try {
    const u = (await v2.api.usage()) as Record<string, any>; // the SDK does not type the usage report
    const n = (x: unknown) => (typeof x === "number" ? x : null);
    return {
      plan: String(u.plan ?? "unknown"),
      creditsUsed: n(u.credits?.usage),
      creditsLimit: n(u.credits?.limit),
      creditsUsedPercent: n(u.credits?.used_percent),
      storageBytes: n(u.storage?.usage),
      bandwidthBytes: n(u.bandwidth?.usage),
      transformations: n(u.transformations?.usage),
      resources: n(u.resources),
      lastUpdated: typeof u.last_updated === "string" ? u.last_updated : null,
      rateLimitRemaining: n(u.rate_limit_remaining),
    };
  } catch (e) {
    throw clean(e);
  }
}
