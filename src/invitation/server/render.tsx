import { cache } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicInvitation, type LoadResult } from "@/domain/wedding/public";
import { WEDDING_STATUSES } from "@/domain/doc/constants";
import { InvitationApp } from "@/invitation/InvitationApp";
import { brand } from "@/lib/brand";
import { absoluteUrl } from "@/lib/site";
import { env } from "@/lib/env";
import { linkPreview, personalPreviewTitle } from "@/domain/wedding/link-preview";
import { firstNameOf } from "@/domain/guests/personalize";

export const loadInvite = cache((slug: string, token: string | null, state: string | null = null) =>
  loadPublicInvitation(slug, token, { asStatus: WEDDING_STATUSES.find((x) => x === state) }),
);

const REASONS: Record<Exclude<LoadResult extends infer R ? (R extends { ok: false; reason: infer X } ? X : never) : never, never>, { title: string; body: string }> = {
  not_found: { title: "We couldn’t find this invitation", body: "The link may be mistyped. Please check with the family and try again." },
  unpublished: { title: "This invitation isn’t live yet", body: "The family is still putting the finishing touches on it. Please check back soon." },
  invite_required: { title: "This is a private invitation", body: "Please open the personal link the family sent you — it has your name on it." },
  invalid_invite: { title: "This link isn’t valid any more", body: "Your personal link may have been replaced. Please ask the family to send you a fresh one." },
};

export async function inviteMetadata(slug: string, token: string | null, state: string | null = null): Promise<Metadata> {
  const res = await loadInvite(slug, token, state);
  if (!res.ok) return { title: "Invitation", robots: { index: false, follow: false } };
  const { view } = res;
  // A love gift is private: no names, no photograph in the link preview, and never indexed or archived.
  if (view.doc.eventType === "love_gift") {
    const title = view.wedding.isDemo ? "A sample love gift" : "A gift for you";
    return { title, description: "Someone made this for you.", metadataBase: new URL(env.appUrl), robots: { index: false, follow: false, noarchive: true, nosnippet: true }, referrer: "no-referrer", openGraph: { type: "website", title, description: "Someone made this for you.", siteName: brand.name }, twitter: { card: "summary", title } };
  }
  const loc = view.wedding.defaultLocale;
  const preview = linkPreview(view.doc, view.wedding.title, view.wedding.weddingDate, loc);
  const { description } = preview;
  // Luxury: the preview of a personal link greets the guest by name and carries a card made for them (see /api/og).
  const personal = !!(token && view.guest && !view.guest.isPreview && view.entitlements.features.includes("personal_touch"));
  const shown = view.guest && loc.toLowerCase() !== "en" && view.guest.nameLocal.trim() ? view.guest.nameLocal.trim() : view.guest?.name ?? "";
  const title = personal ? personalPreviewTitle(firstNameOf(shown), view.wedding.title, loc) : preview.title;
  const image = personal ? `${env.appUrl}/api/og/${encodeURIComponent(slug)}/${encodeURIComponent(token!)}` : view.urls.ogImage ? new URL(view.urls.ogImage, env.appUrl).toString() : undefined;
  return {
    title,
    description,
    metadataBase: new URL(env.appUrl),
    alternates: { canonical: view.urls.canonical },
    // A personalised link must never be indexed or cached by search engines; neither should a sample invitation of ours.
    robots: token || view.mode === "preview" || view.wedding.isDemo ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { type: "website", title, description, url: view.urls.canonical, siteName: view.wedding.title, images: image ? [{ url: image, width: 1200, height: 630 }] : undefined, locale: "en_IN" },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

export async function InviteScreen({ slug, token, skipGate, state }: { slug: string; token: string | null; skipGate?: boolean; state?: string | null }) {
  const res = await loadInvite(slug, token, state ?? null);
  if (!res.ok) {
    if (res.reason === "not_found") notFound();
    const r = REASONS[res.reason];
    return (
      <main className="grid min-h-dvh place-items-center bg-[#f5f7fb] px-6 text-center text-[#0b1b35]">
        <div className="max-w-md">
          <img src="/brand/mark.png" alt="" aria-hidden className="mx-auto size-14 object-contain" />
          <h1 className="mt-5 text-[2rem] leading-tight" style={{ fontFamily: "var(--font-ui), system-ui, sans-serif", fontWeight: 650, letterSpacing: "-0.02em" }}>{r.title}</h1>
          <p className="mt-3 text-[#667085]">{r.body}</p>
          <p className="mt-10 text-sm text-[#667085]"><Link href={absoluteUrl("/")} className="underline underline-offset-4">{brand.name}</Link></p>
        </div>
      </main>
    );
  }
  const jar = await cookies();
  const initialLocale = jar.get("inv_lang")?.value || res.view.guest?.preferredLocale || res.view.wedding.defaultLocale;
  return (
    <>
      <InvitationApp view={res.view} initialLocale={initialLocale} skipGate={skipGate} />
    </>
  );
}
