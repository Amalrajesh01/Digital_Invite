"use client";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import { toneOf } from "@/domain/doc/event-types";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal, RevealWords } from "../engine/motion";
import { fmtDate } from "../engine/format";
import ClassicHero, { MiniCountdown, ScrollCue, goNext, useHeroData, type HeroData } from "./HeroSection";

/**
 * More ways to begin. The four classic openings (full-screen photograph, arch, editorial split, centred) live in
 * HeroSection; these six are different compositions, not recolours: a film frame between black bars, a typographic
 * poster, a botanical garden, a table of snapshots, a carved gateway and a giant number with the photograph inside it.
 */

const place = (h: HeroData) => [h.venueName, h.city].filter(Boolean).join(" · ");

// ── REEL: a film frame between two black bars ───────────────────────────────────────────────────────────
function Reel({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { t } = useInvitation();
  return (
    <header data-section="hero" id="s-hero" className="hv hv-reel">
      <div className="reel-bar"><span>{h.names.isCouple ? h.eyebrow : h.invitation}</span><span className="inv-num">{h.shortDate}</span></div>
      <div className="reel-stage">
        <Photo id={h.bg} wideId={h.wide} priority className="reel-photo" seed={1} sizes="100vw" />
        <div className="reel-shade" />
        <div className="reel-copy">
          <h1 className="reel-title" data-len={h.size}>
            <RevealWords as="span" text={h.names.a} className="reel-name" delay={300} />
            {h.names.isCouple && <><span className="reel-and" aria-hidden>{t("invite.and")}</span><RevealWords as="span" text={h.names.b} className="reel-name" delay={520} /></>}
          </h1>
          {h.phrase && <Reveal delay={800}><p className="reel-phrase">{h.phrase}</p></Reveal>}
        </div>
      </div>
      <div className="reel-bar">
        <span>{place(h) || h.dateText}</span>
        <a href="#main" onClick={goNext} className="reel-cue" aria-label={t("invite.scroll")}><span>{t("invite.scroll")}</span><i aria-hidden /></a>
      </div>
    </header>
  );
}

// ── POSTER: type first, the photograph as a band ────────────────────────────────────────────────────────
function Poster({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { t } = useInvitation();
  return (
    <header data-section="hero" id="s-hero" className="hv hv-poster">
      <div className="inv-wrap">
        <Reveal variant="fade" className="poster-meta"><span>{h.names.isCouple ? h.eyebrow : h.invitation}</span><span className="inv-num">{h.dateLabel || h.shortDate}</span></Reveal>
        <h1 className="poster-names" data-len={h.size} data-couple={h.names.isCouple}>
          <RevealWords as="span" text={h.names.a} className="poster-name" delay={120} />
          {h.names.isCouple && <><span className="poster-amp" aria-hidden>{t("invite.and")}</span><RevealWords as="span" text={h.names.b} className="poster-name" delay={300} /></>}
        </h1>
        <Reveal variant="mask" delay={200} className="poster-photo">
          <Photo id={h.bg} wideId={h.wide} priority className="absolute inset-0 h-full w-full" seed={4} sizes="(max-width: 900px) 100vw, 1100px" />
          {h.dots.length === 3 && <span className="poster-date inv-num" aria-label={h.dateText}>{h.dots[0]}<i>/</i>{h.dots[1]}<i>/</i>{h.dots[2].slice(-2)}</span>}
        </Reveal>
        <Reveal variant="fade" delay={500} className="poster-meta poster-foot">
          <span>{place(h) || h.phrase}</span>
          <a href="#main" onClick={goNext} aria-label={t("invite.scroll")}>{t("invite.scroll")} ↓</a>
        </Reveal>
      </div>
    </header>
  );
}

// ── GARDEN: an oval portrait in a wreath of leaves ──────────────────────────────────────────────────────
/** A leafy stem with a few blossoms, drawn from a curve so every sprig is a little different. Decorative only. */
export function Sprig({ className, seed = 0 }: { className?: string; seed?: number }) {
  const P = [[8, 214], [64, 168 - seed * 6], [96, 112], [150, 66], [212, 18]] as const;
  const bez = (t: number) => {
    const [p0, p1, p2, p3] = [P[0], P[1], P[3], P[4]];
    const u = 1 - t;
    const x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0];
    const y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1];
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI };
  };
  const leaves = Array.from({ length: 9 }, (_, i) => ({ ...bez(0.1 + i * 0.1), side: i % 2 ? 1 : -1, s: 1 - i * 0.04 }));
  const blooms = [0.36, 0.62, 0.9].map((t) => bez(t));
  return (
    <svg viewBox="0 0 220 230" className={cn("hv-sprig", className)} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden>
      <path d={`M${P[0]} C${P[1]} ${P[3]} ${P[4]}`.replace(/,/g, " ")} />
      {leaves.map((l, i) => (
        <path key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.a + l.side * 52}) scale(${l.s})`} d="M0 0 C6 -9 18 -11 28 -3 C18 6 6 8 0 0z" fill="currentColor" fillOpacity="0.16" />
      ))}
      {blooms.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) scale(${0.9 - i * 0.12})`}>
          {Array.from({ length: 5 }).map((_, k) => <ellipse key={k} cx="0" cy="-8" rx="4.6" ry="8" transform={`rotate(${k * 72})`} fill="currentColor" fillOpacity="0.12" />)}
          <circle r="2.2" fill="currentColor" stroke="none" fillOpacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

function Garden({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { t } = useInvitation();
  return (
    <header data-section="hero" id="s-hero" className="hv hv-garden">
      <Sprig className="garden-sprig tl" seed={0} />
      <Sprig className="garden-sprig br" seed={2} />
      <div className="garden-petals" aria-hidden>{Array.from({ length: 9 }).map((_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</div>
      <div className="inv-wrap garden-inner">
        <Reveal variant="fade"><p className="inv-eyebrow">{h.names.isCouple ? h.eyebrow : h.invitation}</p></Reveal>
        <Reveal variant="mask" delay={140} className="garden-oval-wrap">
          <div className="garden-oval"><Photo id={h.bg} priority className="absolute inset-0 h-full w-full" seed={2} sizes="(max-width: 768px) 78vw, 340px" /></div>
        </Reveal>
        <h1 className="garden-names" data-len={h.size}>
          <RevealWords as="span" text={h.names.a} className="garden-name" delay={260} />
          {h.names.isCouple && <><span className="garden-and" aria-hidden>{t("invite.and")}</span><RevealWords as="span" text={h.names.b} className="garden-name" delay={440} /></>}
        </h1>
        {!h.names.isCouple && h.phrase && <Reveal delay={400}><p className="inv-serif-lede garden-phrase">{h.phrase}</p></Reveal>}
        <Reveal delay={520} className="garden-details">
          <p className="garden-date inv-num">{h.dateLabel || h.dateText}</p>
          {place(h) && <p className="inv-muted">{place(h)}</p>}
          {h.hosts && <p className="inv-muted text-[0.92rem]">{t("hero.hostedBy", { hosts: h.hosts })}</p>}
        </Reveal>
        <ScrollCue />
      </div>
    </header>
  );
}

// ── POLAROIDS: a table of snapshots, names on a sticker ─────────────────────────────────────────────────
function Polaroids({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { view, L, t } = useInvitation();
  const extra = view.gallery.flatMap((a) => a.items).filter((i) => i.id !== h.bg).slice(0, 2);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-polaroids">
      <div className="inv-wrap pol-inner">
        <Reveal variant="fade"><p className="pol-eyebrow">{h.names.isCouple ? h.eyebrow : h.invitation}</p></Reveal>
        <div className="pol-table" aria-hidden={false}>
          {extra[0] && <figure className="pol pol-a"><img src={extra[0].url} srcSet={extra[0].srcSet} sizes="40vw" alt={L(extra[0].alt)} loading="eager" /><i className="tape" aria-hidden /></figure>}
          <figure className="pol pol-main"><Photo id={h.bg} priority className="pol-photo" seed={3} sizes="(max-width: 768px) 62vw, 300px" /><i className="tape" aria-hidden /></figure>
          {extra[1] && <figure className="pol pol-b"><img src={extra[1].url} srcSet={extra[1].srcSet} sizes="40vw" alt={L(extra[1].alt)} loading="eager" /><i className="tape t2" aria-hidden /></figure>}
          {h.dots.length === 3 && <span className="pol-badge inv-num" aria-label={h.dateText}><b>{h.dots[0]}</b><small>{fmtDate(h.date, h.locale, "month").slice(0, 3)}</small></span>}
        </div>
        <h1 className="pol-names" data-len={h.size}>
          <RevealWords as="span" text={h.names.a} className="pol-name" delay={200} />
          {h.names.isCouple && <><span className="pol-and" aria-hidden>{t("invite.and")}</span><RevealWords as="span" text={h.names.b} className="pol-name" delay={380} /></>}
        </h1>
        {h.phrase && <Reveal delay={500}><p className="pol-phrase">{h.phrase}</p></Reveal>}
        <Reveal delay={600}><p className="pol-where inv-num">{[h.dateLabel || h.dateText, place(h)].filter(Boolean).join(" · ")}</p></Reveal>
        <ScrollCue />
      </div>
    </header>
  );
}

// ── GATEWAY: a carved arch, lit by lamps, on deep colour ────────────────────────────────────────────────
function Lamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 52" className={cn("gw-lamp", className)} aria-hidden>
      <path className="gw-flame" d="M20 2c5 8 8 13 4 19-1.600 2.500-4 3.500-4 3.500s-2.400-1-4-3.500C12 15 15 10 20 2z" fill="#ffb347" />
      <path d="M5 28h30c0 10-7 17-15 17S5 38 5 28z" fill="var(--c-accent)" />
      <path d="M14 45h12l3 6H11z" fill="color-mix(in srgb, var(--c-accent) 70%, #000)" />
    </svg>
  );
}

function Gateway({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { t } = useInvitation();
  return (
    <header data-section="hero" id="s-hero" className="hv hv-gateway inv-night">
      <svg width="0" height="0" aria-hidden className="absolute"><defs><clipPath id="gw-arch" clipPathUnits="objectBoundingBox"><path d="M0 1V.5C0 .3 .26 .2 .5 0 .74 .2 1 .3 1 .5V1Z" /></clipPath></defs></svg>
      <div className="gw-band" aria-hidden />
      <div className="inv-wrap gw-inner">
        <Reveal variant="fade"><p className="inv-eyebrow">{h.names.isCouple ? h.eyebrow : h.invitation}</p></Reveal>
        <div className="gw-arch-wrap">
          <Lamp className="gw-lamp-l" /><Lamp className="gw-lamp-r" />
          <Reveal variant="mask" delay={160} className="gw-arch-reveal">
            <div className="gw-arch"><Photo id={h.bg} priority className="absolute inset-0 h-full w-full" seed={1} sizes="(max-width: 768px) 70vw, 340px" /></div>
          </Reveal>
        </div>
        <h1 className="gw-names" data-len={h.size}>
          <RevealWords as="span" text={h.names.a} className="gw-name" delay={300} />
          {h.names.isCouple && <><span className="gw-and" aria-hidden>{t("invite.and")}</span><RevealWords as="span" text={h.names.b} className="gw-name" delay={480} /></>}
        </h1>
        {!h.names.isCouple && h.phrase && <Reveal delay={400}><p className="inv-serif-lede gw-phrase">{h.phrase}</p></Reveal>}
        <Reveal delay={560} className="gw-details">
          <p className="inv-num gw-date">{h.dateLabel || h.dateText}</p>
          {place(h) && <p className="gw-place">{place(h)}</p>}
          {h.settings.showCountdown !== false && <p className="gw-count"><MiniCountdown target={h.target} /></p>}
          {h.hosts && <p className="gw-place">{t("hero.hostedBy", { hosts: h.hosts })}</p>}
        </Reveal>
        <ScrollCue light />
      </div>
      <div className="gw-band" aria-hidden />
    </header>
  );
}

// ── NUMERAL: the number of the occasion, with the photograph inside it ──────────────────────────────────
function Numeral({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { view, media, t } = useInvitation();
  const age = view.doc.occasion.honoree.age.match(/\d+/)?.[0];
  const years = view.wedding.yearsTogether > 0 ? String(view.wedding.yearsTogether) : "";
  const big = age ?? (h.status === "ANNIVERSARY" ? years : "") ?? "";
  const shown = big || h.dots[0] || "";
  const photo = media(h.bg)?.url;
  const upcoming = h.status === "DRAFT" || h.status === "PREVIEW" || h.status === "PUBLISHED";
  return (
    <header data-section="hero" id="s-hero" className="hv hv-numeral">
      <div className="inv-wrap num-inner">
        <Reveal variant="fade"><p className="inv-eyebrow">{upcoming ? h.invitation : h.eyebrow}</p></Reveal>
        <div className="num-big" data-digits={shown.length} aria-hidden style={photo ? ({ "--num-photo": `url(${photo})` } as React.CSSProperties) : undefined}>{shown}</div>
        <h1 className="num-names" data-len={h.size}>
          <RevealWords as="span" text={h.names.a} className="num-name" delay={160} />
          {h.names.isCouple && <><span className="hv-amp" aria-hidden>{t("invite.and")}</span><RevealWords as="span" text={h.names.b} className="num-name" delay={320} /></>}
        </h1>
        {h.phrase && <Reveal delay={420}><p className="inv-serif-lede num-phrase">{h.phrase}</p></Reveal>}
        <Reveal delay={520} className="num-details">
          <p className="inv-num">{h.dateLabel || h.dateText}</p>
          {place(h) && <p className="inv-muted">{place(h)}</p>}
          {h.hosts && <p className="inv-muted text-[0.92rem]">{t("hero.hostedBy", { hosts: h.hosts })}</p>}
          {toneOf(view.doc) !== "solemn" && h.settings.showCountdown !== false && <p className="num-count"><MiniCountdown target={h.target} /></p>}
        </Reveal>
        <ScrollCue />
      </div>
    </header>
  );
}

export default function Hero({ section }: { section: SectionConfig }) {
  switch (section.variant) {
    case "reel": return <Reel section={section} />;
    case "poster": return <Poster section={section} />;
    case "garden": return <Garden section={section} />;
    case "polaroids": return <Polaroids section={section} />;
    case "gateway": return <Gateway section={section} />;
    case "numeral": return <Numeral section={section} />;
    default: return <ClassicHero section={section} />;
  }
}

