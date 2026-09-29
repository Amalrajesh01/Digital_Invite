import { getWeddingBySlug, loadPublishedSnapshot } from "@/domain/wedding/snapshot";
import { getEntitlements } from "@/domain/packages/service";
import { canUse } from "@/domain/packages/entitlements";
import { listPhotoWall } from "@/domain/participation/service";

/**
 * The projector wall at /wall/{slug} is public by design (it is shown on a screen at the venue) so it
 * is only offered for a live wedding whose package includes it and whose invitation is not private.
 */
export async function loadWallAccess(slug: string) {
  const wedding = await getWeddingBySlug(slug);
  if (!wedding || wedding.accessMode === "PERSONALIZED_ONLY") return null;
  const snap = await loadPublishedSnapshot(wedding);
  if (!snap) return null;
  if (!canUse(await getEntitlements(wedding.id), "live_photo_wall")) return null;
  return snap;
}

export async function wallItems(weddingId: string, since?: Date) {
  return listPhotoWall(weddingId, { since, limit: 60, kind: "IMAGE" });
}
