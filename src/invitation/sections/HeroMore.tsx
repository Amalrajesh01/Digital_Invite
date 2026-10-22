"use client";
import type { SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { MiniCountdown, ScrollCue, Title, goNext, useHeroData, type HeroData } from "./HeroSection";

/**
 * Thirteen more ways to begin, for the cinematic wedding set (styles in heroes2.css). Like the first six they are different
 * compositions, not recolours: a magazine cover, a spotlit stage, a triptych, a night sky, a postcard, an arched window, a
 * watercolour wash, a horizon, an open book, a premiere billboard, a film frame, a stone slab and a typographic stack.
 * Every one reads the same hero data, so a customer's names, date and photograph are all it ever needs.
 */
const place = (h: HeroData) => [h.venueName, h.city].filter(Boolean).join(" · ");
const eyebrowOf = (h: HeroData) => (h.names.isCouple ? h.eyebrow : h.invitation);

/** Two more photographs of the same invitation, for compositions made of several frames. */
function useExtras(h: HeroData, n: number) {
  const { view } = useInvitation();
  return view.gallery.flatMap((a) => a.items).filter((i) => i.id !== h.bg).slice(0, n);
}

const Cue = ScrollCue;

// ── COVER: oversized names layered over a full-bleed portrait ──────────────────────────────────────────
function Cover({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-cover">
      <Photo id={h.bg} wideId={h.wide} priority className="cv-photo" seed={1} sizes="100vw" />
      <div className="cv-shade" />
      <div className="cv-mast"><span>{eyebrowOf(h)}</span><span className="inv-num">{h.dateLabel || h.shortDate}</span></div>
      <h1 className="cv-title" data-len={h.size}>
        <Title h={h} nameClass="cv-name" andClass="cv-amp" delayA={200} delayB={420} />
      </h1>
      <div className="cv-lines"><p>{h.phrase}</p>{place(h) && <p>{place(h)}</p>}</div>
      <Cue light />
    </header>
  );
}

// ── STAGE: a figure in a pool of light on black ────────────────────────────────────────────────────────
function Stage({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-stage inv-night">
      <i className="st-beam" aria-hidden />
      <div className="inv-wrap st-inner">
        <Reveal variant="fade"><p className="inv-eyebrow">{eyebrowOf(h)}</p></Reveal>
        <Reveal variant="fade" delay={150} className="st-figure"><Photo id={h.bg} wideId={h.wide} priority className="absolute inset-0 h-full w-full" seed={2} sizes="(max-width: 768px) 80vw, 420px" /></Reveal>
        <h1 className="st-names" data-len={h.size}><Title h={h} nameClass="st-name" andClass="hv-amp" delayA={300} delayB={500} /></h1>
        <Reveal delay={620} className="st-meta"><span className="inv-num">{h.dateLabel || h.dateText}</span>{place(h) && <span>{place(h)}</span>}</Reveal>
        <Cue light />
      </div>
    </header>
  );
}

// ── TRIPTYCH: three frames, the largest in the middle ───────────────────────────────────────────────────
/** A side frame: another photograph of the invitation (gallery items are already resolved, as in the snapshots hero), else the main one. */
function Side({ item, h, seed }: { item?: ReturnType<typeof useExtras>[number]; h: HeroData; seed: number }) {
  const { L } = useInvitation();
  if (!item) return <Photo id={h.bg} priority className="absolute inset-0 h-full w-full" seed={seed} sizes="(max-width: 768px) 24vw, 220px" />;
  return <img src={item.url} srcSet={item.srcSet} sizes="(max-width: 768px) 24vw, 220px" alt={L(item.alt)} loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={item.focal ? { objectPosition: `${item.focal.x}% ${item.focal.y}%` } : undefined} />;
}

function Triptych({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const [a, b] = useExtras(h, 2);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-triptych">
      <div className="inv-wrap tp-inner">
        <Reveal variant="fade"><p className="inv-eyebrow">{eyebrowOf(h)}</p></Reveal>
        <div className="tp-frames">
          <Reveal variant="mask" delay={100} className="tp-side"><Side item={a} h={h} seed={3} /></Reveal>
          <Reveal variant="mask" delay={0} className="tp-mid"><Photo id={h.bg} wideId={undefined} priority className="absolute inset-0 h-full w-full" seed={1} sizes="(max-width: 768px) 52vw, 420px" /></Reveal>
          <Reveal variant="mask" delay={200} className="tp-side"><Side item={b} h={h} seed={4} /></Reveal>
        </div>
        <h1 className="tp-names" data-len={h.size}><Title h={h} nameClass="tp-name" andClass="hv-amp" delayA={300} delayB={480} /></h1>
        <Reveal delay={560}><p className="tp-meta inv-num">{[h.dateLabel || h.dateText, place(h)].filter(Boolean).join(" · ")}</p></Reveal>
        <Cue />
      </div>
    </header>
  );
}

// ── NIGHT SKY: a portrait in orbit under a field of stars ───────────────────────────────────────────────
function NightSky({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-nightsky inv-night">
      <i className="ns-stars s1" aria-hidden /><i className="ns-stars s2" aria-hidden />
      <div className="inv-wrap ns-inner">
        <Reveal variant="fade"><p className="inv-eyebrow">{eyebrowOf(h)}</p></Reveal>
        <Reveal variant="fade" delay={150} className="ns-orbit">
          <svg viewBox="0 0 100 100" className="ns-ring" aria-hidden><circle cx="50" cy="50" r="48.5" /><circle cx="50" cy="50" r="44" strokeDasharray="0.5 2.5" /><circle className="ns-dot" cx="50" cy="1.5" r="1.3" /></svg>
          <div className="ns-photo"><Photo id={h.bg} priority className="absolute inset-0 h-full w-full" seed={2} sizes="(max-width: 768px) 70vw, 340px" /></div>
        </Reveal>
        <h1 className="ns-names" data-len={h.size}><Title h={h} nameClass="ns-name" andClass="hv-amp" delayA={300} delayB={500} /></h1>
        <Reveal delay={600}><p className="ns-meta inv-num">{[h.dateLabel || h.dateText, place(h)].filter(Boolean).join(" · ")}</p></Reveal>
        <Cue light />
      </div>
    </header>
  );
}

// ── POSTCARD: a card with a stamp and a postmark ────────────────────────────────────────────────────────
function Postcard({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-postcard">
      <div className="inv-wrap pc-inner">
        <Reveal variant="up" className="pc-card">
          <div className="pc-photo"><Photo id={h.bg} wideId={h.wide} priority className="absolute inset-0 h-full w-full" seed={1} sizes="(max-width: 768px) 86vw, 520px" /></div>
          <div className="pc-back">
            <span className="pc-stamp" aria-hidden><b>{h.names.initials}</b></span>
            <svg viewBox="0 0 120 120" className="pc-mark" aria-hidden><circle cx="60" cy="60" r="52" /><circle cx="60" cy="60" r="38" /><text x="60" y="64" textAnchor="middle" fontSize="13" className="inv-num">{h.dots.join("·")}</text></svg>
            <p className="pc-eyebrow">{eyebrowOf(h)}</p>
            <h1 className="pc-names" data-len={h.size}><Title h={h} nameClass="pc-name" andClass="hv-amp" delayA={300} delayB={480} /></h1>
            <p className="pc-meta inv-num">{h.dateLabel || h.dateText}</p>
            {place(h) && <p className="pc-meta">{place(h)}</p>}
          </div>
        </Reveal>
        <Cue />
      </div>
    </header>
  );
}

// ── WINDOW: an arched opening in stone, set out on a grid ───────────────────────────────────────────────
function Window({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-window">
      <svg width="0" height="0" aria-hidden className="absolute"><defs><clipPath id="win-arch" clipPathUnits="objectBoundingBox"><path d="M0 1V.42C0 .18 .22 0 .5 0S1 .18 1 .42V1Z" /></clipPath></defs></svg>
      <div className="inv-wrap wn-inner">
        <Reveal variant="fade"><p className="wn-plate inv-num">No. {h.dots[0] || "01"}<span aria-hidden> — </span>{eyebrowOf(h)}</p></Reveal>
        <div className="wn-sill">
          <Reveal variant="mask" delay={100} className="wn-arch"><Photo id={h.bg} priority className="absolute inset-0 h-full w-full" seed={1} sizes="(max-width: 768px) 78vw, 380px" /></Reveal>
        </div>
        <h1 className="wn-names" data-len={h.size}><Title h={h} nameClass="wn-name" andClass="hv-amp" delayA={300} delayB={480} /></h1>
        <Reveal delay={560} className="wn-meta"><span className="inv-num">{h.dateLabel || h.dateText}</span>{place(h) && <span>{place(h)}</span>}</Reveal>
        <Cue />
      </div>
    </header>
  );
}

// ── WASH: an oval portrait that melts into colour ───────────────────────────────────────────────────────
function Wash({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-wash">
      <i className="ws-blob b1" aria-hidden /><i className="ws-blob b2" aria-hidden /><i className="ws-blob b3" aria-hidden />
      <div className="inv-wrap ws-inner">
        <Reveal variant="fade"><p className="inv-eyebrow">{eyebrowOf(h)}</p></Reveal>
        <Reveal variant="fade" delay={150} className="ws-oval"><Photo id={h.bg} priority className="absolute inset-0 h-full w-full" seed={2} sizes="(max-width: 768px) 80vw, 360px" /></Reveal>
        <h1 className="ws-names" data-len={h.size}><Title h={h} nameClass="ws-name" andClass="hv-amp" delayA={300} delayB={480} /></h1>
        <Reveal delay={560}><p className="ws-meta inv-num">{[h.dateLabel || h.dateText, place(h)].filter(Boolean).join(" · ")}</p></Reveal>
        <Cue />
      </div>
    </header>
  );
}

// ── HORIZON: a landscape band with the names across its horizon ─────────────────────────────────────────
function Horizon({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { view } = useInvitation();
  const v = view.doc.venues.find((x) => x.lat != null && x.lng != null);
  const coord = v ? `${Math.abs(v.lat!).toFixed(2)}°${v.lat! >= 0 ? "N" : "S"} · ${Math.abs(v.lng!).toFixed(2)}°${v.lng! >= 0 ? "E" : "W"}` : "";
  return (
    <header data-section="hero" id="s-hero" className="hv hv-horizon">
      <div className="hz-band">
        <Photo id={h.bg} wideId={h.wide} priority className="absolute inset-0 h-full w-full" seed={1} sizes="100vw" />
        <i className="hz-line" aria-hidden />
      </div>
      <div className="inv-wrap hz-inner">
        <Reveal variant="fade"><p className="inv-eyebrow">{eyebrowOf(h)}</p></Reveal>
        <h1 className="hz-names" data-len={h.size}><Title h={h} nameClass="hz-name" andClass="hv-amp" delayA={250} delayB={430} /></h1>
        <Reveal delay={520} className="hz-meta"><span className="inv-num">{h.dateLabel || h.dateText}</span>{place(h) && <span>{place(h)}</span>}{coord && <span className="inv-num hz-coord">{coord}</span>}</Reveal>
        <Cue />
      </div>
    </header>
  );
}

// ── BOOK: an open storybook ─────────────────────────────────────────────────────────────────────────────
function Book({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-book">
      <div className="inv-wrap bk-inner">
        <Reveal variant="up" className="bk-spread">
          <div className="bk-page bk-l">
            <p className="inv-eyebrow">{eyebrowOf(h)}</p>
            <h1 className="bk-names" data-len={h.size}><Title h={h} nameClass="bk-name" andClass="hv-amp" delayA={300} delayB={480} /></h1>
            <span className="bk-orn" aria-hidden />
            <p className="bk-meta inv-num">{h.dateLabel || h.dateText}</p>
            {place(h) && <p className="bk-meta">{place(h)}</p>}
          </div>
          <div className="bk-page bk-r"><div className="bk-plate"><Photo id={h.bg} wideId={h.wide} priority className="absolute inset-0 h-full w-full" seed={1} sizes="(max-width: 768px) 80vw, 340px" /></div></div>
        </Reveal>
        <Cue />
      </div>
    </header>
  );
}

// ── BILLBOARD: a premiere title over the photograph ─────────────────────────────────────────────────────
function Laurel({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 40 80" className="bb-laurel" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      {Array.from({ length: 7 }).map((_, i) => <path key={i} d={`M${30 - i * 1.6} ${72 - i * 10} q-14 -4 -18 -14 q12 0 18 14z`} fill="currentColor" opacity={0.9 - i * 0.07} />)}
      <path d="M32 74 C20 56 20 28 30 8" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function Billboard({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-billboard inv-night">
      <Photo id={h.bg} wideId={h.wide} priority className="bb-photo" seed={1} sizes="100vw" />
      <div className="bb-shade" />
      <div className="bb-inner">
        <Reveal variant="fade"><p className="bb-kicker">{eyebrowOf(h)}</p></Reveal>
        <h1 className="bb-title" data-len={h.size}><Title h={h} nameClass="bb-name" andClass="bb-amp" delayA={300} delayB={560} /></h1>
        <Reveal delay={700} className="bb-credits"><Laurel /><div><span className="inv-num">{h.dateLabel || h.dateText}</span>{place(h) && <span>{place(h)}</span>}</div><Laurel flip /></Reveal>
        {h.settings.showCountdown !== false && <p className="bb-count"><MiniCountdown target={h.target} /></p>}
        <Cue light />
      </div>
    </header>
  );
}

// ── FILM FRAME: a still with sprocket holes and a frame number ──────────────────────────────────────────
function FilmFrame({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-filmframe">
      <div className="inv-wrap ff-inner">
        <Reveal variant="fade"><p className="ff-slate inv-num">{eyebrowOf(h)} · {h.dateLabel || h.shortDate}</p></Reveal>
        <Reveal variant="up" delay={100} className="ff-strip">
          <span className="ff-holes" aria-hidden /><span className="ff-holes r" aria-hidden />
          <div className="ff-still"><Photo id={h.bg} wideId={h.wide} priority className="absolute inset-0 h-full w-full" seed={1} sizes="(max-width: 768px) 78vw, 420px" /><i className="ff-grain" aria-hidden /></div>
          <span className="ff-no inv-num" aria-hidden>▶ 01A</span>
        </Reveal>
        <h1 className="ff-names" data-len={h.size}><Title h={h} nameClass="ff-name" andClass="hv-amp" delayA={300} delayB={480} /></h1>
        {place(h) && <Reveal delay={560}><p className="ff-meta">{place(h)}</p></Reveal>}
        <Cue />
      </div>
    </header>
  );
}

// ── SLAB: a monolith of photograph, the names cutting across it ─────────────────────────────────────────
function Slab({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  return (
    <header data-section="hero" id="s-hero" className="hv hv-slab">
      <div className="inv-wrap sl-inner">
        <Reveal variant="fade" className="sl-plate"><span className="inv-num">01</span><span>{eyebrowOf(h)}</span></Reveal>
        <Reveal variant="mask" delay={100} className="sl-block"><Photo id={h.bg} wideId={h.wide} priority className="absolute inset-0 h-full w-full" seed={1} sizes="(max-width: 768px) 78vw, 440px" /></Reveal>
        <h1 className="sl-names" data-len={h.size}><Title h={h} nameClass="sl-name" andClass="hv-amp" delayA={300} delayB={480} /></h1>
        <Reveal delay={560} className="sl-meta"><span className="inv-num">{h.dateLabel || h.dateText}</span>{place(h) && <span>{place(h)}</span>}</Reveal>
        <Cue />
      </div>
    </header>
  );
}

// ── STACK: nothing but type, and one narrow strip of photograph ─────────────────────────────────────────
function Stack({ section }: { section: SectionConfig }) {
  const h = useHeroData(section);
  const { t } = useInvitation();
  return (
    <header data-section="hero" id="s-hero" className="hv hv-stack">
      <div className="inv-wrap sk-inner">
        <div className="sk-type">
          <Reveal variant="fade"><p className="sk-eyebrow">{eyebrowOf(h)}</p></Reveal>
          <h1 className="sk-names" data-len={h.size}>
            <Title h={h} nameClass="sk-name" andClass="sk-amp" delayA={150} delayB={320} />
          </h1>
          <Reveal delay={450} className="sk-meta">
            <span className="inv-num">{h.dateLabel || h.dateText}</span>{place(h) && <span>{place(h)}</span>}
            <a href="#main" onClick={goNext} aria-label={t("invite.scroll")}>{t("invite.scroll")} ↓</a>
          </Reveal>
        </div>
        <Reveal variant="mask" delay={200} className="sk-strip"><Photo id={h.bg} priority className="absolute inset-0 h-full w-full" seed={1} sizes="(max-width: 768px) 32vw, 220px" /></Reveal>
      </div>
    </header>
  );
}

const MORE: Record<string, (p: { section: SectionConfig }) => React.ReactElement> = {
  cover: Cover, stage: Stage, triptych: Triptych, nightsky: NightSky, postcard: Postcard, window: Window, wash: Wash,
  horizon: Horizon, book: Book, billboard: Billboard, filmframe: FilmFrame, slab: Slab, stack: Stack,
};
export const isMoreHero = (v: string | undefined): v is string => !!v && v in MORE;
export function HeroMore({ section }: { section: SectionConfig }) {
  const Comp = MORE[section.variant ?? ""];
  return Comp ? <Comp section={section} /> : null;
}
