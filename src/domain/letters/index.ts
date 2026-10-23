import { LETTER_CATEGORIES, LETTER_TAGS, type Field, type LetterCategory, type LetterSpec, type LetterTag } from "./types";
import { SPECS_A } from "./specs/a";
import { SPECS_B } from "./specs/b";
import { SPECS_C } from "./specs/c";
import { SPECS_D } from "./specs/d";
import { SPECS_E } from "./specs/e";
import { SPECS_F } from "./specs/f";

/**
 * Forever Letters: the whole catalogue, in order. Every page that lists experiences reads this (or the studio's on/off switches over
 * it) — nothing else holds a list of names or a count. Server-side only: the browser is handed just the one spec it plays.
 */
export const LETTERS: LetterSpec[] = [...SPECS_A, ...SPECS_B, ...SPECS_C, ...SPECS_D, ...SPECS_E, ...SPECS_F].sort((a, b) => a.n - b.n);

const BY_SLUG = new Map(LETTERS.map((l) => [l.slug, l]));
export const letterBySlug = (slug: string | null | undefined): LetterSpec | undefined => (slug ? BY_SLUG.get(slug) : undefined);

/** What a gallery card needs: a cover, a heading, a colour identity — and nothing of what is inside. */
export interface LetterCard {
  slug: string;
  n: number;
  title: string;
  category: LetterCategory;
  tags: LetterTag[];
  tone: LetterSpec["tone"];
  colors: [string, string, string];
  cover: string;
  tall: string;
}

export const letterCard = (l: LetterSpec): LetterCard => ({
  slug: l.slug, n: l.n, title: l.title, category: l.category, tags: l.tags, tone: l.tone,
  colors: [l.palette.bg, l.palette.accent, l.palette.accent2],
  cover: `/letters/cover/${l.slug}.webp`, tall: `/letters/tall/${l.slug}.webp`,
});

/** The filters worth showing: only those at least one of the given letters carries, in the catalogue's own order. */
export function availableTags(cards: Pick<LetterCard, "tags">[]): { key: LetterTag; label: string }[] {
  const have = new Set(cards.flatMap((c) => c.tags));
  return (Object.keys(LETTER_TAGS) as LetterTag[]).filter((k) => have.has(k)).map((k) => ({ key: k, label: LETTER_TAGS[k] }));
}

/**
 * What a recipient's browser is given: the look, the beats and the defaults, and nothing of the studio's demonstration copy, prompts,
 * hints or explanations. (The builder, which needs those, receives the whole spec.)
 */
export function slimSpec(spec: LetterSpec): LetterSpec {
  const slimField = (f: Field): Field => {
    const base = { key: f.key, kind: f.kind, label: "" } as Record<string, unknown>;
    if ("default" in f && f.default !== undefined) base.default = f.default;
    if (f.kind === "list") { base.item = f.item.map(slimField); base.itemLabel = ""; base.max = f.max; if (f.defaults) base.defaults = f.defaults; }
    if (f.kind === "choice") base.options = [];
    return base as unknown as Field;
  };
  return { ...spec, purpose: "", feeling: "", direction: "", care: [], fields: spec.fields.map(slimField) };
}

export const categoryOf = (key: LetterCategory) => LETTER_CATEGORIES.find((c) => c.key === key)!;

/** Names for the public demonstration: invented, varied, and not one of them a real customer's. */
const DEMO_PAIRS: [string, string][] = [["Meera", "Arjun"], ["Ananya", "Rohan"], ["Nila", "Kiran"], ["Sara", "Dev"], ["Kabir", "Arjun"], ["Tara", "Neel"], ["Anika", "Meera"], ["Ishaan", "Rhea"]];
export function demoNames(spec: LetterSpec) {
  const [to, from] = DEMO_PAIRS[spec.n % DEMO_PAIRS.length];
  return { to, from, nick: "", sign: from, anonymous: false };
}

export { LETTER_CATEGORIES, LETTER_TAGS };
export type { LetterCategory, LetterSpec, LetterTag };
