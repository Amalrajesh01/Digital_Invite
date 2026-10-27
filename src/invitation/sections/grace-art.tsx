import { useEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import type { PortraitReveal } from "@/domain/design/reveals";

/**
 * The drawn scenes of the twenty baptism heroes (`HeroGrace.tsx`). Everything here is plain SVG and CSS: nothing is a photograph,
 * nothing depicts a person, and nothing needs a network request — so a template looks finished before a family has uploaded anything,
 * and a family's own photograph can always be dropped into the frame a scene leaves for it. Particles are placed by arithmetic, not
 * `Math.random()`, so the page renders identically on the server and in the browser. Motion is CSS only and stops under
 * `prefers-reduced-motion`; the finished picture is always the resting state. Styles: `hero-grace.css`.
 */
const S = (v: Record<string, string | number>) => v as CSSProperties;
const seq = (n: number) => Array.from({ length: n }, (_, i) => i);

// ── particles ────────────────────────────────────────────────────────────────────────────────────────
/** Gold dust drifting up. */
export function Motes({ n = 12 }: { n?: number }) {
  return <div className="gh-motes" aria-hidden>{seq(n).map((i) => <i key={i} style={S({ "--x": `${(i * 53 + 7) % 100}%`, "--s": `${0.5 + ((i * 7) % 10) / 12}`, "--d": `${10 + ((i * 5) % 9)}s`, "--l": `${-((i * 3.7) % 16)}s` })} />)}</div>;
}

/** Petals, feathers or leaves falling once, slowly. */
export function Fall({ n = 8, kind = "petal" }: { n?: number; kind?: "petal" | "feather" | "leaf" }) {
  return <div className={`gh-fall gh-fall-${kind}`} aria-hidden>{seq(n).map((i) => <i key={i} style={S({ "--x": `${(i * 37 + 11) % 100}%`, "--d": `${13 + ((i * 5) % 9)}s`, "--l": `${-((i * 2.9) % 15)}s`, "--s": `${0.6 + ((i * 7) % 8) / 10}`, "--r": `${(i * 47) % 360}deg`, "--w": `${(i % 2 ? 1 : -1) * (14 + ((i * 3) % 16))}px` })} />)}</div>;
}

export function Stars({ n = 28 }: { n?: number }) {
  return <div className="gh-stars" aria-hidden>{seq(n).map((i) => <i key={i} style={S({ "--x": `${(i * 37 + 5) % 100}%`, "--y": `${(i * 23 + (i % 3) * 9) % 62}%`, "--s": `${1 + ((i * 5) % 4) * 0.55}px`, "--d": `${3 + ((i * 7) % 5)}s`, "--l": `${-((i * 1.3) % 6)}s`, "--w": `${i % 3}` })} />)}</div>;
}

// ── light, sky, water ───────────────────────────────────────────────────────────────────────────────
export const Rays = ({ className = "" }: { className?: string }) => <div className={`gh-rays ${className}`} aria-hidden />;
export const Sky = ({ className = "" }: { className?: string }) => <div className={`gh-sky ${className}`} aria-hidden />;

export function Clouds({ n = 3 }: { n?: number }) {
  return <div className="gh-clouds" aria-hidden>{seq(n).map((i) => <i key={i} style={S({ "--y": `${[16, 30, 50, 8, 62][i % 5]}%`, "--w": `${[78, 92, 64, 56, 84][i % 5]}%`, "--d": `${[120, 160, 200, 140, 180][i % 5]}s`, "--l": `${-i * 41}s`, "--o": [0.95, 0.8, 0.9, 0.7, 0.75][i % 5] })} />)}</div>;
}

export function Ripples({ n = 4 }: { n?: number }) {
  return <div className="gh-ripples" aria-hidden>{seq(n).map((i) => <i key={i} style={S({ "--l": `${i * 1.9}s` })} />)}</div>;
}

export const Drop = () => (
  <svg className="gh-drop" viewBox="0 0 20 30" aria-hidden><path d="M10 1 C 14 9, 19 15, 19 20 C 19 26, 15 29, 10 29 C 5 29, 1 26, 1 20 C 1 15, 6 9, 10 1 Z" /></svg>
);

// ── the dove ─────────────────────────────────────────────────────────────────────────────────────────
const WING: [angle: number, scale: number][] = [[-108, 0.62], [-118, 0.78], [-129, 0.88], [-141, 0.92], [-153, 0.88], [-165, 0.78], [-177, 0.6]];

export function Dove({ className = "", olive = false }: { className?: string; olive?: boolean }) {
  return (
    <svg className={`gh-dove ${className}`} viewBox="0 -6 260 162" aria-hidden>
      <defs>
        <linearGradient id="gh-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e3eaf4" /></linearGradient>
        <linearGradient id="gh-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d3deec" /></linearGradient>
        <path id="gh-f" d="M0 0 C 10 -6, 60 -9, 100 0 C 60 7, 10 5, 0 0 Z" />
      </defs>
      <g transform="translate(142 70)" fill="#cfdbeb" opacity=".9"><g className="gh-wing gh-wing-far">
        {[-100, -116, -132, -148].map((a, i) => <use key={a} href="#gh-f" transform={`rotate(${a}) scale(${[0.55, 0.68, 0.7, 0.62][i]})`} />)}
      </g></g>
      <g transform="translate(96 84)" fill="url(#gh-bg)" stroke="#c9d5e6" strokeWidth=".8">
        {[[158, 0.52], [168, 0.6], [178, 0.58]].map(([a, k]) => <use key={a} href="#gh-f" transform={`rotate(${a}) scale(${k})`} />)}
      </g>
      <path d="M216 68 L 202 63 C 198 52, 186 45, 173 50 C 160 55, 146 61, 128 66 C 108 72, 92 79, 84 90 C 94 102, 122 108, 150 102 C 170 97, 188 86, 198 78 C 204 74, 210 71, 216 68 Z" fill="url(#gh-bg)" stroke="#c9d5e6" strokeWidth=".8" />
      <g transform="translate(156 68)" fill="url(#gh-wg)" stroke="#c4d1e4" strokeWidth=".8"><g className="gh-wing">
        {WING.map(([a, k]) => <use key={a} href="#gh-f" transform={`rotate(${a}) scale(${k})`} />)}
      </g></g>
      <path d="M164 76 C 150 60, 128 62, 112 74 C 128 84, 150 86, 164 76 Z" fill="url(#gh-wg)" stroke="#c4d1e4" strokeWidth=".8" />
      <circle cx="191" cy="58" r="2.2" fill="#2a3550" />
      <path d="M202 63 L 216 68 L 203 70 Z" fill="#d9b66b" />
      {olive && (
        <g>
          <path d="M216 68 C 228 72, 238 80, 248 92" fill="none" stroke="#6e8a4e" strokeWidth="2" strokeLinecap="round" />
          <g fill="#7d9a58"><ellipse cx="228" cy="76" rx="9" ry="3.4" transform="rotate(28 228 76)" /><ellipse cx="236" cy="84" rx="9" ry="3.4" transform="rotate(46 236 84)" /><ellipse cx="240" cy="74" rx="9" ry="3.4" transform="rotate(-30 240 74)" /><ellipse cx="246" cy="88" rx="8" ry="3" transform="rotate(8 246 88)" /></g>
        </g>
      )}
    </svg>
  );
}

// ── symbols ──────────────────────────────────────────────────────────────────────────────────────────
/** A Nasrani (Mar Thoma) cross: flared arms ending in buds, standing on a lotus. */
export function NasraniCross({ className = "" }: { className?: string }) {
  return (
    <svg className={`gh-ncross ${className}`} viewBox="0 0 80 110" aria-hidden>
      <g fill="currentColor">
        <path d="M37 18 H43 V62 H37 Z" /><path d="M16 36 H64 V42 H16 Z" />
        <path d="M37 18 C 37 12, 43 12, 43 18 Z" /><circle cx="40" cy="10" r="4" />
        <circle cx="13" cy="39" r="4" /><circle cx="67" cy="39" r="4" />
        <path d="M24 36 L 30 30 L 33 36 Z" opacity=".7" /><path d="M56 36 L 50 30 L 47 36 Z" opacity=".7" />
        <path d="M40 62 C 30 62, 22 70, 18 78 C 28 76, 34 80, 40 88 C 46 80, 52 76, 62 78 C 58 70, 50 62, 40 62 Z" opacity=".9" />
        <path d="M40 66 C 36 74, 36 82, 40 90 C 44 82, 44 74, 40 66 Z" opacity=".6" />
        <rect x="26" y="92" width="28" height="4" rx="2" /><rect x="20" y="98" width="40" height="4" rx="2" opacity=".8" />
      </g>
    </svg>
  );
}

/** The parish church: a tall gabled façade with two turrets and wide steps — drawn, so it needs no photograph. */
export function Church({ className = "" }: { className?: string }) {
  return (
    <svg className={`gh-church ${className}`} viewBox="0 0 220 150" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <g fill="currentColor">
        <path d="M104 6 H116 V16 H122 V22 H116 V30 L136 54 V126 H84 V54 L104 30 V22 H98 V16 H104 Z" />
        <path d="M30 70 L 44 50 L 58 70 V126 H30 Z" opacity=".92" /><path d="M162 70 L 176 50 L 190 70 V126 H162 Z" opacity=".92" />
        <path d="M58 82 H84 V126 H58 Z" opacity=".8" /><path d="M136 82 H162 V126 H136 Z" opacity=".8" />
        <path d="M26 126 H194 V132 H26 Z" /><path d="M16 132 H204 V138 H16 Z" opacity=".9" /><path d="M6 138 H214 V146 H6 Z" opacity=".8" />
      </g>
      <g fill="var(--gh-glass, #f6e6b8)" opacity=".92">
        <path d="M98 126 V100 C 98 90, 122 90, 122 100 V126 Z" /><path d="M101 60 V74 C 101 69, 119 69, 119 74 V60 C 119 55, 101 55, 101 60 Z" />
        <path d="M38 118 V96 C 38 88, 50 88, 50 96 V118 Z" /><path d="M170 118 V96 C 170 88, 182 88, 182 96 V118 Z" />
        <circle cx="110" cy="44" r="5" />
      </g>
    </svg>
  );
}

/** A small gold crown, drawn in a stroke. */
export function Crown({ className = "" }: { className?: string }) {
  return (
    <svg className={`gh-crown ${className}`} viewBox="0 0 100 62" aria-hidden>
      <path className="gh-draw" pathLength={1} d="M12 52 L 6 18 L 30 34 L 50 8 L 70 34 L 94 18 L 88 52 Z M12 58 H88" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <g fill="currentColor"><circle cx="6" cy="16" r="3.4" /><circle cx="50" cy="6" r="3.8" /><circle cx="94" cy="16" r="3.4" /></g>
    </svg>
  );
}

/** A Latin cross inside slow rays. */
export function RayedCross({ className = "" }: { className?: string }) {
  return (
    <svg className={`gh-rcross ${className}`} viewBox="-100 -100 200 200" aria-hidden>
      <g className="gh-rcross-rays" stroke="currentColor" strokeWidth="1" opacity=".55">
        {seq(36).map((i) => <line key={i} x1="0" y1={i % 3 === 0 ? -50 : -58} x2="0" y2={i % 3 === 0 ? -96 : -84} transform={`rotate(${i * 10})`} />)}
      </g>
      <circle r="44" fill="none" stroke="currentColor" strokeWidth="1.2" /><circle r="40" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".7" />
      <g fill="currentColor"><path d="M-4.5 -30 H4.5 V30 H-4.5 Z" /><path d="M-20 -14 H20 V-6 H-20 Z" /></g>
    </svg>
  );
}

// ── flowers ──────────────────────────────────────────────────────────────────────────────────────────
export function Lily({ className = "" }: { className?: string }) {
  return (
    <svg className={`gh-lily ${className}`} viewBox="0 0 140 260" aria-hidden>
      <defs>
        <linearGradient id="gh-lp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#f1ecdf" /><stop offset=".55" stopColor="#ffffff" /><stop offset="1" stopColor="#ffffff" /></linearGradient>
        <path id="gh-petal" d="M0 0 C 11 -14, 24 -42, 2 -66 C -24 -44, -11 -14, 0 0 Z" />
      </defs>
      <path d="M70 252 C 66 200, 78 150, 70 96" fill="none" stroke="var(--gh-leaf, #6f8f72)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M70 214 C 40 204, 24 178, 18 150 C 44 160, 62 182, 70 214 Z" fill="var(--gh-leaf, #6f8f72)" opacity=".9" />
      <path d="M72 182 C 100 176, 118 154, 124 128 C 98 136, 80 156, 72 182 Z" fill="var(--gh-leaf, #6f8f72)" opacity=".8" />
      <g transform="translate(70 92)"><g className="gh-bloom">
        {[0, 60, 120, 180, 240, 300].map((a, i) => <use key={a} href="#gh-petal" transform={`rotate(${a + (i % 2 ? 6 : -4)}) scale(${i % 2 ? 0.9 : 1})`} fill="url(#gh-lp)" stroke="#d9d3c2" strokeWidth=".7" />)}
        <g stroke="#b99a4b" strokeWidth="1.2" strokeLinecap="round">{[-28, -14, 0, 14, 28].map((a) => <line key={a} x1="0" y1="0" x2="0" y2="-22" transform={`rotate(${a})`} />)}</g>
        <g fill="#c99d3d">{[-28, -14, 0, 14, 28].map((a) => <ellipse key={a} cx="0" cy="-24" rx="2.2" ry="4.2" transform={`rotate(${a})`} />)}</g>
      </g></g>
    </svg>
  );
}

/** A garland of tiny flowers laid along an arch. */
export function Garland({ className = "" }: { className?: string }) {
  const R = 46;
  const pts = seq(23).map((i) => { const t = Math.PI * (i / 22); return { x: 50 - R * Math.cos(t), y: 50 - R * Math.sin(t) * 1.12, i }; });
  return (
    <svg className={`gh-garland ${className}`} viewBox="-6 -8 112 118" aria-hidden>
      {pts.map(({ x, y, i }) => <ellipse key={`l${i}`} cx={x} cy={y} rx="5.6" ry="2" fill="var(--gh-leaf, #8aa88a)" opacity=".85" transform={`rotate(${i * 8 - 90} ${x} ${y})`} />)}
      {pts.filter((p) => p.i % 2 === 0).map(({ x, y, i }) => (
        <g key={`f${i}`} transform={`translate(${x} ${y})`}>
          <g style={S({ "--i": i })} className="gh-flw">
            {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-3.1" rx="1.9" ry="3" fill={i % 4 === 0 ? "var(--gh-bud, #f2c9cc)" : "#fff"} stroke="rgba(0,0,0,.08)" strokeWidth=".3" transform={`rotate(${a})`} />)}
            <circle r="1.5" fill="var(--c-accent)" />
          </g>
        </g>
      ))}
    </svg>
  );
}

export function Vine({ className = "" }: { className?: string }) {
  return (
    <svg className={`gh-vine ${className}`} viewBox="0 0 240 300" aria-hidden>
      <g fill="none" stroke="var(--gh-wood, #f4f1e6)" strokeWidth="5" strokeLinecap="round"><path d="M28 296 V130 C 28 50, 70 16, 120 16 C 170 16, 212 50, 212 130 V296" /></g>
      <g fill="none" stroke="var(--gh-wood, #f4f1e6)" strokeWidth="1.6" opacity=".8">{[60, 100, 140, 180].map((y) => <path key={y} d={`M28 ${y} H212`} opacity=".5" />)}{[70, 120, 170].map((x) => <path key={x} d={`M${x} 20 V296`} opacity=".4" />)}</g>
      <path className="gh-draw" pathLength={1} d="M28 296 C 20 240, 40 214, 30 170 C 22 130, 40 90, 74 56 C 100 32, 140 26, 170 40 C 196 52, 214 86, 212 130 C 210 168, 222 200, 212 240" fill="none" stroke="var(--gh-leaf, #4f7a45)" strokeWidth="3" strokeLinecap="round" />
      {[[30, 168, -30], [36, 112, 20], [58, 70, -40], [100, 34, 10], [150, 28, -20], [190, 48, 35], [210, 100, -10], [212, 150, 40], [26, 232, 30], [212, 222, -35]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}><ellipse className="gh-leaflet" style={S({ "--i": i })} cx={x} cy={y} rx="11" ry="5" fill="var(--gh-leaf, #4f7a45)" opacity=".9" /></g>
      ))}
      {[[52, 82], [120, 22], [180, 56], [208, 120], [28, 150]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}><g className="gh-rose" style={S({ "--i": i })}>
          <circle r="9" fill="var(--gh-rose, #e7a3ab)" /><circle r="6" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.2" /><circle r="3" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1" /><circle r="1" fill="#fff" />
        </g></g>
      ))}
    </svg>
  );
}

export function Butterfly({ className = "" }: { className?: string }) {
  return (
    <svg className={`gh-fly ${className}`} viewBox="0 0 60 44" aria-hidden>
      <g className="gh-fly-w" fill="var(--c-accent)" stroke="rgba(0,0,0,.12)" strokeWidth=".6">
        <path d="M30 22 C 20 4, 4 2, 3 14 C 2 26, 18 28, 30 22 Z" /><path d="M30 22 C 22 34, 10 42, 8 34 C 6 28, 18 24, 30 22 Z" opacity=".85" />
        <path className="gh-fly-r" d="M30 22 C 40 4, 56 2, 57 14 C 58 26, 42 28, 30 22 Z" /><path className="gh-fly-r" d="M30 22 C 38 34, 50 42, 52 34 C 54 28, 42 24, 30 22 Z" opacity=".85" />
      </g>
      <path d="M30 14 V32" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ── objects ──────────────────────────────────────────────────────────────────────────────────────────
export function Candle({ className = "" }: { className?: string }) {
  return <i className={`gh-candle ${className}`} aria-hidden><b /></i>;
}

export function Candles({ n = 7 }: { n?: number }) {
  return <div className="gh-candles" aria-hidden>{seq(n).map((i) => <i key={i} className="gh-candle" style={S({ "--i": i, "--h": `${1 + ((i * 5) % 4) * 0.18}` })}><b /></i>)}</div>;
}

/** An open book: curved pages with unreadable lines, a lit gutter and a ribbon. */
export function Book({ className = "" }: { className?: string }) {
  const lines = (x0: number, dir: 1 | -1) => seq(11).map((i) => {
    const y = 36 + i * 11;
    const len = 78 - (i % 4 === 3 ? 26 : 0) - (i === 0 ? 18 : 0);
    return <path key={`${x0}${i}`} d={`M${x0} ${y + dir * 0} q ${dir * len * 0.5} -4 ${dir * len} 0`} />;
  });
  return (
    <svg className={`gh-book ${className}`} viewBox="0 0 320 210" aria-hidden>
      <defs>
        <linearGradient id="gh-pg-l" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#d9c9a4" /><stop offset=".18" stopColor="#f7edd2" /><stop offset="1" stopColor="#fbf4e1" /></linearGradient>
        <linearGradient id="gh-pg-r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#d9c9a4" /><stop offset=".18" stopColor="#f7edd2" /><stop offset="1" stopColor="#fbf4e1" /></linearGradient>
        <radialGradient id="gh-glow" cx=".5" cy=".62" r=".6"><stop offset="0" stopColor="#fff3c9" stopOpacity=".95" /><stop offset="1" stopColor="#fff3c9" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse className="gh-glow" cx="160" cy="92" rx="150" ry="96" fill="url(#gh-glow)" />
      <path d="M14 168 C 60 190, 120 192, 160 176 C 200 192, 260 190, 306 168 L 306 178 C 260 202, 200 204, 160 188 C 120 204, 60 202, 14 178 Z" fill="var(--gh-cover, #5a1a24)" />
      <path className="gh-page gh-page-l" d="M160 176 C 120 160, 60 160, 16 168 V30 C 62 22, 122 24, 160 42 Z" fill="url(#gh-pg-l)" stroke="#bda980" strokeWidth="1" />
      <path className="gh-page gh-page-r" d="M160 176 C 200 160, 260 160, 304 168 V30 C 258 22, 198 24, 160 42 Z" fill="url(#gh-pg-r)" stroke="#bda980" strokeWidth="1" />
      <g fill="none" stroke="#9a8a68" strokeWidth="1.5" strokeLinecap="round" opacity=".55">{lines(30, 1)}{lines(290, -1)}</g>
      <path d="M160 42 V176" stroke="#bda980" strokeWidth="1.4" />
      <path className="gh-ribbon" d="M150 40 V196 L 156 190 L 162 196 V40 Z" fill="var(--gh-ribbon, #a3283c)" />
    </svg>
  );
}

/** Two open hands, drawn in one line, holding a small flame. No face is ever drawn. */
export function Hands({ className = "" }: { className?: string }) {
  return (
    <svg className={`gh-hands ${className}`} viewBox="0 0 220 190" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path className="gh-draw" pathLength={1} d="M24 96 C 30 132, 66 160, 110 160 C 154 160, 190 132, 196 96" />
        <path className="gh-draw d2" pathLength={1} d="M24 96 C 18 88, 22 80, 30 82 C 40 86, 52 106, 66 120 M196 96 C 202 88, 198 80, 190 82 C 180 86, 168 106, 154 120" />
        <path className="gh-draw d3" pathLength={1} d="M44 118 C 62 140, 86 150, 110 150 C 134 150, 158 140, 176 118" opacity=".65" />
      </g>
      <g className="gh-flame">
        <path d="M110 32 C 126 54, 134 70, 110 92 C 86 70, 94 54, 110 32 Z" fill="var(--gh-flame, #e9b84a)" />
        <path d="M110 58 C 118 70, 118 80, 110 90 C 102 80, 102 70, 110 58 Z" fill="#fff6d6" />
      </g>
      <g stroke="var(--gh-flame, #e9b84a)" strokeWidth="1.6" strokeLinecap="round" opacity=".8">{seq(9).map((i) => <line key={i} x1="110" y1="-6" x2="110" y2="6" transform={`translate(0 62) rotate(${-80 + i * 20} 110 0) translate(0 -${54 - (i % 2) * 6})`} />)}</g>
    </svg>
  );
}

/** Footprints, going up. */
export function Footprints({ n = 8 }: { n?: number }) {
  return (
    <svg className="gh-feet" viewBox="0 0 120 300" aria-hidden>
      {seq(n).map((i) => {
        const left = i % 2 === 0;
        const x = 60 + (left ? -13 : 13) + Math.sin(i * 0.9) * 8;
        const y = 280 - i * 34;
        const r = (left ? -8 : 8) + Math.sin(i * 0.9) * 6;
        return (
          <g key={i} className="gh-foot" style={S({ "--i": i })} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path d="M0 0 C -7 -2, -8 -13, -4 -19 C 0 -24, 7 -21, 7 -14 C 7 -7, 4 -1, 0 0 Z" />
            {[[-5, -25], [-1, -27], [3, -26.5], [6.5, -24], [8.8, -20]].map(([cx, cy], k) => <circle key={k} cx={cx} cy={cy} r={1.9 - k * 0.15} />)}
          </g>
        );
      })}
    </svg>
  );
}

/** Three generations, drawn like a family chart: two grandparent couples, the parents, the child. */
export function Tree() {
  const node = (x: number, y: number, r: number, k: number) => <circle key={`${x}${y}`} className="gh-node" style={S({ "--i": k })} cx={x} cy={y} r={r} />;
  return (
    <svg className="gh-tree" viewBox="0 0 260 214" aria-hidden>
      <g className="gh-tree-lines" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path className="gh-draw" pathLength={1} d="M52 40 H68 M192 40 H208 M124 112 H136" />
        <path className="gh-draw d2" pathLength={1} d="M60 52 V76 H112 V100 M200 52 V76 H148 V100" />
        <path className="gh-draw d3" pathLength={1} d="M130 112 V156" />
      </g>
      <g className="gh-tree-nodes">
        {node(40, 40, 12, 0)}{node(80, 40, 12, 1)}{node(180, 40, 12, 2)}{node(220, 40, 12, 3)}{node(112, 112, 12, 4)}{node(148, 112, 12, 5)}{node(130, 180, 22, 6)}
      </g>
      <circle className="gh-tree-halo" cx="130" cy="180" r="32" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5" />
    </svg>
  );
}

/** The covenant: a bow of soft colour over the horizon. */
export function Bow() {
  const cols = ["var(--c-accent)", "#e9a98f", "var(--c-secondary)"];
  return (
    <svg className="gh-bow" viewBox="0 0 320 170" aria-hidden>
      {cols.map((c, i) => <path key={i} className="gh-draw" style={S({ "--i": i })} pathLength={1} d={`M${24 + i * 12} 166 A ${136 - i * 12} ${136 - i * 12} 0 0 1 ${296 - i * 12} 166`} fill="none" stroke={c} strokeWidth="7" strokeLinecap="round" opacity=".58" />)}
    </svg>
  );
}

/** A corner of the gold frame. */
export function Corner({ className = "" }: { className?: string }) {
  return (
    <svg className={`gh-corner ${className}`} viewBox="0 0 60 60" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M4 56 V4 H56" /><path d="M10 56 V10 H56" opacity=".6" /><path d="M16 30 C 16 20, 20 16, 30 16" /></g>
      <circle cx="16" cy="16" r="3" fill="currentColor" /><circle cx="30" cy="30" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function SmallCross({ className = "" }: { className?: string }) {
  return <svg className={`gh-xs ${className}`} viewBox="0 0 24 34" aria-hidden><path d="M10.4 2 H13.6 V32 H10.4 Z M2 10 H22 V13.2 H2 Z" fill="currentColor" /></svg>;
}

/** Gothic arches receding to a lit window: the nave, drawn in thin gold lines. */
export function Nave() {
  const arch = (k: number) => {
    const t = k / 6, s = 1 - t * 0.8;
    const w = 86 * s, base = 214 - t * 82, spring = base - 96 * s, apex = spring - 1.732 * w;
    return <path key={k} className="gh-nave-arch" style={S({ "--i": k })} d={`M${100 - w} ${base} V${spring} A ${2 * w} ${2 * w} 0 0 1 100 ${apex} A ${2 * w} ${2 * w} 0 0 1 ${100 + w} ${spring} V${base}`} />;
  };
  return (
    <svg className="gh-nave" viewBox="0 0 200 230" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">{seq(7).map(arch)}</g>
      <g stroke="currentColor" strokeWidth=".6" opacity=".3">{[16, 40, 62, 86, 114, 138, 160, 184].map((x) => <path key={x} d={`M${x} 214 L ${100 + (x - 100) * 0.2} 146`} />)}</g>
    </svg>
  );
}

/** A leaded window of coloured panes under a pointed arch (when there is no photograph of the real one). */
export function Glass({ className = "" }: { className?: string }) {
  const cols = ["var(--c-primary)", "var(--c-secondary)", "var(--c-accent)", "#d99b8c", "var(--c-secondary)", "var(--c-primary)"];
  return (
    <svg className={`gh-glass ${className}`} viewBox="0 0 100 150" aria-hidden>
      <defs><clipPath id="gh-gw"><path d="M6 150 V54 A 44 44 0 0 1 50 8 A 44 44 0 0 1 94 54 V150 Z" /></clipPath></defs>
      <g clipPath="url(#gh-gw)">
        <rect width="100" height="150" fill="#1a1f33" />
        {cols.map((c, i) => <rect key={i} x={6 + (i % 2) * 44} y={54 + Math.floor(i / 2) * 32} width="44" height="32" fill={c} opacity=".78" />)}
        <circle cx="50" cy="34" r="20" fill="var(--c-accent)" opacity=".8" /><circle cx="50" cy="34" r="12" fill="#fff4cf" opacity=".85" />
        <g stroke="#0d1020" strokeWidth="2.2" fill="none"><path d="M50 8 V150 M6 54 H94 M6 86 H94 M6 118 H94" /><circle cx="50" cy="34" r="20" /></g>
      </g>
    </svg>
  );
}

export function Doors() {
  return (
    <div className="gh-doors" aria-hidden>
      <div className="gh-door gh-door-l"><span /></div><div className="gh-door gh-door-r"><span /></div>
    </div>
  );
}

export function Hills() {
  return (
    <svg className="gh-hills" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden>
      <path className="h3" d="M0 74 C 60 56, 120 62, 190 70 C 260 78, 330 52, 400 66 V120 H0 Z" />
      <path className="h2" d="M0 90 C 70 70, 140 84, 220 86 C 300 88, 350 70, 400 80 V120 H0 Z" />
      <path className="h1" d="M0 104 C 90 90, 170 100, 250 100 C 320 100, 360 92, 400 98 V120 H0 Z" />
    </svg>
  );
}

export const Birds = () => (
  <div className="gh-birds" aria-hidden>{seq(3).map((i) => <svg key={i} viewBox="0 0 30 12" style={S({ "--i": i })}><path d="M1 8 C 6 0, 11 0, 15 7 C 19 0, 24 0, 29 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>)}</div>
);

// ── Candle of Faith: a candle a guest may light. Nothing depends on it: the child’s name, the day and the place are on the page whether or not it is lit. ──
export function CandleLight({ label, message }: { label: string; message: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);
  const light = () => {
    setLit(true);
    box.current?.closest(".hv-grace")?.setAttribute("data-lit", "1");
  };
  // a guest who prefers reduced motion is shown it lit (the stylesheet does the same for the glow)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) light();
  }, []);
  return (
    <div ref={box} className="gh-candlebox">
      <button type="button" className="gh-wickbtn" aria-pressed={lit} aria-label={label} onClick={light} disabled={lit}>
        <svg className="gh-bigcandle" viewBox="0 0 40 124" aria-hidden focusable="false">
          <defs>
            <linearGradient id="gh-wax" x1="0" x2="1"><stop offset="0" stopColor="#e6d7b8" /><stop offset=".45" stopColor="#fffaf0" /><stop offset="1" stopColor="#e2d1ae" /></linearGradient>
            <radialGradient id="gh-fl" cx=".5" cy=".72" r=".6"><stop offset="0" stopColor="#fffbe6" /><stop offset=".42" stopColor="#ffd36a" /><stop offset=".8" stopColor="#f4902a" /><stop offset="1" stopColor="#f4902a" stopOpacity="0" /></radialGradient>
          </defs>
          <rect x="11" y="48" width="18" height="72" rx="2.2" fill="url(#gh-wax)" stroke="rgba(80,55,20,.18)" strokeWidth=".6" />
          <ellipse cx="20" cy="48" rx="9" ry="2.6" fill="#fff7e2" stroke="rgba(80,55,20,.18)" strokeWidth=".5" />
          <path d="M20 48 V40" stroke="#3a2b1a" strokeWidth="1.5" strokeLinecap="round" />
          <g className="gh-cflame"><path d="M20 10 C 27 19, 28 31, 20 40 C 12 31, 13 19, 20 10 Z" fill="url(#gh-fl)" /></g>
        </svg>
      </button>
      {!lit && <p className="gh-lit-hint">{label}</p>}
      <p className="gh-lit-msg" aria-live="polite">{message}</p>
    </div>
  );
}

// ── White Roses: a wreath of white roses round the portrait; they open as the page is scrolled ──
export function RoseWreath() {
  const roses = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg className="gh-rosewreath" viewBox="-100 -100 200 200" aria-hidden focusable="false">
      <defs>
        <symbol id="gh-rose" viewBox="-20 -20 40 40" overflow="visible">
          <circle r="18" fill="#fff" stroke="#e6dccb" strokeWidth=".7" />
          <path d="M-15 -6 C -10 -17, 10 -17, 15 -6 M-16 4 C -10 15, 10 15, 16 4" fill="none" stroke="#e6dccb" strokeWidth=".6" />
          <circle r="11.5" fill="#fffdf8" stroke="#e3d8c4" strokeWidth=".6" />
          <path d="M-9 -3 C -6 -10, 6 -10, 9 -3 M-8 5 C -4 10, 5 10, 8 4" fill="none" stroke="#e0d3bb" strokeWidth=".5" />
          <circle r="6.4" fill="#fff" stroke="#dccfb5" strokeWidth=".5" />
          <path d="M-3.8 -1 C -2 -4.6, 4.2 -4, 4 0.4 C 3.8 4.2, -2.4 4.8, -4 1.6" fill="none" stroke="#d3c4a6" strokeWidth=".7" strokeLinecap="round" />
        </symbol>
      </defs>
      <g fill="var(--gh-leaf, #6f8f72)" opacity=".92">
        {roses.map((a) => <path key={a} transform={`rotate(${a + 22.5}) translate(0 -87)`} d="M0 0 C 8 -6, 8 -20, 0 -27 C -8 -20, -8 -6, 0 0Z" />)}
      </g>
      <g>
        {roses.map((a, i) => (
          <g key={a} transform={`rotate(${a}) translate(0 -88)`}><use href="#gh-rose" className="gh-flw" x="-19" y="-19" width="38" height="38" style={S({ "--i": i })} /></g>
        ))}
      </g>
    </svg>
  );
}

// ── Little Miracle: a nursery mobile — pastel stars, a moon and a cloud on strings, turning very slowly ──
const ORN: { x: number; len: number; kind: "star" | "moon" | "cloud"; fill: string }[] = [
  { x: 32, len: 46, kind: "star", fill: "#F4D9A6" }, { x: 104, len: 78, kind: "moon", fill: "#BBD5EA" }, { x: 180, len: 40, kind: "cloud", fill: "#F7D5D2" },
  { x: 256, len: 84, kind: "star", fill: "#CFE6D5" }, { x: 328, len: 52, kind: "moon", fill: "#F4D9A6" },
];
const SHAPE = { star: "M0 -9 L2.6 -3 L9 -2.8 L4 1.6 L5.6 8 L0 4.4 L-5.6 8 L-4 1.6 L-9 -2.8 L-2.6 -3Z", moon: "M-5 -8 A 9 9 0 1 0 6 6 A 7 7 0 1 1 -5 -8Z", cloud: "M-10 5 a5 5 0 0 1 2 -9 a6 6 0 0 1 11 -2 a5 5 0 0 1 6 11 Z" };
export function NurseryMobile() {
  return (
    <svg className="gh-mobile" viewBox="0 0 360 136" aria-hidden focusable="false">
      <path d="M6 6 Q 180 -4 354 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {ORN.map((o, i) => (
        <g key={i} transform={`translate(${o.x} 4)`}>
          <g className="gh-orn" style={S({ "--i": i, "--d": `${5 + i * 0.9}s` })}>
            <line x1="0" y1="0" x2="0" y2={o.len} stroke="currentColor" strokeWidth=".8" />
            <path transform={`translate(0 ${o.len + 9})`} d={SHAPE[o.kind]} fill={o.fill} stroke="rgba(80,90,120,.28)" strokeWidth=".8" strokeLinejoin="round" />
          </g>
        </g>
      ))}
    </svg>
  );
}

// ── The Golden Cross: two fine gold lines draw a cross, and the child’s portrait is set where they meet ──
export function GoldCross() {
  return (
    <svg className="gh-goldcross" viewBox="0 0 200 240" aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1">
        <path className="gh-draw" pathLength={1} d="M98 8 V236" />
        <path className="gh-draw d2" pathLength={1} d="M102 8 V236" />
        <path className="gh-draw d2" pathLength={1} d="M8 94 H192" />
        <path className="gh-draw d3" pathLength={1} d="M8 98 H192" />
      </g>
      <g fill="currentColor" className="gh-terms">
        <path d="M100 0 l4 8 -4 8 -4 -8z" /><path d="M100 224 l4 8 -4 8 -4 -8z" /><path d="M0 96 l8 -4 8 4 -8 4z" /><path d="M184 96 l8 -4 8 4 -8 4z" />
      </g>
    </svg>
  );
}

// ── Cloud Nine: soft puffs the portrait rests on, over two layers of cloud that drift at their own speeds ──
export const Puffs = () => <span className="gh-puffs" aria-hidden>{seq(4).map((i) => <i key={i} style={S({ "--i": i })} />)}</span>;

// ── the twenty scenes ────────────────────────────────────────────────────────────────────────────────
export type Layout = "centre" | "arch" | "window" | "horizon" | "poster";
export interface SceneProps { photo?: ReactNode; initial: string; /** The words of the candle that a guest may light (Candle of Faith). */ candle?: { label: string; message: string } }
export interface Scene { layout: Layout; reveal: PortraitReveal; back: (p: SceneProps) => ReactElement; figure?: (p: SceneProps) => ReactElement; /** The scene has a candle a guest may light: the hero starts unlit (data-lit="0") and the glow arrives on a tap. */ lights?: boolean; /** A layer that covers the scene at first and then parts (Heaven’s Gate: two banks of cloud). Its resting state is open. */ veil?: () => ReactElement }

const Frame = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`gh-frame ${className}`}>{children}</div>;

export const Veil = () => <div className="gh-veil" aria-hidden><i className="l" /><i className="r" /></div>;

export const SCENES: Record<string, Scene> = {
  "gr-heavenly": { veil: () => <Veil />, reveal: "heavenly", layout: "centre", back: () => <><Sky /><Rays /><Clouds n={4} /><Dove className="gh-dove-glide" /><Motes n={10} /></>, figure: ({ photo }) => <>{photo && <Frame className="oval">{photo}</Frame>}</> },
  "gr-beam": { reveal: "heavenly", layout: "centre", back: () => <><Sky /><div className="gh-beam" /><div className="gh-pool" /><Fall n={9} kind="feather" /><Motes n={8} /></>, figure: ({ photo }) => <>{photo && <Frame className="oval">{photo}</Frame>}</> },
  "gr-waters": { reveal: "heavenly", layout: "horizon", back: () => <><Sky /><div className="gh-sea" /><div className="gh-shimmer" /><Ripples n={5} /><Drop /><Motes n={7} /></>, figure: ({ photo }) => <>{photo && <Frame className="circle">{photo}</Frame>}</> },
  "gr-kerala": { reveal: "royal", layout: "arch", back: () => <><Sky /><Motes n={8} /></>, figure: ({ photo }) => <><NasraniCross /><Frame className="arch kasavu"><div className="gh-view">{photo ?? <><Sky /><Church /><div className="gh-lampglow" /></>}</div></Frame></> },
  "gr-prince": { reveal: "royal", layout: "centre", back: () => <><Sky /><Stars n={34} /></>, figure: ({ photo, initial }) => <><Crown /><div className="gh-badge"><svg viewBox="0 0 120 120" aria-hidden><circle className="gh-draw" pathLength={1} cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>{photo ? <Frame className="circle">{photo}</Frame> : <span aria-hidden>{initial}</span>}</div></> },
  "gr-princess": { reveal: "floral", layout: "arch", back: () => <><Sky /><Fall n={9} kind="petal" /></>, figure: ({ photo }) => <><Crown /><div className="gh-wreath"><Garland /><Frame className="arch soft"><div className="gh-view">{photo ?? <><Sky /><div className="gh-cloudy" /><SmallCross className="gh-arch-cross" /></>}</div></Frame></div></> },
  "gr-generations": { reveal: "minimal", layout: "centre", back: () => <><div className="gh-paper" /></>, figure: ({ photo }) => <><Tree />{photo && <Frame className="oval sepia">{photo}</Frame>}</> },
  "gr-nave": { reveal: "heavenly", layout: "window", back: () => <><Sky /><Rays className="from-window" /><Nave /><Candles n={9} /><Motes n={9} /></>, figure: ({ photo }) => <div className="gh-endwindow">{photo ? <Frame className="pointed">{photo}</Frame> : <Glass />}</div> },
  "gr-dove": { reveal: "heavenly", layout: "centre", back: () => <><Sky /><Clouds n={3} /><Fall n={5} kind="feather" /></>, figure: ({ photo }) => <><Dove className="gh-dove-big" olive />{photo && <Frame className="circle">{photo}</Frame>}</> },
  "gr-bible": { reveal: "minimal", layout: "centre", back: () => <><div className="gh-lectern" /><Motes n={10} /></>, figure: ({ photo }) => <>{photo && <Frame className="oval">{photo}</Frame>}<Book /></> },
  "gr-lily": { reveal: "floral", layout: "centre", back: () => <><Sky /><Lily className="gh-lily-a" /><Lily className="gh-lily-b" /><Lily className="gh-lily-c" /><Fall n={9} kind="petal" /></>, figure: ({ photo }) => <>{photo && <Frame className="oval">{photo}</Frame>}</> },
  "gr-morning": { reveal: "heavenly", layout: "horizon", back: ({ photo }) => <><Sky /><div className="gh-sunrays" />{!photo && <div className="gh-sun" />}<Hills /><Birds /><Motes n={9} /></>, figure: ({ photo }) => <>{photo && <div className="gh-risen"><span className="gh-sundisc" aria-hidden /><Frame className="circle">{photo}</Frame></div>}</> },
  "gr-hands": { reveal: "heavenly", layout: "centre", back: () => <><div className="gh-wash w1" /><div className="gh-wash w2" /><div className="gh-wash w3" /><Motes n={6} /></>, figure: ({ photo }) => <>{photo && <Frame className="oval soft">{photo}</Frame>}<Hands /></> },
  "gr-garden": { reveal: "floral", layout: "arch", back: () => <><Sky /><Motes n={8} /></>, figure: ({ photo }) => <div className="gh-trellis"><Frame className="arch plain"><div className="gh-view">{photo ?? <><Sky /><div className="gh-lawn" /><div className="gh-path" /></>}</div></Frame><Vine /><Butterfly /></div> },
  "gr-crest": { reveal: "royal", layout: "window", back: () => <><div className="gh-velvet" /><Corner className="c1" /><Corner className="c2" /><Corner className="c3" /><Corner className="c4" /><div className="gh-keyline" /><Motes n={8} /></>, figure: ({ photo }) => <>{photo ? <Frame className="arch gold">{photo}</Frame> : <RayedCross />}</> },
  "gr-minimal": { reveal: "minimal", layout: "poster", back: () => <><svg className="gh-halo" viewBox="0 0 200 200" aria-hidden><circle className="gh-draw" pathLength={1} cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth=".6" /><path className="gh-draw d2" pathLength={1} d="M100 56 V150 M66 88 H134" fill="none" stroke="currentColor" strokeWidth=".8" /></svg></>, figure: ({ photo }) => <>{photo && <Frame className="band">{photo}</Frame>}</> },
  "gr-footprints": { reveal: "minimal", layout: "poster", back: () => <><div className="gh-paper soft" /><Footprints n={8} /><Candle className="gh-lone" /></>, figure: ({ photo }) => <>{photo && <Frame className="rounded">{photo}</Frame>}</> },
  "gr-rings": { reveal: "minimal", layout: "centre", back: () => <><div className="gh-ring r1" /><div className="gh-ring r2" /><div className="gh-ring r3" /><div className="gh-ring r4" /></>, figure: ({ photo }) => <>{photo && <Frame className="circle">{photo}</Frame>}</> },
  "gr-promise": { reveal: "heavenly", layout: "horizon", back: () => <><Sky /><Stars n={36} /><Bow /><Clouds n={2} /></>, figure: ({ photo }) => <>{photo && <Frame className="oval soft">{photo}</Frame>}</> },
  "gr-candle": { reveal: "heavenly", lights: true, layout: "centre", back: () => <><div className="gh-warm" /><Motes n={9} /></>, figure: ({ photo, candle }) => <>{photo && <Frame className="oval">{photo}</Frame>}{candle && <CandleLight label={candle.label} message={candle.message} />}</> },
  "gr-roses": { reveal: "floral", layout: "centre", back: () => <><Sky /><Fall n={11} kind="petal" /><Motes n={6} /></>, figure: ({ photo }) => <div className="gh-rosering"><RoseWreath />{photo && <Frame className="circle">{photo}</Frame>}</div> },
  "gr-mobile": { reveal: "heavenly", layout: "centre", back: () => <><Sky /><Stars n={22} /><Clouds n={2} /></>, figure: ({ photo }) => <><NurseryMobile />{photo && <Frame className="circle">{photo}</Frame>}</> },
  "gr-cross": { reveal: "royal", layout: "centre", back: () => <><div className="gh-glowfield" /><Motes n={7} /></>, figure: ({ photo }) => <div className="gh-xwrap"><GoldCross />{photo && <Frame className="circle">{photo}</Frame>}</div> },
  "gr-clouds": { reveal: "heavenly", layout: "centre", back: () => <><Sky /><div className="gh-cl-a"><Clouds n={4} /></div><div className="gh-cl-b"><Clouds n={3} /></div><Motes n={7} /></>, figure: ({ photo }) => <>{photo && <Frame className="oval">{photo}</Frame>}<Puffs /></> },
  "gr-dawn": { reveal: "heavenly", layout: "horizon", back: () => <><Sky /><Stars n={14} /><Rays className="from-door" /><Motes n={14} /></>, figure: ({ photo }) => <div className="gh-doorway"><div className="gh-spill" /><div className="gh-beyond">{photo ?? <><Sky className="dawn" /><div className="gh-sun low" /><Hills /></>}<Ripples n={3} /></div><Doors /><svg className="gh-edge" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden><path d="M0 150 V66 C0 33 30 10.5 50 0 C70 10.5 100 33 100 66 V150" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg><Dove className="gh-dove-rise a" /><Dove className="gh-dove-rise b" /></div> },
};

export const isGraceVariant = (v: string | undefined): v is string => !!v && v in SCENES;
