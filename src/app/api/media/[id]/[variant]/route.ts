import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { storage } from "@/lib/storage";
import { getCurrentActor } from "@/lib/session";
import { isMemberOf } from "@/domain/auth/access";
import { capsuleAssetIsPublic } from "@/domain/memory/service";
import { PUBLIC_STATUSES } from "@/domain/doc/constants";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

/**
 * Serves media with access control:
 *   - approved + public files of a live wedding: world-readable, cached
 *   - time-capsule files: only once the capsule has opened
 *   - everything else (pending uploads, drafts, private wishes): only signed-in members of that wedding
 * Unauthorised requests get the same 404 as missing files, so nothing can be probed.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string; variant: string }> }) {
  const { id, variant } = await ctx.params;
  if (!UUID.test(id)) return notFound();
  // Hot-linking: other websites may not embed our photographs (browsers state this themselves; link-preview crawlers send nothing and still work).
  if (req.headers.get("sec-fetch-site") === "cross-site" && ["image", "video", "audio", "script", "style"].includes(req.headers.get("sec-fetch-dest") ?? "")) return notFound();
  const db = await getDb();
  const [row] = await db
    .select({ a: schema.mediaAssets, publishedVersionId: schema.weddings.publishedVersionId, status: schema.weddings.status, archivedAt: schema.weddings.archivedAt })
    .from(schema.mediaAssets)
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.mediaAssets.weddingId))
    .where(eq(schema.mediaAssets.id, id));
  if (!row) return notFound();
  const a = row.a;

  const weddingLive = !!row.publishedVersionId && PUBLIC_STATUSES.includes(row.status) && !row.archivedAt;
  let allowed = a.visibility === "PUBLIC" && a.moderation === "APPROVED" && !a.archivedAt && weddingLive;
  let isPublic = allowed;
  if (!allowed && a.category === "MEMORY") {
    allowed = await capsuleAssetIsPublic(a.id);
    isPublic = allowed;
  }
  if (!allowed) {
    const actor = await getCurrentActor();
    allowed = !!actor && isMemberOf(actor, a.weddingId);
    isPublic = false;
  }
  if (!allowed) return notFound();

  const variants = (a.metadata as { variants?: Record<string, { key: string }> }).variants;
  const key = a.kind === "IMAGE" ? variants?.[variant]?.key ?? variants?.lg?.key ?? a.storageKey : a.storageKey;
  const drv = storage();

  if (drv.name === "s3") {
    const direct = isPublic ? drv.publicUrl(key) : null;
    const url = direct ?? (await drv.signedUrl(key, 300));
    if (url) return Response.redirect(url, 302);
  }

  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.get("range") ?? "");
  const obj = await drv.get(key, range ? { start: Number(range[1]), end: range[2] ? Number(range[2]) : undefined } : undefined);
  if (!obj) return notFound();

  const headers: Record<string, string> = {
    "Content-Type": obj.contentType,
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    "Cache-Control": isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  };
  if (obj.range) {
    headers["Content-Range"] = `bytes ${obj.range.start}-${obj.range.end}/${obj.range.total}`;
    headers["Content-Length"] = String(obj.size);
    return new Response(obj.body as BodyInit, { status: 206, headers });
  }
  headers["Content-Length"] = String(obj.size);
  return new Response(obj.body as BodyInit, { status: 200, headers });
}
