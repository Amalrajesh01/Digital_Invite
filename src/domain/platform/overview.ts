import { and, desc, eq, gte, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { type Actor, requireAdmin } from "@/domain/auth/access";

const clean = (q: string) => q.trim().replace(/[%_\\]/g, "");
const like = (q: string) => `%${clean(q)}%`;

/** Storage and moderation totals per wedding, for the platform-wide media page. */
export async function mediaByWedding(actor: Actor | null) {
  requireAdmin(actor);
  const db = await getDb();
  const rows = await db
    .select({
      weddingId: schema.weddings.id,
      title: schema.weddings.title,
      slug: schema.weddings.slug,
      files: sql<number>`count(${schema.mediaAssets.id})::int`,
      images: sql<number>`count(*) filter (where ${schema.mediaAssets.kind} = 'IMAGE')::int`,
      videos: sql<number>`count(*) filter (where ${schema.mediaAssets.kind} = 'VIDEO')::int`,
      audio: sql<number>`count(*) filter (where ${schema.mediaAssets.kind} = 'AUDIO')::int`,
      guestUploads: sql<number>`count(*) filter (where ${schema.mediaAssets.category} = 'GUEST_UPLOAD')::int`,
      pending: sql<number>`count(*) filter (where ${schema.mediaAssets.moderation} = 'PENDING')::int`,
      permanent: sql<number>`count(*) filter (where ${schema.mediaAssets.retention} = 'PERMANENT')::int`,
      bytes: sql<number>`coalesce(sum(${schema.mediaAssets.sizeBytes}), 0)::bigint::float8`,
    })
    .from(schema.weddings)
    .leftJoin(schema.mediaAssets, eq(schema.mediaAssets.weddingId, schema.weddings.id))
    .where(isNull(schema.weddings.archivedAt))
    .groupBy(schema.weddings.id)
    .orderBy(desc(sql`coalesce(sum(${schema.mediaAssets.sizeBytes}), 0)`));
  return rows;
}

/** Search every guest on the platform — for "which wedding was Mr Nair invited to?" moments. */
export type GuestReply = "YES" | "NO" | "MAYBE" | "NONE";

/** The weddings to choose from in the guest filter. */
export async function weddingChoices(actor: Actor | null) {
  requireAdmin(actor);
  const db = await getDb();
  return db.select({ id: schema.weddings.id, title: schema.weddings.title, slug: schema.weddings.slug }).from(schema.weddings).where(isNull(schema.weddings.archivedAt)).orderBy(schema.weddings.title);
}

/**
 * Guests across every wedding, filtered by wedding (the event), by how they replied (Yes / No / Maybe / not yet) and by a search
 * of name, phone or email. `summary` counts the same guests whatever the reply filter, so the numbers above the list stay put.
 */
export async function searchGuestsAcrossWeddings(actor: Actor | null, q: string, opts: { limit?: number; weddingId?: string; reply?: GuestReply } = {}) {
  requireAdmin(actor);
  const limit = opts.limit ?? 100;
  const db = await getDb();
  const s = q.trim();
  const empty = { rows: [], total: 0, matching: 0, summary: { YES: 0, NO: 0, MAYBE: 0, NONE: 0, headcount: 0 } };
  // A query made only of wildcard characters must not match everyone.
  if (s && !clean(s)) return empty;
  const base = and(
    isNull(schema.guests.archivedAt),
    opts.weddingId ? eq(schema.guests.weddingId, opts.weddingId) : undefined,
    s ? or(ilike(schema.guests.name, like(s)), ilike(schema.guests.email, like(s)), ilike(schema.guests.phone, like(s))) : undefined,
  );
  const replyFilter = opts.reply === "NONE" ? isNull(schema.rsvps.status) : opts.reply ? eq(schema.rsvps.status, opts.reply) : undefined;
  const rows = await db
    .select({
      id: schema.guests.id,
      name: schema.guests.name,
      email: schema.guests.email,
      phone: schema.guests.phone,
      invitationStatus: schema.guests.invitationStatus,
      weddingId: schema.weddings.id,
      weddingTitle: schema.weddings.title,
      rsvp: schema.rsvps.status,
      attending: schema.rsvps.attendingCount,
    })
    .from(schema.guests)
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.guests.weddingId))
    .leftJoin(schema.rsvps, eq(schema.rsvps.guestId, schema.guests.id))
    .where(and(base, replyFilter))
    .orderBy(schema.weddings.title, schema.guests.name)
    .limit(limit);
  const grouped = await db
    .select({ status: schema.rsvps.status, n: sql<number>`count(*)::int`, people: sql<number>`coalesce(sum(${schema.rsvps.attendingCount}), 0)::int` })
    .from(schema.guests)
    .leftJoin(schema.rsvps, eq(schema.rsvps.guestId, schema.guests.id))
    .where(base)
    .groupBy(schema.rsvps.status);
  const summary = { YES: 0, NO: 0, MAYBE: 0, NONE: 0, headcount: 0 };
  for (const g of grouped) {
    summary[g.status ?? "NONE"] += g.n;
    if (g.status === "YES") summary.headcount = g.people;
  }
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.guests).where(isNull(schema.guests.archivedAt));
  const matching = opts.reply ? (opts.reply === "NONE" ? summary.NONE : summary[opts.reply]) : summary.YES + summary.NO + summary.MAYBE + summary.NONE;
  return { rows, total, matching, summary };
}

/** Per-wedding headline numbers for the analytics table. */
export async function analyticsByWedding(actor: Actor | null, days = 30) {
  requireAdmin(actor);
  const db = await getDb();
  const since = new Date(Date.now() - days * 86400000);
  const rows = await db
    .select({
      weddingId: schema.weddings.id,
      title: schema.weddings.title,
      slug: schema.weddings.slug,
      status: schema.weddings.status,
      views: sql<number>`count(*) filter (where ${schema.analyticsEvents.type} = 'view')::int`,
      visitors: sql<number>`count(distinct ${schema.analyticsEvents.visitorId})::int`,
    })
    .from(schema.weddings)
    .leftJoin(schema.analyticsEvents, and(eq(schema.analyticsEvents.weddingId, schema.weddings.id), gte(schema.analyticsEvents.createdAt, since)))
    .where(isNull(schema.weddings.archivedAt))
    .groupBy(schema.weddings.id)
    .orderBy(desc(sql`count(*) filter (where ${schema.analyticsEvents.type} = 'view')`));
  return rows;
}

/** Views per day across the whole platform, for the trend chart. */
export async function platformViewsPerDay(actor: Actor | null, days = 30) {
  requireAdmin(actor);
  const db = await getDb();
  const since = new Date(Date.now() - days * 86400000);
  return db
    .select({ day: sql<string>`to_char(${schema.analyticsEvents.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`, views: sql<number>`count(*)::int` })
    .from(schema.analyticsEvents)
    .where(and(eq(schema.analyticsEvents.type, "view"), gte(schema.analyticsEvents.createdAt, since)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
}
