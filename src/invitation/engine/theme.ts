import type { CSSProperties } from "react";
import { ITALIC_ACCENTS, RADIUS_PX, googleFontsHref, type ThemeTokens } from "@/domain/design/tokens";
import { localeInfo } from "@/domain/doc/constants";
import type { Tone } from "@/domain/doc/event-types";

/** Professional occasions move a little faster than a wedding; a solemn one moves slower and never bounces. */
const TONE_PACE: Record<Tone, number> = { celebratory: 1, professional: 0.85, solemn: 1.4 };

/** Design tokens → CSS custom properties. Components read `var(--c-*)`; no colour is ever hard-coded. */
export function themeStyle(tokens: ThemeTokens, secondaryLocale: string | null, tone: Tone = "celebratory"): CSSProperties {
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
    "--motion": ((tokens.motion === "calm" ? 0.6 : tokens.motion === "rich" ? 1.25 : 1) * TONE_PACE[tone]).toFixed(2),
  };
  return vars as CSSProperties;
}

export function themeFontHref(tokens: ThemeTokens, secondaryLocale: string | null): string | null {
  const local = secondaryLocale ? localeInfo(secondaryLocale)?.font : null;
  return googleFontsHref([tokens.fonts.heading, tokens.fonts.body, tokens.fonts.script, ...(local ? [local] : [])]);
}

/** Readable text colour for an arbitrary background swatch. */
export function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1c1a17" : "#ffffff";
}
