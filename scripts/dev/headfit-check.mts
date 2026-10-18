/**
 * Eyeball check of the automatic head framing: for each stock portrait, the picture with the face box found (top row) and the
 * circle the walking figure would show (bottom row), plus the old fixed framing (middle row) for comparison.
 *   npx tsx scripts/dev/headfit-check.mts [out.png] [id id id …]
 */
import sharp from "sharp";
import { detectBoxes } from "../../src/lib/face-detect";
import { fitFor, headFromBox } from "../../src/invitation/engine/headfit";

const out = process.argv[2] ?? ".shots/headfit.png";
const ids = process.argv.slice(3).length ? process.argv.slice(3) : ["aHJ0hciTzG4", "mab4JkLEe80", "VPwSJhu5uhs", "H7JlEmkKqW8", "P5vYhunc6Ac", "vZbWlXzZtAY", "QF21BkDlQHo", "5pZLu6-Y5Xc", "gXWVyFpRCRU", "2DZmm6QKFQE", "ICnMRhxJLYg", "3ZISmV72cbM", "ykcXm_u84sg", "Zx9In5UiU0w", "pLDDrRkLMWY", "2QDYXAEfFPk"];
const C = 150;

const cells: sharp.OverlayOptions[] = [];
for (const [i, id] of ids.entries()) {
  const file = `assets/stock/${id}.jpg`;
  const meta = await sharp(file).metadata();
  const W = meta.width!, H = meta.height!;
  const k = Number(process.env.WORK ?? 256) / Math.max(W, H);
  const small = await sharp(file).resize(Math.round(W * k), Math.round(H * k)).greyscale().raw().toBuffer({ resolveWithObject: true });
  const t0 = Date.now();
  const boxes = detectBoxes(small.data, small.info.width, small.info.height, Number(process.env.MINN ?? 3));
  const ms = Date.now() - t0;
  const face = headFromBox(boxes[0], small.info.width, small.info.height);
  const fit = fitFor(face);
  const left = i * C;
  // 1 · picture with the face box
  const thumb = await sharp(file).resize(C, C, { fit: "contain", background: "#222" }).png().toBuffer();
  cells.push({ input: thumb, left, top: 0 });
  if (face) {
    const sc = C / Math.max(W, H), ox = (C - W * sc) / 2, oy = (C - H * sc) / 2;
    const bw = face.size * W * sc, bh = bw;
    const svg = Buffer.from(`<svg width="${C}" height="${C}"><rect x="${ox + face.x * W * sc - bw / 2}" y="${oy + face.y * H * sc - bh / 2}" width="${bw}" height="${bh}" fill="none" stroke="#0f0" stroke-width="2"/></svg>`);
    cells.push({ input: svg, left, top: 0 });
  }
  // 2 · the old fixed framing (face at 50% / 32%, zoom 1)   3 · the automatic framing
  for (const [row, f] of [[1, { fx: 0.5, fy: 0.32, zoom: 1 }], [2, fit ?? { fx: 0.5, fy: 0.4, zoom: 1 }]] as const) {
    const side = Math.max(8, Math.round(W / (2 * f.zoom)));
    const cx = f.fx * W, cy = f.fy * H;
    const l = Math.round(cx - side / 2), t = Math.round(cy - side / 2);
    const pad = side; // pad so a crop that runs off the picture stays honest (beige, like the circle's fill)
    // sharp runs extract before extend inside one pipeline, so extend first, then crop the result
    const padded = await sharp(file).extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#E9D8C4" }).png().toBuffer();
    const circle = await sharp(padded)
      .extract({ left: l + pad, top: t + pad, width: side, height: side }).resize(C - 10, C - 10)
      .composite([{ input: Buffer.from(`<svg width="${C - 10}" height="${C - 10}"><circle cx="${(C - 10) / 2}" cy="${(C - 10) / 2}" r="${(C - 10) / 2}" fill="#fff"/></svg>`), blend: "dest-in" }]).png().toBuffer();
    cells.push({ input: circle, left: left + 5, top: row * C + 5 });
  }
  console.log(id.padEnd(14), face ? `face x=${face.x.toFixed(2)} y=${face.y.toFixed(2)} size=${face.size.toFixed(2)} → zoom ${fit!.zoom.toFixed(2)} (${boxes.length} found, ${ms} ms)` : `no face found (${ms} ms)`);
}
await sharp({ create: { width: ids.length * C, height: C * 3, channels: 3, background: "#333" } }).composite(cells).png().toFile(out);
console.log("wrote", out);
