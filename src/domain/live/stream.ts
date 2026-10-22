import { zonedToUtc } from "@/lib/time";

/**
 * Live-stream links. The platform never hosts video: a link is either played here (YouTube and Vimeo only — the two
 * players that allow embedding and need no login) or offered as a button that opens the provider in a new tab.
 * Hostnames are matched exactly, so `evilyoutube.com` or `youtube.com.evil.test` are never treated as YouTube.
 */
export type StreamProvider = "youtube" | "vimeo" | "facebook" | "instagram" | "zoom" | "meet" | "teams" | "other";

export interface StreamLink {
  provider: StreamProvider;
  /** A player URL when the provider may be embedded, else null (open `href` instead). */
  embed: string | null;
  href: string;
}

export const STREAM_PROVIDER_LABEL: Record<StreamProvider, string> = {
  youtube: "YouTube", vimeo: "Vimeo", facebook: "Facebook", instagram: "Instagram", zoom: "Zoom", meet: "Google Meet", teams: "Microsoft Teams", other: "the stream",
};

const YT_ID = /^[\w-]{6,20}$/;
const VIMEO_ID = /^\d{5,12}$/;

function providerOf(host: string): StreamProvider {
  if (["youtube.com", "m.youtube.com", "youtu.be"].includes(host)) return "youtube";
  if (host === "vimeo.com" || host === "player.vimeo.com") return "vimeo";
  if (["facebook.com", "m.facebook.com", "fb.watch"].includes(host)) return "facebook";
  if (host === "instagram.com") return "instagram";
  if (host === "zoom.us" || host.endsWith(".zoom.us")) return "zoom";
  if (host === "meet.google.com") return "meet";
  if (host === "teams.microsoft.com" || host === "teams.live.com") return "teams";
  return "other";
}

/** Understands a pasted link. `null` = not an https link at all (never rendered, never linked). */
export function streamLink(raw: string): StreamLink | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password) return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const provider = providerOf(host);
  let embed: string | null = null;
  if (provider === "youtube") {
    const path = u.pathname.split("/").filter(Boolean);
    const id = host === "youtu.be" ? path[0] : u.searchParams.get("v") ?? (["live", "embed", "shorts"].includes(path[0]) ? path[1] : undefined);
    if (id && YT_ID.test(id)) embed = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  } else if (provider === "vimeo") {
    const id = u.pathname.split("/").filter(Boolean).find((p) => VIMEO_ID.test(p));
    if (id) embed = `https://player.vimeo.com/video/${id}`;
  }
  return { provider, embed, href: u.toString() };
}

export type StreamPhase = "live" | "before" | "after";

/** A stream is considered over this long after it starts when the family gave no end time. */
export const DEFAULT_STREAM_HOURS = 4;
const STAMP = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/;

/** `YYYY-MM-DDTHH:mm` read as wall-clock time in the wedding's zone → the absolute instant, or null when empty/invalid. */
export function streamInstant(stamp: string, tz: string): Date | null {
  const m = STAMP.exec(stamp);
  if (!m) return null;
  const d = zonedToUtc(m[1], m[2], tz);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface StreamWindow { start: Date | null; end: Date | null }

export function streamWindow(live: { startsAt: string; endsAt: string }, tz: string): StreamWindow {
  const start = streamInstant(live.startsAt, tz);
  const end = streamInstant(live.endsAt, tz) ?? (start ? new Date(start.getTime() + DEFAULT_STREAM_HOURS * 3600_000) : null);
  return { start, end };
}

/** No start time = always open (how the section behaved before schedules existed). */
export function streamPhase(w: StreamWindow, now: number): StreamPhase {
  if (!w.start) return "live";
  if (now < w.start.getTime()) return "before";
  return w.end && now >= w.end.getTime() ? "after" : "live";
}
