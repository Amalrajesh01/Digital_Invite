"use client";
import { cn } from "@/lib/cn";

/** Two-or-three way toggle used inside invitation sections (family tree side, travel tabs…). */
export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex border border-[var(--c-border)] p-0.5", className)} style={{ borderRadius: "var(--r)" }}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("min-h-11 px-5 text-[0.74rem] font-medium uppercase tracking-[0.18em] transition-colors", value === o.value ? "bg-[var(--c-primary)] text-[var(--c-on-primary)]" : "text-[var(--c-muted)] hover:text-[var(--c-text)]")}
          style={{ borderRadius: "calc(var(--r) - 1px)" }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
