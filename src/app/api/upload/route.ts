import { z } from "zod";
import { getCurrentActor } from "@/lib/session";
import { assertSameOrigin, assertUploadSize, fail, ok } from "@/lib/http";
import { invalid } from "@/lib/errors";
import { replaceImage, toResolved, uploadAsUser } from "@/domain/media/service";
import { rateLimit } from "@/domain/platform/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CATEGORIES = ["BRIDE", "GROOM", "COUPLE", "FAMILY", "GALLERY", "EVENT", "VENUE", "VIDEO", "MUSIC", "GUEST_UPLOAD", "MEMORY", "PEOPLE", "OTHER"] as const;
const Meta = z.object({ weddingId: z.string().uuid(), category: z.enum(CATEGORIES), albumId: z.string().uuid().optional(), replaceId: z.string().uuid().optional(), durationSec: z.coerce.number().optional() });

/**
 * Authenticated upload for Super Admin and clients (guests use /api/public/[slug]/upload).
 * Validation, sniffing and processing all happen in the media service; this route only parses.
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    assertUploadSize(req);
    const actor = await getCurrentActor();
    if (actor) await rateLimit(`upload-user:${actor.userId}`, 600, 3600);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw invalid("Please choose a file.");
    const meta = Meta.parse({
      weddingId: form.get("weddingId"),
      category: form.get("category") ?? "OTHER",
      albumId: form.get("albumId") || undefined,
      replaceId: form.get("replaceId") || undefined,
      durationSec: form.get("durationSec") || undefined,
    });
    const buffer = Buffer.from(await file.arrayBuffer());
    if (meta.replaceId) {
      const row = await replaceImage(actor, meta.weddingId, meta.replaceId, buffer);
      return ok({ media: toResolved(row), category: row.category, filename: row.filename });
    }
    const row = await uploadAsUser(actor, meta.weddingId, { buffer, filename: file.name }, { category: meta.category, albumId: meta.albumId ?? null, durationSec: meta.durationSec ?? null });
    return ok({ media: toResolved(row), category: row.category, filename: row.filename, id: row.id });
  } catch (e) {
    return fail(e, { area: "upload" });
  }
}
