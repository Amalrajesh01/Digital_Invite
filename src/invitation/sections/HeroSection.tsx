"use client";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import { LIFECYCLE_HEADLINE } from "@/domain/wedding/lifecycle";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Parallax, Reveal, RevealWords, useCountdown } from "../engine/motion";
import { KasavuBand, Rosette, Divider } from "../engine/Ornament";
import { fmtDate } from "../engine/format";
import { eventStart } from "../engine/format";
import { useCoupleNames } from "../opening/Gate";
import { ChevronDown } from "lucide-react";

function useHeroData(section: SectionConfig) {
  const { view, L, t, locale, entered } = useInvitation();
  const names = useCoupleNames();
  const doc = view.doc;
  const main = doc.events.find((e) => e.isMain) ?? doc.events[0];
  const venue = doc.venues.find((v) => v.id === main?.venueId) ?? doc.venues[0];
  const date = main?.date || view.wedding.weddingDate || "";
  const content = section.content as Record<string, string | undefined>;
  const galleryFirst = view.gallery[0]?.items[0]?.id;
  const bg = content.background || galleryFirst || doc.couple.bride.photo || doc.couple.groom.photo;
  const eyebrowKey = LIFECYCLE_HEADLINE[view.wedding.status];
  const status = view.wedding.status;
  const eyebrow = status === "ANNIVERSARY" && view.wedding.yearsTogether > 1 ? t("anniv.years", { n: view.wedding.yearsTogether }) : t(eyebrowKey as never);
  const target = main ? eventStart(main, view.wedding.timezone) : null;
  return {
    names, bg, date, dateText: date ? fmtDate(date, locale, "long") : "", shortDate: date ? fmtDate(date, locale, "monthDay") + ", " + date.slice(0, 4) : "",
    venueName: venue ? L(venue.name) : "", city: venue ? L(venue.city) : "", tagline: L(doc.couple.tagline), invitation: L(doc.couple.invitation) || t("invite.together"),
    eyebrow, entered, locale, video: content.video, target, hashtag: doc.couple.hashtag, settings: section.settings,
  };
}

function MiniCountdown({ target, className }: { target: Date | null; className?: string }) {
  const { t } = useInvitation();
  const c = useCountdown(target);
  if (!c) return <span className={className}>&nbsp;</span>;
  if (c.done) return <span className={className}>{t("countdown.today")}</span>;
  return (
    <span className={cn("inv-num", className)} aria-live="off">
      {c.days} {t("countdown.days")} · {c.hours} {t("countdown.hours")} · {c.minutes} {t("countdown.minutes")}
    </span>
  );
}

function ScrollCue({ light }: { light?: boolean }) {
  const { t } = useInvitation();
  return (
    <a href="#s-couple" aria-label={t("invite.scroll")} className={cn("mx-auto mt-10 flex flex-col items-center gap-2 text-[0.68rem] uppercase tracking-[0.3em] no-underline opacity-70 transition-opacity hover:opacity-100", light ? "text-white" : "text-[var(--c-primary)]")}>
      <span>{t("invite.scroll")}</span>
      <ChevronDown className="size-4 animate-[inv-float_2.4s_ease-in-out_infinite]" />
    </a>
  );
}

function Arch({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="relative isolate overflow-hidden inv-decor-bg">
      <Rosette className="pointer-events-none absolute left-1/2 top-[38%] -z-10 w-[130vw] max-w-[62rem] -translate-x-1/2 -translate-y-1/2 text-[var(--c-accent)] opacity-[0.16]" />
      <KasavuBand thick className="absolute inset-x-0 top-0" />
      <div className="inv-wrap flex min-h-[100svh] flex-col items-center justify-center pb-14 pt-20 text-center">
        <Reveal variant="fade"><p className="inv-eyebrow">{h.eyebrow}</p></Reveal>
        <Reveal delay={120}><p className="inv-script mt-3 text-[clamp(1.4rem,5.5vw,2rem)] text-[var(--c-accent)]">{h.invitation}</p></Reveal>
        <Reveal variant="mask" delay={200} className="mt-7">
          <div className="inv-arch inv-frame relative w-[min(66vw,17.5rem)] md:w-[19rem]">
            <Photo id={h.bg} priority ratio="aspect-[3/4]" className="inv-arch" seed={3} sizes="(max-width: 768px) 66vw, 320px" />
          </div>
        </Reveal>
        <h1 className="mt-9 flex flex-col items-center gap-0 leading-none">
          <RevealWords as="div" text={h.names.a} className="inv-display" delay={300} />
          <span className="inv-script -my-1 text-[clamp(2.4rem,9vw,4rem)] text-[var(--c-accent)]" aria-hidden>&amp;</span>
          <RevealWords as="div" text={h.names.b} className="inv-display" delay={450} />
        </h1>
        <Reveal delay={500}>
          <Divider kind="ornament" className="mt-4" />
          <p className="inv-num text-[clamp(1.2rem,4.5vw,1.6rem)] tracking-[0.06em]">{h.dateText}</p>
          {(h.venueName || h.city) && <p className="inv-muted mt-1 text-[0.98rem]">{[h.venueName, h.city].filter(Boolean).join(" · ")}</p>}
          {h.settings.showCountdown !== false && <p className="mt-4 text-[0.9rem] text-[var(--c-primary)]"><MiniCountdown target={h.target} /></p>}
        </Reveal>
        <ScrollCue />
      </div>
    </header>
  );
}

function FullBleed({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { media, reducedMotion } = useInvitation();
  const vid = media(h.video);
  return (
    <header data-section="hero" id="s-hero" className="inv-night relative isolate min-h-[100svh] overflow-hidden text-white" style={{ color: "#fff" }}>
      <div className="absolute inset-0 -z-10">
        {vid && vid.kind === "VIDEO" && !reducedMotion ? (
          <video src={vid.url} autoPlay muted loop playsInline poster={media(h.bg)?.url} className="h-full w-full object-cover" />
        ) : (
          <Parallax amount={70} className="h-full w-full">
            <Photo id={h.bg} priority className="h-full w-full" seed={1} sizes="100vw" />
          </Parallax>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,5,4,.55)_0%,rgba(6,5,4,.08)_30%,rgba(6,5,4,.55)_62%,rgba(6,5,4,.92)_100%)]" />
      </div>
      <div className="inv-wrap relative flex min-h-[100svh] flex-col justify-between pb-14 pt-20 md:pb-20">
        <div className="flex items-start justify-between gap-6">
          <Reveal variant="fade"><p className="inv-eyebrow !text-white/85">{h.eyebrow}</p></Reveal>
          <Reveal variant="fade" delay={200}><p className="inv-num hidden text-right text-sm text-white/80 md:block">{h.shortDate}</p></Reveal>
        </div>
        <div>
          <h1 className="leading-[0.86]">
            <RevealWords as="div" text={h.names.a} className="inv-display !text-[clamp(3.6rem,19vw,12rem)]" delay={200} />
            <RevealWords as="div" text={`${"&"} ${h.names.b}`} className="inv-display !text-[clamp(3.6rem,19vw,12rem)]" delay={420} />
          </h1>
          <Reveal delay={650} className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-t border-white/25 pt-5">
            <div>
              <p className="inv-num text-[clamp(1.15rem,4.6vw,1.6rem)]">{h.dateText}</p>
              {(h.venueName || h.city) && <p className="mt-0.5 text-[0.95rem] text-white/75">{[h.venueName, h.city].filter(Boolean).join(" · ")}</p>}
            </div>
            {h.settings.showCountdown !== false && <p className="text-[0.92rem] text-white/85"><MiniCountdown target={h.target} /></p>}
          </Reveal>
        </div>
      </div>
    </header>
  );
}

function Split({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="relative isolate overflow-hidden">
      <div className="inv-wrap grid min-h-[100svh] items-stretch gap-0 pt-6 md:grid-cols-12 md:gap-10 md:py-10">
        <div className="order-2 flex flex-col justify-end pb-12 pt-8 md:order-1 md:col-span-7 md:pb-8 md:pt-0">
          <Reveal variant="fade" className="flex items-center gap-4"><span className="h-px w-10 bg-[var(--c-primary)]" /><p className="inv-eyebrow">{h.eyebrow}</p></Reveal>
          <h1 className="mt-6 leading-[0.88]">
            <RevealWords as="div" text={h.names.a} className="inv-display !text-[clamp(3.8rem,17vw,10.5rem)]" delay={100} />
            <div className="flex items-baseline gap-4">
              <span className="inv-script text-[clamp(2.6rem,10vw,5rem)] text-[var(--c-accent)]" aria-hidden>&amp;</span>
              <RevealWords as="div" text={h.names.b} className="inv-display !text-[clamp(3.8rem,17vw,10.5rem)]" delay={300} />
            </div>
          </h1>
          <Reveal delay={450} className="mt-10 grid max-w-xl grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-[var(--c-border)] pt-6">
            <p className="inv-eyebrow self-center">{fmtDate(h.date, h.locale, "weekday")}</p>
            <p className="inv-num text-xl">{fmtDate(h.date, h.locale, "short")}</p>
            {(h.venueName || h.city) && (<><p className="inv-eyebrow self-center">·</p><p className="inv-muted">{[h.venueName, h.city].filter(Boolean).join(", ")}</p></>)}
            {h.tagline && (<p className="col-span-2 mt-2 max-w-md text-[1.02rem] text-[var(--c-muted)]" style={{ fontFamily: "var(--f-heading)" }}>{h.tagline}</p>)}
          </Reveal>
        </div>
        <div className="order-1 md:order-2 md:col-span-5">
          <Reveal variant="mask" className="relative h-full min-h-[62svh] md:min-h-0">
            <Photo id={h.bg} priority className="absolute inset-0 h-full w-full" seed={5} sizes="(max-width: 768px) 100vw, 480px" />
            <div className="absolute bottom-3 left-3 bg-[var(--c-bg)] px-3 py-1.5"><p className="inv-eyebrow !text-[0.62rem]">{h.shortDate}</p></div>
          </Reveal>
        </div>
      </div>
    </header>
  );
}

function Centered({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="relative isolate overflow-hidden">
      <div className="inv-wrap flex min-h-[100svh] flex-col items-center justify-center py-20 text-center">
        <Reveal variant="fade"><p className="inv-eyebrow">{h.eyebrow}</p></Reveal>
        <Reveal delay={100} className="mt-8"><Photo id={h.bg} priority className="size-[8.5rem] rounded-full ring-1 ring-[var(--c-border)] ring-offset-8 ring-offset-[var(--c-bg)] md:size-40" seed={2} sizes="160px" /></Reveal>
        <h1 className="mt-9 leading-[0.95]">
          <RevealWords as="div" text={h.names.a} className="inv-display !text-[clamp(2.8rem,12vw,6rem)]" delay={150} />
          <span className="inv-script my-1 block text-[clamp(1.8rem,7vw,3rem)] text-[var(--c-accent)]" aria-hidden>&amp;</span>
          <RevealWords as="div" text={h.names.b} className="inv-display !text-[clamp(2.8rem,12vw,6rem)]" delay={300} />
        </h1>
        <Reveal delay={400}>
          <div className="mx-auto my-7 h-px w-16 bg-[var(--c-accent)]" />
          <p className="inv-num text-[1.2rem] tracking-[0.12em]">{h.dateText}</p>
          {(h.venueName || h.city) && <p className="inv-muted mt-1">{[h.venueName, h.city].filter(Boolean).join(" · ")}</p>}
          {h.tagline && <p className="inv-lede mx-auto mt-6">{h.tagline}</p>}
        </Reveal>
        <ScrollCue />
      </div>
    </header>
  );
}

export default function HeroSection({ section }: { section: SectionConfig }) {
  switch (section.variant) {
    case "fullbleed": return <FullBleed section={section} />;
    case "split": return <Split section={section} />;
    case "centered": return <Centered section={section} />;
    default: return <Arch section={section} />;
  }
}
