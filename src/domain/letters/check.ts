import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { LETTER_IMAGES } from "./images";
import { LETTERS } from "./index";
import { checkSpec } from "./values";
import type { Beat } from "./types";

/**
 * The quality gate for Forever Letters (npm run letters:check, and a test). It checks what a person looking at the finished
 * product would otherwise have to notice: a photograph that is missing, small, wrongly cropped, undescribed, unlicensed or used
 * twice; a cover that was never made; a specification that points at nothing; and the rules that keep the serious experiences
 * serious — dark only for closure, no game or reply or confetti where there should be none.
 */
export interface Finding { level: "error" | "warn"; id: string; message: string }

const ROOT = process.cwd();
const LICENCES = /^(Unsplash License|CC0|Public domain|CC BY(-SA)? [0-9.]+)$/;
const sha = (file: string) => createHash("sha1").update(readFileSync(file)).digest("hex");

export async function checkLetters(): Promise<Finding[]> {
  const out: Finding[] = [];
  const err = (id: string, message: string) => out.push({ level: "error", id, message });
  const warn = (id: string, message: string) => out.push({ level: "warn", id, message });
  const credits = readFileSync(path.join(ROOT, "assets/stock/CREDITS.md"), "utf8");

  // ── photographs ───────────────────────────────────────────────────────────────────────────────────
  const seen = new Map<string, string>();
  const refs = new Map<string, string>();
  for (const im of LETTER_IMAGES) {
    const file = path.join(ROOT, "public/letters/photos", `${im.id}.webp`);
    if (!existsSync(file)) { err(im.id, "the processed photograph is missing (run npm run letters:images)"); continue; }
    if (!existsSync(path.join(ROOT, "assets/stock", `${im.ref}.jpg`))) err(im.id, `the licensed original assets/stock/${im.ref}.jpg is missing`);
    const m = await sharp(file).metadata();
    const w = m.width ?? 0, h = m.height ?? 0;
    if (Math.max(w, h) < 800) err(im.id, `too small (${w}×${h})`); else if (Math.max(w, h) < 1000) warn(im.id, `a little small (${w}×${h}) for a phone at 3×`);
    if (Math.abs(w / h - 2 / 3) > 0.03) err(im.id, `not a 2:3 crop (${w}×${h})`);
    if (im.alt.trim().length < 20) err(im.id, "its description is missing or too short");
    if (!LICENCES.test(im.licence)) err(im.id, `licence not recognised or not verified: "${im.licence}"`);
    if (!credits.includes(`\`${im.ref}\``)) err(im.id, `the original ${im.ref} has no credit line in assets/stock/CREDITS.md`);
    const h1 = sha(file);
    if (seen.has(h1)) err(im.id, `identical to ${seen.get(h1)}`); else seen.set(h1, im.id);
    if (refs.has(im.ref)) err(im.id, `the same original as ${refs.get(im.ref)}`); else refs.set(im.ref, im.id);
    if (/placeholder|lorem|test/i.test(im.id + im.alt)) err(im.id, "looks like a placeholder");
  }
  const known = new Set(LETTER_IMAGES.map((i) => i.id));
  const used = new Set<string>();

  // ── experiences ───────────────────────────────────────────────────────────────────────────────────
  const slugs = new Set<string>();
  const ns = new Set<number>();
  const backdrops = new Map<string, string>();
  for (const l of LETTERS) {
    if (slugs.has(l.slug)) err(l.slug, "duplicate slug"); slugs.add(l.slug);
    if (ns.has(l.n)) err(l.slug, `duplicate number ${l.n}`); ns.add(l.n);
    for (const p of checkSpec(l)) err(l.slug, p);
    if (!known.has(l.backdrop)) err(l.slug, `backdrop "${l.backdrop}" is not in the image manifest`); else used.add(l.backdrop);
    if (backdrops.has(l.backdrop)) warn(l.slug, `shares its backdrop with ${backdrops.get(l.backdrop)}`); else backdrops.set(l.backdrop, l.slug);
    for (const f of l.fields) for (const s of [f.kind === "list" ? f.samples?.flatMap((x) => Object.values(x)) : [f.sample ?? ""]].flat()) if (s && known.has(s)) used.add(s);
    for (const [kind, w] of [["cover", 540], ["tall", 520]] as const) {
      const file = path.join(ROOT, "public/letters", kind, `${l.slug}.webp`);
      if (!existsSync(file)) { err(l.slug, `the ${kind} picture is missing (run scripts/dev/letters-covers.mjs)`); continue; }
      const m = await sharp(file).metadata();
      if (m.width !== w) err(l.slug, `the ${kind} picture should be ${w} wide, not ${m.width}`);
      if (kind === "cover" && (m.height ?? 0) < 900) err(l.slug, "the cover picture is too short");
    }

    // the serious ones stay serious
    const beats: Beat[] = l.beats;
    const closure = l.category === "closure";
    const hasAsk = beats.some((b) => b.type === "ask");
    if ((l.tone === "dark") !== closure) err(l.slug, "the dark tone belongs to the closure experiences, and only to them");
    if (closure) {
      if (!l.palette.dark) err(l.slug, "a closure experience must use the dark palette");
      if (l.reply || hasAsk) err(l.slug, "a closure experience must not ask for or collect an answer");
      if (l.motion !== "dark") err(l.slug, "a closure experience uses the dark motion profile");
      if (beats.some((b) => b.type === "closing" && b.scene !== "dark")) err(l.slug, "a closure experience closes in the dark, never with petals or light");
      if (beats.some((b) => ["quiz", "flip", "deck", "envelopes", "scratch", "order", "match", "tiles", "choose", "clues"].includes(b.type))) err(l.slug, "a closure experience has no game");
      if (LETTER_IMAGES.find((i) => i.id === l.backdrop)?.people) err(l.slug, "a closure experience does not use a photograph of people as its backdrop");
    }
    if (l.playfulNo && !(l.tone === "romantic" || l.tone === "playful")) err(l.slug, "the moving “No” belongs only to lighthearted invitations");
    if (l.playfulNo && l.category !== "confess") err(l.slug, "the moving “No” belongs only to date and confession invitations");
    if (l.category === "repair") {
      if (l.playfulNo) err(l.slug, "no moving “No” in an apology");
      if (beats.some((b) => b.type === "closing" && (b.scene === "petals" || b.scene === "stars"))) err(l.slug, "no celebration in an apology");
      if (l.ambient !== "none" && l.ambient !== "dust") err(l.slug, "an apology has no decoration");
      if (!["none", "piano", "minimal", "ambient", "reflective"].includes(l.music)) err(l.slug, "an apology suggests silence or something restrained, never celebration");
      if (LETTER_IMAGES.find((i) => i.id === l.backdrop)?.people && l.slug !== "can-we-talk-heart-to-heart") warn(l.slug, "an apology's backdrop is a photograph of people");
    }
    // every experience that asks gives a way to say no, in plain words
    for (const b of beats) if (b.type === "ask" && !b.choices.some((c) => c.kind === "no" || c.kind === "later" || c.kind === "talk" || c.kind === "open")) err(l.slug, "a question must offer a way to decline or defer");
    // every text the platform wrote itself is free of leftovers
    const text = JSON.stringify([l.fields, l.beats]);
    if (/lorem|todo|xxx|\[\s*\]/i.test(text)) err(l.slug, "contains a leftover placeholder");
  }
  for (let n = 1; n <= LETTERS.length; n++) if (!ns.has(n)) err("catalogue", `number ${n} is missing`);
  for (const id of known) if (!used.has(id)) warn(id, "not used by any experience");
  return out;
}
