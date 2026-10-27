import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadSpecPreview } from "@/domain/wedding/public";
import { WEDDING_STATUSES } from "@/domain/doc/constants";
import { InvitationApp } from "@/invitation/InvitationApp";
import { PreviewShield } from "@/invitation/PreviewShield";
import { PreviewBar } from "@/components/site/PreviewBar";
import { siteTemplateBySlug } from "@/domain/catalogue/templates";
import { requestMeta } from "@/lib/session";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Template preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * A template as the gallery shows it: the design that ships, filled with its sample invitation’s words and photographs.
 * Behind the same guard as every public preview (no scripted clients, a rate limit, a traced mark, never indexed or framed
 * by another site).   ?gate=0 skips the opening   ?state=LIVE_EVENT shows the day itself   ?lang=ml switches language
 */
export default async function SpecPreview({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const q = await searchParams;
  const view = await loadSpecPreview(slug, { state: WEDDING_STATUSES.find((s) => s === q.state) });
  if (!view) notFound();
  const { ip } = await requestMeta();
  const stamp = Buffer.from(ip).toString("base64url").slice(0, 14);
  return (
    <>
      <PreviewShield mark={`${brand.name} · sample · ${stamp}`} />
      <InvitationApp view={view} initialLocale={q.lang || view.wedding.defaultLocale} skipGate={q.gate === "0"} />
      <PreviewBar start={`/start?template=${slug}&occasion=${siteTemplateBySlug(slug)?.category ?? ""}`} />
    </>
  );
}
