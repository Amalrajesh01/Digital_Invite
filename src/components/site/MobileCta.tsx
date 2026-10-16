"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { waLink, WA } from "@/lib/whatsapp";
import { WaIcon } from "./WaButton";

/** On a phone: the two things a visitor may want at any moment, one thumb away. Hidden where a page has its own bottom bar. */
export function MobileCta() {
  const path = usePathname();
  if (path.startsWith("/start") || path.startsWith("/for-my-love/make") || path.startsWith("/for-my-love/gift")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-rule bg-white/95 px-4 py-2.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <Link href="/templates" data-track="cta_click" data-ref="sticky-create" className="btn btn-accent btn-lg flex-1 !min-h-12">Create Your Invitation</Link>
      <a href={waLink(WA.general)} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" data-ref="sticky" aria-label="Chat with us on WhatsApp" className="btn grid !min-h-12 w-12 place-items-center !p-0 bg-[#1fa855] text-white hover:bg-[#188f47]"><WaIcon className="size-6" /></a>
    </div>
  );
}
