import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BAPTISM_SAMPLES } from "../src/domain/catalogue/baptism-samples";
import { promptSha } from "../src/domain/baptism/check";
import { MANIFEST, SLOTS, assetIdFor, type Slot } from "../src/domain/baptism/images";
import type { GeneratedImage } from "../src/domain/baptism/generated";

/**
 * Brings one generated picture into a baptism template — the step that happens after someone has made it from the prompt in
 * docs/BAPTISM-IMAGES.md with an image service of their choice. Nothing in this repository can generate an image.
 *
 *   npm run baptism:ingest -- <template> <slot> <file> --tool "<service>" [--model "<name>"] [--alt "<description>"] [--focal 50,40] [--reviewed]
 *
 * It resizes and cleans the file (longest side ≤ 2400 px, metadata removed), saves it as assets/stock/<id>.jpg, records who made it
 * and from which prompt in src/domain/baptism/generated.json, and — for a hero — makes it the sample's main photograph.
 */
const args = process.argv.slice(2);
const VALUE_FLAGS = new Set(["--tool", "--model", "--alt", "--focal"]);
const flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.filter((a, i) => !a.startsWith("--") && !VALUE_FLAGS.has(args[i - 1] ?? ""));
const [templateId, slotArg, file] = positional;

async function main() {
  if (!templateId || !slotArg || !file) throw new Error('Usage: npm run baptism:ingest -- <template> <slot> <file> --tool "<service>" [--model …] [--alt …] [--focal x,y] [--reviewed]');
  if (!BAPTISM_SAMPLES[templateId]) throw new Error(`Unknown template “${templateId}”.`);
  if (!(SLOTS as readonly string[]).includes(slotArg)) throw new Error(`Unknown slot “${slotArg}”; one of ${SLOTS.join(", ")}.`);
  const slot = slotArg as Slot;
  const tool = flag("tool");
  if (!tool) throw new Error('Say what made the picture with --tool "<service>": provenance is never left blank.');
  const row = MANIFEST.find((r) => r.templateId === templateId && r.slot === slot)!;
  const id = assetIdFor(templateId, slot);

  const img = sharp(await readFile(file), { failOn: "error" });
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error("That file is not a readable image.");
  const long = Math.max(meta.width, meta.height);
  if (slot === "hero" && long < 1200) throw new Error(`${meta.width}×${meta.height} is too small for a hero (at least 1200 px on the long side).`);
  const out = await img.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84, progressive: true }).toBuffer({ resolveWithObject: true });
  await mkdir(path.join("assets", "stock"), { recursive: true });
  await writeFile(path.join("assets", "stock", `${id}.jpg`), out.data);

  const [fx, fy] = (flag("focal") ?? "").split(",").map(Number);
  const entry: GeneratedImage = {
    alt: flag("alt") ?? `${row.subject}.`, focal: Number.isFinite(fx) && Number.isFinite(fy) ? { x: fx, y: fy } : row.focal, tool, model: flag("model"), date: new Date().toISOString().slice(0, 10),
    promptSha: promptSha(row), width: out.info.width, height: out.info.height, reviewed: args.includes("--reviewed"),
  };
  const jsonPath = path.join("src", "domain", "baptism", "generated.json");
  const all = JSON.parse(await readFile(jsonPath, "utf8")) as Record<string, GeneratedImage>;
  all[id] = entry;
  await writeFile(jsonPath, `${JSON.stringify(all, null, 2)}\n`);

  if (slot === "hero") {
    const samples = path.join("src", "domain", "catalogue", "baptism-samples.ts");
    const text = (await readFile(samples, "utf8")).replace(/\r\n/g, "\n");
    const line = new RegExp(`(^\\s*"${templateId}": \\{[^\\n]*?)(, photo: "[^"]*")?( \\},?\\s*$)`, "m");
    if (!line.test(text)) throw new Error(`Could not find the ${templateId} line in baptism-samples.ts to give it its photograph.`);
    await writeFile(samples, text.replace(line, `$1, photo: "${id}"$3`));
  }
  console.log(`✔ ${id}.jpg  ${entry.width}×${entry.height}  (${tool}${entry.model ? `, ${entry.model}` : ""})`);
  console.log("Next: npm run baptism:check · re-seed the sample (npm run demo:drop -- <sample>, then SEED_ONLY=public-demos npm run db:seed) · look at it in the real template at phone size · set reviewed in generated.json.");
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
