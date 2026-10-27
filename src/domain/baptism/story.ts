import { BAPTISM_SAMPLES } from "@/domain/catalogue/baptism-samples";

/**
 * The baby of every baptism template: the portrait that opens it, the photograph beside “our little story”, a gallery told as chapters,
 * and the photographs of the family and the church. This is *sample content* — a family’s own photographs replace every one of these
 * from the Media step — so the choices here are only what makes the demonstration look finished. Which pictures exist, who made them and
 * under what licence: `photos.ts`. The rules (a face on every hero, five to eight pictures in a gallery, no two templates alike) are in
 * `check.ts`.
 *
 * A chapter is a photograph and a caption of the form “Title — a line”; the gallery’s story layout sets the title large and the line
 * beneath it. Wording comes from one of six voices, so that the templates do not all say the same thing.
 */
export type Chapter = "miracle" | "hands" | "sleep" | "smiles" | "arms" | "love" | "water" | "feet" | "church" | "light";
export type Voice = "tender" | "regal" | "floral" | "heritage" | "cinematic" | "minimal";
type Pron = { n: string; he: string; his: string; him: string; thing: string };
type Line = [title: string, line: string];

const VOICES: Record<Voice, Record<Chapter, (p: Pron) => Line>> = {
  tender: {
    miracle: () => ["Our little miracle", "Our greatest blessing, our sweetest joy."],
    hands: (p) => ["Tiny hands, endless love", `${p.n} found a finger on the very first day and has not let go.`],
    sleep: (p) => ["Sweet dreams", `The quietest hour of the day belongs to ${p.him}.`],
    smiles: () => ["Little smiles, precious moments", "We keep them like small stars."],
    arms: (p) => ["Held close", `Every arm that has held ${p.him} has also prayed for ${p.him}.`],
    love: (p) => ["Surrounded by love", `${p.n} is carried by more people than ${p.he} will ever know.`],
    water: (p) => ["A special day of blessings", `On Sunday ${p.n} is welcomed by name.`],
    feet: () => ["Tiny steps ahead", "May they always walk in the light."],
    church: () => ["The place we pray", "Where the whole family will be gathered."],
    light: (p) => [`A candle for ${p.n}`, "Lit, and kept."],
  },
  regal: {
    miracle: (p) => [`Our little ${p.thing}`, "Born into more love than a crown could hold."],
    hands: () => ["Small hands, great promise", "Already holding the whole family by a finger."],
    sleep: (p) => ["A quiet kingdom", `Where ${p.n} reigns, softly, from a cradle.`],
    smiles: () => ["Royal smiles", "Handed out freely, and always welcome."],
    arms: (p) => ["In loving arms", `The first court ${p.n} ever kept.`],
    love: () => ["The whole household", "Families, godparents and friends, gathered at last."],
    water: (p) => ["The day of grace", `On Sunday, at the font, ${p.n} is made a child of God.`],
    feet: () => ["The first footsteps", "To be taken, one day, in faith."],
    church: () => ["The church", "Where the day is kept."],
    light: () => ["Candlelight", "A small flame, kept in grace."],
  },
  floral: {
    miracle: () => ["Our little blossom", "Fresh as the first flower of spring."],
    hands: () => ["Petal-soft hands", "Closing, so gently, around ours."],
    sleep: () => ["Sleeping among the flowers", "Not a sound but the rustle of a petal."],
    smiles: () => ["A bloom of smiles", "Every one a small, bright surprise."],
    arms: () => ["Gathered in", "Held as carefully as the first rose."],
    love: (p) => ["A garden of love", `Everyone who has watered ${p.him} with prayer.`],
    water: (p) => ["Blessed and growing", `On Sunday ${p.n} is planted in the family of God.`],
    feet: () => ["Little steps in the grass", "Soon enough, soon enough."],
    church: () => ["Where we gather", "Beneath one roof, in one prayer."],
    light: () => ["A small light", "Among the flowers."],
  },
  heritage: {
    miracle: () => ["The newest of us", "Carrying names that were carried before."],
    hands: () => ["Hand in hand", "From one generation to the next."],
    sleep: () => ["Held in the old ways", "Rocked to the songs we were rocked to."],
    smiles: (p) => ["Faces we know", `${p.n} has already got somebody’s smile.`],
    arms: () => ["In the family’s arms", "Passed gently from hand to hand."],
    love: (p) => ["Those who came before", `Their prayers are older than ${p.n}, and just as near.`],
    water: (p) => ["At the same font", `Where ${p.his} family has always begun.`],
    feet: () => ["The next steps", "On a path that is already well walked."],
    church: () => ["Our church", "Where we have always begun."],
    light: () => ["The family candle", "Lit by the elders first."],
  },
  cinematic: {
    miracle: () => ["Chapter one", "A new life, and the lights come up."],
    hands: () => ["The smallest hands", "Holding the biggest hope."],
    sleep: () => ["Held in the quiet", "The softest scene of the whole story."],
    smiles: (p) => ["The light catches", `And ${p.n} laughs, as though ${p.he} knew.`],
    arms: () => ["Carried in", "Out of the dark and into the light."],
    love: () => ["Everyone in the frame", "Near and far, in the church and on the screen."],
    water: (p) => ["The day itself", `Water, light, and ${p.his} name said aloud.`],
    feet: () => ["What comes next", "The whole road, still ahead."],
    church: () => ["The setting", "Where the day meets us."],
    light: () => ["Light", "Soft, gold, and enough."],
  },
  minimal: {
    miracle: (p) => [p.n, `Born in ${p.his} own good time.`],
    hands: () => ["Hands", "Holding on."],
    sleep: () => ["Sleep", "Nothing to add."],
    smiles: () => ["Smile", "Seen, and kept."],
    arms: (p) => ["Held", `By those who love ${p.him}.`],
    love: () => ["Family", "Everyone who will be there."],
    water: () => ["Baptism", "In the name of the Father, the Son and the Holy Spirit."],
    feet: () => ["Feet", "Small, for now."],
    church: () => ["Place", "The church."],
    light: () => ["Light", "One candle."],
  },
};

export interface BabyStory {
  voice: Voice;
  gender: "f" | "m";
  /** The portrait that opens the template (a face), and is the invitation’s “couple” photograph. */
  hero: string;
  /** The picture beside “our little story”. */
  story: string;
  /** Five to eight pictures, in the order they are told; the hero is not repeated. */
  gallery: [photo: string, chapter: Chapter][];
  /** One picture each for the people sections (shown as the group’s photograph). */
  people?: { parents?: string; grandparents?: string };
  /** The church, for the venue section. */
  church?: string;
}

const S = (voice: Voice, gender: "f" | "m", hero: string, story: string, gallery: BabyStory["gallery"], extra: Pick<BabyStory, "people" | "church"> = {}): BabyStory => ({ voice, gender, hero, story, gallery, ...extra });

export const STORY: Record<string, BabyStory> = {
  "a-new-beginning": S("cinematic", "m", "wc-61851789", "wc-71608893", [["wc-81580667", "miracle"], ["wc-71608893", "hands"], ["wc-131739330", "arms"], ["wc-61706089", "feet"], ["wc-190844210", "love"], ["wc-41870506", "water"], ["wc-90920879", "church"]], { people: { parents: "wc-131739330" }, church: "ouh94xUqOHk" }),
  "heavenly-grace": S("tender", "f", "wc-71916143", "wc-36474237", [["wc-61847580", "miracle"], ["wc-36474237", "hands"], ["wc-61847060", "feet"], ["wc-71608793", "arms"], ["wc-61855196", "smiles"], ["wc-190843747", "love"], ["wc-41870506", "water"]], { people: { parents: "wc-71608793", grandparents: "y0OAmd_COUM" } }),
  "blessing-from-above": S("tender", "m", "wc-125854992", "wc-71608893", [["wc-61847580", "miracle"], ["wc-71608893", "hands"], ["wc-70993227", "arms"], ["wc-71383191", "sleep"], ["wc-71608930", "feet"], ["wc-190844335", "love"], ["GAscwTkEOy8", "light"]], { people: { parents: "wc-70993227", grandparents: "ZLmLOclfeE4" } }),
  "sacred-waters": S("minimal", "m", "ZzlLBmKFxpA", "wc-61847060", [["wc-61847035", "sleep"], ["wc-61847060", "feet"], ["wc-36462961", "hands"], ["wc-71916143", "miracle"], ["wc-61855196", "arms"], ["wc-41870506", "water"]], { people: { parents: "wc-61855196" } }),
  "kerala-christian-heritage": S("regal", "f", "wc-160054700", "wc-71608893", [["wc-85446402", "smiles"], ["wc-71608893", "hands"], ["wc-190844335", "love"], ["wc-70993227", "arms"], ["wc-61857511", "feet"], ["wc-41870506", "water"], ["ouh94xUqOHk", "church"]], { people: { parents: "wc-160054700", grandparents: "wc-190844335" }, church: "ouh94xUqOHk" }),
  "little-prince-of-grace": S("regal", "m", "wc-47372743", "wc-36474237", [["wc-61856883", "smiles"], ["wc-61847580", "miracle"], ["wc-70993227", "arms"], ["wc-36474237", "hands"], ["wc-61705068", "feet"], ["wc-131739330", "love"], ["wc-71383191", "sleep"]], { people: { parents: "wc-70993227" } }),
  "little-princess-of-heaven": S("floral", "f", "wc-89085674", "wc-36474237", [["wc-125854992", "miracle"], ["wc-61767624", "smiles"], ["wc-138836814", "arms"], ["wc-36474237", "hands"], ["wc-71608930", "feet"], ["wc-190843747", "love"], ["wc-24332292", "sleep"]], { people: { parents: "wc-138836814" } }),
  "generations-of-faith": S("heritage", "m", "wc-86627271", "y0OAmd_COUM", [["wc-73502717", "miracle"], ["y0OAmd_COUM", "hands"], ["ZLmLOclfeE4", "love"], ["wc-190844335", "arms"], ["saW6YxGBFkw", "feet"], ["qx7ZQwbgm1c", "sleep"], ["wc-131739330", "smiles"]], { people: { grandparents: "wc-86627271" } }),
  "church-of-light": S("cinematic", "f", "wc-89085515", "wc-61903702", [["wc-61851789", "miracle"], ["wc-61903702", "hands"], ["wc-61706089", "feet"], ["wc-131739330", "arms"], ["G5a1RNy55pw", "church"], ["GAscwTkEOy8", "light"], ["wc-90920879", "love"], ["wc-41870506", "water"]], { people: { parents: "wc-131739330" }, church: "wc-90920879" }),
  "white-dove-blessing": S("tender", "m", "wc-61851715", "wc-71608930", [["wc-71916143", "sleep"], ["wc-71608930", "hands"], ["wc-61705068", "feet"], ["wc-61855196", "arms"], ["wc-71608793", "smiles"], ["wc-36474237", "miracle"]], { people: { parents: "wc-71608793" } }),
  "the-open-bible": S("minimal", "m", "wc-81580667", "wc-61847580", [["wc-61847580", "miracle"], ["wc-36462961", "hands"], ["wc-47372743", "smiles"], ["wc-71608793", "arms"], ["wc-61847060", "feet"], ["wc-41870506", "water"], ["GAscwTkEOy8", "light"]], { people: { parents: "wc-71608793" } }),
  "floral-grace": S("floral", "f", "wc-138836814", "wc-61857511", [["wc-125854992", "miracle"], ["wc-85446402", "smiles"], ["wc-61857511", "feet"], ["aauHMskRPa8", "church"], ["wc-36474237", "hands"], ["wc-70993227", "arms"], ["wc-24332292", "sleep"]], { people: { parents: "wc-70993227" }, church: "aauHMskRPa8" }),
  "golden-morning": S("cinematic", "m", "wc-24332292", "wc-85446402", [["wc-81580667", "sleep"], ["wc-71608893", "hands"], ["wc-85446402", "smiles"], ["wc-70993227", "arms"], ["wc-190844335", "love"], ["4KkTFccuZ0M", "church"], ["wc-41870506", "water"]], { people: { parents: "wc-70993227" }, church: "G5a1RNy55pw" }),
  "jesus-and-the-little-child": S("tender", "m", "wc-61847580", "wc-36474237", [["wc-36474237", "hands"], ["wc-47372743", "smiles"], ["wc-61767624", "miracle"], ["wc-61705068", "feet"], ["wc-190844210", "love"], ["wc-70993227", "arms"], ["wc-41870506", "water"]], { people: { parents: "wc-190844210" } }),
  "garden-of-blessings": S("floral", "f", "wc-85446402", "wc-61857511", [["wc-61847580", "miracle"], ["wc-71383191", "sleep"], ["wc-61767624", "smiles"], ["4KkTFccuZ0M", "church"], ["wc-70993227", "arms"], ["wc-190843747", "love"]], { people: { parents: "wc-70993227" }, church: "4KkTFccuZ0M" }),
  "royal-catholic-elegance": S("regal", "m", "wc-61856883", "wc-71608930", [["wc-24332292", "sleep"], ["wc-70993227", "arms"], ["wc-71608930", "hands"], ["wc-190844335", "love"], ["QPL_171Kf5Q", "church"], ["wc-41870506", "water"]], { people: { grandparents: "wc-190844335" }, church: "QPL_171Kf5Q" }),
  "modern-minimal-grace": S("minimal", "m", "wc-61856876", "wc-36462961", [["wc-71916143", "sleep"], ["wc-36462961", "hands"], ["wc-73502717", "miracle"], ["saW6YxGBFkw", "feet"], ["wc-61856883", "smiles"], ["wc-131739330", "arms"]], { people: { parents: "wc-131739330" } }),
  "the-little-blessing": S("tender", "f", "wDGrvGUWOpE", "ybvTwLSBtSY", [["wc-71608893", "hands"], ["ybvTwLSBtSY", "feet"], ["J3H-rth8cck", "light"], ["wc-131739330", "arms"], ["wc-81580667", "sleep"], ["wc-61847580", "miracle"]], { people: { parents: "wc-131739330" } }),
  "family-in-faith": S("heritage", "m", "wc-190843747", "wc-190844210", [["wc-190844210", "love"], ["wc-190844335", "arms"], ["wc-61767624", "smiles"], ["y0OAmd_COUM", "hands"], ["wc-70993227", "miracle"], ["wc-71608793", "sleep"], ["wc-41870506", "water"]], { people: { parents: "wc-190843747", grandparents: "y0OAmd_COUM" } }),
  "celestial-promise": S("cinematic", "f", "wc-71383191", "wc-61706089", [["wc-89085515", "miracle"], ["wc-61706089", "hands"], ["wc-61847060", "feet"], ["wc-131739330", "arms"], ["GAscwTkEOy8", "water"], ["wc-61851789", "sleep"], ["wc-61855196", "love"]], { people: { parents: "wc-131739330" }, church: "G5a1RNy55pw" }),
  "candle-of-faith": S("tender", "m", "wc-131739330", "wc-71608893", [["wc-61851789", "miracle"], ["wc-71608893", "hands"], ["wc-81580667", "sleep"], ["wc-70993227", "arms"], ["J3H-rth8cck", "light"], ["wc-190844335", "love"], ["wc-41870506", "water"]], { people: { parents: "wc-70993227" }, church: "G5a1RNy55pw" }),
  "white-roses": S("floral", "f", "wc-71608793", "wc-61857511", [["wc-125854992", "miracle"], ["wc-71383191", "sleep"], ["wc-36474237", "hands"], ["wc-85446402", "smiles"], ["wc-61857511", "feet"], ["wc-138836814", "arms"], ["aauHMskRPa8", "church"]], { people: { parents: "wc-138836814" }, church: "4KkTFccuZ0M" }),
  "little-miracle": S("tender", "f", "wc-61767624", "wc-61705068", [["wc-89085674", "miracle"], ["wc-61856883", "smiles"], ["wc-61705068", "feet"], ["wc-71916143", "sleep"], ["wc-36474237", "hands"], ["wc-61855196", "arms"], ["wc-190843747", "love"], ["wc-41870506", "water"]], { people: { parents: "wc-61855196" } }),
  "golden-cross": S("heritage", "m", "qx7ZQwbgm1c", "wc-73502717", [["wc-61856876", "smiles"], ["wc-73502717", "hands"], ["saW6YxGBFkw", "feet"], ["wc-131739330", "arms"], ["wc-190844335", "love"], ["wc-41870506", "water"], ["QPL_171Kf5Q", "church"]], { people: { grandparents: "ZLmLOclfeE4" }, church: "QPL_171Kf5Q" }),
  "cloud-nine": S("cinematic", "m", "wc-70993227", "wc-71608930", [["wc-61851715", "sleep"], ["wc-36474237", "hands"], ["wc-71608930", "feet"], ["wc-85446402", "smiles"], ["wc-71608793", "arms"], ["wc-190844210", "love"], ["wc-90920879", "church"]], { people: { parents: "wc-71608793" }, church: "wc-90920879" }),
};

const GENDER = { f: { he: "she", his: "her", him: "her", thing: "princess" }, m: { he: "he", his: "his", him: "him", thing: "prince" } } as const;

/** The caption each chapter of a template’s gallery carries, in the voice of the template. */
export function chapterCaption(templateId: string, chapter: Chapter): string {
  const st = STORY[templateId];
  const n = (BAPTISM_SAMPLES[templateId]?.child ?? "").split(" ")[0] || "Baby";
  const [title, line] = VOICES[st.voice][chapter]({ n, ...GENDER[st.gender] });
  return `${title} — ${line}`;
}

const HEADING: Record<Voice, (p: Pron) => [eyebrow: string, title: string]> = {
  tender: (p) => ["Little moments", `${p.n}’s story`],
  regal: (p) => ["Portraits", `${p.n}, in pictures`],
  floral: (p) => ["A garden of firsts", `${p.n} in bloom`],
  heritage: () => ["The newest of us", "Faces and hands"],
  cinematic: () => ["The story so far", "Chapter by chapter"],
  minimal: () => ["02", "Photographs"],
};
/** The heading of a template’s gallery section: [small heading, title]. */
export function galleryHeading(templateId: string): [string, string] {
  const st = STORY[templateId];
  const n = (BAPTISM_SAMPLES[templateId]?.child ?? "").split(" ")[0] || "Baby";
  return HEADING[st.voice]({ n, ...GENDER[st.gender] });
}

// the closing blessing of the finale — the sample’s own words, never a quotation
const BLESSING: Record<Voice, (p: Pron) => string> = {
  tender: (p) => `May God hold ${p.n} close, today and through all the days to come.`,
  regal: (p) => `To the glory of God, and in thanks for ${p.n}.`,
  floral: (p) => `May ${p.n} grow in grace, like everything that is well loved.`,
  heritage: (p) => `The whole family thanks you — and so will ${p.n}, one day.`,
  cinematic: () => "A new beginning, and you were part of it. Thank you.",
  minimal: (p) => `${p.n}. Thank you for being there.`,
};
export function finaleBlessing(templateId: string): string {
  const st = STORY[templateId];
  const n = (BAPTISM_SAMPLES[templateId]?.child ?? "").split(" ")[0] || "Baby";
  return BLESSING[st.voice]({ n, ...GENDER[st.gender] });
}

/** [photo, caption] for every picture of a template’s gallery, ready for the sample’s album. */
export const galleryOf = (templateId: string): [string, string][] => STORY[templateId].gallery.map(([id, ch]) => [id, chapterCaption(templateId, ch)]);
