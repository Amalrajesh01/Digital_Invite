"use client";
import { useEffect, useState } from "react";

/** Generates a QR code image on the device (MIT `qrcode` library, loaded only when needed). */
export function useQrDataUrl(text: string | null | undefined, opts: { width?: number; dark?: string; light?: string } = {}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!text) {
      setUrl(null);
      return;
    }
    import("qrcode")
      .then((m) => m.toDataURL(text, { margin: 1, width: opts.width ?? 320, errorCorrectionLevel: "M", color: { dark: opts.dark ?? "#111111", light: opts.light ?? "#ffffff" } }))
      .then((d) => !cancelled && setUrl(d))
      .catch(() => !cancelled && setUrl(null));
    return () => {
      cancelled = true;
    };
  }, [text, opts.width, opts.dark, opts.light]);
  return url;
}

export function Qr({ text, size = 176, className, label }: { text: string; size?: number; className?: string; label?: string }) {
  const url = useQrDataUrl(text, { width: size * 2 });
  if (!url) return <div style={{ width: size, height: size }} className={className} aria-hidden />;
  return <img src={url} width={size} height={size} alt={label ?? "QR code"} className={className} style={{ imageRendering: "pixelated" }} />;
}
