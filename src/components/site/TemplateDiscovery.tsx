"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Pause, Play, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reel } from "./Reel";
import { Swatches } from "./Swatches";
import { MobileSelect } from "./MobileSelect";

export interface DiscoveryItem {
  slug: string; name: string; tagline: string; styleLabel: string; category: string; categoryName: string; thumb: string; path: string; colors: string[]; tags: string[]; featured: boolean;
}

/**
 * The whole template library, driven by the registry: every public design is a card, filtered by occasion, by feeling and by a word in
 * its name. Every card is rendered on the server (it is in the page for search engines and for anyone without JavaScript); this only
 * decides which are shown. A grid of phones, four across on a desktop, three on a tablet, two on a phone; each phone slowly scrolls
 * its own invitation (see Reel) unless the visitor pauses it.
 */
export function TemplateDiscovery({ items, occasions, tagLabels, initialOccasion }: { items: DiscoveryItem[]; occasions: { slug: string; name: string }[]; tagLabels: Record<string, string>; initialOccasion: string }) {
  const [occasion, setOccasion] = useState(initialOccasion);
  const [tag, setTag] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"featured" | "az">("featured");
  const [still, setStill] = useState(false);

  const inOccasion = useMemo(() => items.filter((d) => !occasion || d.category === occasion), [items, occasion]);
  // only feelings that some design in this occasion really has
  const tags = useMemo(() => {
    const n = new Map<string, number>();
    for (const d of inOccasion) for (const t of d.tags) n.set(t, (n.get(t) ?? 0) + 1);
    return [...n.entries()].filter(([t]) => tagLabels[t]).sort((a, b) => b[1] - a[1]);
  }, [inOccasion, tagLabels]);
  const needle = q.trim().toLowerCase();
  const shown = useMemo(() => {
    const ok = new Set(inOccasion.filter((d) => (!tag || d.tags.includes(tag)) && (!needle || `${d.name} ${d.tagline} ${d.styleLabel}`.toLowerCase().includes(needle))).map((d) => d.slug));
    return ok;
  }, [inOccasion, tag, needle]);
  const order = useMemo(() => {
    const list = [...items];
    return sort === "az" ? list.sort((a, b) => a.name.localeCompare(b.name)) : list.sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [items, sort]);
  const count = (slug: string) => items.filter((d) => !slug || d.category === slug).length;

  return (
    <div>
      <MobileSelect label="Occasion" value={occasion} options={[{ value: "", label: "All occasions" }, ...occasions.map((o) => ({ value: o.slug, label: o.name }))]} onPick={(v) => { setOccasion(v); setTag(""); }} />
      <div role="tablist" aria-label="Occasion" className="hidden flex-wrap gap-2 sm:flex">
        {[{ slug: "", name: "All occasions" }, ...occasions].map((o) => (
          <button key={o.slug || "all"} role="tab" type="button" aria-selected={occasion === o.slug} onClick={() => { setOccasion(o.slug); setTag(""); }}
            className={cn("min-h-11 shrink-0 rounded-full border px-4 text-[15px] font-medium transition-colors", occasion === o.slug ? "border-ink bg-ink text-white" : "border-rule-strong bg-white text-ink hover:border-ink")}>
            {o.name} <span className={cn("tnum text-[13px]", occasion === o.slug ? "text-white/70" : "text-muted")}>{count(o.slug)}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <MobileSelect className="w-full" label="Feeling" value={tag} options={[{ value: "", label: "Any feeling" }, ...tags.map(([t, n]) => ({ value: t, label: `${tagLabels[t]} (${n})` }))]} onPick={setTag} />
        <div role="group" aria-label="Feeling" className="hidden flex-wrap gap-2 sm:flex">
          {tags.map(([t, n]) => (
            <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? "" : t)}
              className={cn("min-h-10 shrink-0 rounded-full border px-3.5 text-[14px] transition-colors", tag === t ? "border-accent bg-accent-soft/60 font-medium text-ink" : "border-rule bg-transparent text-ink-2 hover:border-ink-2")}>
              {tagLabels[t]} <span className="tnum text-muted">{n}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block">
            <span className="sr-only">Search designs by name</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="h-11 w-48 rounded-full border border-rule-strong bg-white pl-9 pr-3 text-[15px] outline-none focus:border-ink" />
          </label>
          <button type="button" onClick={() => setStill((v) => !v)} aria-pressed={still} className="inline-flex h-11 items-center gap-2 rounded-full border border-rule-strong bg-white px-4 text-[14px] font-medium text-ink hover:border-ink">
            {still ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}{still ? "Play previews" : "Pause previews"}
          </button>
          <label className="flex items-center gap-2 text-[14px] text-muted">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as "featured" | "az")} className="h-11 rounded-full border border-rule-strong bg-white px-3 text-[15px] text-ink">
              <option value="featured">Newest first</option><option value="az">A to Z</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 text-[14px] text-muted" role="status" aria-live="polite">{[...shown].length} design{[...shown].length === 1 ? "" : "s"}{occasion || tag || needle ? " match" : ""}</p>

      <ul className={cn("mt-4 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4", still && "reel-still")}>
        {order.map((d, i) => (
          <li key={d.slug} hidden={!shown.has(d.slug)} className="[content-visibility:auto] [contain-intrinsic-size:auto_34rem]">
            <article className="reel-card group flex h-full flex-col">
              <Link href={d.path} data-track="cta_click" data-ref={`discover-${d.slug}`} className="block" aria-label={`Preview ${d.name}`}>
                <div className="overflow-hidden rounded-[1.6rem] border-[5px] border-ink bg-paper-2 shadow-[0_26px_40px_-28px_rgba(23,20,31,.6)] transition duration-500 group-hover:-translate-y-1.5">
                  <Reel slug={d.slug} thumb={d.thumb} alt={`The ${d.name} invitation, scrolling`} eager={i < 4} />
                </div>
              </Link>
              <div className="mt-3 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-[18px] font-medium leading-tight text-ink min-[420px]:text-[20px] sm:text-[22px]">{d.name}</h3>
                  <Swatches colors={d.colors.slice(0, 3)} />
                </div>
                <p className="mt-1 text-[13.5px] text-muted">{d.styleLabel} · {d.categoryName}</p>
                <p className="mt-2 line-clamp-2 text-[14.5px] leading-snug text-ink-2/85 sm:text-[15px]">{d.tagline}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-3">
                  <Link href={d.path} data-track="cta_click" data-ref={`discover-preview-${d.slug}`} className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-ink underline underline-offset-4 hover:text-accent">Preview <ArrowRight className="size-4" aria-hidden /></Link>
                  <Link href={`/start?template=${d.slug}`} data-track="cta_click" data-ref={`discover-choose-${d.slug}`} className="inline-flex min-h-11 items-center text-[15px] text-ink-2 underline-offset-4 hover:text-accent hover:underline">Choose this design</Link>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
      {shown.size === 0 && <p className="mt-10 text-center text-[17px] text-muted">No design matches that. Try fewer filters.</p>}
    </div>
  );
}
