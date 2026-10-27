"use client";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/** On a phone a row of chips would scroll sideways; this is the same choice as a dropdown. Pair it with `hidden sm:flex` on the chips. */
export function MobileSelect({ label, value, options, onPick, className }: { label: string; value: string; options: { value: string; label: string }[]; onPick: (v: string) => void; className?: string }) {
  return (
    <label className={cn("relative block sm:hidden", className)}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onPick(e.target.value)} className="h-12 w-full appearance-none rounded-xl border border-rule-strong bg-white pl-4 pr-10 text-[16px] text-ink outline-none focus:border-ink">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </label>
  );
}
