import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BAPTISM_SPECS } from "@/domain/design/template-specs-baptism";
import { BAPTISM_SAMPLES } from "@/domain/catalogue/baptism-samples";
import { STOCK, STOCK_ID } from "@/domain/imagery/stock";
import { GENERATED } from "./generated";
import { MANIFEST, NEVER, OFF_TOPIC, SLOTS, looks, type SlotRow } from "./images";

/**
 * The gate for the baptism photography: every slot of every template is accounted for, every prompt is its own, and no picture
 * stands where it does not belong. `npm run baptism:check` prints the findings; the test suite fails on errors.
 */
export interface Finding { level: "error" | "warn"; templateId?: string; slot?: string; message: string }

/** An alt text that describes a wedding, a couple or bridal clothing: such a picture never belongs on a baptism. */
const WEDDINGISH = /\b(bride|groom|wedding|couple|newlywed|lehenga|sherwani|veil|honeymoon|engagement)\b/i;

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
  if (slugs.length !== 20) add("error", `${slugs.length} baptism templates; the brief asks for exactly twenty`);
  for (const s of slugs) {
    if (!looks[s]) add("error", "no art-direction brief (LOOK) for this template", { templateId: s, slot: "-" });
    if (!BAPTISM_SAMPLES[s]) add("error", "no sample facts (baptism-samples.ts)", { templateId: s, slot: "-" });
    for (const slot of SLOTS) if (!MANIFEST.some((r) => r.templateId === s && r.slot === slot)) add("error", `slot "${slot}" is not in the manifest`, { templateId: s, slot });
  }

  const ids = new Set<string>();
  const prompts = new Map<string, string>();
  const stockOwner = new Map<string, string>();
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
    const info = STOCK[id];
    if (!info) { add("error", `${id}: not in the stock catalogue`, r); continue; }
    if (!info.alt.trim()) add("error", `${id}: no alternative text`, r);
    if (WEDDINGISH.test(info.alt)) add("error", `${id}: its description mentions a wedding (“${info.alt.match(WEDDINGISH)?.[0]}”) — it does not belong on a baptism`, r);
    const owner = stockOwner.get(id);
    if (owner && owner !== r.templateId) add("error", `${id} is also used by “${owner}” — a picture is never reused to fill another template’s gap`, r);
    stockOwner.set(id, r.templateId);
    const s = await sizeOf(dir, id);
    if (!s) { add("error", `${id}: the file is missing or not a readable image`, r); continue; }
    const long = Math.max(s.w, s.h);
    if (r.slot === "hero" && long < 1200) add("error", `${id}: ${s.w}×${s.h} is too small for a hero`, r);
    const ratio = s.w / s.h;
    if (ratio < 0.45 || ratio > 2.4) add("warn", `${id}: ratio ${ratio.toFixed(2)} will crop hard`, r);
    if (r.status === "stand-in") {
      if (!credited.has(id)) add("error", `${id}: licence not recorded in assets/stock/CREDITS.md`, r);
    } else {
      const g = GENERATED[id];
      if (!g || !g.tool || !g.date) add("error", `${id}: no provenance in generated.json (tool and date)`, r);
      else if (g.promptSha !== promptSha(r)) add("warn", `${id}: made from an earlier version of its prompt`, r);
    }
  }

  for (const [slug, f] of Object.entries(BAPTISM_SAMPLES)) {
    const hero = MANIFEST.find((r) => r.templateId === slug && r.slot === "hero");
    if ((f.photo ?? "") !== (hero?.stock ?? "") && hero?.status !== "generated") add("error", "the sample’s photograph and the manifest’s hero disagree", { templateId: slug, slot: "hero" });
  }
  return out;
}
