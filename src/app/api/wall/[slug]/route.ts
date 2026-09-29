import { ok, fail } from "@/lib/http";
import { notFound } from "@/lib/errors";
import { loadWallAccess, wallItems } from "@/domain/live/wall";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const snap = await loadWallAccess(slug);
    if (!snap) throw notFound();
    const sinceRaw = new URL(req.url).searchParams.get("since");
    const since = sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? new Date(sinceRaw) : undefined;
    return ok({ items: await wallItems(snap.wedding.id, since) });
  } catch (e) {
    return fail(e, { area: "wall" });
  }
}
