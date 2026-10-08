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
