import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { primaryCategory, themeOf, demoNumber, type DemoDef } from "@/domain/catalogue/demos";
import { categoryBySlug, type CategoryDef } from "@/domain/catalogue/categories";
import { inr, priceText, type PublicPackage } from "@/domain/catalogue/pricing";
import { SiteImage } from "./SiteImage";
import { WaButton, SiteButton } from "./WaButton";
import { waLink } from "@/lib/whatsapp";

/** Layout and content blocks shared by the product site’s pages. All server components. */

export function Wrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-[76rem] px-5 sm:px-8", className)}>{children}</div>;
}

export function Section({ children, tone = "white", className, id }: { children: React.ReactNode; tone?: "white" | "paper" | "ink"; className?: string; id?: string }) {
  return (
    <section id={id} className={cn(tone === "white" && "bg-white", tone === "paper" && "bg-paper", tone === "ink" && "bg-[#0b1b35] text-white", "py-16 sm:py-20 lg:py-24", className)}>
      <Wrap>{children}</Wrap>
    </section>
  );
}

export function Heading({ eyebrow, title, lede, align = "left", as: Tag = "h2", dark, className }: { eyebrow?: string; title: React.ReactNode; lede?: React.ReactNode; align?: "left" | "center"; as?: "h1" | "h2" | "h3"; dark?: boolean; className?: string }) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow && <p className={cn("eyebrow", dark && "!text-white/60")}>{eyebrow}</p>}
      <Tag className={cn("mt-3 font-serif text-[clamp(34px,4.6vw,56px)] font-medium leading-[1.04] tracking-[-0.01em]", dark ? "text-white" : "text-ink")}>{title}</Tag>
      {lede && <p className={cn("mt-5 text-[17.5px] leading-relaxed", dark ? "text-white/75" : "text-ink-2/80", align === "center" && "mx-auto")}>{lede}</p>}
    </div>
  );
}

/** Four colour dots from a theme: paper, ink, accent and the deep “night” colour. */
export function Swatches({ demo, className }: { demo: DemoDef; className?: string }) {
  const c = themeOf(demo)?.tokens.colors;
  if (!c) return null;
  return (
    <span className={cn("flex items-center gap-1.5", className)} aria-hidden>
      {[c.background, c.primary, c.accent, c.inverse].map((hex, i) => (
        <span key={i} className="size-3.5 rounded-full border border-black/15" style={{ background: hex }} />
      ))}
    </span>
  );
}

export function templatePath(d: DemoDef) {
  return `/templates/${primaryCategory(d)}/${d.slug}`;
}

/** One sample invitation on the gallery: its photograph, its name, what it is for, its colours. */
export function TemplateCard({ demo, priority, sizes }: { demo: DemoDef; priority?: boolean; sizes?: string }) {
  const cat = categoryBySlug(primaryCategory(demo));
  return (
    <article className="group relative">
      <Link href={templatePath(demo)} className="block rounded-lg focus-visible:outline-offset-4" aria-label={`${demo.title} — ${demo.name}`}>
        <div className="relative overflow-hidden rounded-lg shadow-[0_1px_0_rgba(11,27,53,.04),0_18px_40px_-26px_rgba(11,27,53,.4)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_30px_60px_-30px_rgba(11,27,53,.5)]">
          <SiteImage id={demo.cover} ratio="4:5" priority={priority} sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"} rounded={false} imgClassName="transition-transform duration-700 group-hover:scale-[1.03]" />
          <span className="absolute left-3.5 top-3 font-serif text-[22px] leading-none text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,.5)]" aria-hidden>{demoNumber(demo)}</span>
          <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" aria-hidden />
          {cat && <span className="absolute bottom-3 left-3.5 rounded-full bg-white/90 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink">{cat.name}</span>}
        </div>
        <h3 className="mt-4 font-serif text-[27px] font-medium leading-tight text-ink group-hover:text-accent">{demo.title}</h3>
        <div className="mt-1 flex items-center justify-between gap-4">
          <p className="min-w-0 truncate text-[14.5px] text-muted">{demo.name} · {demo.when}</p>
          <Swatches demo={demo} className="shrink-0" />
        </div>
        <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-ink-2/80">{demo.tagline}</p>
      </Link>
    </article>
  );
}

export function CategoryCard({ category, count, className, size = "sm" }: { category: CategoryDef; count: number; className?: string; size?: "sm" | "lg" }) {
  return (
    <Link href={`/templates/${category.slug}`} className={cn("group relative block overflow-hidden rounded-lg bg-[#0b1b35]", className)}>
      {category.cover ? (
        <SiteImage id={category.cover} ratio={size === "lg" ? "4:5" : "4:5"} rounded={false} sizes="(max-width: 640px) 50vw, 25vw" imgClassName="opacity-90 transition-transform duration-700 group-hover:scale-[1.04]" />
      ) : (
        <div className="aspect-[4/5] bg-[radial-gradient(120%_90%_at_30%_10%,#3b57b8,#0b1b35_70%)]" aria-hidden />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-[#0b1b35]/85 via-[#0b1b35]/10 to-transparent" aria-hidden />
      {!category.cover && <span className="absolute right-4 top-3 font-serif text-[88px] leading-none text-white/15" aria-hidden>{category.name[0]}</span>}
      <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
        <span className="block font-serif text-[26px] font-medium leading-tight">{category.name}</span>
        <span className="mt-1 block text-[13.5px] text-white/75">{count > 0 ? `${count} sample${count === 1 ? "" : "s"}` : "Designed on request"}</span>
      </span>
    </Link>
  );
}

const HIGHLIGHTS: Record<string, string[]> = {
  ESSENTIAL: ["Opening animation, story, programme and venue", "Photo gallery and background music", "One shareable link, RSVP and WhatsApp sharing", "English + one local language"],
  SIGNATURE: ["Everything in Essential", "A personal link for every guest, with their name", "A guest dashboard: RSVPs, meals and wishes", "Guests share photos, video and voice wishes", "Accommodation and transport requests"],
  LUXURY: ["Everything in Signature", "QR pass for each guest and fast check-in", "Live event mode and a projector photo wall", "Games, quiz and a time capsule", "Memory book and anniversary memories, kept for life"],
};

/** The three packages, from the live prices. */
export function PackageCards({ packages, compact }: { packages: PublicPackage[]; compact?: boolean }) {
  return (
    <ul className="mt-12 grid gap-6 lg:grid-cols-3">
      {packages.map((p) => {
        const feature = p.key === "SIGNATURE";
        return (
          <li key={p.key} className={cn("flex flex-col rounded-xl border bg-white p-7 sm:p-8", feature ? "border-accent shadow-[0_28px_60px_-34px_rgba(48,86,211,.55)]" : "border-rule-strong")}>
            {feature && <p className="eyebrow !text-accent">Most chosen</p>}
            <h3 className="font-serif text-[38px] font-medium leading-none text-ink">{p.name}</h3>
            <p className="mt-2 text-[14.5px] text-muted">{p.tagline}</p>
            <p className="mt-6 font-serif text-[44px] font-medium leading-none text-ink tnum">{priceText(p.priceMin, p.priceMax)}</p>
            <p className="mt-1 text-[13px] text-muted">per invitation · one-time</p>
            <ul className={cn("mt-6 space-y-3 text-[15px]", compact ? "mb-7" : "mb-8")}>
              {(HIGHLIGHTS[p.key] ?? [p.blurb]).slice(0, compact ? 4 : 6).map((h) => (
                <li key={h} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /><span>{h}</span></li>
              ))}
            </ul>
            <a href={waLink(`Hi, I’d like to know more about the ${p.name} package.`)} target="_blank" rel="noopener noreferrer" className={cn("btn btn-lg mt-auto", feature ? "btn-accent" : "btn-quiet")}>Ask about {p.name}</a>
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
          <p className={cn("font-serif text-[64px] font-light leading-none", dark ? "text-white/25" : "text-accent/25")} aria-hidden>{String(i + 1).padStart(2, "0")}</p>
          <h3 className={cn("mt-2 text-[19px] font-semibold", dark ? "text-white" : "text-ink")}>{s.title}</h3>
          <p className={cn("mt-2 text-[15px] leading-relaxed", dark ? "text-white/70" : "text-ink-2/80")}>{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export const HOW_IT_WORKS = [
  { title: "Choose a template", body: "Browse the samples, open any of them as a guest would, and pick the one that feels like your occasion." },
  { title: "Share your details", body: "Message us on WhatsApp with the names, date, venue and a few photographs. We ask only for what the invitation needs." },
  { title: "We design it with you", body: "We set your words, your photographs and your language into the template and send you a private preview with your names on it." },
  { title: "Publish and share", body: "Approve it, and it goes live on its own link. Share it on WhatsApp, in a group, or as a QR code on a printed card." },
  { title: "Track replies, keep the memories", body: "Watch RSVPs arrive, collect wishes and photographs — and keep the whole thing afterwards as a keepsake." },
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
          <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-ink-2/85">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/** The closing call to action of a page. */
export function FinalCta({ title, body, message, primary }: { title: string; body: string; message: string; primary?: { href: string; label: string } }) {
  return (
    <Section tone="ink" className="text-center">
      <h2 className="mx-auto max-w-3xl font-serif text-[clamp(36px,5vw,64px)] font-medium leading-[1.04] text-white">{title}</h2>
      <p className="mx-auto mt-5 max-w-xl text-[17.5px] text-white/75">{body}</p>
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <WaButton message={message} variant="light">Talk to us on WhatsApp</WaButton>
        {primary && <SiteButton href={primary.href} variant="quiet" className="!border-white/30 !text-white hover:!bg-white/10">{primary.label} <ArrowRight className="size-4" aria-hidden /></SiteButton>}
      </div>
    </Section>
  );
}

export { inr };
