"use client";
import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { waLink, WA } from "@/lib/whatsapp";
import { WaIcon } from "./WaButton";
import { MobileSelect } from "./MobileSelect";

export interface FilterOption { value: string; label: string }
export interface FilterState { occasion: string; style: string }
export interface FilterGroup { slug: string; name: string; line: string; styles: string[]; cards: React.ReactNode[] }

function Chips({ label, value, options, onPick }: { label: string; value: string; options: FilterOption[]; onPick: (v: string) => void }) {
  return (
    <div role="group" aria-label={label}>
      <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <MobileSelect label={label} value={value} options={[{ value: "", label: "All" }, ...options]} onPick={onPick} />
      <div className="hidden flex-wrap gap-2 sm:flex">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" aria-pressed={on} onClick={() => onPick(o.value)} className={cn("min-h-11 shrink-0 rounded-full border px-4 text-[14.5px] font-medium transition-colors", on ? "border-ink bg-ink text-white" : "border-rule-strong bg-white text-ink-2 hover:border-ink-2")}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Choose by occasion and by style. Every design is rendered on the server and is in the page for search engines and for
 * anyone without JavaScript; this only decides which of them to show, and keeps the choice in the address so a filtered
 * view can be shared.
 */
export function TemplateFilter({ groups, occasions, styles, initial }: { groups: FilterGroup[]; occasions: FilterOption[]; styles: FilterOption[]; initial: FilterState }) {
  const [f, setF] = useState<FilterState>(initial);
  const set = useCallback((key: keyof FilterState, value: string) => {
    setF((prev) => {
      const next = { ...prev, [key]: prev[key] === value ? "" : value };
      try {
        const q = new URLSearchParams();
        for (const k of ["occasion", "style"] as const) if (next[k]) q.set(k, next[k]);
        window.history.replaceState(null, "", q.size ? `?${q}` : window.location.pathname);
      } catch {}
      return next;
    });
  }, []);
  const clear = () => {
    setF({ occasion: "", style: "" });
    try { window.history.replaceState(null, "", window.location.pathname); } catch {}
  };
  const visible = useMemo(() => groups.map((g) => ({ g, show: !f.occasion || g.slug === f.occasion, cards: g.cards.map((_, i) => !f.style || g.styles[i] === f.style) })), [groups, f]);
  const count = visible.reduce((n, v) => n + (v.show ? v.cards.filter(Boolean).length : 0), 0);
  const total = groups.reduce((n, g) => n + g.cards.length, 0);
  const active = !!(f.occasion || f.style);
  return (
    <div>
      <div className="grid gap-5 rounded-2xl border border-rule-strong bg-white p-5 sm:p-6">
        <Chips label="What are you celebrating?" value={f.occasion} options={occasions} onPick={(v) => set("occasion", v)} />
        <Chips label="Which style do you like?" value={f.style} options={styles} onPick={(v) => set("style", v)} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-[14.5px] text-muted">
          <p role="status" aria-live="polite">{active ? `${count} of ${total} designs` : `All ${total} designs`}</p>
          {active && <button type="button" onClick={clear} className="font-medium text-accent underline underline-offset-4">Show everything</button>}
        </div>
      </div>

      {visible.map(({ g, show, cards }) => (
        <section key={g.slug} id={g.slug} hidden={!show || !cards.some(Boolean)} className="mt-14 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-[clamp(30px,3.6vw,44px)] font-medium leading-tight text-ink">{g.name}</h2>
              <p className="mt-1 max-w-2xl text-[16px] text-ink-2/80">{g.line}</p>
            </div>
            <a href={`/templates/${g.slug}`} className="text-[15px] font-medium text-accent underline underline-offset-4">All {g.name.toLowerCase()} designs</a>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-5">
            {g.cards.map((card, i) => (<li key={i} hidden={!cards[i]}>{card}</li>))}
          </ul>
        </section>
      ))}

      {count === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-rule-strong bg-paper p-10 text-center">
          <p className="font-serif text-[30px] text-ink">Nothing matches both.</p>
          <p className="mx-auto mt-2 max-w-md text-[16px] text-ink-2/80">Try a different style — or tell us the occasion and we will suggest one.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={clear} className="btn btn-quiet">Show everything</button>
            <a href={waLink(WA.custom)} target="_blank" rel="noopener noreferrer" className="btn bg-[#1fa855] text-white hover:bg-[#188f47]"><WaIcon /> Ask us on WhatsApp</a>
          </div>
        </div>
      )}
    </div>
  );
}
