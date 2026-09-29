import { cn } from "@/lib/cn";

/** Restrained decorative details. Each one is optional per theme (divider / decor tokens). */

export function Diamond({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={cn("size-2.5", className)} aria-hidden fill="currentColor">
      <path d="M5 0l5 5-5 5-5-5z" />
    </svg>
  );
}

/** Divider: hairline, ornament (line — diamond — line) or dots. */
export function Divider({ kind = "ornament", className }: { kind?: "line" | "ornament" | "dots" | "none"; className?: string }) {
  if (kind === "none") return <div className={cn("h-8", className)} aria-hidden />;
  if (kind === "dots")
    return (
      <div className={cn("flex items-center justify-center gap-2.5 py-3 text-[var(--c-accent)]", className)} aria-hidden>
        <span className="size-1 rounded-full bg-current" />
        <span className="size-1.5 rounded-full bg-current" />
        <span className="size-1 rounded-full bg-current" />
      </div>
    );
  if (kind === "line") return <div className={cn("mx-auto my-4 h-px w-16 bg-[var(--c-accent)]", className)} aria-hidden />;
  return (
    <div className={cn("flex items-center justify-center gap-3 py-3 text-[var(--c-accent)]", className)} aria-hidden>
      <span className="h-px w-14 bg-current opacity-60 md:w-24" />
      <Diamond />
      <span className="h-px w-14 bg-current opacity-60 md:w-24" />
    </div>
  );
}

/** Kasavu (Kerala set-mundu) border: a cream field with gold stripes. Pure CSS gradient — costs nothing. */
export function KasavuBand({ className, thick = false }: { className?: string; thick?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn("w-full", thick ? "h-5" : "h-3", className)}
      style={{
        background:
          "repeating-linear-gradient(90deg, transparent 0 14px, color-mix(in srgb, var(--c-accent) 90%, #fff) 14px 15px, transparent 15px 22px), linear-gradient(180deg, var(--c-accent) 0 22%, transparent 22% 34%, var(--c-accent) 34% 44%, transparent 44% 56%, var(--c-accent) 56% 66%, transparent 66% 78%, var(--c-accent) 78% 100%)",
        backgroundBlendMode: "normal",
        opacity: 0.85,
      }}
    />
  );
}

export function Lotus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" className={cn("w-16", className)} fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden>
      <path d="M60 64C42 56 36 38 60 6c24 32 18 50 0 58z" />
      <path d="M60 64C38 62 22 48 18 26c22 2 36 16 42 38z" />
      <path d="M60 64C82 62 98 48 102 26 80 28 66 42 60 64z" />
      <path d="M60 64C30 66 8 56 2 40c18-6 42-2 58 24z" opacity=".7" />
      <path d="M60 64C90 66 112 56 118 40c-18-6-42-2-58 24z" opacity=".7" />
    </svg>
  );
}

/** Geometric rosette for the Royal flavour's hero. */
export function Rosette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("", className)} fill="none" stroke="currentColor" strokeWidth="0.7" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <ellipse key={i} cx="100" cy="46" rx="7" ry="30" transform={`rotate(${i * 15} 100 100)`} opacity={i % 2 ? 0.5 : 0.9} />
      ))}
      <circle cx="100" cy="100" r="96" />
      <circle cx="100" cy="100" r="34" />
      <circle cx="100" cy="100" r="6" fill="currentColor" />
    </svg>
  );
}

/** Two hairline corner brackets, used to frame cards on the Royal/Editorial flavours. */
export function CornerMarks({ className }: { className?: string }) {
  const c = "absolute size-4 border-[var(--c-accent)]";
  return (
    <div className={cn("pointer-events-none absolute inset-2", className)} aria-hidden>
      <span className={cn(c, "left-0 top-0 border-l border-t")} />
      <span className={cn(c, "right-0 top-0 border-r border-t")} />
      <span className={cn(c, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(c, "bottom-0 right-0 border-b border-r")} />
    </div>
  );
}

export function Jasmine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={cn("", className)} aria-hidden fill="none" stroke="currentColor" strokeWidth="0.9">
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse key={i} cx="40" cy="22" rx="5" ry="14" transform={`rotate(${i * 45} 40 40)`} />
      ))}
      <circle cx="40" cy="40" r="3.4" fill="currentColor" />
    </svg>
  );
}
