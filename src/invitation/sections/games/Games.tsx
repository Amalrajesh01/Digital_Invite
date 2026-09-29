"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import type { GamesDoc } from "@/domain/doc/schema";
import type { GameKey, PlayResult } from "@/domain/games/service";
import { ApiError, useInvitation } from "../../engine/context";
import { Photo } from "../../engine/Photo";

export interface GameProps {
  onDone: (r: PlayResult) => void;
  play: (payload: { answers?: Record<string, number>; marked?: string[] }) => Promise<PlayResult>;
}

/** Shared "play" wrapper: asks the server to score, turns errors into friendly text. */
export function usePlay(game: GameKey, name: string, onDone: (r: PlayResult) => void) {
  const { post, t, locale } = useInvitation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const play = useCallback(
    async (payload: { answers?: Record<string, number>; marked?: string[] }) => {
      setBusy(true);
      setError("");
      try {
        const r = await post<PlayResult>("/play", { game, ...payload, name: name || undefined, locale });
        onDone(r);
        return r;
      } catch (e) {
        setError(e instanceof ApiError && e.code !== "NETWORK" && e.code !== "INTERNAL" ? e.message : t("error.generic"));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [post, game, name, onDone, t, locale],
  );
  return { play, error, busy };
}

// ── quiz (couple trivia / how well do you know us) ──────────────────────────
export function Quiz({ game, name, onDone }: { game: "TRIVIA" | "COUPLE_QUIZ"; name: string; onDone: (r: PlayResult) => void }) {
  const { view, L, t } = useInvitation();
  const qs = view.doc.games.trivia.questions;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const { play, error, busy } = usePlay(game, name, onDone);
  const q = qs[i];
  if (!q) return null;
  const choose = async (idx: number) => {
    const next = { ...answers, [q.id]: idx };
    setAnswers(next);
    if (i + 1 < qs.length) setI(i + 1);
    else await play({ answers: next }).catch(() => undefined);
  };
  return (
    <div>
      <div className="mb-6 flex items-center justify-between text-[0.85rem] inv-muted"><span>{i + 1} / {qs.length}</span><div className="ml-4 h-1 flex-1 bg-[var(--c-border)]"><div className="h-full bg-[var(--c-accent)] transition-all" style={{ width: `${((i + 1) / qs.length) * 100}%` }} /></div></div>
      <h4 className="inv-h3">{L(q.q)}</h4>
      <div className="mt-6 space-y-3" role="group" aria-label={L(q.q)}>
        {q.options.map((o, idx) => (<button key={idx} type="button" disabled={busy} className="inv-choice" onClick={() => void choose(idx)}><span className="dot" /><span>{L(o)}</span></button>))}
      </div>
      {error && <p className="inv-error" role="alert">{error}</p>}
      {busy && <p className="inv-muted mt-4 text-sm">{t("common.loading")}</p>}
    </div>
  );
}

// ── bingo ───────────────────────────────────────────────────────────────────
export function Bingo({ name, onDone }: { name: string; onDone: (r: PlayResult) => void }) {
  const { view, L, t } = useInvitation();
  const squares = view.doc.games.bingo.squares;
  const size = Math.floor(Math.sqrt(squares.length));
  const cells = squares.slice(0, size * size);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const { play, error, busy } = usePlay("BINGO", name, onDone);
  const lines = useMemo(() => {
    const at = (r: number, c: number) => cells[r * size + c]?.id;
    const ls: string[][] = [];
    for (let i = 0; i < size; i++) {
      ls.push(Array.from({ length: size }, (_, c) => at(i, c)));
      ls.push(Array.from({ length: size }, (_, r) => at(r, i)));
    }
    ls.push(Array.from({ length: size }, (_, i) => at(i, i)));
    ls.push(Array.from({ length: size }, (_, i) => at(i, size - 1 - i)));
    return ls;
  }, [cells, size]);
  const won = lines.filter((l) => l.every((id) => marked.has(id))).length;
  const inWin = new Set(lines.filter((l) => l.every((id) => marked.has(id))).flat());
  return (
    <div>
      <div className="mx-auto grid max-w-md gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {cells.map((c) => {
          const on = marked.has(c.id);
          return (
            <button key={c.id} type="button" aria-pressed={on} onClick={() => setMarked((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })} className={cn("relative grid aspect-square place-items-center border p-1 text-center text-[0.72rem] leading-tight transition-colors md:text-[0.82rem]", on ? "border-[var(--c-primary)] bg-[var(--c-primary)] text-[var(--c-on-primary)]" : "border-[var(--c-border)] bg-[var(--c-surface)]", inWin.has(c.id) && "!bg-[var(--c-accent)] !text-[var(--c-inverse)]")} style={{ borderRadius: "var(--r)" }}>
              {on && <Check className="absolute right-1 top-1 size-3 opacity-80" />}{L(c.text)}
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-center inv-muted">{t("games.correct", { n: won })} · BINGO ×{won}</p>
      {error && <p className="inv-error text-center" role="alert">{error}</p>}
      <div className="mt-5 text-center"><button type="button" className="inv-btn" disabled={busy} onClick={() => void play({ marked: [...marked] }).catch(() => undefined)}>{t("games.finish")}</button></div>
    </div>
  );
}

// ── prediction wheel ────────────────────────────────────────────────────────
export function Wheel({ name, onDone }: { name: string; onDone: (r: PlayResult) => void }) {
  const { view, L, t, reducedMotion } = useInvitation();
  const prizes = view.doc.games.wheel.prizes;
  const n = Math.max(prizes.length, 2);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const { play, error } = usePlay("WHEEL", name, () => undefined);
  const spin = async () => {
    setSpinning(true);
    try {
      const r = await play({});
      const idx = Math.max(0, prizes.findIndex((p) => L(p.label) === r.detail?.label));
      const slice = 360 / n;
      const target = 360 * 6 - (idx * slice + slice / 2);
      setAngle((a) => a + (target - (a % 360)) + 0);
      window.setTimeout(() => { setSpinning(false); onDone(r); }, reducedMotion ? 100 : 4300);
    } catch {
      setSpinning(false);
    }
  };
  const colors = ["var(--c-primary)", "var(--c-accent)", "var(--c-secondary)", "color-mix(in srgb, var(--c-primary) 55%, var(--c-bg))"];
  return (
    <div className="text-center">
      <div className="relative mx-auto w-[min(78vw,20rem)]">
        <div aria-hidden className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-[var(--c-text)]" />
        <svg viewBox="-100 -100 200 200" className="w-full" style={{ transform: `rotate(${angle}deg)`, transition: reducedMotion ? "none" : "transform 4.2s cubic-bezier(.12,.7,.1,1)" }} role="img" aria-label={t("games.wheel")}>
          {prizes.map((p, i) => {
            const a0 = ((i * 360) / n - 90) * (Math.PI / 180), a1 = (((i + 1) * 360) / n - 90) * (Math.PI / 180);
            const x0 = 98 * Math.cos(a0), y0 = 98 * Math.sin(a0), x1 = 98 * Math.cos(a1), y1 = 98 * Math.sin(a1);
            const mid = (a0 + a1) / 2;
            return (
              <g key={p.id}>
                <path d={`M0 0 L${x0} ${y0} A98 98 0 0 1 ${x1} ${y1} Z`} fill={colors[i % colors.length]} stroke="var(--c-bg)" strokeWidth="1.2" />
                <text x={62 * Math.cos(mid)} y={62 * Math.sin(mid)} fontSize="8.5" fill="var(--c-on-primary)" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(mid * 180) / Math.PI + 90} ${62 * Math.cos(mid)} ${62 * Math.sin(mid)})`} style={{ fontFamily: "var(--f-heading)" }}>{L(p.label).slice(0, 14)}</text>
              </g>
            );
          })}
          <circle r="9" fill="var(--c-bg)" stroke="var(--c-text)" strokeWidth="1" />
        </svg>
      </div>
      {error && <p className="inv-error mt-4" role="alert">{error}</p>}
      <button type="button" className="inv-btn mt-8" disabled={spinning} onClick={() => void spin()}>{t("games.spin")}</button>
    </div>
  );
}

// ── scratch card ────────────────────────────────────────────────────────────
export function Scratch({ name, onDone }: { name: string; onDone: (r: PlayResult) => void }) {
  const { t, reducedMotion } = useInvitation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [prize, setPrize] = useState<PlayResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const started = useRef(false);
  const { play, error } = usePlay("SCRATCH", name, () => undefined);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, "#c9c5bd"); g.addColorStop(0.5, "#eeeae2"); g.addColorStop(1, "#b7b2a8");
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(60,55,45,.55)"; ctx.font = "600 18px system-ui"; ctx.textAlign = "center"; ctx.fillText(t("games.scratchHere").toUpperCase(), c.width / 2, c.height / 2 + 6);
  }, [t]);

  const scratch = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (revealed || (ev.buttons === 0 && ev.pointerType === "mouse")) return;
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(((ev.clientX - r.left) * c.width) / r.width, ((ev.clientY - r.top) * c.height) / r.height, 22, 0, Math.PI * 2);
    ctx.fill();
    if (!started.current) {
      started.current = true;
      void play({}).then(setPrize).catch(() => undefined);
    }
    // sample clearance occasionally
    if (Math.random() < 0.12) {
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let clear = 0;
      for (let i = 3; i < d.length; i += 64) if (d[i] === 0) clear++;
      if (clear / (d.length / 64) > 0.45 && prize) {
        setRevealed(true);
        onDone(prize);
      }
    }
  };
  return (
    <div className="text-center">
      <div className="relative mx-auto aspect-[16/10] w-full max-w-sm overflow-hidden border border-[var(--c-border)] bg-[var(--c-surface)]" style={{ borderRadius: "var(--r)" }}>
        <div className="absolute inset-0 grid place-items-center p-6">
          {prize ? (<div><p className="inv-eyebrow">{t("games.yourPrize")}</p><p className="inv-h2 mt-2 !text-[2rem]">{prize.detail?.label}</p>{prize.detail?.note && <p className="inv-muted mt-2 text-[0.92rem]">{prize.detail.note}</p>}</div>) : <span className="inv-muted">…</span>}
        </div>
        <canvas ref={canvas} width={480} height={300} onPointerMove={scratch} onPointerDown={scratch} className={cn("absolute inset-0 h-full w-full touch-none cursor-crosshair transition-opacity duration-700", revealed && "pointer-events-none opacity-0")} aria-label={t("games.scratchHere")} />
      </div>
      {prize && !revealed && (<button type="button" className="inv-btn inv-btn-ghost inv-btn-sm mt-5" onClick={() => { setRevealed(true); onDone(prize); }}>{t("common.done")}</button>)}
      {reducedMotion && null}
      {error && <p className="inv-error mt-4" role="alert">{error}</p>}
    </div>
  );
}

// ── fortune cookie ──────────────────────────────────────────────────────────
export function Fortune({ name, onDone }: { name: string; onDone: (r: PlayResult) => void }) {
  const { t } = useInvitation();
  const [res, setRes] = useState<PlayResult | null>(null);
  const [cracked, setCracked] = useState(false);
  const { play, error } = usePlay("FORTUNE", name, () => undefined);
  const crack = async () => {
    if (cracked) return;
    setCracked(true);
    try {
      const r = await play({});
      setRes(r);
      window.setTimeout(() => onDone(r), 1200);
    } catch {
      setCracked(false);
    }
  };
  return (
    <div className="text-center">
      <button type="button" onClick={() => void crack()} aria-label={t("games.crack")} className="group mx-auto block">
        <svg viewBox="0 0 200 120" className="mx-auto w-64 overflow-visible" aria-hidden>
          <g style={{ transform: cracked ? "translateX(-14px) rotate(-8deg)" : "none", transformOrigin: "100px 60px", transition: "transform .6s var(--ease)" }}>
            <path d="M100 60C70 14 18 30 26 74c6 22 40 32 74-14z" fill="var(--c-accent)" stroke="var(--c-text)" strokeWidth="1.4" />
          </g>
          <g style={{ transform: cracked ? "translateX(14px) rotate(8deg)" : "none", transformOrigin: "100px 60px", transition: "transform .6s var(--ease)" }}>
            <path d="M100 60c30-46 82-30 74 14-6 22-40 32-74-14z" fill="color-mix(in srgb, var(--c-accent) 85%, #fff)" stroke="var(--c-text)" strokeWidth="1.4" />
          </g>
        </svg>
      </button>
      {!cracked && <p className="inv-muted mt-4">{t("games.crack")}</p>}
      {res && <div className="mx-auto mt-8 max-w-sm border border-dashed border-[var(--c-accent)] bg-[var(--c-surface)] p-6 [animation:inv-rise_.8s_var(--ease)]"><p className="text-[1.15rem] italic leading-[1.7]" style={{ fontFamily: "var(--f-heading)" }}>“{res.detail?.label}”</p></div>}
      {error && <p className="inv-error mt-4" role="alert">{error}</p>}
    </div>
  );
}

// ── spot the difference ─────────────────────────────────────────────────────
export function FindDiff({ name, onDone }: { name: string; onDone: (r: PlayResult) => void }) {
  const { view, t } = useInvitation();
  const g = view.doc.games.findDiff;
  const [found, setFound] = useState<Set<string>>(new Set());
  const { play, error, busy } = usePlay("FIND_DIFF", name, onDone);
  const click = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
    const hit = g.spots.find((s) => Math.hypot(s.x - x, s.y - y) <= Math.max(s.r, 6));
    if (hit) setFound((f) => new Set(f).add(hit.id));
  };
  const all = found.size === g.spots.length;
  const done = useRef(false);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (all && !done.current) {
      done.current = true;
      setFinished(true);
      void play({ marked: [...found] }).catch(() => undefined);
    }
  }, [all, found, play]);
  const renderImg = (id: string | undefined, interactive?: boolean) => (
    <div className={cn("relative aspect-[4/3] overflow-hidden", interactive && "cursor-crosshair")} style={{ borderRadius: "var(--r)" }} onClick={interactive ? click : undefined}>
      <Photo id={id} className="absolute inset-0" seed={2} sizes="(max-width: 768px) 100vw, 600px" />
      {interactive && g.spots.map((s) => found.has(s.id) && (<span key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--c-accent)] bg-[var(--c-accent)]/20" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${Math.max(s.r, 6) * 2}%`, aspectRatio: "1" }} />))}
    </div>
  );
  return (
    <div>
      <p className="mb-4 text-center inv-muted">{t("games.found", { n: found.size, total: g.spots.length })}</p>
      <div className="grid gap-3 md:grid-cols-2">{renderImg(g.a)}{renderImg(g.b, true)}</div>
      {error && <p className="inv-error text-center" role="alert">{error}</p>}
      <div className="mt-5 text-center"><button type="button" className="inv-btn" disabled={busy || finished} onClick={() => { done.current = true; setFinished(true); void play({ marked: [...found] }).catch(() => undefined); }}>{t("games.finish")}</button></div>
    </div>
  );
}

// ── guess the song ──────────────────────────────────────────────────────────
export function GuessSong({ name, onDone }: { name: string; onDone: (r: PlayResult) => void }) {
  const { view, L, t, media, music } = useInvitation();
  const rounds = view.doc.games.guessSong.rounds;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const { play, error, busy } = usePlay("GUESS_SONG", name, onDone);
  const r = rounds[i];
  if (!r) return null;
  const clip = media(r.audio);
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    music.pause();
    if (a.paused) void a.play();
    else a.pause();
  };
  const pick = async (idx: number) => {
    audio.current?.pause();
    const next = { ...answers, [r.id]: idx };
    setAnswers(next);
    if (i + 1 < rounds.length) setI(i + 1);
    else await play({ answers: next }).catch(() => undefined);
  };
  return (
    <div className="text-center">
      <p className="mb-2 text-[0.85rem] inv-muted">{i + 1} / {rounds.length}</p>
      <h4 className="inv-h3">{L(r.clue)}</h4>
      {clip && (<><button type="button" className="inv-btn mx-auto mt-6 !rounded-full" onClick={toggle} aria-pressed={playing}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}{t("games.listen")}</button><audio key={r.id} ref={audio} src={clip.url} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} /></>)}
      <div className="mt-6 space-y-3 text-left">{r.options.map((o, idx) => (<button key={idx} type="button" disabled={busy} className="inv-choice" onClick={() => void pick(idx)}><span className="dot" />{L(o)}</button>))}</div>
      {error && <p className="inv-error mt-3" role="alert">{error}</p>}
    </div>
  );
}

// ── crossword ───────────────────────────────────────────────────────────────
interface Placed { id: string; word: string; clue: string; r: number; c: number; dir: "A" | "D"; n: number }

/** Greedy crossword layout: each new word crosses an already-placed letter where possible. */
export function layoutCrossword(words: { id: string; answer: string; clue: string }[]): { placed: Placed[]; rows: number; cols: number } {
  const clean = words.map((w) => ({ ...w, answer: w.answer.toUpperCase().replace(/[^\p{L}]/gu, "") })).filter((w) => w.answer.length >= 2).sort((a, b) => b.answer.length - a.answer.length);
  if (!clean.length) return { placed: [], rows: 0, cols: 0 };
  const grid = new Map<string, string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const placed: Placed[] = [];
  const canPlace = (w: string, r: number, c: number, dir: "A" | "D") => {
    for (let i = 0; i < w.length; i++) {
      const rr = dir === "D" ? r + i : r, cc = dir === "A" ? c + i : c;
      const ex = grid.get(key(rr, cc));
      if (ex && ex !== w[i]) return false;
      if (!ex) {
        const side = dir === "A" ? [[rr - 1, cc], [rr + 1, cc]] : [[rr, cc - 1], [rr, cc + 1]];
        if (side.some(([a, b]) => grid.has(key(a, b)))) return false;
      }
    }
    const br = dir === "D" ? r - 1 : r, bc = dir === "A" ? c - 1 : c, ar = dir === "D" ? r + w.length : r, ac = dir === "A" ? c + w.length : c;
    return !grid.has(key(br, bc)) && !grid.has(key(ar, ac));
  };
  const put = (w: (typeof clean)[number], r: number, c: number, dir: "A" | "D") => {
    for (let i = 0; i < w.answer.length; i++) grid.set(key(dir === "D" ? r + i : r, dir === "A" ? c + i : c), w.answer[i]);
    placed.push({ id: w.id, word: w.answer, clue: w.clue, r, c, dir, n: 0 });
  };
  put(clean[0], 0, 0, "A");
  for (const w of clean.slice(1)) {
    let done = false;
    for (const p of placed) {
      if (done) break;
      for (let i = 0; i < w.answer.length && !done; i++) for (let j = 0; j < p.word.length && !done; j++) {
        if (w.answer[i] !== p.word[j]) continue;
        const dir = p.dir === "A" ? "D" : "A";
        const r = dir === "D" ? p.r - i : p.r + j, c = dir === "A" ? p.c - i : p.c + j;
        // p is horizontal: shared cell (p.r, p.c+j) → new vertical word starts at (p.r - i, p.c + j)
        const rr = dir === "D" ? p.r - i : p.r + j;
        const cc = dir === "D" ? p.c + j : p.c - i;
        void r; void c;
        if (canPlace(w.answer, rr, cc, dir)) { put(w, rr, cc, dir); done = true; }
      }
    }
  }
  const minR = Math.min(...placed.map((p) => p.r)), minC = Math.min(...placed.map((p) => p.c));
  placed.forEach((p) => { p.r -= minR; p.c -= minC; });
  const rows = Math.max(...placed.map((p) => (p.dir === "D" ? p.r + p.word.length : p.r + 1)));
  const cols = Math.max(...placed.map((p) => (p.dir === "A" ? p.c + p.word.length : p.c + 1)));
  const starts = new Map<string, number>();
  [...placed].sort((a, b) => a.r - b.r || a.c - b.c).forEach((p) => { const k = key(p.r, p.c); if (!starts.has(k)) starts.set(k, starts.size + 1); p.n = starts.get(k)!; });
  return { placed, rows, cols };
}

export function Crossword({ name, onDone }: { name: string; onDone: (r: PlayResult) => void }) {
  const { view, L, t } = useInvitation();
  const words = view.doc.games.crossword.words.map((w) => ({ ...w, clue: L(w.clue) }));
  const { placed, rows, cols } = useMemo(() => layoutCrossword(words), [words]);
  const [vals, setVals] = useState<Record<string, string>>({});
  const { play, error, busy } = usePlay("CROSSWORD", name, onDone);
  const cellMap = useMemo(() => {
    const m = new Map<string, { ch: string; n?: number }>();
    placed.forEach((p) => { for (let i = 0; i < p.word.length; i++) { const k = `${p.dir === "D" ? p.r + i : p.r},${p.dir === "A" ? p.c + i : p.c}`; const ex = m.get(k); m.set(k, { ch: p.word[i], n: i === 0 ? p.n : ex?.n }); } });
    return m;
  }, [placed]);
  const solved = placed.filter((p) => Array.from({ length: p.word.length }, (_, i) => vals[`${p.dir === "D" ? p.r + i : p.r},${p.dir === "A" ? p.c + i : p.c}`]?.toUpperCase() === p.word[i]).every(Boolean));
  if (!placed.length) return null;
  return (
    <div>
      <div className="mx-auto grid w-fit gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, 2.15rem)` }}>
        {Array.from({ length: rows * cols }, (_, idx) => {
          const r = Math.floor(idx / cols), c = idx % cols, k = `${r},${c}`, cell = cellMap.get(k);
          if (!cell) return <span key={k} className="size-[2.15rem]" />;
          return (
            <label key={k} className="relative block size-[2.15rem]">
              {cell.n && <span className="absolute left-0.5 top-0 text-[0.55rem] leading-none text-[var(--c-muted)]">{cell.n}</span>}
              <input value={vals[k] ?? ""} maxLength={1} aria-label={`${r + 1},${c + 1}`} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value.toUpperCase().slice(-1) }))} className="h-full w-full border border-[var(--c-border)] bg-[var(--c-surface)] text-center text-[1rem] font-semibold uppercase focus:border-[var(--c-primary)] focus:outline-none" style={{ borderRadius: "2px" }} />
            </label>
          );
        })}
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {(["A", "D"] as const).map((d) => (
          <div key={d}><p className="inv-eyebrow mb-2">{d === "A" ? "→" : "↓"}</p><ol className="space-y-1.5 text-[0.95rem]">{placed.filter((p) => p.dir === d).sort((a, b) => a.n - b.n).map((p) => (<li key={p.id} className={cn(solved.includes(p) && "text-[var(--c-accent)] line-through")}><span className="inv-num mr-2">{p.n}.</span>{p.clue}</li>))}</ol></div>
        ))}
      </div>
      {error && <p className="inv-error mt-3 text-center" role="alert">{error}</p>}
      <div className="mt-6 text-center"><button type="button" className="inv-btn" disabled={busy} onClick={() => void play({ marked: solved.map((p) => p.id) }).catch(() => undefined)}>{t("games.submit")} ({solved.length}/{placed.length})</button></div>
    </div>
  );
}

export type { GamesDoc };
