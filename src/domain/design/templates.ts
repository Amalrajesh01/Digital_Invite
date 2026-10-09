import { z } from "zod";
import { SECTION_TYPES } from "@/domain/doc/constants";
import { SECTION_META, makeSection } from "@/domain/doc/sections";
import type { SectionConfig } from "@/domain/doc/schema";
import { canUse, type Entitlements } from "@/domain/packages/entitlements";
import { EVENT_TYPES } from "@/domain/doc/event-types";

/**
 * A template controls STRUCTURE and LAYOUT only: default sections, order, variants, the opening
 * and the visual "flavour" (decorative language). It never contains customer data.
 */
export const TEMPLATE_FLAVORS = ["royal", "cinematic", "editorial", "minimal"] as const;
export type TemplateFlavor = (typeof TEMPLATE_FLAVORS)[number];

export const TemplateConfig = z.object({
  flavor: z.enum(TEMPLATE_FLAVORS),
  opening: z.enum(["none", "envelope", "seal", "cinematic", "swipe", "curtain"]),
  /** Suggested theme slug for the wizard's default pick. */
  suggestedTheme: z.string().optional(),
  /** The occasion a wedding made from this template starts as (drives the opening, the walking couple and the starter ceremonies). */
  eventType: z.enum(EVENT_TYPES).optional(),
  /** Slug of the demonstration wedding whose content the template preview is shown with. */
  demo: z.string().optional(),
  sections: z.array(
    z.object({
      type: z.enum(SECTION_TYPES),
      variant: z.string().optional(),
      enabled: z.boolean().default(true),
      settings: z.record(z.string(), z.unknown()).default({}),
    }),
  ),
});
export type TemplateConfig = z.infer<typeof TemplateConfig>;

export interface TemplateSeed {
  slug: string;
  name: string;
  description: string;
  config: TemplateConfig;
}

type Over = Partial<Record<(typeof SECTION_TYPES)[number], { variant?: string; enabled?: boolean; settings?: Record<string, unknown> }>>;

/**
 * Canonical top-to-bottom order shared by all templates — the story the guest scrolls through:
 * the photograph, who they are, how it began, the countdown, the days, the rituals, the families,
 * the place, the memories, the film, and finally the reply. Lifecycle rules decide what shows when.
 */
const ORDER: (typeof SECTION_TYPES)[number][] = [
  "hero", "story", "timeline", "countdown", "couple", "events", "ceremonies", "family", "livesched", "liveupdate", "livestream", "dresscode", "menu",
  "venue", "travel", "gallery", "film", "music", "quiz", "games", "scavenger", "rsvp", "qrpass", "checkin", "photowall", "guestupload",
  "guestbook", "wishes", "timecapsule", "memory", "anniversary", "thankyou", "contact",
];

function sections(over: Over): TemplateConfig["sections"] {
  return ORDER.map((type) => {
    const o = over[type] ?? {};
    return {
      type,
      variant: o.variant ?? SECTION_META[type].variants[0]?.key,
      enabled: o.enabled ?? true,
      settings: o.settings ?? {},
    };
  });
}

type Item = (typeof SECTION_TYPES)[number] | [(typeof SECTION_TYPES)[number], { variant?: string; enabled?: boolean; settings?: Record<string, unknown> }];

/** An explicit, ordered section list — for templates whose story differs from the wedding order above. */
function layout(items: Item[]): TemplateConfig["sections"] {
  return items.map((it) => {
    const [type, o] = Array.isArray(it) ? it : [it, {}];
    return { type, variant: o.variant ?? SECTION_META[type].variants[0]?.key, enabled: o.enabled ?? true, settings: o.settings ?? {} };
  });
}

/** The live-event and after-the-event sections every template carries; each one only appears in its own phase and package. */
const TAIL: Item[] = ["livesched", "liveupdate", "livestream", "qrpass", "checkin", "photowall", "guestupload", "wishes", "timecapsule", "memory", "anniversary", "thankyou"];

export const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    slug: "royal-heritage",
    name: "Royal Heritage",
    description: "A ceremonial envelope opens onto a full-screen photograph, falling petals and a story told in editorial chapters. Rooted in traditional Indian stationery.",
    config: {
      flavor: "royal",
      opening: "envelope",
      suggestedTheme: "royal-gold",
      sections: sections({
        hero: { variant: "fullbleed" },
        countdown: { variant: "classic" },
        couple: { variant: "arch" },
        story: { variant: "chapters" },
        timeline: { variant: "vertical" },
        family: { variant: "editorial" },
        events: { variant: "editorial" },
        ceremonies: { variant: "editorial" },
        gallery: { variant: "editorial" },
        rsvp: { variant: "classic" },
        guestbook: { variant: "wall" },
      }),
    },
  },
  {
    slug: "cinematic-noir",
    name: "Cinematic",
    description: "A title-sequence opening, full-bleed photography and large overlaid type. Made for couples with strong photography or a wedding film.",
    config: {
      flavor: "cinematic",
      opening: "cinematic",
      suggestedTheme: "midnight-sapphire",
      sections: sections({
        hero: { variant: "fullbleed" },
        countdown: { variant: "classic" },
        couple: { variant: "editorial" },
        story: { variant: "chapters" },
        timeline: { variant: "vertical" },
        family: { variant: "editorial" },
        events: { variant: "editorial" },
        ceremonies: { variant: "editorial" },
        gallery: { variant: "editorial" },
        rsvp: { variant: "card" },
        guestbook: { variant: "wall" },
      }),
    },
  },
  {
    slug: "editorial",
    name: "Editorial",
    description: "Magazine-inspired composition: asymmetric grids, oversized serif headlines and generous whitespace.",
    config: {
      flavor: "editorial",
      opening: "swipe",
      suggestedTheme: "emerald-ivory",
      sections: sections({
        hero: { variant: "split" },
        countdown: { variant: "classic" },
        couple: { variant: "editorial" },
        story: { variant: "chapters" },
        timeline: { variant: "vertical" },
        ceremonies: { variant: "editorial" },
        family: { variant: "editorial" },
        events: { variant: "editorial" },
        gallery: { variant: "editorial" },
        rsvp: { variant: "classic" },
        guestbook: { variant: "list" },
      }),
    },
  },
  {
    slug: "chapel-romance",
    name: "Chapel Romance",
    description: "For a Christian wedding: a wax-seal opening, a full-screen photograph, soft champagne tones, the day told from betrothal to reception and the church ceremony explained. Available in every package.",
    config: {
      flavor: "royal",
      opening: "seal",
      suggestedTheme: "ivory-chapel",
      eventType: "christian_wedding",
      demo: "anna-and-joseph",
      sections: sections({
        hero: { variant: "fullbleed" },
        countdown: { variant: "classic" },
        couple: { variant: "editorial" },
        story: { variant: "chapters" },
        timeline: { variant: "vertical" },
        family: { variant: "editorial" },
        events: { variant: "editorial" },
        ceremonies: { variant: "editorial" },
        gallery: { variant: "editorial" },
        rsvp: { variant: "classic" },
        guestbook: { variant: "wall" },
      }),
    },
  },
  {
    slug: "nikah-noor",
    name: "Nikah Noor",
    description: "For a Muslim wedding: curtains part on a full-screen photograph, emerald and gold, mehendi, nikah and walima set as spreads and the traditions explained with care. Available in every package.",
    config: {
      flavor: "royal",
      opening: "curtain",
      suggestedTheme: "emerald-ivory",
      eventType: "muslim_wedding",
      demo: "zainab-and-imran",
      sections: sections({
        hero: { variant: "fullbleed" },
        countdown: { variant: "classic" },
        couple: { variant: "arch" },
        story: { variant: "chapters" },
        timeline: { variant: "vertical" },
        family: { variant: "editorial" },
        events: { variant: "editorial" },
        ceremonies: { variant: "editorial" },
        gallery: { variant: "editorial" },
        rsvp: { variant: "classic" },
        guestbook: { variant: "wall" },
      }),
    },
  },
  {
    slug: "minimal-luxury",
    name: "Minimal Luxury",
    description: "Quiet and centred. A single wax-seal tap, hairline rules and soft motion — the invitation as a fine paper card.",
    config: {
      flavor: "minimal",
      opening: "seal",
      suggestedTheme: "rose-gold",
      sections: sections({
        hero: { variant: "centered" },
        countdown: { variant: "classic" },
        couple: { variant: "portraits" },
        story: { variant: "cards" },
        timeline: { variant: "vertical" },
        ceremonies: { variant: "grid" },
        family: { variant: "list" },
        events: { variant: "editorial" },
        gallery: { variant: "masonry" },
        rsvp: { variant: "card" },
        guestbook: { variant: "list" },
      }),
    },
  },
  {
    slug: "modern-minimal",
    name: "Modern Minimal",
    description: "Cream paper, black ink and a single thread of gold. An editorial split opening, hairline rules, a ring countdown and nothing that does not earn its place.",
    config: {
      flavor: "minimal",
      opening: "envelope",
      suggestedTheme: "cream-noir",
      eventType: "wedding",
      demo: "isha-and-daniel",
      sections: layout([
        ["hero", { variant: "split" }], ["story", { variant: "cards" }], ["timeline", { variant: "vertical" }], ["countdown", { variant: "ring" }], ["couple", { variant: "editorial" }],
        ["events", { variant: "cards" }], ["menu", { variant: "classic" }], ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], ["dresscode", { variant: "palette" }],
        ["gallery", { variant: "masonry" }], "music", ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], ...TAIL, "contact",
      ]),
    },
  },
  {
    slug: "gala-night",
    name: "Gala Night",
    description: "Black lacquer, champagne gold and a Didone headline. A full-screen portrait, a statement about the person, thirty years in moments and a guest list that feels like an event.",
    config: {
      flavor: "cinematic",
      opening: "envelope",
      suggestedTheme: "noir-champagne",
      eventType: "birthday",
      demo: "meera-turns-thirty",
      sections: layout([
        ["hero", { variant: "fullbleed" }], ["about", { variant: "statement" }], ["timeline", { variant: "vertical" }], ["countdown", { variant: "classic" }], ["events", { variant: "editorial" }],
        ["dresscode", { variant: "visual" }], ["venue", { variant: "classic" }], ["gallery", { variant: "editorial" }], "music", ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...TAIL, "contact",
      ]),
    },
  },
  {
    slug: "little-celebration",
    name: "Little Celebration",
    description: "Warm cream, coral and sunshine with a friendly rounded type. Party details at a glance, an arched portrait of the birthday child and a note from the parents.",
    config: {
      flavor: "editorial",
      opening: "envelope",
      suggestedTheme: "confetti-pop",
      eventType: "kids_birthday",
      demo: "aarav-turns-three",
      sections: layout([
        ["hero", { variant: "arch" }], ["about", { variant: "facts" }], ["events", { variant: "cards" }], ["dresscode", { variant: "palette" }], ["venue", { variant: "classic" }],
        ["gallery", { variant: "masonry" }], ["message", { variant: "letter" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...TAIL, "contact",
      ]),
    },
  },
  {
    slug: "blessing",
    name: "Blessing",
    description: "Warm ivory, sage and a touch of peach. An arched portrait of the little one, the rituals explained one by one, a note from the grandparents and a table laid for lunch.",
    config: {
      flavor: "minimal",
      opening: "envelope",
      suggestedTheme: "soft-dawn",
      eventType: "naming_ceremony",
      demo: "aadhya-naming-ceremony",
      sections: layout([
        ["hero", { variant: "arch" }], ["about", { variant: "editorial" }], ["ceremonies", { variant: "editorial" }], ["events", { variant: "cards" }], ["message", { variant: "letter" }],
        ["venue", { variant: "classic" }], ["gallery", { variant: "masonry" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...TAIL, "contact",
      ]),
    },
  },
  {
    slug: "romance",
    name: "Romance",
    description: "Mulberry and champagne on blush paper, with a calligraphic hand. An arched portrait, the story of the proposal, the ring ceremony explained and the two of them walking towards each other as you scroll.",
    config: {
      flavor: "royal",
      opening: "envelope",
      suggestedTheme: "peony-champagne",
      eventType: "engagement",
      demo: "tara-and-nikhil",
      sections: layout([
        ["hero", { variant: "arch" }], ["countdown", { variant: "ring" }], ["about", { variant: "editorial" }], ["story", { variant: "chapters" }], ["timeline", { variant: "vertical" }], ["events", { variant: "editorial" }],
        ["ceremonies", { variant: "grid" }], ["venue", { variant: "classic" }], ["dresscode", { variant: "palette" }], ["gallery", { variant: "editorial" }], "music", ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...TAIL, "contact",
      ]),
    },
  },
  {
    slug: "silver-jubilee",
    name: "Silver Jubilee",
    description: "Slate blue and brushed silver. Twenty-five years told as an editorial timeline, the family they built, a letter from the children and a reception to celebrate.",
    config: {
      flavor: "editorial",
      opening: "envelope",
      suggestedTheme: "silver-jubilee",
      eventType: "anniversary",
      demo: "helen-and-george",
      sections: layout([
        ["hero", { variant: "split" }], ["story", { variant: "chapters" }], ["timeline", { variant: "vertical" }], ["people", { variant: "cards" }], ["message", { variant: "letter" }],
        ["countdown", { variant: "classic" }], ["events", { variant: "cards" }], ["venue", { variant: "classic" }], ["gallery", { variant: "editorial" }], ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...TAIL, "contact",
      ]),
    },
  },
  {
    slug: "executive-conclave",
    name: "Executive Conclave",
    description: "Navy, ivory and brass. Registration up front, a featured keynote, the programme day by day, partners by tier and everything an out-of-town delegate needs.",
    config: {
      flavor: "editorial",
      opening: "envelope",
      suggestedTheme: "boardroom-navy",
      eventType: "conclave",
      demo: "leadership-conclave-2026",
      sections: layout([
        ["hero", { variant: "fullbleed" }], ["about", { variant: "facts" }], ["countdown", { variant: "classic" }], ["speakers", { variant: "featured" }], ["agenda", { variant: "days" }], ["sponsors", { variant: "tiers" }],
        ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], ["dresscode", { variant: "palette" }], ["rsvp", { variant: "classic" }], ...TAIL, "contact",
      ]),
    },
  },
  {
    slug: "summit",
    name: "Summit",
    description: "Near-black with electric blue and aqua in a geometric grotesque. A statement, speakers in a grid, a tracked timeline of sessions and partners — made for technology summits and launches.",
    config: {
      flavor: "cinematic",
      opening: "envelope",
      suggestedTheme: "signal-dark",
      eventType: "conference",
      demo: "tech-summit-2026",
      sections: layout([
        ["hero", { variant: "split" }], ["about", { variant: "statement" }], ["speakers", { variant: "grid" }], ["agenda", { variant: "timeline" }], ["countdown", { variant: "classic" }], ["sponsors", { variant: "tiers" }],
        ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], ["rsvp", { variant: "card" }], ...TAIL, "contact",
      ]),
    },
  },
  {
    slug: "remembrance",
    name: "Remembrance",
    description: "Soft stone and slate, an unhurried serif and no effects at all. A portrait and the years of a life, a message from the family, the service, a prayer, the people left behind and a place for tributes.",
    config: {
      flavor: "minimal",
      opening: "envelope",
      suggestedTheme: "quiet-light",
      eventType: "funeral",
      demo: "thomas-mathew-memorial",
      sections: layout([
        ["hero", { variant: "fullbleed" }], ["tribute", { variant: "portrait" }], ["message", { variant: "letter" }], ["timeline", { variant: "vertical" }], ["events", { variant: "timeline" }],
        ["venue", { variant: "classic" }], ["prayer", { variant: "verse" }], ["people", { variant: "groups" }], ["gallery", { variant: "masonry" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }],
        "livestream", "wishes", "thankyou", "contact",
      ]),
    },
  },
];

/**
 * Generates the wedding's section list from a template. Only sections the package includes are
 * created; the renderer re-checks entitlements anyway, so upgrades/downgrades stay safe.
 */
export function generateSections(config: TemplateConfig, ent: Entitlements): SectionConfig[] {
  const out: SectionConfig[] = [];
  let order = 0;
  for (const s of config.sections) {
    const meta = SECTION_META[s.type];
    if (meta.feature && !canUse(ent, meta.feature)) continue;
    out.push(makeSection(s.type, { variant: s.variant, enabled: s.enabled, settings: s.settings, order: order++ }));
  }
  return out;
}
