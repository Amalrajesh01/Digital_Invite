"use client";
import { useCallback } from "react";
import { ApiError, useInvitation } from "./context";

/** Multipart upload with progress (fetch cannot report upload progress; XHR can). */
export function useUploader() {
  const { slug, token } = useInvitation();
  return useCallback(
    <T,>(path: string, form: FormData, onProgress?: (pct: number) => void): Promise<T> =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/public/${slug}${path}`);
        if (token) xhr.setRequestHeader("x-invite-token", token);
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
        xhr.onerror = () => reject(new ApiError("NETWORK", "network"));
        xhr.onload = () => {
          let json: { ok?: boolean; data?: T; error?: { code: string; message: string } } = {};
          try {
            json = JSON.parse(xhr.responseText);
          } catch {}
          if (xhr.status >= 200 && xhr.status < 300 && json.ok !== false) resolve((json.data ?? json) as T);
          else reject(new ApiError(json.error?.code ?? "INTERNAL", json.error?.message ?? "error"));
        };
        xhr.send(form);
      }),
    [slug, token],
  );
}

/**
 * Downscale + re-encode a photo in the browser before uploading (max 2400px, JPEG 0.86).
 * Saves guests' mobile data on a slow venue network and strips location metadata.
 */
export async function prepareImage(file: File, maxSide = 2400): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 2.5 * 1024 * 1024) {
      bmp.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}
