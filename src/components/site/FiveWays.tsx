"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reel } from "./Reel";
import { Swatches } from "./Swatches";

export interface WayGroup {
  slug: string;
  name: string;
  /** One line about what this occasion needs. */
  line: string;
  designs: { slug: string; name: string; styleLabel: string; thumb: string; path: string; colors: string[] }[];
}

/**
 * “Every occasion, five different feelings.” Pick an occasion and see its five designs side by side, as real pictures of
 * their first screens. This is the clearest answer to “how are the designs different?”: look.
 */
export function FiveWays({ groups }: { groups: WayGroup[] }) {
  const [slug, setSlug] = useState(groups[0]?.slug ?? "");
  const g = groups.find((x) => x.slug === slug) ?? groups[0];
  if (!g) return null;
  return (
    <div>
      <div role="tablist" aria-label="Occasion" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {groups.map((x) => (
          <button key={x.slug} role="tab" type="button" aria-selected={x.slug === slug} onClick={() => setSlug(x.slug)} className={cn("min-h-11 shrink-0 rounded-full border px-5 text-[15px] font-medium transition-colors", x.slug === slug ? "border-ink bg-ink text-white" : "border-rule-strong bg-white text-ink-2 hover:border-ink-2")}>
            {x.name}
          </button>
        ))}
      </div>
      <p className="mt-5 max-w-2xl text-[17px] text-ink-2/85">{g.line}</p>
      <ul role="tabpanel" className="-mx-5 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0" tabIndex={0} aria-label={`${g.name} designs`}>
        {g.designs.slice(0, 5).map((d) => (
          <li key={d.slug} className="w-[62%] shrink-0 snap-center sm:w-auto">
            <Link href={d.path} data-track="cta_click" data-ref={`fiveways-${d.slug}`} className="reel-card group block">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[1.5rem] border-[4px] border-ink bg-paper-2 shadow-[0_22px_36px_-26px_rgba(23,20,31,.55)] transition duration-500 group-hover:-translate-y-1.5">
                <Reel slug={d.slug} thumb={d.thumb} alt={`${d.name}, a ${d.styleLabel} design`} className="absolute inset-0" />
              </div>
              <p className="mt-3 font-serif text-[22px] font-medium leading-tight text-ink group-hover:text-accent">{d.name}</p>
              <div className="mt-0.5 flex items-center justify-between gap-2"><p className="truncate text-[13.5px] text-muted">{d.styleLabel}</p><Swatches colors={d.colors.slice(0, 3)} /></div>
            </Link>
          </li>
        ))}
      </ul>
      <Link href={`/templates/${g.slug}`} className="btn btn-quiet mt-2" data-track="cta_click" data-ref={`fiveways-all-${g.slug}`}>See every {g.name.toLowerCase()} design <ArrowRight className="size-4" aria-hidden /></Link>
    </div>
  );
}
