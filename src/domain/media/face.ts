import sharp from "sharp";
import { detectBoxes } from "@/lib/face-detect";
import { headFromBox, type Face } from "@/invitation/engine/headfit";

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Finds the head (face and hair) in a photograph's bytes, as fractions of the picture. Two passes: a small copy first
 * (fast, and the fewest false alarms), then a larger one for a face that is small in the picture. Null when no face is found
 * — the walking figure then falls back to its fixed framing.
 */
export async function detectHead(buffer: Buffer): Promise<Face | null> {
  for (const work of [256, 400]) {
    const { data, info } = await sharp(buffer, { failOn: "none" }).rotate().resize({ width: work, height: work, fit: "inside", withoutEnlargement: true }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const head = headFromBox(detectBoxes(data, info.width, info.height, 3)[0], info.width, info.height);
    if (head) return { x: r3(head.x), y: r3(head.y), size: r3(head.size) };
  }
  return null;
}
