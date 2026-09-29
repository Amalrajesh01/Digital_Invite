import { redirect } from "next/navigation";
import { requireClientPage } from "@/lib/session";
import { loadWsCtx } from "@/lib/ws-context";
import { renderWorkspace } from "@/components/workspace/pages";

export const dynamic = "force-dynamic";

export default async function ClientSection({ params }: { params: Promise<{ weddingId: string; section: string }> }) {
  const { weddingId, section } = await params;
  const actor = await requireClientPage(weddingId, `/client/${weddingId}/${section}`);
  if (section === "invitation" || section === "events") redirect(`/client/${weddingId}/setup/events`);
  return renderWorkspace(section, await loadWsCtx(actor, weddingId));
}
