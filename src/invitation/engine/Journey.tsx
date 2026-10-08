"use client";
import { useEffect, useRef } from "react";
import { figureStyleFor, journeyEnabled } from "@/domain/doc/event-types";
import { useInvitation } from "./context";
import { Bride, Groom } from "./figures";

/**
 * Two small illustrated figures stand in the bottom corners — the bride on the left, the groom on the right —
 * and walk towards each other as the guest scrolls. Their position is a pure function of scroll progress
 * (not a one-off entrance), so they can be walked back and forth, and they arrive together at the final
 * section: hands joined, a soft glow, one small heart.
 *
 * Performance: one passive scroll listener, one rAF write of two transforms and a CSS variable. No React
 * re-render happens while scrolling (state changes only when the couple arrives or leaves).
 */
const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function Journey() {
  const { view, entered, reducedMotion, journeyTogether, setJourneyTogether, t } = useInvitation();
  const enabled = journeyEnabled(view.doc);
  const style = figureStyleFor(view.doc);
  const root = useRef<HTMLDivElement>(null);
  const bride = useRef<HTMLDivElement>(null);
  const groom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !entered) return;
    const el = root.current, b = bride.current, g = groom.current;
    if (!el || !b || !g) return;
    let raf = 0, idle = 0, together = false, last = -1;

    const place = () => {
      raf = 0;
      const vw = el.clientWidth;
      const fw = b.offsetWidth; // figure width follows its CSS height (viewBox is 1 : 2)
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = clamp(window.scrollY / max);
      // arrive slightly before the very bottom so the last screen shows the couple standing together
      const q = clamp(p / 0.965);
      const margin = vw < 640 ? 8 : 20;
      const overlap = fw * 0.03; // hands meet at the seam
      const pair = fw * 2 - overlap;
      const bx1 = vw / 2 - pair / 2, gx1 = bx1 + fw - overlap;
      const bx0 = margin, gx0 = vw - margin - fw;
      b.style.transform = `translate3d(${(bx0 + (bx1 - bx0) * q).toFixed(1)}px,0,0)`;
      g.style.transform = `translate3d(${(gx0 + (gx1 - gx0) * q).toFixed(1)}px,0,0)`;
      el.style.setProperty("--join", smooth(0.84, 0.985, q).toFixed(3));
      el.style.setProperty("--meet", (bx1 + fw - overlap / 2).toFixed(1) + "px");
      const now = q >= 0.992;
      if (now !== together) { together = now; setJourneyTogether(now); }
      if (Math.abs(p - last) > 0.0002) {
        last = p;
        el.dataset.walking = "true";
        window.clearTimeout(idle);
        idle = window.setTimeout(() => { el.dataset.walking = "false"; }, 220);
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(place); };

    place();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // sections load lazily and change the page height, which changes what "the end" means
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(document.body);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
      window.clearTimeout(idle);
      if (raf) cancelAnimationFrame(raf);
      setJourneyTogether(false);
    };
  }, [enabled, entered, setJourneyTogether, style]);

  if (!enabled || !entered) return null;
  return (
    <div ref={root} className="journey" data-walking="false" data-together={journeyTogether} data-calm={reducedMotion} role="presentation" aria-hidden>
      <span className="journey-glow" />
      <div ref={bride} className="journey-fig"><div className="journey-bob"><Bride style={style} /></div></div>
      <div ref={groom} className="journey-fig"><div className="journey-bob journey-bob-b"><Groom style={style} /></div></div>
      <span className="journey-heart" title={t("journey.together")}>
        <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21.2S4.6 16.4 2.7 11.3A5.5 5.5 0 0 1 12 6.4a5.5 5.5 0 0 1 9.3 4.9C19.4 16.4 12 21.2 12 21.2Z" fill="var(--c-accent)" /></svg>
      </span>
      <span className="journey-spark journey-spark-1" /><span className="journey-spark journey-spark-2" /><span className="journey-spark journey-spark-3" />
    </div>
  );
}
