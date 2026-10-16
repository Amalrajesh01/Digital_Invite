import type { ThemeSeed } from "./themes";

/**
 * The palettes of the occasion-specific templates. Each one is chosen for the mood of its design, not picked from a
 * swatch book: a lamp-lit royal engagement, a balloon-bright children's party, a hushed white-lily farewell.
 * Every theme can still be duplicated and recoloured in the Themes library.
 */
const c = (primary: string, secondary: string, accent: string, background: string, surface: string, text: string, muted: string, border: string, onPrimary: string, inverse: string, onInverse: string) => ({ primary, secondary, accent, background, surface, text, muted, border, onPrimary, inverse, onInverse });

export const EXTRA_THEMES: ThemeSeed[] = [
  {
    slug: "marigold-maroon", name: "Marigold & Maroon",
    description: "Deep maroon, marigold and warm cream: the colours of a temple garland. For a ring ceremony or a traditional celebration.",
    tokens: { colors: c("#7B1E2B", "#4A1019", "#E8A317", "#FBF1E3", "#FFFAF1", "#2B1712", "#7A5A4E", "#EAD5B7", "#FFFFFF", "#2A0B10", "#F8E7CC"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Pinyon Script" }, radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "geometric", motion: "standard", grain: true, dark: false },
  },
  {
    slug: "bubblegum", name: "Bubblegum",
    description: "Bright pink, sunshine yellow and violet on a soft blush ground, in a friendly rounded type. Loud in the best way.",
    tokens: { colors: c("#D63A7B", "#6A2FB5", "#FFB703", "#FFF3F7", "#FFFFFF", "#2B1A33", "#7A6482", "#F4D3E0", "#FFFFFF", "#3A1B5C", "#FFF1F7"), fonts: { heading: "Baloo 2", body: "Nunito", script: "Baloo 2" }, radius: "round", button: "pill", card: "raised", divider: "dots", decor: "floral", motion: "rich", grain: false, dark: false },
  },
  {
    slug: "paper-blue", name: "Paper & Ink Blue",
    description: "Off-white paper, near-black ink and one sharp blue. Calm, modern and exact.",
    tokens: { colors: c("#2342C8", "#12182B", "#E8553D", "#F7F7F4", "#FFFFFF", "#12182B", "#667085", "#DDDFE6", "#FFFFFF", "#0E1428", "#EEF0F8"), fonts: { heading: "Fraunces", body: "Inter", script: "Fraunces" }, radius: "none", button: "solid", card: "flat", divider: "line", decor: "minimal", motion: "calm", grain: false, dark: false },
  },
  {
    slug: "sage-blossom", name: "Sage & Blossom",
    description: "Sage leaves, dusty rose and warm linen. A garden in the morning, unhurried and soft.",
    tokens: { colors: c("#5E7A5B", "#3E5340", "#D8A3A0", "#F6F4EC", "#FFFEFA", "#2A3328", "#6B7568", "#E1E3D4", "#FFFFFF", "#2E3E2F", "#F1F1E4"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Great Vibes" }, radius: "round", button: "pill", card: "flat", divider: "ornament", decor: "floral", motion: "calm", grain: false, dark: false },
  },
  {
    slug: "festive-pop", name: "Festive Pop",
    description: "Chilli red, turmeric yellow and teal on warm cream. A sangeet night in colour, with chunky friendly letters.",
    tokens: { colors: c("#E4572E", "#1B998B", "#F2B705", "#FFF6E5", "#FFFFFF", "#2A2438", "#6E667C", "#F2DFB9", "#FFFFFF", "#2A2438", "#FFF3DA"), fonts: { heading: "Baloo 2", body: "Nunito", script: "Baloo 2" }, radius: "round", button: "pill", card: "raised", divider: "dots", decor: "geometric", motion: "rich", grain: false, dark: false },
  },
  {
    slug: "peach-garden", name: "Peach Garden",
    description: "Peach, coral and soft apricot with a handwritten script. A garden lunch with the people you love.",
    tokens: { colors: c("#D2706A", "#7A3E48", "#F0B27A", "#FFF5EF", "#FFFCF9", "#3A2528", "#8A6A68", "#F2DACF", "#FFFFFF", "#4A2A2E", "#FFEDE3"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Parisienne" }, radius: "round", button: "pill", card: "flat", divider: "dots", decor: "floral", motion: "calm", grain: false, dark: false },
  },
  {
    slug: "plum-gold", name: "Plum & Gold",
    description: "Deep plum, antique gold and candlelit cream. A grand, formal evening.",
    tokens: { colors: c("#5C1F4A", "#3A0F2E", "#C99A3B", "#FBF3E9", "#FFFBF4", "#2D1626", "#7C6171", "#EBD9C2", "#FFFFFF", "#2A0F24", "#F7E9D2"), fonts: { heading: "Playfair Display", body: "Inter", script: "Pinyon Script" }, radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "geometric", motion: "standard", grain: true, dark: false },
  },
  {
    slug: "sunset-pop", name: "Sunset Pop",
    description: "Magenta, amber and indigo on a rosy ground. Date-night energy.",
    tokens: { colors: c("#C2185B", "#283593", "#FFB400", "#FDF0F0", "#FFFFFF", "#2A1B2E", "#7C6580", "#F2D5DA", "#FFFFFF", "#241A4A", "#FFEFF1"), fonts: { heading: "Fraunces", body: "Nunito", script: "Fraunces" }, radius: "round", button: "pill", card: "raised", divider: "dots", decor: "minimal", motion: "rich", grain: false, dark: false },
  },
  {
    slug: "ember-dusk", name: "Ember Dusk",
    description: "Charcoal and terracotta with a glow of amber, like a lit window at dusk. Warm, dark, cinematic.",
    tokens: { colors: c("#E0A458", "#C97B4A", "#F2C078", "#17110E", "#211814", "#F3E8DC", "#B7A798", "#352A22", "#1A110A", "#0E0A08", "#F3E8DC"), fonts: { heading: "Fraunces", body: "Inter", script: "Fraunces" }, radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "rich", grain: true, dark: true },
  },
  {
    slug: "lullaby", name: "Lullaby",
    description: "Deep indigo with soft candle-gold, like a nursery at night. Gentle and still.",
    tokens: { colors: c("#E8D6A0", "#9FB0E0", "#F6E7B4", "#121A33", "#1A2342", "#EEF0F8", "#A8B0CC", "#2A3560", "#171B33", "#0A1022", "#EEF0F8"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" }, radius: "round", button: "outline", card: "outlined", divider: "dots", decor: "minimal", motion: "calm", grain: false, dark: true },
  },
  {
    slug: "baby-pastel", name: "Baby Pastel",
    description: "Powder blue, blush pink and lilac in a rounded, friendly type. Light as a feather.",
    tokens: { colors: c("#5FA8D3", "#8A6FBF", "#F7B6C8", "#F4F9FB", "#FFFFFF", "#2D3A4A", "#6F7F90", "#DCE9F0", "#FFFFFF", "#2E4A63", "#EAF4FA"), fonts: { heading: "Baloo 2", body: "Nunito", script: "Baloo 2" }, radius: "pill", button: "pill", card: "raised", divider: "dots", decor: "floral", motion: "standard", grain: false, dark: false },
  },
  {
    slug: "saffron-deep", name: "Saffron & Sandalwood",
    description: "Saffron, sandalwood brown and warm ivory — the colours of a puja thali.",
    tokens: { colors: c("#B5470D", "#5A1E0B", "#E39B1A", "#FFF7E8", "#FFFCF4", "#2E1A0E", "#7D6551", "#EFDDBE", "#FFFFFF", "#2E1206", "#FBE9C8"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" }, radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "kasavu", motion: "standard", grain: true, dark: false },
  },
  {
    slug: "midnight-marigold", name: "Midnight Marigold",
    description: "A near-black night lit by marigold and ember. The festival after dark.",
    tokens: { colors: c("#F4A62A", "#FF7A3D", "#FFC857", "#0F0B14", "#181220", "#F6EBDD", "#B9AAA0", "#2E2234", "#1A1004", "#07050A", "#F6EBDD"), fonts: { heading: "Playfair Display", body: "Inter", script: "Playfair Display" }, radius: "soft", button: "solid", card: "outlined", divider: "ornament", decor: "geometric", motion: "rich", grain: true, dark: true },
  },
  {
    slug: "marigold-garden", name: "Marigold Garden",
    description: "Marigold orange, leaf green and cream. Flowers offered at a threshold.",
    tokens: { colors: c("#C26A1B", "#3F6B3A", "#E9A92E", "#FFF8EC", "#FFFDF7", "#33261A", "#7E6B58", "#F0E0C2", "#FFFFFF", "#3A2A16", "#FBEFD6"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Great Vibes" }, radius: "round", button: "pill", card: "flat", divider: "ornament", decor: "floral", motion: "calm", grain: false, dark: false },
  },
  {
    slug: "eucalyptus", name: "Eucalyptus",
    description: "Cool eucalyptus greens on a pale ground. Fresh, calm and professional.",
    tokens: { colors: c("#2F5D50", "#1D3A32", "#8DB596", "#F3F6F2", "#FFFFFF", "#16231F", "#5B6D66", "#D9E3DC", "#FFFFFF", "#17302A", "#E9F1EC"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Great Vibes" }, radius: "round", button: "pill", card: "flat", divider: "line", decor: "floral", motion: "calm", grain: false, dark: false },
  },
  {
    slug: "evening-grey", name: "Evening Grey",
    description: "Soft charcoal and warm stone. Quiet, dignified and easy on the eyes after dark.",
    tokens: { colors: c("#C9CDD3", "#9AA0A8", "#B8A98B", "#14171B", "#1B1F24", "#E6E7EA", "#A3A8B0", "#2A2F36", "#14171B", "#0C0E10", "#E6E7EA"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" }, radius: "none", button: "outline", card: "flat", divider: "line", decor: "none", motion: "calm", grain: false, dark: true },
  },
  {
    slug: "lily-white", name: "White Lily",
    description: "Pale grey-green, white and stone. The stillness of a garden of remembrance.",
    tokens: { colors: c("#6E7D74", "#3C4743", "#B9B29F", "#F7F7F4", "#FFFFFF", "#2A312E", "#707874", "#E0E3DE", "#FFFFFF", "#2D3733", "#EEF0EC"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" }, radius: "round", button: "outline", card: "flat", divider: "line", decor: "floral", motion: "calm", grain: false, dark: false },
  },
  {
    slug: "sandstone", name: "Sandstone",
    description: "Warm sand, umber and a muted gold, in a classic serif. Warm, human and quietly proud.",
    tokens: { colors: c("#5E4A3A", "#3D2F25", "#A48F73", "#F3EDE4", "#FBF8F3", "#2A211B", "#78685A", "#E2D8C9", "#FFFFFF", "#2B221B", "#F1E9DD"), fonts: { heading: "Playfair Display", body: "Inter", script: "Playfair Display" }, radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "none", motion: "calm", grain: false, dark: false },
  },
  {
    slug: "dusk-sandal", name: "Dusk & Sandal",
    description: "Muted sandalwood and soft gold with a still, formal hand. For a farewell that is traditional and restrained.",
    tokens: { colors: c("#5C4B3B", "#3A2E24", "#A58F6A", "#F5EFE6", "#FCF9F3", "#2A2119", "#7A6B5C", "#E3D9C8", "#FFFFFF", "#2A2119", "#F1E8DA"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" }, radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "none", motion: "calm", grain: true, dark: false },
  },
  {
    slug: "lime-ink", name: "Lime & Ink",
    description: "Off-white, black ink and one electric lime. A confident, modern milestone.",
    tokens: { colors: c("#111111", "#2B2B2B", "#B7E82F", "#F5F5EF", "#FFFFFF", "#111111", "#6A6A64", "#DEDED6", "#FFFFFF", "#0B0B0B", "#F5F5EF"), fonts: { heading: "Space Grotesk", body: "Inter", script: "Space Grotesk" }, radius: "none", button: "solid", card: "flat", divider: "line", decor: "minimal", motion: "standard", grain: false, dark: false },
  },
  // ── For My Love: one palette per mood ────────────────────────────────────────────────────────────────
  {
    slug: "love-blush", name: "Love · Blush",
    description: "Soft pink and peach with a handwritten script. Cute, warm and a little shy.",
    tokens: { colors: c("#E5738B", "#8C4B63", "#F6B8A8", "#FFF1F3", "#FFFAFB", "#4A2B38", "#8D6A77", "#F6D6DC", "#FFFFFF", "#5A2B40", "#FFE9ED"), fonts: { heading: "Fraunces", body: "Nunito", script: "Parisienne" }, radius: "round", button: "pill", card: "flat", divider: "dots", decor: "floral", motion: "standard", grain: false, dark: false },
  },
  {
    slug: "love-rose", name: "Love · Rose",
    description: "Deep rose and wine on warm paper. Romantic and unhurried.",
    tokens: { colors: c("#9B2C45", "#5A1A2B", "#D9A5A0", "#FBEFF0", "#FFF8F8", "#3A1A22", "#85606A", "#EBCDD0", "#FFFFFF", "#3A101D", "#FBE4E6"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Great Vibes" }, radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "floral", motion: "calm", grain: true, dark: false },
  },
  {
    slug: "love-dusk", name: "Love · Dusk",
    description: "Evening indigo, lilac and the last of the sunset. Emotional and close.",
    tokens: { colors: c("#D8C4E8", "#9B87C4", "#F0B8A0", "#1B1A33", "#25244A", "#F0EAF6", "#B5AECB", "#38366A", "#1B1A33", "#100F26", "#F0EAF6"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Great Vibes" }, radius: "round", button: "outline", card: "outlined", divider: "dots", decor: "minimal", motion: "calm", grain: false, dark: true },
  },
  {
    slug: "love-sorbet", name: "Love · Sorbet",
    description: "Watermelon, lemon and aqua on warm cream. Playful and bright.",
    tokens: { colors: c("#F0566E", "#00A6A6", "#FFC93C", "#FFF7EC", "#FFFFFF", "#33253B", "#7B6A84", "#F6E3C8", "#FFFFFF", "#33253B", "#FFF3DE"), fonts: { heading: "Baloo 2", body: "Nunito", script: "Parisienne" }, radius: "round", button: "pill", card: "raised", divider: "dots", decor: "floral", motion: "rich", grain: false, dark: false },
  },
  {
    slug: "love-noir", name: "Love · Noir",
    description: "Near-black with champagne light. Cinematic and intimate.",
    tokens: { colors: c("#E8C6A0", "#C9A27A", "#F2D7B6", "#0E0D10", "#17161A", "#F4EDE6", "#ABA29B", "#2A2830", "#14110D", "#070608", "#F4EDE6"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Pinyon Script" }, radius: "none", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "rich", grain: true, dark: true },
  },
  {
    slug: "love-paper", name: "Love · Paper",
    description: "Warm paper, black ink and one thread of terracotta. Plain and sincere.",
    tokens: { colors: c("#1E1B18", "#3A332D", "#B2563B", "#F6F2EA", "#FFFFFF", "#1E1B18", "#6F675E", "#E1D9CB", "#FFFFFF", "#171412", "#F4EEE4"), fonts: { heading: "Fraunces", body: "Inter", script: "Fraunces" }, radius: "none", button: "solid", card: "flat", divider: "line", decor: "none", motion: "calm", grain: true, dark: false },
  },
  {
    slug: "love-mist", name: "Love · Mist",
    description: "Cool grey-blue and warm stone, very still. For saying something difficult, gently.",
    tokens: { colors: c("#5B6F86", "#3C4A5C", "#B5A99A", "#EEF1F4", "#FAFBFC", "#28323E", "#6C7886", "#D9DFE6", "#FFFFFF", "#26303C", "#E8EDF2"), fonts: { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" }, radius: "soft", button: "outline", card: "flat", divider: "line", decor: "none", motion: "calm", grain: false, dark: false },
  },
];
