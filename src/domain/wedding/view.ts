import type { InvitationDoc, SectionConfig, WeddingEvent } from "@/domain/doc/schema";
import type { WeddingStatus } from "@/domain/doc/constants";
import { SECTION_META, phasesFor } from "@/domain/doc/sections";
import { canUse, type Entitlements } from "@/domain/packages/entitlements";

/**
 * Pure functions that turn a stored document into what ONE viewer may see.
 * They run on the server before anything is serialised to the browser, so hidden events,
 * venues and sections never reach a guest who should not see them.
 */

export function sortEvents(events: WeddingEvent[]): WeddingEvent[] {
  return [...events].sort((a, b) => {
    const da = `${a.date || "9999-99-99"} ${a.startTime || "00:00"}`;
    const db = `${b.date || "9999-99-99"} ${b.startTime || "00:00"}`;
    return da === db ? a.order - b.order : da < db ? -1 : 1;
  });
}

/** Event-level visibility: "everyone" or restricted to guest groups (needs a personalised link). */
export function visibleEventsFor(events: WeddingEvent[], groupKey: string | null, enforce: boolean): WeddingEvent[] {
  const list = events.filter((e) => {
    if (!enforce || e.visibility.mode === "EVERYONE") return true;
    return groupKey != null && e.visibility.groups.includes(groupKey);
  });
  return sortEvents(list);
}

export function filterDocForGuest(doc: InvitationDoc, opts: { groupKey: string | null; enforceEventVisibility: boolean }): InvitationDoc {
  const events = visibleEventsFor(doc.events, opts.groupKey, opts.enforceEventVisibility);
  const visibleIds = new Set(events.map((e) => e.id));
  const referencedByAny = new Set(doc.events.map((e) => e.venueId).filter(Boolean) as string[]);
  const referencedByVisible = new Set(events.map((e) => e.venueId).filter(Boolean) as string[]);
  // A venue only used by hidden events would leak a private address, so drop it too.
  const venues = doc.venues.filter((v) => referencedByVisible.has(v.id) || !referencedByAny.has(v.id));
  void visibleIds;
  return { ...doc, events, venues };
}

export interface SectionVisibilityInput {
  status: WeddingStatus;
  entitlements: Entitlements;
  hasGuest: boolean;
  groupKey: string | null;
}

export function sectionIsVisible(s: SectionConfig, ctx: SectionVisibilityInput): boolean {
  if (!s.enabled) return false;
  const meta = SECTION_META[s.type];
  if (meta.feature && !canUse(ctx.entitlements, meta.feature)) return false;
  if (!phasesFor(s).includes(ctx.status)) return false;
  if ((s.visibility.guestsOnly || meta.needsGuest) && !ctx.hasGuest && ctx.status !== "DRAFT" && ctx.status !== "PREVIEW") return false;
  if (s.visibility.groups.length) {
    if (!ctx.hasGuest || !ctx.groupKey || !s.visibility.groups.includes(ctx.groupKey)) return false;
  }
  return true;
}

export function visibleSections(sections: SectionConfig[], ctx: SectionVisibilityInput): SectionConfig[] {
  return [...sections].filter((s) => sectionIsVisible(s, ctx)).sort((a, b) => a.order - b.order);
}
