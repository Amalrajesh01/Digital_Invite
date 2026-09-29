import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { forbidden, invalid, notFound } from "@/lib/errors";
import { passCode } from "@/lib/id";
import { zonedToUtc } from "@/lib/time";
import { type Actor, requireWeddingAccess } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { getEntitlements } from "@/domain/packages/service";
import { assertCanUse, canUse } from "@/domain/packages/entitlements";
import { loadRulesDoc } from "@/domain/wedding/snapshot";
import type { LocalizedText, WeddingEvent } from "@/domain/doc/schema";
import type { GuestContext } from "@/domain/guests/context";
import { visibleEventsFor } from "@/domain/wedding/view";

// ── live updates ───────────────────────────────────────────────────────────
export async function postLiveUpdate(
  actor: Actor | null,
  weddingId: string,
  input: { title: LocalizedText; body?: LocalizedText; kind?: "INFO" | "ALERT" | "SCHEDULE" | "MILESTONE"; eventId?: string | null; pinned?: boolean },
) {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "live_updates" });
  if (!Object.values(input.title).some((s) => s?.trim())) throw invalid("Write a short headline for the update.", { title: "Required" });
  const db = await getDb();
  const [row] = await db
    .insert(schema.liveUpdates)
    .values({
      weddingId,
      title: input.title,
      body: input.body ?? {},
      kind: input.kind ?? "INFO",
      eventId: input.eventId ?? null,
      pinned: input.pinned ?? false,
      createdBy: scope.actor.kind === "system" ? null : scope.actor.userId,
    })
    .returning();
  await audit(scope.actor, "live.update_posted", { weddingId, entityType: "live_update", entityId: row.id });
  return row;
}

export async function deleteLiveUpdate(actor: Actor | null, weddingId: string, id: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "live_updates" });
  const db = await getDb();
  await db.delete(schema.liveUpdates).where(and(eq(schema.liveUpdates.id, id), eq(schema.liveUpdates.weddingId, weddingId)));
}

export async function listLiveUpdates(weddingId: string, limit = 30) {
  const db = await getDb();
  return db
    .select({ id: schema.liveUpdates.id, title: schema.liveUpdates.title, body: schema.liveUpdates.body, kind: schema.liveUpdates.kind, eventId: schema.liveUpdates.eventId, pinned: schema.liveUpdates.pinned, createdAt: schema.liveUpdates.createdAt })
    .from(schema.liveUpdates)
    .where(eq(schema.liveUpdates.weddingId, weddingId))
    .orderBy(desc(schema.liveUpdates.pinned), desc(schema.liveUpdates.createdAt))
    .limit(limit);
}

// ── what's happening now ───────────────────────────────────────────────────
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

export async function setLiveEvent(actor: Actor | null, weddingId: string, eventId: string | null, note: string | null = null) {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "event_day_mode" });
  const db = await getDb();
  if (eventId) {
    const { doc } = await loadRulesDoc(weddingId);
    if (!doc.events.some((e) => e.id === eventId)) throw invalid("That event does not exist.");
  }
  await db.update(schema.weddings).set({ liveEventId: eventId, liveNote: note, updatedAt: new Date() }).where(eq(schema.weddings.id, weddingId));
  await audit(scope.actor, "live.event_set", { weddingId, metadata: { eventId } });
}

/** Everything the public invitation polls during the celebration. Respects per-guest event visibility. */
export async function livePayload(weddingId: string, guest: GuestContext | null) {
  const ent = await getEntitlements(weddingId);
  const { wedding, doc } = await loadRulesDoc(weddingId);
  const events = visibleEventsFor(doc.events, guest?.groupKey ?? null, canUse(ent, "event_visibility"));
  const state = canUse(ent, "live_schedule") ? computeLiveState(events, wedding.timezone, wedding.liveEventId, wedding.liveNote) : null;
  const updates = canUse(ent, "live_updates") ? await listLiveUpdates(weddingId, 20) : [];
  return {
    now: state?.current ? { id: state.current.id } : null,
    next: state?.next ? { id: state.next.id } : null,
    mode: state?.mode ?? "AUTO",
    note: state?.note ?? null,
    updates: updates.filter((u) => !u.eventId || events.some((e) => e.id === u.eventId)),
    serverTime: new Date().toISOString(),
  };
}

// ── QR pass & check-in ─────────────────────────────────────────────────────
export const PASS_PREFIX = "AOIRE1:";

export async function ensurePass(weddingId: string, guestId: string): Promise<string> {
  const db = await getDb();
  const [cur] = await db.select().from(schema.qrPasses).where(and(eq(schema.qrPasses.guestId, guestId), eq(schema.qrPasses.weddingId, weddingId)));
  if (cur && !cur.revokedAt) return cur.code;
  if (cur) {
    const code = passCode();
    await db.update(schema.qrPasses).set({ code, revokedAt: null }).where(eq(schema.qrPasses.id, cur.id));
    return code;
  }
  const code = passCode();
  await db.insert(schema.qrPasses).values({ weddingId, guestId, code });
  return code;
}

export async function getGuestPass(ctx: GuestContext) {
  const ent = await getEntitlements(ctx.weddingId);
  assertCanUse(ent, "qr_pass");
  const code = await ensurePass(ctx.weddingId, ctx.guestId);
  const db = await getDb();
  const rows = await db.select({ eventId: schema.checkins.eventId, at: schema.checkins.checkedInAt }).from(schema.checkins).where(eq(schema.checkins.guestId, ctx.guestId));
  return { code, payload: `${PASS_PREFIX}${code}`, seats: ctx.seats, name: ctx.name, checkedIn: rows.map((r) => ({ eventId: r.eventId, at: r.at.toISOString() })) };
}

export function parsePassPayload(input: string): string | null {
  const t = input.trim();
  const code = t.startsWith(PASS_PREFIX) ? t.slice(PASS_PREFIX.length) : t;
  return /^[A-Z0-9]{8,16}$/.test(code.toUpperCase()) ? code.toUpperCase() : null;
}

export async function lookupPass(actor: Actor | null, weddingId: string, payload: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "qr_checkin" });
  const code = parsePassPayload(payload);
  if (!code) throw invalid("That does not look like a guest pass.");
  const db = await getDb();
  const [row] = await db
    .select({ pass: schema.qrPasses, guest: schema.guests, group: schema.guestGroups.name, rsvp: schema.rsvps })
    .from(schema.qrPasses)
    .innerJoin(schema.guests, eq(schema.guests.id, schema.qrPasses.guestId))
    .leftJoin(schema.guestGroups, eq(schema.guestGroups.id, schema.guests.groupId))
    .leftJoin(schema.rsvps, eq(schema.rsvps.guestId, schema.guests.id))
    .where(eq(schema.qrPasses.code, code));
  // A pass for another wedding is indistinguishable from an unknown pass.
  if (!row || row.pass.weddingId !== weddingId || row.pass.revokedAt || row.guest.archivedAt) throw notFound("This pass is not valid for this wedding.");
  const checkins = await db.select().from(schema.checkins).where(eq(schema.checkins.guestId, row.guest.id));
  return {
    guestId: row.guest.id,
    name: row.guest.name,
    group: row.group,
    seats: row.guest.seats,
    relationship: row.guest.relationship,
    rsvpStatus: row.rsvp?.status ?? null,
    attending: row.rsvp?.attendingCount ?? null,
    meal: row.rsvp?.meal ?? "",
    notes: row.guest.notes,
    checkins: checkins.map((c) => ({ eventId: c.eventId, seats: c.seatsAdmitted, at: c.checkedInAt.toISOString(), method: c.method })),
  };
}

export async function checkInGuest(
  actor: Actor | null,
  weddingId: string,
  input: { guestId: string; eventId: string; seats?: number; method?: "QR" | "MANUAL"; note?: string },
) {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "qr_checkin" });
  const { doc } = await loadRulesDoc(weddingId);
  if (!doc.events.some((e) => e.id === input.eventId)) throw invalid("Choose which event you are checking guests into.");
  const db = await getDb();
  const [guest] = await db.select().from(schema.guests).where(and(eq(schema.guests.id, input.guestId), eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)));
  if (!guest) throw notFound("Guest not found.");
  const seats = Math.max(1, Math.min(input.seats ?? guest.seats, guest.seats));
  const [inserted] = await db
    .insert(schema.checkins)
    .values({ weddingId, guestId: guest.id, eventId: input.eventId, seatsAdmitted: seats, method: input.method ?? "QR", note: input.note ?? "", checkedInBy: scope.actor.kind === "system" ? null : scope.actor.userId })
    .onConflictDoNothing()
    .returning();
  if (!inserted) {
    const [existing] = await db.select().from(schema.checkins).where(and(eq(schema.checkins.guestId, guest.id), eq(schema.checkins.eventId, input.eventId)));
    return { alreadyCheckedIn: true as const, at: existing.checkedInAt.toISOString(), seats: existing.seatsAdmitted, name: guest.name };
  }
  await audit(scope.actor, "checkin.recorded", { weddingId, entityType: "guest", entityId: guest.id, metadata: { eventId: input.eventId, seats } });
  return { alreadyCheckedIn: false as const, at: inserted.checkedInAt.toISOString(), seats, name: guest.name };
}

export async function undoCheckIn(actor: Actor | null, weddingId: string, guestId: string, eventId: string) {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "qr_checkin" });
  const db = await getDb();
  await db.delete(schema.checkins).where(and(eq(schema.checkins.weddingId, weddingId), eq(schema.checkins.guestId, guestId), eq(schema.checkins.eventId, eventId)));
  await audit(scope.actor, "checkin.undone", { weddingId, entityType: "guest", entityId: guestId, metadata: { eventId } });
}

export async function checkinStats(actor: Actor | null, weddingId: string, eventId: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "qr_checkin" });
  const db = await getDb();
  const [{ guests, seats }] = await db
    .select({ guests: sql<number>`count(*)::int`, seats: sql<number>`coalesce(sum(${schema.checkins.seatsAdmitted}),0)::int` })
    .from(schema.checkins)
    .where(and(eq(schema.checkins.weddingId, weddingId), eq(schema.checkins.eventId, eventId)));
  const [{ expected, invited }] = await db
    .select({
      expected: sql<number>`coalesce(sum(case when ${schema.rsvps.status} = 'YES' then ${schema.rsvps.attendingCount} else 0 end),0)::int`,
      invited: sql<number>`count(distinct ${schema.guests.id})::int`,
    })
    .from(schema.guests)
    .leftJoin(schema.rsvps, eq(schema.rsvps.guestId, schema.guests.id))
    .where(and(eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)));
  const recent = await db
    .select({ name: schema.guests.name, seats: schema.checkins.seatsAdmitted, at: schema.checkins.checkedInAt, method: schema.checkins.method })
    .from(schema.checkins)
    .innerJoin(schema.guests, eq(schema.guests.id, schema.checkins.guestId))
    .where(and(eq(schema.checkins.weddingId, weddingId), eq(schema.checkins.eventId, eventId)))
    .orderBy(desc(schema.checkins.checkedInAt))
    .limit(12);
  return { checkedInGuests: guests, checkedInSeats: seats, expectedSeats: expected, invited, recent: recent.map((r) => ({ ...r, at: r.at.toISOString() })) };
}

export async function listCheckinRoster(actor: Actor | null, weddingId: string, eventId: string, q = "") {
  await requireWeddingAccess(actor, weddingId, { feature: "qr_checkin" });
  const db = await getDb();
  const rows = await db
    .select({ id: schema.guests.id, name: schema.guests.name, seats: schema.guests.seats, group: schema.guestGroups.name, rsvp: schema.rsvps.status, attending: schema.rsvps.attendingCount, at: schema.checkins.checkedInAt })
    .from(schema.guests)
    .leftJoin(schema.guestGroups, eq(schema.guestGroups.id, schema.guests.groupId))
    .leftJoin(schema.rsvps, eq(schema.rsvps.guestId, schema.guests.id))
    .leftJoin(schema.checkins, and(eq(schema.checkins.guestId, schema.guests.id), eq(schema.checkins.eventId, eventId)))
    .where(and(eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)))
    .orderBy(schema.guests.name);
  const needle = q.trim().toLowerCase();
  return rows.filter((r) => !needle || r.name.toLowerCase().includes(needle)).map((r) => ({ ...r, at: r.at?.toISOString() ?? null }));
}

/** Control-room numbers for event-day mode. */
export async function eventDaySnapshot(actor: Actor | null, weddingId: string) {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "event_day_mode" });
  const { wedding, doc } = await loadRulesDoc(weddingId);
  const state = computeLiveState(doc.events, wedding.timezone, wedding.liveEventId, wedding.liveNote);
  const focus = state.current ?? state.next ?? doc.events.find((e) => e.isMain) ?? doc.events[0] ?? null;
  const stats = focus && canUse(scope.entitlements, "qr_checkin") ? await checkinStats(actor, weddingId, focus.id) : null;
  const db = await getDb();
  const pending = await db.select({ n: sql<number>`count(*)::int` }).from(schema.mediaAssets).where(and(eq(schema.mediaAssets.weddingId, weddingId), eq(schema.mediaAssets.category, "GUEST_UPLOAD"), eq(schema.mediaAssets.moderation, "PENDING")));
  const pendingWishes = await db.select({ n: sql<number>`count(*)::int` }).from(schema.guestMessages).where(and(eq(schema.guestMessages.weddingId, weddingId), eq(schema.guestMessages.moderation, "PENDING"), inArray(schema.guestMessages.kind, ["WISH", "SHOUTOUT"])));
  return { state, focusId: focus?.id ?? null, stats, pendingPhotos: pending[0].n, pendingWishes: pendingWishes[0].n, updates: await listLiveUpdates(weddingId, 5) };
}

export { forbidden };
