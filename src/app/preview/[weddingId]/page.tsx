import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { requireUserPage } from "@/lib/session";
import { requireWeddingAccess } from "@/domain/auth/access";
import { loadPreviewInvitation } from "@/domain/wedding/public";
import { WEDDING_STATUSES } from "@/domain/doc/constants";
import { PreviewFrame } from "@/invitation/PreviewFrame";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Draft preview for Super Admin and clients — never cached, never indexed. */
export default async function PreviewPage({ params, searchParams }: { params: Promise<{ weddingId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { weddingId } = await params;
  const q = await searchParams;
  const actor = await requireUserPage(`/preview/${weddingId}`);
  await requireWeddingAccess(actor, weddingId).catch(() => notFound());
  const as = WEDDING_STATUSES.find((s) => s === q.as);
  const view = await loadPreviewInvitation(weddingId, { asStatus: as, asGuest: q.guest === "1" });
  if (!view) notFound();
  const jar = await cookies();
  return (
    <>
      <PreviewFrame view={view} initialLocale={q.lang || jar.get("inv_lang")?.value || view.wedding.defaultLocale} interactive={q.edit === "1"} />
    </>
  );
}
