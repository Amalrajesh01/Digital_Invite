import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PortfolioCard } from "@/domain/portfolio/service";
import { FallbackImg } from "./FallbackImg";

/**
 * A curated wall of finished work, not a grid of thumbnails: the first story is large, the rest alternate in height so the eye moves.
 * Every card links to its own page; the live invitation is offered there, and only when the studio allowed it.
 */
export function PortfolioWall({ items, className }: { items: PortfolioCard[]; className?: string }) {
  return (
    <ul className={cn("grid auto-rows-auto gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((p, i) => {
        const big = i === 0;
        const tall = i % 3 === 1;
        return (
          <li key={p.slug} className={cn(big && "sm:col-span-2 lg:col-span-2 lg:row-span-2")}>
            <Link href={`/portfolio/${p.slug}`} data-track="cta_click" data-ref={`portfolio-${p.slug}`} className="group relative block h-full overflow-hidden rounded-2xl bg-night text-white">
              <div className={cn("relative w-full", big ? "aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[34rem]" : tall ? "aspect-[4/5]" : "aspect-[5/4]")}>
                <FallbackImg src={p.cover.src} srcSet={p.cover.srcSet} sizes={big ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"} alt={p.cover.alt} width={p.cover.width ?? 540} height={p.cover.height ?? 675} loading={i < 2 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 size-full object-cover object-top transition duration-[1200ms] ease-out group-hover:scale-[1.04]" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-white/70">{[p.categoryName, p.styleLabel].filter(Boolean).join(" · ")}</p>
                <h3 className={cn("mt-1.5 font-serif font-medium leading-tight", big ? "text-[clamp(26px,3vw,40px)]" : "text-[clamp(21px,2vw,26px)]")}>{p.title}</h3>
                {big && p.description && <p className="mt-2 max-w-xl text-[15.5px] leading-snug text-white/80">{p.description}</p>}
                <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-white/90">{p.city ? `${p.city} · ` : ""}See the story <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
