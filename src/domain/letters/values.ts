import { isRef, refKey, type Beat, type Field, type Item, type LetterSpec, type Values } from "./types";

/**
 * Reading and cleaning what a sender wrote. Pure functions, used by the server (to clean what is saved, to filter what is
 * published) and by the browser (to show it). A field the sender never touched falls back to its `default`; a field they
 * cleared on purpose (an empty string) stays empty.
 */
export const fieldOf = (spec: LetterSpec, key: string): Field | undefined => spec.fields.find((f) => f.key === key);

const clean = (s: string) => s.replace(/\r\n?/g, "\n").trim();

export function textOf(spec: LetterSpec, v: Values, key: string): string {
  const f = fieldOf(spec, key);
  const raw = v[key];
  if (typeof raw === "string") return clean(raw);
  if (raw === undefined && f && f.kind !== "list") return clean(f.default ?? "");
  return "";
}

/** The items of a list field, without the ones the sender left blank. */
export function itemsOf(spec: LetterSpec, v: Values, key: string): Item[] {
  const f = fieldOf(spec, key);
  if (!f || f.kind !== "list") return [];
  const raw = v[key] ?? f.defaults ?? [];
  if (!Array.isArray(raw)) return [];
  // the first sub-field is the item's main content: an item without it is an empty row, however it is otherwise set
  const main = f.item[0]?.key;
  return raw.map((it) => Object.fromEntries(Object.entries(it).map(([k, x]) => [k, clean(String(x))]))).filter((it) => (main ? !!it[main] : Object.values(it).some(Boolean)));
}

/** Literal copy, or the text of the field it points to. */
export const resolveText = (spec: LetterSpec, v: Values, ref: string | undefined): string => (!ref ? "" : isRef(ref) ? textOf(spec, v, refKey(ref)) : ref);

/** Paragraphs separated by blank lines; or, when there is only one block, its lines. */
export const paragraphs = (s: string): string[] => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
export const lines = (s: string): string[] => s.split(/\n/).map((p) => p.trim()).filter(Boolean);

/** The values the public demonstration shows: every sample, falling back to the defaults. */
export function demoValues(spec: LetterSpec): Values {
  const out: Values = {};
  for (const f of spec.fields) {
    if (f.kind === "list") out[f.key] = (f.samples ?? f.defaults ?? []).map((i) => ({ ...i }));
    else if (f.kind === "date" && f.sample && /^\+\d+d$/.test(f.sample)) out[f.key] = new Date(Date.now() + Number(f.sample.slice(1, -1)) * 86_400_000).toISOString().slice(0, 10); // the demonstration's “in sixty days”
    else if (f.sample !== undefined) out[f.key] = f.sample;
    else if (f.default !== undefined) out[f.key] = f.default;
  }
  return out;
}

/** Does a beat have anything to show? A beat with nothing to say is skipped, never shown half empty. */
export function beatHasContent(spec: LetterSpec, v: Values, b: Beat): boolean {
  const T = (r?: string) => !!resolveText(spec, v, r);
  const L = (r: string) => itemsOf(spec, v, refKey(r)).length > 0;
  switch (b.type) {
    case "gate": case "closing": return b.type === "gate" || T(b.src);
    case "lines": case "scratch": return T(b.src);
    case "sections": return b.parts.some((p) => T(p.src));
    case "letter": return T(b.src);
    case "clues": case "quiz": case "flip": case "deck": case "envelopes": case "order": case "match": case "timeline": case "route": case "gallery": case "choose": case "suggest": case "dreams": case "promises": case "reasons": return L(b.list);
    case "tiles": return T(b.caption);
    case "countdown": {
      const d = resolveText(spec, v, b.date);
      return /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(`${d}T23:59:59`).getTime() > Date.now(); // only ever a real, upcoming date
    }
    case "song": return T(b.title);
    case "invite": return T(b.title) || T(b.when) || T(b.where) || T(b.idea);
    case "media": return T(b.video) || T(b.photo) || T(b.text);
    case "ask": return true;
  }
}

/** Every key a beat reads — used to check a spec (and by the tests) so a typo in a reference fails loudly. */
export function beatRefs(b: Beat): string[] {
  const out: string[] = [];
  const add = (r?: string) => { if (isRef(r)) out.push(refKey(r)); };
  for (const [k, val] of Object.entries(b)) {
    if (k === "type" || k === "style" || k === "cta" || k === "hint") continue;
    if (typeof val === "string") add(val);
    else if (Array.isArray(val)) for (const x of val) { if (typeof x === "string") add(x); else if (x && typeof x === "object") for (const y of Object.values(x)) if (typeof y === "string") add(y); }
    else if (val && typeof val === "object") for (const y of Object.values(val)) if (typeof y === "string") add(y);
  }
  return out;
}

/** What is wrong with a spec, in words. Empty when it is sound. */
export function checkSpec(spec: LetterSpec): string[] {
  const problems: string[] = [];
  const keys = new Set<string>();
  for (const f of spec.fields) {
    if (keys.has(f.key)) problems.push(`duplicate field ${f.key}`);
    keys.add(f.key);
  }
  if (spec.beats[0]?.type !== "gate") problems.push("the first beat must be a gate");
  if (spec.beats.filter((b) => b.type === "gate").length !== 1) problems.push("exactly one gate");
  for (const b of spec.beats) for (const k of beatRefs(b)) if (!keys.has(k)) problems.push(`beat ${b.type} reads unknown field "${k}"`);
  return problems;
}

// ── saving ─────────────────────────────────────────────────────────────────────────────────────────────
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function cleanOne(f: Field, raw: unknown, owned: (id: string) => boolean): string {
  const s = typeof raw === "string" ? raw : "";
  switch (f.kind) {
    case "text": return s.replace(/[\r\n]+/g, " ").slice(0, f.max ?? 160);
    case "long": return s.slice(0, 4000);
    case "date": return ISO.test(s) ? s : "";
    case "choice": return f.options.some((o) => o.value === s) ? s : "";
    case "toggle": return s === "1" ? "1" : "";
    case "photo": return UUID.test(s) && owned(s) ? s : "";
    case "list": return "";
  }
}

/** Keeps only what the spec asks for, within limits, and only photographs that belong to this gift. Everything else is dropped. */
export function cleanValues(spec: LetterSpec, input: unknown, owned: (id: string) => boolean): Values {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Values = {};
  for (const f of spec.fields) {
    const raw = src[f.key];
    if (raw === undefined) continue;
    if (f.kind === "list") {
      const arr = Array.isArray(raw) ? raw.slice(0, f.max) : [];
      out[f.key] = arr.map((it) => {
        const o = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
        const item: Item = {};
        for (const sub of f.item) if (sub.kind !== "list") item[sub.key] = cleanOne(sub, o[sub.key], owned);
        return item;
      });
    } else out[f.key] = cleanOne(f, raw, owned);
  }
  return out;
}

/** The photograph ids a letter uses (so a deleted photograph can be removed from it). */
export function photoIds(spec: LetterSpec, v: Values): string[] {
  const ids = new Set<string>();
  for (const f of spec.fields) {
    if (f.kind === "photo" && typeof v[f.key] === "string" && v[f.key]) ids.add(v[f.key] as string);
    if (f.kind === "list") for (const it of itemsOf(spec, v, f.key)) for (const sub of f.item) if (sub.kind === "photo" && it[sub.key]) ids.add(it[sub.key]);
  }
  return [...ids];
}

export function withoutPhoto(spec: LetterSpec, v: Values, id: string): Values {
  const out: Values = { ...v };
  for (const f of spec.fields) {
    if (f.kind === "photo" && out[f.key] === id) out[f.key] = "";
    if (f.kind === "list" && Array.isArray(out[f.key])) out[f.key] = (out[f.key] as Item[]).map((it) => Object.fromEntries(Object.entries(it).map(([k, x]) => [k, x === id ? "" : x])));
  }
  return out;
}

/**
 * Fields that must not reach a recipient's browser unless the sender has said so: `{ where: "revealPlace" }` means the place
 * is removed from the published document unless the toggle `revealPlace` is on. Computed from the spec when the gift is saved,
 * and applied (without the spec) wherever a guest's copy of the document is made.
 */
export function guardsOf(spec: LetterSpec): Record<string, string> {
  const g: Record<string, string> = {};
  for (const f of spec.fields) if (f.guard) g[f.key] = f.guard;
  return g;
}

export function applyGuards(v: Values, guards: Record<string, string>): Values {
  const out: Values = { ...v };
  for (const [key, unlock] of Object.entries(guards)) if (out[unlock] !== "1") delete out[key];
  return out;
}

/** Labels of the required fields the sender has not written yet. */
export function missingRequired(spec: LetterSpec, v: Values): string[] {
  return spec.fields.filter((f) => f.required && (f.kind === "list" ? itemsOf(spec, v, f.key).length === 0 : !textOf(spec, v, f.key))).map((f) => f.label);
}
