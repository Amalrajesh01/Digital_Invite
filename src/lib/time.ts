/** Timezone helpers without external dependencies (Intl is enough for our needs). */

export function todayInZone(tz: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function offsetMinutes(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Interprets "2026-11-14" + "10:30" as wall-clock time in `tz` and returns the absolute instant. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const off = offsetMinutes(tz, guess);
  return new Date(guess.getTime() - off * 60000);
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function addYears(date: string, years: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y + years, m - 1, d));
  // Feb 29 → Feb 28 in non-leap years is handled by JS rolling to Mar 1; correct it.
  if (dt.getUTCMonth() !== m - 1) dt.setUTCDate(0);
  return dt.toISOString().slice(0, 10);
}

export function formatDateLong(date: string, locale = "en-IN"): string {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatTime12(time: string, locale = "en-IN"): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}
