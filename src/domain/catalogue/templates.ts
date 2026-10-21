import { OPENING_LABELS, type OpeningVariant } from "@/domain/doc/constants";
import type { CategorySlug } from "@/domain/doc/event-types";
import { DIRECTIONS, DIRECTION_ORDER } from "@/domain/design/directions";
import { TEMPLATE_SPECS, specsFor, type TemplateSpec } from "@/domain/design/template-specs";
import { THEME_SEEDS } from "@/domain/design/themes";
import type { TemplateFlavor } from "@/domain/design/templates";
import { LOVE_SPECS, type LoveSpec } from "@/domain/love/templates";
import { MOOD_THEME, MOOD_LABEL } from "@/domain/love/constants";
import { categoryBySlug } from "./categories";
import { cloudinaryUrl } from "@/lib/media-url";
import cloudThumbs from "./cloud-thumbs.json";

/**
 * The templates as the public site shows them: one entry per design, each with a picture of itself
 * (`public/templates/<slug>.webp`, a real screenshot made by `scripts/dev/tpl.mjs`), the occasion it is for,
 * its style, and the plain-language facts a customer wants before choosing.
 */
export interface SiteTemplate {
  slug: string;
  name: string;
  category: CategorySlug;
  tagline: string;
  concept: string;
  /** The visual direction key and its customer-facing name. */
  style: TemplateFlavor;
  styleLabel: string;
  opening: OpeningVariant | "none";
  openingLabel: string;
  theme: { slug: string; name: string; colors: string[] };
  target: string[];
  interactions: string[];
  images: string;
  motion: string;
  /** The sample invitation whose words and photographs it is shown with. */
  demo: string;
  edition: boolean;
  /** True for a “For My Love” experience. */
  love: boolean;
  thumb: string;
  path: string;
}

/**
 * A template's picture: from Cloudinary when `npm run cloudinary:static` has put it there (the manifest names its own cloud, so server and
 * browser always agree), otherwise the screenshot in public/templates.
 */
const thumbFor = (slug: string): string => {
  const t = (cloudThumbs.thumbs as Record<string, { id: string; version: number }>)[slug];
  return cloudThumbs.cloud && t ? cloudinaryUrl(cloudThumbs.cloud, t.id, { version: t.version, original: true }) : `/templates/${slug}.webp`;
};

const palette = (slug: string) => {
  const t = THEME_SEEDS.find((x) => x.slug === slug);
  return { slug, name: t?.name ?? slug, colors: t ? [t.tokens.colors.background, t.tokens.colors.primary, t.tokens.colors.accent, t.tokens.colors.inverse] : [] };
};

function fromSpec(s: TemplateSpec): SiteTemplate {
  return {
    slug: s.slug, name: s.name, category: s.category, tagline: s.tagline, concept: s.concept, style: s.direction, styleLabel: DIRECTIONS[s.direction].label,
    opening: s.opening, openingLabel: OPENING_LABELS[s.opening], theme: palette(s.theme), target: s.target, interactions: s.interactions, images: s.images, motion: s.motion,
    demo: s.demo, edition: !!s.edition, love: false, thumb: thumbFor(s.slug), path: `/templates/${s.category}/${s.slug}`,
  };
}

function fromLove(s: LoveSpec): SiteTemplate {
  const mood = s.moods[0];
  return {
    slug: s.slug, name: s.name, category: "for-my-love", tagline: s.tagline, concept: s.concept, style: s.direction, styleLabel: `${MOOD_LABEL[mood]} mood`,
    opening: "none", openingLabel: "Its own opening", theme: palette(MOOD_THEME[mood]), target: s.target, interactions: s.interactions, images: s.images, motion: s.motion,
    demo: s.demo, edition: false, love: true, thumb: thumbFor(s.slug), path: `/templates/for-my-love/${s.slug}`,
  };
}

/** Every public template: the occasions’ five designs (and faith editions), then the five love experiences. */
export const SITE_TEMPLATES: SiteTemplate[] = [...TEMPLATE_SPECS.filter((s) => !s.legacy).map(fromSpec), ...LOVE_SPECS.map(fromLove)];

export const siteTemplateBySlug = (slug: string) => SITE_TEMPLATES.find((t) => t.slug === slug);

/**
 * The templates an occasion offers. Occasions without designs of their own (a graduation, a baby shower, a product launch)
 * offer the five of their nearest family, and say so — the designs are the same engine, with the wording changed.
 */
export function templatesIn(category: CategorySlug): SiteTemplate[] {
  if (category === "for-my-love") return SITE_TEMPLATES.filter((t) => t.love);
  const own = specsFor(category);
  if (own.length) return own.map(fromSpec);
  const family = categoryBySlug(category)?.family;
  return family ? specsFor(family).map(fromSpec) : [];
}

/** The five designs of an occasion in the order a customer compares them. */
export function sameOccasion(t: SiteTemplate): SiteTemplate[] {
  return templatesIn(t.category).filter((x) => x.slug !== t.slug && !x.edition);
}

export const STYLE_FILTERS = DIRECTION_ORDER.map((k) => ({ value: k, label: DIRECTIONS[k].label, promise: DIRECTIONS[k].promise }));
