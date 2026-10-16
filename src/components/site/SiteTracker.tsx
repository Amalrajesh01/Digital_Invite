"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Anonymous, cookie-free measurement of the public site — enough to know where visitors drop out, nothing that identifies
 * a person: a random id kept in this browser, the page, and what was tapped. No IP, no fingerprint, no names or numbers.
 *
 * Mark any element `data-track="cta_click" data-ref="hero-choose"` and its taps are counted; `<Track type="design_view" refSlug="…" />`
 * counts a view. Nothing here ever throws or blocks a tap.
 */
const KEY = "sb-vid";
const SRC = "sb-src";

function visitorId(): string {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return "anon" + Math.random().toString(36).slice(2, 14);
  }
}

function source(): string {
  try {
    const known = sessionStorage.getItem(SRC);
    if (known !== null) return known;
    const utm = new URLSearchParams(location.search).get("utm_source");
    let s = utm ? utm.slice(0, 40) : "";
    if (!s && document.referrer) {
      const h = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (h && h !== location.hostname) s = h.slice(0, 40);
    }
    sessionStorage.setItem(SRC, s);
    return s;
  } catch {
    return "";
  }
}

export function track(type: string, ref = "") {
  try {
    const device = window.matchMedia("(max-width: 767px)").matches ? "mobile" : window.matchMedia("(max-width: 1100px)").matches ? "tablet" : "desktop";
    const body = JSON.stringify({ visitorId: visitorId(), type, path: location.pathname, ref, device, source: source() });
    if (navigator.sendBeacon?.("/api/site/event", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/site/event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  } catch {
    /* measurement must never get in the way */
  }
}

export function getVisitorId() {
  return typeof window === "undefined" ? "" : visitorId();
}
export function getSource() {
  return typeof window === "undefined" ? "" : source();
}

export function SiteTracker() {
  const path = usePathname();
  useEffect(() => { track("page_view"); }, [path]);
  useEffect(() => {
    const on = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-track]");
      if (el?.dataset.track) track(el.dataset.track, el.dataset.ref ?? "");
    };
    document.addEventListener("click", on, true);
    return () => document.removeEventListener("click", on, true);
  }, []);
  return null;
}

/** Counts one view of something (a design, an occasion) when the page shows it. */
export function Track({ type, refSlug }: { type: string; refSlug?: string }) {
  useEffect(() => { track(type, refSlug ?? ""); }, [type, refSlug]);
  return null;
}
