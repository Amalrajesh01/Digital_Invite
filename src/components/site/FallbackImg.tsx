"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The one client-side piece of a site photograph: an <img> that hides itself if it fails to load, so what is left behind
 * is the tinted placeholder of its wrapper — never a broken-image icon.
 */
export function FallbackImg(props: React.ImgHTMLAttributes<HTMLImageElement> & { fetchPriority?: "high" | "low" | "auto" }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img {...props} alt={props.alt ?? ""} onError={() => setFailed(true)} className={cn(props.className)} />;
}
