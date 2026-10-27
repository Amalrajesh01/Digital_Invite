"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TabItem { href: string; label: string; locked?: boolean; badge?: number }

/** Horizontal, scrollable section tabs for one wedding (Super Admin). Locked = not in the package. */
export function WorkspaceTabs({ items, base }: { items: TabItem[]; base: string }) {
  const path = usePathname();
  const router = useRouter();
  const current = items.filter((it) => (it.href === base ? path === base : path === it.href || path.startsWith(it.href + "/"))).sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <>
    <label className="relative mb-6 block md:hidden">
      <span className="sr-only">Wedding section</span>
      <select value={current?.href ?? base} onChange={(e) => router.push(e.target.value)} className="h-12 w-full appearance-none rounded-xl border border-rule-strong bg-white pl-4 pr-10 text-[16px] text-ink outline-none focus:border-ink">
        {items.map((it) => <option key={it.href} value={it.href}>{it.label}{it.locked ? " (not in package)" : ""}{it.badge ? ` · ${it.badge}` : ""}</option>)}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </label>
    <nav aria-label="Wedding sections" className="mb-8 hidden border-b border-rule md:block">
      <ul className="flex flex-wrap gap-1">
        {items.map((it) => {
          const active = it.href === base ? path === base : path === it.href || path.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-11 items-center gap-1.5 whitespace-nowrap px-3 text-[14px] transition-colors", active ? "font-medium text-ink" : "text-muted hover:text-ink", it.locked && "opacity-55")}>
                {it.label}
                {it.locked && <Lock className="size-3 text-brass" aria-label="Not in this package" />}
                {!!it.badge && <span className="grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">{it.badge}</span>}
                {active && <span aria-hidden className="absolute inset-x-2 -bottom-px h-[2px] bg-accent" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}
