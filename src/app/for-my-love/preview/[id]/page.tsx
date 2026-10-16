import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadGiftPreview } from "@/domain/gifts/service";
import { InvitationApp } from "@/invitation/InvitationApp";
import { PreviewFrame } from "@/invitation/PreviewFrame";

export const metadata: Metadata = { title: "Your gift", robots: { index: false, follow: false, noarchive: true }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

/**
 * A gift as its maker sees it, before it is published. Reachable only with the signed preview token the maker's own
 * browser holds (a stranger cannot make one), never indexed, never cached.
 *   ?m=live   inside the builder: start screens skipped and edits arrive as they are typed
 *   (default) the real thing, from its first screen — exactly what the recipient will see
 */
export default async function GiftPreview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const q = await searchParams;
  const view = await loadGiftPreview(id, q.t).catch(() => null);
  if (!view) notFound();
  const locale = view.wedding.defaultLocale;
  return q.m === "live" ? <PreviewFrame view={view} initialLocale={locale} /> : <InvitationApp view={view} initialLocale={locale} />;
}
