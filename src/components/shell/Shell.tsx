"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3, Bell, BookHeart, Boxes, Camera, ClipboardList, Clock, Command, Crown, FileClock, Gamepad2, Globe, Hotel, Image as ImageIcon, LayoutDashboard, Layers, LogOut,
  MessageSquareHeart, Menu, Mic, Palette as PaletteIcon, PartyPopper, Package, QrCode, Radio, ScrollText, Search, Send, Settings, Share2, Sparkles, Users, UserRound, Video, Wallet, X, CalendarDays, Bus, Hourglass, Heart, LineChart, BadgeIndianRupee,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { brand } from "@/lib/brand";
import { logoutAction } from "@/app/actions/auth";
import { ConfirmProvider } from "@/components/ui/Confirm";

const ICONS = {
  dashboard: LayoutDashboard, weddings: Heart, clients: UserRound, orders: BadgeIndianRupee, packages: Package, templates: Layers, themes: PaletteIcon, media: ImageIcon, guests: Users, analytics: BarChart3,
  domains: Globe, notifications: Bell, audit: ScrollText, settings: Settings, invitation: Sparkles, rsvp: ClipboardList, events: CalendarDays, gallery: Camera, wishes: MessageSquareHeart, guestbook: BookHeart,
  photowall: PartyPopper, video: Video, voice: Mic, stay: Hotel, transport: Bus, share: Share2, checkin: QrCode, live: Radio, games: Gamepad2, capsule: Hourglass, memory: FileClock, anniversary: Clock,
  overview: LayoutDashboard, send: Send, crown: Crown, wallet: Wallet, chart: LineChart, boxes: Boxes,
} as const;
export type IconName = keyof typeof ICONS;

export interface NavItem { href: string; label: string; icon: IconName; badge?: number; exact?: boolean; locked?: boolean }
export interface NavGroup { label?: string; items: NavItem[] }
export interface PaletteEntry { label: string; href: string; hint?: string; group: string }

export interface ShellProps {
  homeHref: string;
  groups: NavGroup[];
  user: { name: string; email: string; role: string };
  palette: PaletteEntry[];
  bell?: { href: string; count: number };
  /** Shown under the wordmark, e.g. the couple's names for a client. */
  context?: { title: string; sub?: string; href?: string };
  children: React.ReactNode;
  wide?: boolean;
}

function NavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-6">
      {groups.map((g, gi) => (
        <div key={gi} className={cn(gi > 0 && "mt-6")}>
          {g.label && <p className="eyebrow px-3 pb-2">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
              const Icon = ICONS[it.icon];
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn("group relative flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-[14.5px] transition-colors", active ? "bg-surface font-medium text-ink shadow-[var(--shadow-1)]" : "text-ink-2 hover:bg-paper-2", it.locked && "opacity-60")}
                  >
                    {active && <span aria-hidden className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r bg-brass" />}
                    <Icon className={cn("size-[17px] shrink-0", active ? "text-accent" : "text-muted group-hover:text-ink-2")} aria-hidden />
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.locked && <Crown className="size-3.5 text-brass" aria-label="Upgrade" />}
                    {!!it.badge && <span className="chip chip-accent !px-1.5 !py-0 !text-[11px] before:hidden">{it.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Palette({ open, onClose, entries }: { open: boolean; onClose: () => void; entries: PaletteEntry[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const f = s ? entries.filter((e) => `${e.label} ${e.hint ?? ""} ${e.group}`.toLowerCase().includes(s)) : entries;
    return f.slice(0, 40);
  }, [q, entries]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setQ("");
      setIdx(0);
    }
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => setIdx(0), [q]);
  const go = (e?: PaletteEntry) => {
    if (!e) return;
    onClose();
    router.push(e.href);
  };
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-label="Search and jump" className="sheet !mt-[12vh] !max-w-xl">
      <div className="flex items-center gap-3 border-b border-rule px-4">
        <Search className="size-4 text-muted" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") (e.preventDefault(), setIdx((i) => Math.min(i + 1, list.length - 1)));
            if (e.key === "ArrowUp") (e.preventDefault(), setIdx((i) => Math.max(i - 1, 0)));
            if (e.key === "Enter") (e.preventDefault(), go(list[idx]));
          }}
          placeholder="Search weddings, pages, actions…"
          aria-label="Search"
          className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
        <kbd className="rounded border border-rule-strong px-1.5 py-0.5 text-[11px] text-muted">Esc</kbd>
      </div>
      <ul role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
        {list.length === 0 && <li className="px-3 py-8 text-center text-muted">Nothing found.</li>}
        {list.map((e, i) => (
          <li key={e.href + e.label} role="option" aria-selected={i === idx}>
            <button type="button" onMouseEnter={() => setIdx(i)} onClick={() => go(e)} className={cn("flex w-full items-center justify-between gap-4 rounded-md px-3 py-2.5 text-left", i === idx && "bg-paper-2")}>
              <span className="min-w-0"><span className="block truncate text-[15px]">{e.label}</span>{e.hint && <span className="block truncate text-[12.5px] text-muted">{e.hint}</span>}</span>
              <span className="eyebrow shrink-0">{e.group}</span>
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}

export function Shell({ homeHref, groups, user, palette, bell, context, children, wide }: ShellProps) {
  const [menu, setMenu] = useState(false);
  const [cmd, setCmd] = useState(false);
  const path = usePathname();
  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((v) => !v);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const Brand = (
    <div className="px-5 pb-5 pt-6">
      <Link href={homeHref} className="display block text-[28px] leading-none">{brand.short}<span className="ml-1.5 text-[15px] text-muted not-italic" style={{ fontFamily: "var(--font-ui)" }}>Invites</span></Link>
      {context && (
        <Link href={context.href ?? homeHref} className="mt-5 block rounded-md border border-rule bg-surface px-3 py-2.5 transition-colors hover:border-rule-strong">
          <span className="eyebrow block !text-[10px]">Wedding</span>
          <span className="display mt-0.5 block truncate text-[19px]">{context.title}</span>
          {context.sub && <span className="block truncate text-[12.5px] text-muted">{context.sub}</span>}
        </Link>
      )}
    </div>
  );

  const User = (
    <div className="border-t border-rule px-3 py-3">
      <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-paper">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-medium">{user.name || user.email}</p><p className="truncate text-[12px] text-muted">{user.role}</p></div>
        <form action={logoutAction}><button className="btn btn-ghost btn-sm !px-2" aria-label="Sign out" title="Sign out"><LogOut className="size-4" /></button></form>
      </div>
    </div>
  );

  return (
    <ConfirmProvider>
      <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
        <aside className="no-print sticky top-0 hidden h-dvh flex-col border-r border-rule bg-paper-2/60 lg:flex">
          {Brand}
          <NavList groups={groups} />
          {User}
        </aside>

        <div className="min-w-0">
          <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-rule bg-paper/92 px-4 backdrop-blur-[2px] lg:px-8">
            <button type="button" className="btn btn-ghost btn-sm !px-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu className="size-5" /></button>
            <Link href={homeHref} className="display text-[22px] leading-none lg:hidden">{brand.short}</Link>
            <button type="button" onClick={() => setCmd(true)} className="ml-auto flex h-9 min-w-9 items-center gap-2.5 rounded-md border border-rule-strong bg-surface px-3 text-[13.5px] text-muted transition-colors hover:border-ink-2 sm:ml-0 sm:mr-auto sm:w-72">
              <Search className="size-4" aria-hidden /><span className="hidden flex-1 text-left sm:block">Search or jump to…</span><span className="hidden items-center gap-0.5 sm:flex"><Command className="size-3" /><kbd className="text-[11px] font-medium">K</kbd></span>
            </button>
            {bell && (
              <Link href={bell.href} className="btn btn-ghost btn-sm relative !px-2" aria-label={`Notifications${bell.count ? `, ${bell.count} new` : ""}`}>
                <Bell className="size-[18px]" />
                {bell.count > 0 && <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">{bell.count > 9 ? "9+" : bell.count}</span>}
              </Link>
            )}
          </header>
          <main id="content" className={cn("mx-auto w-full px-4 py-8 lg:px-8 lg:py-10", wide ? "max-w-[92rem]" : "max-w-[78rem]")}>{children}</main>
        </div>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Close menu" className="absolute inset-0 bg-ink/45" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[86vw] flex-col bg-paper shadow-[var(--shadow-2)] [animation:drawer-in_.3s_var(--ease)]">
            <button className="btn btn-ghost btn-sm absolute right-2 top-2 !px-2" onClick={() => setMenu(false)} aria-label="Close menu"><X className="size-5" /></button>
            {Brand}
            <NavList groups={groups} onNavigate={() => setMenu(false)} />
            {User}
          </div>
        </div>
      )}
      <Palette open={cmd} onClose={() => setCmd(false)} entries={palette} />
    </ConfirmProvider>
  );
}
