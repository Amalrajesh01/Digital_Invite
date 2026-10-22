import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { CASTING, ROLE_RATIO, manifestFor, type ImageRole } from "./casting";
import { STOCK } from "./stock";

/**
 * The image-quality gate for the demonstration photography: every part a photograph plays in a template is checked against the
 * file itself and against the rules the brief sets — present, a real image, large enough, a ratio that crops cleanly, described,
 * licensed, and (for heroes) not shared with another new template. `npm run images:check` prints the findings; the test suite fails on errors.
 */
export interface Finding { level: "error" | "warn"; templateId?: string; stock?: string; message: string }

/** Longest and shortest side, in pixels, below which a photograph in that role looks soft on a modern phone or monitor. */
const MIN: Partial<Record<ImageRole, { long: number; short: number }>> = { hero: { long: 1600, short: 1000 }, heroWide: { long: 2000, short: 1100 }, venue: { long: 1400, short: 800 }, ceremony: { long: 1400, short: 800 }, gallery: { long: 1200, short: 700 } };

const SIZE_CACHE = new Map<string, { w: number; h: number; format: string } | null>();
async function sizeOf(dir: string, id: string) {
  const key = `${dir}|${id}`;
  if (SIZE_CACHE.has(key)) return SIZE_CACHE.get(key)!;
  let out: { w: number; h: number; format: string } | null = null;
  try {
    const m = await sharp(await readFile(path.join(dir, `${id}.jpg`))).metadata();
    out = m.width && m.height ? { w: m.width, h: m.height, format: m.format ?? "" } : null;
  } catch {
    out = null;
  }
  SIZE_CACHE.set(key, out);
  return out;
}

export async function checkManifest(opts: { dir?: string; credits?: string } = {}): Promise<Finding[]> {
  const dir = opts.dir ?? path.join(process.cwd(), "assets", "stock");
  const credits = await readFile(opts.credits ?? path.join(dir, "CREDITS.md"), "utf8").catch(() => "");
  const credited = new Set([...credits.matchAll(/`([A-Za-z0-9_-]{6,})`/g)].map((m) => m[1]));
  const out: Finding[] = [];
  const heroOwner = new Map<string, string>();

  for (const templateId of Object.keys(CASTING)) {
    const c = CASTING[templateId];
    const prior = heroOwner.get(c.hero);
    if (prior) out.push({ level: "error", templateId, stock: c.hero, message: `the hero is also the hero of “${prior}” — every new template opens on its own photograph` });
    heroOwner.set(c.hero, templateId);
    if (c.gallery.length < 6) out.push({ level: "warn", templateId, message: `only ${c.gallery.length} gallery photographs` });

    for (const e of manifestFor(templateId, credited)) {
      const at = { templateId, stock: e.stock };
      if (!STOCK[e.stock]) { out.push({ level: "error", ...at, message: "not in the stock catalogue (src/domain/imagery/stock.ts)" }); continue; }
      if (!e.alt.trim()) out.push({ level: "error", ...at, message: "no alternative text" });
      if (e.licenceStatus !== "verified") out.push({ level: "error", ...at, message: "licence not recorded in assets/stock/CREDITS.md" });
      const s = await sizeOf(dir, e.stock);
      if (!s) { out.push({ level: "error", ...at, message: `${e.assetType}: the file is missing or is not a readable image` }); continue; }
      if (s.format !== "jpeg") out.push({ level: "warn", ...at, message: `format is ${s.format}, expected jpeg` });
      const min = MIN[e.assetType];
      if (min && Math.max(s.w, s.h) < min.long) out.push({ level: e.assetType === "hero" ? "error" : "warn", ...at, message: `${e.assetType}: ${s.w}×${s.h} is below ${min.long} px on the long side` });
      else if (min && Math.min(s.w, s.h) < min.short) out.push({ level: "warn", ...at, message: `${e.assetType}: ${s.w}×${s.h} is below ${min.short} px on the short side` });
      const ratio = s.w / s.h, r = ROLE_RATIO[e.assetType];
      if (ratio < r.min || ratio > r.max) out.push({ level: "warn", ...at, message: `${e.assetType}: ratio ${ratio.toFixed(2)} is outside ${r.min}–${r.max}, so it will crop hard` });
    }
  }
  return out;
}
