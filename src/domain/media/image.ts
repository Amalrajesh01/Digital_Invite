import sharp, { type Metadata } from "sharp";
import { LIMITS } from "./validate";
import { uploadRejected } from "@/lib/errors";

export interface ImageVariant {
  name: "xl" | "lg" | "md" | "sm";
  width: number;
  height: number;
  bytes: number;
  data: Buffer;
}

const VARIANTS: { name: ImageVariant["name"]; width: number; quality: number }[] = [
  { name: "xl", width: 2400, quality: 86 },
  { name: "lg", width: 1600, quality: 82 },
  { name: "md", width: 900, quality: 80 },
  { name: "sm", width: 420, quality: 76 },
];

export interface ProcessedImage {
  width: number;
  height: number;
  blur: string; // tiny base64 placeholder for instant paint
  variants: ImageVariant[];
}

/**
 * Normalises any accepted photo: applies EXIF orientation, strips metadata (GPS!), rejects
 * decompression bombs, and emits responsive WebP variants + a blur placeholder.
 */
export async function processImage(input: Buffer, opts: { rotate?: 0 | 90 | 180 | 270 } = {}): Promise<ProcessedImage> {
  let meta: Metadata;
  try {
    meta = await sharp(input, { failOn: "error", limitInputPixels: LIMITS.IMAGE.maxPixels }).metadata();
  } catch {
    throw uploadRejected("That image looks damaged or unsupported. Please try a different photo.");
  }
  const w0 = meta.width ?? 0;
  const h0 = meta.height ?? 0;
  if (!w0 || !h0) throw uploadRejected("We could not read the size of that image.");
  if (w0 > LIMITS.IMAGE.maxSide || h0 > LIMITS.IMAGE.maxSide) throw uploadRejected(`That image is too large (max ${LIMITS.IMAGE.maxSide}px on the longest side).`);
  if (w0 < 64 || h0 < 64) throw uploadRejected("That image is too small to use.");

  const base = () => {
    let p = sharp(input, { failOn: "none", limitInputPixels: LIMITS.IMAGE.maxPixels, animated: false }).rotate(); // EXIF auto-orient
    if (opts.rotate) p = p.rotate(opts.rotate);
    return p;
  };

  const variants: ImageVariant[] = [];
  let width = 0;
  let height = 0;
  for (const v of VARIANTS) {
    const { data, info } = await base()
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: v.quality, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    variants.push({ name: v.name, width: info.width, height: info.height, bytes: data.length, data });
    if (v.name === "xl") {
      width = info.width;
      height = info.height;
    }
  }
  const blurBuf = await base().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  return { width, height, blur: `data:image/webp;base64,${blurBuf.toString("base64")}`, variants };
}
