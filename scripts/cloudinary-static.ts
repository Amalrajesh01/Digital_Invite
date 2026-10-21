/**
 * Puts the template pictures of the public site (public/templates/<slug>.webp, real screenshots of each design) on Cloudinary and
 * writes src/domain/catalogue/cloud-thumbs.json, the manifest the site reads. Commit the manifest; the site then serves those
 * pictures from Cloudinary (best format per browser) and falls back to the file in public/ for any template not listed.
 *
 *   npm run cloudinary:static
 *
 * Safe to re-run (nothing is overwritten; a picture that changed gets a new id). Nothing is deleted. After `scripts/dev/tpl.mjs`
 * makes new screenshots, run this again. Also reports the stock photographs, which are deliberately not moved (docs/CLOUDINARY.md).
 */
try { process.loadEnvFile(".env.local"); } catch { /* the variables may come from the real environment */ }
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env } from "../src/lib/env";
import { uploadImage } from "../src/lib/cloudinary";

const src = path.resolve("public", "templates");
const manifest = path.resolve("src", "domain", "catalogue", "cloud-thumbs.json");

async function main() {
  if (!env.cloudinary.configured) throw new Error("Cloudinary is not configured. Run `npm run cloudinary:check` first.");
  const thumbs: Record<string, { id: string; version: number }> = {};
  let uploaded = 0;
  let found = 0;
  for (const file of readdirSync(src).filter((f) => f.endsWith(".webp")).sort()) {
    const slug = file.replace(/\.webp$/, "");
    const data = readFileSync(path.join(src, file));
    // the id carries a short hash of the picture, so a re-made screenshot is a new id and never overwrites what is live
    const id = `${env.cloudinary.folder}/shared/template-thumbnails/${slug}-${createHash("sha256").update(data).digest("hex").slice(0, 8)}`;
    const up = await uploadImage(id, data, { tags: [env.cloudinary.folder, "template-thumbnail"] });
    if (up.bytes !== data.length) throw new Error(`${file}: Cloudinary holds ${up.bytes} bytes, sent ${data.length}`);
    thumbs[slug] = { id: up.publicId, version: up.version };
    if (up.existing) found++;
    else uploaded++;
  }
  writeFileSync(manifest, `${JSON.stringify({ cloud: env.cloudinary.cloudName, thumbs }, null, 2)}\n`);
  console.log(`✔ ${Object.keys(thumbs).length} template pictures on Cloudinary (${uploaded} uploaded, ${found} already there)`);
  console.log(`✔ wrote ${path.relative(process.cwd(), manifest)} — commit it`);
}

main().catch((e) => {
  console.error("✖", e instanceof Error ? e.message : e);
  process.exit(1);
});
