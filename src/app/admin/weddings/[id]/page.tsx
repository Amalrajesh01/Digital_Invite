import { requireAdminPage } from "@/lib/session";
import { loadWsCtx } from "@/lib/ws-context";
import { renderWorkspace } from "@/components/workspace/pages";

export const dynamic = "force-dynamic";

export default async function WeddingOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireAdminPage(`/admin/weddings/${id}`);
  return renderWorkspace("", await loadWsCtx(actor, id));
}
