import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
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
export async function searchGuestsAcrossWeddings(actor: Actor | null, q: string, limit = 100) {
  requireAdmin(actor);
  const db = await getDb();
  const s = q.trim();
  // A query made only of wildcard characters must not match everyone.
  if (s && !clean(s)) return { rows: [], total: 0 };
  const where = and(
    isNull(schema.guests.archivedAt),
    s ? or(ilike(schema.guests.name, like(s)), ilike(schema.guests.email, like(s)), ilike(schema.guests.phone, like(s))) : undefined,
  );
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
    })
    .from(schema.guests)
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.guests.weddingId))
    .leftJoin(schema.rsvps, eq(schema.rsvps.guestId, schema.guests.id))
    .where(where)
    .orderBy(schema.weddings.title, schema.guests.name)
    .limit(limit);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.guests).where(isNull(schema.guests.archivedAt));
  return { rows, total };
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
    .leftJoin(schema.analyticsEvents, and(eq(schema.analyticsEvents.weddingId, schema.weddings.id), sql`${schema.analyticsEvents.createdAt} >= ${since}`))
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
    .where(and(eq(schema.analyticsEvents.type, "view"), sql`${schema.analyticsEvents.createdAt} >= ${since}`))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
}
