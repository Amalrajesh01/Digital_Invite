import { cn } from "@/lib/cn";
import type { Ceremony } from "@/domain/doc/schema";

/**
 * Small line illustrations for ceremonies that have no photograph yet. One stroke weight, one drawing
 * language (hairline, round caps), coloured by `currentColor` so they take the theme's accent.
 */
type GlyphKey = Exclude<Ceremony["glyph"], "none">;

const PATHS: Record<GlyphKey, React.ReactNode> = {
  lamp: (
    <>
      <path d="M9 30h30" />
      <path d="M10 30c2 7.5 8 11 14 11s12-3.5 14-11" />
      <path d="M24 10c4.4 5 5.4 8.6 0 13-5.4-4.4-4.4-8 0-13Z" />
      <path d="M24 23v7" />
    </>
  ),
  kalash: (
    <>
      <path d="M16 21c-4.4 4.6-3.6 18 8 20.5 11.6-2.5 12.4-15.9 8-20.5" />
      <path d="M17.5 17.5h13M19 21h10" />
      <circle cx="24" cy="11" r="4.2" />
      <path d="M18 15c-3.4-3.6-1.6-7 2.4-8M30 15c3.4-3.6 1.6-7-2.4-8" />
    </>
  ),
  flame: <path d="M24 6c7 8 12.6 14.4 6.4 22.6-3 4-9.4 5.2-12.6 1.2-4-5-.8-10.4 3.2-14.2.8 4 3 5.2 5 3.2-1-4-3.2-7.4-2-12.8Z" />,
  rings: (
    <>
      <circle cx="18.5" cy="29" r="9.5" />
      <circle cx="29.5" cy="29" r="9.5" />
      <path d="m24 10 3.4 4.4L24 19l-3.4-4.6Z" />
    </>
  ),
  drum: (
    <>
      <path d="M10 19c0-3.4 28-3.4 28 0v13c0 3.4-28 3.4-28 0Z" />
      <path d="M10 19c0 3.4 28 3.4 28 0" />
      <path d="m16 22 3.6 11M24 22.6V34M32 22l-3.6 11" />
      <path d="M6 7.5 17 18M42 7.5 31 18" />
    </>
  ),
  flower: (
    <>
      {Array.from({ length: 8 }).map((_, i) => (<ellipse key={i} cx="24" cy="13" rx="3.6" ry="7" transform={`rotate(${i * 45} 24 24)`} />))}
      <circle cx="24" cy="24" r="3" />
    </>
  ),
  bowl: (
    <>
      <path d="M7 24h34c0 9.6-7.6 17-17 17S7 33.6 7 24Z" />
      <path d="M13 24c1.6-6 6-9 11-9s9.4 3 11 9" />
      <path d="M20 10c1.4 2 1.4 3.4 0 5M28 8c1.4 2 1.4 3.6 0 5.6" />
    </>
  ),
  knot: (
    <>
      <path d="M24 38S11.5 30.6 11.5 21.4a7.2 7.2 0 0 1 12.5-4.8 7.2 7.2 0 0 1 12.5 4.8C36.5 30.6 24 38 24 38Z" />
      <path d="m22 38.5-4 6M26 38.5l4 6" />
    </>
  ),
};

export function Glyph({ name, className }: { name: Ceremony["glyph"]; className?: string }) {
  if (name === "none") return null;
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-full", className)} fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name] ?? PATHS.lamp}
    </svg>
  );
}
