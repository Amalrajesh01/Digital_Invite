"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProductLockup } from "@/components/brand/Logo";
import { brand } from "@/lib/brand";
import { waLink, WA } from "@/lib/whatsapp";
import { WaIcon } from "./WaButton";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
  { href: "/categories", label: "Categories" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
] as const;

/**
 * The product site’s header: the lockup, six links, and two ways in — choose a template, or just talk to us on WhatsApp.
 * On a phone the links fold into a menu that traps nothing and closes on navigation.
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
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[76rem] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label={`${brand.name} — home`} className="shrink-0">
          <ProductLockup />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cn("rounded-md px-3 py-2 text-[14.5px] font-medium transition-colors hover:bg-paper-2", active(n.href) ? "text-accent" : "text-ink-2")}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <a href={waLink(WA.general)} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" className="btn btn-sm border-[#1fa855]/60 text-[#13783a] hover:bg-[#1fa855]/10">
            <WaIcon className="size-4" /> WhatsApp
          </a>
          <Link href="/templates" className="btn btn-accent btn-sm">Create My Invitation</Link>
        </div>
        <button type="button" className="grid size-11 place-items-center rounded-md border border-rule-strong lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto bg-white px-5 pb-10 pt-4 lg:hidden">
          <nav aria-label="Mobile" className="grid gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cn("rounded-md px-3 py-3.5 text-[18px] font-medium", active(n.href) ? "bg-accent-soft text-accent" : "text-ink")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 grid gap-3">
            <Link href="/templates" className="btn btn-accent btn-lg">Create My Invitation</Link>
            <a href={waLink(WA.general)} target="_blank" rel="noopener noreferrer" className="btn btn-lg bg-[#1fa855] text-white hover:bg-[#188f47]">
              <WaIcon /> Talk to us on WhatsApp
            </a>
            <Link href="/login" className="btn btn-quiet btn-lg">Sign in</Link>
          </div>
        </div>
      )}
    </header>
  );
}
