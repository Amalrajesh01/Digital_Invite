/**
 * Forever Letters — the vocabulary. An experience is *data*: a palette, a type pairing, a motion profile, a set of fields the
 * sender fills in, and an ordered list of beats (an opening, then games, reveals and a reply) taken from one reusable library
 * (`src/invitation/letters/`). Nothing here is a component, so a spec can cross from the server to the browser as plain JSON.
 */

/** The six chapters of the catalogue. */
export const LETTER_CATEGORIES = [
  { key: "confess", name: "The courage to confess", blurb: "Asking, hinting, finally saying it." },
  { key: "proposal", name: "Proposals and commitment", blurb: "For the question, and the future behind it." },
  { key: "celebrate", name: "Birthdays and anniversaries", blurb: "Another year, told as a little adventure." },
  { key: "repair", name: "Apologies and reconnection", blurb: "Honest words, offered without pressure." },
  { key: "devotion", name: "Deep love and everyday romance", blurb: "Gratitude, encouragement and the small things." },
  { key: "closure", name: "Closure and letting go", blurb: "A quiet, respectful goodbye." },
] as const;
export type LetterCategory = (typeof LETTER_CATEGORIES)[number]["key"];

/** What a visitor can filter by. Only tags that at least one letter carries are ever shown. */
export const LETTER_TAGS = {
  date: "Date invitations",
  confession: "Confessions",
  proposal: "Proposals",
  birthday: "Birthdays",
  anniversary: "Anniversaries",
  apology: "Apologies",
  letter: "Love letters",
  game: "Games and quizzes",
  gratitude: "Gratitude",
  distance: "Long distance",
  closure: "Breakup and closure",
} as const;
export type LetterTag = keyof typeof LETTER_TAGS;

/** Decides the visual rules: dark is reserved for closure; playful may move and bounce; emotional stays calm. */
export type LetterTone = "romantic" | "playful" | "emotional" | "dark";

/** Five motion profiles (see `letters.css`): elegant, cinematic, playful, immersive, dark. */
export type MotionProfile = "elegant" | "cinematic" | "playful" | "immersive" | "dark";

export type Layout = "card" | "paper" | "full" | "film" | "editorial" | "phone" | "map";
export type Ambient = "none" | "light" | "stars" | "petals" | "embers" | "dust" | "bubbles" | "rain";
export type Treatment = "none" | "warm" | "cool" | "mono" | "dim" | "dusk";

export interface Palette {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  /** A second colour for small details. */
  accent2: string;
  /** Text on a solid accent button. */
  onAccent: string;
  dark: boolean;
}

export interface Fonts {
  display: string;
  body: string;
  script?: string;
}

// ── what the sender fills in ───────────────────────────────────────────────────────────────────────────
interface FieldBase {
  key: string;
  label: string;
  hint?: string;
  /** Shown in the empty box in the builder: where the sender is asked for something personal, e.g. “[A memory you both cherish]”. */
  placeholder?: string;
  /** What the recipient sees when the sender leaves it untouched. Framing lines have one; personal facts never do. */
  default?: string;
  /** Written for the public demonstration only — never published as anyone's real content. */
  sample?: string;
  /** The letter cannot be sent to us until this is written (an apology without its apology, say). */
  required?: boolean;
  /** The key of a toggle that must be on before this value is ever sent to the recipient's browser (a private place, say). */
  guard?: string;
}
export type Field =
  | (FieldBase & { kind: "text"; max?: number })
  | (FieldBase & { kind: "long"; rows?: number })
  | (FieldBase & { kind: "date" })
  | (FieldBase & { kind: "choice"; options: { value: string; label: string }[] })
  | (FieldBase & { kind: "toggle" })
  | (FieldBase & { kind: "photo" })
  | (FieldBase & { kind: "list"; item: Field[]; itemLabel: string; min?: number; max: number; samples?: Record<string, string>[]; defaults?: Record<string, string>[] });

export type Item = Record<string, string>;
/** What is stored for a letter: a string per field, or a list of items for a list field. */
export type Values = Record<string, string | Item[]>;

// ── the beats ──────────────────────────────────────────────────────────────────────────────────────────
/** A photograph, resolved to something an <img> can use — from a sender's own uploads, or from the bundled demonstration set. */
export interface PhotoSrc { src: string; srcSet?: string; alt: string; focal?: { x: number; y: number } }

/** A string is either literal copy or, with a leading “@”, the key of a field (`"@intro"`). */
export type Ref = string;

export const GATE_STYLES = [
  "question", "quiet", "mystery", "cards", "spotlight", "phone", "sealed", "develop", "film", "numerals", "horizon", "book", "map", "candle", "window", "orbit",
  "envelope", "scroll", "door", "dawn", "hold", "cup", "lens", "museum", "vinyl", "notes", "distance", "puzzle", "postcard", "rain", "lamp", "time",
] as const;
export type GateStyle = (typeof GATE_STYLES)[number];

export type ChoiceKind = "yes" | "alt" | "no" | "talk" | "later" | "open";
export interface AskChoice { key: string; label: Ref; kind: ChoiceKind }

export type Beat =
  | { type: "gate"; style: GateStyle; title: Ref; eyebrow?: Ref; sub?: Ref; cta: string; hint?: string; /** Offer “Not right now”, which is always fine. */ later?: boolean; /** A list whose length the opening counts up to (numerals). */ count?: Ref }
  | { type: "lines"; src: Ref; mode?: "fade" | "type" | "chat" | "film" | "stack"; title?: Ref; eyebrow?: Ref; photo?: Ref; cta?: string }
  | { type: "sections"; parts: { label: Ref; src: Ref }[]; title?: Ref; cta?: string }
  | { type: "letter"; src: Ref; title?: Ref; per?: number; voice?: Ref; cta?: string }
  | { type: "clues"; list: Ref; title?: Ref; icons?: boolean; guess?: { question: Ref; options: Ref }; reveal?: Ref; cta?: string }
  | { type: "quiz"; list: Ref; title?: Ref; collage?: boolean }
  | { type: "flip"; list: Ref; title?: Ref; need?: number }
  | { type: "deck"; list: Ref; title?: Ref }
  | { type: "envelopes"; list: Ref; title?: Ref; sub?: Ref }
  | { type: "scratch"; src: Ref; title?: Ref; sub?: Ref }
  | { type: "order"; list: Ref; title?: Ref; sub?: Ref }
  | { type: "match"; list: Ref; title?: Ref }
  | { type: "tiles"; photo: Ref; caption: Ref; title?: Ref }
  | { type: "timeline"; list: Ref; title?: Ref; style?: "rail" | "cards" | "time"; intro?: Ref }
  | { type: "route"; list: Ref; title?: Ref; end?: Ref }
  | { type: "gallery"; list: Ref; title?: Ref }
  | { type: "countdown"; date: Ref; title?: Ref }
  | { type: "song"; title: Ref; artist: Ref; story: Ref; link: Ref; memory?: Ref }
  | { type: "choose"; list: Ref; title?: Ref }
  | { type: "suggest"; list: Ref; title?: Ref }
  | { type: "dreams"; list: Ref; title?: Ref }
  | { type: "promises"; list: Ref; title?: Ref }
  | { type: "reasons"; list: Ref; title: Ref; style?: "big" | "card" | "note" }
  | { type: "invite"; title: Ref; idea?: Ref; custom?: Ref; when?: Ref; where?: Ref; note?: Ref; hideWhere?: Ref; cta?: string }
  | { type: "media"; video?: Ref; photo?: Ref; text?: Ref; title?: Ref }
  | { type: "ask"; question: Ref; sub?: Ref; choices: AskChoice[]; open?: Ref; playful?: boolean }
  | { type: "closing"; src: Ref; quote?: Ref; scene?: "petals" | "stars" | "dusk" | "dark" | "light" };

export type BeatType = Beat["type"];

export interface LetterSpec {
  slug: string;
  n: number;
  title: string;
  /** What it is for, in a line — shown on its own page and in the studio, never on a gallery card. */
  purpose: string;
  /** The feeling it aims at. */
  feeling: string;
  category: LetterCategory;
  tags: LetterTag[];
  tone: LetterTone;
  occasion: "birthday" | "anniversary" | "sorry" | "just_because" | "proposal" | "valentine" | "memory" | "custom";
  palette: Palette;
  fonts: Fonts;
  motion: MotionProfile;
  layout: Layout;
  ambient: Ambient;
  /** The atmospheric photograph behind it (an id from `images.ts`) and how it is graded. */
  backdrop: string;
  treatment: Treatment;
  /** The visual direction, written down so the next person can extend it without guessing. */
  direction: string;
  /** What kind of music suits it (the sender chooses; nothing plays by itself). */
  music: "none" | "piano" | "acoustic" | "cinematic" | "ambient" | "celebration" | "reflective" | "minimal" | "classical";
  /** The recipient may answer: false for the experiences that ask nothing of anyone. */
  reply: boolean;
  /** The playful, evasive “No” is allowed here (lighthearted invitations only). */
  playfulNo?: boolean;
  /** Notes that shape the builder: what the sender is reminded of, and what the experience will never do. */
  care: string[];
  fields: Field[];
  beats: Beat[];
}

export const isRef = (s: string | undefined): s is string => !!s && s.startsWith("@");
export const refKey = (s: string) => s.slice(1);
