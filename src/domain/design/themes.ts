import type { ThemeTokens } from "./tokens";

export interface ThemeSeed {
  slug: string;
  name: string;
  description: string;
  tokens: ThemeTokens;
}

/** Built-in themes. Super Admin can duplicate and edit these from the Themes library. */
export const THEME_SEEDS: ThemeSeed[] = [
  {
    slug: "royal-gold",
    name: "Royal Gold",
    description: "Ivory paper, antique gold and deep maroon. Warm, ceremonial, timeless.",
    tokens: {
      colors: { primary: "#86671F", secondary: "#5B1A22", accent: "#C9A24B", background: "#FAF4E8", surface: "#FFFDF7", text: "#2B2118", muted: "#6F604F", border: "#E4D5B5", onPrimary: "#FFFFFF", inverse: "#2B0F14", onInverse: "#F5E9CF" },
      fonts: { heading: "Inter", body: "Inter", script: "Inter" },
      radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "geometric", motion: "standard", grain: true, dark: false,
    },
  },
  {
    slug: "emerald-ivory",
    name: "Emerald Ivory",
    description: "Deep emerald on soft ivory with brushed brass. Calm and quietly luxurious.",
    tokens: {
      colors: { primary: "#12523F", secondary: "#0C3428", accent: "#B89B5E", background: "#F5F3EA", surface: "#FBFAF4", text: "#14251E", muted: "#55645C", border: "#D9DCCB", onPrimary: "#FFFFFF", inverse: "#0B2A21", onInverse: "#EDEBDC" },
      fonts: { heading: "Inter", body: "Inter", script: "Inter" },
      radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "calm", grain: true, dark: false,
    },
  },
  {
    slug: "rose-gold",
    name: "Rose Gold",
    description: "Blush paper, dusty rose and copper highlights. Romantic and modern.",
    tokens: {
      colors: { primary: "#A45A66", secondary: "#6E3B45", accent: "#D4A98F", background: "#FBF3F0", surface: "#FFFAF8", text: "#3A2427", muted: "#80616A", border: "#EBD3CD", onPrimary: "#FFFFFF", inverse: "#3A2027", onInverse: "#FBE8E4" },
      fonts: { heading: "Inter", body: "Inter", script: "Inter" },
      radius: "round", button: "pill", card: "flat", divider: "dots", decor: "floral", motion: "standard", grain: false, dark: false,
    },
  },
  {
    slug: "kasavu",
    name: "Kasavu",
    description: "Cream, gold border and forest green — inspired by the Kerala kasavu set-mundu.",
    tokens: {
      colors: { primary: "#1F4D3A", secondary: "#7A1F2B", accent: "#C2A04C", background: "#FBF8EF", surface: "#FFFEF9", text: "#2A2416", muted: "#6B624B", border: "#E6D9B0", onPrimary: "#FFFFFF", inverse: "#16352A", onInverse: "#F6EFD6" },
      fonts: { heading: "Inter", body: "Inter", script: "Inter" },
      radius: "none", button: "solid", card: "outlined", divider: "ornament", decor: "kasavu", motion: "standard", grain: true, dark: false,
    },
  },
  {
    slug: "midnight-sapphire",
    name: "Midnight Sapphire",
    description: "Night-blue with warm gold light. Cinematic, intimate, evening-wedding mood.",
    tokens: {
      colors: { primary: "#C8A85A", secondary: "#8FA3D8", accent: "#E5C976", background: "#0E1224", surface: "#151A31", text: "#EDE7DA", muted: "#A9A79F", border: "#2A3152", onPrimary: "#10142A", inverse: "#070914", onInverse: "#EDE7DA" },
      fonts: { heading: "Inter", body: "Inter", script: "Inter" },
      radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "rich", grain: true, dark: true,
    },
  },
  {
    slug: "terracotta-blush",
    name: "Terracotta Blush",
    description: "Sun-baked clay and blush linen. Earthy, warm, destination-wedding feel.",
    tokens: {
      colors: { primary: "#B5502F", secondary: "#6A2E1B", accent: "#D9A78B", background: "#F8EEE6", surface: "#FFF9F4", text: "#3B2618", muted: "#7E5F52", border: "#E9D2C1", onPrimary: "#FFFFFF", inverse: "#3B1F14", onInverse: "#F8E6D8" },
      fonts: { heading: "Inter", body: "Inter", script: "Inter" },
      radius: "round", button: "solid", card: "raised", divider: "dots", decor: "floral", motion: "standard", grain: true, dark: false,
    },
  },
  {
    slug: "bridge-blue",
    name: "Bridge Blue",
    description: "Clean navy and electric blue on cool white. Modern, crisp and confident — the StackBridge signature look.",
    tokens: {
      colors: { primary: "#3056D3", secondary: "#0B1B35", accent: "#4A6CF7", background: "#F5F7FB", surface: "#FFFFFF", text: "#0B1B35", muted: "#667085", border: "#DBE2EE", onPrimary: "#FFFFFF", inverse: "#0B1B35", onInverse: "#E9EEF7" },
      fonts: { heading: "Inter", body: "Inter", script: "Inter" },
      radius: "round", button: "solid", card: "flat", divider: "line", decor: "minimal", motion: "standard", grain: false, dark: false,
    },
  },
];
