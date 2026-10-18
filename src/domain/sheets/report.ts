import { and, asc, eq, gte, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { env } from "@/lib/env";
import type { Tab } from "./google";

/**
 * What a client sees in their sheet instead of a dashboard: the headline numbers, every guest and their reply, and the
 * daily views. Built straight from the database for one wedding; there is no authorisation here, callers own that.
 */
const IST = "Asia/Kolkata";
const when = (d: Date | null | undefined) => (d ? new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(d) : "");
const REPLY = { YES: "Coming", NO: "Not coming", MAYBE: "Maybe" } as const;
const INVITE = { NOT_SENT: "Not sent", SENT: "Sent", OPENED: "Opened", RESPONDED: "Replied" } as const;

export async function buildReport(weddingId: string, now = new Date()): Promise<Tab[]> {
  const db = await getDb();
  const [w] = await db.select().from(schema.weddings).where(eq(schema.weddings.id, weddingId));
  const guests = await db
    .select({
      id: schema.guests.id, name: schema.guests.name, phone: schema.guests.phone, email: schema.guests.email, relationship: schema.guests.relationship, group: schema.guestGroups.name,
      invitation: schema.guests.invitationStatus, seats: schema.guests.seats, reply: schema.rsvps.status, attending: schema.rsvps.attendingCount, meal: schema.rsvps.meal, note: schema.rsvps.note, repliedAt: schema.rsvps.respondedAt,
    })
    .from(schema.guests)
    .leftJoin(schema.rsvps, eq(schema.rsvps.guestId, schema.guests.id))
    .leftJoin(schema.guestGroups, eq(schema.guestGroups.id, schema.guests.groupId))
    .where(and(eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)))
    .orderBy(sql`${schema.rsvps.respondedAt} desc nulls last`, asc(schema.guests.name));
  const companions = await db.select({ guestId: schema.guestCompanions.guestId, name: schema.guestCompanions.name }).from(schema.guestCompanions).where(eq(schema.guestCompanions.weddingId, weddingId));
  const withGuest = new Map<string, string[]>();
  for (const c of companions) withGuest.set(c.guestId, [...(withGuest.get(c.guestId) ?? []), c.name]);

  const since = new Date(now.getTime() - 60 * 86400000);
  const views = await db
    .select({ day: sql<string>`to_char(${schema.analyticsEvents.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`, views: sql<number>`count(*) filter (where ${schema.analyticsEvents.type} = 'view')::int`, visitors: sql<number>`count(distinct ${schema.analyticsEvents.visitorId})::int` })
    .from(schema.analyticsEvents)
    .where(and(eq(schema.analyticsEvents.weddingId, weddingId), gte(schema.analyticsEvents.createdAt, since)))
    .groupBy(sql`1`)
    .orderBy(sql`1 desc`);

  const count = (s: string | null) => guests.filter((g) => g.reply === s).length;
  const yes = guests.filter((g) => g.reply === "YES");
  const headcount = yes.reduce((n, g) => n + (g.attending ?? 0), 0);
  const meals = new Map<string, number>();
  for (const g of yes) if (g.meal) meals.set(g.meal, (meals.get(g.meal) ?? 0) + 1);
  const total30 = views.slice(0, 30).reduce((n, v) => n + v.views, 0);

  const summary: Tab = {
    title: "Summary",
    rows: [
      [w?.title || w?.slug || "Invitation"],
      ["Updated", when(now) + " (India time)"],
      ["Invitation link", `${env.appUrl}/invite/${w?.slug ?? ""}`],
      ["Wedding date", w?.weddingDate ?? ""],
      [],
      ["Guests on the list", guests.length],
      ["Replied", guests.filter((g) => g.reply).length],
      ["Coming (Yes)", yes.length],
      ["People coming", headcount],
      ["Maybe", count("MAYBE")],
      ["Not coming (No)", count("NO")],
      ["Not replied yet", guests.filter((g) => !g.reply).length],
      [],
      ["Invitation views, last 30 days", total30],
      ...(meals.size ? [[], ["Meal choices (people replying Yes)"], ...[...meals.entries()].map(([m, n]) => [m, n])] : []),
    ],
  };
  const list: Tab = {
    title: "Guests & replies",
    rows: [
      ["Name", "Phone", "Email", "Relationship", "Group", "Invitation", "Reply", "People coming", "Meal", "Also coming", "Note", "Replied on"],
      ...guests.map((g) => [g.name, g.phone ?? "", g.email ?? "", g.relationship, g.group ?? "", INVITE[g.invitation], g.reply ? REPLY[g.reply] : "Not replied", g.reply === "YES" ? g.attending ?? 0 : "", g.meal ?? "", (withGuest.get(g.id) ?? []).join(", "), g.note ?? "", when(g.repliedAt)]),
    ],
  };
  const daily: Tab = { title: "Daily views", rows: [["Date (India)", "Views", "Visitors"], ...views.map((v) => [v.day, v.views, v.visitors])] };
  return [summary, list, daily];
}
