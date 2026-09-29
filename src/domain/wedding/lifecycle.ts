import type { WeddingStatus } from "@/domain/doc/constants";
import { addYears, daysBetween, todayInZone } from "@/lib/time";

export interface LifecycleInput {
  status: WeddingStatus;
  autoLifecycle: boolean;
  weddingDate: string | null;
  timezone: string;
}

/**
 * The visual experience changes with the wedding's state:
 *   before        "You're invited"
 *   wedding day   "Welcome to our celebration"
 *   after         "Thank you for celebrating with us"
 *   anniversary   "One beautiful year together"
 * Draft/preview never auto-advance. Once published, the state follows the calendar unless the
 * Super Admin turned auto-lifecycle off (then the stored status is authoritative).
 */
export function effectiveStatus(w: LifecycleInput, now: Date = new Date()): WeddingStatus {
  if (w.status === "DRAFT" || w.status === "PREVIEW") return w.status;
  if (!w.autoLifecycle || !w.weddingDate) return w.status;
  const today = todayInZone(w.timezone, now);
  const d = daysBetween(w.weddingDate, today);
  if (d < 0) return "PUBLISHED";
  if (d === 0) return "LIVE_EVENT";
  if (d <= 6) return "POST_EVENT";
  // Anniversary window: the anniversary day and the following six days, each year.
  for (let k = 1; k <= 60; k++) {
    const anniv = addYears(w.weddingDate, k);
    const since = daysBetween(anniv, today);
    if (since < 0) break;
    if (since <= 6) return "ANNIVERSARY";
  }
  return "MEMORY";
}

export function yearsTogether(weddingDate: string | null, timezone: string, now: Date = new Date()): number {
  if (!weddingDate) return 0;
  const today = todayInZone(timezone, now);
  let k = 0;
  while (k < 100 && daysBetween(addYears(weddingDate, k + 1), today) >= 0) k++;
  return k;
}

export function nextAnniversary(weddingDate: string | null, timezone: string, now: Date = new Date()): string | null {
  if (!weddingDate) return null;
  const today = todayInZone(timezone, now);
  for (let k = 1; k <= 100; k++) {
    const a = addYears(weddingDate, k);
    if (daysBetween(today, a) >= 0) return a;
  }
  return null;
}

export const LIFECYCLE_HEADLINE: Record<WeddingStatus, string> = {
  DRAFT: "invite.title.before",
  PREVIEW: "invite.title.before",
  PUBLISHED: "invite.title.before",
  LIVE_EVENT: "invite.title.live",
  POST_EVENT: "invite.title.after",
  MEMORY: "invite.title.after",
  ANNIVERSARY: "invite.title.anniversary",
};
