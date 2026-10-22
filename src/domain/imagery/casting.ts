import { STOCK } from "./stock";

/**
 * The image manifest of the cinematic wedding templates: which photograph plays which part in which template, and why.
 *
 * Every assignment is deliberate. A template's hero is chosen for the scene its opening promises (a night frame for the film, a
 * horizon for the coast, a window for France) and is never shared with another new template; supporting photographs are chosen
 * for the section they sit in. All of them come from the bundled stock set (`assets/stock`, Unsplash licence, credits in
 * `assets/stock/CREDITS.md`), so nothing is hot-linked and a missing file is caught by `npm run images:check`.
 *
 * To give a template better photography: copy the new file into `assets/stock/`, add it to `stock.ts` (alt text and focal point)
 * and to `CREDITS.md`, change its id here, and run `npm run images:check`. No component changes — photographs are named slots.
 * These are stand-ins for the demonstration invitations only; a customer's own uploads are never constrained by anything here.
 */
export interface Casting {
  hero: string;
  /** A landscape version for tablets and desktops (art direction), when the hero is a portrait. */
  wide?: string;
  bride: string;
  groom: string;
  story: string;
  venue: string;
  ceremony: string;
  /** Four photographs for the relationship milestones, in order. */
  milestones: [string, string, string, string];
  gallery: string[];
  /** What the opening frame must be, in a sentence — the brief the photograph was chosen against. */
  heroBrief: string;
}

const ROMANCE = ["6pUz0KMMCX4", "KiU1Du5pONA", "1cc4TpwK2fE", "AD3k4pko7wo", "NNNRQgsQXpE", "WHNWkO1lBKU", "IjdzkDxKjc4", "aen7e0u2UhA", "dYgv-1JnPTA", "TLBDWV7RRYI"];
const MONO = ["nBFagEIwy0o", "pLDDrRkLMWY", "M4RvX4uVb4w", "ZLmLOclfeE4", "vN2V5iunLc0", "YyvpmN6PB3I", "J3H-rth8cck", "y0OAmd_COUM", "464ps_nOflw", "q9GlHcaaSn4"];
const VENUES = ["ys_8FnQv6Is", "gofAFBM6Q7Y", "zyguVcuzeGM", "G5a1RNy55pw", "Gw2ODMZDeK4", "csK5XPO87lI", "pyd736FSNvk", "YKBT8rRAzpU", "NApm82co2l4", "0mYmjAkmScE"];
const DETAILS = ["9ceNKX2ZlT0", "zy6p2ibONaQ", "OmLrFODvPII", "THEJX2MIVPI", "YeJWDWeIZho", "PzmfTLaqPT0", "4ExHGkN7fzQ", "LQoCpIagZmc", "hYkOoi7z9sA", "PyL-lApI1F8"];
const FLORAL = ["PzmfTLaqPT0", "LQoCpIagZmc", "aauHMskRPa8", "4nN6aN45y7c", "z96DMIRABU0", "4ExHGkN7fzQ", "NNNRQgsQXpE", "xXHyI3ZRByo", "4KkTFccuZ0M", "csK5XPO87lI"];
const GOLDEN = ["AD3k4pko7wo", "WHNWkO1lBKU", "QoBHQuiu9N0", "NNNRQgsQXpE", "R9tPheZuGnA", "UpNwL3hTcRg", "TLBDWV7RRYI", "IjdzkDxKjc4", "FPVzkHF3wgM", "u2tgn9AA5uY"];
const COAST = ["FPVzkHF3wgM", "QoBHQuiu9N0", "IjdzkDxKjc4", "aen7e0u2UhA", "OYIMPsTYVbQ", "3pW91fGAKiE", "Jky1XZp--hI", "ch4Fc1cGTq4", "6ciLddToTgM", "bAwT-vSd46Y"];
const NIGHT = ["mrQ6Kmfa1jA", "6pUz0KMMCX4", "GAscwTkEOy8", "J3H-rth8cck", "B5AmTy1K6mk", "XKCo9N6gyS4", "Iv3yJpmOmZc", "J03oQgePJog", "M4RvX4uVb4w", "cRyUjYf6VBQ"];
const ROYAL = ["NApm82co2l4", "OQDYhr9HRNo", "2XXQkrL0k-Q", "BEdxXAiRfRM", "0mYmjAkmScE", "UX3-_dGbCzk", "fPFoUSKZGts", "GAFpZ63GEYs", "zyguVcuzeGM", "d9RsO9BHFVQ"];
const DOC = ["TLBDWV7RRYI", "cRyUjYf6VBQ", "464ps_nOflw", "0keyorgl820", "vN2V5iunLc0", "J03oQgePJog", "Iv3yJpmOmZc", "R1H2Y7T7m3I", "hZ8bAA8CjcA", "t8zrGJlSb0M"];
const VINTAGE = ["lj6_-FoCHng", "73OJLcahQHg", "9ceNKX2ZlT0", "YyvpmN6PB3I", "KiU1Du5pONA", "ZLmLOclfeE4", "0keyorgl820", "vN2V5iunLc0", "q9GlHcaaSn4", "t8zrGJlSb0M"];
const FASHION = ["z96DMIRABU0", "NApm82co2l4", "5gZDLuXQo-M", "qPFarjVIR8U", "DnJioJ8nhxI", "4ExHGkN7fzQ", "OmLrFODvPII", "nBFagEIwy0o", "mrQ6Kmfa1jA", "GAFpZ63GEYs"];

export const CASTING: Record<string, Casting> = {
  "love-story": { hero: "6pUz0KMMCX4", bride: "4ExHGkN7fzQ", groom: "5gZDLuXQo-M", story: "1cc4TpwK2fE", venue: "ys_8FnQv6Is", ceremony: "zyguVcuzeGM", milestones: ["THEJX2MIVPI", "OmLrFODvPII", "WHNWkO1lBKU", "aen7e0u2UhA"], gallery: ROMANCE,
    heroBrief: "A powerful romantic frame: a bride in a veil caught in a flare of light at night, the groom close behind. Faces in the upper half, room to the left for the title." },
  "royal-heritage-wedding": { hero: "NApm82co2l4", bride: "z96DMIRABU0", groom: "qPFarjVIR8U", story: "GAFpZ63GEYs", venue: "0mYmjAkmScE", ceremony: "7enPZgey7vE", milestones: ["fPFoUSKZGts", "RJDWzHyh6gE", "c9gbbHY_8RU", "BEdxXAiRfRM"], gallery: ROYAL,
    heroBrief: "A formal, architectural portrait: a bride in a full gown on chapel steps under a gold-and-glass gable. Symmetrical, grand, centred." },
  "fashion-editorial": { hero: "z96DMIRABU0", bride: "IiGkUvXXbig", groom: "DnJioJ8nhxI", story: "mrQ6Kmfa1jA", venue: "gofAFBM6Q7Y", ceremony: "NApm82co2l4", milestones: ["OmLrFODvPII", "sQcvXmxgPfw", "1cc4TpwK2fE", "THEJX2MIVPI"], gallery: FASHION,
    heroBrief: "A cover portrait: a bride in a sculptural gown beneath a draped arch, a clean pale ground the cover type can sit on." },
  "enchanted-garden": { hero: "NNNRQgsQXpE", bride: "LQoCpIagZmc", groom: "LMWaGpIyOTs", story: "xXHyI3ZRByo", venue: "4KkTFccuZ0M", ceremony: "csK5XPO87lI", milestones: ["TLBDWV7RRYI", "R9tPheZuGnA", "THEJX2MIVPI", "4nN6aN45y7c"], gallery: FLORAL,
    heroBrief: "A couple embracing beneath a weeping willow in golden light: soft, green and unposed, faces readable inside an oval crop." },
  "destination-film": { hero: "aen7e0u2UhA", bride: "4ExHGkN7fzQ", groom: "c9gbbHY_8RU", story: "Jky1XZp--hI", venue: "G5a1RNy55pw", ceremony: "Gw2ODMZDeK4", milestones: ["OYIMPsTYVbQ", "3pW91fGAKiE", "QoBHQuiu9N0", "FPVzkHF3wgM"], gallery: COAST,
    heroBrief: "A couple at the edge of a lake under a wide, cloudy sky: the landscape is the subject and the couple is small and calm in it." },
  "old-money-romance": { hero: "t8zrGJlSb0M", bride: "4ExHGkN7fzQ", groom: "5gZDLuXQo-M", story: "THEJX2MIVPI", venue: "gofAFBM6Q7Y", ceremony: "zyguVcuzeGM", milestones: ["9ceNKX2ZlT0", "KiU1Du5pONA", "0keyorgl820", "YKBT8rRAzpU"], gallery: ["t8zrGJlSb0M", "KiU1Du5pONA", "THEJX2MIVPI", "YKBT8rRAzpU", "PyL-lApI1F8", "ys_8FnQv6Is", "0keyorgl820", "1cc4TpwK2fE"],
    heroBrief: "Quiet and composed: two people in classic dress at an old doorway, nothing else in the frame. A portrait that needs no effect." },
  "vintage-film-romance": { hero: "lj6_-FoCHng", bride: "_G7UyLmY1tc", groom: "qPFarjVIR8U", story: "73OJLcahQHg", venue: "zyguVcuzeGM", ceremony: "coWejNeBFhE", milestones: ["73OJLcahQHg", "9ceNKX2ZlT0", "YyvpmN6PB3I", "vN2V5iunLc0"], gallery: VINTAGE,
    heroBrief: "A couple beside a vintage car outside an old church: period detail in the frame, warm tones that take a sepia treatment without losing faces." },
  "celestial-love-story": { hero: "cRyUjYf6VBQ", bride: "4ExHGkN7fzQ", groom: "qPFarjVIR8U", story: "WHNWkO1lBKU", venue: "UpNwL3hTcRg", ceremony: "G5a1RNy55pw", milestones: ["GAscwTkEOy8", "B5AmTy1K6mk", "cRyUjYf6VBQ", "bAwT-vSd46Y"], gallery: NIGHT,
    heroBrief: "A couple back to back on a hilltop under a darkening sky: cool dusk tones that sit naturally inside a circular orbit crop." },
  "french-romantic-escape": { hero: "KiU1Du5pONA", bride: "IiGkUvXXbig", groom: "c9gbbHY_8RU", story: "t8zrGJlSb0M", venue: "QPL_171Kf5Q", ceremony: "zyguVcuzeGM", milestones: ["OmLrFODvPII", "PzmfTLaqPT0", "hDzql_ITjmY", "6ciLddToTgM"], gallery: ["KiU1Du5pONA", "t8zrGJlSb0M", "q9GlHcaaSn4", "PzmfTLaqPT0", "csK5XPO87lI", "hDzql_ITjmY", "6ciLddToTgM", "zyguVcuzeGM", "ouh94xUqOHk", "9ceNKX2ZlT0"],
    heroBrief: "A kiss before an old church wall on cobbles, the gown sweeping the stones: European, architectural, tall enough for an arched window." },
  "modern-minimalist": { hero: "THEJX2MIVPI", bride: "IiGkUvXXbig", groom: "5gZDLuXQo-M", story: "1cc4TpwK2fE", venue: "gofAFBM6Q7Y", ceremony: "ys_8FnQv6Is", milestones: ["zy6p2ibONaQ", "OmLrFODvPII", "YeJWDWeIZho", "9ceNKX2ZlT0"], gallery: DETAILS,
    heroBrief: "A bright, uncluttered vertical detail — two hands, two rings, white roses — that reads at the width of a narrow strip." },
  "dreamlike-fairytale": { hero: "dYgv-1JnPTA", bride: "_G7UyLmY1tc", groom: "LMWaGpIyOTs", story: "R9tPheZuGnA", venue: "csK5XPO87lI", ceremony: "Gw2ODMZDeK4", milestones: ["R9tPheZuGnA", "UpNwL3hTcRg", "3pW91fGAKiE", "xXHyI3ZRByo"], gallery: ["dYgv-1JnPTA", "R9tPheZuGnA", "UpNwL3hTcRg", "3pW91fGAKiE", "xXHyI3ZRByo", "NNNRQgsQXpE", "4nN6aN45y7c", "LQoCpIagZmc"],
    heroBrief: "A laughing bride in a lace veil in golden evening light, soft enough to feather into a wash of colour." },
  "black-tie-gala": { hero: "mrQ6Kmfa1jA", bride: "z96DMIRABU0", groom: "qPFarjVIR8U", story: "6pUz0KMMCX4", venue: "pyd736FSNvk", ceremony: "BEdxXAiRfRM", milestones: ["ch4Fc1cGTq4", "6ciLddToTgM", "mrQ6Kmfa1jA", "GAscwTkEOy8"], gallery: NIGHT,
    heroBrief: "A couple dancing close in a lamp-lit hall: low key, one warm source, the rest falling into shadow." },
  "modern-royal-romance": { hero: "OQDYhr9HRNo", wide: "2XXQkrL0k-Q", bride: "z96DMIRABU0", groom: "qPFarjVIR8U", story: "GAFpZ63GEYs", venue: "BEdxXAiRfRM", ceremony: "0mYmjAkmScE", milestones: ["fPFoUSKZGts", "d9RsO9BHFVQ", "NApm82co2l4", "UX3-_dGbCzk"], gallery: ROYAL,
    heroBrief: "A couple beneath a glowing arch of lights against a dramatic sky: grand, celebratory and still contemporary." },
  "cinematic-proposal": { hero: "sQcvXmxgPfw", bride: "4ExHGkN7fzQ", groom: "c9gbbHY_8RU", story: "OmLrFODvPII", venue: "G5a1RNy55pw", ceremony: "ys_8FnQv6Is", milestones: ["QoBHQuiu9N0", "TLBDWV7RRYI", "sQcvXmxgPfw", "zy6p2ibONaQ"], gallery: ["sQcvXmxgPfw", "OmLrFODvPII", "zy6p2ibONaQ", "THEJX2MIVPI", "QoBHQuiu9N0", "TLBDWV7RRYI", "1cc4TpwK2fE", "AD3k4pko7wo", "9ceNKX2ZlT0", "jt2iZ0ARWoY"],
    heroBrief: "Suspense: a hand offering a ring in warm, blurred evening light. The question has been asked but the answer is not yet in the frame." },
  "golden-hour-romance": { hero: "AD3k4pko7wo", wide: "QoBHQuiu9N0", bride: "dYgv-1JnPTA", groom: "LMWaGpIyOTs", story: "WHNWkO1lBKU", venue: "Gw2ODMZDeK4", ceremony: "NNNRQgsQXpE", milestones: ["TLBDWV7RRYI", "IjdzkDxKjc4", "FPVzkHF3wgM", "u2tgn9AA5uY"], gallery: GOLDEN,
    heroBrief: "Foreheads together, backlit by a low gold sun: warm, intimate and glowing, with the light flaring at the edge of the frame." },
  "noir-romance": { hero: "nBFagEIwy0o", bride: "ZLmLOclfeE4", groom: "5gZDLuXQo-M", story: "pLDDrRkLMWY", venue: "YyvpmN6PB3I", ceremony: "q9GlHcaaSn4", milestones: ["pLDDrRkLMWY", "M4RvX4uVb4w", "y0OAmd_COUM", "J3H-rth8cck"], gallery: MONO,
    heroBrief: "A black-and-white frame of a couple laughing, her arms around him from behind: high contrast, unretouched joy." },
  "coastal-romance": { hero: "QoBHQuiu9N0", wide: "FPVzkHF3wgM", bride: "IiGkUvXXbig", groom: "LMWaGpIyOTs", story: "IjdzkDxKjc4", venue: "G5a1RNy55pw", ceremony: "Gw2ODMZDeK4", milestones: ["FPVzkHF3wgM", "aen7e0u2UhA", "OYIMPsTYVbQ", "3pW91fGAKiE"], gallery: COAST,
    heroBrief: "A wide, light landscape: a couple walking hand in hand toward a low sun under a big pale sky, with room along the horizon for the names." },
  "architectural-wedding": { hero: "ys_8FnQv6Is", bride: "NApm82co2l4", groom: "qPFarjVIR8U", story: "gofAFBM6Q7Y", venue: "gofAFBM6Q7Y", ceremony: "ys_8FnQv6Is", milestones: ["gofAFBM6Q7Y", "zyguVcuzeGM", "G5a1RNy55pw", "0mYmjAkmScE"], gallery: VENUES,
    heroBrief: "Architecture first: a timber-and-glass chapel whose ribs sweep toward a bride and groom at the end of the aisle." },
  "floral-couture": { hero: "PzmfTLaqPT0", bride: "4ExHGkN7fzQ", groom: "LMWaGpIyOTs", story: "LQoCpIagZmc", venue: "4KkTFccuZ0M", ceremony: "csK5XPO87lI", milestones: ["aauHMskRPa8", "4nN6aN45y7c", "PzmfTLaqPT0", "z96DMIRABU0"], gallery: FLORAL,
    heroBrief: "Calla lilies bound with ribbon and two hands: a floral still life that is also a portrait, cream and green on a pale ground." },
  "animated-storybook": { hero: "9ceNKX2ZlT0", bride: "IiGkUvXXbig", groom: "c9gbbHY_8RU", story: "73OJLcahQHg", venue: "4KkTFccuZ0M", ceremony: "SrWVeL5DyNM", milestones: ["73OJLcahQHg", "9ceNKX2ZlT0", "YeJWDWeIZho", "heNLI144X7Y"], gallery: ["9ceNKX2ZlT0", "73OJLcahQHg", "YeJWDWeIZho", "zy6p2ibONaQ", "heNLI144X7Y", "OmLrFODvPII", "4KkTFccuZ0M", "csK5XPO87lI"],
    heroBrief: "Two rings resting on an open book: the first page of the story, warm and close, with space around it for a plate frame." },
  "documentary-wedding": { hero: "TLBDWV7RRYI", bride: "IiGkUvXXbig", groom: "LMWaGpIyOTs", story: "0keyorgl820", venue: "pyd736FSNvk", ceremony: "SrWVeL5DyNM", milestones: ["cRyUjYf6VBQ", "464ps_nOflw", "J03oQgePJog", "vN2V5iunLc0"], gallery: DOC,
    heroBrief: "Candid and unposed: a couple standing close among autumn leaves, laughing mid-sentence, natural colour, no styling." },
  "romantic-watercolour": { hero: "4ExHGkN7fzQ", bride: "_G7UyLmY1tc", groom: "c9gbbHY_8RU", story: "PzmfTLaqPT0", venue: "csK5XPO87lI", ceremony: "4KkTFccuZ0M", milestones: ["LQoCpIagZmc", "aauHMskRPa8", "9ceNKX2ZlT0", "4nN6aN45y7c"], gallery: FLORAL,
    heroBrief: "A bridal bouquet and veil in soft, muted light: pale tones that read well when feathered into a wash." },
  "luxury-destination": { hero: "OYIMPsTYVbQ", bride: "IiGkUvXXbig", groom: "LMWaGpIyOTs", story: "u2tgn9AA5uY", venue: "FPVzkHF3wgM", ceremony: "G5a1RNy55pw", milestones: ["3pW91fGAKiE", "bAwT-vSd46Y", "ch4Fc1cGTq4", "Jky1XZp--hI"], gallery: COAST,
    heroBrief: "A harbour at golden hour seen over the rim of a champagne glass: the travel-campaign frame that says where, before it says who." },
  "epic-premiere": { hero: "J03oQgePJog", bride: "z96DMIRABU0", groom: "qPFarjVIR8U", story: "mrQ6Kmfa1jA", venue: "BEdxXAiRfRM", ceremony: "7enPZgey7vE", milestones: ["Iv3yJpmOmZc", "XKCo9N6gyS4", "J03oQgePJog", "mrQ6Kmfa1jA"], gallery: NIGHT,
    heroBrief: "The kiss, with the whole room applauding around it: crowd, colour and movement, a billboard frame with the couple at its centre." },
  "infinite-love": { hero: "WHNWkO1lBKU", wide: "aen7e0u2UhA", bride: "dYgv-1JnPTA", groom: "5gZDLuXQo-M", story: "AD3k4pko7wo", venue: "G5a1RNy55pw", ceremony: "ys_8FnQv6Is", milestones: ["GAscwTkEOy8", "XKCo9N6gyS4", "WHNWkO1lBKU", "3pW91fGAKiE"], gallery: [...GOLDEN.slice(0, 4), ...NIGHT.slice(0, 4), "3pW91fGAKiE", "XKCo9N6gyS4"],
    heroBrief: "Foreheads together, a sun flare glowing behind: luminous and warm so a cool accent can sit against it." },
};

export type ImageRole = "hero" | "heroWide" | "bride" | "groom" | "story" | "venue" | "ceremony" | "milestone" | "gallery" | "closing";

/** The aspect ratios each role is cropped to by its slot (`imagery/slots.ts`), and the range of source ratios that crop cleanly. */
export const ROLE_RATIO: Record<ImageRole, { crop: string; min: number; max: number }> = {
  hero: { crop: "2:3", min: 0.55, max: 1.9 }, heroWide: { crop: "16:9", min: 1.3, max: 2.6 }, bride: { crop: "4:5", min: 0.5, max: 2.2 }, groom: { crop: "4:5", min: 0.5, max: 2.2 },
  story: { crop: "4:5", min: 0.5, max: 2.2 }, venue: { crop: "16:9", min: 0.5, max: 2.6 }, ceremony: { crop: "3:2", min: 0.5, max: 2.6 }, milestone: { crop: "4:5", min: 0.5, max: 2.6 }, gallery: { crop: "any", min: 0.4, max: 2.6 }, closing: { crop: "2:3", min: 0.55, max: 2.2 },
};

export interface ManifestEntry {
  templateId: string;
  sectionId: string;
  assetType: ImageRole;
  provider: "unsplash" | "wikimedia";
  /** The file in assets/stock/ (without extension) and the page that carries its licence. */
  stock: string;
  sourceUrl: string;
  alt: string;
  aspectRatio: string;
  focalPoint: { x: number; y: number };
  /** `verified` = the id is listed in CREDITS.md under the licence named there. */
  licenceStatus: "verified" | "unverified";
  usage: "demo-template";
  /** What the photograph is for, in a sentence. */
  purpose: string;
}

const SECTION: Record<ImageRole, string> = { hero: "hero", heroWide: "hero", bride: "couple", groom: "couple", story: "story", venue: "venue", ceremony: "ceremonies", milestone: "story", gallery: "gallery", closing: "thankyou" };
const PURPOSE: Record<ImageRole, string> = {
  hero: "The opening frame.", heroWide: "The opening frame on tablets and desktops.", bride: "The bride's introduction in “Meet the couple”.", groom: "The groom's introduction in “Meet the couple”.",
  story: "Beside the opening lines of the story.", venue: "The venue and its directions.", ceremony: "The ceremony banner.", milestone: "A relationship milestone.", gallery: "The gallery.", closing: "The closing scene.",
};

export const stockSource = (id: string) => (id.startsWith("wc-") ? `https://commons.wikimedia.org/wiki/Special:Search?search=${id}` : `https://unsplash.com/photos/${id}`);

/** Every part a photograph plays in one template. A photograph may appear in several parts of the same template (the hero also opens the gallery). */
export function manifestFor(templateId: string, creditedIds: ReadonlySet<string> = new Set()): ManifestEntry[] {
  const c = CASTING[templateId];
  if (!c) return [];
  const rows: [ImageRole, string][] = [
    ["hero", c.hero], ...(c.wide ? [["heroWide", c.wide] as [ImageRole, string]] : []), ["bride", c.bride], ["groom", c.groom], ["story", c.story], ["venue", c.venue], ["ceremony", c.ceremony],
    ...c.milestones.map((m): [ImageRole, string] => ["milestone", m]), ...c.gallery.map((g): [ImageRole, string] => ["gallery", g]), ["closing", c.hero],
  ];
  return rows.map(([role, stock]) => {
    const info = STOCK[stock];
    return {
      templateId, sectionId: SECTION[role], assetType: role, provider: stock.startsWith("wc-") ? "wikimedia" : "unsplash", stock, sourceUrl: stockSource(stock), alt: info?.alt ?? "",
      aspectRatio: ROLE_RATIO[role].crop, focalPoint: { x: (info?.focal?.x ?? 50) / 100, y: (info?.focal?.y ?? 50) / 100 }, licenceStatus: creditedIds.has(stock) ? "verified" : "unverified", usage: "demo-template",
      purpose: role === "hero" ? c.heroBrief : PURPOSE[role],
    };
  });
}

/** The stock photographs a template's demonstration invitation needs, once each. */
export const castingIds = (templateId: string): string[] => [...new Set(manifestFor(templateId).map((e) => e.stock))];
