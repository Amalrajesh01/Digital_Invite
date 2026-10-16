import type { CSSProperties } from "react";

/**
 * The openings that are pictures rather than paper: a lamp to light, doors to push open, balloons to pop,
 * a ticket to tear, a flower to bloom. Each is plain markup + CSS (see gate.css) — no images, no libraries —
 * and each one is opened by the guest's own tap, never by itself.
 */

/** A brass oil lamp. The flame is hidden until the gate's `data-open` flips. */
export function LampArt() {
  return (
    <svg viewBox="0 0 200 170" className="lamp-svg" aria-hidden>
      <defs>
        <linearGradient id="lamp-brass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="color-mix(in srgb, var(--c-accent) 60%, #fff)" />
          <stop offset="0.55" stopColor="var(--c-accent)" />
          <stop offset="1" stopColor="color-mix(in srgb, var(--c-accent) 55%, #000)" />
        </linearGradient>
      </defs>
      <g className="lamp-flame">
        <path d="M100 22c13 20 21 34 12 50-4 7-12 10-12 10s-8-3-12-10C79 56 87 42 100 22z" fill="#ffb347" />
        <path d="M100 46c6 11 9 18 5 26-2 4-5 6-5 6s-3-2-5-6c-4-8-1-15 5-26z" fill="#fff3c4" />
      </g>
      <rect x="97" y="80" width="6" height="16" rx="3" fill="#3b2a1c" />
      <path d="M44 98h112c0 28-26 46-56 46s-56-18-56-46z" fill="url(#lamp-brass)" />
      <path d="M44 98c-14-2-26-10-32-22 16 0 30 6 40 14z" fill="url(#lamp-brass)" />
      <path d="M44 98h112" stroke="color-mix(in srgb, var(--c-accent) 40%, #000)" strokeWidth="2" />
      <path d="M84 142h32l8 18H76z" fill="url(#lamp-brass)" />
      <path d="M66 160h68" stroke="color-mix(in srgb, var(--c-accent) 45%, #000)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Two carved doors with brass studs; they swing open on the hinges to show a lit room. */
export function DoorsArt() {
  return (
    <div className="doors-frame" aria-hidden>
      <div className="doors-light" />
      <div className="door l"><span className="door-knob" /></div>
      <div className="door r"><span className="door-knob" /></div>
    </div>
  );
}

const CONFETTI = Array.from({ length: 22 }, (_, i) => ({ a: (i / 22) * 360 + (i % 3) * 9, d: 90 + ((i * 37) % 80), r: (i * 53) % 360 }));
const BALLOONS = [
  { x: 8, h: 0, c: 0 }, { x: 26, h: 14, c: 1 }, { x: 45, h: -6, c: 2 }, { x: 64, h: 12, c: 3 }, { x: 82, h: 2, c: 4 },
];

/** Five balloons on strings. Popping them fires a burst of confetti pieces from the middle. */
export function BalloonsArt() {
  return (
    <div className="balloons" aria-hidden>
      {BALLOONS.map((b, i) => (
        <span key={i} className={`bl bl-${b.c}`} style={{ "--x": `${b.x}%`, "--h": `${b.h}%`, "--i": i } as CSSProperties} />
      ))}
      <div className="burst">
        {CONFETTI.map((c, i) => (
          <i key={i} style={{ "--a": `${c.a}deg`, "--d": `${c.d}px`, "--r": `${c.r}deg`, "--k": i % 6 } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}

/** A flower bud: eight petals folded in; on open they unfold and the centre glows. */
export function BloomArt() {
  return (
    <div className="bloom-flower" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={`o${i}`} className="petal outer" style={{ "--n": i } as CSSProperties} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={`i${i}`} className="petal inner" style={{ "--n": i } as CSSProperties} />
      ))}
      <span className="bloom-core" />
    </div>
  );
}
