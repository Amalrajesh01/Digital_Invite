"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TabItem { href: string; label: string; locked?: boolean; badge?: number }

/** Horizontal, scrollable section tabs for one wedding (Super Admin). Locked = not in the package. */
export function WorkspaceTabs({ items, base }: { items: TabItem[]; base: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Wedding sections" className="-mx-4 mb-8 overflow-x-auto border-b border-rule px-4 lg:-mx-8 lg:px-8">
      <ul className="flex min-w-max gap-1">
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
  );
}
