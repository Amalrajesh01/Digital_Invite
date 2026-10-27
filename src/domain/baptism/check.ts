import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BAPTISM_SPECS } from "@/domain/design/template-specs-baptism";
import { BAPTISM_SAMPLES } from "@/domain/catalogue/baptism-samples";
import { STOCK, STOCK_ID } from "@/domain/imagery/stock";
import { GENERATED } from "./generated";
import { MANIFEST, NEVER, OFF_TOPIC, SLOTS, looks, type SlotRow } from "./images";
import { ALLOWED_LICENCES, PHOTOS } from "./photos";
import { STORY, chapterCaption } from "./story";

/**
 * The gate for the baptism photography: every slot of every template is accounted for, every prompt is its own, every baby that opens a
 * template is a face, every gallery is a story of five to eight pictures that no other template tells in the same way, and every picture
 * is licensed and credited. `npm run baptism:check` prints the findings; the test suite fails on errors.
 */
export interface Finding { level: "error" | "warn"; templateId?: string; slot?: string; message: string }

/** An alt text that describes a wedding, a couple or bridal clothing: such a picture never belongs on a baptism. */
const WEDDINGISH = /\b(bride|groom|wedding|couple|newlywed|lehenga|sherwani|veil|honeymoon|engagement)\b/i;
/** A hero is a portrait; a gallery is five to eight pictures. */
export const GALLERY_MIN = 5;
export const GALLERY_MAX = 8;

export const promptSha = (row: Pick<SlotRow, "prompt">) => createHash("sha256").update(`${row.prompt}\n${NEVER}`).digest("hex").slice(0, 16);

async function sizeOf(dir: string, id: string) {
  try {
    const m = await sharp(await readFile(path.join(dir, `${id}.jpg`))).metadata();
    return m.width && m.height ? { w: m.width, h: m.height } : null;
  } catch {
    return null;
  }
}

export async function checkBaptism(opts: { dir?: string; credits?: string } = {}): Promise<Finding[]> {
  const dir = opts.dir ?? path.join(process.cwd(), "assets", "stock");
  const credits = await readFile(opts.credits ?? path.join(dir, "CREDITS.md"), "utf8").catch(() => "");
  const credited = new Set([...credits.matchAll(/`([A-Za-z0-9_-]{6,})`/g)].map((m) => m[1]));
  const out: Finding[] = [];
  const add = (level: Finding["level"], message: string, row?: { templateId: string; slot: string }) => out.push({ level, message, templateId: row?.templateId, slot: row?.slot });

  const slugs = BAPTISM_SPECS.map((s) => s.slug);
  if (slugs.length < 20) add("error", `${slugs.length} baptism templates; there must be at least twenty`);
  for (const s of slugs) {
    if (!looks[s]) add("error", "no art-direction brief (LOOK) for this template", { templateId: s, slot: "-" });
    if (!BAPTISM_SAMPLES[s]) add("error", "no sample facts (baptism-samples.ts)", { templateId: s, slot: "-" });
    if (!STORY[s]) add("error", "no baby story (story.ts): a portrait, a gallery and a church", { templateId: s, slot: "-" });
    for (const slot of SLOTS) if (!MANIFEST.some((r) => r.templateId === s && r.slot === slot)) add("error", `slot "${slot}" is not in the manifest`, { templateId: s, slot });
  }

  const ids = new Set<string>();
  const prompts = new Map<string, string>();
  for (const r of MANIFEST) {
    if (ids.has(r.assetId)) add("error", `asset id ${r.assetId} is used twice`, r);
    ids.add(r.assetId);
    if (!STOCK_ID.test(r.assetId)) add("error", `asset id ${r.assetId} is not a valid stock id (letters, digits, - and _, 6–24 characters)`, r);
    const dup = prompts.get(r.prompt);
    if (dup) add("error", `the prompt is identical to ${dup}`, r);
    prompts.set(r.prompt, `${r.templateId}/${r.slot}`);
    if (OFF_TOPIC.test(r.prompt)) add("error", `the prompt names something off-topic (“${r.prompt.match(OFF_TOPIC)?.[0]}”)`, r);
    if (!/Aspect ratio \d+:\d+\./.test(r.prompt) || r.prompt.length < 300 || r.prompt.length > 1800) add("error", "the prompt is missing an aspect ratio or is the wrong length", r);
    if (!r.subject || !r.culture || !r.composition) add("error", "the manifest row is incomplete", r);
    if (r.approved) add("warn", "marked approved — approval is the owner’s and should be recorded by them", r);

    if (r.status === "pending") continue;
    const id = r.stock!;
    if (r.status === "stand-in") continue; // stand-ins are checked once, below, as the story that uses them
    const info = STOCK[id];
    if (!info) { add("error", `${id}: not in the stock catalogue`, r); continue; }
    const g = GENERATED[id];
    if (!g || !g.tool || !g.date) add("error", `${id}: no provenance in generated.json (tool and date)`, r);
    else if (g.promptSha !== promptSha(r)) add("warn", `${id}: made from an earlier version of its prompt`, r);
  }

  // ── the baby of every template ───────────────────────────────────────────────────────────────────
  const heroOwner = new Map<string, string>();
  const gallerySet = new Map<string, string>();
  const checked = new Set<string>();
  const checkPhoto = async (id: string, templateId: string, slot: string) => {
    const where = { templateId, slot };
    const ph = PHOTOS[id];
    if (!ph) { add("error", `${id}: not in the baptism photo pool (photos.ts)`, where); return; }
    if (checked.has(id)) return;
    checked.add(id);
    const info = STOCK[id];
    if (!info?.alt.trim()) add("error", `${id}: no alternative text`, where);
    if (WEDDINGISH.test(ph.alt)) add("error", `${id}: its description mentions a wedding (“${ph.alt.match(WEDDINGISH)?.[0]}”) — it does not belong on a baptism`, where);
    if (!(ALLOWED_LICENCES as readonly string[]).includes(ph.licence)) add("error", `${id}: licence “${ph.licence}” is not one we may use`, where);
    if (!ph.by.trim()) add("error", `${id}: no author recorded`, where);
    if (!credited.has(id)) add("error", `${id}: not credited in assets/stock/CREDITS.md`, where);
    const s = await sizeOf(dir, id);
    if (!s) { add("error", `${id}: the file is missing or not a readable image`, where); return; }
    if (Math.max(s.w, s.h) < 1200) add("error", `${id}: ${s.w}×${s.h} is too small`, where);
    const ratio = s.w / s.h;
    if (ratio < 0.45 || ratio > 2.4) add("warn", `${id}: ratio ${ratio.toFixed(2)} will crop hard`, where);
  };
  for (const [slug, st] of Object.entries(STORY)) {
    const hero = PHOTOS[st.hero];
    await checkPhoto(st.hero, slug, "hero");
    if (hero && !hero.face) add("error", `${st.hero}: the picture that opens a template must show a face`, { templateId: slug, slot: "hero" });
    const owner = heroOwner.get(st.hero);
    if (owner) add("error", `${st.hero} also opens “${owner}” — every template opens on a different baby`, { templateId: slug, slot: "hero" });
    heroOwner.set(st.hero, slug);
    await checkPhoto(st.story, slug, "story");
    for (const id of [st.people?.parents, st.people?.grandparents, st.church]) if (id) await checkPhoto(id, slug, "people");

    const ph = st.gallery.map(([id]) => id);
    if (ph.length < GALLERY_MIN || ph.length > GALLERY_MAX) add("error", `a gallery is ${GALLERY_MIN}–${GALLERY_MAX} pictures, this one has ${ph.length}`, { templateId: slug, slot: "gallery" });
    if (new Set(ph).size !== ph.length) add("error", "a picture appears twice in the gallery", { templateId: slug, slot: "gallery" });
    if (ph.includes(st.hero)) add("error", "the portrait that opens the template is not repeated in its gallery", { templateId: slug, slot: "gallery" });
    for (const [id, chapter] of st.gallery) {
      await checkPhoto(id, slug, "gallery");
      const cap = chapterCaption(slug, chapter);
      if (!/ — /.test(cap) || cap.length > 120) add("error", `the caption “${cap}” is not “Title — a line” of a sensible length`, { templateId: slug, slot: "gallery" });
    }
    const key = [...ph].sort().join("|");
    const same = gallerySet.get(key);
    if (same) add("error", `the gallery is the same set of pictures as “${same}”`, { templateId: slug, slot: "gallery" });
    gallerySet.set(key, slug);
    if (!st.gallery.some(([id]) => PHOTOS[id]?.face)) add("error", "a baby’s face never appears in the gallery", { templateId: slug, slot: "gallery" });
  }
  return out;
}
