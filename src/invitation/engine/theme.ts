import type { CSSProperties } from "react";
import { ITALIC_ACCENTS, RADIUS_PX, googleFontsHref, type ThemeTokens } from "@/domain/design/tokens";
import { localeInfo } from "@/domain/doc/constants";
import type { Tone } from "@/domain/doc/event-types";

/** Professional occasions move a little faster than a wedding; a solemn one moves slower and never bounces. */
const TONE_PACE: Record<Tone, number> = { celebratory: 1, professional: 0.85, solemn: 1.4 };

/** Design tokens → CSS custom properties. Components read `var(--c-*)`; no colour is ever hard-coded. */
/** The motion profiles (see styles/motion.css) also set the pace: the elegant one is the slowest and softest, the cinematic one weightier. */
const PROFILE_PACE: Record<string, number> = { auto: 1, elegant: 1.2, cinematic: 1.3, immersive: 1.05 };

export function themeStyle(tokens: ThemeTokens, secondaryLocale: string | null, tone: Tone = "celebratory", profile = "auto"): CSSProperties {
  const c = tokens.colors;
  const ml = secondaryLocale ? localeInfo(secondaryLocale)?.font : null;
  const vars: Record<string, string> = {
    "--c-primary": c.primary,
    "--c-secondary": c.secondary,
    "--c-accent": c.accent,
    "--c-bg": c.background,
    "--c-surface": c.surface,
    "--c-text": c.text,
    "--c-muted": c.muted,
    "--c-border": c.border,
    "--c-on-primary": c.onPrimary,
    "--c-inverse": c.inverse,
    "--c-on-inverse": c.onInverse,
    "--f-heading": `"${tokens.fonts.heading}", system-ui, -apple-system, "Segoe UI", sans-serif`,
    "--f-body": `"${tokens.fonts.body}", system-ui, sans-serif`,
    "--f-script": `"${tokens.fonts.script}", system-ui, sans-serif`,
    "--f-script-style": ITALIC_ACCENTS.includes(tokens.fonts.script) ? "italic" : "normal",
    "--f-local": ml ? `"${ml}", "${tokens.fonts.heading}", sans-serif` : `"${tokens.fonts.heading}", sans-serif`,
    "--r": RADIUS_PX[tokens.radius],
    // the opening screen is dark: a solid button in the theme's primary colour would vanish on it when that colour is near-black, so it falls back to the accent
    "--c-gate-btn": contrastRatio(c.primary, c.inverse) >= 2.2 ? c.primary : c.accent,
    "--c-gate-btn-text": readableOn(contrastRatio(c.primary, c.inverse) >= 2.2 ? c.primary : c.accent),
    "--motion": ((tokens.motion === "calm" ? 0.6 : tokens.motion === "rich" ? 1.25 : 1) * TONE_PACE[tone] * (PROFILE_PACE[profile] ?? 1)).toFixed(2),
  };
  return vars as CSSProperties;
}

export function themeFontHref(tokens: ThemeTokens, secondaryLocale: string | null): string | null {
  const local = secondaryLocale ? localeInfo(secondaryLocale)?.font : null;
  return googleFontsHref([tokens.fonts.heading, tokens.fonts.body, tokens.fonts.script, ...(local ? [local] : [])]);
}

/** WCAG contrast ratio of two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
    const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Readable text colour for an arbitrary background swatch. */
export function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1c1a17" : "#ffffff";
}
