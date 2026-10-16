import { cn } from "@/lib/cn";

/** Colour dots from a theme: paper, ink, accent and the deep “night” colour. */
export function Swatches({ colors, className }: { colors: string[]; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)} aria-hidden>
      {colors.map((hex, i) => (<span key={i} className="size-3.5 rounded-full border border-black/15" style={{ background: hex }} />))}
    </span>
  );
}
