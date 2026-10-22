"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { FallbackImg } from "./FallbackImg";

/**
 * A phone-shaped window onto a tall picture of an invitation (`public/templates/tall/<slug>.webp`, made by `scripts/dev/tall.mjs`).
 * The picture drifts slowly up and back down in CSS (`.reel` in globals.css), which stops under the pointer (put `reel-card` on the
 * card around it), on keyboard focus, when the visitor pauses motion, and for reduced motion. It only runs while on screen. A design
 * with no tall picture shows its first screen instead, standing still. By default it is a 9:18 box; pass `className="absolute inset-0"`
 * to fill a frame that already has a shape.
 */
export function Reel({ slug, thumb, alt, eager, className }: { slug: string; thumb: string; alt: string; eager?: boolean; className?: string }) {
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

  // each design starts at its own point in the drift, so a grid never moves in step
  const offset = [...slug].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 100, 7);
  return (
    <div ref={frame} data-live={live} className={cn("reel overflow-hidden bg-paper-2", className ?? "relative aspect-[9/18]")}>
      {missing ? (
        <FallbackImg src={thumb} alt={alt} width={540} height={1140} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover object-top" />
      ) : (
        <img ref={img} src={`/templates/tall/${slug}.webp`} alt={alt} width={520} height={4500} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setMissing(true)} className="reel-img absolute inset-x-0 top-0 w-full" style={{ animationDelay: `${-offset}s` }} />
      )}
    </div>
  );
}
