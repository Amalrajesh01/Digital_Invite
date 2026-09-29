import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { loadWsCtx } from "@/lib/ws-context";
import { renderWorkspace } from "@/components/workspace/pages";

export const dynamic = "force-dynamic";

export default async function WeddingSection({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  const actor = await requireAdminPage(`/admin/weddings/${id}/${section}`);
  if (section === "invitation") redirect(`/admin/weddings/${id}/edit`);
  if (section === "events") redirect(`/admin/weddings/${id}/setup/events`);
  return renderWorkspace(section, await loadWsCtx(actor, id));
}
