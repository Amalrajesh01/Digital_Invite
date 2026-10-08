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

/**
 * Fonts the platform loads on demand (Google Fonts, SIL OFL). The studio itself is Inter-only; invitations
 * may pair an elegant display serif (names, headings) with Inter for supporting text — the wedding-stationery look.
 */
export const FONT_CHOICES = {
  heading: ["Cormorant Garamond", "Playfair Display", "Cinzel", "Marcellus", "Bodoni Moda", "DM Serif Display", "Inter", "Manrope", "DM Sans", "Plus Jakarta Sans", "Outfit", "Poppins", "Work Sans", "Hanken Grotesk"],
  body: ["Inter", "Manrope", "DM Sans", "Plus Jakarta Sans", "Work Sans", "Hanken Grotesk", "Mulish", "Karla"],
  script: ["Cormorant Garamond", "Playfair Display", "Pinyon Script", "Great Vibes", "Inter", "Manrope", "DM Sans", "Plus Jakarta Sans", "Outfit", "Poppins"],
} as const;

/** Display serifs: drive the invitation's typographic details (case, tracking, weights). */
export const SERIF_FONTS: readonly string[] = ["Cormorant Garamond", "Playfair Display", "Cinzel", "Marcellus", "Bodoni Moda", "DM Serif Display"];
/** Accent fonts that have a true italic; everything else is shown upright (a synthesised slant looks cheap). */
export const ITALIC_ACCENTS: readonly string[] = ["Cormorant Garamond", "Playfair Display", "DM Serif Display", "Bodoni Moda"];
export const isSerif = (family: string) => SERIF_FONTS.includes(family);

export const RADIUS_PX: Record<ThemeTokens["radius"], string> = { none: "0px", soft: "4px", round: "14px", pill: "999px" };

const WEIGHTS: Record<string, string> = {
  "Cormorant Garamond": "ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600",
  "Playfair Display": "ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600",
  "Cinzel": "wght@400;500;600;700",
  "Marcellus": "",
  "Bodoni Moda": "ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;1,6..96,400;1,6..96,500",
  "DM Serif Display": "ital@0;1",
  "Pinyon Script": "",
  "Great Vibes": "",
  "Inter": "opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800",
  "Manrope": "wght@300;400;500;600;700",
  "Plus Jakarta Sans": "wght@300;400;500;600;700",
  "Outfit": "wght@300;400;500;600;700",
  "Poppins": "wght@300;400;500;600;700",
  "DM Sans": "opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700",
  "Work Sans": "wght@300;400;500;600;700",
  "Hanken Grotesk": "wght@300;400;500;600;700",
  "Mulish": "wght@300;400;500;600;700",
  "Karla": "wght@300;400;500;600;700",
  "Noto Sans Malayalam": "wght@300;400;500;600;700",
  "Noto Sans Tamil": "wght@300;400;500;600;700",
  "Noto Sans Telugu": "wght@300;400;500;600;700",
  "Noto Sans Kannada": "wght@300;400;500;600;700",
  "Noto Sans Devanagari": "wght@300;400;500;600;700",
  "Noto Sans Bengali": "wght@300;400;500;600;700",
  "Noto Sans Gujarati": "wght@300;400;500;600;700",
  "Noto Sans Gurmukhi": "wght@300;400;500;600;700",
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
