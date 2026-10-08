"use client";
import { useEffect, useRef, useState } from "react";
import { EVENT_TYPE_INFO, celebrationFor, type CelebrationKind } from "@/domain/doc/event-types";
import { useInvitation } from "./context";

/**
 * The opening celebration, played once when the invitation opens.
 *   • Hindu weddings — a few dozen marigold, rose and jasmine petals drift down (never a downpour).
 *   • Everything else — gold-led confetti fired from the left and right edges.
 * It is a single transparent canvas that removes itself after a few seconds, never intercepts a tap and
 * is skipped entirely for visitors who prefer reduced motion.
 */
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

// ── petals ──────────────────────────────────────────────────────────────────
const MARIGOLD = ["#F6A21E", "#EE7C12", "#F9C23C", "#E8650B"];
const ROSE = ["#E7788F", "#C93A5A", "#F2A7B6", "#D94F6E"];
const JASMINE = ["#FFFDF6", "#F6F1E2"];

interface Petal {
  kind: "marigold" | "rose" | "jasmine";
  spawn: number; x0: number; size: number; vy: number; sway: number; swayHz: number; phase: number; drift: number;
  rot0: number; rotV: number; flipHz: number; flipPhase: number; color: string; depth: number;
}

function makePetals(w: number, small: boolean): Petal[] {
  const n = small ? 30 : 54;
  return Array.from({ length: n }, () => {
    const r = Math.random();
    const kind: Petal["kind"] = r < 0.46 ? "marigold" : r < 0.78 ? "rose" : "jasmine";
    const depth = rand(0.55, 1);
    const wanderer = Math.random() < 0.2; // a few petals drift sideways on a breeze
    return {
      kind,
      spawn: rand(0, 3.2),
      x0: rand(-0.04, 1.04) * w,
      size: rand(11, 23) * depth * (kind === "jasmine" ? 0.8 : 1),
      vy: rand(115, 200) * (0.6 + depth * 0.4),
      sway: rand(12, 42),
      swayHz: rand(0.45, 1.2),
      phase: rand(0, Math.PI * 2),
      drift: wanderer ? rand(-90, 90) : rand(-22, 22),
      rot0: rand(0, Math.PI * 2),
      rotV: rand(0.5, 1.8) * (Math.random() < 0.5 ? -1 : 1),
      flipHz: rand(1.4, 3.6),
      flipPhase: rand(0, Math.PI * 2),
      color: pick(kind === "marigold" ? MARIGOLD : kind === "rose" ? ROSE : JASMINE),
      depth,
    };
  });
}

function petalPath(ctx: CanvasRenderingContext2D, kind: Petal["kind"], s: number) {
  ctx.beginPath();
  if (kind === "marigold") {
    ctx.moveTo(0, -s * 0.95);
    ctx.bezierCurveTo(s * 0.8, -s * 0.45, s * 0.62, s * 0.62, 0, s * 0.95);
    ctx.bezierCurveTo(-s * 0.62, s * 0.62, -s * 0.8, -s * 0.45, 0, -s * 0.95);
  } else if (kind === "rose") {
    ctx.moveTo(0, s * 0.75);
    ctx.bezierCurveTo(-s * 1.0, s * 0.25, -s * 0.9, -s * 0.8, -s * 0.12, -s * 0.78);
    ctx.quadraticCurveTo(0, -s * 0.56, s * 0.12, -s * 0.78);
    ctx.bezierCurveTo(s * 0.9, -s * 0.8, s * 1.0, s * 0.25, 0, s * 0.75);
  } else {
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.58, 0, 0, s);
    ctx.quadraticCurveTo(-s * 0.58, 0, 0, -s);
  }
  ctx.closePath();
}

// ── confetti ────────────────────────────────────────────────────────────────
interface Bit {
  x: number; y: number; vx: number; vy: number; w: number; h: number; round: boolean;
  tilt: number; tiltV: number; rot: number; rotV: number; a: string; b: string; born: number;
}

function lighten(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c + (255 - c) * k);
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

function burst(side: "l" | "r", count: number, w: number, h: number, palette: readonly string[], born: number): Bit[] {
  const reach = Math.min(1, h / 820);
  return Array.from({ length: count }, () => {
    const angle = (rand(52, 82) * Math.PI) / 180;
    const v = rand(620, 1180) * (0.8 + reach * 0.35);
    const dir = side === "l" ? 1 : -1;
    const c = pick(palette);
    const round = Math.random() < 0.22;
    return {
      x: side === "l" ? -8 : w + 8,
      y: h * rand(0.7, 0.82),
      vx: dir * Math.cos(angle) * v,
      vy: -Math.sin(angle) * v,
      w: round ? rand(4, 6.5) : rand(6, 11),
      h: round ? 0 : rand(3.5, 6.5),
      round,
      tilt: rand(0, Math.PI * 2), tiltV: rand(5, 13) * (Math.random() < 0.5 ? -1 : 1),
      rot: rand(0, Math.PI * 2), rotV: rand(-5, 5),
      a: c, b: lighten(c, 0.5), born,
    };
  });
}

function run(canvas: HTMLCanvasElement, kind: CelebrationKind, palette: readonly string[], done: () => void): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;
  let w = 0, h = 0, raf = 0;
  const fit = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  fit();
  window.addEventListener("resize", fit);
  const small = w < 640;
  const END = kind === "petals" ? 9.5 : 5.6;
  const petals = kind === "petals" ? makePetals(w, small) : [];
  const bits: Bit[] = [];
  const bursts = kind === "confetti" ? [[0, small ? 26 : 40], [0.28, small ? 22 : 34], [0.8, small ? 14 : 22]] : [];
  let nextBurst = 0;
  const t0 = performance.now();
  let last = t0;

  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, w, h);
    const fade = Math.min(1, Math.max(0, (END - t) / 1.4));

    if (kind === "petals") {
      for (const p of petals) {
        const s = t - p.spawn;
        if (s < 0) continue;
        const y = -30 + p.vy * s + 6 * s * s;
        if (y > h + 40) continue;
        const x = p.x0 + p.drift * s + p.sway * Math.sin(p.swayHz * s * Math.PI * 2 + p.phase);
        const flip = Math.cos(p.flipHz * s + p.flipPhase);
        const alpha = (0.5 + p.depth * 0.45) * fade * Math.min(1, s / 0.4);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot0 + p.rotV * s);
        ctx.scale(0.3 + 0.7 * Math.abs(flip), 1);
        ctx.globalAlpha = alpha;
        petalPath(ctx, p.kind, p.size);
        ctx.fillStyle = p.color;
        ctx.fill();
        // a faint vein catches the light as the petal turns
        ctx.globalAlpha = alpha * 0.28;
        ctx.strokeStyle = p.kind === "jasmine" ? "#D9CFAF" : "#ffffff";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.7);
        ctx.lineTo(0, p.size * 0.7);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      while (nextBurst < bursts.length && t >= bursts[nextBurst][0]) {
        const [, n] = bursts[nextBurst];
        bits.push(...burst("l", n, w, h, palette, t), ...burst("r", n, w, h, palette, t));
        nextBurst++;
      }
      const drag = Math.pow(0.985, dt * 60);
      for (const b of bits) {
        b.vx *= drag; b.vy = b.vy * drag + 1150 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.tilt += b.tiltV * dt; b.rot += b.rotV * dt;
        if (b.y > h + 24) continue;
        const face = Math.cos(b.tilt);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.globalAlpha = 0.95 * fade;
        ctx.fillStyle = face > 0 ? b.a : b.b;
        if (b.round) {
          ctx.beginPath();
          ctx.arc(0, 0, b.w * (0.5 + 0.5 * Math.abs(face)), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.scale(1, Math.max(0.15, Math.abs(face)));
          ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        }
        ctx.restore();
      }
    }

    if (t >= END) { window.removeEventListener("resize", fit); done(); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", fit); };
}

export function Celebration() {
  const { view, entered, reducedMotion, slug, isPreview } = useInvitation();
  const kind = celebrationFor(view.doc);
  const ref = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!entered || !kind || reducedMotion) return;
    try {
      // once per visit: a guest who reloads the page is not showered a second time
      if (!isPreview && sessionStorage.getItem(`inv-celebrated-${slug}`) === "1") return;
      sessionStorage.setItem(`inv-celebrated-${slug}`, "1");
    } catch {}
    setActive(true);
  }, [entered, kind, reducedMotion, slug, isPreview]);

  useEffect(() => {
    const canvas = ref.current;
    if (!active || !canvas || !kind) return;
    const palette = EVENT_TYPE_INFO[view.doc.eventType].confetti;
    return run(canvas, kind, palette.length ? palette : ["#D9B65D", "#F1DFA6", "#FFFFFF"], () => setActive(false));
  }, [active, kind, view.doc.eventType]);

  if (!active) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
