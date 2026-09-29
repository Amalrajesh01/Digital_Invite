import { z } from "zod";

/**
 * Design tokens for the *invitation* (public experience). Themes are independent from templates:
 * "Cinematic template + Emerald Ivory theme" is just two rows combined at render time.
 * Components never hard-code a colour — they read CSS variables generated from these tokens.
 */

const Hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

export const ThemeColors = z.object({
  primary: Hex,
  secondary: Hex,
  accent: Hex,
  background: Hex,
  surface: Hex,
  text: Hex,
  muted: Hex,
  border: Hex,
  onPrimary: Hex,
  /** Deep colour used for "night" sections and the opening screen. */
  inverse: Hex,
  onInverse: Hex,
});

export const ThemeTokens = z.object({
  colors: ThemeColors,
  fonts: z.object({ heading: z.string(), body: z.string(), script: z.string() }),
  radius: z.enum(["none", "soft", "round", "pill"]).default("soft"),
  button: z.enum(["solid", "outline", "underline", "pill"]).default("solid"),
  card: z.enum(["flat", "outlined", "raised", "paper"]).default("outlined"),
  divider: z.enum(["line", "ornament", "dots", "none"]).default("ornament"),
  decor: z.enum(["none", "floral", "geometric", "kasavu", "minimal"]).default("minimal"),
  motion: z.enum(["calm", "standard", "rich"]).default("standard"),
  grain: z.boolean().default(true),
  dark: z.boolean().default(false),
});
export type ThemeTokens = z.infer<typeof ThemeTokens>;

export const ThemeOverrides = z.object({
  colors: ThemeColors.partial().optional(),
  fonts: z.object({ heading: z.string(), body: z.string(), script: z.string() }).partial().optional(),
  radius: ThemeTokens.shape.radius.optional(),
  button: ThemeTokens.shape.button.optional(),
  card: ThemeTokens.shape.card.optional(),
  divider: ThemeTokens.shape.divider.optional(),
  decor: ThemeTokens.shape.decor.optional(),
  motion: ThemeTokens.shape.motion.optional(),
  grain: z.boolean().optional(),
});
export type ThemeOverrides = z.infer<typeof ThemeOverrides>;

export function mergeTokens(base: ThemeTokens, overrides: unknown): ThemeTokens {
  const parsed = ThemeOverrides.safeParse(overrides ?? {});
  const o = parsed.success ? parsed.data : {};
  return {
    ...base,
    ...stripUndefined({ radius: o.radius, button: o.button, card: o.card, divider: o.divider, decor: o.decor, motion: o.motion, grain: o.grain }),
    colors: { ...base.colors, ...stripUndefined(o.colors ?? {}) },
    fonts: { ...base.fonts, ...stripUndefined(o.fonts ?? {}) },
  } as ThemeTokens;
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/** Fonts the platform loads on demand (Google Fonts, SIL OFL). Keep the list curated and premium. */
export const FONT_CHOICES = {
  heading: [
    "Cormorant Garamond", "Playfair Display", "Fraunces", "Bodoni Moda", "Cinzel", "Italiana",
    "Gilda Display", "DM Serif Display", "Instrument Serif", "Marcellus", "Libre Caslon Display",
  ],
  body: ["Jost", "Hanken Grotesk", "Manrope", "Lora", "Mulish", "Karla", "DM Sans", "Work Sans"],
  script: ["Pinyon Script", "Great Vibes", "Allura", "Playball", "Parisienne", "Italianno", "Mr De Haviland"],
} as const;

export const RADIUS_PX: Record<ThemeTokens["radius"], string> = { none: "0px", soft: "4px", round: "14px", pill: "999px" };

const WEIGHTS: Record<string, string> = {
  "Cormorant Garamond": "ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500",
  "Playfair Display": "ital,wght@0,400;0,500;0,600;1,400;1,500",
  "Fraunces": "ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400",
  "Bodoni Moda": "ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400",
  "Cinzel": "wght@400;500;600",
  "Italiana": "",
  "Gilda Display": "",
  "DM Serif Display": "ital@0;1",
  "Instrument Serif": "ital@0;1",
  "Marcellus": "",
  "Libre Caslon Display": "",
  "Jost": "wght@300;400;500;600",
  "Hanken Grotesk": "wght@300;400;500;600",
  "Manrope": "wght@300;400;500;600",
  "Lora": "ital,wght@0,400;0,500;1,400",
  "Mulish": "wght@300;400;500;600",
  "Karla": "wght@300;400;500;600",
  "DM Sans": "opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600",
  "Work Sans": "wght@300;400;500;600",
  "Pinyon Script": "",
  "Great Vibes": "",
  "Allura": "",
  "Playball": "",
  "Parisienne": "",
  "Italianno": "",
  "Mr De Haviland": "",
  "Noto Serif Malayalam": "wght@300;400;500;600",
  "Noto Sans Malayalam": "wght@300;400;500;600",
  "Manjari": "wght@100;400;700",
  "Noto Serif Tamil": "wght@300;400;500;600",
  "Noto Serif Telugu": "wght@300;400;500;600",
  "Noto Serif Kannada": "wght@300;400;500;600",
  "Noto Serif Devanagari": "wght@300;400;500;600",
  "Noto Serif Bengali": "wght@300;400;500;600",
  "Noto Serif Gujarati": "wght@300;400;500;600",
  "Noto Serif Gurmukhi": "wght@300;400;500;600",
  "Noto Nastaliq Urdu": "wght@400;500;600",
};

/** Builds one Google Fonts CSS URL for the given families (display=swap, only what is needed). */
export function googleFontsHref(families: string[]): string | null {
  const unique = [...new Set(families.filter(Boolean))];
  if (!unique.length) return null;
  const parts = unique.map((f) => {
    const spec = WEIGHTS[f];
    const name = f.replace(/ /g, "+");
    return spec ? `family=${name}:${spec}` : `family=${name}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}
