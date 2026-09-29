import Papa from "papaparse";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { conflict, invalid, notFound } from "@/lib/errors";
import { secureToken } from "@/lib/id";
import { env } from "@/lib/env";
import { type Actor, requireWeddingAccess } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { enqueue, whatsappLink } from "@/domain/notify/service";
import type { LocalizedText } from "@/domain/doc/schema";
import { tx } from "@/domain/doc/schema";

export type GuestRow = typeof schema.guests.$inferSelect;

/** Digits only, with country code. 10-digit numbers are assumed Indian (+91). */
export function normalizePhone(input: string | null | undefined, defaultCountry = "91"): string | null {
  if (!input) return null;
  let d = input.replace(/[^\d]/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = defaultCountry + d;
  if (d.length < 8 || d.length > 15) return null;
  return d;
}

export const inviteUrl = (slug: string, token: string) => `${env.appUrl}/invite/${slug}/${token}`;
export const publicUrl = (slug: string) => `${env.appUrl}/invite/${slug}`;

// ── groups ─────────────────────────────────────────────────────────────────
export async function listGroups(actor: Actor | null, weddingId: string) {
  await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  const groups = await db.select().from(schema.guestGroups).where(eq(schema.guestGroups.weddingId, weddingId)).orderBy(asc(schema.guestGroups.sortOrder));
  const counts = await db
    .select({ groupId: schema.guests.groupId, n: sql<number>`count(*)::int` })
    .from(schema.guests)
    .where(and(eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)))
    .groupBy(schema.guests.groupId);
  return groups.map((g) => ({ ...g, count: counts.find((c) => c.groupId === g.id)?.n ?? 0 }));
}

export async function createGroup(actor: Actor | null, weddingId: string, name: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_management" });
  const clean = name.trim();
  if (!clean) throw invalid("Give the group a name.", { name: "Required" });
  const key = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "group";
  const db = await getDb();
  const [dupe] = await db.select({ id: schema.guestGroups.id }).from(schema.guestGroups).where(and(eq(schema.guestGroups.weddingId, weddingId), eq(schema.guestGroups.key, key)));
  if (dupe) throw conflict("You already have a group with that name.");
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.guestGroups).where(eq(schema.guestGroups.weddingId, weddingId));
  const [row] = await db.insert(schema.guestGroups).values({ weddingId, key, name: clean, kind: "CUSTOM", sortOrder: n }).returning();
  return row;
}

export async function deleteGroup(actor: Actor | null, weddingId: string, groupId: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_management" });
  const db = await getDb();
  const [g] = await db.select().from(schema.guestGroups).where(and(eq(schema.guestGroups.id, groupId), eq(schema.guestGroups.weddingId, weddingId)));
  if (!g) throw notFound("Group not found.");
  if (g.kind !== "CUSTOM") throw invalid("The built-in groups cannot be removed.");
  await db.delete(schema.guestGroups).where(eq(schema.guestGroups.id, groupId));
}

// ── list ───────────────────────────────────────────────────────────────────
export interface GuestFilter {
  q?: string;
  groupId?: string;
  rsvp?: "YES" | "NO" | "MAYBE" | "PENDING";
  invitation?: "NOT_SENT" | "SENT" | "OPENED" | "RESPONDED";
  checkedIn?: boolean;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export async function listGuests(actor: Actor | null, weddingId: string, f: GuestFilter = {}) {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_management" });
  const db = await getDb();
  const conds = [eq(schema.guests.weddingId, weddingId)];
  if (!f.includeArchived) conds.push(isNull(schema.guests.archivedAt));
  if (f.groupId) conds.push(eq(schema.guests.groupId, f.groupId));
  if (f.invitation) conds.push(eq(schema.guests.invitationStatus, f.invitation));
  if (f.q?.trim()) {
    const like = `%${f.q.trim().replace(/[%_]/g, "")}%`;
    conds.push(or(ilike(schema.guests.name, like), ilike(schema.guests.phone, like), ilike(schema.guests.email, like))!);
  }
  if (f.rsvp === "PENDING") conds.push(sql`${schema.rsvps.id} is null`);
  else if (f.rsvp) conds.push(eq(schema.rsvps.status, f.rsvp));

  const rows = await db
    .select({
      guest: schema.guests,
      group: { id: schema.guestGroups.id, name: schema.guestGroups.name, key: schema.guestGroups.key },
      rsvp: schema.rsvps,
      token: schema.guestInvites.token,
      checkins: sql<number>`(select count(*)::int from ${schema.checkins} c where c.guest_id = ${schema.guests.id})`,
      accommodation: schema.accommodationRequests.status,
      transport: schema.transportRequests.status,
    })
    .from(schema.guests)
    .leftJoin(schema.guestGroups, eq(schema.guestGroups.id, schema.guests.groupId))
    .leftJoin(schema.rsvps, eq(schema.rsvps.guestId, schema.guests.id))
    .leftJoin(schema.guestInvites, and(eq(schema.guestInvites.guestId, schema.guests.id), isNull(schema.guestInvites.revokedAt)))
    .leftJoin(schema.accommodationRequests, eq(schema.accommodationRequests.guestId, schema.guests.id))
    .leftJoin(schema.transportRequests, eq(schema.transportRequests.guestId, schema.guests.id))
    .where(and(...conds))
    .orderBy(desc(schema.guests.createdAt))
    .limit(Math.min(f.limit ?? 500, 1000))
    .offset(f.offset ?? 0);

  const filtered = f.checkedIn === undefined ? rows : rows.filter((r) => (r.checkins > 0) === f.checkedIn);
  return filtered.map((r) => ({ ...r.guest, group: r.group?.id ? r.group : null, rsvp: r.rsvp, token: r.token, checkedIn: r.checkins > 0, accommodation: r.accommodation, transport: r.transport }));
}

export type GuestListItem = Awaited<ReturnType<typeof listGuests>>[number];

// ── create / update ────────────────────────────────────────────────────────
export interface GuestInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  groupId?: string | null;
  seats?: number;
  relationship?: string;
  customGreeting?: LocalizedText;
  preferredLocale?: string | null;
  notes?: string;
  source?: "MANUAL" | "IMPORT" | "OPEN_RSVP";
}

function cleanGuestInput(input: GuestInput) {
  const name = input.name?.trim();
  if (!name) throw invalid("Enter the guest's name.", { name: "Required" });
  const email = input.email?.trim().toLowerCase() || null;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw invalid("That email address does not look right.", { email: "Invalid email" });
  const phoneRaw = input.phone?.trim();
  const phone = normalizePhone(phoneRaw);
  if (phoneRaw && !phone) throw invalid("That phone number does not look right.", { phone: "Invalid phone" });
  const seats = Math.max(1, Math.min(Number(input.seats ?? 1) || 1, 30));
  return { name: name.slice(0, 120), email, phone, seats };
}

export async function createGuest(actor: Actor | null, weddingId: string, input: GuestInput) {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_management" });
  return insertGuest(weddingId, input, actor);
}

export async function insertGuest(weddingId: string, input: GuestInput, actor: Actor | null = null) {
  const db = await getDb();
  const c = cleanGuestInput(input);
  if (c.phone) {
    const [dupe] = await db
      .select({ id: schema.guests.id, name: schema.guests.name })
      .from(schema.guests)
      .where(and(eq(schema.guests.weddingId, weddingId), eq(schema.guests.phone, c.phone), isNull(schema.guests.archivedAt)));
    if (dupe) throw conflict(`${dupe.name} is already on your list with that phone number.`);
  }
  if (input.groupId) {
    const [g] = await db.select({ id: schema.guestGroups.id }).from(schema.guestGroups).where(and(eq(schema.guestGroups.id, input.groupId), eq(schema.guestGroups.weddingId, weddingId)));
    if (!g) throw invalid("That group does not exist.");
  }
  const [guest] = await db
    .insert(schema.guests)
    .values({
      weddingId,
      groupId: input.groupId ?? null,
      name: c.name,
      phone: c.phone,
      email: c.email,
      seats: c.seats,
      relationship: input.relationship?.trim() ?? "",
      customGreeting: input.customGreeting ?? {},
      preferredLocale: input.preferredLocale ?? null,
      notes: input.notes?.trim() ?? "",
      source: input.source ?? "MANUAL",
    })
    .returning();
  await ensureInvite(weddingId, guest.id);
  if (actor) await audit(actor, "guest.created", { weddingId, entityType: "guest", entityId: guest.id });
  return guest;
}

export async function updateGuest(actor: Actor | null, weddingId: string, guestId: string, patch: Partial<GuestInput>) {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_management" });
  const db = await getDb();
  const [cur] = await db.select().from(schema.guests).where(and(eq(schema.guests.id, guestId), eq(schema.guests.weddingId, weddingId)));
  if (!cur) throw notFound("Guest not found.");
  const merged = { name: patch.name ?? cur.name, phone: patch.phone === undefined ? cur.phone : patch.phone, email: patch.email === undefined ? cur.email : patch.email, seats: patch.seats ?? cur.seats };
  const c = cleanGuestInput(merged);
  if (c.phone && c.phone !== cur.phone) {
    const [dupe] = await db
      .select({ id: schema.guests.id, name: schema.guests.name })
      .from(schema.guests)
      .where(and(eq(schema.guests.weddingId, weddingId), eq(schema.guests.phone, c.phone), isNull(schema.guests.archivedAt)));
    if (dupe && dupe.id !== guestId) throw conflict(`${dupe.name} already has that phone number.`);
  }
  if (patch.groupId) {
    const [g] = await db.select({ id: schema.guestGroups.id }).from(schema.guestGroups).where(and(eq(schema.guestGroups.id, patch.groupId), eq(schema.guestGroups.weddingId, weddingId)));
    if (!g) throw invalid("That group does not exist.");
  }
  const [row] = await db
    .update(schema.guests)
    .set({
      name: c.name,
      phone: c.phone,
      email: c.email,
      seats: c.seats,
      groupId: patch.groupId === undefined ? cur.groupId : patch.groupId,
      relationship: patch.relationship ?? cur.relationship,
      customGreeting: patch.customGreeting ?? cur.customGreeting,
      preferredLocale: patch.preferredLocale === undefined ? cur.preferredLocale : patch.preferredLocale,
      notes: patch.notes ?? cur.notes,
      updatedAt: new Date(),
    })
    .where(eq(schema.guests.id, guestId))
    .returning();
  await audit(actor, "guest.updated", { weddingId, entityType: "guest", entityId: guestId });
  return row;
}

export async function archiveGuests(actor: Actor | null, weddingId: string, guestIds: string[]) {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_management" });
  const db = await getDb();
  await db.update(schema.guests).set({ archivedAt: new Date() }).where(and(eq(schema.guests.weddingId, weddingId), inArray(schema.guests.id, guestIds)));
  await db.update(schema.guestInvites).set({ revokedAt: new Date() }).where(and(eq(schema.guestInvites.weddingId, weddingId), inArray(schema.guestInvites.guestId, guestIds)));
  await audit(actor, "guest.archived", { weddingId, entityType: "guest", metadata: { count: guestIds.length } });
}

export async function bulkSetGroup(actor: Actor | null, weddingId: string, guestIds: string[], groupId: string | null) {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_management" });
  const db = await getDb();
  if (groupId) {
    const [g] = await db.select({ id: schema.guestGroups.id }).from(schema.guestGroups).where(and(eq(schema.guestGroups.id, groupId), eq(schema.guestGroups.weddingId, weddingId)));
    if (!g) throw invalid("That group does not exist.");
  }
  await db.update(schema.guests).set({ groupId, updatedAt: new Date() }).where(and(eq(schema.guests.weddingId, weddingId), inArray(schema.guests.id, guestIds)));
}

// ── invites (secure personal links) ────────────────────────────────────────
export async function ensureInvite(weddingId: string, guestId: string): Promise<string> {
  const db = await getDb();
  const [cur] = await db
    .select({ token: schema.guestInvites.token })
    .from(schema.guestInvites)
    .where(and(eq(schema.guestInvites.guestId, guestId), eq(schema.guestInvites.weddingId, weddingId), isNull(schema.guestInvites.revokedAt)));
  if (cur) return cur.token;
  const token = secureToken();
  await db.insert(schema.guestInvites).values({ weddingId, guestId, token });
  return token;
}

/** Replace a guest's link (e.g. it was forwarded to someone else). The old link stops working. */
export async function regenerateInvite(actor: Actor | null, weddingId: string, guestId: string) {
  await requireWeddingAccess(actor, weddingId, { feature: "personalized_urls" });
  const db = await getDb();
  const [g] = await db.select({ id: schema.guests.id }).from(schema.guests).where(and(eq(schema.guests.id, guestId), eq(schema.guests.weddingId, weddingId)));
  if (!g) throw notFound("Guest not found.");
  await db.update(schema.guestInvites).set({ revokedAt: new Date() }).where(and(eq(schema.guestInvites.guestId, guestId), isNull(schema.guestInvites.revokedAt)));
  const token = await ensureInvite(weddingId, guestId);
  await audit(actor, "guest.invite_regenerated", { weddingId, entityType: "guest", entityId: guestId });
  return token;
}

export async function markInvitationSent(actor: Actor | null, weddingId: string, guestIds: string[]) {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_management" });
  const db = await getDb();
  await db
    .update(schema.guests)
    .set({ invitationStatus: "SENT", sentAt: new Date(), updatedAt: new Date() })
    .where(and(eq(schema.guests.weddingId, weddingId), inArray(schema.guests.id, guestIds), eq(schema.guests.invitationStatus, "NOT_SENT")));
}

export interface InviteShare {
  guestId: string;
  name: string;
  link: string;
  whatsapp: string | null;
  message: string;
}

/** Links + ready-to-send WhatsApp messages for a set of guests. */
export async function buildShareList(actor: Actor | null, weddingId: string, guestIds?: string[], locale = "en"): Promise<InviteShare[]> {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "personalized_urls" });
  const db = await getDb();
  const [w] = await db.select().from(schema.weddings).where(eq(schema.weddings.id, weddingId));
  const conds = [eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)];
  if (guestIds?.length) conds.push(inArray(schema.guests.id, guestIds));
  const guests = await db.select().from(schema.guests).where(and(...conds)).orderBy(asc(schema.guests.name));
  const couple = w.title || "The couple";
  const out: InviteShare[] = [];
  for (const g of guests) {
    const token = await ensureInvite(weddingId, g.id);
    const link = inviteUrl(scope.weddingSlug, token);
    const message = locale === "ml"
      ? `പ്രിയപ്പെട്ട ${g.name},\n\n${couple} ന്റെ വിവാഹത്തിന് നിങ്ങളെ സ്നേഹപൂർവം ക്ഷണിക്കുന്നു. നിങ്ങളുടെ വ്യക്തിഗത ക്ഷണം ഇവിടെ:\n${link}`
      : `Dear ${g.name},\n\n${couple} would love to celebrate their wedding with you. Your personal invitation:\n${link}`;
    out.push({ guestId: g.id, name: g.name, link, whatsapp: g.phone ? whatsappLink(g.phone, message) : null, message });
  }
  return out;
}

export async function sendInvitationEmails(actor: Actor | null, weddingId: string, guestIds?: string[]) {
  const scope = await requireWeddingAccess(actor, weddingId, { feature: "personalized_urls" });
  const db = await getDb();
  const [w] = await db.select().from(schema.weddings).where(eq(schema.weddings.id, weddingId));
  const conds = [eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)];
  if (guestIds?.length) conds.push(inArray(schema.guests.id, guestIds));
  const guests = await db.select().from(schema.guests).where(and(...conds));
  let queued = 0;
  for (const g of guests) {
    if (!g.email) continue;
    const token = await ensureInvite(weddingId, g.id);
    await enqueue({ template: "guest_invitation", channel: "EMAIL", weddingId, guestId: g.id, to: g.email, vars: { name: g.name, couple: w.title }, link: inviteUrl(scope.weddingSlug, token) });
    queued++;
  }
  if (queued) await db.update(schema.guests).set({ invitationStatus: "SENT", sentAt: new Date() }).where(and(eq(schema.guests.weddingId, weddingId), inArray(schema.guests.id, guests.filter((g) => g.email).map((g) => g.id)), eq(schema.guests.invitationStatus, "NOT_SENT")));
  return { queued };
}

// ── CSV import / export ────────────────────────────────────────────────────
export interface ImportResult {
  created: number;
  skipped: { row: number; name: string; reason: string }[];
  errors: { row: number; message: string }[];
}

const truthy = (s: string | undefined) => /^(y|yes|true|1|required|needed)$/i.test((s ?? "").trim());

export async function importGuestsCsv(actor: Actor | null, weddingId: string, csvText: string): Promise<ImportResult> {
  await requireWeddingAccess(actor, weddingId, { feature: "guest_management" });
  const parsed = Papa.parse<Record<string, string>>(csvText.trim(), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });
  if (parsed.errors.length && !parsed.data.length) throw invalid("We could not read that file. Please use the CSV template.");
  if (parsed.data.length > 2000) throw invalid("Please import up to 2,000 guests at a time.");
  const db = await getDb();
  const groups = await db.select().from(schema.guestGroups).where(eq(schema.guestGroups.weddingId, weddingId));
  const result: ImportResult = { created: 0, skipped: [], errors: [] };
  let rowNo = 1;
  for (const r of parsed.data) {
    rowNo++;
    const name = (r.name ?? r["guest name"] ?? "").trim();
    if (!name) {
      result.errors.push({ row: rowNo, message: "Name is missing" });
      continue;
    }
    const gName = (r.group ?? "").trim().toLowerCase();
    let group = groups.find((g) => g.name.toLowerCase() === gName || g.key === gName);
    if (gName && !group) {
      const [created] = await db.insert(schema.guestGroups).values({ weddingId, key: gName.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "group", name: r.group.trim(), kind: "CUSTOM", sortOrder: groups.length }).onConflictDoNothing().returning();
      if (created) {
        groups.push(created);
        group = created;
      }
    }
    try {
      const guest = await insertGuest(weddingId, { name, phone: r.phone, email: r.email, groupId: group?.id ?? null, seats: Number(r.seats) || 1, relationship: r.relationship, source: "IMPORT" });
      // Optional pre-filled needs so the couple's plan is ready before replies arrive.
      if (truthy(r.accommodation)) await db.insert(schema.accommodationRequests).values({ weddingId, guestId: guest.id, status: "REQUESTED", notes: "Imported" }).onConflictDoNothing();
      if (truthy(r.transport)) await db.insert(schema.transportRequests).values({ weddingId, guestId: guest.id, status: "REQUESTED", notes: "Imported" }).onConflictDoNothing();
      result.created++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not add";
      if ((e as { code?: string }).code === "CONFLICT") result.skipped.push({ row: rowNo, name, reason: msg });
      else result.errors.push({ row: rowNo, message: msg });
    }
  }
  await audit(actor, "guest.imported", { weddingId, metadata: { created: result.created, skipped: result.skipped.length, errors: result.errors.length } });
  return result;
}

export const CSV_TEMPLATE = "name,phone,email,group,seats,relationship,meal,accommodation,transport\nMeera Menon,9846000001,meera@example.com,Bride's family,3,Aunt,Vegetarian,yes,no\n";

/** Spreadsheet formulas typed by a guest (=, +, -, @) must not execute when the CSV is opened in Excel. */
function csvSafe(v: unknown): string {
  const s = String(v ?? "");
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export async function exportRsvpCsv(actor: Actor | null, weddingId: string): Promise<string> {
  await requireWeddingAccess(actor, weddingId, { feature: "rsvp_dashboard" });
  const rows = await listGuests(actor, weddingId);
  const db = await getDb();
  const companions = await db.select().from(schema.guestCompanions).where(eq(schema.guestCompanions.weddingId, weddingId));
  const acc = await db.select().from(schema.accommodationRequests).where(eq(schema.accommodationRequests.weddingId, weddingId));
  const tr = await db.select().from(schema.transportRequests).where(eq(schema.transportRequests.weddingId, weddingId));
  const data = rows.map((g) => ({
    name: csvSafe(g.name),
    phone: csvSafe(g.phone ?? ""),
    email: csvSafe(g.email ?? ""),
    group: csvSafe(g.group?.name ?? ""),
    seats_reserved: g.seats,
    rsvp: g.rsvp?.status ?? "PENDING",
    attending: g.rsvp?.attendingCount ?? 0,
    meal: csvSafe(g.rsvp?.meal ?? ""),
    companions: csvSafe(companions.filter((c) => c.guestId === g.id).map((c) => c.name).join("; ")),
    accommodation: acc.find((a) => a.guestId === g.id)?.status ?? "",
    transport: tr.find((t) => t.guestId === g.id)?.status ?? "",
    pickup: csvSafe(g.rsvp?.pickupLocation ?? ""),
    invitation: g.invitationStatus,
    checked_in: g.checkedIn ? "yes" : "no",
    notes: csvSafe(g.notes),
  }));
  return Papa.unparse(data);
}

export function guestGreeting(
  guest: { name: string; customGreeting: LocalizedText; relationship: string },
  greetings: { default: LocalizedText; byRelationship: { match: string; text: LocalizedText }[] },
  locale: string,
  opts: { advanced: boolean; fallback: string },
): string {
  const replace = (s: string) => s.replace(/\{name\}/gi, guest.name);
  const custom = tx(guest.customGreeting, locale, "en");
  if (custom) return replace(custom);
  if (opts.advanced && guest.relationship) {
    const rel = guest.relationship.toLowerCase();
    const hit = greetings.byRelationship.find((r) => r.match.trim() && rel.includes(r.match.trim().toLowerCase()));
    if (hit) {
      const t = tx(hit.text, locale, "en");
      if (t) return replace(t);
    }
  }
  const dflt = tx(greetings.default, locale, "en");
  return replace(dflt || opts.fallback);
}
