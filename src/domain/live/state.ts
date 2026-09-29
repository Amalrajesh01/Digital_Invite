import type { WeddingEvent } from "@/domain/doc/schema";
import { zonedToUtc } from "@/lib/time";

export interface LiveEventState {
  current: WeddingEvent | null;
  next: WeddingEvent | null;
  mode: "AUTO" | "MANUAL";
  note: string | null;
}

export function eventWindow(e: WeddingEvent, tz: string): { start: Date; end: Date } | null {
  if (!e.date) return null;
  const start = zonedToUtc(e.date, e.startTime || "00:00", tz);
  const end = e.endTime ? zonedToUtc(e.date, e.endTime, tz) : new Date(start.getTime() + 3 * 3600 * 1000);
  return { start, end: end.getTime() <= start.getTime() ? new Date(end.getTime() + 86400000) : end };
}

/** Pure: which event is on now / next. Manual "now" (set by the family on the day) wins over the clock. */
export function computeLiveState(events: WeddingEvent[], tz: string, manualId: string | null, note: string | null, now = new Date()): LiveEventState {
  const timed = events
    .map((e) => ({ e, w: eventWindow(e, tz) }))
    .filter((x): x is { e: WeddingEvent; w: { start: Date; end: Date } } => !!x.w)
    .sort((a, b) => a.w.start.getTime() - b.w.start.getTime());
  const manual = manualId ? events.find((e) => e.id === manualId) ?? null : null;
  const current = manual ?? timed.find((x) => x.w.start <= now && now < x.w.end)?.e ?? null;
  const afterCurrent = current ? timed.find((x) => x.e.id !== current.id && x.w.start.getTime() >= (eventWindow(current, tz)?.start.getTime() ?? now.getTime()))?.e : undefined;
  const next = (current ? afterCurrent : timed.find((x) => x.w.start > now)?.e) ?? null;
  return { current, next: next ?? null, mode: manual ? "MANUAL" : "AUTO", note };
}

