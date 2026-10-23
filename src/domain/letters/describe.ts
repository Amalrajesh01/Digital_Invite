import type { Beat, GateStyle, LetterSpec } from "./types";

/** In plain words: what each opening is, and what each moment asks of the person who receives it. Generated from the spec, so the page can never drift from the experience. */
const GATE: Record<GateStyle, string> = {
  question: "A large question mark waits to be touched", quiet: "It opens quietly, with nothing but the words", mystery: "A midnight-blue envelope with a light inside", cards: "A fanned deck of cards to draw from",
  spotlight: "A spotlight on a single question mark", phone: "A message that was typed, and never sent", sealed: "A letter sealed with wax", develop: "A photograph slowly developing",
  film: "The title card of a film", numerals: "A number that counts up to your reasons", horizon: "A sun that rises as you touch it", book: "A book that opens",
  map: "A map with a route to follow", candle: "A candle to light", window: "A window that opens onto a view", orbit: "A little universe of orbiting planets",
  envelope: "An envelope to open", scroll: "A scroll tied with a ribbon", door: "A door that opens onto light", dawn: "A grey dawn that warms into colour",
  hold: "A heart to press and hold", cup: "A steaming cup, offered", lens: "A lens that opens", museum: "The doorway of a small museum",
  vinyl: "A record sliding out of its sleeve", notes: "A pile of handwritten notes", distance: "An arc between two places, with a light travelling along it", puzzle: "Puzzle pieces that fall into place",
  postcard: "A postcard from a day that has not happened yet", rain: "Rain on a window at night", lamp: "A lamp that comes on in the dark", time: "A dial that turns back through the years",
};

const MOMENT: { [K in Beat["type"]]?: string | ((b: Extract<Beat, { type: K }>) => string) } = {
  lines: (b) => ({ chat: "Messages that arrive one at a time, as if typed", film: "Captions, like the title cards of a film", stack: "Lines revealed one tap at a time", type: "Words that type themselves out", fade: "Words that arrive slowly, line by line" }[b.mode ?? "fade"]),
  sections: "Short, labelled passages, read in order",
  letter: "A letter, read slowly, with a pause between chapters",
  clues: (b) => (b.guess ? "A few clues, then a guess — and the answer is yours" : "Clues, revealed one by one"),
  quiz: "A quiz about the two of you, with a gentle answer to every question",
  flip: "Cards to turn over, each holding a memory",
  deck: "A deck of challenge cards: do it, or skip it",
  envelopes: "Several envelopes — choose one to open",
  scratch: "A surprise to scratch away (or simply reveal)",
  order: "Moments to put back in order",
  match: "A memory-matching game",
  tiles: "A picture uncovered square by square",
  timeline: (b) => (b.style === "time" ? "A journey back through the years, and home again" : "Milestones, in the order they happened"),
  route: "A route through the places that mattered",
  gallery: "A little museum to wander in any order",
  countdown: "A countdown — only if you give a real date",
  song: "A song, and the story behind it",
  choose: "“Which would you choose?” questions",
  suggest: "A plan chosen from their own answers",
  dreams: "Hopes unfolding one by one, offered as hopes",
  promises: "Promises, unsealed one at a time",
  reasons: "Things, one at a time",
  invite: "The invitation itself",
  media: "A photograph, a video link or a few words",
  ask: (b) => `The question — with ${b.choices.length} honest ways to answer`,
  closing: "A last scene and your closing words",
};

export function describeExperience(spec: LetterSpec): string[] {
  const out: string[] = [];
  for (const b of spec.beats) {
    if (b.type === "gate") { out.push(GATE[b.style]); continue; }
    const m = MOMENT[b.type] as undefined | string | ((b: Beat) => string);
    const t = typeof m === "function" ? m(b) : m;
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

const MUSIC: Record<LetterSpec["music"], string> = { none: "No music — it is best in silence", piano: "Soft romantic piano", acoustic: "Gentle acoustic", cinematic: "Cinematic orchestral", ambient: "Dreamlike ambience", celebration: "Warm celebration", reflective: "Reflective piano", minimal: "Minimalist instrumental", classical: "Gentle classical" };
export const musicLabel = (spec: LetterSpec) => MUSIC[spec.music];

/** What the sender will be asked for, in a sentence. */
export function whatYouAdd(spec: LetterSpec): string[] {
  const lists = spec.fields.filter((f) => f.kind === "list").length;
  const photos = spec.fields.some((f) => f.kind === "photo" || (f.kind === "list" && f.item.some((i) => i.kind === "photo")));
  const required = spec.fields.filter((f) => f.required).length;
  const items = [`${spec.fields.filter((f) => f.kind !== "photo" && f.kind !== "toggle" && f.kind !== "list").length} short pieces of writing`];
  if (lists) items.push(`${lists} ${lists === 1 ? "list" : "lists"} you can make as long or as short as you like`);
  if (photos) items.push("photographs of your own — optional");
  if (required) items.push(`${required} part${required === 1 ? "" : "s"} that cannot be left blank`);
  return items;
}
