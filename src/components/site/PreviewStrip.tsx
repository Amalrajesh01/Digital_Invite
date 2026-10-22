"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { FallbackImg } from "./FallbackImg";

export interface StripItem { slug: string; name: string; styleLabel: string; thumb: string; path: string }

/** Pixels per second the strip drifts. Slow enough to read a name, never a banner. */
const SPEED = 26;

/**
 * A strip of phone-sized previews that drifts slowly sideways like a gallery wall. It is a real scroll container, so it can always
 * be dragged, swiped, scrolled or tabbed through; the drift only ever *adds* movement and stops for anything that suggests the visitor
 * is busy: the pointer over it, focus inside it, a touch, the strip off screen, a hidden tab, a pause button, or reduced motion
 * (then it never moves by itself). It turns round at each end instead of jumping, and holds no duplicate cards.
 */
export function PreviewStrip({ items, label }: { items: StripItem[]; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(true); // assume the quiet choice until the media query has answered
  const held = useRef(0); // how many reasons there are to stand still right now
  const timer = useRef<number | undefined>(undefined);
  const dir = useRef(1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !playing) return;
    let raf = 0, last = 0, visible = false, pos = el.scrollLeft;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(64, t - last) : 16;
      last = t;
      const max = el.scrollWidth - el.clientWidth;
      if (held.current > 0 || !visible || document.hidden || max <= 0) { pos = el.scrollLeft; return; }
      pos += (dir.current * SPEED * dt) / 1000;
      if (pos >= max) { pos = max; dir.current = -1; } else if (pos <= 0) { pos = 0; dir.current = 1; }
      el.scrollLeft = pos;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [playing, reduced]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Stand still while something holds the strip; `ms` > 0 keeps it still a moment after the visitor lets go. */
  const hold = useCallback((on: boolean, ms = 0) => {
    window.clearTimeout(timer.current);
    if (on) { held.current = 1; return; }
    if (ms > 0) timer.current = window.setTimeout(() => { held.current = 0; }, ms);
    else held.current = 0;
  }, []);

  const by = (n: number) => {
    const el = ref.current;
    if (!el) return;
    hold(true);
    el.scrollBy({ left: n * el.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
    hold(false, 3500);
  };

  return (
    <section aria-label={label} className="relative">
      <ul
        ref={ref}
        tabIndex={0}
        aria-label={`${label} — use the arrow keys to move`}
        className="flex gap-4 overflow-x-auto px-5 pb-6 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
        style={{ WebkitMaskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)", maskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)" }}
        onPointerEnter={() => hold(true)}
        onPointerLeave={() => hold(false, 1200)}
        onPointerDown={() => hold(true)}
        onPointerUp={() => hold(false, 3500)}
        onFocus={() => hold(true)}
        onBlur={() => hold(false, 1500)}
        onWheel={() => { hold(true); hold(false, 3500); }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); by(0.6); } else if (e.key === "ArrowLeft") { e.preventDefault(); by(-0.6); } }}
      >
        {items.map((d, i) => (
          <li key={d.slug} className="w-[10.5rem] shrink-0 sm:w-[12.5rem]">
            <Link href={d.path} data-track="cta_click" data-ref={`strip-${d.slug}`} className="group block">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[1.6rem] border-[5px] border-ink bg-paper-2 shadow-[0_26px_40px_-28px_rgba(23,20,31,.6)] transition duration-500 group-hover:-translate-y-1.5">
                <FallbackImg src={d.thumb} alt={`The ${d.name} invitation`} width={540} height={1140} loading={i < 4 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 size-full object-cover object-top" />
              </div>
              <p className="mt-3 truncate font-serif text-[19px] font-medium leading-tight text-ink group-hover:text-accent">{d.name}</p>
              <p className="truncate text-[13px] text-muted">{d.styleLabel}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-center justify-center gap-2">
        <button type="button" onClick={() => by(-1)} aria-label="Previous designs" className="grid size-11 place-items-center rounded-full border border-rule-strong bg-white text-ink hover:border-ink"><ChevronLeft className="size-5" aria-hidden /></button>
        <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing} aria-label={playing ? "Pause the moving strip" : "Let the strip move"} className="inline-flex h-11 items-center gap-2 rounded-full border border-rule-strong bg-white px-4 text-[14px] font-medium text-ink hover:border-ink">
          {playing && !reduced ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}{playing && !reduced ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={() => by(1)} aria-label="Next designs" className="grid size-11 place-items-center rounded-full border border-rule-strong bg-white text-ink hover:border-ink"><ChevronRight className="size-5" aria-hidden /></button>
      </div>
    </section>
  );
}
