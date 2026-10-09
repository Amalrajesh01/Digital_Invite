import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublicInvitation } from "@/domain/wedding/public";
import { WEDDING_STATUSES } from "@/domain/doc/constants";
import { InvitationApp } from "@/invitation/InvitationApp";
import { PreviewShield } from "@/invitation/PreviewShield";
import { requestMeta } from "@/lib/session";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Sample invitation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * A sample invitation as the template gallery shows it: the real published invitation of a demonstration wedding, framed
 * on the product site, behind the same guard as every public preview (no scripted clients, a rate limit, a traced mark
 * over everything, never indexed, never cached, never framed by another site). Only demonstration invitations can be
 * opened here — a customer’s invitation never can.
 *   ?gate=0   skip the envelope        ?state=LIVE_EVENT   see the invitation on the day itself
 */
export default async function DemoPreview({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const q = await searchParams;
  const state = WEDDING_STATUSES.find((s) => s === q.state);
  const res = await loadPublicInvitation(slug, null, { asStatus: state });
  if (!res.ok || !res.view.wedding.isDemo) notFound();
  const { ip } = await requestMeta();
  const stamp = Buffer.from(ip).toString("base64url").slice(0, 14);
  return (
    <>
      <PreviewShield mark={`${brand.name} · sample · ${stamp}`} />
      <InvitationApp view={res.view} initialLocale={q.lang || res.view.wedding.defaultLocale} skipGate={q.gate === "0"} />
    </>
  );
}
