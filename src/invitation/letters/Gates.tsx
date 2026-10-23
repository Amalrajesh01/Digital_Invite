"use client";
import { useEffect, useRef, useState } from "react";
import type { Beat as B, GateStyle } from "@/domain/letters/types";
import { useFL, useTyped } from "./runtime";
import { Beat, Btn, Eyebrow, Head, Heart, Para, Quiet, Spark } from "./parts";

type G = Extract<B, { type: "gate" }>;

/** How long each opening plays after the tap, before the first screen arrives. */
const OPEN_MS: Partial<Record<GateStyle, number>> = { quiet: 300, film: 1200, numerals: 700, candle: 1500, hold: 600, phone: 600, dawn: 1400, lamp: 1400, rain: 1100, time: 1500, vinyl: 1100 };
const ROUND = (n: number) => Array.from({ length: n }, (_, i) => i);

/**
 * The first screen of every letter. There are thirty-two, each a small object the recipient touches — an envelope, a candle,
 * a record, a rain-streaked window — and each opens onto the same plain promise: nothing happens until they choose.
 */
export function Gate({ b }: { b: G }) {
  const fl = useFL();
  const [open, setOpen] = useState(false);
  const [later, setLater] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const go = () => {
    if (open) return;
    setOpen(true);
    timer.current = window.setTimeout(fl.next, fl.reduced ? 0 : OPEN_MS[b.style] ?? 950);
  };
  const count = b.count ? fl.list(b.count).length : 0;
  const title = fl.txt(b.title).replace(/\{n\}/g, count ? String(count) : "many");
  const sub = fl.txt(b.sub);

  if (later) {
    return (
      <Beat className="fl-gate fg-quiet" kind="gate">
        <div className="fg-copy">
          <Head as="h1">{fl.s("laterTitle")}</Head>
          <Para>{fl.s("laterBody")}</Para>
          <Btn ghost onClick={() => setLater(false)}>{fl.s("laterBack")}</Btn>
        </div>
      </Beat>
    );
  }

  const special = b.style === "hold" || b.style === "candle";
  return (
    <Beat className={`fl-gate fg-${b.style}`} kind="gate">
      <div className="fg-art" data-open={open} aria-hidden onClick={special ? undefined : go}>
        <Art b={b} open={open} go={go} />
      </div>
      <div className="fg-copy">
        <Eyebrow>{fl.txt(b.eyebrow)}</Eyebrow>
        <Head as="h1" className="fg-title">{title}</Head>
        {sub && b.style !== "phone" && <Para className="fg-sub">{sub}</Para>}
        {b.style === "hold" ? (
          <><p className="fg-hint">{fl.s("holdAlt")}</p><Btn onClick={go} disabled={open}>{b.cta}</Btn></>
        ) : (
          <Btn onClick={go} disabled={open} className="fg-cta">{b.cta}</Btn>
        )}
        {b.hint && <p className="fg-hint">{b.hint}</p>}
        {b.later && <Quiet onClick={() => setLater(true)}>{fl.s("notNow")}</Quiet>}
      </div>
    </Beat>
  );
}

function Art({ b, open, go }: { b: G; open: boolean; go: () => void }) {
  const fl = useFL();
  const initial = (fl.names.anonymous ? "" : fl.names.sign.trim().charAt(0).toUpperCase()) || "";
  const n = b.count ? fl.list(b.count).length : 0;
  const [typed] = useTyped(fl.txt(b.sub ?? b.title), 38, b.style === "phone");
  switch (b.style) {
    case "question": return <><b className="q">?</b>{ROUND(3).map((i) => <Spark key={i} className={`s s${i}`} />)}</>;
    case "quiet": return null;
    case "mystery": return <div className="fg-env"><i className="back" /><i className="glow" /><i className="front" /><i className="flap" /><b className="seal">?</b></div>;
    case "cards": return <>{ROUND(3).map((i) => <i key={i} className={`c c${i}`}>{i === 2 && <Heart />}</i>)}</>;
    case "spotlight": return <><i className="beam" /><i className="pool" /><b className="q">?</b></>;
    case "phone": return <div className="dev"><i className="bar" /><span className="bub">{fl.s("delivered")}</span><div className="inp"><span>{typed}</span><i className="caret" /><i className="send" /></div></div>;
    case "sealed": return <><i className="sheet" /><i className="fold" /><b className="wax">{initial || <Heart />}</b></>;
    case "develop": return <div className="pol"><i className="ph" /><b className="cap">{initial ? `${initial}.` : ""}</b></div>;
    case "film": return <><i className="bar t" /><i className="bar b" /><i className="beam" /></>;
    case "numerals": return <Count n={n || 0} />;
    case "horizon": return <><i className="sun" /><i className="sea" /></>;
    case "book": return <><i className="pg p1" /><i className="pg p2" /><i className="cov" /></>;
    case "map": return (
      <svg viewBox="0 0 200 260" className="fg-mp" fill="none">
        <path className="route" d="M30 220 C 60 190, 40 150, 90 140 S 150 110, 120 70 S 160 30, 170 24" />
        <circle className="a" cx="30" cy="220" r="5" /><circle className="b" cx="170" cy="24" r="5" />
        <path className="pin" d="M170 8c-8 0-14 6-14 14 0 10 14 24 14 24s14-14 14-24c0-8-6-14-14-14Z" />
      </svg>
    );
    case "candle": return (
      <button type="button" tabIndex={-1} className="fg-cd" data-lit={open} onClick={go}>
        <i className="halo" /><i className="flame" /><i className="wick" /><i className="wax" />
      </button>
    );
    case "window": return <><i className="view" /><i className="frame" /><i className="pane l" /><i className="pane r" /></>;
    case "orbit": return <><i className="core" />{ROUND(3).map((i) => <i key={i} className={`o o${i}`}><b /></i>)}</>;
    case "envelope": return <div className="fg-env"><i className="back" /><i className="letter" /><i className="front" /><i className="flap" /><b className="hrt"><Heart /></b></div>;
    case "scroll": return <><i className="roll" /><i className="paper" /><i className="ribbon" /></>;
    case "door": return <><i className="light" /><i className="frame" /><i className="leaf" /></>;
    case "dawn": return <i className="sun" />;
    case "hold": return <HoldRing go={go} done={open} />;
    case "cup": return <><i className="saucer" /><i className="cup" /><i className="handle" />{ROUND(3).map((i) => <i key={i} className={`steam s${i}`} />)}</>;
    case "lens": return <>{ROUND(3).map((i) => <i key={i} className={`ring r${i}`} />)}<i className="glint" /></>;
    case "museum": return <><i className="arch" /><i className="plaque" /><i className="floor" /></>;
    case "vinyl": return <><i className="sleeve" /><i className="disc" /><i className="label" /></>;
    case "notes": return <>{ROUND(4).map((i) => <i key={i} className={`nt n${i}`} />)}</>;
    case "distance": return (
      <svg viewBox="0 0 240 150" className="fg-ds" fill="none">
        <path id="arc" className="arc" d="M24 118 C 70 10, 170 10, 216 118" />
        <circle cx="24" cy="118" r="6" className="p" /><circle cx="216" cy="118" r="6" className="p" />
        <circle r="4" className="dot"><animateMotion dur="5s" repeatCount="indefinite" path="M24 118 C 70 10, 170 10, 216 118" /></circle>
      </svg>
    );
    case "puzzle": return <>{ROUND(4).map((i) => <i key={i} className={`pz z${i}`} />)}</>;
    case "postcard": return <><i className="card" /><i className="stamp"><Heart /></i><i className="ln l1" /><i className="ln l2" /></>;
    case "rain": return <><i className="light" />{ROUND(16).map((i) => <i key={i} className="d" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${((i * 53) % 17) / 10}s`, animationDuration: `${1.6 + ((i * 29) % 9) / 10}s` }} />)}</>;
    case "lamp": return <><i className="cone" /><i className="lamp" /><i className="base" /></>;
    case "time": return <><i className="dial" /><i className="h hh" /><i className="h mn" /><b className="yr">{new Date().getFullYear()}</b></>;
  }
}

function Count({ n }: { n: number }) {
  const { reduced } = useFL();
  const [v, setV] = useState(reduced ? n : 0);
  useEffect(() => {
    if (reduced || n === 0) { setV(n); return; }
    let i = 0;
    const step = Math.max(1, Math.ceil(n / 40));
    const id = window.setInterval(() => { i = Math.min(n, i + step); setV(i); if (i >= n) window.clearInterval(id); }, 45);
    return () => window.clearInterval(id);
  }, [n, reduced]);
  return <b className="num">{n === 0 ? "∞" : v}</b>;
}

/** Press and hold to hold on. Keyboard users press Enter; anyone can use the plain button beneath. */
function HoldRing({ go, done }: { go: () => void; done: boolean }) {
  const { reduced } = useFL();
  const [p, setP] = useState(0);
  const raf = useRef<number | null>(null);
  const t0 = useRef(0);
  const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; if (!done) setP(0); };
  const tick = (t: number) => {
    const v = Math.min(1, (t - t0.current) / (reduced ? 200 : 1400));
    setP(v);
    if (v >= 1) { raf.current = null; go(); } else raf.current = requestAnimationFrame(tick);
  };
  const start = () => { if (done || raf.current) return; t0.current = performance.now(); raf.current = requestAnimationFrame(tick); };
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);
  const R = 52, C = 2 * Math.PI * R;
  return (
    <button type="button" tabIndex={-1} className="fg-hr" onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={(e) => e.preventDefault()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }}>
      <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r={R} className="track" /><circle cx="60" cy="60" r={R} className="fill" strokeDasharray={C} strokeDashoffset={C * (1 - p)} /></svg>
      <Heart className="h" />
    </button>
  );
}
