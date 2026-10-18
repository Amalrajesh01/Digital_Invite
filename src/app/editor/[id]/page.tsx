import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { loadWizardProps } from "@/lib/wizard-data";
import { ensureFaces, listMedia, toResolved } from "@/domain/media/service";
import { EditorClient } from "@/components/editor/EditorClient";
import { loadSampleInfo } from "@/domain/wedding/from-template";
import type { MediaRow } from "@/app/actions/media";

export const metadata: Metadata = { title: "Visual editor", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const actor = await requireAdminPage(`/editor/${id}`);
  const p = await loadWizardProps(actor, id, "edit");
  // frame the walking figures' heads before the photographs are listed, so the live preview has them too
  const d = p.initialDoc;
  if (d.journey.enabled && d.journey.autoFit) await ensureFaces(id, [d.journey.brideHead ?? d.couple.bride.photo, d.journey.groomHead ?? d.couple.groom.photo]);
  const rows = await listMedia(actor, id, { limit: 400 });
  const sample = await loadSampleInfo(actor, id);
  const media: MediaRow[] = rows.map((r) => {
    const m = toResolved(r);
    return { id: r.id, kind: r.kind, category: r.category, filename: r.filename, title: r.title, url: m.url, srcSet: m.srcSet, width: r.width ?? undefined, height: r.height ?? undefined, blur: m.blur, face: m.face, moderation: r.moderation, visibility: r.visibility, retention: r.retention, source: r.source, albumId: r.albumId, sortOrder: r.sortOrder, createdAt: r.createdAt.toISOString(), sizeBytes: r.sizeBytes, alt: r.alt, caption: r.caption, focal: m.focal };
  });
  return <EditorClient welcome={isNew === "1"} sample={sample} weddingId={id} slug={p.slug} title={p.title} published={p.published} doc={p.initialDoc} settings={p.initialSettings} features={p.features} groups={p.groups} templates={p.templates} themes={p.themes} media={media} />;
}
