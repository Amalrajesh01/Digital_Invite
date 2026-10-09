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
      fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" },
      radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "geometric", motion: "standard", grain: true, dark: false,
    },
  },
  {
    slug: "emerald-ivory",
    name: "Emerald Ivory",
    description: "Deep emerald on soft ivory with brushed brass. Calm and quietly luxurious.",
    tokens: {
      colors: { primary: "#12523F", secondary: "#0C3428", accent: "#B89B5E", background: "#F5F3EA", surface: "#FBFAF4", text: "#14251E", muted: "#55645C", border: "#D9DCCB", onPrimary: "#FFFFFF", inverse: "#0B2A21", onInverse: "#EDEBDC" },
      fonts: { heading: "Playfair Display", body: "Inter", script: "Cormorant Garamond" },
      radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "calm", grain: true, dark: false,
    },
  },
  {
    slug: "rose-gold",
    name: "Rose Gold",
    description: "Blush paper, dusty rose and copper highlights. Romantic and modern.",
    tokens: {
      colors: { primary: "#A45A66", secondary: "#6E3B45", accent: "#D4A98F", background: "#FBF3F0", surface: "#FFFAF8", text: "#3A2427", muted: "#80616A", border: "#EBD3CD", onPrimary: "#FFFFFF", inverse: "#3A2027", onInverse: "#FBE8E4" },
      fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" },
      radius: "round", button: "pill", card: "flat", divider: "dots", decor: "floral", motion: "standard", grain: false, dark: false,
    },
  },
  {
    slug: "kasavu",
    name: "Kasavu",
    description: "Cream, gold border and forest green — inspired by the Kerala kasavu set-mundu.",
    tokens: {
      colors: { primary: "#1F4D3A", secondary: "#7A1F2B", accent: "#C2A04C", background: "#FBF8EF", surface: "#FFFEF9", text: "#2A2416", muted: "#6B624B", border: "#E6D9B0", onPrimary: "#FFFFFF", inverse: "#16352A", onInverse: "#F6EFD6" },
      fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" },
      radius: "none", button: "solid", card: "outlined", divider: "ornament", decor: "kasavu", motion: "standard", grain: true, dark: false,
    },
  },
  {
    slug: "midnight-sapphire",
    name: "Midnight Sapphire",
    description: "Night-blue with warm gold light. Cinematic, intimate, evening-wedding mood.",
    tokens: {
      colors: { primary: "#C8A85A", secondary: "#8FA3D8", accent: "#E5C976", background: "#0E1224", surface: "#151A31", text: "#EDE7DA", muted: "#A9A79F", border: "#2A3152", onPrimary: "#10142A", inverse: "#070914", onInverse: "#EDE7DA" },
      fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" },
      radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "rich", grain: true, dark: true,
    },
  },
  {
    slug: "terracotta-blush",
    name: "Terracotta Blush",
    description: "Sun-baked clay and blush linen. Earthy, warm, destination-wedding feel.",
    tokens: {
      colors: { primary: "#B5502F", secondary: "#6A2E1B", accent: "#D9A78B", background: "#F8EEE6", surface: "#FFF9F4", text: "#3B2618", muted: "#7E5F52", border: "#E9D2C1", onPrimary: "#FFFFFF", inverse: "#3B1F14", onInverse: "#F8E6D8" },
      fonts: { heading: "Playfair Display", body: "Inter", script: "Cormorant Garamond" },
      radius: "round", button: "solid", card: "raised", divider: "dots", decor: "floral", motion: "standard", grain: true, dark: false,
    },
  },
  {
    slug: "ivory-chapel",
    name: "Ivory Chapel",
    description: "Warm ivory, sage and champagne gold. Soft, hushed and timeless — made for church weddings and quiet elegance.",
    tokens: {
      colors: { primary: "#5F7561", secondary: "#34404F", accent: "#B79A68", background: "#F8F5EF", surface: "#FFFFFF", text: "#25282B", muted: "#6A6E73", border: "#E5DFD2", onPrimary: "#FFFFFF", inverse: "#222B33", onInverse: "#F2EEE6" },
      fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" },
      radius: "soft", button: "outline", card: "flat", divider: "line", decor: "minimal", motion: "calm", grain: true, dark: false,
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
  {
    slug: "cream-noir",
    name: "Cream & Noir",
    description: "Warm cream paper, true black ink and one thread of muted gold. Quiet, modern and editorial.",
    tokens: {
      colors: { primary: "#1C1A17", secondary: "#3A3732", accent: "#A8884A", background: "#F7F3EC", surface: "#FFFFFF", text: "#1C1A17", muted: "#6B665D", border: "#E2DACB", onPrimary: "#FFFFFF", inverse: "#121110", onInverse: "#F4EFE5" },
      fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" },
      radius: "none", button: "solid", card: "flat", divider: "line", decor: "minimal", motion: "calm", grain: false, dark: false,
    },
  },
  {
    slug: "noir-champagne",
    name: "Noir & Champagne",
    description: "Black lacquer and champagne gold under a high-contrast Didone. Glamorous, after-dark, made for a milestone night.",
    tokens: {
      colors: { primary: "#D8BE82", secondary: "#B9A06A", accent: "#E6CF9B", background: "#0F0E0D", surface: "#171513", text: "#F0EADD", muted: "#A59E8F", border: "#2B2824", onPrimary: "#14110D", inverse: "#080706", onInverse: "#F0EADD" },
      fonts: { heading: "Bodoni Moda", body: "Inter", script: "Bodoni Moda" },
      radius: "none", button: "outline", card: "outlined", divider: "ornament", decor: "minimal", motion: "rich", grain: true, dark: true,
    },
  },
  {
    slug: "confetti-pop",
    name: "Confetti Pop",
    description: "Warm cream with coral, sunshine yellow and a friendly rounded type. Playful for the little ones, tidy enough for the grown-ups.",
    tokens: {
      colors: { primary: "#C9431C", secondary: "#2E5EAA", accent: "#E9A41A", background: "#FFF8EE", surface: "#FFFFFF", text: "#2B2A33", muted: "#6C6A78", border: "#F0E1C8", onPrimary: "#FFFFFF", inverse: "#243B6B", onInverse: "#FFF6E5" },
      fonts: { heading: "Fredoka", body: "Nunito", script: "Fredoka" },
      radius: "round", button: "pill", card: "raised", divider: "dots", decor: "floral", motion: "rich", grain: false, dark: false,
    },
  },
  {
    slug: "peony-champagne",
    name: "Peony & Champagne",
    description: "Mulberry rose and champagne on blush paper, with a calligraphic hand. Romantic without being sweet.",
    tokens: {
      colors: { primary: "#8C4457", secondary: "#5A2E3B", accent: "#C4A07A", background: "#FBF4F0", surface: "#FFFDFB", text: "#35262B", muted: "#7D6A70", border: "#EBD9D4", onPrimary: "#FFFFFF", inverse: "#3B2430", onInverse: "#F8E9E6" },
      fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Pinyon Script" },
      radius: "round", button: "pill", card: "flat", divider: "ornament", decor: "floral", motion: "standard", grain: false, dark: false,
    },
  },
  {
    slug: "silver-jubilee",
    name: "Silver Jubilee",
    description: "Slate blue and brushed silver on cool white. Dignified and warm — the colours of twenty-five years.",
    tokens: {
      colors: { primary: "#3C4A63", secondary: "#232B3C", accent: "#8791A8", background: "#F6F7F9", surface: "#FFFFFF", text: "#1F2533", muted: "#626B7D", border: "#DDE1E9", onPrimary: "#FFFFFF", inverse: "#1B2231", onInverse: "#EEF1F6" },
      fonts: { heading: "Playfair Display", body: "Inter", script: "Playfair Display" },
      radius: "soft", button: "solid", card: "outlined", divider: "ornament", decor: "geometric", motion: "standard", grain: true, dark: false,
    },
  },
  {
    slug: "boardroom-navy",
    name: "Boardroom Navy",
    description: "Deep navy, ivory and a restrained brass. Authoritative and calm — for leadership events, summits and launches.",
    tokens: {
      colors: { primary: "#14213D", secondary: "#0E1730", accent: "#B48A3C", background: "#F7F6F2", surface: "#FFFFFF", text: "#101828", muted: "#5B6577", border: "#DDDCD3", onPrimary: "#FFFFFF", inverse: "#0C1428", onInverse: "#F1EFE7" },
      fonts: { heading: "Playfair Display", body: "Inter", script: "Playfair Display" },
      radius: "none", button: "solid", card: "outlined", divider: "line", decor: "minimal", motion: "standard", grain: false, dark: false,
    },
  },
  {
    slug: "signal-dark",
    name: "Signal",
    description: "Near-black with electric blue and aqua, set in a geometric grotesque. Built for technology summits and product launches.",
    tokens: {
      colors: { primary: "#7C9CFF", secondary: "#5EEAD4", accent: "#5EEAD4", background: "#0A0E1A", surface: "#111827", text: "#E7ECF7", muted: "#9AA6BE", border: "#1E2740", onPrimary: "#0A0E1A", inverse: "#060912", onInverse: "#E7ECF7" },
      fonts: { heading: "Space Grotesk", body: "Inter", script: "Space Grotesk" },
      radius: "soft", button: "solid", card: "outlined", divider: "line", decor: "geometric", motion: "standard", grain: false, dark: true,
    },
  },
  {
    slug: "quiet-light",
    name: "Quiet Light",
    description: "Soft stone, slate and warm grey in an unhurried serif. Nothing decorative — only the words and the photographs.",
    tokens: {
      colors: { primary: "#4E5A66", secondary: "#2F3840", accent: "#A39A8A", background: "#F4F2EE", surface: "#FBFAF8", text: "#2A2F34", muted: "#6D737A", border: "#DDD9D1", onPrimary: "#FFFFFF", inverse: "#23292F", onInverse: "#EEEBE5" },
      fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" },
      radius: "none", button: "outline", card: "flat", divider: "line", decor: "none", motion: "calm", grain: false, dark: false,
    },
  },
  {
    slug: "soft-dawn",
    name: "Soft Dawn",
    description: "Warm ivory, sage and a touch of peach-gold. Tender and unhurried — for welcoming a new little life.",
    tokens: {
      colors: { primary: "#5B7A66", secondary: "#3E5547", accent: "#D9A57C", background: "#FBF6EE", surface: "#FFFDF9", text: "#2E3A33", muted: "#6C766F", border: "#E9DFCE", onPrimary: "#FFFFFF", inverse: "#2F4238", onInverse: "#F6EFE3" },
      fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" },
      radius: "round", button: "pill", card: "flat", divider: "dots", decor: "floral", motion: "calm", grain: false, dark: false,
    },
  },
];
