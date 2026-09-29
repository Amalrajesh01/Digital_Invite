"use client";
import type { ResolvedMedia } from "@/domain/media/service";

export interface UploadResult {
  id: string;
  media: ResolvedMedia;
  category: string;
  filename: string;
}

/** Browser → /api/upload with progress. Images are downscaled first (saves data on slow connections). */
export function uploadFile(opts: { weddingId: string; file: File; category: string; albumId?: string; replaceId?: string; durationSec?: number; onProgress?: (pct: number) => void }): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.set("file", opts.file);
    form.set("weddingId", opts.weddingId);
    form.set("category", opts.category);
    if (opts.albumId) form.set("albumId", opts.albumId);
    if (opts.replaceId) form.set("replaceId", opts.replaceId);
    if (opts.durationSec) form.set("durationSec", String(Math.round(opts.durationSec)));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new Error("The connection dropped. Please check your internet and try again."));
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as { ok: boolean; data?: UploadResult & { media: ResolvedMedia }; error?: { message: string } };
        if (xhr.status < 300 && json.ok && json.data) resolve({ ...json.data, id: json.data.media.id });
        else reject(new Error(json.error?.message ?? "Upload failed."));
      } catch {
        reject(new Error("Upload failed."));
      }
    };
    xhr.send(form);
  });
}

export function audioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const a = document.createElement("audio");
    a.preload = "metadata";
    a.src = URL.createObjectURL(file);
    a.onloadedmetadata = () => {
      resolve(a.duration || 0);
      URL.revokeObjectURL(a.src);
    };
    a.onerror = () => resolve(0);
  });
}

/** Crop (and optionally rotate) an image in the browser and return a JPEG file. */
export async function cropToFile(src: string, area: { x: number; y: number; width: number; height: number }, rotation: number, name: string): Promise<File> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Could not load the image for cropping."));
    i.src = src;
  });
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
  const bw = img.width * cos + img.height * sin, bh = img.width * sin + img.height * cos;
  const stage = document.createElement("canvas");
  stage.width = bw; stage.height = bh;
  const sctx = stage.getContext("2d")!;
  sctx.translate(bw / 2, bh / 2); sctx.rotate(rad); sctx.drawImage(img, -img.width / 2, -img.height / 2);
  const out = document.createElement("canvas");
  out.width = Math.round(area.width); out.height = Math.round(area.height);
  out.getContext("2d")!.drawImage(stage, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height);
  const blob: Blob | null = await new Promise((r) => out.toBlob(r, "image/jpeg", 0.92));
  if (!blob) throw new Error("Could not crop the image.");
  return new File([blob], name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
