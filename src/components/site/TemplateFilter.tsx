"use client";
import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { waLink, WA } from "@/lib/whatsapp";
import { WaIcon } from "./WaButton";

export interface FilterItem {
  slug: string;
  categories: string[];
  styles: string[];
  theme: string;
}
export interface FilterOption {
  value: string;
  label: string;
  swatches?: string[];
}
export interface FilterState {
  category: string;
  style: string;
  theme: string;
}

function FilterGroup({ label, value, options, onPick }: { label: string; value: string; options: FilterOption[]; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="w-full text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:mr-2 sm:w-24">{label}</span>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" aria-pressed={on} onClick={() => onPick(o.value)} className={cn("inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors", on ? "border-ink bg-ink text-white" : "border-rule-strong bg-white text-ink-2 hover:border-ink-2")}>
            {o.swatches && (
              <span className="flex" aria-hidden>
                {o.swatches.map((h, i) => (<span key={i} className="-ml-1 size-3.5 rounded-full border border-black/15 first:ml-0" style={{ background: h }} />))}
              </span>
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Filter the gallery by occasion, style and colours. The cards are rendered on the server (every one of them is in the
 * page for search engines and for anyone without JavaScript); this only decides which of them to show, and keeps the
 * choice in the address so a filtered view can be shared.
 */
export function TemplateFilter({ items, cards, categories, styles, themes, initial }: { items: FilterItem[]; cards: React.ReactNode[]; categories: FilterOption[]; styles: FilterOption[]; themes: FilterOption[]; initial: FilterState }) {
  const [f, setF] = useState<FilterState>(initial);
  const set = useCallback((key: keyof FilterState, value: string) => {
    setF((prev) => {
      const next = { ...prev, [key]: prev[key] === value ? "" : value };
      try {
        const q = new URLSearchParams();
        for (const k of ["category", "style", "theme"] as const) if (next[k]) q.set(k, next[k]);
        window.history.replaceState(null, "", q.size ? `?${q}` : window.location.pathname);
      } catch {}
      return next;
    });
  }, []);
  const clear = () => {
    setF({ category: "", style: "", theme: "" });
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {}
  };
  const shown = useMemo(() => items.map((it) => (!f.category || it.categories.includes(f.category)) && (!f.style || it.styles.includes(f.style)) && (!f.theme || it.theme === f.theme)), [items, f]);
  const count = shown.filter(Boolean).length;
  const active = !!(f.category || f.style || f.theme);

  return (
    <div>
      <div className="grid gap-4 rounded-xl border border-rule-strong bg-white p-5 sm:p-6">
        <FilterGroup label="Occasion" value={f.category} options={categories} onPick={(v) => set("category", v)} />
        <FilterGroup label="Style" value={f.style} options={styles} onPick={(v) => set("style", v)} />
        <FilterGroup label="Colours" value={f.theme} options={themes} onPick={(v) => set("theme", v)} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-[14px] text-muted">
          <p role="status" aria-live="polite">{count === items.length && !active ? `All ${items.length} templates` : `${count} of ${items.length} templates`}</p>
          {active && <button type="button" onClick={clear} className="font-medium text-accent underline underline-offset-4">Clear filters</button>}
        </div>
      </div>

      <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <li key={items[i].slug} hidden={!shown[i]}>{card}</li>
        ))}
      </ul>

      {count === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-rule-strong bg-paper p-10 text-center">
          <p className="font-serif text-[30px] text-ink">Nothing matches all three.</p>
          <p className="mx-auto mt-2 max-w-md text-[15.5px] text-ink-2/80">Try removing a filter — or tell us the occasion and we will design it for you.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={clear} className="btn btn-quiet">Clear filters</button>
            <a href={waLink(WA.custom)} target="_blank" rel="noopener noreferrer" className="btn bg-[#1fa855] text-white hover:bg-[#188f47]"><WaIcon /> Ask us on WhatsApp</a>
          </div>
        </div>
      )}
    </div>
  );
}
