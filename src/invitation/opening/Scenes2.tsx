"use client";
import "./scenes2.css";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { fmtDate } from "../engine/format";
import type { Subject } from "../engine/subject";

/**
 * Twelve more ways to begin, for the cinematic wedding set. Like the lamp and the doors they are plain markup + CSS (see
 * scenes2.css): no images, no libraries, nothing that starts without the guest's own tap. Every scene also has the gate's
 * ordinary “Tap to open” button, so none of them is a precise gesture, and all of them stand still for reduced motion.
 */
export const SCENES2 = ["spotlight", "marquee", "monogram", "constellation", "storybook", "leader", "cover", "ink", "tide", "panels", "sunrise", "titlecard"] as const;
export type Scene2Variant = (typeof SCENES2)[number];
export const isScene2 = (v: string): v is Scene2Variant => (SCENES2 as readonly string[]).includes(v);
/** Milliseconds from the tap until the gate starts to fade. */
export const SCENE2_DURATION: Record<Scene2Variant, number> = { spotlight: 1700, marquee: 1500, monogram: 1300, constellation: 1400, storybook: 1900, leader: 1400, cover: 1500, ink: 1700, tide: 1700, panels: 1600, sunrise: 2000, titlecard: 1000 };

export interface Scene2Props {
  variant: Scene2Variant;
  isOpening: boolean;
  open: () => void;
  names: Subject;
  mainDate: string;
  locale: string;
  invited: string;
  greeting: string | null;
  seatsText: string | null;
  tapLabel: string;
  starsHint: string;
  and: string;
  actions: ReactNode;
}

const STARS: [number, number][] = [[10, 72], [26, 42], [43, 60], [57, 26], [72, 52], [86, 30], [93, 66]];

function Constellation({ p }: { p: Scene2Props }) {
  // the stars are touched in any order; each new one is joined to the one touched before it
  const [order, setOrder] = useState<number[]>([]);
  const done = order.length >= STARS.length;
  // the last star opens the invitation; the ordinary button still works at any time
  useEffect(() => {
    if (!done || p.isOpening) return;
    const id = window.setTimeout(p.open, 500);
    return () => window.clearTimeout(id);
  }, [done, p]);
  return (
    <>
      <div className="cs-sky">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cs-lines" aria-hidden>
          {order.slice(1).map((s, k) => <line key={s} x1={STARS[order[k]][0]} y1={STARS[order[k]][1]} x2={STARS[s][0]} y2={STARS[s][1]} pathLength={1} />)}
        </svg>
        {STARS.map(([x, y], i) => (
          <button key={i} type="button" className="cs-star" data-lit={order.includes(i)} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${p.starsHint} (${i + 1}/${STARS.length})`} disabled={p.isOpening} onClick={() => setOrder((o) => (o.includes(i) ? o : [...o, i]))} />
        ))}
      </div>
      <h1 className="gate-names cs-names" style={{ opacity: 0.35 + (order.length / STARS.length) * 0.65 }}>{p.names.a}{p.names.isCouple && <> <span className="amp">{p.and}</span> {p.names.b}</>}</h1>
      <p className="gate-hint">{p.starsHint}</p>
    </>
  );
}

export function Scene2(p: Scene2Props) {
  const { variant, isOpening, names, mainDate, locale } = p;
  const date = mainDate ? fmtDate(mainDate, locale, "long") : "";
  const dots = mainDate ? mainDate.split("-").reverse().join(" · ") : "";
  const year = mainDate.slice(0, 4);
  const trigger = {
    role: "button" as const, tabIndex: 0, "aria-label": p.tapLabel, onClick: p.open,
    onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), p.open()),
  };
  const nameEl = (className = "gate-names") => (
    <h1 className={className}>{names.a}{names.isCouple && <> <span className="amp">{p.and}</span> {names.b}</>}</h1>
  );
  const Top = (
    <>
      <p className="inv-eyebrow !text-[var(--c-accent)]">{p.invited}</p>
      {p.greeting && <p className="gate-dear">{p.greeting}</p>}
    </>
  );
  const Foot = (
    <>
      {p.seatsText && <p className="gate-hint">{p.seatsText}</p>}
      {p.actions}
    </>
  );
  const wrap = (children: ReactNode) => <div className="gate-inner sc2" data-scene={variant} data-open={isOpening}>{children}</div>;

  switch (variant) {
    case "spotlight":
      return wrap(<>
        {Top}
        <div className="spot-stage" {...trigger}>
          <i className="spot-beam" aria-hidden />
          <div className="spot-names">{nameEl()}{date && <p className="spot-date">{date}</p>}</div>
        </div>
        {Foot}
      </>);

    case "marquee":
      return wrap(<>
        <div className="marq-frame" {...trigger}>
          <div className="marq-plate">
            <p className="marq-kicker">{p.invited}</p>
            {nameEl("marq-names")}
            {dots && <p className="marq-date">{dots}</p>}
          </div>
        </div>
        {p.greeting && <p className="gate-dear">{p.greeting}</p>}
        {Foot}
      </>);

    case "monogram":
      return wrap(<>
        {Top}
        <div className="mono-wrap" {...trigger}>
        <svg className="mono-big" viewBox="0 0 220 220" aria-hidden>
          <circle className="mono-ring" cx="110" cy="110" r="100" pathLength={1} />
          <circle className="mono-ring r2" cx="110" cy="110" r="92" pathLength={1} />
          {names.isCouple ? (
            <>
              <text x="42" y="132" fontSize="76" className="mono-stroke" style={{ fontFamily: "var(--f-heading)" }}>{names.ia}</text>
              <text x="98" y="108" fontSize="34" style={{ fontFamily: "var(--f-script)", fill: "var(--c-on-inverse)", opacity: 0.85 }}>&amp;</text>
              <text x="118" y="132" fontSize="76" className="mono-stroke" style={{ fontFamily: "var(--f-heading)", animationDelay: "0.6s, 2.6s" }}>{names.ib}</text>
            </>
          ) : (
            <text x="110" y="132" textAnchor="middle" fontSize="76" className="mono-stroke" style={{ fontFamily: "var(--f-heading)" }}>{names.initials}</text>
          )}
        </svg>
        </div>
        {nameEl()}
        {date && <p className="mono-date">{date}</p>}
        {Foot}
      </>);

    case "constellation":
      return wrap(<>{Top}<Constellation p={p} />{Foot}</>);

    case "storybook":
      return wrap(<>
        <div className="book" {...trigger}>
          <div className="book-page" aria-hidden>
            <p className="book-kicker">{p.invited}</p>
            {date && <p className="book-date">{date}</p>}
          </div>
          <div className="book-cover">
            <span className="book-orn" aria-hidden />
            {nameEl("book-title")}
            <span className="book-orn" aria-hidden />
          </div>
        </div>
        {p.greeting && <p className="gate-dear">{p.greeting}</p>}
        {Foot}
      </>);

    case "leader":
      return wrap(<>
        <div className="leader" {...trigger}>
          <svg viewBox="0 0 200 200" className="leader-ring" aria-hidden><circle cx="100" cy="100" r="86" /><circle cx="100" cy="100" r="62" /><path d="M100 4v192M4 100h192" /></svg>
          <div className="leader-nums" aria-hidden><b>3</b><b>2</b><b>1</b></div>
        </div>
        <div className="leader-title"><p className="inv-eyebrow !text-[var(--c-accent)]">{p.invited}</p>{nameEl()}{p.greeting && <p className="gate-dear">{p.greeting}</p>}</div>
        {Foot}
      </>);

    case "cover":
      return wrap(<>
        <div className="mag" {...trigger}>
          <div className="mag-under" aria-hidden><p>{p.invited}</p></div>
          <div className="mag-cover">
            <div className="mag-top"><span>{year}</span><span>{dots}</span></div>
            {nameEl("mag-title")}
            <p className="mag-line">{p.invited}</p>
            <i className="mag-bars" aria-hidden />
          </div>
        </div>
        {p.greeting && <p className="gate-dear">{p.greeting}</p>}
        {Foot}
      </>);

    case "ink":
      return wrap(<>
        <i className="ink-blob b1" aria-hidden /><i className="ink-blob b2" aria-hidden /><i className="ink-blob b3" aria-hidden />
        <div className="ink-copy" {...trigger}>
          {Top}
          {nameEl()}
          {date && <p className="ink-date">{date}</p>}
        </div>
        {Foot}
      </>);

    case "tide":
      return wrap(<>
        {Top}
        {nameEl()}
        {date && <p className="tide-date">{date}</p>}
        <div className="tide" {...trigger} aria-label={p.tapLabel}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="tide-wave w1" aria-hidden><path d="M0 60 C150 20 300 100 450 60 S750 20 900 60 S1100 100 1200 60 V120 H0Z" /></svg>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="tide-wave w2" aria-hidden><path d="M0 70 C150 110 300 30 450 70 S750 110 900 70 S1100 30 1200 70 V120 H0Z" /></svg>
          <i className="tide-sea" aria-hidden />
        </div>
        {Foot}
      </>);

    case "panels":
      return wrap(<>
        <div className="pn-slabs" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ "--i": i } as CSSProperties} />)}</div>
        <div className="pn-copy" {...trigger}>
          {Top}
          {nameEl()}
          {dots && <p className="pn-date">{dots}</p>}
        </div>
        {Foot}
      </>);

    case "sunrise":
      return wrap(<>
        <i className="sun" aria-hidden />
        <div className="sun-copy" {...trigger}>
          {Top}
          {nameEl()}
          {date && <p className="sun-date">{date}</p>}
        </div>
        {Foot}
      </>);

    case "titlecard":
      return wrap(<>
        <div className="tt" {...trigger}>
          <p className="tt-line tt-a" style={{ "--n": Math.max(8, p.invited.length) } as CSSProperties}>{p.invited}</p>
          {nameEl("tt-line tt-b gate-names")}
          {date && <p className="tt-line tt-c" style={{ "--n": date.length } as CSSProperties}>{date}</p>}
        </div>
        {p.greeting && <p className="gate-dear">{p.greeting}</p>}
        {Foot}
      </>);
  }
}
