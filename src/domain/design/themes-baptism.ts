import type { ThemeSeed } from "./themes";

/**
 * The palettes and type pairings of the twenty baptism templates. Each one is drawn from the light its template is named for — a
 * pale sky, a candle-lit nave, a kasavu border, morning gold, a lily — and tuned until text, buttons and photographs read cleanly on it.
 * Every theme can still be duplicated and recoloured in the Themes library.
 */
const c = (primary: string, secondary: string, accent: string, background: string, surface: string, text: string, muted: string, border: string, onPrimary: string, inverse: string, onInverse: string) => ({ primary, secondary, accent, background, surface, text, muted, border, onPrimary, inverse, onInverse });
type T = ThemeSeed["tokens"];
const tk = (colors: T["colors"], fonts: T["fonts"], o: Pick<T, "radius" | "button" | "card" | "divider" | "decor" | "motion" | "grain" | "dark">): T => ({ colors, fonts, ...o });

export const BAPTISM_THEMES: ThemeSeed[] = [
  {
    slug: "bp-sky-grace", name: "Sky & Grace",
    description: "Cloud white, soft sky blue and a thread of pale gold. Light coming through a high window.",
    tokens: tk(c("#4F73A8", "#A8BCD8", "#C9A757", "#F3F6FB", "#FFFFFF", "#1E2A44", "#5E6B87", "#DDE5F1", "#FFFFFF", "#14203A", "#F4F7FC"), { heading: "Italiana", body: "Inter", script: "Cormorant Garamond" }, { radius: "round", button: "outline", card: "flat", divider: "line", decor: "minimal", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "bp-dawn-rose", name: "Dawn Rose",
    description: "Dusty rose, warm ivory and antique gold. The first warm light on a white wall.",
    tokens: tk(c("#A9625C", "#E8CDBE", "#B98F3E", "#FBF3EC", "#FFFAF5", "#3B2B2E", "#7E6266", "#EBD8CB", "#FFFFFF", "#2E1D22", "#FBEFE3"), { heading: "Prata", body: "Jost", script: "Pinyon Script" }, { radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "minimal", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "bp-living-water", name: "Living Water",
    description: "Aqua, sea-glass and white with a little pale gold. Still water catching the light.",
    tokens: tk(c("#2A7482", "#8FC4C9", "#B99B55", "#EEF6F6", "#FAFFFF", "#12343B", "#4F7077", "#CFE3E4", "#FFFFFF", "#0B2A31", "#E8F5F5"), { heading: "Jost", body: "Karla", script: "Cormorant Garamond" }, { radius: "round", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "standard", grain: false, dark: false }),
  },
  {
    slug: "bp-kasavu-cross", name: "Kasavu & Cross",
    description: "Cream, antique gold and forest green: the kasavu border, the lamp and a Nasrani cross.",
    tokens: tk(c("#7A5A12", "#1F4A37", "#B8913E", "#FAF4E3", "#FFFDF6", "#2B2316", "#6C6048", "#E6D6AE", "#FFFFFF", "#1E3A2B", "#F6EBCB"), { heading: "Marcellus", body: "Mulish", script: "Cormorant Garamond" }, { radius: "soft", button: "solid", card: "paper", divider: "ornament", decor: "kasavu", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "bp-little-prince", name: "Little Prince",
    description: "Royal blue, powder blue and a small crown of gold. A storybook for a very new prince.",
    tokens: tk(c("#2F4C85", "#9DB5DA", "#C9A54A", "#F1F5FA", "#FFFFFF", "#1C2B4A", "#5C6A86", "#D9E2F0", "#FFFFFF", "#14234A", "#EEF3FB"), { heading: "DM Serif Display", body: "Nunito", script: "Sacramento" }, { radius: "round", button: "solid", card: "outlined", divider: "dots", decor: "minimal", motion: "standard", grain: false, dark: false }),
  },
  {
    slug: "bp-little-princess", name: "Little Princess",
    description: "Blush, ivory and rose gold. A garland of tiny flowers for a very new princess.",
    tokens: tk(c("#B26B74", "#F0CDD0", "#B88E5B", "#FDF4F3", "#FFFBFA", "#44292F", "#8A646B", "#F1D9DB", "#FFFFFF", "#3A1E26", "#FDEFEC"), { heading: "Playfair Display", body: "Mulish", script: "Great Vibes" }, { radius: "round", button: "pill", card: "outlined", divider: "ornament", decor: "floral", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "bp-sepia-olive", name: "Sepia & Olive",
    description: "Old paper, walnut and olive. The colours of a family photograph kept in a Bible.",
    tokens: tk(c("#646234", "#8B5E3C", "#AE833A", "#F6EFE1", "#FCF8EE", "#2E2619", "#74664D", "#E2D5B8", "#FFFFFF", "#2A2417", "#F4EAD3"), { heading: "Libre Caslon Display", body: "Karla", script: "EB Garamond" }, { radius: "soft", button: "outline", card: "paper", divider: "dots", decor: "minimal", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "bp-nave-gold", name: "Nave & Candle Gold",
    description: "Deep midnight blue and the gold of candle flame. A church after dark, lit from within.",
    tokens: tk(c("#E3BE6B", "#7C8BC4", "#F0D28A", "#0F1424", "#171D33", "#F1E9D6", "#A9A8B8", "#2A3354", "#1B1406", "#080B16", "#F1E9D6"), { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" }, { radius: "soft", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "calm", grain: true, dark: true }),
  },
  {
    slug: "bp-dove-sage", name: "Dove & Sage",
    description: "White, silver-grey and sage with an olive-green thread. Quiet, airy and kind.",
    tokens: tk(c("#5F7C6C", "#B9C6BE", "#A98F55", "#F7F8F6", "#FFFFFF", "#25302B", "#62736A", "#E0E6E1", "#FFFFFF", "#1F2A25", "#F2F6F3"), { heading: "Tenor Sans", body: "Jost", script: "Allura" }, { radius: "round", button: "outline", card: "flat", divider: "line", decor: "minimal", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "bp-parchment-ink", name: "Parchment & Ink",
    description: "Parchment, walnut ink and burgundy. A page that has been read many times.",
    tokens: tk(c("#6E1F2B", "#3A2A1C", "#A98233", "#F3EAD6", "#FAF3E2", "#2A1F16", "#74634E", "#DCCBA6", "#FFFFFF", "#261A12", "#F2E6CB"), { heading: "EB Garamond", body: "Inter", script: "EB Garamond" }, { radius: "none", button: "solid", card: "paper", divider: "ornament", decor: "geometric", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "bp-lily-white", name: "Lily White",
    description: "Lily white, sage green and the faintest blush. A stem of lilies in a window.",
    tokens: tk(c("#5F8062", "#E9C9C6", "#B98676", "#FBF8F3", "#FFFFFF", "#2B3A30", "#65765F", "#E8E3D6", "#FFFFFF", "#24342A", "#F5F1E6"), { heading: "Bodoni Moda", body: "Hanken Grotesk", script: "Pinyon Script" }, { radius: "soft", button: "pill", card: "flat", divider: "ornament", decor: "floral", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "bp-morning-gold", name: "Morning Gold",
    description: "Honey, peach and sunrise amber over warm cream. The first hour of a long day.",
    tokens: tk(c("#A8630A", "#F2C46A", "#C26A2B", "#FFF6E5", "#FFFBF0", "#3A2A12", "#7F6540", "#F0DDB4", "#FFFFFF", "#2E1E0B", "#FFF1D6"), { heading: "Fraunces", body: "Nunito", script: "Sacramento" }, { radius: "round", button: "solid", card: "outlined", divider: "dots", decor: "minimal", motion: "standard", grain: false, dark: false }),
  },
  {
    slug: "bp-shepherd-sand", name: "Shepherd Sand",
    description: "Sand, olive and a soft sky blue. The colours of a hillside and an open hand.",
    tokens: tk(c("#566F52", "#A9BFD1", "#B8974C", "#F7F1E5", "#FDFAF2", "#2D2A20", "#6F6A54", "#E4DAC0", "#FFFFFF", "#263322", "#F4EEDD"), { heading: "Instrument Serif", body: "Mulish", script: "Instrument Serif" }, { radius: "soft", button: "outline", card: "paper", divider: "dots", decor: "minimal", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "bp-garden-green", name: "Garden Green",
    description: "Leaf green, new-grass and a little sunlight yellow. A walled garden on a spring morning.",
    tokens: tk(c("#436F37", "#A8C686", "#C9A83E", "#F5F7EC", "#FDFEF7", "#22331F", "#5B6D54", "#DDE6C8", "#FFFFFF", "#1B2E19", "#EDF3DB"), { heading: "Gloock", body: "Karla", script: "Parisienne" }, { radius: "round", button: "solid", card: "outlined", divider: "ornament", decor: "floral", motion: "standard", grain: false, dark: false }),
  },
  {
    slug: "bp-burgundy-gold", name: "Burgundy & Gold",
    description: "Burgundy, gold leaf and ivory. The vestments, the altar cloth and the candlesticks.",
    tokens: tk(c("#7B1E2E", "#3B1218", "#B88F34", "#FAF3E7", "#FFFCF5", "#2D1A1C", "#745A5A", "#E8D5B4", "#FFFFFF", "#3B0F18", "#F8E8C8"), { heading: "Cinzel", body: "Mulish", script: "Cormorant Garamond" }, { radius: "none", button: "solid", card: "paper", divider: "ornament", decor: "geometric", motion: "calm", grain: true, dark: false }),
  },
  {
    slug: "bp-stone-line", name: "Stone & Line",
    description: "Stone white, charcoal and a single hair of gold. Nothing that does not earn its place.",
    tokens: tk(c("#1B1B1B", "#8C8A84", "#A68F5E", "#F4F3F0", "#FFFFFF", "#1B1B1B", "#68685F", "#DEDCD6", "#FFFFFF", "#111111", "#F4F3F0"), { heading: "DM Sans", body: "DM Sans", script: "Cormorant Garamond" }, { radius: "none", button: "underline", card: "flat", divider: "line", decor: "none", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "bp-oatmeal-blue", name: "Oatmeal & Blue",
    description: "Oatmeal, butter and a pale blue-grey. A small, soft thing handled with both hands.",
    tokens: tk(c("#587890", "#E9DFC7", "#B99A55", "#FAF6EE", "#FFFDF8", "#3C3A33", "#77736A", "#E8E0CE", "#FFFFFF", "#2C3640", "#F4EFE3"), { heading: "Cormorant Garamond", body: "Nunito", script: "Cormorant Garamond" }, { radius: "round", button: "outline", card: "flat", divider: "dots", decor: "minimal", motion: "calm", grain: false, dark: false }),
  },
  {
    slug: "bp-terracotta-olive", name: "Terracotta & Olive",
    description: "Terracotta, olive and warm cream. A long table with three generations round it.",
    tokens: tk(c("#A5502F", "#6C7A4A", "#B88B3C", "#FAF1E6", "#FFFAF2", "#3A261C", "#7A5E50", "#EBD7C0", "#FFFFFF", "#3A1E14", "#F8E9D6"), { heading: "Fraunces", body: "Hanken Grotesk", script: "Fraunces" }, { radius: "round", button: "solid", card: "paper", divider: "dots", decor: "minimal", motion: "standard", grain: true, dark: false }),
  },
  {
    slug: "bp-dusk-promise", name: "Dusk & Promise",
    description: "Indigo dusk, candle gold and the faintest rose. The sky after rain, with the first light of a promise.",
    tokens: tk(c("#E8CE8F", "#8E9AD6", "#E8B7A4", "#151A3A", "#1E2550", "#F0ECE2", "#A9ADCB", "#2D3568", "#1A1630", "#0C1030", "#F0ECE2"), { heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" }, { radius: "round", button: "outline", card: "outlined", divider: "line", decor: "minimal", motion: "calm", grain: false, dark: true }),
  },
  {
    slug: "bp-new-dawn", name: "New Dawn",
    description: "Deep navy, dawn peach and warm gold over cream. Night giving way, door by door.",
    tokens: tk(c("#1F2E5C", "#E9A97A", "#C99B3F", "#FBF5EC", "#FFFDF8", "#1F2742", "#686D8C", "#EADFCB", "#FFFFFF", "#111A3B", "#FBF1DD"), { heading: "Playfair Display", body: "Inter", script: "Cormorant Garamond" }, { radius: "soft", button: "solid", card: "outlined", divider: "ornament", decor: "minimal", motion: "standard", grain: true, dark: false }),
  },
];
