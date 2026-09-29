import { requireClientPage } from "@/lib/session";
import { loadWsCtx } from "@/lib/ws-context";
import { renderWorkspace } from "@/components/workspace/pages";

export const dynamic = "force-dynamic";

export default async function ClientOverview({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = await params;
  const actor = await requireClientPage(weddingId);
  return renderWorkspace("", await loadWsCtx(actor, weddingId));
}
