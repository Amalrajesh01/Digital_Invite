import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SiteTemplate } from "@/domain/catalogue/templates";
import type { CategoryDef } from "@/domain/catalogue/categories";
import { priceText, type PublicPackage } from "@/domain/catalogue/pricing";
import { SiteImage } from "./SiteImage";
import { FallbackImg } from "./FallbackImg";
import { Swatches } from "./Swatches";
import { WaButton, SiteButton } from "./WaButton";
import { waLink } from "@/lib/whatsapp";

/** Layout and content blocks shared by the product site’s pages. All server components. */

export function Wrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-[76rem] px-5 sm:px-8", className)}>{children}</div>;
}

export function Section({ children, tone = "white", className, id }: { children: React.ReactNode; tone?: "white" | "paper" | "ink" | "night"; className?: string; id?: string }) {
  return (
    <section id={id} className={cn(tone === "white" && "bg-white", tone === "paper" && "bg-paper", tone === "ink" && "bg-[#0b1b35] text-white", tone === "night" && "bg-night text-white", "py-16 sm:py-20 lg:py-24", className)}>
      <Wrap>{children}</Wrap>
    </section>
  );
}

export function Heading({ eyebrow, title, lede, align = "left", as: Tag = "h2", dark, className }: { eyebrow?: string; title: React.ReactNode; lede?: React.ReactNode; align?: "left" | "center"; as?: "h1" | "h2" | "h3"; dark?: boolean; className?: string }) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow && <p className={cn("eyebrow", dark && "!text-marigold")}>{eyebrow}</p>}
      <Tag className={cn("mt-3 font-serif text-[clamp(36px,5vw,60px)] font-medium leading-[1.02] tracking-[-0.012em]", dark ? "text-white" : "text-ink")}>{title}</Tag>
      {lede && <p className={cn("mt-5 text-[18px] leading-relaxed", dark ? "text-white/75" : "text-ink-2/80", align === "center" && "mx-auto")}>{lede}</p>}
    </div>
  );
}

/**
 * One design in the gallery: a real picture of its first screen on a phone, what it is called, what style it is and
 * what colours it uses. The picture is a screenshot made from the design itself (scripts/dev/tpl.mjs), never a mock-up.
 */
export function TemplateCard({ t, priority, className }: { t: SiteTemplate; priority?: boolean; className?: string }) {
  return (
    <article className={cn("group relative", className)}>
      <Link href={t.path} className="block rounded-2xl focus-visible:outline-offset-4" aria-label={`${t.name} — ${t.styleLabel}`}>
        <div className="relative mx-auto aspect-[9/19] w-full overflow-hidden rounded-[1.7rem] border-[5px] border-ink bg-paper-2 shadow-[0_26px_44px_-28px_rgba(23,20,31,.55)] transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_40px_60px_-30px_rgba(23,20,31,.6)]">
          <FallbackImg src={t.thumb} alt={`The first screen of the ${t.name} invitation design`} width={540} height={1140} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : undefined} className="absolute inset-0 size-full object-cover object-top" />
          {t.edition && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink">Tradition edition</span>}
        </div>
        <h3 className="mt-4 font-serif text-[26px] font-medium leading-tight text-ink group-hover:text-accent">{t.name}</h3>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[14.5px] text-muted">{t.styleLabel}</p>
          <Swatches colors={t.theme.colors} className="shrink-0" />
        </div>
        <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-ink-2/80">{t.tagline}</p>
      </Link>
    </article>
  );
}

export function CategoryCard({ category, count, className }: { category: CategoryDef; count: number; className?: string }) {
  return (
    <Link href={`/templates/${category.slug}`} className={cn("group relative block overflow-hidden rounded-2xl bg-ink", className)}>
      {category.cover ? (
        <SiteImage id={category.cover} ratio="4:5" rounded={false} sizes="(max-width: 640px) 50vw, 25vw" imgClassName="opacity-95 transition-transform duration-700 group-hover:scale-[1.04]" />
      ) : (
        <div className="aspect-[4/5] bg-[radial-gradient(120%_90%_at_30%_10%,#6b3fa0,#17141f_70%)]" aria-hidden />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-[#17141f]/90 via-[#17141f]/10 to-transparent" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
        <span className="block font-serif text-[27px] font-medium leading-tight">{category.name}</span>
        <span className="mt-1 flex items-center gap-1.5 text-[13.5px] text-white/80">{count} design{count === 1 ? "" : "s"} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden /></span>
      </span>
    </Link>
  );
}

// ── the three packages ─────────────────────────────────────────────────────
/**
 * What each package is for, in plain words. Prices come from the live package rows; the lists of what is included are
 * written from the feature catalogue (docs/FEATURES.md), and nothing here promises more than the packages switch on.
 */
const PACKAGE_COPY: Record<string, { who: string; gets: string[]; without: string[] }> = {
  ESSENTIAL: {
    who: "A simple, beautiful invitation for one family, shared as a link on WhatsApp.",
    gets: ["The full design, with its opening animation", "Your story, events and a countdown", "Venue, map and parking", "Photo gallery and background music", "RSVP form and one-tap WhatsApp sharing", "Menu, colours and ritual guide"],
    without: ["A personal link for each guest", "Guest list and replies dashboard", "A wishes wall and guest photos", "Switching to a second language"],
  },
  SIGNATURE: {
    who: "A celebration where every guest matters — their name, their reply, their wishes.",
    gets: ["Everything in Essential", "A personal link with each guest’s name", "Guest list, replies dashboard and reminders", "English and your family’s language, one tap apart", "Wishes wall, guest photos and video wishes", "Stay and transport requests", "Photos, wishes and memories that stay online for life"],
    without: ["QR guest pass and check-in", "Live updates and photo wall on the day", "Games, time capsule and voice wishes"],
  },
  LUXURY: {
    who: "The whole experience — before the day, on the day, and for years after.",
    gets: ["Everything in Signature", "A QR pass for each guest and quick check-in", "Live schedule, updates and a photo wall for the venue screen", "Games, quiz and a photo scavenger hunt", "Voice wishes and a time capsule", "A memory book and anniversary memories", "Different greetings for uncles, friends and colleagues"],
    without: [],
  },
};

export function PackageCards({ packages, compact }: { packages: PublicPackage[]; compact?: boolean }) {
  return (
    <ul className="mt-12 grid gap-6 lg:grid-cols-3">
      {packages.map((p) => {
        const feature = p.key === "SIGNATURE";
        const copy = PACKAGE_COPY[p.key];
        return (
          <li key={p.key} className={cn("flex flex-col rounded-2xl border bg-white p-7 sm:p-8", feature ? "border-accent shadow-[0_28px_60px_-34px_rgba(48,86,211,.55)]" : "border-rule-strong")}>
            {feature && <p className="eyebrow">Most chosen</p>}
            <h3 className="font-serif text-[40px] font-medium leading-none text-ink">{p.name}</h3>
            <p className="mt-3 min-h-[3.2em] text-[15.5px] leading-snug text-ink-2/85">{copy?.who ?? p.blurb}</p>
            <p className="mt-6 font-serif text-[46px] font-medium leading-none text-ink tnum">{priceText(p.priceMin, p.priceMax)}</p>
            <p className="mt-1 text-[13.5px] text-muted">one-time, for each invitation</p>
            <ul className={cn("mt-6 space-y-3 text-[15px]", compact ? "mb-7" : "mb-5")}>
              {(copy?.gets ?? []).slice(0, compact ? 5 : 9).map((h) => (
                <li key={h} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /><span>{h}</span></li>
              ))}
            </ul>
            {!compact && copy?.without.length ? (
              <ul className="mb-7 space-y-2.5 border-t border-rule pt-5 text-[14.5px] text-muted">
                {copy.without.map((h) => (<li key={h} className="flex gap-3"><X className="mt-0.5 size-4 shrink-0 text-muted/70" aria-hidden /><span>{h}</span></li>))}
              </ul>
            ) : null}
            <a href={waLink(`Hi, I’d like to know more about the ${p.name} package.`)} target="_blank" rel="noopener noreferrer" data-track="cta_click" data-ref={`package-${p.key.toLowerCase()}`} className={cn("btn btn-lg mt-auto", feature ? "btn-accent" : "btn-quiet")}>Ask about {p.name}</a>
          </li>
        );
      })}
    </ul>
  );
}

export function Steps({ items, dark }: { items: { title: string; body: string }[]; dark?: boolean }) {
  return (
    <ol className="grid gap-x-10 gap-y-10 md:grid-cols-5">
      {items.map((s, i) => (
        <li key={s.title} className="relative">
          <p className={cn("font-serif text-[64px] font-light leading-none", dark ? "text-marigold/50" : "text-accent/25")} aria-hidden>{String(i + 1).padStart(2, "0")}</p>
          <h3 className={cn("mt-2 text-[19px] font-semibold", dark ? "text-white" : "text-ink")}>{s.title}</h3>
          <p className={cn("mt-2 text-[15px] leading-relaxed", dark ? "text-white/70" : "text-ink-2/80")}>{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export const HOW_IT_WORKS = [
  { title: "Choose your design", body: "Open any design the way your guests will, and pick the one that feels like your celebration." },
  { title: "Tell us the details", body: "Names, date, place and a few photographs — on WhatsApp or in a short form. That is all we need." },
  { title: "See it first", body: "We send you a private preview with your details in it. Ask for changes until it is exactly right." },
  { title: "Share it", body: "Send one link on WhatsApp, or print a QR code on your card. Nothing for guests to install." },
  { title: "Watch the replies", body: "See who is coming, read their wishes, and keep the photographs and memories afterwards." },
];

export function FaqList({ items, className }: { items: { q: string; a: string }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-rule-strong border-y border-rule-strong", className)}>
      {items.map((f) => (
        <details key={f.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[18px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden className="mt-1 grid size-6 shrink-0 place-items-center rounded-full border border-rule-strong text-[16px] leading-none text-accent transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 max-w-3xl text-[16.5px] leading-relaxed text-ink-2/85">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/** The closing call to action of a page: ask on WhatsApp, or start the short form. */
export function FinalCta({ title, body, message, primary }: { title: string; body: string; message: string; primary?: { href: string; label: string } }) {
  return (
    <Section tone="night" className="text-center">
      <h2 className="mx-auto max-w-3xl font-serif text-[clamp(38px,5.4vw,66px)] font-medium leading-[1.02] text-white">{title}</h2>
      <p className="mx-auto mt-5 max-w-xl text-[18px] text-white/75">{body}</p>
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {primary && <SiteButton href={primary.href} variant="light" data-track="cta_click" data-ref="final-primary">{primary.label} <ArrowRight className="size-4" aria-hidden /></SiteButton>}
        <WaButton message={message} variant="solid">Chat with us on WhatsApp</WaButton>
      </div>
    </Section>
  );
}

export { Swatches };
export { priceText } from "@/domain/catalogue/pricing";
export { inr } from "@/domain/catalogue/pricing";
