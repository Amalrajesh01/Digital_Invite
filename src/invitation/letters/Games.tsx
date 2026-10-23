"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Beat as B } from "@/domain/letters/types";
import { shuffled, useFL } from "./runtime";
import { Beat, Btn, Dots, Eyebrow, Head, Heart, Para, Pic, Quiet } from "./parts";

type Of<T extends B["type"]> = Extract<B, { type: T }>;

/** A few drawn symbols for clues (so a clue can show something without a photograph, and looks the same on every phone). */
export const GLYPHS: Record<string, string> = {
  star: "M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5 6 20.9l1.3-6.7-5-4.7 6.8-.8z",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z",
  music: "M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z",
  coffee: "M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1.500a2.500 2.500 0 0 1 0 5H17M8 2v3m4-3v3",
  candle: "M12 3c1.500 2 2 3 2 4a2 2 0 0 1-4 0c0-1 .5-2 2-4zM8 11h8v10H8z",
  key: "M14 10a4 4 0 1 1 0-.1zM11.500 12.500L3 21m3-3l2 2m1-5l2 2",
  ticket: "M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V6H3zM13 6v12",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7z",
  leaf: "M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v3m0 16v3M1 12h3m16 0h3M4.200 4.200l2.100 2.100m11.400 11.400l2.100 2.100M4.200 19.800l2.100-2.100M17.700 6.300l2.100-2.100",
  heart: "M12 21s-8-5.200-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 10c0 5.800-8 11-8 11z",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13",
};
export const Glyph = ({ name }: { name?: string }) => (name && GLYPHS[name] ? <svg viewBox="0 0 24 24" className="fl-glyph" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={GLYPHS[name]} /></svg> : null);
export const GLYPH_CHOICES: [string, string][] = Object.keys(GLYPHS).map((k) => [k, k[0].toUpperCase() + k.slice(1)]);

// ── clues, and a guess ─────────────────────────────────────────────────────────────────────────────────
export function Clues({ b }: { b: Of<"clues"> }) {
  const fl = useFL();
  const clues = fl.list(b.list);
  const opts = b.guess ? fl.list(b.guess.options) : [];
  const [n, setN] = useState(1);
  const [pick, setPick] = useState<number | null>(null);
  const [phase, setPhase] = useState<"clues" | "guess" | "reveal">("clues");
  const right = Math.max(0, opts.findIndex((o) => o.right === "1"));
  const allShown = n >= clues.length;
  const after = () => (opts.length ? setPhase("guess") : b.reveal && fl.txt(b.reveal) ? setPhase("reveal") : fl.next());
  return (
    <Beat className="fl-clues" kind="clues">
      <Head>{phase === "guess" ? fl.txt(b.guess?.question) || fl.s("guess") : fl.txt(b.title)}</Head>
      {phase === "clues" && (
        <>
          <ol className="fl-cluelist" aria-live="polite">
            {clues.slice(0, n).map((c, i) => (
              <li key={i} className="fl-clue fl-flipin">
                {b.icons && <span className="fl-clue-ic"><Glyph name={c.icon} /></span>}
                <span className="fl-clue-n">{i + 1}</span>
                <p>{c.text}</p>
              </li>
            ))}
          </ol>
          <Dots n={clues.length} at={n - 1} />
          <div className="fl-after">{allShown ? <Btn onClick={after}>{opts.length ? fl.s("guess") : b.cta ?? fl.s("continue")}</Btn> : <Btn ghost onClick={() => setN((x) => x + 1)}>{fl.s("nextClue")}</Btn>}</div>
        </>
      )}
      {phase === "guess" && (
        <>
          <ul className="fl-options">
            {opts.map((o, i) => (
              <li key={i}>
                <button type="button" disabled={pick !== null} data-state={pick === null ? "" : i === right ? "right" : i === pick ? "near" : "off"} onClick={() => { setPick(i); fl.answers.record(fl.txt(b.guess?.question), o.text); }} className="fl-option">{o.text}</button>
              </li>
            ))}
          </ul>
          {pick !== null && (
            <div className="fl-fb fl-rise" role="status">
              <p>{pick === right ? fl.s("gotIt") : fl.s("closeOne")}</p>
              {pick !== right && <p className="fl-fb-sub">{fl.s("itWas")}: <b>{opts[right]?.text}</b></p>}
              <Btn onClick={() => (b.reveal && fl.txt(b.reveal) ? setPhase("reveal") : fl.next())}>{fl.s("continue")}</Btn>
            </div>
          )}
          {pick === null && <div className="fl-after"><Quiet onClick={() => (b.reveal && fl.txt(b.reveal) ? setPhase("reveal") : fl.next())}>{fl.s("showMe")}</Quiet></div>}
        </>
      )}
      {phase === "reveal" && (
        <>
          <p className="fl-big fl-rise">{fl.txt(b.reveal)}</p>
          <div className="fl-after"><Btn onClick={fl.next}>{b.cta ?? fl.s("continue")}</Btn></div>
        </>
      )}
    </Beat>
  );
}

// ── a quiz of any number of rounds ─────────────────────────────────────────────────────────────────────
export function Quiz({ b }: { b: Of<"quiz"> }) {
  const fl = useFL();
  const rounds = fl.list(b.list);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const r = rounds[Math.min(i, rounds.length - 1)];
  const opts = (["a", "b", "c"] as const).filter((k) => r[k]);
  const graded = !!r.right && opts.includes(r.right as "a");
  const last = i >= rounds.length - 1;
  const choose = (k: string) => {
    setPick(k);
    fl.answers.record(r.q, r[k]);
    if (graded && k === r.right) setScore((s) => s + 1);
  };
  const advance = () => { if (last) setDone(true); else { setI((n) => n + 1); setPick(null); setHint(false); } };
  const photos = rounds.filter((x) => x.photo);
  if (done) {
    const gradedCount = rounds.filter((x) => x.right).length;
    return (
      <Beat className="fl-quiz fl-quiz-end" kind="quiz">
        <Head>{fl.txt(b.title)}</Head>
        {gradedCount > 0 && <p className="fl-big fl-pop">{fl.s("score", { n: score, total: gradedCount })}</p>}
        {gradedCount > 0 && <Para className="fl-note">{fl.s("scoreNote")}</Para>}
        {b.collage && photos.length > 0 && <div className="fl-collage">{photos.slice(0, 6).map((p, k) => <Pic key={k} id={p.photo} className="fl-collage-img" />)}</div>}
        <div className="fl-after"><Btn onClick={fl.next}>{fl.s("continue")}</Btn></div>
      </Beat>
    );
  }
  return (
    <Beat className="fl-quiz" kind="quiz">
      <Eyebrow>{fl.txt(b.title)}</Eyebrow>
      <p className="fl-count">{fl.s("round", { n: i + 1, total: rounds.length })}</p>
      <Head>{r.q}</Head>
      <ul className="fl-options" key={i}>
        {opts.map((k) => (
          <li key={k}>
            <button type="button" disabled={pick !== null} onClick={() => choose(k)} className="fl-option" data-state={pick === null || !graded ? (pick === k ? "chosen" : "") : k === r.right ? "right" : k === pick ? "near" : "off"}>{r[k]}</button>
          </li>
        ))}
      </ul>
      {pick === null && r.hint && (hint ? <p className="fl-hint fl-rise">{r.hint}</p> : <Quiet onClick={() => setHint(true)}>{fl.s("hintBtn")}</Quiet>)}
      {pick !== null && (
        <div className="fl-fb fl-rise" role="status">
          {graded && <p>{pick === r.right ? fl.s("gotIt") : fl.s("closeOne")}</p>}
          {graded && pick !== r.right && <p className="fl-fb-sub">{fl.s("itWas")}: <b>{r[r.right]}</b></p>}
          {r.photo && <Pic id={r.photo} className="fl-fb-photo" />}
          {r.reveal && <p className="fl-fb-reveal">{r.reveal}</p>}
          <Btn onClick={advance}>{last ? fl.s("continue") : fl.s("next")}</Btn>
        </div>
      )}
      {pick === null && <div className="fl-after"><Quiet onClick={advance}>{fl.s("skip")}</Quiet></div>}
    </Beat>
  );
}

// ── cards to turn over ─────────────────────────────────────────────────────────────────────────────────
export function Flip({ b }: { b: Of<"flip"> }) {
  const fl = useFL();
  const cards = fl.list(b.list);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const need = Math.min(b.need ?? 3, cards.length);
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <Beat className="fl-flip" kind="flip">
      <Head>{fl.txt(b.title)}</Head>
      <p className="fl-count" aria-live="polite">{open.size < need ? fl.s("flipHint") : fl.s("seen", { n: open.size, total: cards.length })}</p>
      <ul className="fl-grid">
        {cards.map((c, i) => (
          <li key={i}>
            <button type="button" className="fl-fcard" aria-pressed={open.has(i)} onClick={() => toggle(i)} data-open={open.has(i)}>
              <span className="fl-face fl-front"><Heart />{c.front}</span>
              <span className="fl-face fl-rear">{c.photo && <Pic id={c.photo} className="fl-face-photo" />}<span>{c.back}</span></span>
            </button>
          </li>
        ))}
      </ul>
      <div className="fl-after"><Btn ghost={open.size < need} onClick={fl.next}>{fl.s("continue")}</Btn></div>
    </Beat>
  );
}

// ── a deck of cards to draw ────────────────────────────────────────────────────────────────────────────
export function Deck({ b }: { b: Of<"deck"> }) {
  const fl = useFL();
  const cards = fl.list(b.list);
  const [i, setI] = useState(-1);
  const c = cards[i];
  const last = i >= cards.length - 1;
  return (
    <Beat className="fl-deck" kind="deck">
      <Head>{fl.txt(b.title)}</Head>
      <div className="fl-stack" aria-live="polite">
        {i < 0 ? <button type="button" className="fl-drawn fl-back-card" onClick={() => setI(0)}><Heart /><span>{fl.s("drawCard")}</span></button> : (
          <article className="fl-drawn fl-flipin" key={i}>
            <p className="fl-count">{fl.s("round", { n: i + 1, total: cards.length })}</p>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </article>
        )}
      </div>
      <div className="fl-after">
        {i >= 0 && !last && (<><Btn onClick={() => setI((n) => n + 1)}>{fl.s("done")}</Btn><Btn ghost onClick={() => setI((n) => n + 1)}>{fl.s("skip")}</Btn></>)}
        {i >= 0 && last && <Btn onClick={fl.next}>{fl.s("continue")}</Btn>}
      </div>
    </Beat>
  );
}

// ── envelopes: choose one ──────────────────────────────────────────────────────────────────────────────
export function Envelopes({ b }: { b: Of<"envelopes"> }) {
  const fl = useFL();
  const wishes = fl.list(b.list).slice(0, 4);
  const [pick, setPick] = useState<number | null>(null);
  return (
    <Beat className="fl-envelopes" kind="envelopes">
      <Head>{fl.txt(b.title)}</Head>
      <Para>{pick === null ? fl.txt(b.sub) || fl.s("pickHint") : ""}</Para>
      <ul className="fl-envrow">
        {wishes.map((w, i) => (
          <li key={i}>
            <button type="button" className="fl-env" data-open={pick === i} data-dim={pick !== null && pick !== i} aria-pressed={pick === i} onClick={() => setPick(i)} aria-label={`${fl.s("open")} ${i + 1}`}>
              <i className="fl-env-flap" /><i className="fl-env-card" /><i className="fl-env-body" /><b className="fl-env-n">{i + 1}</b>
            </button>
          </li>
        ))}
      </ul>
      {pick !== null && <div className="fl-fb fl-rise" role="status"><p className="fl-fb-reveal">{wishes[pick].text}</p></div>}
      <div className="fl-after">{pick !== null && wishes.length > 1 && <Quiet onClick={() => setPick(null)}>{fl.s("tryAgain")}</Quiet>}<Btn ghost={pick === null} onClick={fl.next}>{fl.s("continue")}</Btn></div>
    </Beat>
  );
}

// ── scratch to reveal (with a plain button beside it) ──────────────────────────────────────────────────
export function Scratch({ b }: { b: Of<"scratch"> }) {
  const fl = useFL();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const strokes = useRef(0);
  useEffect(() => {
    const c = canvas.current;
    if (!c || done) return;
    const w = c.clientWidth, h = c.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext("2d");
    if (!g) return;
    g.scale(dpr, dpr);
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#c9c3b8"); grad.addColorStop(0.5, "#ece6d9"); grad.addColorStop(1, "#b9b2a5");
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(0,0,0,.12)"; g.font = "600 15px system-ui"; g.textAlign = "center"; g.fillText(fl.s("scratchHint"), w / 2, h / 2);
    let down = false;
    const at = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const scratch = (e: PointerEvent) => {
      if (!down) return;
      const [x, y] = at(e);
      g.globalCompositeOperation = "destination-out";
      g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.fill();
      if (++strokes.current % 8 === 0) {
        const d = g.getImageData(0, 0, c.width, c.height).data;
        let clear = 0, total = 0;
        for (let k = 3; k < d.length; k += 4 * 40) { total++; if (d[k] < 40) clear++; }
        if (clear / total > 0.55) setDone(true);
      }
    };
    const on = (e: PointerEvent) => { down = true; c.setPointerCapture(e.pointerId); scratch(e); };
    const off = () => { down = false; };
    c.addEventListener("pointerdown", on); c.addEventListener("pointermove", scratch); c.addEventListener("pointerup", off); c.addEventListener("pointercancel", off);
    return () => { c.removeEventListener("pointerdown", on); c.removeEventListener("pointermove", scratch); c.removeEventListener("pointerup", off); c.removeEventListener("pointercancel", off); };
  }, [done, fl]);
  return (
    <Beat className="fl-scratch" kind="scratch">
      <Head>{fl.txt(b.title)}</Head>
      <Para>{fl.txt(b.sub)}</Para>
      <div className="fl-scratchbox" data-done={done}>
        <p className="fl-scratch-text">{fl.txt(b.src)}</p>
        {!done && <canvas ref={canvas} className="fl-scratch-foil" aria-hidden />}
      </div>
      <div className="fl-after">{done ? <Btn onClick={fl.next}>{fl.s("continue")}</Btn> : <Btn ghost onClick={() => setDone(true)}>{fl.s("scratchAlt")}</Btn>}</div>
    </Beat>
  );
}

// ── put them in order ──────────────────────────────────────────────────────────────────────────────────
export function Order({ b }: { b: Of<"order"> }) {
  const fl = useFL();
  const steps = fl.list(b.list);
  const order = useMemo(() => shuffled(steps.map((_, i) => i), 7 + steps.length), [steps.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [got, setGot] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const done = got.length === steps.length;
  const tap = (i: number) => {
    if (got.includes(i) || done) return;
    if (i === got.length) { setGot([...got, i]); setWrong(null); } else { setWrong(i); window.setTimeout(() => setWrong(null), 700); }
  };
  return (
    <Beat className="fl-order" kind="order">
      <Head>{fl.txt(b.title)}</Head>
      <Para>{done ? fl.s("orderDone") : fl.txt(b.sub) || fl.s("orderHint")}</Para>
      <ol className="fl-orderlist">
        {done ? steps.map((s, i) => <li key={i} className="fl-orderitem fl-rise" data-got style={{ animationDelay: `${i * 0.12}s` }}><b>{i + 1}</b><span>{s.when && <em>{s.when}</em>}{s.text}</span></li>) : order.map((i) => (
          <li key={i}><button type="button" className="fl-orderitem" data-got={got.includes(i)} data-wrong={wrong === i} onClick={() => tap(i)} disabled={got.includes(i)}><b>{got.includes(i) ? got.indexOf(i) + 1 : ""}</b><span>{steps[i].when && <em>{steps[i].when}</em>}{steps[i].text}</span></button></li>
        ))}
      </ol>
      <div className="fl-after">{done ? <Btn onClick={fl.next}>{fl.s("continue")}</Btn> : <Quiet onClick={() => setGot(steps.map((_, i) => i))}>{fl.s("showMe")}</Quiet>}</div>
    </Beat>
  );
}

// ── memory match ───────────────────────────────────────────────────────────────────────────────────────
export function Match({ b }: { b: Of<"match"> }) {
  const fl = useFL();
  const pairs = fl.list(b.list).slice(0, 6);
  const cards = useMemo(() => shuffled(pairs.flatMap((p, i) => [{ k: `${i}a`, i, side: "a", t: p.a, photo: p.photo }, { k: `${i}b`, i, side: "b", t: p.b, photo: undefined as string | undefined }]), 11 + pairs.length), [pairs.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [up, setUp] = useState<string[]>([]);
  const [won, setWon] = useState<number[]>([]);
  const flip = (k: string, i: number) => {
    if (up.includes(k) || won.includes(i) || up.length === 2) return;
    const next = [...up, k];
    setUp(next);
    if (next.length === 2) {
      const [x, y] = next.map((id) => cards.find((c) => c.k === id)!);
      window.setTimeout(() => { if (x.i === y.i) setWon((w) => [...w, x.i]); setUp([]); }, 800);
    }
  };
  const all = won.length === pairs.length;
  return (
    <Beat className="fl-match" kind="match">
      <Head>{fl.txt(b.title)}</Head>
      <p className="fl-count" aria-live="polite">{all ? fl.s("done") : fl.s("matchHint")}</p>
      <ul className="fl-matchgrid">
        {cards.map((c) => {
          const shown = all || won.includes(c.i) || up.includes(c.k);
          return (
            <li key={c.k}>
              <button type="button" className="fl-mcard" data-open={shown} data-won={all || won.includes(c.i)} aria-pressed={shown} aria-label={shown ? c.t : fl.s("flipHint")} onClick={() => flip(c.k, c.i)}>
                <span className="fl-face fl-front"><Heart /></span>
                <span className="fl-face fl-rear">{c.photo && <Pic id={c.photo} className="fl-face-photo" />}<span>{c.t}</span></span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="fl-after">{all ? <Btn onClick={fl.next}>{fl.s("continue")}</Btn> : <Quiet onClick={() => setWon(pairs.map((_, i) => i))}>{fl.s("showMe")}</Quiet>}</div>
    </Beat>
  );
}

// ── a picture, uncovered square by square ──────────────────────────────────────────────────────────────
export function Tiles({ b }: { b: Of<"tiles"> }) {
  const fl = useFL();
  const p = fl.photo(fl.txt(b.photo)) ?? fl.backdrop;
  const [open, setOpen] = useState<Set<number>>(new Set());
  const all = open.size >= 9;
  return (
    <Beat className="fl-tiles" kind="tiles">
      <Head>{fl.txt(b.title)}</Head>
      <p className="fl-count" aria-live="polite">{all ? "" : fl.s("tilesHint")}</p>
      <div className="fl-tilebox" style={p ? { backgroundImage: `url(${p.src})`, backgroundPosition: p.focal ? `${p.focal.x}% ${p.focal.y}%` : "center" } : undefined} role="img" aria-label={p?.alt ?? ""}>
        {Array.from({ length: 9 }, (_, i) => <button key={i} type="button" className="fl-tile" data-open={all || open.has(i)} aria-label={`${i + 1}`} onClick={() => setOpen((s) => new Set(s).add(i))} />)}
      </div>
      {all && <p className="fl-big fl-rise">{fl.txt(b.caption)}</p>}
      <div className="fl-after">{all ? <Btn onClick={fl.next}>{fl.s("continue")}</Btn> : <Quiet onClick={() => setOpen(new Set(Array.from({ length: 9 }, (_, i) => i)))}>{fl.s("tilesAll")}</Quiet>}</div>
    </Beat>
  );
}

// ── “which would you choose?”, and what the answers suggest ────────────────────────────────────────────
export function Choose({ b }: { b: Of<"choose"> }) {
  const fl = useFL();
  const qs = fl.list(b.list);
  const [i, setI] = useState(0);
  const q = qs[i];
  const pick = (side: "a" | "b") => {
    fl.answers.record(q.q, q[side]);
    const tag = q[side === "a" ? "tagA" : "tagB"];
    if (tag) fl.answers.addTag(tag);
    if (i >= qs.length - 1) fl.next(); else setI((n) => n + 1);
  };
  return (
    <Beat className="fl-choose" kind="choose">
      <Eyebrow>{fl.txt(b.title)}</Eyebrow>
      <p className="fl-count">{fl.s("round", { n: i + 1, total: qs.length })}</p>
      <Head>{q.q || fl.s("chooseOne")}</Head>
      <div className="fl-pair" key={i}>
        <button type="button" className="fl-option fl-pop" onClick={() => pick("a")}>{q.a}</button>
        <span className="fl-or" aria-hidden>or</span>
        <button type="button" className="fl-option fl-pop" style={{ animationDelay: ".08s" }} onClick={() => pick("b")}>{q.b}</button>
      </div>
    </Beat>
  );
}

export function Suggest({ b }: { b: Of<"suggest"> }) {
  const fl = useFL();
  const opts = fl.list(b.list);
  const best = useMemo(() => {
    let top = 0, score = -1;
    opts.forEach((o, i) => {
      const tags = (o.tags ?? "").split(/[,\s]+/).filter(Boolean);
      const s = tags.filter((t) => fl.answers.tags.includes(t)).length;
      if (s > score) { score = s; top = i; }
    });
    return opts[top];
  }, [opts, fl.answers.tags]);
  return (
    <Beat className="fl-suggest" kind="suggest">
      <Eyebrow>{fl.s("forYou")}</Eyebrow>
      <Head>{fl.txt(b.title)}</Head>
      <div className="fl-ticket fl-pop"><p className="fl-ticket-title">{best.title}</p><p>{best.detail}</p><Heart className="fl-ticket-heart" /></div>
      <div className="fl-after"><Btn onClick={fl.next}>{fl.s("continue")}</Btn></div>
    </Beat>
  );
}

