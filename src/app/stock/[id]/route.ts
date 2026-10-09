import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { STOCK_ID, stockInfo } from "@/domain/imagery/stock";

/**
 * The bundled stock photographs of the product site, resized on demand.
 *
 *   /stock/<id>?w=800            → WebP, 800 px wide (the next size up from what was asked)
 *   /stock/<id>?w=800&r=4:5      → …cropped to that ratio around the photograph’s focal point
 *   /stock/<id>?og=1             → 1200 × 630 for social previews
 *
 * Only the files in assets/stock/ that the product knows about can be asked for, only a fixed set of sizes and ratios,
 * and every answer is immutable — so a cache (the browser, nginx, a CDN) serves each variant once. Nothing here is a
 * remote image: the product site can never show a broken or hot-linked photograph.
 */
const WIDTHS = [320, 480, 640, 800, 1080, 1440, 1920, 2400];
const RATIOS: Record<string, number> = { "1:1": 1, "4:5": 4 / 5, "3:4": 3 / 4, "2:3": 2 / 3, "3:2": 3 / 2, "4:3": 4 / 3, "16:9": 16 / 9, "21:9": 21 / 9, "9:19": 9 / 19 };
const DIR = path.join(process.cwd(), "assets", "stock");

// a small in-memory cache so a hot variant is not re-encoded for every visitor
const cache = new Map<string, Buffer>();
const CACHE_MAX = 120;

const HEADERS = { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const info = STOCK_ID.test(id) ? stockInfo(id) : undefined;
  if (!info) return new Response("Not found", { status: 404 });

  const q = new URL(req.url).searchParams;
  const og = q.get("og") === "1";
  const asked = Number(q.get("w")) || 1080;
  const width = og ? 1200 : (WIDTHS.find((w) => w >= asked) ?? WIDTHS[WIDTHS.length - 1]);
  const ratio = og ? 1200 / 630 : RATIOS[q.get("r") ?? ""];
  const key = `${id}|${width}|${ratio?.toFixed(3) ?? "-"}`;

  let body = cache.get(key);
  if (!body) {
    let src: Buffer;
    try {
      src = await readFile(path.join(DIR, `${id}.jpg`));
    } catch {
      return new Response("Not found", { status: 404 });
    }
    let img = sharp(src).rotate();
    const meta = await img.metadata();
    const W = meta.width ?? width;
    const H = meta.height ?? width;
    if (ratio) {
      // crop to the ratio, as large as it fits, centred on the focal point
      const cw = Math.min(W, Math.round(H * ratio));
      const ch = Math.min(H, Math.round(cw / ratio));
      const fx = ((info.focal?.x ?? 50) / 100) * W;
      const fy = ((info.focal?.y ?? 50) / 100) * H;
      const left = Math.max(0, Math.min(W - cw, Math.round(fx - cw / 2)));
      const top = Math.max(0, Math.min(H - ch, Math.round(fy - ch / 2)));
      img = img.extract({ left, top, width: cw, height: ch });
    }
    // a social card is always exactly 1200 × 630; everything else is never enlarged beyond the original
    body = await img.resize({ width, withoutEnlargement: !og }).webp({ quality: 78 }).toBuffer();
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(key, body);
  }
  return new Response(new Uint8Array(body), { headers: HEADERS });
}
