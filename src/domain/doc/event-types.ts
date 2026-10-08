/**
 * What kind of celebration an invitation is for. It decides the opening celebration (falling petals for a
 * Hindu wedding, side-cannon confetti for the rest), the wording of the hero line and the style of the
 * two small illustrated figures that walk together as the guest scrolls.
 */
export const EVENT_TYPES = ["hindu_wedding", "christian_wedding", "muslim_wedding", "engagement", "reception", "birthday", "anniversary"] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const DEFAULT_EVENT_TYPE: EventType = "hindu_wedding";

export type CelebrationKind = "petals" | "confetti";
/** "classic" = lehenga & sherwani, "kerala" = kasavu saree & mundu, "western" = gown & suit. */
export type FigureStyle = "classic" | "kerala" | "western";

export interface EventTypeInfo {
  label: string;
  /** What falls or flies when the invitation first opens. */
  celebration: CelebrationKind;
  /** Whether the bride-and-groom journey makes sense (a birthday has no couple walking towards each other). */
  couple: boolean;
  /** Which figure style `journey.style = "auto"` resolves to. */
  figures: FigureStyle;
  /** Wording of the hero line under the names — see `invite.phrase.*` in the interface strings. */
  phrase: "wedding" | "engagement" | "reception" | "birthday" | "anniversary";
  /** Confetti colours (ignored for petals). Gold-led and muted: premium, never party-shop primaries. */
  confetti: string[];
}

export const EVENT_TYPE_INFO: Record<EventType, EventTypeInfo> = {
  hindu_wedding: { label: "Hindu wedding", celebration: "petals", couple: true, figures: "classic", phrase: "wedding", confetti: [] },
  christian_wedding: { label: "Christian wedding", celebration: "confetti", couple: true, figures: "western", phrase: "wedding", confetti: ["#FFFFFF", "#F4EFE6", "#D9B65D", "#E8D8A8", "#C9CED6", "#EBC9C4"] },
  muslim_wedding: { label: "Muslim wedding (Nikah)", celebration: "confetti", couple: true, figures: "classic", phrase: "wedding", confetti: ["#D9B65D", "#F4EFE6", "#2F7D62", "#9CC9B5", "#FFFFFF", "#E8D8A8"] },
  engagement: { label: "Engagement", celebration: "confetti", couple: true, figures: "classic", phrase: "engagement", confetti: ["#E9C3B6", "#D9B65D", "#F6E3D6", "#FFFFFF", "#C98E86", "#E8D8A8"] },
  reception: { label: "Reception", celebration: "confetti", couple: true, figures: "western", phrase: "reception", confetti: ["#D9B65D", "#F1DFA6", "#FFFFFF", "#8A2432", "#E8D8A8", "#C9CED6"] },
  birthday: { label: "Birthday", celebration: "confetti", couple: false, figures: "western", phrase: "birthday", confetti: ["#D9B65D", "#F0A9A0", "#9CC6D6", "#F4E3A8", "#FFFFFF", "#B9A5D6"] },
  anniversary: { label: "Anniversary", celebration: "confetti", couple: true, figures: "classic", phrase: "anniversary", confetti: ["#D9B65D", "#F1DFA6", "#B9606B", "#FFFFFF", "#E8D8A8", "#C9CED6"] },
};

export function isEventType(v: unknown): v is EventType {
  return typeof v === "string" && (EVENT_TYPES as readonly string[]).includes(v);
}

/** What plays when the invitation opens: an explicit choice wins, otherwise the occasion decides. null = nothing. */
export function celebrationFor(doc: { eventType: EventType; opening: { celebration: "auto" | "petals" | "confetti" | "off" } }): CelebrationKind | null {
  const c = doc.opening.celebration;
  if (c === "off") return null;
  if (c === "petals" || c === "confetti") return c;
  return EVENT_TYPE_INFO[doc.eventType].celebration;
}

/** Outfit style of the two walking figures. */
export function figureStyleFor(doc: { eventType: EventType; journey: { style: "auto" | FigureStyle } }): FigureStyle {
  return doc.journey.style === "auto" ? EVENT_TYPE_INFO[doc.eventType].figures : doc.journey.style;
}

/** Whether the walking couple is shown at all. */
export function journeyEnabled(doc: { eventType: EventType; journey: { enabled: boolean } }): boolean {
  return doc.journey.enabled && EVENT_TYPE_INFO[doc.eventType].couple;
}
