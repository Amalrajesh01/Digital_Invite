import Link from "next/link";
import { ArrowRight, Heart, Lock, PenLine, Send, Sparkles } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbLd, faqLd } from "@/lib/jsonld";
import { WA } from "@/lib/whatsapp";
import { categoryBySlug } from "@/domain/catalogue/categories";
import { SITE_TEMPLATES } from "@/domain/catalogue/templates";
import { LOVE_OCCASIONS, OCCASION_INFO } from "@/domain/love/constants";
import { LOVE_SPECS } from "@/domain/love/templates";
import { giftPriceText } from "@/domain/gifts/pricing";
import { LettersSection } from "@/components/site/letters/LettersSection";
import { Reel } from "@/components/site/Reel";
import { SiteButton } from "@/components/site/WaButton";
import { FaqList, FinalCta, Heading, Section } from "@/components/site/blocks";

export const metadata = pageMetadata({
  path: "/for-my-love",
  title: "Forever Letters — little experiences for the person who means everything",
  description: "Date invitations, confessions, proposals, birthday games, anniversary journeys, apologies and gentle goodbyes — each a small cinematic experience you personalise and send as one private link. By Invites, Stack Bridge Labs.",
  image: "WHNWkO1lBKU",
});
export const dynamic = "force-dynamic";

const STEPS = [
  { icon: Heart, title: "Choose an experience", body: "Fifty ways to say it: ask someone out, confess, propose, celebrate, apologise, thank — or let go." },
  { icon: PenLine, title: "Say it your way", body: "Answer a few gentle questions, or write freely. Add your photographs and a song. Use any language." },
  { icon: Sparkles, title: "See it first", body: "Watch it unfold exactly as they will, and change anything you like." },
  { icon: Send, title: "Send it privately", body: "We publish it on a link only you and they have. Pause or delete it any time." },
];

export default function ForMyLovePage() {
  const cat = categoryBySlug("for-my-love")!;
  const love = SITE_TEMPLATES.filter((t) => t.love);
  const price = giftPriceText();
  return (
    <>
      {/* ── Forever Letters: the whole catalogue ─────────────────────── */}
      <LettersSection hero />

      {/* ── what is it for ───────────────────────────────────────────── */}
      <Section tone="white">
        <Heading eyebrow="Or start from the occasion" title="For every kind of love, and every kind of sorry." lede="Whoever you are and whoever they are, there is a way to say it. Pick an occasion and we will suggest where to begin." />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOVE_OCCASIONS.map((o) => (
            <li key={o}>
              <Link href="/for-my-love/make" data-track="cta_click" data-ref={`love-occasion-${o}`} className="flex h-full flex-col rounded-2xl border border-rule-strong bg-white p-5 transition hover:-translate-y-1 hover:border-rose/50 hover:shadow-[0_20px_40px_-28px_rgba(182,50,79,.6)]">
                <span className="grid size-10 place-items-center rounded-full bg-rose-soft text-rose"><Heart className="size-4 fill-current" aria-hidden /></span>
                <span className="mt-4 font-serif text-[26px] font-medium leading-tight text-ink">{OCCASION_INFO[o].label}</span>
                <span className="mt-1 text-[15px] text-ink-2/80">{OCCASION_INFO[o].hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── five ways ────────────────────────────────────────────────── */}
      <Section tone="paper" id="five">
        <Heading eyebrow="The classics" title="Five simple ways to unfold a gift." lede="Prefer something quieter than a game? These five are the classic gifts: a story, a letter, a surprise, an apology, a day. Each opens differently and asks nothing of the person who receives it." />
        <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-5">
          {love.map((t, i) => {
            const spec = LOVE_SPECS[i];
            return (
              <li key={t.slug}>
                <Link href={t.path} data-track="cta_click" data-ref={`love-way-${t.slug}`} className="reel-card group block">
                  <div className="relative aspect-[9/19] overflow-hidden rounded-[1.6rem] border-[5px] border-ink bg-paper-2 shadow-[0_26px_44px_-28px_rgba(23,20,31,.55)] transition duration-500 group-hover:-translate-y-1.5">
                    <Reel slug={t.slug} thumb={t.thumb} alt={`${t.name}, a love gift`} className="absolute inset-0" />
                  </div>
                  <h3 className="mt-4 font-serif text-[25px] font-medium leading-tight text-ink group-hover:text-rose">{t.name}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-ink-2/85">{t.tagline}</p>
                </Link>
                <p className="mt-3 border-l-2 border-rose/40 pl-3 text-[13.5px] leading-snug text-muted"><b className="text-ink-2">They:</b> {spec.recipient}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ── how ──────────────────────────────────────────────────────── */}
      <Section tone="white">
        <Heading eyebrow="How it works" title="Four steps, about ten minutes." lede="Nothing to learn. If you can write a message, you can make a gift." />
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title}>
              <span className="grid size-12 place-items-center rounded-full bg-rose-soft text-rose"><Icon className="size-5" aria-hidden /></span>
              <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">Step {i + 1}</p>
              <h3 className="mt-1 text-[20px] font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-2/85">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <SiteButton href="/for-my-love/make" data-track="cta_click" data-ref="love-how-make">Make a gift <ArrowRight className="size-4" aria-hidden /></SiteButton>
          <p className="text-[15.5px] text-muted">{price ? <>A gift is <b className="text-ink">{price}</b>. You pay only when you publish it.</> : <>Making and previewing it is free. We share the price on WhatsApp when you send it to us.</>}</p>
        </div>
      </Section>

      {/* ── privacy ──────────────────────────────────────────────────── */}
      <Section tone="night">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Heading dark eyebrow="Privacy" title="Intimate things deserve to stay intimate." lede="Your gift is yours. Here is exactly how we protect it." />
          <ul className="grid gap-4 text-[17px] text-white/85">
            {["The link cannot be guessed, and search engines are told to ignore it.", "The WhatsApp preview shows no names and no photograph.", "Your photographs are stored privately and shown only in your gift.", "Pause the link, or delete everything, with one tap — any time.", "A gift you never send to us is deleted after 14 days.", "The person who receives it is never pushed to reply, forgive or react."].map((t) => (
              <li key={t} className="flex gap-3"><Lock className="mt-1 size-4 shrink-0 text-[#f3a5b6]" aria-hidden />{t}</li>
            ))}
            <li><Link href="/for-my-love/privacy" className="text-[15px] text-white underline underline-offset-4">Read our full privacy promise</Link></li>
          </ul>
        </div>
      </Section>

      {/* ── questions ────────────────────────────────────────────────── */}
      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Heading eyebrow="Questions" title="Before you begin." />
          <FaqList items={cat.faq} />
        </div>
      </Section>

      <FinalCta title="Make something only they will understand." body="You see it first. It stays private. You can delete it any time." message={WA.category("love gift")} primary={{ href: "/for-my-love/make", label: "Make a gift" }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "For My Love", path: "/for-my-love" }]), faqLd(cat.faq)]} />
    </>
  );
}
