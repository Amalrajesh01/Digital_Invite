import { z } from "zod";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { forbidden, invalid, locked, notFound } from "@/lib/errors";
import { type Actor, requireWeddingAccess } from "@/domain/auth/access";
import { getEntitlements } from "@/domain/packages/service";
import { canUse } from "@/domain/packages/entitlements";
import { loadRulesDoc } from "@/domain/wedding/snapshot";
import { effectiveStatus } from "@/domain/wedding/lifecycle";
import { rateLimit } from "@/domain/platform/rate-limit";
import { enqueue, notifyClients, whatsappLink as whatsappLinkFor } from "@/domain/notify/service";
import { audit } from "@/domain/audit/audit";
import { todayInZone } from "@/lib/time";
import { tx } from "@/domain/doc/schema";
import { insertGuest, inviteUrl, ensureInvite, normalizePhone } from "./service";
import type { GuestContext } from "./context";

export const RsvpInput = z.object({
  status: z.enum(["YES", "NO", "MAYBE"]),
  attendingCount: z.number().int().min(0).max(30).optional(),
  meal: z.string().max(80).optional(),
  companions: z.array(z.object({ name: z.string().trim().min(1).max(80), isChild: z.boolean().optional(), meal: z.string().max(80).optional() })).max(30).optional(),
  needsAccommodation: z.boolean().optional(),
  accommodation: z.object({ rooms: z.number().int().min(1).max(10).optional(), arrival: z.string().max(60).optional(), departure: z.string().max(60).optional(), notes: z.string().max(300).optional() }).optional(),
  needsTransport: z.boolean().optional(),
  transport: z.object({ pickupLocation: z.string().max(120).optional(), mode: z.string().max(40).optional(), arrivalAt: z.string().max(60).optional(), reference: z.string().max(60).optional(), passengers: z.number().int().min(1).max(30).optional(), notes: z.string().max(300).optional() }).optional(),
  pickupLocation: z.string().max(120).optional(),
  eventResponses: z.record(z.string(), z.boolean()).optional(),
  note: z.string().max(500).optional(),
});
export type RsvpInput = z.infer<typeof RsvpInput>;

export const OpenRsvpInput = RsvpInput.extend({
  name: z.string().trim().min(1, "Please tell us your name").max(120),
  phone: z.string().max(30).optional(),
  email: z.string().max(200).optional(),
});
export type OpenRsvpInput = z.infer<typeof OpenRsvpInput>;

export interface RsvpResult {
  status: "YES" | "NO" | "MAYBE";
  attendingCount: number;
  message: string;
}

const OPEN_RSVP_MAX_SEATS = 10;

async function checkOpen(weddingId: string) {
  const { wedding, doc } = await loadRulesDoc(weddingId);
  const eff = effectiveStatus(wedding);
  if (["LIVE_EVENT", "POST_EVENT", "MEMORY", "ANNIVERSARY"].includes(eff)) throw locked("RSVPs are closed now that the celebration has begun.");
  if (doc.rsvp.deadline && todayInZone(wedding.timezone) > doc.rsvp.deadline) throw locked("The RSVP date has passed. Please contact the family directly.");
  return { wedding, doc };
}

/** Shared write path for both personalised (token) and open RSVPs. */
async function saveRsvp(weddingId: string, guestId: string, seats: number, input: RsvpInput, locale: string): Promise<RsvpResult> {
  const { wedding, doc } = await checkOpen(weddingId);
  const ent = await getEntitlements(weddingId);
  const db = await getDb();

  let attending = input.status === "YES" ? input.attendingCount ?? 1 : input.status === "MAYBE" ? input.attendingCount ?? 0 : 0;
  if (input.status === "YES") {
    if (attending < 1) throw invalid("Please tell us how many will attend.", { attendingCount: "At least 1" });
    if (attending > seats) throw invalid(`Your invitation is for up to ${seats} ${seats === 1 ? "guest" : "guests"}.`, { attendingCount: `Up to ${seats}` });
  }
  if (input.status === "MAYBE" && attending > seats) attending = seats;

  const mealIds = new Set(doc.rsvp.mealOptions.map((m) => m.id));
  const mealOk = (m?: string) => !m || !doc.rsvp.askMeal || mealIds.size === 0 || mealIds.has(m);
  if (!mealOk(input.meal) || (input.companions ?? []).some((c) => !mealOk(c.meal))) throw invalid("Please choose one of the meal options.", { meal: "Invalid choice" });
  const askMeal = doc.rsvp.askMeal && canUse(ent, "meal_preference") && input.status !== "NO";
  const wantsStay = doc.rsvp.askAccommodation && canUse(ent, "accommodation") && input.status === "YES" && !!input.needsAccommodation;
  const wantsRide = doc.rsvp.askTransport && canUse(ent, "transport") && input.status === "YES" && !!input.needsTransport;
  const companions = input.status === "YES" && doc.rsvp.allowCompanions ? (input.companions ?? []).slice(0, Math.max(0, attending - 1)) : [];
  const pickup = wantsRide ? (input.transport?.pickupLocation ?? input.pickupLocation ?? "") : "";

  await db.transaction(async (t) => {
    await t
      .insert(schema.rsvps)
      .values({
        weddingId,
        guestId,
        status: input.status,
        attendingCount: attending,
        meal: askMeal ? input.meal ?? "" : "",
        needsAccommodation: wantsStay,
        needsTransport: wantsRide,
        pickupLocation: pickup,
        eventResponses: doc.rsvp.askEventResponses ? input.eventResponses ?? {} : {},
        note: input.note?.trim() ?? "",
      })
      .onConflictDoUpdate({
        target: schema.rsvps.guestId,
        set: {
          status: input.status,
          attendingCount: attending,
          meal: askMeal ? input.meal ?? "" : "",
          needsAccommodation: wantsStay,
          needsTransport: wantsRide,
          pickupLocation: pickup,
          eventResponses: doc.rsvp.askEventResponses ? input.eventResponses ?? {} : {},
          note: input.note?.trim() ?? "",
          respondedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    await t.delete(schema.guestCompanions).where(eq(schema.guestCompanions.guestId, guestId));
    if (companions.length) {
      await t.insert(schema.guestCompanions).values(companions.map((c) => ({ weddingId, guestId, name: c.name, isChild: !!c.isChild, meal: askMeal ? c.meal ?? "" : "" })));
    }

    if (wantsStay) {
      const a = input.accommodation ?? {};
      await t
        .insert(schema.accommodationRequests)
        .values({ weddingId, guestId, rooms: a.rooms ?? 1, arrival: a.arrival ?? "", departure: a.departure ?? "", notes: a.notes ?? "" })
        .onConflictDoUpdate({ target: schema.accommodationRequests.guestId, set: { rooms: a.rooms ?? 1, arrival: a.arrival ?? "", departure: a.departure ?? "", notes: a.notes ?? "", updatedAt: new Date() } });
    } else {
      await t.delete(schema.accommodationRequests).where(and(eq(schema.accommodationRequests.guestId, guestId), eq(schema.accommodationRequests.status, "REQUESTED")));
    }
    if (wantsRide) {
      const r = input.transport ?? {};
      await t
        .insert(schema.transportRequests)
        .values({ weddingId, guestId, pickupLocation: pickup, mode: r.mode ?? "", arrivalAt: r.arrivalAt ?? "", reference: r.reference ?? "", passengers: r.passengers ?? attending, notes: r.notes ?? "" })
        .onConflictDoUpdate({ target: schema.transportRequests.guestId, set: { pickupLocation: pickup, mode: r.mode ?? "", arrivalAt: r.arrivalAt ?? "", reference: r.reference ?? "", passengers: r.passengers ?? attending, notes: r.notes ?? "", updatedAt: new Date() } });
    } else {
      await t.delete(schema.transportRequests).where(and(eq(schema.transportRequests.guestId, guestId), eq(schema.transportRequests.status, "REQUESTED")));
    }
    await t.update(schema.guests).set({ invitationStatus: "RESPONDED", updatedAt: new Date() }).where(eq(schema.guests.id, guestId));
  });

  const [g] = await db.select().from(schema.guests).where(eq(schema.guests.id, guestId));
  const couple = wedding.title;
  await notifyClients(weddingId, "rsvp_received", { name: g.name, status: input.status, count: attending }, `/client/${weddingId}/rsvp`);
  if (wantsStay) await notifyClients(weddingId, "accommodation_request", { name: g.name, rooms: input.accommodation?.rooms ?? 1 }, `/client/${weddingId}/accommodation`);
  if (wantsRide) await notifyClients(weddingId, "transport_request", { name: g.name, pickup }, `/client/${weddingId}/transport`);
  if (g.email) {
    const token = await ensureInvite(weddingId, guestId);
    await enqueue({ template: "rsvp_confirmation", channel: "EMAIL", weddingId, guestId, to: g.email, vars: { name: g.name, couple, status: input.status }, link: inviteUrl(wedding.slug, token) });
  }
  await audit({ kind: "guest", guestId, name: g.name }, "rsvp.submitted", { weddingId, entityType: "guest", entityId: guestId, metadata: { status: input.status, attending } });

  const custom = tx(doc.rsvp.thankYou, locale, "en");
  const message = (custom || "Thank you. We can't wait to celebrate with you.").replace(/\{name\}/gi, g.name);
  return { status: input.status, attendingCount: attending, message };
}

export async function submitGuestRsvp(ctx: GuestContext, raw: unknown, locale = "en"): Promise<RsvpResult> {
  await rateLimit(`rsvp:${ctx.guestId}`, 30, 3600);
  const input = RsvpInput.parse(raw);
  return saveRsvp(ctx.weddingId, ctx.guestId, ctx.seats, input, locale);
}

/** Public RSVP for invitations without personal links (Essential). Creates a guest record so replies are never lost. */
export async function submitOpenRsvp(weddingId: string, raw: unknown, meta: { ip?: string } = {}, locale = "en"): Promise<RsvpResult> {
  if (meta.ip) await rateLimit(`rsvp-open:${meta.ip}`, 20, 3600);
  await rateLimit(`rsvp-open-w:${weddingId}`, 400, 3600);
  const input = OpenRsvpInput.parse(raw);
  const ent = await getEntitlements(weddingId);
  if (!canUse(ent, "rsvp")) throw forbidden("RSVP is not enabled for this invitation.");
  await checkOpen(weddingId);
  const db = await getDb();
  const phone = normalizePhone(input.phone);
  let guestId: string | null = null;
  if (phone) {
    const [existing] = await db.select({ id: schema.guests.id }).from(schema.guests).where(and(eq(schema.guests.weddingId, weddingId), eq(schema.guests.phone, phone), isNull(schema.guests.archivedAt)));
    guestId = existing?.id ?? null;
  }
  const seats = Math.min(OPEN_RSVP_MAX_SEATS, Math.max(1, input.attendingCount ?? 1));
  if (!guestId) {
    const [other] = await db.select({ id: schema.guestGroups.id }).from(schema.guestGroups).where(and(eq(schema.guestGroups.weddingId, weddingId), eq(schema.guestGroups.key, "other")));
    const g = await insertGuest(weddingId, { name: input.name, phone: input.phone, email: input.email, seats, groupId: other?.id ?? null, source: "OPEN_RSVP" });
    guestId = g.id;
  }
  return saveRsvp(weddingId, guestId, OPEN_RSVP_MAX_SEATS, input, locale);
}

export async function getGuestRsvp(ctx: GuestContext) {
  const db = await getDb();
  const [r] = await db.select().from(schema.rsvps).where(eq(schema.rsvps.guestId, ctx.guestId));
  if (!r) return null;
  const companions = await db.select().from(schema.guestCompanions).where(eq(schema.guestCompanions.guestId, ctx.guestId));
  const [acc] = await db.select().from(schema.accommodationRequests).where(eq(schema.accommodationRequests.guestId, ctx.guestId));
  const [trn] = await db.select().from(schema.transportRequests).where(eq(schema.transportRequests.guestId, ctx.guestId));
  return {
    status: r.status,
    attendingCount: r.attendingCount,
    meal: r.meal,
    note: r.note,
    eventResponses: r.eventResponses,
    companions: companions.map((c) => ({ name: c.name, isChild: c.isChild, meal: c.meal })),
    needsAccommodation: r.needsAccommodation,
    accommodation: acc ? { rooms: acc.rooms, arrival: acc.arrival, departure: acc.departure, notes: acc.notes } : null,
    needsTransport: r.needsTransport,
    transport: trn ? { pickupLocation: trn.pickupLocation, mode: trn.mode, arrivalAt: trn.arrivalAt, reference: trn.reference, passengers: trn.passengers, notes: trn.notes } : null,
  };
}

// ── dashboard summaries ────────────────────────────────────────────────────
export async function rsvpSummary(actor: Actor | null, weddingId: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "rsvp_dashboard" });
  const db = await getDb();
  const { doc } = await loadRulesDoc(weddingId);
  const guests = await db.select({ id: schema.guests.id, seats: schema.guests.seats, groupId: schema.guests.groupId, status: schema.guests.invitationStatus }).from(schema.guests).where(and(eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)));
  const rs = await db.select().from(schema.rsvps).where(eq(schema.rsvps.weddingId, weddingId));
  const groups = await db.select().from(schema.guestGroups).where(eq(schema.guestGroups.weddingId, weddingId)).orderBy(asc(schema.guestGroups.sortOrder));
  const active = new Set(guests.map((g) => g.id));
  const live = rs.filter((r) => active.has(r.guestId));
  const yes = live.filter((r) => r.status === "YES");
  const no = live.filter((r) => r.status === "NO");
  const maybe = live.filter((r) => r.status === "MAYBE");
  const meals: Record<string, number> = {};
  for (const r of yes) if (r.meal) meals[r.meal] = (meals[r.meal] ?? 0) + 1;
  const comp = await db.select({ meal: schema.guestCompanions.meal, guestId: schema.guestCompanions.guestId }).from(schema.guestCompanions).where(eq(schema.guestCompanions.weddingId, weddingId));
  for (const c of comp) if (c.meal && active.has(c.guestId)) meals[c.meal] = (meals[c.meal] ?? 0) + 1;
  const mealLabel = (id: string) => tx(doc.rsvp.mealOptions.find((m) => m.id === id)?.label, "en") || id;
  const byGroup = groups.map((g) => {
    const gs = guests.filter((x) => x.groupId === g.id);
    const ids = new Set(gs.map((x) => x.id));
    const gr = live.filter((r) => ids.has(r.guestId));
    return { id: g.id, name: g.name, invited: gs.length, yes: gr.filter((r) => r.status === "YES").length, no: gr.filter((r) => r.status === "NO").length, maybe: gr.filter((r) => r.status === "MAYBE").length, headcount: gr.filter((r) => r.status === "YES").reduce((n, r) => n + r.attendingCount, 0) };
  });
  return {
    invited: guests.length,
    seatsReserved: guests.reduce((n, g) => n + g.seats, 0),
    yes: yes.length,
    no: no.length,
    maybe: maybe.length,
    pending: guests.length - live.length,
    headcount: yes.reduce((n, r) => n + r.attendingCount, 0),
    needStay: live.filter((r) => r.needsAccommodation).length,
    needRide: live.filter((r) => r.needsTransport).length,
    opened: guests.filter((g) => g.status === "OPENED" || g.status === "RESPONDED").length,
    meals: Object.entries(meals).map(([id, count]) => ({ id, label: mealLabel(id), count })),
    byGroup,
    deadline: doc.rsvp.deadline,
  };
}

export async function sendRsvpReminders(actor: Actor | null, weddingId: string, opts: { guestIds?: string[]; locale?: string } = {}) {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "rsvp_reminders" });
  const db = await getDb();
  const { wedding, doc } = await loadRulesDoc(weddingId);
  const conds = [eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt), sql`not exists (select 1 from ${schema.rsvps} r where r.guest_id = ${schema.guests.id})`];
  if (opts.guestIds?.length) conds.push(inArray(schema.guests.id, opts.guestIds));
  const pending = await db.select().from(schema.guests).where(and(...conds));
  const items: { guestId: string; name: string; email: string | null; whatsapp: string | null; link: string }[] = [];
  for (const g of pending) {
    const token = await ensureInvite(weddingId, g.id);
    const link = inviteUrl(scope.weddingSlug, token);
    if (g.email) await enqueue({ template: "rsvp_reminder", channel: "EMAIL", weddingId, guestId: g.id, to: g.email, vars: { name: g.name, couple: wedding.title, deadline: doc.rsvp.deadline }, link });
    const text = opts.locale === "ml"
      ? `പ്രിയപ്പെട്ട ${g.name}, ${wedding.title} ന്റെ വിവാഹത്തിന് താങ്കൾ പങ്കെടുക്കുമോ എന്ന് അറിയിക്കാൻ ദയവായി ഈ ലിങ്ക് തുറക്കൂ: ${link}`
      : `Dear ${g.name}, we would love to know if you can join us for ${wedding.title}. Please reply here: ${link}`;
    items.push({ guestId: g.id, name: g.name, email: g.email, whatsapp: g.phone ? whatsappLinkFor(g.phone, text) : null, link });
  }
  if (pending.length) {
    await db.update(schema.guests).set({ reminderCount: sql`${schema.guests.reminderCount} + 1`, lastRemindedAt: new Date() }).where(inArray(schema.guests.id, pending.map((p) => p.id)));
  }
  await audit(scope.actor, "rsvp.reminders_sent", { weddingId, metadata: { count: pending.length } });
  return { count: pending.length, items };
}

// ── accommodation & transport management ───────────────────────────────────
export async function listAccommodation(actor: Actor | null, weddingId: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "accommodation" });
  const db = await getDb();
  return db
    .select({ req: schema.accommodationRequests, guest: { id: schema.guests.id, name: schema.guests.name, phone: schema.guests.phone } })
    .from(schema.accommodationRequests)
    .innerJoin(schema.guests, eq(schema.guests.id, schema.accommodationRequests.guestId))
    .where(eq(schema.accommodationRequests.weddingId, weddingId))
    .orderBy(asc(schema.guests.name));
}

export async function updateAccommodation(actor: Actor | null, weddingId: string, id: string, patch: { status?: "REQUESTED" | "CONFIRMED" | "DECLINED"; assignment?: string }) {
  await requireWeddingAccess(actor, weddingId, { feature: "accommodation" });
  const db = await getDb();
  const [row] = await db.update(schema.accommodationRequests).set({ ...patch, updatedAt: new Date() }).where(and(eq(schema.accommodationRequests.id, id), eq(schema.accommodationRequests.weddingId, weddingId))).returning();
  if (!row) throw notFound();
  return row;
}

export async function listTransport(actor: Actor | null, weddingId: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "transport" });
  const db = await getDb();
  return db
    .select({ req: schema.transportRequests, guest: { id: schema.guests.id, name: schema.guests.name, phone: schema.guests.phone } })
    .from(schema.transportRequests)
    .innerJoin(schema.guests, eq(schema.guests.id, schema.transportRequests.guestId))
    .where(eq(schema.transportRequests.weddingId, weddingId))
    .orderBy(asc(schema.guests.name));
}

export async function updateTransport(actor: Actor | null, weddingId: string, id: string, patch: { status?: "REQUESTED" | "CONFIRMED" | "DECLINED"; vehicle?: string }) {
  await requireWeddingAccess(actor, weddingId, { feature: "transport" });
  const db = await getDb();
  const [row] = await db.update(schema.transportRequests).set({ ...patch, updatedAt: new Date() }).where(and(eq(schema.transportRequests.id, id), eq(schema.transportRequests.weddingId, weddingId))).returning();
  if (!row) throw notFound();
  return row;
}
