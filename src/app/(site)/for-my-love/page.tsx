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
import { SiteImage } from "@/components/site/SiteImage";
import { Reel } from "@/components/site/Reel";
import { SiteButton } from "@/components/site/WaButton";
import { FaqList, FinalCta, Heading, Section, Wrap } from "@/components/site/blocks";

export const metadata = pageMetadata({
  path: "/for-my-love",
  title: "For My Love — a private gift for someone you love",
  description: "Make a private digital gift: a birthday surprise, a love letter, an anniversary story or a sincere apology. Your photographs, your words, your song, on a link only they can open.",
  image: "WHNWkO1lBKU",
});
export const dynamic = "force-dynamic";

const STEPS = [
  { icon: Heart, title: "Choose what it is for", body: "A birthday, an anniversary, a proposal, an apology — or just because." },
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
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-night text-white">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_10%,rgba(214,86,120,.35),transparent_60%),radial-gradient(60%_50%_at_0%_100%,rgba(228,160,50,.2),transparent_60%)]" />
        <Wrap className="relative grid items-center gap-12 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="eyebrow !text-[#f3a5b6]"><Heart className="mr-1.5 inline size-3.5 fill-current" aria-hidden />For My Love</p>
            <h1 className="mt-5 font-serif text-[clamp(46px,7vw,92px)] font-medium leading-[0.98] tracking-[-0.015em]">Say it in a way they will <em className="italic text-[#f6b6c4]">keep.</em></h1>
            <p className="mt-6 max-w-lg text-[clamp(18px,2vw,21px)] leading-relaxed text-white/80">A private gift for the person you love — a birthday surprise, a letter, the story of you two, or an honest apology. Your words, your photographs, your song, on a link only they can open.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <SiteButton href="/for-my-love/make" variant="light" data-track="cta_click" data-ref="love-hero-make">Make a gift <ArrowRight className="size-4" aria-hidden /></SiteButton>
              <a href="#five" className="btn btn-lg border-white/30 text-white hover:bg-white/10" data-track="cta_click" data-ref="love-hero-five">See the five ways</a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-[15px] text-white/70"><Lock className="size-4" aria-hidden /> Private by design. You see it first, and you can delete it any time.</p>
          </div>
          <div className="relative mx-auto grid w-full max-w-[32rem] grid-cols-2 gap-3">
            <SiteImage id="WHNWkO1lBKU" ratio="3:4" priority rounded={false} className="rounded-t-[999px] rounded-b-2xl" sizes="(max-width: 1024px) 45vw, 260px" />
            <div className="mt-10 grid gap-3">
              <SiteImage id="nBFagEIwy0o" ratio="1:1" rounded={false} className="rounded-2xl" sizes="(max-width: 1024px) 45vw, 260px" />
              <SiteImage id="AD3k4pko7wo" ratio="4:5" rounded={false} className="rounded-2xl" sizes="(max-width: 1024px) 45vw, 260px" />
            </div>
          </div>
        </Wrap>
      </section>

      {/* ── what is it for ───────────────────────────────────────────── */}
      <Section tone="white">
        <Heading eyebrow="What is it for?" title="For every kind of love, and every kind of sorry." lede="Whoever you are and whoever they are, there is a way to say it." />
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
        <Heading eyebrow="Five ways to unfold it" title="Not one page in five colours — five different experiences." lede="Each opens differently, moves differently and asks something different of the person who receives it. Open a sample and see." />
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
