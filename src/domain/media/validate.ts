import { uploadRejected } from "@/lib/errors";

export type MediaKind = "IMAGE" | "VIDEO" | "AUDIO";

export const LIMITS = {
  IMAGE: { maxBytes: 20 * 1024 * 1024, maxPixels: 100_000_000, maxSide: 14000 },
  VIDEO: { maxBytes: 200 * 1024 * 1024, maxDurationSec: 180 },
  AUDIO: { maxBytes: 30 * 1024 * 1024, maxDurationSec: 900 },
} as const;

export interface Sniffed {
  kind: MediaKind;
  mime: string;
  ext: string;
}

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.slice(from, to));

/**
 * Identify a file from its *bytes*, ignoring the client-supplied filename and Content-Type.
 * Returns null for anything we do not accept (SVG, HTML, executables, HEIC …).
 */
export function sniffMedia(buf: Uint8Array): Sniffed | null {
  if (buf.length < 16) return null;
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { kind: "IMAGE", mime: "image/jpeg", ext: "jpg" };
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: "IMAGE", mime: "image/png", ext: "png" };
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return { kind: "IMAGE", mime: "image/webp", ext: "webp" };
  if (ascii(buf, 0, 3) === "GIF") return { kind: "IMAGE", mime: "image/gif", ext: "gif" };
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WAVE") return { kind: "AUDIO", mime: "audio/wav", ext: "wav" };
  if (ascii(buf, 0, 4) === "OggS") return { kind: "AUDIO", mime: "audio/ogg", ext: "ogg" };
  if (ascii(buf, 0, 3) === "ID3" || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0 && (buf[1] & 0x06) !== 0)) return { kind: "AUDIO", mime: "audio/mpeg", ext: "mp3" };
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) {
    // Matroska/WebM container — used by browsers for recordings (audio-only or video).
    return { kind: "VIDEO", mime: "video/webm", ext: "webm" };
  }
  if (ascii(buf, 4, 8) === "ftyp") {
    const brand = ascii(buf, 8, 12);
    if (["heic", "heix", "hevc", "mif1", "msf1", "avif"].includes(brand)) return null; // photos: ask for JPEG instead
    if (["M4A ", "M4B ", "M4P "].includes(brand)) return { kind: "AUDIO", mime: "audio/mp4", ext: "m4a" };
    if (brand === "qt  ") return { kind: "VIDEO", mime: "video/quicktime", ext: "mov" };
    return { kind: "VIDEO", mime: "video/mp4", ext: "mp4" };
  }
  return null;
}

export function sanitizeFilename(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const cleaned = base.normalize("NFKC").replace(/[^\p{L}\p{N}._ -]+/gu, "").replace(/\s+/g, " ").trim();
  return cleaned.slice(0, 120) || "upload";
}

export interface ValidatedUpload extends Sniffed {
  size: number;
}

export function validateUpload(buf: Uint8Array, opts: { allow: MediaKind[]; declaredMime?: string }): ValidatedUpload {
  const sniffed = sniffMedia(buf);
  if (!sniffed) {
    throw uploadRejected("We could not read that file. Please upload a JPG, PNG or WebP photo, an MP4/WebM video or an MP3/M4A/WAV audio file.");
  }
  if (!opts.allow.includes(sniffed.kind)) {
    const want = opts.allow.map((k) => k.toLowerCase()).join(" or ");
    throw uploadRejected(`This file type is not accepted here — please upload ${want}.`);
  }
  const limit = LIMITS[sniffed.kind].maxBytes;
  if (buf.byteLength > limit) throw uploadRejected(`That file is too large. The limit for ${sniffed.kind.toLowerCase()} files is ${Math.round(limit / 1024 / 1024)} MB.`);
  return { ...sniffed, size: buf.byteLength };
}
