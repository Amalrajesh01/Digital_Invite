import type { PhotoSrc } from "./types";

/**
 * The photographs bundled with Forever Letters: the atmosphere behind each experience, and the stand-in pictures its public
 * demonstration shows. They are processed from the licensed originals in `assets/stock/` by `npm run letters:images` (a 2:3 crop
 * on the focal point, WebP) and served from `public/letters/photos/`. Nothing is hot-linked.
 *
 * A real letter always uses its sender's own photographs for anything personal; these only ever supply mood. `people: true` marks a
 * photograph in which someone can be recognised: it may stand in for a couple in a demonstration but is never the backdrop of a
 * serious or closing letter. `npm run letters:check` verifies every file, size, ratio, description and licence.
 */
export interface LetterImage {
  id: string;
  /** The id of the original in `assets/stock/` (an Unsplash photo id, or `wc-<pageid>` for Wikimedia Commons). */
  ref: string;
  alt: string;
  focal: { x: number; y: number };
  author: string;
  licence: string;
  people?: boolean;
}

const U = "Unsplash License";
const i = (id: string, ref: string, author: string, licence: string, alt: string, x = 50, y = 50, people = false): LetterImage => ({ id, ref, alt, focal: { x, y }, author, licence, people });

export const LETTER_IMAGES: LetterImage[] = [
  // ── warm, hopeful, golden light ──
  i("walk-sunset", "QoBHQuiu9N0", "Eldar Nazarov", U, "Two people walking hand in hand across an open field towards a low, glowing sun", 50, 50, true),
  i("field-walk", "IjdzkDxKjc4", "Micah Sammie Chaffin", U, "A couple walking through tall dry grass under a soft, overcast evening sky", 45, 50, true),
  i("glow-embrace", "WHNWkO1lBKU", "Nataliia Hordiiuk", U, "A couple resting their foreheads together, the low sun flaring behind them", 52, 40, true),
  i("yellow-field", "xXHyI3ZRByo", "Brooke Balentine", U, "A couple holding hands as they walk through a field of yellow flowers", 50, 60, true),
  i("forest-light", "R9tPheZuGnA", "Ingmar", U, "Shafts of golden light falling across a quiet path through the woods", 50, 55),
  i("boardwalk-mist", "UpNwL3hTcRg", "Janek Valdsalu", U, "A wooden boardwalk leading through misty pines towards a warm sunset", 50, 60),
  i("misty-road", "wc-30298411", "Dietmar Rabich", "CC BY-SA 4.0", "A tree-lined country road filling with soft morning light and mist", 50, 55),
  i("heath-sunrise", "wc-48476943", "Dietmar Rabich", "CC BY-SA 4.0", "Heather in bloom with the sun rising low over a quiet heath", 55, 50),
  i("reeds-sunset", "wc-48477085", "Dietmar Rabich", "CC BY-SA 4.0", "Tall reeds silhouetted against the golden reflection of the sun on still water", 50, 50),
  i("golden-fields", "wc-81522331", "Mahesh Gudladona", "CC BY 3.0", "Green fields glowing under low golden light, hills fading into haze", 50, 55),
  i("golden-canal", "wc-115195156", "Dietmar Rabich", "CC BY-SA 4.0", "A narrow canal catching the gold of a low autumn sun between warm banks", 50, 50),
  i("vineyard-chapel", "wc-98214138", "Roman Eisele", "CC BY-SA 4.0", "A small hilltop chapel above a vineyard as the sun sets behind it", 55, 45),
  i("couple-watching", "wc-61710722", "Gerrit Vermeulen", "CC0", "A couple sitting side by side on the sand, watching the sun go down", 50, 60, true),
  i("couple-reflect", "wc-76837053", "Herryz", "CC BY-SA 4.0", "A couple walking at the water's edge, their reflections in the wet sand at dusk", 40, 60, true),
  i("beach-stroll", "wc-33069222", "Juan Jose Lopez", "CC BY-SA 3.0", "A couple strolling hand in hand along a beach under a pink sunset sky", 45, 55, true),
  i("proposal-sunset", "wc-138925231", "Asad Photo Maldives", "CC0", "A silhouette kneeling at the shore at sunrise, holding up the glowing sun like a ring", 50, 55, true),
  i("couple-door", "t8zrGJlSb0M", "Amine Ispir", U, "A couple holding hands in front of a tall dark doorway", 50, 50, true),
  i("couple-autumn", "TLBDWV7RRYI", "Alexander Mass", U, "A couple laughing together under trees in warm autumn light", 50, 45, true),
  i("couple-willow", "NNNRQgsQXpE", "Adam Cheek", U, "A couple embracing under a green willow in soft light", 50, 50, true),
  i("hands-shadow", "464ps_nOflw", "Jeremy Wong Weddings", U, "Two hands joined, their shadows meeting on the grass", 50, 40),
  i("dancing-bokeh", "mrQ6Kmfa1jA", "Preillumination Seth", U, "A couple dancing close together, warm lights glowing behind them", 50, 40, true),
  // ── water, sky and distance ──
  i("pier-mountains", "wc-81572487", "Michal Klajban", "CC BY-SA 4.0", "A wooden jetty reaching out over calm water towards distant mountains at sunset", 50, 50),
  i("jetty-dusk", "wc-73430230", "Sheba_Also", "CC BY-SA 2.0", "A long white pier with lamps, running out into the water at dusk", 50, 50),
  i("lake-geneva", "wc-75812682", "Dmitry A. Mottl", "CC BY-SA 4.0", "A wide, calm lake with far mountains softened in the evening haze", 55, 50),
  i("alma-lake", "wc-95942753", "Blessin2", "CC BY-SA 4.0", "A quiet lake at dusk, the sky turning pink and violet above a small dock", 50, 50),
  i("skyline-sunset", "wc-7653196", "Jockanderson", "Public domain", "A city skyline and its reflection in the water as the sun sets", 45, 50),
  i("bridge-dusk", "wc-73409692", "Sheba_Also", "CC BY-SA 2.0", "A lit bridge glowing amber over a river at dusk", 50, 55),
  i("dusk-skyline", "bAwT-vSd46Y", "Garvit", U, "A city skyline against a pink dusk sky, the sea in the foreground", 50, 50),
  i("mountain-clouds", "wc-175754824", "David Zhang", "CC BY-SA 2.0", "Morning cloud rolling through a mountain valley in warm light", 50, 50),
  i("meadow-hikers", "wc-161711873", "mypubliclands", "Public domain", "Two hikers walking side by side along a stream through a green alpine meadow", 50, 55, true),
  // ── night, stars and lanterns ──
  i("milky-magenta", "wc-79958196", "Pulperm Phungprachit", "CC BY-SA 4.0", "The Milky Way glowing magenta and violet over a pine silhouette", 50, 50),
  i("starry-night", "wc-96589866", "Eddie basler", "CC BY-SA 4.0", "A lake town's lights reflected below a sky full of stars", 50, 50),
  i("lantern-night", "wc-162628823", "Aung Chan Thar", "CC BY-SA 4.0", "Paper lanterns rising together into a deep blue night sky", 50, 50),
  // ── moon, lighthouse and stillness (dark and reflective) ──
  i("moonlit-sea", "wc-71405462", "Wolfgang Weber", "CC BY 3.0", "Moonlight breaking through cloud above a dark sea", 50, 40),
  i("moon-dark-sea", "wc-109044092", "Crimea Sleepwalker", "CC BY-SA 4.0", "The moon low over a black sea and a dark headland", 50, 50),
  i("lighthouse-pink", "wc-70875155", "Ansgar Koreng", "CC BY-SA 4.0", "A lone lighthouse on pale dunes under a pink and violet sunset", 60, 45),
  i("lighthouse-dusk", "wc-170807041", "B. Hawkins", "CC BY 4.0", "A lighthouse on a rock in dark water at dusk", 50, 50),
  i("candle-flame", "B5AmTy1K6mk", "Keith Misner", U, "A single candle flame glowing in a dark, warm room", 50, 50),
  i("candle-bokeh", "GAscwTkEOy8", "Reubx", U, "A candle in focus with soft golden points of light behind it", 50, 50),
  i("candle-iron", "J3H-rth8cck", "Rob Wicks", U, "A lit candle on a dark iron stand against a black background", 50, 50),
  i("misty-valley", "3pW91fGAKiE", "Daniil Silantev", U, "Mist lying over a dark forested valley at dawn", 50, 45),
  // ── memory, letters and small things ──
  i("album", "73OJLcahQHg", "Laura Fuhrman", U, "An old photograph album open on its black-and-white pages", 50, 50),
  i("glasses-pages", "heNLI144X7Y", "Marylou Fortier", U, "Reading glasses resting on loose, scattered pages", 50, 50),
  i("rings-book", "9ceNKX2ZlT0", "Micah Sammie Chaffin", U, "Two gold rings resting on the open pages of a book", 50, 55),
  i("hands-bw", "ZLmLOclfeE4", "Jon Sailer", U, "An older person's hands held together, in black and white", 50, 50),
  i("old-hands", "R1H2Y7T7m3I", "Junior Reis", U, "Two weathered hands, one wearing a ring, resting together", 50, 40),
  i("laugh-bw", "nBFagEIwy0o", "Elijah Pilchard", U, "A couple laughing as they hold each other, in black and white", 50, 50, true),
  i("eucalyptus", "LQoCpIagZmc", "Anita Austvika", U, "A white ranunculus and eucalyptus leaves against a deep teal wall", 50, 50),
  i("lilies-white", "aauHMskRPa8", "Tsuyoshi Kozu", U, "White lilies against a pale, quiet sky", 50, 50),
  i("lilies-dark", "4nN6aN45y7c", "Little Annabell", U, "Lilies in a glass vase, lit warmly against a dark ground", 50, 50),
  // ── evenings, tables and celebration ──
  i("pergola-lights", "csK5XPO87lI", "Randy Fath", U, "A pergola with string lights and drapes glowing at dusk", 50, 50),
  i("birthday-candles", "ETGJjk9o-48", "Caterina Berger", U, "A birthday cake crowded with lit candles in the dark", 50, 60),
  i("sparkler", "XKCo9N6gyS4", "Alexander Grey", U, "A sparkler throwing pink and gold light into a deep blue night", 50, 50),
  i("balloons", "Hli3R6LKibo", "Adi Goldstein", U, "Colourful balloons tied together against the light", 50, 40),
  i("bubbles-light", "PhuGmoubvo8", "Andre Hunter", U, "Soap bubbles drifting in soft focus against a blurred green background", 50, 50),
];

const BY_ID = new Map(LETTER_IMAGES.map((x) => [x.id, x]));
export const letterImage = (id: string) => BY_ID.get(id);
export const letterImageUrl = (id: string) => `/letters/photos/${id}.webp`;

/** A bundled photograph as the player wants it, or undefined when `id` is not one of ours (it may be a sender's upload). */
export function staticPhoto(id: string): PhotoSrc | undefined {
  const m = BY_ID.get(id);
  return m ? { src: letterImageUrl(m.id), alt: m.alt, focal: m.focal } : undefined;
}
