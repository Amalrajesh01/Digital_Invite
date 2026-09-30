import type { WeddingEvent } from "@/domain/doc/schema";
import { zonedToUtc } from "@/lib/time";

const LOCALE_TAG: Record<string, string> = { en: "en-IN", ml: "ml-IN", ta: "ta-IN", te: "te-IN", kn: "kn-IN", hi: "hi-IN", mr: "mr-IN", bn: "bn-IN", gu: "gu-IN", pa: "pa-IN", ur: "ur-IN" };
const tag = (l: string) => `${LOCALE_TAG[l] ?? "en-IN"}-u-nu-latn`;

const utcDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export function fmtDate(iso: string, locale: string, style: "long" | "short" | "day" | "month" | "weekday" | "monthDay" | "monthYear" = "long"): string {
  if (!iso) return "";
  const dt = utcDate(iso);
  const opts: Record<string, Intl.DateTimeFormatOptions> = {
    long: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    short: { day: "numeric", month: "short", year: "numeric" },
    day: { day: "numeric" },
    month: { month: "long" },
    weekday: { weekday: "long" },
    monthDay: { day: "numeric", month: "long" },
    monthYear: { month: "long", year: "numeric" },
  };
  return new Intl.DateTimeFormat(tag(locale), { ...opts[style], timeZone: "UTC" }).format(dt);
}

export function fmtTime(time: string, locale: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(tag(locale), { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

export function fmtRange(e: Pick<WeddingEvent, "startTime" | "endTime">, locale: string): string {
  if (!e.startTime) return "";
  return e.endTime ? `${fmtTime(e.startTime, locale)} – ${fmtTime(e.endTime, locale)}` : fmtTime(e.startTime, locale);
}

export function fmtNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(tag(locale)).format(n);
}

export function eventStart(e: Pick<WeddingEvent, "date" | "startTime">, tz: string): Date | null {
  return e.date ? zonedToUtc(e.date, e.startTime || "00:00", tz) : null;
}

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Standards-compliant .ics so the event lands in any calendar app. */
export function buildIcs(opts: { id: string; title: string; description: string; location: string; start: Date; end: Date; url: string }): string {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//StackBridge Labs//StackBridge Invites//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${opts.id}@stackbridge-invites`, `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(opts.start)}`, `DTEND:${icsStamp(opts.end)}`,
    `SUMMARY:${icsEscape(opts.title)}`, `DESCRIPTION:${icsEscape(opts.description)}`, `LOCATION:${icsEscape(opts.location)}`, `URL:${opts.url}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadText(filename: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function mapsUrl(opts: { mapUrl?: string; lat?: number; lng?: number; query?: string }): string {
  if (opts.mapUrl && /^https?:\/\//.test(opts.mapUrl)) return opts.mapUrl;
  if (opts.lat != null && opts.lng != null) return `https://www.google.com/maps/search/?api=1&query=${opts.lat},${opts.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(opts.query ?? "")}`;
}

/** Haversine distance in km. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function safeExternal(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Only YouTube and Vimeo are embeddable, converted to their privacy-friendly embed URLs. */
export function embedUrl(url: string): string | null {
  const u = safeExternal(url);
  if (!u) return null;
  const x = new URL(u);
  const host = x.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${x.pathname.slice(1)}?rel=0`;
  if (host.endsWith("youtube.com")) {
    const id = x.searchParams.get("v") ?? (x.pathname.startsWith("/live/") || x.pathname.startsWith("/embed/") ? x.pathname.split("/")[2] : null);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  }
  if (host === "vimeo.com") {
    const id = x.pathname.split("/").filter(Boolean)[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

export function whatsappHref(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
