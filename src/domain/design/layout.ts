import { SECTION_TYPES } from "@/domain/doc/constants";
import { SECTION_META } from "@/domain/doc/sections";

/** Helpers for describing a template's sections: which, in what order, and in which variant. */
export type SectionType = (typeof SECTION_TYPES)[number];
export interface TemplateSection { type: SectionType; variant?: string; enabled: boolean; settings: Record<string, unknown> }

type Over = Partial<Record<SectionType, { variant?: string; enabled?: boolean; settings?: Record<string, unknown> }>>;

/**
 * Canonical top-to-bottom order shared by the original wedding templates — the story the guest scrolls through:
 * the photograph, who they are, how it began, the countdown, the days, the rituals, the families,
 * the place, the memories, the film, and finally the reply. Lifecycle rules decide what shows when.
 */
const ORDER: SectionType[] = [
  "hero", "story", "timeline", "countdown", "couple", "events", "ceremonies", "family", "livesched", "liveupdate", "livestream", "dresscode", "menu",
  "venue", "travel", "gallery", "film", "music", "quiz", "games", "scavenger", "rsvp", "qrpass", "checkin", "photowall", "guestupload",
  "guestbook", "wishes", "timecapsule", "memory", "anniversary", "thankyou", "contact",
];

/** Every section in the canonical order, with the given variants. */
export function sections(over: Over): TemplateSection[] {
  return ORDER.map((type) => {
    const o = over[type] ?? {};
    return { type, variant: o.variant ?? SECTION_META[type].variants[0]?.key, enabled: o.enabled ?? true, settings: o.settings ?? {} };
  });
}

export type Item = SectionType | [SectionType, { variant?: string; enabled?: boolean; settings?: Record<string, unknown> }];

/** An explicit, ordered section list — for templates whose story differs from the wedding order above. */
export function layout(items: Item[]): TemplateSection[] {
  return items.map((it) => {
    const [type, o] = Array.isArray(it) ? it : [it, {}];
    return { type, variant: o.variant ?? SECTION_META[type].variants[0]?.key, enabled: o.enabled ?? true, settings: o.settings ?? {} };
  });
}

/** The live-event and after-the-event sections every template carries; each one only appears in its own phase and package. */
export const TAIL: Item[] = ["livesched", "liveupdate", "livestream", "qrpass", "checkin", "photowall", "guestupload", "wishes", "timecapsule", "memory", "anniversary", "thankyou"];

/** The day-of trio. Each appears only on the day (and only in the packages that include it), so its place in the list costs nothing before then. */
export const LIVE: Item[] = ["livesched", "liveupdate", "livestream"];
/** Everything that belongs after the invitation proper: passes, photo sharing, wishes, the memory book and the thank-you. */
export const AFTER: Item[] = ["qrpass", "checkin", "photowall", "guestupload", "wishes", "timecapsule", "memory", "anniversary", "thankyou"];
