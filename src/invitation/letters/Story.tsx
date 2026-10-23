"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Beat as B } from "@/domain/letters/types";
import { useFL } from "./runtime";
import { Beat, Btn, Dots, Eyebrow, Head, Heart, Para, Pic, Quiet } from "./parts";

type Of<T extends B["type"]> = Extract<B, { type: T }>;
const yearOf = (s: string) => Number((/(\d{4})/.exec(s) ?? [])[1]) || null;

// ── milestones in order — as a rail, as cards, or as a journey back in time ───────────────────────────
export function Timeline({ b }: { b: Of<"timeline"> }) {
  const fl = useFL();
  const items = fl.list(b.list);
  const style = b.style ?? "rail";
  const intro = fl.txt(b.intro);
  const [step, setStep] = useState(style === "time" ? -1 : 0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [travelling, setTravelling] = useState(false);
  const first = yearOf(items[0]?.when ?? "") ?? year - items.length;
  const it = items[Math.max(0, step)];
  const last = step >= items.length - 1;
  const travel = () => {
    setTravelling(true);
    const from = new Date().getFullYear();
    if (fl.reduced || from <= first) { setYear(first); setStep(0); setTravelling(false); return; }
    let y = from;
    const id = window.setInterval(() => { y -= Math.max(1, Math.ceil((from - first) / 22)); if (y <= first) { y = first; window.clearInterval(id); setYear(y); setTravelling(false); setStep(0); } else setYear(y); }, 70);
  };
  if (style === "time" && step < 0) {
    return (
      <Beat className="fl-timeline fl-time" kind="timeline">
        <Eyebrow>{fl.s("yearsBack")}</Eyebrow>
        <p className="fl-year" aria-live="off">{year}</p>
        {intro && <Para>{intro}</Para>}
        <div className="fl-after"><Btn onClick={travel} disabled={travelling}>{fl.s("yearsBack")}</Btn></div>
      </Beat>
    );
  }
  return (
    <Beat className={`fl-timeline fl-timeline-${style}`} kind="timeline">
      {style === "time" && <p className="fl-year fl-year-small" aria-hidden>{yearOf(it.when) ?? year}</p>}
      <Head>{fl.txt(b.title)}</Head>
      <ol className="fl-rail" aria-live="polite">
        {items.slice(0, step + 1).map((m, i) => (
          <li key={i} className={`fl-mile ${i === step ? "fl-rise" : ""}`} data-now={i === step}>
            <span className="fl-mile-dot" aria-hidden />
            {m.when && <p className="fl-when">{m.when}</p>}
            {m.title && <h3>{m.title}</h3>}
            {m.photo && i === step && <Pic id={m.photo} className="fl-mile-photo" />}
            {m.body && <p>{m.body}</p>}
          </li>
        ))}
      </ol>
      <Dots n={items.length} at={step} />
      <div className="fl-after">{last ? <Btn onClick={fl.next}>{style === "time" ? fl.s("returnNow") : fl.s("continue")}</Btn> : <Btn ghost onClick={() => setStep((n) => n + 1)}>{fl.s("next")}</Btn>}</div>
    </Beat>
  );
}

// ── a route through the places that mattered ───────────────────────────────────────────────────────────
export function Route({ b }: { b: Of<"route"> }) {
  const fl = useFL();
  const stops = fl.list(b.list);
  const end = fl.txt(b.end);
  const total = stops.length + (end ? 1 : 0);
  const [at, setAt] = useState(0);
  const pts = useMemo(() => Array.from({ length: total }, (_, i) => {
    const t = total === 1 ? 0.5 : i / (total - 1);
    return [34 + 132 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2.2 + 0.4)), 214 - 190 * t] as const;
  }), [total]);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const s = at < stops.length ? stops[at] : null;
  const last = at >= total - 1;
  return (
    <Beat className="fl-route" kind="route">
      <Head>{fl.txt(b.title)}</Head>
      <svg viewBox="0 0 200 240" className="fl-map" aria-hidden fill="none">
        <path d={path} className="fl-map-path" pathLength={1} style={{ strokeDashoffset: 1 - (at + 1) / total }} />
        {pts.map(([x, y], i) => <g key={i} data-on={i <= at} data-now={i === at}><circle cx={x} cy={y} r={i === at ? 6 : 4} className={i >= stops.length ? "fl-map-end" : "fl-map-stop"} /></g>)}
      </svg>
      <article className="fl-stop fl-rise" key={at} aria-live="polite">
        {s ? (<>
          <p className="fl-when">{s.when || fl.s("routeStart")}</p>
          <h3>{s.place}</h3>
          {s.photo && <Pic id={s.photo} className="fl-stop-photo" />}
          <p>{s.memory}</p>
        </>) : <><p className="fl-when">{fl.s("hope")}</p><p className="fl-big">{end}</p></>}
      </article>
      <div className="fl-after">{last ? <Btn onClick={fl.next}>{fl.s("continue")}</Btn> : <Btn ghost onClick={() => setAt((n) => n + 1)}>{fl.s("nextStop")}</Btn>}</div>
    </Beat>
  );
}

// ── a little museum ────────────────────────────────────────────────────────────────────────────────────
export function Gallery({ b }: { b: Of<"gallery"> }) {
  const fl = useFL();
  const ex = fl.list(b.list);
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const show = (i: number | null) => { setOpen(i); if (i !== null) setSeen((s) => new Set(s).add(i)); };
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open !== null) ref.current?.focus({ preventScroll: true }); }, [open]);
  const e = open !== null ? ex[open] : null;
  return (
    <Beat className="fl-gallery" kind="gallery">
      <Head>{fl.txt(b.title)}</Head>
      <p className="fl-count" aria-live="polite">{fl.s("seen", { n: seen.size, total: ex.length })}</p>
      {e && open !== null ? (
        <div className="fl-exhibit fl-rise" ref={ref} tabIndex={-1} role="group" aria-label={e.title}>
          <p className="fl-when">{fl.s("exhibit", { n: open + 1 })}</p>
          {e.photo && <Pic id={e.photo} className="fl-exhibit-photo" />}
          <h3>{e.title}</h3>
          <p>{e.caption}</p>
          {e.note && <p className="fl-quote">{e.note}</p>}
          <div className="fl-after">
            <Btn ghost disabled={open === 0} onClick={() => show(open - 1)}>{fl.s("back")}</Btn>
            <Btn ghost onClick={() => show(null)}>{fl.s("seen", { n: seen.size, total: ex.length })}</Btn>
            <Btn ghost disabled={open >= ex.length - 1} onClick={() => show(open + 1)}>{fl.s("next")}</Btn>
          </div>
        </div>
      ) : (
        <ul className="fl-frames">
          {ex.map((x, i) => (
            <li key={i}>
              <button type="button" className="fl-frame" data-seen={seen.has(i)} onClick={() => show(i)}>
                {x.photo ? <Pic id={x.photo} className="fl-frame-img" /> : <span className="fl-frame-empty"><Heart /></span>}
                <span className="fl-plaque">{x.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="fl-after"><Btn ghost={seen.size < Math.min(2, ex.length)} onClick={fl.next}>{fl.s("continue")}</Btn></div>
    </Beat>
  );
}

// ── dreams of a future, offered as hopes ───────────────────────────────────────────────────────────────
export function Dreams({ b }: { b: Of<"dreams"> }) {
  const fl = useFL();
  const dreams = fl.list(b.list);
  const [open, setOpen] = useState<Set<number>>(new Set());
  return (
    <Beat className="fl-dreams" kind="dreams">
      <Head>{fl.txt(b.title)}</Head>
      <Para className="fl-note">{fl.s("hopeBody")}</Para>
      <ul className="fl-dreamlist">
        {dreams.map((d, i) => (
          <li key={i}>
            <button type="button" className="fl-dream" aria-expanded={open.has(i)} data-open={open.has(i)} onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}>
              {d.photo && <Pic id={d.photo} className="fl-dream-photo" />}
              <span className="fl-dream-title">{d.title}</span>
              <span className="fl-dream-body" hidden={!open.has(i)}>{d.body}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="fl-after"><Btn ghost={open.size < Math.min(2, dreams.length)} onClick={fl.next}>{fl.s("continue")}</Btn></div>
    </Beat>
  );
}

// ── promises, unsealed one at a time ───────────────────────────────────────────────────────────────────
export function Promises({ b }: { b: Of<"promises"> }) {
  const fl = useFL();
  const ps = fl.list(b.list);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const all = open.size >= ps.length;
  return (
    <Beat className="fl-promises" kind="promises">
      <Head>{fl.txt(b.title)}</Head>
      <ol className="fl-seals">
        {ps.map((p, i) => (
          <li key={i}>
            <button type="button" className="fl-seal" data-open={open.has(i)} aria-expanded={open.has(i)} onClick={() => setOpen((s) => new Set(s).add(i))}>
              <span className="fl-seal-mark" aria-hidden>{open.has(i) ? <Heart /> : i + 1}</span>
              <span className="fl-seal-text">{open.has(i) ? <><em>{fl.s("promiseOf")}</em> {p.text}</> : fl.s("unlock")}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="fl-after">{!all && ps.length > 3 && <Quiet onClick={() => setOpen(new Set(ps.map((_, i) => i)))}>{fl.s("showMe")}</Quiet>}<Btn ghost={!all} onClick={fl.next}>{fl.s("continue")}</Btn></div>
    </Beat>
  );
}
