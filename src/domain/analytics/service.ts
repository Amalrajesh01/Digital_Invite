import { z } from "zod";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { type Actor, requireAdmin, requireWeddingAccess } from "@/domain/auth/access";
import { rateLimit } from "@/domain/platform/rate-limit";
import { canUse } from "@/domain/packages/entitlements";

/**
 * Deliberately non-invasive analytics: a random per-browser id, the section name and a coarse
 * device class. No IP addresses, no fingerprinting, no third-party trackers.
 */
export const TrackInput = z.object({
  visitorId: z.string().regex(/^[a-zA-Z0-9_-]{8,40}$/),
  type: z.enum(["view", "section", "rsvp", "share", "play"]),
  section: z.string().max(40).optional(),
  device: z.enum(["mobile", "tablet", "desktop"]).optional(),
});

export async function track(weddingId: string, guestId: string | null, raw: unknown) {
  const input = TrackInput.parse(raw);
  await rateLimit(`track:${weddingId}:${input.visitorId}`, 120, 3600);
  const db = await getDb();
  await db.insert(schema.analyticsEvents).values({ weddingId, guestId, visitorId: input.visitorId, type: input.type, section: input.section ?? null, device: input.device ?? null });
}

export function deviceFromUserAgent(ua: string | null | undefined): "mobile" | "tablet" | "desktop" {
  const s = (ua ?? "").toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(s) || (/android/.test(s) && !/mobile/.test(s))) return "tablet";
  if (/mobi|iphone|ipod|android/.test(s)) return "mobile";
  return "desktop";
}

export async function weddingAnalytics(actor: Actor | null, weddingId: string, days = 30) {
  const scope = await requireWeddingAccess(actor, weddingId);
  const db = await getDb();
  const since = new Date(Date.now() - days * 86400000);
  const base = and(eq(schema.analyticsEvents.weddingId, weddingId), gte(schema.analyticsEvents.createdAt, since));
  const [views] = await db.select({ views: sql<number>`count(*) filter (where ${schema.analyticsEvents.type} = 'view')::int`, visitors: sql<number>`count(distinct ${schema.analyticsEvents.visitorId})::int` }).from(schema.analyticsEvents).where(base);
  const perDay = await db
    .select({ day: sql<string>`to_char(${schema.analyticsEvents.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`, views: sql<number>`count(*) filter (where ${schema.analyticsEvents.type} = 'view')::int` })
    .from(schema.analyticsEvents)
    .where(base)
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  const advanced = canUse(scope.entitlements, "advanced_analytics");
  const sections = advanced
    ? await db
        .select({ section: schema.analyticsEvents.section, n: sql<number>`count(*)::int` })
        .from(schema.analyticsEvents)
        .where(and(base, eq(schema.analyticsEvents.type, "section")))
        .groupBy(schema.analyticsEvents.section)
        .orderBy(desc(sql`count(*)`))
        .limit(10)
    : [];
  const devices = advanced
    ? await db
        .select({ device: schema.analyticsEvents.device, n: sql<number>`count(distinct ${schema.analyticsEvents.visitorId})::int` })
        .from(schema.analyticsEvents)
        .where(and(base, eq(schema.analyticsEvents.type, "view")))
        .groupBy(schema.analyticsEvents.device)
    : [];
  const [g] = await db.select({ guests: sql<number>`count(*)::int`, responded: sql<number>`count(*) filter (where ${schema.guests.invitationStatus} = 'RESPONDED')::int`, opened: sql<number>`count(*) filter (where ${schema.guests.invitationStatus} in ('OPENED','RESPONDED'))::int` }).from(schema.guests).where(and(eq(schema.guests.weddingId, weddingId), sql`${schema.guests.archivedAt} is null`));
  const [r] = await db.select({ yes: sql<number>`count(*) filter (where ${schema.rsvps.status}='YES')::int`, no: sql<number>`count(*) filter (where ${schema.rsvps.status}='NO')::int`, maybe: sql<number>`count(*) filter (where ${schema.rsvps.status}='MAYBE')::int` }).from(schema.rsvps).where(eq(schema.rsvps.weddingId, weddingId));
  const [u] = await db.select({ uploads: sql<number>`count(*)::int` }).from(schema.mediaAssets).where(and(eq(schema.mediaAssets.weddingId, weddingId), eq(schema.mediaAssets.category, "GUEST_UPLOAD")));
  const [m] = await db.select({ messages: sql<number>`count(*)::int` }).from(schema.guestMessages).where(and(eq(schema.guestMessages.weddingId, weddingId), sql`${schema.guestMessages.kind} <> 'PRIVATE'`));
  const [c] = await db.select({ checkins: sql<number>`count(*)::int` }).from(schema.checkins).where(eq(schema.checkins.weddingId, weddingId));
  const replied = r.yes + r.no + r.maybe;
  return {
    days,
    views: views.views,
    visitors: views.visitors,
    perDay,
    sections,
    devices: devices.map((d) => ({ device: d.device ?? "unknown", n: d.n })),
    guests: g.guests,
    opened: g.opened,
    responded: g.responded,
    rsvp: { yes: r.yes, no: r.no, maybe: r.maybe, pending: Math.max(0, g.guests - replied) },
    rsvpConversion: g.guests ? Math.round((replied / g.guests) * 100) : replied ? 100 : 0,
    uploads: u.uploads,
    messages: m.messages,
    checkins: c.checkins,
    advanced,
  };
}

export async function platformAnalytics(actor: Actor | null) {
  requireAdmin(actor);
  const db = await getDb();
  const [w] = await db.select({ total: sql<number>`count(*)::int`, live: sql<number>`count(*) filter (where ${schema.weddings.status} in ('PUBLISHED','LIVE_EVENT','POST_EVENT','MEMORY','ANNIVERSARY') and ${schema.weddings.archivedAt} is null)::int`, drafts: sql<number>`count(*) filter (where ${schema.weddings.status} in ('DRAFT','PREVIEW') and ${schema.weddings.archivedAt} is null)::int` }).from(schema.weddings);
  const [v] = await db.select({ views: sql<number>`count(*) filter (where ${schema.analyticsEvents.type}='view')::int`, visitors: sql<number>`count(distinct ${schema.analyticsEvents.visitorId})::int` }).from(schema.analyticsEvents).where(gte(schema.analyticsEvents.createdAt, new Date(Date.now() - 30 * 86400000)));
  const [g] = await db.select({ guests: sql<number>`count(*)::int` }).from(schema.guests).where(sql`${schema.guests.archivedAt} is null`);
  const [r] = await db.select({ replies: sql<number>`count(*)::int` }).from(schema.rsvps);
  const [ci] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.checkins);
  const [up] = await db.select({ n: sql<number>`count(*)::int`, pending: sql<number>`count(*) filter (where ${schema.mediaAssets.moderation}='PENDING')::int` }).from(schema.mediaAssets).where(eq(schema.mediaAssets.category, "GUEST_UPLOAD"));
  const [msg] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.guestMessages);
  const byPackage = await db.select({ pkg: schema.weddings.packageKey, n: sql<number>`count(*)::int` }).from(schema.weddings).where(sql`${schema.weddings.archivedAt} is null`).groupBy(schema.weddings.packageKey);
  const errors = await db.select({ n: sql<number>`count(*)::int` }).from(schema.systemEvents).where(and(eq(schema.systemEvents.level, "ERROR"), gte(schema.systemEvents.createdAt, new Date(Date.now() - 7 * 86400000))));
  return { weddings: w, views30: v.views, visitors30: v.visitors, guests: g.guests, rsvpReplies: r.replies, checkins: ci.n, guestUploads: up.n, pendingUploads: up.pending, guestbook: msg.n, byPackage, errors7: errors[0].n };
}
