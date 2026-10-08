"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useInvitation } from "./context";

/** Tasteful placeholder when a photograph is not available (never a grey box). */
export function ArtFallback({ seed = 0, className, label }: { seed?: number; className?: string; label?: string }) {
  const a = 18 + ((seed * 37) % 60);
  return (
    <div
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={{ background: `radial-gradient(120% 90% at ${a}% 12%, color-mix(in srgb, var(--c-accent) 38%, var(--c-surface)), var(--c-surface) 62%), linear-gradient(160deg, color-mix(in srgb, var(--c-primary) 14%, var(--c-bg)), var(--c-bg))` }}
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <svg viewBox="0 0 100 100" className="w-1/3 opacity-30" fill="none" stroke="var(--c-primary)" strokeWidth="0.6">
        <circle cx="50" cy="50" r="30" />
        <circle cx="50" cy="50" r="22" />
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse key={i} cx="50" cy="26" rx="4" ry="11" transform={`rotate(${i * 30} 50 50)`} />
        ))}
      </svg>
    </div>
  );
}

interface PhotoProps {
  id?: string | null;
  /** Landscape version of the same picture for wide screens (art direction): used from 768px up. */
  wideId?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  seed?: number;
  /** Extra classes on the wrapper, e.g. aspect ratios. */
  ratio?: string;
  onClick?: () => void;
  focal?: { x: number; y: number };
}

/**
 * Responsive photograph: srcset from server-generated WebP variants, blur-up placeholder,
 * focal-point aware cropping, lazy loading below the fold — and a themed placeholder if the
 * file is missing or fails to load, so a broken image can never reach a guest.
 */
export function Photo({ id, wideId, alt, className, imgClassName, priority, sizes, seed, ratio, focal }: PhotoProps) {
  const { media, L } = useInvitation();
  const m = media(id);
  const wide = wideId ? media(wideId) : undefined;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!m || m.kind !== "IMAGE" || failed) return <div className={cn("relative overflow-hidden", ratio, className)}><ArtFallback seed={seed ?? 0} /></div>;
  const f = focal ?? m.focal;
  const fw = wide?.focal ?? f;
  const text = alt ?? L(m.alt);
  const useWide = !!wide && wide.kind === "IMAGE";
  const pos = (p?: { x: number; y: number }) => (p ? `${p.x}% ${p.y}%` : undefined);
  return (
    <div className={cn("relative overflow-hidden", ratio, className)} style={m.blur ? { backgroundImage: `url(${m.blur})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: "var(--c-border)" }}>
      <picture>
        {useWide && <source media="(min-width: 768px)" srcSet={wide!.srcSet ?? wide!.url} sizes={sizes ?? "100vw"} />}
        <img
          src={m.url}
          srcSet={m.srcSet}
          sizes={sizes ?? m.sizes}
          alt={text}
          width={m.width}
          height={m.height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
          }}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0", useWide && "inv-wide-pos", imgClassName)}
          style={{ objectPosition: pos(f), ...(useWide && fw ? ({ "--wide-pos": pos(fw) } as React.CSSProperties) : null) }}
        />
      </picture>
    </div>
  );
}
