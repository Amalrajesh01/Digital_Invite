"use client";
import { useEffect, useRef, useState } from "react";
import { FallbackImg } from "./FallbackImg";

/**
 * A phone-shaped window onto a tall picture of an invitation (`public/templates/tall/<slug>.webp`, made by `scripts/dev/tall.mjs`).
 * The picture drifts slowly up and back down in CSS (`.reel` in globals.css), which stops under the pointer, on keyboard focus,
 * when the visitor pauses motion, and for reduced motion. It only runs while on screen. A design with no tall picture shows its
 * first screen instead, standing still.
 */
export function Reel({ tall, thumb, alt, index, eager }: { tall: string; thumb: string; alt: string; index: number; eager: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [live, setLive] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // an error that fires before hydration is never seen by onError
  useEffect(() => { if (img.current?.complete && img.current.naturalWidth === 0) setMissing(true); }, []);

  return (
    <div ref={frame} data-live={live} className="reel relative aspect-[9/18] overflow-hidden bg-paper-2">
      {missing ? (
        <FallbackImg src={thumb} alt={alt} width={540} height={1140} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover object-top" />
      ) : (
        // staggered start so the grid never moves in step
        <img ref={img} src={tall} alt={alt} width={520} height={4500} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setMissing(true)} className="reel-img absolute inset-x-0 top-0 w-full" style={{ animationDelay: `${-((index * 23) % 100)}s` }} />
      )}
    </div>
  );
}
