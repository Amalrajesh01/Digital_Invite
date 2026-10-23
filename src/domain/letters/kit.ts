import type { AskChoice, Field, Palette } from "./types";

/** Small constructors, so a spec reads as the experience it is rather than as a pile of braces. */
type Extra<T> = Omit<T, "key" | "kind" | "label">;
type Base = { hint?: string; placeholder?: string; default?: string; sample?: string; guard?: string; required?: boolean };

export const text = (key: string, label: string, o: Base & { max?: number } = {}): Field => ({ key, kind: "text", label, ...o });
export const long = (key: string, label: string, o: Base & { rows?: number } = {}): Field => ({ key, kind: "long", label, ...o });
export const date = (key: string, label: string, o: Base = {}): Field => ({ key, kind: "date", label, ...o });
export const toggle = (key: string, label: string, o: Base = {}): Field => ({ key, kind: "toggle", label, ...o });
export const photo = (key: string, label: string, o: Base = {}): Field => ({ key, kind: "photo", label, ...o });
export const choice = (key: string, label: string, options: [string, string][], o: Base = {}): Field => ({ key, kind: "choice", label, options: options.map(([value, l]) => ({ value, label: l })), ...o });
export const list = (key: string, label: string, itemLabel: string, max: number, item: Field[], o: Base & { min?: number; samples?: Record<string, string>[]; defaults?: Record<string, string>[] } = {}): Field =>
  ({ key, kind: "list", label, itemLabel, max, item, ...o });
export type { Extra };

export const palette = (bg: string, surface: string, ink: string, muted: string, accent: string, accent2: string, onAccent: string, dark = false): Palette => ({ bg, surface, ink, muted, accent, accent2, onAccent, dark });

/** The three answers most questions deserve: a yes, a middle way, and a plain no that is never made hard. */
export const answers = (yes: string, alt: string, no: string, altKind: AskChoice["kind"] = "alt"): AskChoice[] => [
  { key: "yes", label: yes, kind: "yes" },
  { key: "alt", label: alt, kind: altKind },
  { key: "no", label: no, kind: "no" },
];

/** Date ideas offered by the date-invitation experiences. */
export const DATE_IDEAS: [string, string][] = [["coffee", "Coffee"], ["dinner", "Dinner"], ["walk", "A walk"], ["movie", "A movie"], ["custom", "Something of my own"]];
export const IDEA_LABEL: Record<string, string> = { coffee: "Coffee", dinner: "Dinner", walk: "A walk", movie: "A movie", custom: "" };

/** Fields almost every letter offers. */
export const cover = (): Field => photo("cover", "A photograph for the opening (optional)", { hint: "If you leave this empty, a quiet backdrop of ours is used." });
export const closingField = (def: string, sample: string): Field => long("closing", "Your closing words", { rows: 4, hint: "The last thing they read. Blank lines make new paragraphs.", default: def, sample });
export const GLYPH_OPTIONS: [string, string][] = ["star", "moon", "music", "coffee", "candle", "key", "ticket", "camera", "leaf", "sun", "heart", "book"].map((k) => [k, k[0].toUpperCase() + k.slice(1)]);

/** A quiz of any number of rounds: a question, up to three answers, which is right (or none, for a question of taste), and what to show next. */
export const quizList = (key: string, label: string, n: number, samples?: Record<string, string>[]): Field =>
  list(key, label, "question", n, [
    text("q", "Question", { max: 140, placeholder: "[A question about the two of you]" }), text("a", "Answer A", { max: 80 }), text("b", "Answer B", { max: 80 }), text("c", "Answer C (optional)", { max: 80 }),
    choice("right", "The right answer", [["a", "A"], ["b", "B"], ["c", "C"]], { hint: "Leave it unset for a question that has no wrong answer." }),
    long("reveal", "What to show after they answer", { rows: 2, placeholder: "[The memory behind the answer]" }), text("hint", "A hint (optional)", { max: 100 }), photo("photo", "A photograph (optional)"),
  ], { min: 1, samples });

/** Dated moments, in the order they happened. */
export const milestoneList = (key: string, label: string, n: number, samples?: Record<string, string>[]): Field =>
  list(key, label, "moment", n, [text("title", "What happened", { max: 70 }), text("when", "When", { max: 40, placeholder: "[Month and year]" }), long("body", "A line or two about it", { rows: 3 }), photo("photo", "A photograph (optional)")], { min: 1, samples });
