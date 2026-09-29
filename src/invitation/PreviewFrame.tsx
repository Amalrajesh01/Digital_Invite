"use client";
import { useEffect, useMemo, useState } from "react";
import type { InvitationView } from "@/domain/wedding/public";
import type { InvitationDoc } from "@/domain/doc/schema";
import type { ThemeTokens } from "@/domain/design/tokens";
import type { ResolvedMedia } from "@/domain/media/service";
import { canUse } from "@/domain/packages/entitlements";
import { filterDocForGuest, visibleSections } from "@/domain/wedding/view";
import { InvitationApp } from "./InvitationApp";

export interface PreviewPatch {
  type: "aoire:patch";
  doc?: InvitationDoc;
  tokens?: ThemeTokens;
  flavor?: string;
  media?: Record<string, ResolvedMedia>;
  status?: InvitationView["wedding"]["status"];
  title?: string;
  secondaryLocale?: string | null;
}

/**
 * The invitation inside the editor's device frame. The editor posts every edit (document, theme,
 * new photos) and this component re-renders the *real* invitation immediately — what you see is
 * exactly what guests will get. Clicking any section tells the editor to select it.
 */
export function PreviewFrame({ view: initial, initialLocale, interactive }: { view: InvitationView; initialLocale: string; interactive?: boolean }) {
  const [patch, setPatch] = useState<PreviewPatch | null>(null);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !e.data) return;
      if (e.data.type === "aoire:patch") setPatch(e.data as PreviewPatch);
      if (e.data.type === "aoire:focus") {
        const el = document.querySelector<HTMLElement>(`[data-section-id="${CSS.escape(String(e.data.sectionId))}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          el.classList.add("pv-flash");
          setTimeout(() => el.classList.remove("pv-flash"), 1600);
        }
      }
    };
    window.addEventListener("message", on);
    window.parent?.postMessage({ type: "aoire:ready" }, window.location.origin);
    return () => window.removeEventListener("message", on);
  }, []);

  useEffect(() => {
    if (!interactive) return;
    const click = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-section-id]");
      if (el && window.parent !== window) window.parent.postMessage({ type: "aoire:select", sectionId: el.dataset.sectionId }, window.location.origin);
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [interactive]);

  const view = useMemo<InvitationView>(() => {
    if (!patch) return initial;
    const ent = initial.entitlements;
    const raw = patch.doc ?? initial.doc;
    const groupKey = initial.guest?.groupKey ?? null;
    const doc = filterDocForGuest(raw, { groupKey, enforceEventVisibility: canUse(ent, "event_visibility") });
    const status = patch.status ?? initial.wedding.status;
    return {
      ...initial,
      doc,
      tokens: patch.tokens ?? initial.tokens,
      flavor: patch.flavor ?? initial.flavor,
      media: { ...initial.media, ...(patch.media ?? {}) },
      sections: visibleSections(doc.sections, { status, entitlements: ent, hasGuest: !!initial.guest, groupKey }),
      wedding: { ...initial.wedding, status, title: patch.title ?? initial.wedding.title, secondaryLocale: patch.secondaryLocale === undefined ? initial.wedding.secondaryLocale : patch.secondaryLocale },
    };
  }, [patch, initial]);

  return (
    <>
      {interactive && <style>{`[data-section-id]{position:relative;cursor:pointer} [data-section-id]:hover::after{content:"";position:absolute;inset:0;border:2px solid #7a2432;pointer-events:none;z-index:50;opacity:.55} .pv-flash::after{content:"";position:absolute;inset:0;border:3px solid #a07b2a;pointer-events:none;z-index:50;animation:pvf 1.4s ease-out forwards} @keyframes pvf{from{opacity:1}to{opacity:0}}`}</style>}
      <InvitationApp view={view} initialLocale={initialLocale} skipGate />
    </>
  );
}
