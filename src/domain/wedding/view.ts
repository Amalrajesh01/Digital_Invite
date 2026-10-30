import type { InvitationDoc, SectionConfig, WeddingEvent } from "@/domain/doc/schema";
import type { WeddingStatus } from "@/domain/doc/constants";
import { SECTION_META, makeSection, phasesFor } from "@/domain/doc/sections";
import { canUse, type Entitlements } from "@/domain/packages/entitlements";
import { applyGuards } from "@/domain/letters/values";
import type { Values } from "@/domain/letters/types";

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

/**
 * What the couple says to groups of guests and where guests come from is private to the guest it is meant for: the
 * browser of a guest only ever receives the entry for their own group and the travel tip for their own city.
 */
export function personalFor(personal: InvitationDoc["personal"], guest: { groupKey: string | null; city: string } | null): InvitationDoc["personal"] {
  if (!guest) return { ...personal, groups: [], travel: [] };
  const own = personal.groups.filter((g) => g.groupKey && g.groupKey === guest.groupKey);
  const everyoneElse = personal.groups.filter((g) => !g.groupKey);
  const city = guest.city.trim().toLowerCase();
  const tip = city ? personal.travel.find((t) => t.match.trim() && city.includes(t.match.trim().toLowerCase())) : undefined;
  return { ...personal, groups: (own.length ? own : everyoneElse).slice(0, 1), travel: tip ? [tip] : [] };
}

export function filterDocForGuest(doc: InvitationDoc, opts: { groupKey: string | null; enforceEventVisibility: boolean; guest?: { city: string } | null }): InvitationDoc {
  const events = visibleEventsFor(doc.events, opts.groupKey, opts.enforceEventVisibility);
  const visibleIds = new Set(events.map((e) => e.id));
  const referencedByAny = new Set(doc.events.map((e) => e.venueId).filter(Boolean) as string[]);
  const referencedByVisible = new Set(events.map((e) => e.venueId).filter(Boolean) as string[]);
  // A venue only used by hidden events would leak a private address, so drop it too.
  const venues = doc.venues.filter((v) => referencedByVisible.has(v.id) || !referencedByAny.has(v.id));
  void visibleIds;
  // A Forever Letter may hold a private value (a surprise's address) that only the sender can switch on for the recipient.
  const f = doc.love.forever;
  const love = Object.keys(f.guards).length ? { ...doc.love, forever: { ...f, v: applyGuards(f.v as Values, f.guards) } } : doc.love;
  const personal = personalFor(doc.personal, opts.guest ? { groupKey: opts.groupKey, city: opts.guest.city } : null);
  return { ...doc, events, venues, love, personal };
}

export interface SectionVisibilityInput {
  status: WeddingStatus;
  entitlements: Entitlements;
  hasGuest: boolean;
  groupKey: string | null;
  /** The couple has not switched the personal sections off (doc.personal.enabled). They are added after the hero unless the design already has them. */
  personalEnabled?: boolean;
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
  const shown = [...sections].filter((s) => sectionIsVisible(s, ctx)).sort((a, b) => a.order - b.order);
  // The personal sections are a package feature, not template content, so they are added to every design (and to invitations
  // published before they existed) right after the first section. sectionIsVisible has already applied the package and the guest rules.
  if (!ctx.personalEnabled || !ctx.hasGuest || !sections.length) return shown;
  const extra = (["foryou", "groupmessage"] as const)
    .filter((type) => !sections.some((s) => s.type === type))
    .map((type) => makeSection(type, { id: `auto-${type}` }))
    .filter((s) => sectionIsVisible(s, ctx));
  if (!extra.length) return shown;
  const at = Math.max(0, shown.findIndex((s) => s.type === "hero") + 1);
  return [...shown.slice(0, at), ...extra, ...shown.slice(at)];
}
