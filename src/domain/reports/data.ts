import { and, asc, eq, gte, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { env } from "@/lib/env";

/**
 * What the owner reads in the daily report: the headline numbers, who replied in the last 24 hours, every guest grouped by
 * reply, and the invitation's views. Built straight from the database for one wedding; there is no authorisation here,
 * callers own that.
 */
export const IST = "Asia/Kolkata";
export type Reply = "YES" | "NO" | "MAYBE";

export interface ReportGuest { name: string; reply: Reply | null; people: number | null; meal: string; also: string; note: string; repliedAt: Date | null }
export interface ReportData {
  title: string;
  slug: string;
  link: string;
  weddingDate: string | null;
  generatedAt: Date;
  totals: { guests: number; replied: number; yes: number; people: number; maybe: number; no: number; pending: number };
  /** Replied in the 24 hours before generatedAt, newest first. */
  recent: ReportGuest[];
  meals: { meal: string; count: number }[];
  /** The last 14 days (India time), oldest first, days with no views are 0. */
  views: { day: string; views: number }[];
  views30: number;
  visitors30: number;
  /** Coming, then maybe, then not coming, then not replied; by name inside each. */
  guests: ReportGuest[];
}

const RANK: Record<string, number> = { YES: 0, MAYBE: 1, NO: 2, NONE: 3 };
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export async function buildReportData(weddingId: string, now = new Date()): Promise<ReportData> {
  const db = await getDb();
  const [w] = await db.select().from(schema.weddings).where(eq(schema.weddings.id, weddingId));
  const rows = await db
    .select({ id: schema.guests.id, name: schema.guests.name, reply: schema.rsvps.status, attending: schema.rsvps.attendingCount, meal: schema.rsvps.meal, note: schema.rsvps.note, repliedAt: schema.rsvps.respondedAt })
    .from(schema.guests)
    .leftJoin(schema.rsvps, eq(schema.rsvps.guestId, schema.guests.id))
    .where(and(eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)))
    .orderBy(asc(schema.guests.name));
  const companions = await db.select({ guestId: schema.guestCompanions.guestId, name: schema.guestCompanions.name }).from(schema.guestCompanions).where(eq(schema.guestCompanions.weddingId, weddingId));
  const withGuest = new Map<string, string[]>();
  for (const c of companions) withGuest.set(c.guestId, [...(withGuest.get(c.guestId) ?? []), c.name]);

  const guests: ReportGuest[] = rows
    .map((g) => ({ name: g.name, reply: g.reply, people: g.reply === "YES" ? g.attending ?? 0 : null, meal: g.meal ?? "", also: (withGuest.get(g.id) ?? []).join(", "), note: g.note ?? "", repliedAt: g.repliedAt ?? null }))
    .sort((a, b) => RANK[a.reply ?? "NONE"] - RANK[b.reply ?? "NONE"] || a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

  const dayAgo = now.getTime() - 86400000;
  const recent = guests.filter((g) => g.repliedAt && g.repliedAt.getTime() > dayAgo && g.repliedAt.getTime() <= now.getTime()).sort((a, b) => b.repliedAt!.getTime() - a.repliedAt!.getTime());
  const yes = guests.filter((g) => g.reply === "YES");
  const meals = new Map<string, number>();
  for (const g of yes) if (g.meal) meals.set(g.meal, (meals.get(g.meal) ?? 0) + 1);

  const since = new Date(now.getTime() - 30 * 86400000);
  const where = and(eq(schema.analyticsEvents.weddingId, weddingId), eq(schema.analyticsEvents.type, "view"), gte(schema.analyticsEvents.createdAt, since));
  const perDay = await db
    .select({ day: sql<string>`to_char(${schema.analyticsEvents.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`, views: sql<number>`count(*)::int` })
    .from(schema.analyticsEvents)
    .where(where)
    .groupBy(sql`1`);
  const [{ visitors }] = await db.select({ visitors: sql<number>`count(distinct ${schema.analyticsEvents.visitorId})::int` }).from(schema.analyticsEvents).where(where);
  const byDay = new Map(perDay.map((d) => [d.day, d.views]));
  const views = Array.from({ length: 14 }, (_, i) => { const day = dayKey(new Date(now.getTime() - (13 - i) * 86400000)); return { day, views: byDay.get(day) ?? 0 }; });

  return {
    title: w?.title || w?.slug || "Invitation",
    slug: w?.slug ?? "",
    link: `${env.appUrl}/invite/${w?.slug ?? ""}`,
    weddingDate: w?.weddingDate ?? null,
    generatedAt: now,
    totals: { guests: guests.length, replied: guests.filter((g) => g.reply).length, yes: yes.length, people: yes.reduce((n, g) => n + (g.people ?? 0), 0), maybe: guests.filter((g) => g.reply === "MAYBE").length, no: guests.filter((g) => g.reply === "NO").length, pending: guests.filter((g) => !g.reply).length },
    recent,
    meals: [...meals.entries()].map(([meal, count]) => ({ meal, count })).sort((a, b) => b.count - a.count),
    views,
    views30: perDay.reduce((n, d) => n + d.views, 0),
    visitors30: visitors,
    guests,
  };
}
