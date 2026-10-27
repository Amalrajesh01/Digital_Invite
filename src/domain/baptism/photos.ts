/**
 * The demonstration photographs of the baptism templates: a pool of licensed pictures of babies, hands, feet, parents, grandparents,
 * families and a baptism, each with what it shows, the mood of its light, a focal point (so a crop never loses the face) and its credit.
 *
 * They are STAND-INS. A template's sample invitation needs to look finished before a family has uploaded anything, so it shows these;
 * the editor marks them as the sample's ("Still the sample"), and a family's own photographs replace them one by one. They depict real
 * people who are not the fictional families in the samples — the same disclosure as every other stock photograph (assets/stock/CREDITS.md).
 * Nothing is ever hot-linked: the files live in `assets/stock/` and go through the normal media pipeline.
 *
 * Which template shows which photograph is `story.ts`; the gate that checks all of it is `check.ts` (`npm run baptism:check`).
 */
export const ROLES = ["portrait", "sleeping", "hands", "feet", "parent", "family", "grandparent", "baptism", "church", "detail"] as const;
export type Role = (typeof ROLES)[number];
/** The light of a photograph, so a template can pick pictures that sit in its palette. */
export type Mood = "bright" | "soft" | "warm" | "cool" | "dark" | "mono";

export interface BabyPhoto {
  role: Role;
  mood: Mood;
  /** A baby's (or a family's) face can be seen, so the picture may open a template. */
  face: boolean;
  /** Focal point in percent — where a crop must stay. */
  focal: { x: number; y: number };
  /** What it shows, in a sentence (also the alt text). */
  alt: string;
  by: string;
  licence: string;
  /** Where the original is. Unsplash photographs are `https://unsplash.com/photos/<id>`. */
  page?: string;
}

const CC0 = "CC0";
const UNSPLASH = "Unsplash License";
const commons = (title: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title.replace(/ /g, "_"))}`;
const p = (role: Role, mood: Mood, face: boolean, x: number, y: number, alt: string, by: string, licence: string, page?: string): BabyPhoto => ({ role, mood, face, focal: { x, y }, alt, by, licence, page });

export const PHOTOS: Record<string, BabyPhoto> = {
  // ── babies: faces ────────────────────────────────────────────────────────────────────────────────
  "wc-61847580": p("portrait", "warm", true, 47, 50, "A newborn awake in a brown knitted blanket, looking straight at the camera", "Mindy Olson (Unsplash)", CC0, commons("Newborn Baby (Unsplash).jpg")),
  "wc-85446402": p("portrait", "warm", true, 42, 32, "A smiling baby in a striped knitted cap, lying on a white sheepskin rug and waving", "Victoria Borodinova", CC0, commons("Baby wearing hat and babygrow.jpg")),
  "wc-61856883": p("portrait", "soft", true, 50, 38, "A blue-eyed baby holding a small toy to his mouth, in soft white light", "Colin Maynard (Unsplash)", CC0, commons("Baby Toys (Unsplash).jpg")),
  "wc-61856876": p("portrait", "mono", true, 55, 42, "Black-and-white portrait of a baby with wide eyes and a happy open mouth", "Janko Ferlič (Unsplash)", CC0, commons("Monochrome baby face in boras (Unsplash).jpg")),
  "wc-47372743": p("portrait", "cool", true, 55, 40, "A smiling toddler boy in a pale blue top with a finger at his lips", "Pixabay", CC0, commons("Young boy.jpg")),
  "ZzlLBmKFxpA": p("portrait", "cool", true, 28, 42, "A newborn lying in a wicker basket on a blue blanket, looking up", "Unervi Gonzalez (Unsplash)", UNSPLASH, "https://unsplash.com/photos/ZzlLBmKFxpA"),
  "wc-61767624": p("family", "warm", true, 50, 42, "A toddler girl with a hair bow taking her first steps, held up by both hands", "Priscilla Du Preez (Unsplash)", CC0, commons("Priscilla Du Preez 2017-04-05 (Unsplash).jpg")),
  // ── babies asleep ────────────────────────────────────────────────────────────────────────────────
  "wc-71916143": p("sleeping", "bright", true, 78, 46, "A newborn asleep on white linen, curled up with one hand under the cheek", "Stephanie Pratt", CC0, commons("Sleeping-baby.jpg")),
  "wc-125854992": p("sleeping", "soft", true, 46, 46, "A newborn asleep in a cream blanket in a wicker basket", "Elizabeth", CC0, commons("Newborn baby sleeps in a basket.jpg")),
  "wc-89085674": p("sleeping", "soft", true, 42, 55, "A newborn asleep in a nest of woven twigs and pale pink feathers", "Pixabay (user 1041483)", CC0, commons("Baby (784608).jpg")),
  "wc-89085515": p("sleeping", "dark", true, 76, 42, "A newborn in a white sleepsuit asleep along a father’s forearm against black", "PublicDomainPictures (Pixabay)", CC0, commons("Baby (20339).jpg")),
  "wc-81580667": p("sleeping", "warm", true, 50, 47, "Close-up of a newborn asleep in a soft brown blanket, hands tucked under the chin", "PublicDomainPictures (Pixabay)", CC0, commons("Closed up of a sleeping baby.jpg")),
  "wc-61851789": p("sleeping", "dark", true, 50, 48, "A newborn asleep, cradled between a parent’s hands, smiling in a dream", "Chiến Phạm (Unsplash)", CC0, commons("Baby (Unsplash).jpg")),
  "wc-61851715": p("sleeping", "bright", true, 52, 62, "A baby asleep on white bedding beside a pillow patterned in turquoise", "Dakota Corbin (Unsplash)", CC0, commons("Sleeping baby (Unsplash).jpg")),
  "wc-61847035": p("sleeping", "cool", true, 70, 65, "A baby asleep on a blue blanket, seen close up", "Carlo Navarro (Unsplash)", CC0, commons("Carlo Navarro 2017 (Unsplash).jpg")),
  "wc-24332292": p("sleeping", "warm", true, 38, 52, "A newborn asleep in golden light on a cream blanket", "Andrés Nieto Porras", "CC BY-SA 2.0", commons("Sleeping newborn infant.jpg")),
  "wc-71383191": p("sleeping", "soft", true, 60, 52, "A newborn asleep in a knitted cap with bear ears, hands under the cheek", "Vanessa Kay", "CC BY 3.0", commons("Baby Bear (55142474).jpeg")),
  "wDGrvGUWOpE": p("sleeping", "soft", true, 46, 42, "A newborn in a soft cap, wrapped in a striped blanket and smiling in her sleep", "Jimmy Conover (Unsplash)", UNSPLASH, "https://unsplash.com/photos/wDGrvGUWOpE"),
  "qx7ZQwbgm1c": p("sleeping", "mono", true, 35, 42, "Black-and-white photograph of a sleeping newborn tucked into blankets", "Frank Alarcon (Unsplash)", UNSPLASH, "https://unsplash.com/photos/qx7ZQwbgm1c"),
  // ── tiny hands ───────────────────────────────────────────────────────────────────────────────────
  "wc-36474237": p("hands", "soft", false, 40, 52, "A parent’s fingertip held by a newborn’s tiny hand, in soft pink light", "jelly (Pixabay)", CC0, commons("Baby-200760 640.jpg")),
  "wc-71608893": p("hands", "warm", false, 40, 55, "A sleeping baby’s hand holding on to a parent’s finger", "Wayne Evans (Pixabay)", CC0, commons("Adult-baby-bed-225744.jpg")),
  "wc-73502717": p("hands", "mono", false, 45, 45, "Black-and-white photograph of a newborn gripping a parent’s finger", "trestletech (Pixabay)", CC0, commons("Baby-Parenthood-Finger-Father-Hand-Love-Mother-1271742.jpg")),
  "wc-36462961": p("hands", "mono", false, 58, 40, "Black-and-white photograph of a baby’s hand holding two adult fingers", "Nikasucha (Pixabay)", CC0, commons("Hand-444159 640.jpg")),
  // ── tiny feet ────────────────────────────────────────────────────────────────────────────────────
  "wc-71608930": p("feet", "bright", false, 52, 50, "A newborn’s tiny feet held in a mother’s cupped hands", "Rene Asmussen (Pixabay)", CC0, commons("Baby-baby-feet-bed-325690.jpg")),
  "wc-61705068": p("feet", "bright", false, 50, 55, "A baby’s two feet resting in an adult’s open hands", "Bonnie Kittle (Unsplash)", CC0, commons("Baby's feet (Unsplash).jpg")),
  "wc-61706089": p("feet", "dark", false, 55, 55, "A baby’s tiny feet held between two pairs of hands forming a heart", "Benji Aird (Unsplash)", CC0, commons("Memphis, United States (Unsplash).jpg")),
  "wc-61847060": p("feet", "cool", false, 50, 60, "A newborn’s feet against a soft blue ground", "Janko Ferlič (Unsplash)", CC0, commons("Newborn baby feet (Unsplash).jpg")),
  "wc-61857511": p("feet", "warm", false, 50, 50, "A baby’s feet in a wicker basket on a sheepskin, beside a black-eyed Susan", "Gabby Orcutt (Unsplash)", CC0, commons("Baby in a wicker basket (Unsplash).jpg")),
  "wc-61903702": p("feet", "dark", false, 42, 55, "A mother’s hand cupping her baby’s foot", "Alex Pasarelu (Unsplash)", CC0, commons("Momma's support your future (Unsplash).jpg")),
  "I8Ik4L3lPrs": p("feet", "mono", false, 50, 50, "Black-and-white photograph of a baby’s tiny feet cupped in a parent’s hands", "Shannon Pitter (Unsplash)", UNSPLASH, "https://unsplash.com/photos/I8Ik4L3lPrs"),
  "saW6YxGBFkw": p("feet", "mono", false, 50, 65, "Black-and-white photograph of a baby’s feet held between two hands in the shape of a heart", "Marius Muresan (Unsplash)", UNSPLASH, "https://unsplash.com/photos/saW6YxGBFkw"),
  "ybvTwLSBtSY": p("feet", "warm", false, 45, 72, "A baby’s feet peeking out from under a knitted blanket", "Ana Curcan (Unsplash)", UNSPLASH, "https://unsplash.com/photos/ybvTwLSBtSY"),
  "zx0Xt9u1ekw": p("feet", "dark", false, 50, 62, "A baby’s feet held gently in a parent’s hand", "Ana Curcan (Unsplash)", UNSPLASH, "https://unsplash.com/photos/zx0Xt9u1ekw"),
  // ── parent and baby ──────────────────────────────────────────────────────────────────────────────
  "wc-70993227": p("parent", "warm", true, 52, 40, "A mother kissing her baby boy’s cheek; he wears a striped knitted cap", "PublicDomainPictures (Pixabay)", CC0, commons("Baby-boy-child-67663.jpg")),
  "wc-71608793": p("parent", "cool", true, 62, 42, "A mother holding her smiling baby by a window in soft daylight", "bruce mars (Pixabay)", CC0, commons("Adult-affection-baby-755028.jpg")),
  "wc-131739330": p("parent", "warm", true, 50, 42, "A newborn asleep against his father’s cheek, wrapped in a soft blanket", "PublicDomainPictures (Pixabay)", CC0, commons("Congé parental.png")),
  "wc-138836814": p("parent", "soft", true, 40, 40, "A newborn in a cream outfit asleep on her mother’s shoulder", "Vyacheslav Argenberg", "CC BY 4.0", commons("Newborn baby girl, Infant, Moscow, Russia.jpg")),
  "wc-61855196": p("parent", "cool", false, 68, 55, "A mother lifting her baby high against a pale turquoise wall", "Dakota Corbin (Unsplash)", CC0, commons("Summer in France with baby (Unsplash).jpg")),
  "wc-160054700": p("family", "soft", true, 50, 62, "Parents leaning in to their baby, who wears a cream suit and cap and holds his father’s hand", "Jerryjacob999", "CC BY-SA 4.0", commons("Kerala Christian Baptism.jpg")),
  // ── family, grandparents ─────────────────────────────────────────────────────────────────────────
  "wc-190844335": p("grandparent", "warm", true, 48, 50, "A grandmother in a gold-patterned dress holding her newborn grandchild in a white christening robe", "Hadassah Photostorie group", "CC BY-SA 4.0", commons("Baby's naming ceremony 245.jpg")),
  "wc-190844210": p("family", "bright", true, 58, 50, "A mother and father in white with their little daughter and a newborn in a christening robe on the sofa", "Hadassah Photostorie group", "CC BY-SA 4.0", commons("Baby's naming ceremony 202.jpg")),
  "wc-190843747": p("family", "bright", true, 55, 50, "Two women, a little girl and a newborn in white, smiling together on a sofa", "Hadassah Photostorie group", "CC BY-SA 4.0", commons("Baby's naming ceremony 149.jpg")),
  "wc-86627271": p("grandparent", "mono", true, 48, 42, "An old photograph of a grandmother holding a baby in a long white gown on her knee in a garden", "State Government Photographer", CC0, commons("Grandmother with baby on knee sitting in garden(GN00432).jpg")),
  "y0OAmd_COUM": p("grandparent", "mono", false, 55, 62, "A baby’s hand resting on the weathered hand of a grandparent", "Rod Long (Unsplash)", UNSPLASH, "https://unsplash.com/photos/y0OAmd_COUM"),
  "ZLmLOclfeE4": p("grandparent", "mono", false, 52, 52, "Black-and-white photograph of an elder’s hand holding a younger hand wearing bracelets", "Jon Sailer (Unsplash)", UNSPLASH, "https://unsplash.com/photos/ZLmLOclfeE4"),
  // ── the baptism, the church, the details ─────────────────────────────────────────────────────────
  "wc-41870506": p("baptism", "bright", false, 45, 55, "A priest’s hands pouring baptismal water over a baby’s head from a glass bowl", "keskieve (Pixabay)", CC0, commons("Lutheran baptism.jpg")),
  "wc-90920879": p("church", "warm", false, 50, 55, "A church nave with stained-glass windows and a christening party gathered at the font", "Cograng", "CC BY-SA 4.0", commons("Christening in St Dunstan-in-the-West.jpg")),
  "ouh94xUqOHk": p("church", "bright", false, 50, 50, "A Kerala church with a tall façade and red steps under a blue sky", "Nilotpal Maity (Unsplash)", UNSPLASH, "https://unsplash.com/photos/ouh94xUqOHk"),
  "QPL_171Kf5Q": p("church", "bright", false, 50, 40, "A white church with tall spires against a deep blue sky", "Arun R (Unsplash)", UNSPLASH, "https://unsplash.com/photos/QPL_171Kf5Q"),
  "G5a1RNy55pw": p("church", "dark", false, 50, 40, "A stained-glass window above a chapel overlooking the sea", "Dominic Kurniawan Suryaputra (Unsplash)", UNSPLASH, "https://unsplash.com/photos/G5a1RNy55pw"),
  "GAscwTkEOy8": p("detail", "dark", false, 50, 40, "Rows of candles glowing softly, their lights blurred into gold", "Reubx (Unsplash)", UNSPLASH, "https://unsplash.com/photos/GAscwTkEOy8"),
  "J3H-rth8cck": p("detail", "dark", false, 50, 50, "A single white candle burning in a dark candlestick", "Rob Wicks (Unsplash)", UNSPLASH, "https://unsplash.com/photos/J3H-rth8cck"),
  "aauHMskRPa8": p("detail", "bright", false, 50, 40, "White lilies against a pale, cloudless sky", "Tsuyoshi Kozu (Unsplash)", UNSPLASH, "https://unsplash.com/photos/aauHMskRPa8"),
  "4KkTFccuZ0M": p("detail", "warm", false, 50, 55, "A rose garden with a white pergola and benches in warm light", "Ries Bosch (Unsplash)", UNSPLASH, "https://unsplash.com/photos/4KkTFccuZ0M"),
};

/** Licences that may be shown (and must be credited) — nothing else is ever used. */
export const ALLOWED_LICENCES = [CC0, UNSPLASH, "CC BY 3.0", "CC BY 4.0", "CC BY-SA 2.0", "CC BY-SA 4.0"] as const;

export const PHOTO_IDS = Object.keys(PHOTOS);
export const photo = (id: string): BabyPhoto | undefined => (Object.prototype.hasOwnProperty.call(PHOTOS, id) ? PHOTOS[id] : undefined);
/** What the stock catalogue needs of each: alt text and focal point. */
export const PHOTO_STOCK: Record<string, { alt: string; focal: { x: number; y: number } }> = Object.fromEntries(Object.entries(PHOTOS).map(([id, ph]) => [id, { alt: ph.alt, focal: ph.focal }]));
