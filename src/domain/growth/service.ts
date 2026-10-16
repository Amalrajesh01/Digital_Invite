import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { invalid, forbidden } from "@/lib/errors";
import { rateLimit } from "@/domain/platform/rate-limit";
import type { Actor } from "@/domain/auth/access";

/**
 * Growth: what visitors do on the public site, what they ask us for, and where they drop out.
 *
 * Privacy, as for invitations: a random per-browser id, no IP address, no fingerprint and nothing personal in an event.
 * A person's name and number exist only in a *lead* they chose to send us, and only the studio can read it.
 */
export const EVENT_TYPES = ["page_view", "design_view", "preview_open", "cta_click", "enquiry_start", "enquiry_sent", "whatsapp_click", "gift_start", "gift_step", "gift_saved", "gift_sent"] as const;
export type SiteEventType = (typeof EVENT_TYPES)[number];

const clean = (s: unknown, max: number) => String(s ?? "").replace(/[\u0000-\u001f]/g, "").slice(0, max);

export async function recordEvent(input: { visitorId: string; type: string; path?: string; ref?: string; device?: string; source?: string }) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(input.visitorId)) throw invalid("Bad request.");
  if (!(EVENT_TYPES as readonly string[]).includes(input.type)) throw invalid("Bad request.");
  await rateLimit(`site-ev:${input.visitorId}`, 240, 3600);
  const db = await getDb();
  await db.insert(schema.siteEvents).values({
    visitorId: input.visitorId, type: input.type, path: clean(input.path, 200), ref: clean(input.ref, 80), device: ["mobile", "tablet", "desktop"].includes(input.device ?? "") ? input.device! : "", source: clean(input.source, 60),
  });
}

// ── enquiries ──────────────────────────────────────────────────────────────
export interface EnquiryInput { name: string; phone: string; occasion?: string; templateSlug?: string; eventDate?: string; message?: string; visitorId?: string; source?: string; ipKey: string }

export async function createEnquiry(input: EnquiryInput) {
  await rateLimit(`enquiry:${input.ipKey}`, 6, 3600);
  const name = clean(input.name, 80).trim();
  const phone = clean(input.phone, 24).replace(/[^\d+]/g, "");
  if (!name) throw invalid("Please tell us your name.", { name: "Required" });
  if (phone.replace(/\D/g, "").length < 8) throw invalid("Please enter the WhatsApp number we can reach you on.", { phone: "Enter a valid number" });
  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(input.eventDate ?? "") ? input.eventDate! : null;
  const db = await getDb();
  const [lead] = await db
    .insert(schema.leads)
    .values({ kind: "ENQUIRY", name, phone, occasion: clean(input.occasion, 40), templateSlug: clean(input.templateSlug, 60), eventDate, message: clean(input.message, 600), source: clean(input.source, 60), visitorId: clean(input.visitorId, 40) })
    .returning({ id: schema.leads.id });
  if (input.visitorId && /^[A-Za-z0-9_-]{8,40}$/.test(input.visitorId)) await db.insert(schema.siteEvents).values({ visitorId: input.visitorId, type: "enquiry_sent", ref: clean(input.templateSlug || input.occasion, 80), path: "/start" });
  return { id: lead.id, ref: lead.id.slice(0, 8).toUpperCase() };
}

// ── the studio ─────────────────────────────────────────────────────────────
function needAdmin(actor: Actor | null) {
  if (!actor || actor.kind !== "admin") throw forbidden("Only the platform owner can do this.");
}

export async function listLeads(actor: Actor | null) {
  needAdmin(actor);
  const db = await getDb();
  return db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(300);
}

export async function updateLead(actor: Actor | null, id: string, patch: { status?: "NEW" | "CONTACTED" | "QUOTED" | "WON" | "LOST"; notes?: string; orderId?: string | null }) {
  needAdmin(actor);
  const db = await getDb();
  await db.update(schema.leads).set({ ...(patch.status ? { status: patch.status } : {}), ...(patch.notes !== undefined ? { notes: clean(patch.notes, 1000) } : {}), ...(patch.orderId !== undefined ? { orderId: patch.orderId } : {}), updatedAt: new Date() }).where(eq(schema.leads.id, id));
}

export interface FunnelStage { key: string; label: string; count: number; ofPrevious: number | null; ofVisitors: number | null }
export interface FunnelReport {
  days: number;
  stages: FunnelStage[];
  paid: number;
  revenueInr: number;
  byTemplate: { ref: string; views: number; previews: number; enquiries: number }[];
  bySource: { source: string; visitors: number; enquiries: number }[];
  daily: { day: string; visitors: number; enquiries: number }[];
  hasData: boolean;
}

/** Visitors → designs seen → previews opened → enquiries → paid orders, over the last `days` days. Counts only; no guessing. */
export async function funnelReport(actor: Actor | null, days = 30): Promise<FunnelReport> {
  needAdmin(actor);
  const db = await getDb();
  const since = new Date(Date.now() - days * 86_400_000);
  const uniq = async (types: string[]) => {
    const [r] = await db.select({ n: sql<number>`count(distinct ${schema.siteEvents.visitorId})::int` }).from(schema.siteEvents).where(and(gte(schema.siteEvents.at, since), sql`${schema.siteEvents.type} in (${sql.join(types.map((t) => sql`${t}`), sql`, `)})`));
    return r?.n ?? 0;
  };
  const visitors = await uniq(["page_view"]);
  const designs = await uniq(["design_view"]);
  const previews = await uniq(["preview_open"]);
  const intent = await uniq(["enquiry_start", "whatsapp_click", "gift_start"]);
  const [lead] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.leads).where(gte(schema.leads.createdAt, since));
  const [won] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.leads).where(and(gte(schema.leads.createdAt, since), eq(schema.leads.status, "WON")));
  const [pay] = await db.select({ n: sql<number>`count(*)::int`, sum: sql<number>`coalesce(sum(${schema.orders.amountInr}),0)::int` }).from(schema.orders).where(and(gte(schema.orders.paidAt, since), eq(schema.orders.status, "PAID")));
  const raw: [string, string, number][] = [["visitors", "Visited the site", visitors], ["designs", "Looked at a design", designs], ["previews", "Opened a sample", previews], ["intent", "Started to ask or chat", intent], ["leads", "Sent us an enquiry or a gift", lead?.n ?? 0], ["paid", "Paid", pay?.n ?? 0]];
  const stages = raw.map(([key, label, count], i) => ({ key, label, count, ofPrevious: i && raw[i - 1][2] ? Math.round((count / raw[i - 1][2]) * 1000) / 10 : null, ofVisitors: i && visitors ? Math.round((count / visitors) * 1000) / 10 : null }));

  const byTemplateRows = await db.execute<{ ref: string; views: number; previews: number; enquiries: number }>(sql`
    select ref,
      count(distinct visitor_id) filter (where type = 'design_view')::int as views,
      count(distinct visitor_id) filter (where type = 'preview_open')::int as previews,
      count(*) filter (where type = 'enquiry_sent')::int as enquiries
    from site_events where at >= ${since} and ref <> '' and type in ('design_view','preview_open','enquiry_sent')
    group by ref order by views desc, enquiries desc limit 15`);
  const bySourceRows = await db.execute<{ source: string; visitors: number; enquiries: number }>(sql`
    select coalesce(nullif(source,''),'direct') as source, count(distinct visitor_id)::int as visitors,
      count(distinct visitor_id) filter (where type = 'enquiry_sent')::int as enquiries
    from site_events where at >= ${since} group by 1 order by visitors desc limit 12`);
  // days follow the product's day boundary (India), not the server's
  const dailyRows = await db.execute<{ day: string; visitors: number; enquiries: number }>(sql`
    select to_char((at at time zone 'Asia/Kolkata')::date, 'YYYY-MM-DD') as day, count(distinct visitor_id)::int as visitors,
      count(*) filter (where type = 'enquiry_sent')::int as enquiries
    from site_events where at >= ${since} group by 1 order by 1`);
  const rows = <T,>(r: unknown): T[] => ((r as { rows?: T[] }).rows ?? (r as T[])) as T[];
  void won;
  return {
    days, stages, paid: pay?.n ?? 0, revenueInr: pay?.sum ?? 0, byTemplate: rows(byTemplateRows), bySource: rows(bySourceRows), daily: rows(dailyRows), hasData: visitors > 0 || (lead?.n ?? 0) > 0,
  };
}
