"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Motion principles: controlled, story-serving, never distracting.
 * Reveals are CSS-driven (no animation library shipped for simple fades) and only hide content
 * when JavaScript is running (`.js` on <html>), so nothing is ever invisible without scripting.
 * All of it collapses under prefers-reduced-motion (see invitation.css).
 */
export function useInView<T extends HTMLElement>(opts: { threshold?: number; once?: boolean; rootMargin?: string } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          if (opts.once !== false) io.disconnect();
        } else if (opts.once === false) setInView(false);
      },
      { threshold: opts.threshold ?? 0.12, rootMargin: opts.rootMargin ?? "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [opts.threshold, opts.once, opts.rootMargin]);
  return [ref, inView] as const;
}

export function Reveal({ children, delay = 0, className, as: Tag = "div", variant = "up" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" | "figure" | "p" | "span"; variant?: "up" | "fade" | "mask" | "left" | "right" }) {
  const [ref, inView] = useInView<HTMLElement>();
  const Comp = Tag as React.ElementType;
  // The mask variant clips the element itself, and browsers report a fully clipped element as not
  // intersecting — so the observed wrapper is separate from the clipped layer.
  if (variant === "mask") {
    return (
      <Comp ref={ref} className={className}>
        <div className={cn("rv rv-mask h-full", inView && "in")} style={{ transitionDelay: `${delay}ms` }}>
          {children}
        </div>
      </Comp>
    );
  }
  return (
    <Comp ref={ref} className={cn("rv", `rv-${variant}`, inView && "in", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Comp>
  );
}

/** Headline that rises word by word out of a mask. Falls back to plain text for reduced motion. */
export function RevealWords({ text, className, as: Tag = "h2", delay = 0 }: { text: string; className?: string; as?: "h1" | "h2" | "h3" | "p" | "div"; delay?: number }) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.3 });
  const Comp = Tag as React.ElementType;
  const words = text.split(/(\s+)/);
  return (
    <Comp ref={ref} className={cn("rw", inView && "in", className)} aria-label={text}>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? (
          <span key={i}> </span>
        ) : (
          <span key={i} className="rw-mask" aria-hidden>
            <span className="rw-word" style={{ transitionDelay: `${delay + i * 45}ms` }}>
              {w}
            </span>
          </span>
        ),
      )}
    </Comp>
  );
}

/** Gentle parallax for hero photography (translate only; disabled for reduced motion via CSS var). */
export function Parallax({ children, amount = 40, className }: { children: React.ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1
      el.style.transform = `translate3d(0, ${(-progress * amount).toFixed(1)}px, 0) scale(1.08)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [amount]);
  return (
    <div ref={ref} className={cn("will-change-transform", className)} style={{ transform: "scale(1.08)" }}>
      {children}
    </div>
  );
}

/** Live-updating countdown. Returns null until mounted so server and client never disagree. */
export function useCountdown(target: Date | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target || now === null) return null;
  const diff = Math.max(0, target.getTime() - now);
  const s = Math.floor(diff / 1000);
  return { done: diff === 0, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, total: s };
}

export function useInterval(fn: () => void, ms: number | null) {
  const saved = useRef(fn);
  useEffect(() => {
    saved.current = fn;
  }, [fn]);
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
