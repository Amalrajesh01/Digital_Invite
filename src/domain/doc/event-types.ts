/**
 * What an invitation is FOR — the one registry every occasion-specific behaviour hangs off.
 *
 * A wedding, a 30th birthday, a leadership conclave and a funeral are the same engine reading the same document, but
 * they must not feel the same. The occasion decides:
 *   • who the invitation is about (a couple, one person, an occasion, a person being remembered),
 *   • the mood (celebratory, professional, solemn) and so which effects may play and how fast things move,
 *   • what falls or flies when it opens (marigold petals, confetti — or nothing at all),
 *   • the words used for fixed labels ("Yes, with joy" vs "I will attend"), see `EVENT_VOICES`,
 *   • the public category it is shown under, and the call to action in the invitation's footer.
 *
 * Add an occasion here (and, if it needs new wording, a voice) — never branch on a wedding's name or religion
 * inside a section.
 */
export const EVENT_TYPES = [
  // weddings
  "hindu_wedding", "christian_wedding", "muslim_wedding", "wedding", "reception",
  // couples
  "engagement", "anniversary",
  // people & family
  "birthday", "kids_birthday", "baby_shower", "naming_ceremony", "housewarming", "graduation", "retirement", "reunion", "private_party",
  // faith & culture
  "religious_ceremony", "cultural_event", "festival",
  // business
  "corporate_event", "conclave", "conference", "product_launch",
  // remembrance
  "funeral", "memorial",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const DEFAULT_EVENT_TYPE: EventType = "hindu_wedding";

export type CelebrationKind = "petals" | "confetti";
/** "classic" = lehenga & sherwani, "kerala" = kasavu saree & mundu, "western" = gown & suit. */
export type FigureStyle = "classic" | "kerala" | "western";

/** Who the invitation is about — decides the hero, the opening envelope and the footer. */
export type SubjectKind = "couple" | "person" | "occasion" | "memorial";
/** The mood of the occasion. `solemn` removes celebration effects and slows every movement down. */
export type Tone = "celebratory" | "professional" | "solemn";
/** Which set of fixed interface wording applies (see `EVENT_VOICES` in the interface strings). */
export type Voice = "wedding" | "engagement" | "anniversary" | "birthday" | "celebration" | "ceremony" | "professional" | "memorial";

/** The categories the public site groups its templates by (`/templates/<slug>`). */
export const CATEGORY_SLUGS = [
  "wedding", "engagement", "birthday", "anniversary", "baby-shower", "naming-ceremony", "housewarming", "graduation", "retirement", "reunion", "private-party",
  "religious", "cultural", "festival", "corporate", "conclave", "conference", "product-launch", "funeral",
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface EventTypeInfo {
  label: string;
  category: CategorySlug;
  subject: SubjectKind;
  tone: Tone;
  voice: Voice;
  /** What falls or flies when the invitation first opens. "none" = nothing (corporate and memorial invitations). */
  celebration: CelebrationKind | "none";
  /** Whether the bride-and-groom journey makes sense (a birthday has no couple walking towards each other). */
  couple: boolean;
  /** Which figure style `journey.style = "auto"` resolves to. */
  figures: FigureStyle;
  /** Wording of the hero line under the names — see `invite.phrase.*` in the interface strings. */
  phrase: "wedding" | "engagement" | "reception" | "birthday" | "anniversary" | "generic";
  /** Confetti colours (ignored for petals / none). Gold-led and muted: premium, never party-shop primaries. */
  confetti: string[];
  /** The line in the invitation's footer that invites the guest to make their own — wording suits the occasion. */
  cta: string;
  /** What the pre-filled WhatsApp message to Stack Bridge Labs says. */
  enquiry: string;
}

const gold = ["#D9B65D", "#F1DFA6", "#FFFFFF", "#E8D8A8", "#C9CED6", "#B9606B"];

export const EVENT_TYPE_INFO: Record<EventType, EventTypeInfo> = {
  hindu_wedding: { label: "Hindu wedding", category: "wedding", subject: "couple", tone: "celebratory", voice: "wedding", celebration: "petals", couple: true, figures: "classic", phrase: "wedding", confetti: [], cta: "Plan My Wedding Invitation", enquiry: "a wedding invitation" },
  christian_wedding: { label: "Christian wedding", category: "wedding", subject: "couple", tone: "celebratory", voice: "wedding", celebration: "confetti", couple: true, figures: "western", phrase: "wedding", confetti: ["#FFFFFF", "#F4EFE6", "#D9B65D", "#E8D8A8", "#C9CED6", "#EBC9C4"], cta: "Plan My Wedding Invitation", enquiry: "a wedding invitation" },
  muslim_wedding: { label: "Muslim wedding (Nikah)", category: "wedding", subject: "couple", tone: "celebratory", voice: "wedding", celebration: "confetti", couple: true, figures: "classic", phrase: "wedding", confetti: ["#D9B65D", "#F4EFE6", "#2F7D62", "#9CC9B5", "#FFFFFF", "#E8D8A8"], cta: "Plan My Wedding Invitation", enquiry: "a wedding invitation" },
  wedding: { label: "Wedding", category: "wedding", subject: "couple", tone: "celebratory", voice: "wedding", celebration: "confetti", couple: true, figures: "western", phrase: "wedding", confetti: ["#FFFFFF", "#F4EFE6", "#D9B65D", "#E8D8A8", "#C9CED6", "#1C1A17"], cta: "Plan My Wedding Invitation", enquiry: "a wedding invitation" },
  reception: { label: "Reception", category: "wedding", subject: "couple", tone: "celebratory", voice: "wedding", celebration: "confetti", couple: true, figures: "western", phrase: "reception", confetti: ["#D9B65D", "#F1DFA6", "#FFFFFF", "#8A2432", "#E8D8A8", "#C9CED6"], cta: "Plan My Wedding Invitation", enquiry: "a wedding reception invitation" },
  engagement: { label: "Engagement", category: "engagement", subject: "couple", tone: "celebratory", voice: "engagement", celebration: "confetti", couple: true, figures: "classic", phrase: "engagement", confetti: ["#E9C3B6", "#D9B65D", "#F6E3D6", "#FFFFFF", "#C98E86", "#E8D8A8"], cta: "Create My Engagement Invite", enquiry: "an engagement invitation" },
  anniversary: { label: "Anniversary", category: "anniversary", subject: "couple", tone: "celebratory", voice: "anniversary", celebration: "confetti", couple: true, figures: "classic", phrase: "anniversary", confetti: ["#D9B65D", "#F1DFA6", "#B9606B", "#FFFFFF", "#E8D8A8", "#C9CED6"], cta: "Create My Anniversary Invite", enquiry: "an anniversary invitation" },

  birthday: { label: "Birthday", category: "birthday", subject: "person", tone: "celebratory", voice: "birthday", celebration: "confetti", couple: false, figures: "western", phrase: "birthday", confetti: ["#D9B65D", "#F0A9A0", "#9CC6D6", "#F4E3A8", "#FFFFFF", "#B9A5D6"], cta: "Create My Birthday Invite", enquiry: "a birthday invitation" },
  kids_birthday: { label: "Children’s birthday", category: "birthday", subject: "person", tone: "celebratory", voice: "birthday", celebration: "confetti", couple: false, figures: "western", phrase: "birthday", confetti: ["#F6B93B", "#EF6F6C", "#5CC8D7", "#8BD17C", "#FFD6E0", "#B39DDB", "#FFFFFF"], cta: "Create My Birthday Invite", enquiry: "a children’s birthday invitation" },
  baby_shower: { label: "Baby shower", category: "baby-shower", subject: "person", tone: "celebratory", voice: "celebration", celebration: "confetti", couple: false, figures: "western", phrase: "generic", confetti: ["#F4D6DD", "#CFE3F1", "#FFFFFF", "#E8D8A8", "#CDE6D0", "#F6E3D6"], cta: "Create My Baby Shower Invite", enquiry: "a baby shower invitation" },
  naming_ceremony: { label: "Naming ceremony", category: "naming-ceremony", subject: "person", tone: "celebratory", voice: "ceremony", celebration: "confetti", couple: false, figures: "classic", phrase: "generic", confetti: ["#E8D8A8", "#F1DFA6", "#FFFFFF", "#F4D6DD", "#CDE6D0", "#D9B65D"], cta: "Create My Naming Ceremony Invite", enquiry: "a naming ceremony invitation" },
  housewarming: { label: "Housewarming", category: "housewarming", subject: "occasion", tone: "celebratory", voice: "ceremony", celebration: "confetti", couple: false, figures: "classic", phrase: "generic", confetti: ["#D9B65D", "#F1DFA6", "#FFFFFF", "#B9606B", "#E8D8A8", "#CDE6D0"], cta: "Create My Housewarming Invite", enquiry: "a housewarming invitation" },
  graduation: { label: "Graduation", category: "graduation", subject: "person", tone: "celebratory", voice: "celebration", celebration: "confetti", couple: false, figures: "western", phrase: "generic", confetti: ["#D9B65D", "#F1DFA6", "#1F2A44", "#FFFFFF", "#C9CED6", "#8A2432"], cta: "Create My Graduation Invite", enquiry: "a graduation invitation" },
  retirement: { label: "Retirement", category: "retirement", subject: "person", tone: "celebratory", voice: "celebration", celebration: "confetti", couple: false, figures: "western", phrase: "generic", confetti: gold, cta: "Create My Retirement Invite", enquiry: "a retirement party invitation" },
  reunion: { label: "Reunion", category: "reunion", subject: "occasion", tone: "celebratory", voice: "celebration", celebration: "confetti", couple: false, figures: "western", phrase: "generic", confetti: gold, cta: "Create My Reunion Invite", enquiry: "a reunion invitation" },
  private_party: { label: "Private party", category: "private-party", subject: "occasion", tone: "celebratory", voice: "celebration", celebration: "confetti", couple: false, figures: "western", phrase: "generic", confetti: gold, cta: "Create My Party Invite", enquiry: "a party invitation" },

  religious_ceremony: { label: "Religious ceremony", category: "religious", subject: "occasion", tone: "celebratory", voice: "ceremony", celebration: "petals", couple: false, figures: "classic", phrase: "generic", confetti: [], cta: "Create My Ceremony Invite", enquiry: "a religious ceremony invitation" },
  cultural_event: { label: "Cultural event", category: "cultural", subject: "occasion", tone: "celebratory", voice: "ceremony", celebration: "confetti", couple: false, figures: "classic", phrase: "generic", confetti: ["#D9B65D", "#B9606B", "#2F7D62", "#F1DFA6", "#FFFFFF", "#E8D8A8"], cta: "Create My Event Invite", enquiry: "a cultural event invitation" },
  festival: { label: "Festival", category: "festival", subject: "occasion", tone: "celebratory", voice: "ceremony", celebration: "confetti", couple: false, figures: "classic", phrase: "generic", confetti: ["#F6A21E", "#EE7C12", "#D9B65D", "#B9606B", "#FFFFFF", "#F9C23C"], cta: "Create My Festival Invite", enquiry: "a festival invitation" },

  corporate_event: { label: "Corporate event", category: "corporate", subject: "occasion", tone: "professional", voice: "professional", celebration: "none", couple: false, figures: "western", phrase: "generic", confetti: [], cta: "Create Event Invitation", enquiry: "a corporate event invitation" },
  conclave: { label: "Conclave", category: "conclave", subject: "occasion", tone: "professional", voice: "professional", celebration: "none", couple: false, figures: "western", phrase: "generic", confetti: [], cta: "Create Event Invitation", enquiry: "a conclave invitation" },
  conference: { label: "Conference / summit", category: "conference", subject: "occasion", tone: "professional", voice: "professional", celebration: "none", couple: false, figures: "western", phrase: "generic", confetti: [], cta: "Create Event Invitation", enquiry: "a conference invitation" },
  product_launch: { label: "Product launch", category: "product-launch", subject: "occasion", tone: "professional", voice: "professional", celebration: "none", couple: false, figures: "western", phrase: "generic", confetti: [], cta: "Create Event Invitation", enquiry: "a product launch invitation" },

  funeral: { label: "Funeral service", category: "funeral", subject: "memorial", tone: "solemn", voice: "memorial", celebration: "none", couple: false, figures: "western", phrase: "generic", confetti: [], cta: "Talk to Our Team", enquiry: "a memorial invitation" },
  memorial: { label: "Memorial / prayer meeting", category: "funeral", subject: "memorial", tone: "solemn", voice: "memorial", celebration: "none", couple: false, figures: "western", phrase: "generic", confetti: [], cta: "Talk to Our Team", enquiry: "a memorial invitation" },
};

export function isEventType(v: unknown): v is EventType {
  return typeof v === "string" && (EVENT_TYPES as readonly string[]).includes(v);
}

/** Who the invitation is about. Everything that reads "the couple" must first ask whether there is one. */
export function subjectKind(doc: { eventType: EventType }): SubjectKind {
  return EVENT_TYPE_INFO[doc.eventType].subject;
}

export function isCoupleEvent(doc: { eventType: EventType }): boolean {
  return subjectKind(doc) === "couple";
}

export function toneOf(doc: { eventType: EventType }): Tone {
  return EVENT_TYPE_INFO[doc.eventType].tone;
}

/** What plays when the invitation opens: an explicit choice wins, otherwise the occasion decides. null = nothing. */
export function celebrationFor(doc: { eventType: EventType; opening: { celebration: "auto" | "petals" | "confetti" | "off" } }): CelebrationKind | null {
  const info = EVENT_TYPE_INFO[doc.eventType];
  const c = doc.opening.celebration;
  if (c === "off") return null;
  // A solemn occasion never plays an effect, whatever a template or an old setting says.
  if (info.tone === "solemn") return null;
  if (c === "petals" || c === "confetti") return c;
  return info.celebration === "none" ? null : info.celebration;
}

/** Outfit style of the two walking figures. */
export function figureStyleFor(doc: { eventType: EventType; journey: { style: "auto" | FigureStyle } }): FigureStyle {
  return doc.journey.style === "auto" ? EVENT_TYPE_INFO[doc.eventType].figures : doc.journey.style;
}

/** Whether the walking couple is shown at all. */
export function journeyEnabled(doc: { eventType: EventType; journey: { enabled: boolean } }): boolean {
  return doc.journey.enabled && EVENT_TYPE_INFO[doc.eventType].couple;
}

/** The event types that belong to a public category. */
export function eventTypesIn(category: CategorySlug): EventType[] {
  return EVENT_TYPES.filter((t) => EVENT_TYPE_INFO[t].category === category);
}
