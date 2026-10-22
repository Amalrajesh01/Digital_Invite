import type { ThemeSeed } from "./themes";

/**
 * The palettes and type pairings of the twenty-five cinematic wedding templates. Each one starts from the colours the creative
 * brief names for its template (midnight blue and champagne, burgundy and antique gold, black and ivory …) and is tuned until
 * text, buttons and photographs read cleanly on it. Every theme can still be duplicated and recoloured in the Themes library.
 */
const c = (primary: string, secondary: string, accent: string, background: string, surface: string, text: string, muted: string, border: string, onPrimary: string, inverse: string, onInverse: string) => ({ primary, secondary, accent, background, surface, text, muted, border, onPrimary, inverse, onInverse });
type T = ThemeSeed["tokens"];
const tk = (colors: T["colors"], fonts: T["fonts"], o: Pick<T, "radius" | "button" | "card" | "divider" | "decor" | "motion" | "grain" | "dark">): T => ({ colors, fonts, ...o });

export const CINEMATIC_THEMES: ThemeSeed[] = [
  {
    slug: "midnight-champagne", name: "Midnight & Champagne",
    description: "Deep midnight blue, champagne highlights and warm ivory type. A romantic film at night.",
    tokens: tk(c("#E3CFA0", "#9FB0D8", "#D9BF8A", "#0D1530", "#141E40", "#F3EBDC", "#A9B2CC", "#2A365F", "#0D1530", "#070C1E", "#F3EBDC"), { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" }, { radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "calm", grain: true, dark: true }),
  },
  {
    slug: "burgundy-heritage", name: "Burgundy Heritage",
    description: "Burgundy, ivory, antique gold and forest green. A formal invitation that stays easy to read.",
    tokens: tk(c("#6B1B2A", "#1F4A37", "#B8913E", "#FAF4E6", "#FFFDF6", "#2B1A14", "#7A6355", "#E7D8B8", "#FFFFFF", "#3A0F18", "#F7E9CF"), { heading: "Marcellus", body: "Inter", script: "Cormorant Garamond" }, { radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "geometric", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "noir-ivory-editorial", name: "Black & Ivory Editorial",
    description: "Black ink on warm ivory with a thread of metallic grey. A magazine made for two.",
    tokens: tk(c("#0C0C0C", "#3A3835", "#A79B84", "#F5F1EA", "#FBF9F5", "#0C0C0C", "#6F6A62", "#D9D3C7", "#F5F1EA", "#0A0A0A", "#F1ECE3"), { heading: "Bodoni Moda", body: "Hanken Grotesk", script: "Bodoni Moda" }, { radius: "none", button: "underline", card: "flat", divider: "line", decor: "none", motion: "standard", grain: false, dark: false }),
  },
  {
    slug: "enchanted-sage", name: "Enchanted Sage",
    description: "Sage, cream and soft blush with a muted floral rose. A garden fairytale.",
    tokens: tk(c("#5F7D62", "#3E5A45", "#C88C97", "#FAF7EE", "#FFFEFA", "#2B3A2E", "#6D7A6A", "#E3E6D4", "#FFFFFF", "#2A3D30", "#F3F1E3"), { heading: "Cormorant Garamond", body: "Inter", script: "Great Vibes" }, { radius: "round", button: "pill", card: "flat", divider: "dots", decor: "floral", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "destination-dusk", name: "Destination Dusk",
    description: "Deep slate-teal, warm sand and terracotta: neutrals that sit quietly beside any landscape photograph.",
    tokens: tk(c("#20505C", "#183036", "#C27B52", "#F1EADB", "#FAF6EC", "#1F2B2E", "#5F6B68", "#DDD2BC", "#FFFFFF", "#10252B", "#F1EADB"), { heading: "Tenor Sans", body: "Jost", script: "Cormorant Garamond" }, { radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "standard", grain: true, dark: false }),
  },
  {
    slug: "old-money-ivory", name: "Old-Money Ivory",
    description: "Warm ivory, espresso brown, muted olive and soft black. Quiet luxury that needs no effects.",
    tokens: tk(c("#3A2A20", "#1E1B18", "#6B6B3E", "#F4EEDF", "#FAF6EA", "#241C16", "#756A5A", "#DDD3BC", "#F4EEDF", "#1E1B18", "#EFE7D4"), { heading: "EB Garamond", body: "Inter", script: "EB Garamond" }, { radius: "none", button: "underline", card: "flat", divider: "line", decor: "none", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "sepia-reel", name: "Sepia Reel",
    description: "Warm sepia, cream and muted brown over soft black. A restored romantic film.",
    tokens: tk(c("#7A5638", "#4B3626", "#A8743F", "#F3E8D2", "#FBF3E1", "#2A1F16", "#7C6853", "#DCC9A5", "#FFF8EA", "#231C16", "#F1E3C6"), { heading: "Libre Caslon Display", body: "Inter", script: "EB Garamond" }, { radius: "soft", button: "outline", card: "paper", divider: "dots", decor: "none", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "celestial-night", name: "Celestial Night",
    description: "Midnight blue, deep violet, champagne and soft ivory. A quiet sky with the two of you at its centre.",
    tokens: tk(c("#E5CFA0", "#8E7BD0", "#E5CFA0", "#0B1030", "#131A44", "#F2EEE6", "#A9AACB", "#2C3366", "#0B1030", "#060A22", "#F2EEE6"), { heading: "Italiana", body: "Inter", script: "Cormorant Garamond" }, { radius: "round", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "calm", grain: false, dark: true }),
  },
  {
    slug: "french-dusty-blue", name: "Dusty Blue & Rose",
    description: "Cream, dusty blue, warm beige and muted rose. A European romance in soft daylight.",
    tokens: tk(c("#5F7A91", "#3E5266", "#C38D96", "#F7F1E5", "#FDF9F0", "#2D3440", "#6F7885", "#E2DAC6", "#FFFFFF", "#2B3A4A", "#F5EEDF"), { heading: "Playfair Display", body: "Inter", script: "Parisienne" }, { radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "charcoal-chalk", name: "Charcoal & Chalk",
    description: "White, charcoal and warm grey with one accent you can change. Calm, confident and exact.",
    tokens: tk(c("#26262A", "#26262A", "#C4503A", "#FBFAF8", "#FFFFFF", "#26262A", "#7C7870", "#E4E1DA", "#FFFFFF", "#1E1E21", "#F4F2EE"), { heading: "Jost", body: "Inter", script: "Inter" }, { radius: "none", button: "solid", card: "flat", divider: "line", decor: "none", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "pearl-lavender", name: "Pearl & Lavender",
    description: "Pearl, soft blue, blush and muted lavender. Light as a held breath.",
    tokens: tk(c("#8E7BB8", "#5E5390", "#E6B8C8", "#F8F6FA", "#FFFFFF", "#3A3550", "#7C7896", "#E6E1EF", "#FFFFFF", "#2E2A4A", "#F4F0FA"), { heading: "Cormorant Garamond", body: "Inter", script: "Allura" }, { radius: "round", button: "pill", card: "flat", divider: "dots", decor: "floral", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "black-tie", name: "Black Tie",
    description: "Black, ivory and champagne with restrained metallic detail. An elegant evening.",
    tokens: tk(c("#D8C08E", "#A9A9A9", "#D8C08E", "#0A0A0B", "#131315", "#F4EFE4", "#A39D90", "#2A2A2D", "#0A0A0B", "#050506", "#F4EFE4"), { heading: "Playfair Display", body: "Inter", script: "Playfair Display" }, { radius: "none", button: "outline", card: "outlined", divider: "line", decor: "none", motion: "standard", grain: true, dark: true }),
  },
  {
    slug: "emerald-royal", name: "Emerald & Burgundy",
    description: "Deep emerald, ivory, burgundy and muted gold. Contemporary royalty without the weight.",
    tokens: tk(c("#0F5A47", "#6A1F2E", "#B89B4E", "#F8F3E6", "#FFFDF6", "#16251F", "#5C6A62", "#DED8BF", "#FFFFFF", "#0A2E25", "#F5EFD8"), { heading: "Prata", body: "Inter", script: "Cormorant Garamond" }, { radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "geometric", motion: "standard", grain: true, dark: false }),
  },
  {
    slug: "warm-ember", name: "Warm Neutrals & Ember",
    description: "Warm sand and soft brown with one cinematic ember accent you can change. Personal and intimate.",
    tokens: tk(c("#5A4636", "#3B2D22", "#C0663B", "#F3EBE0", "#FBF6EE", "#2B211A", "#7D6C5E", "#E0D2BF", "#FFF8EF", "#241A14", "#F2E6D6"), { heading: "Fraunces", body: "Inter", script: "Fraunces" }, { radius: "soft", button: "solid", card: "flat", divider: "line", decor: "none", motion: "standard", grain: true, dark: false }),
  },
  {
    slug: "golden-honey", name: "Honey & Terracotta",
    description: "Honey, warm ivory, terracotta and soft brown. A wedding photographed at golden hour.",
    tokens: tk(c("#B8603C", "#4A3426", "#D9A441", "#FBF4E4", "#FFFBF0", "#3A2A1E", "#85705C", "#EFDFBD", "#FFFFFF", "#3A2418", "#FBEBCB"), { heading: "DM Serif Display", body: "Inter", script: "Parisienne" }, { radius: "round", button: "solid", card: "flat", divider: "dots", decor: "minimal", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "noir-silver", name: "Noir & Silver",
    description: "Black, white and silver with a restrained warm accent. A black-and-white romantic film.",
    tokens: tk(c("#C8CCD2", "#8C9097", "#C9A27E", "#0A0A0A", "#141414", "#F7F7F7", "#9A9DA3", "#2B2B2D", "#0A0A0A", "#000000", "#F7F7F7"), { heading: "Instrument Serif", body: "Inter", script: "Instrument Serif" }, { radius: "none", button: "outline", card: "outlined", divider: "line", decor: "none", motion: "standard", grain: true, dark: true }),
  },
  {
    slug: "sea-and-sand", name: "Sea & Sand",
    description: "Sea blue, ivory, sand and muted green. Airy, relaxed and romantic.",
    tokens: tk(c("#3C7A94", "#2A5668", "#8DA58F", "#FAF6EC", "#FFFDF7", "#1F3440", "#667A84", "#E6DABF", "#FFFFFF", "#17323F", "#F4EFE2"), { heading: "Cormorant Garamond", body: "Jost", script: "Sacramento" }, { radius: "round", button: "pill", card: "flat", divider: "line", decor: "minimal", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "stone-atelier", name: "Stone & Charcoal",
    description: "Stone, ivory, charcoal and muted earth. Spatial, precise and confident.",
    tokens: tk(c("#2E2E30", "#4A4A4D", "#8A6B4F", "#F6F2EA", "#FBF8F2", "#2E2E30", "#77736B", "#D9D2C3", "#F6F2EA", "#222224", "#EEE9DD"), { heading: "Italiana", body: "Inter", script: "Italiana" }, { radius: "none", button: "solid", card: "outlined", divider: "line", decor: "geometric", motion: "standard", grain: false, dark: false }),
  },
  {
    slug: "rose-foliage", name: "Rose & Foliage",
    description: "Cream, soft rose and muted green with a deeper floral accent. Floral design as couture.",
    tokens: tk(c("#A8446A", "#6F8A6D", "#D69AA5", "#FBF6EE", "#FFFDF9", "#3A2A2E", "#8A6E73", "#EFDDDB", "#FFFFFF", "#3C2331", "#FBEAE9"), { heading: "Cormorant Garamond", body: "Inter", script: "Alex Brush" }, { radius: "round", button: "pill", card: "flat", divider: "ornament", decor: "floral", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "storybook-paper", name: "Storybook Paper",
    description: "Warm paper, muted ink, leaf green and burnt orange. A book that opens onto a wedding.",
    tokens: tk(c("#4F7F6D", "#2F3A4A", "#C0703A", "#F6ECD8", "#FCF5E6", "#2F3A4A", "#6E6A5C", "#E3D3B0", "#FFFFFF", "#27323F", "#F6ECD8"), { heading: "Fraunces", body: "Nunito", script: "Sacramento" }, { radius: "round", button: "solid", card: "paper", divider: "dots", decor: "floral", motion: "standard", grain: true, dark: false }),
  },
  {
    slug: "natural-light", name: "Natural Light",
    description: "Natural, slightly desaturated tones with deep green-grey ink. Authentic before it is decorative.",
    tokens: tk(c("#4E5A4C", "#2C342C", "#9A7B4F", "#EDE8DC", "#F6F2E8", "#1F2421", "#6B6F63", "#D8D2C0", "#FFFFFF", "#1B201C", "#EDE8DC"), { heading: "Special Elite", body: "Karla", script: "EB Garamond" }, { radius: "none", button: "underline", card: "flat", divider: "line", decor: "none", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "watercolour-blush", name: "Watercolour Blush",
    description: "Ivory, blush, sage and muted blue. Soft washes behind clear, quiet type.",
    tokens: tk(c("#5E7DA3", "#6F8F6F", "#D8A0A6", "#FBF8F2", "#FFFFFF", "#33383D", "#7D8590", "#EADFDA", "#FFFFFF", "#2F3C4C", "#F7EFEA"), { heading: "Cormorant Garamond", body: "Inter", script: "Allura" }, { radius: "round", button: "pill", card: "flat", divider: "dots", decor: "floral", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "luxe-neutrals", name: "Luxe Neutrals",
    description: "Stone, bone and near-black with a single brushed-bronze accent. A travel campaign for a wedding.",
    tokens: tk(c("#262626", "#4A4338", "#B38A5A", "#EFE9DD", "#F8F4EA", "#262626", "#756F64", "#D9D1C0", "#F8F4EA", "#1C1C1C", "#EFE9DD"), { heading: "Gloock", body: "Jost", script: "Cormorant Garamond" }, { radius: "none", button: "outline", card: "flat", divider: "line", decor: "none", motion: "standard", grain: true, dark: false }),
  },
  {
    slug: "premiere-red", name: "Premiere",
    description: "Black, deep red, champagne and ivory. A theatrical premiere for the two of you.",
    tokens: tk(c("#DCC48E", "#9E1B2C", "#DCC48E", "#0A0607", "#150C0E", "#F7F0E2", "#B5A896", "#32191D", "#0A0607", "#050203", "#F7F0E2"), { heading: "Bebas Neue", body: "Inter", script: "Cormorant Garamond" }, { radius: "none", button: "solid", card: "outlined", divider: "line", decor: "geometric", motion: "rich", grain: true, dark: true }),
  },
  {
    slug: "aurora-night", name: "Aurora",
    description: "Deep night with a luminous aqua and violet. Futuristic without feeling artificial; both accents can be changed.",
    tokens: tk(c("#7FE0D3", "#8B7BFF", "#7FE0D3", "#080C1C", "#101733", "#EEF2FA", "#9AA6C4", "#222C52", "#06101C", "#040715", "#EEF2FA"), { heading: "Outfit", body: "Inter", script: "Outfit" }, { radius: "soft", button: "pill", card: "outlined", divider: "none", decor: "minimal", motion: "rich", grain: false, dark: true }),
  },
];
