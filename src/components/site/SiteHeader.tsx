"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProductLockup } from "@/components/brand/Logo";
import { brand } from "@/lib/brand";
import { waLink, WA } from "@/lib/whatsapp";
import { WaIcon } from "./WaButton";

const NAV = [
  { href: "/templates", label: "Choose Your Design" },
  { href: "/for-my-love", label: "For My Love", love: true },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "Help" },
] as const;

/**
 * The product site’s header: the lockup, five plain links, and two ways in — choose a design, or just talk to us on
 * WhatsApp. On a phone the links fold into a menu that closes on navigation.
 */
export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);
  const active = (href: string) => path === href || path.startsWith(`${href}/`);
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[76rem] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label={`${brand.name} — home`} className="shrink-0">
          <ProductLockup />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14.5px] font-medium transition-colors hover:bg-paper-2", active(n.href) ? "text-accent" : "text-ink-2", "love" in n && n.love && "text-rose")}>
              {"love" in n && n.love && <Heart className="size-3.5 fill-current" aria-hidden />}
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <a href={waLink(WA.general)} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" data-ref="header" aria-label="Chat with us on WhatsApp" className="btn btn-sm border-[#1fa855]/60 text-[#13783a] hover:bg-[#1fa855]/10">
            <WaIcon className="size-4" /> WhatsApp
          </a>
          <Link href="/templates" data-track="cta_click" data-ref="header-create" className="btn btn-accent btn-sm">Create Your Invitation</Link>
        </div>
        <button type="button" className="grid size-11 place-items-center rounded-full border border-rule-strong lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto bg-white px-5 pb-10 pt-4 lg:hidden">
          <nav aria-label="Mobile" className="grid gap-1">
            {[{ href: "/", label: "Home" }, ...NAV].map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) || (n.href === "/" && path === "/") ? "page" : undefined} className={cn("flex items-center gap-2 rounded-xl px-3 py-3.5 text-[19px] font-medium", (n.href === "/" ? path === "/" : active(n.href)) ? "bg-accent-soft text-accent" : "text-ink", "love" in n && "love" in n && (n as { love?: boolean }).love && "text-rose")}>
                {"love" in n && (n as { love?: boolean }).love && <Heart className="size-4 fill-current" aria-hidden />}
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 grid gap-3">
            <Link href="/templates" className="btn btn-accent btn-lg" data-track="cta_click" data-ref="menu-create">Create Your Invitation</Link>
            <a href={waLink(WA.general)} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" data-ref="menu" className="btn btn-lg bg-[#1fa855] text-white hover:bg-[#188f47]">
              <WaIcon /> Chat with us on WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
