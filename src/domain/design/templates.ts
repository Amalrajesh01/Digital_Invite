import { z } from "zod";
import { OPENINGS, SECTION_TYPES } from "@/domain/doc/constants";
import { SECTION_META, makeSection } from "@/domain/doc/sections";
import type { SectionConfig } from "@/domain/doc/schema";
import { canUse, type Entitlements } from "@/domain/packages/entitlements";
import { EVENT_TYPES } from "@/domain/doc/event-types";
import { sections } from "./layout";
import { TEMPLATE_SPECS, specSections, type TemplateSpec } from "./template-specs";
import { LOVE_TEMPLATE_SEEDS } from "@/domain/love/templates";
import { LOVE_EXPERIENCES } from "@/domain/love/constants";

/**
 * A template controls STRUCTURE and LAYOUT only: default sections, order, variants, the opening
 * and the visual direction (its decorative language). It never contains customer data.
 * The designs themselves are specified in `template-specs.ts`.
 */
export const TEMPLATE_FLAVORS = ["royal", "cinematic", "editorial", "minimal", "floral", "playful"] as const;
export type TemplateFlavor = (typeof TEMPLATE_FLAVORS)[number];

export const TemplateConfig = z.object({
  flavor: z.enum(TEMPLATE_FLAVORS),
  opening: z.enum(OPENINGS),
  /** Suggested theme slug for the wizard's default pick. */
  suggestedTheme: z.string().optional(),
  /** The occasion a wedding made from this template starts as (drives the opening, the walking couple and the starter ceremonies). */
  eventType: z.enum(EVENT_TYPES).optional(),
  /** Slug of the demonstration wedding whose content the template preview is shown with. */
  demo: z.string().optional(),
  /** Only for “For My Love” templates: which of the five experiences renders the whole page. */
  experience: z.enum(LOVE_EXPERIENCES).optional(),
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

/** Older designs that existing invitations may still use. They stay in the studio but are not offered on the public site. */
const LEGACY_SEEDS: TemplateSeed[] = [
  {
    slug: "editorial",
    name: "Editorial",
    description: "Magazine-inspired composition: asymmetric grids, oversized serif headlines and generous whitespace.",
    config: {
      flavor: "editorial",
      opening: "swipe",
      suggestedTheme: "emerald-ivory",
      sections: sections({
        hero: { variant: "split" }, countdown: { variant: "classic" }, couple: { variant: "editorial" }, story: { variant: "chapters" }, timeline: { variant: "vertical" }, ceremonies: { variant: "editorial" },
        family: { variant: "editorial" }, events: { variant: "editorial" }, gallery: { variant: "editorial" }, rsvp: { variant: "classic" }, guestbook: { variant: "list" },
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
        hero: { variant: "centered" }, countdown: { variant: "classic" }, couple: { variant: "portraits" }, story: { variant: "cards" }, timeline: { variant: "vertical" }, ceremonies: { variant: "grid" },
        family: { variant: "list" }, events: { variant: "editorial" }, gallery: { variant: "masonry" }, rsvp: { variant: "card" }, guestbook: { variant: "list" },
      }),
    },
  },
];

function toSeed(spec: TemplateSpec): TemplateSeed {
  return {
    slug: spec.slug,
    name: spec.name,
    description: `${spec.tagline} ${spec.concept}`,
    config: { flavor: spec.direction, opening: spec.opening, suggestedTheme: spec.theme, eventType: spec.eventType, demo: spec.demo, sections: specSections(spec) },
  };
}

export const TEMPLATE_SEEDS: TemplateSeed[] = [...TEMPLATE_SPECS.map(toSeed), ...LOVE_TEMPLATE_SEEDS, ...LEGACY_SEEDS];

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

