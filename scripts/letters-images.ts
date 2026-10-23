/**
 * npm run letters:images — builds public/letters/photos/<id>.webp for every photograph in src/domain/letters/images.ts:
 * a 2:3 portrait crop of the licensed original in assets/stock/, centred on the photograph's focal point (a phone is the
 * main screen), at most 1200×1800, WebP. Safe to run again; pass an id to rebuild one.
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { LETTER_IMAGES } from "../src/domain/letters/images";

const only = process.argv[2];
async function main() {
  await mkdir("public/letters/photos", { recursive: true });
  let n = 0;
  for (const im of LETTER_IMAGES) {
    if (only && im.id !== only) continue;
    const src = `assets/stock/${im.ref}.jpg`;
    if (!existsSync(src)) { console.log(`MISSING ${src} (${im.id})`); process.exitCode = 1; continue; }
    const input = sharp(src).rotate();
    const { width: w = 0, height: h = 0 } = await sharp(await input.clone().toBuffer()).metadata();
    const aspect = 2 / 3;
    let cw = Math.min(w, Math.round(h * aspect)), ch = Math.round(cw / aspect);
    if (ch > h) { ch = h; cw = Math.round(ch * aspect); }
    const left = Math.max(0, Math.min(w - cw, Math.round((im.focal.x / 100) * w - cw / 2)));
    const top = Math.max(0, Math.min(h - ch, Math.round((im.focal.y / 100) * h - ch / 2)));
    const outW = Math.min(1200, cw);
    await sharp(src).rotate().extract({ left, top, width: cw, height: ch }).resize({ width: outW, withoutEnlargement: true }).webp({ quality: 76, effort: 5 }).toFile(`public/letters/photos/${im.id}.webp`);
    n++;
  }
  console.log(`${n} photographs written`);
}
void main();
