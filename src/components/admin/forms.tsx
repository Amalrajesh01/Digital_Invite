"use client";
import { createContext, useContext, useId, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LocalizedText } from "@/domain/doc/schema";
import { localeInfo } from "@/domain/doc/constants";

/** The wedding's local (secondary) language, provided once per wedding workspace. */
const LocaleCtx = createContext<{ secondary: string | null }>({ secondary: null });
export const LocaleProvider = LocaleCtx.Provider;
export const useSecondary = () => useContext(LocaleCtx).secondary;

interface LTextProps {
  label: string;
  value: LocalizedText | undefined;
  onChange: (v: LocalizedText) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  placeholder?: string;
  placeholderLocal?: string;
  className?: string;
  required?: boolean;
  maxLength?: number;
}

/**
 * Bilingual text input. English on the left, the wedding's local language (e.g. Malayalam) on the right.
 * A small amber marker shows when English is written but the local translation is still missing.
 */
export function LText({ label, value, onChange, multiline, rows = 3, hint, placeholder, placeholderLocal, className, required, maxLength }: LTextProps) {
  const secondary = useSecondary();
  const info = localeInfo(secondary);
  const id = useId();
  const v = value ?? {};
  const set = (loc: string, t: string) => {
    const next = { ...v, [loc]: t };
    if (!t.trim() && loc !== "en") delete next[loc];
    onChange(next);
  };
  const missing = !!secondary && !!(v.en ?? "").trim() && !(v[secondary] ?? "").trim();
  const Input = multiline ? "textarea" : "input";
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13.5px] font-medium text-ink-2">
          {label}
          {required && <span aria-hidden className="text-accent"> *</span>}
        </label>
        {missing && <span className="flex items-center gap-1.5 text-[12px] text-warn"><span aria-hidden className="size-1.5 rounded-full bg-warn" />{info?.label ?? "Local language"} missing</span>}
      </div>
      <div className={cn("grid gap-2", secondary && "md:grid-cols-2")}>
        <div className="relative">
          <Input id={id} {...(multiline ? { rows } : {})} lang="en" value={v.en ?? ""} maxLength={maxLength} placeholder={placeholder} onChange={(e) => set("en", e.target.value)} className={cn("field-input", multiline && "resize-y leading-relaxed")} />
          {secondary && <span aria-hidden className="pointer-events-none absolute right-2.5 top-2 rounded bg-paper-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-muted">EN</span>}
        </div>
        {secondary && (
          <div className="relative">
            <Input aria-label={`${label} (${info?.label ?? secondary})`} {...(multiline ? { rows } : {})} lang={secondary} value={v[secondary] ?? ""} maxLength={maxLength} placeholder={placeholderLocal ?? info?.native} onChange={(e) => set(secondary, e.target.value)} className={cn("field-input", multiline && "resize-y leading-loose")} style={{ fontFamily: "var(--font-local), var(--font-ui)" }} />
            <span aria-hidden className="pointer-events-none absolute right-2.5 top-2 rounded bg-brass-soft px-1.5 py-0.5 text-[10px] font-semibold text-[#7d5f16]">{info?.native ?? secondary.toUpperCase()}</span>
          </div>
        )}
      </div>
      {hint && <p className="text-[13px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}

export function FormCard({ title, description, children, actions, className }: { title?: string; description?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-rule bg-surface p-5 md:p-6", className)}>
      {(title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="display text-[24px]">{title}</h3>}
            {description && <p className="mt-1 max-w-2xl text-[14px] text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Grid({ cols = 2, children, className }: { cols?: 1 | 2 | 3; children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3", className)}>{children}</div>;
}

interface ListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, index: number, update: (patch: Partial<T> | ((t: T) => T)) => void) => React.ReactNode;
  make: () => T;
  title: (item: T, index: number) => string;
  addLabel: string;
  empty?: string;
  keyOf: (item: T) => string;
  max?: number;
  defaultOpen?: boolean;
}

/** Add / remove / reorder (with arrow buttons — keyboard friendly) list of rich items. */
export function ListEditor<T>({ items, onChange, render, make, title, addLabel, empty, keyOf, max, defaultOpen }: ListProps<T>) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const move = (i: number, d: -1 | 1) => {
    const n = [...items];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div className="space-y-3">
      {items.length === 0 && empty && <p className="rounded-md border border-dashed border-rule-strong px-4 py-5 text-center text-[14px] text-muted">{empty}</p>}
      {items.map((it, i) => {
        const k = keyOf(it);
        const isOpen = open[k] ?? (defaultOpen ?? false);
        return (
          <div key={k} className="rounded-md border border-rule-strong bg-paper/60">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [k]: !isOpen }))} aria-expanded={isOpen} className="flex min-h-9 flex-1 items-center gap-3 text-left">
                <span className="grid size-6 place-items-center rounded-full bg-paper-2 text-[12px] font-semibold text-muted tnum">{i + 1}</span>
                <span className="truncate text-[15px] font-medium">{title(it, i) || "Untitled"}</span>
                <span className="ml-auto text-[12px] text-muted">{isOpen ? "Close" : "Edit"}</span>
              </button>
              <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="size-4" /></button>
              <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></button>
              <button type="button" className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="size-4" /></button>
            </div>
            {isOpen && (
              <div className="space-y-4 border-t border-rule px-4 py-4">
                {render(it, i, (patch) => onChange(items.map((x, j) => (j === i ? (typeof patch === "function" ? patch(x) : { ...x, ...patch }) : x))))}
              </div>
            )}
          </div>
        );
      })}
      {(!max || items.length < max) && (
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => { const n = make(); onChange([...items, n]); setOpen((o) => ({ ...o, [keyOf(n)]: true })); }}>
          <Plus className="size-4" /> {addLabel}
        </button>
      )}
    </div>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md bg-brass-soft/70 px-4 py-3 text-[13.5px] leading-relaxed text-[#6b5313]">{children}</p>;
}
