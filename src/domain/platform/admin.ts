import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { type Actor, requireAdmin } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { invalid, notFound } from "@/lib/errors";
import { listWeddings } from "@/domain/wedding/service";
import { platformAnalytics } from "@/domain/analytics/service";
import { daysBetween, todayInZone } from "@/lib/time";

/** Everything that needs the platform owner's attention, in priority order. */
export async function adminDashboard(actor: Actor | null) {
  requireAdmin(actor);
  const db = await getDb();
  const weddings = await listWeddings(actor);
  const stats = await platformAnalytics(actor);

  const pendingMedia = await db
    .select({ weddingId: schema.mediaAssets.weddingId, n: sql<number>`count(*)::int` })
    .from(schema.mediaAssets)
    .where(and(eq(schema.mediaAssets.moderation, "PENDING"), eq(schema.mediaAssets.category, "GUEST_UPLOAD")))
    .groupBy(schema.mediaAssets.weddingId);
  const pendingMsgs = await db
    .select({ weddingId: schema.guestMessages.weddingId, n: sql<number>`count(*)::int` })
    .from(schema.guestMessages)
    .where(and(eq(schema.guestMessages.moderation, "PENDING"), inArray(schema.guestMessages.kind, ["WISH", "SHOUTOUT"])))
    .groupBy(schema.guestMessages.weddingId);
  const failedMail = await db.select({ n: sql<number>`count(*)::int` }).from(schema.notifications).where(and(eq(schema.notifications.status, "FAILED"), gte(schema.notifications.createdAt, new Date(Date.now() - 7 * 86400000))));
  const recentErrors = await db
    .select({ e: schema.systemEvents, title: schema.weddings.title })
    .from(schema.systemEvents)
    .leftJoin(schema.weddings, eq(schema.weddings.id, schema.systemEvents.weddingId))
    .where(and(inArray(schema.systemEvents.level, ["ERROR", "WARN"]), gte(schema.systemEvents.createdAt, new Date(Date.now() - 3 * 86400000))))
    .orderBy(desc(schema.systemEvents.createdAt))
    .limit(6);
  const activity = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(10);

  const attention: { id: string; tone: "warn" | "bad" | "info"; title: string; detail: string; href: string }[] = [];
  const title = (id: string) => weddings.find((w) => w.id === id)?.title || "A wedding";
  for (const p of pendingMedia) attention.push({ id: `m${p.weddingId}`, tone: "warn", title: `${p.n} guest photo${p.n === 1 ? "" : "s"} waiting`, detail: title(p.weddingId), href: `/admin/weddings/${p.weddingId}/photos` });
  for (const p of pendingMsgs) attention.push({ id: `w${p.weddingId}`, tone: "warn", title: `${p.n} wish${p.n === 1 ? "" : "es"} waiting for approval`, detail: title(p.weddingId), href: `/admin/weddings/${p.weddingId}/wishes` });
  for (const w of weddings) {
    if (w.weddingDate && (w.status === "DRAFT" || w.status === "PREVIEW")) {
      const d = daysBetween(todayInZone("Asia/Kolkata"), w.weddingDate);
      if (d >= 0 && d <= 30) attention.push({ id: `d${w.id}`, tone: d <= 10 ? "bad" : "warn", title: `Wedding in ${d} day${d === 1 ? "" : "s"} — still a draft`, detail: w.title || w.slug, href: `/admin/weddings/${w.id}` });
    }
  }
  if (failedMail[0].n) attention.push({ id: "mail", tone: "bad", title: `${failedMail[0].n} email${failedMail[0].n === 1 ? "" : "s"} failed to send`, detail: "Last 7 days", href: "/admin/notifications" });
  if (stats.errors7) attention.push({ id: "err", tone: "bad", title: `${stats.errors7} system error${stats.errors7 === 1 ? "" : "s"} this week`, detail: "See the audit & error log", href: "/admin/audit?tab=errors" });

  const upcoming = weddings
    .filter((w) => w.weddingDate && daysBetween(todayInZone("Asia/Kolkata"), w.weddingDate) >= -1)
    .sort((a, b) => (a.weddingDate! < b.weddingDate! ? -1 : 1))
    .slice(0, 6);
  return { stats, attention, recentErrors: recentErrors.map((r) => ({ ...r.e, weddingTitle: r.title })), activity, upcoming, weddings };
}

export async function listAuditLogs(actor: Actor | null, opts: { weddingId?: string; q?: string; limit?: number } = {}) {
  requireAdmin(actor);
  const db = await getDb();
  const conds = [];
  if (opts.weddingId) conds.push(eq(schema.auditLogs.weddingId, opts.weddingId));
  if (opts.q?.trim()) conds.push(sql`${schema.auditLogs.action} ilike ${"%" + opts.q.trim().replace(/[%_]/g, "") + "%"} or ${schema.auditLogs.actorLabel} ilike ${"%" + opts.q.trim().replace(/[%_]/g, "") + "%"}`);
  return db
    .select({ log: schema.auditLogs, wedding: schema.weddings.title })
    .from(schema.auditLogs)
    .leftJoin(schema.weddings, eq(schema.weddings.id, schema.auditLogs.weddingId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(Math.min(opts.limit ?? 150, 500));
}

export async function listSystemEvents(actor: Actor | null, opts: { level?: "INFO" | "WARN" | "ERROR"; weddingId?: string; limit?: number } = {}) {
  requireAdmin(actor);
  const db = await getDb();
  const conds = [];
  if (opts.level) conds.push(eq(schema.systemEvents.level, opts.level));
  if (opts.weddingId) conds.push(eq(schema.systemEvents.weddingId, opts.weddingId));
  return db
    .select({ e: schema.systemEvents, wedding: schema.weddings.title, slug: schema.weddings.slug })
    .from(schema.systemEvents)
    .leftJoin(schema.weddings, eq(schema.weddings.id, schema.systemEvents.weddingId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.systemEvents.createdAt))
    .limit(Math.min(opts.limit ?? 150, 500));
}

// ── orders ─────────────────────────────────────────────────────────────────
export async function listOrders(actor: Actor | null) {
  requireAdmin(actor);
  const db = await getDb();
  return db
    .select({ order: schema.orders, wedding: schema.weddings.title, slug: schema.weddings.slug })
    .from(schema.orders)
    .leftJoin(schema.weddings, eq(schema.weddings.id, schema.orders.weddingId))
    .orderBy(desc(schema.orders.createdAt));
}

export async function saveOrder(
  actor: Actor | null,
  input: { id?: string; customerName: string; customerContact?: string; packageKey: "ESSENTIAL" | "SIGNATURE" | "LUXURY"; amountInr: number; status: "QUOTED" | "PAID" | "FREE_PORTFOLIO" | "REFUNDED" | "CANCELLED"; notes?: string; weddingId?: string | null },
) {
  const admin = requireAdmin(actor);
  if (!input.customerName.trim()) throw invalid("Enter the customer's name.", { customerName: "Required" });
  if (!Number.isFinite(input.amountInr) || input.amountInr < 0) throw invalid("Enter a valid amount.", { amountInr: "Invalid" });
  const db = await getDb();
  const values = {
    customerName: input.customerName.trim(),
    customerContact: input.customerContact?.trim() ?? "",
    packageKey: input.packageKey,
    amountInr: Math.round(input.amountInr),
    status: input.status,
    notes: input.notes?.trim() ?? "",
    weddingId: input.weddingId ?? null,
    paidAt: input.status === "PAID" ? new Date() : null,
    updatedAt: new Date(),
  };
  if (input.id) {
    const [row] = await db.update(schema.orders).set(values).where(eq(schema.orders.id, input.id)).returning();
    if (!row) throw notFound("Order not found.");
    await audit(admin, "order.updated", { entityType: "order", entityId: row.id });
    return row;
  }
  const [row] = await db.insert(schema.orders).values(values).returning();
  await audit(admin, "order.created", { entityType: "order", entityId: row.id });
  return row;
}

export async function deleteOrder(actor: Actor | null, id: string) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  await db.delete(schema.orders).where(eq(schema.orders.id, id));
  await audit(admin, "order.deleted", { entityType: "order", entityId: id });
}

// ── domains ────────────────────────────────────────────────────────────────
export async function listDomains(actor: Actor | null) {
  requireAdmin(actor);
  const db = await getDb();
  return db
    .select({ d: schema.domains, title: schema.weddings.title, slug: schema.weddings.slug })
    .from(schema.domains)
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.domains.weddingId))
    .orderBy(desc(schema.domains.createdAt));
}

const HOST = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
export async function addDomain(actor: Actor | null, weddingId: string, hostname: string) {
  const admin = requireAdmin(actor);
  const h = hostname.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!HOST.test(h)) throw invalid("Enter a valid domain such as anjali-and-sid.com or wedding.example.com.", { hostname: "Invalid domain" });
  const db = await getDb();
  const [dupe] = await db.select({ id: schema.domains.id }).from(schema.domains).where(sql`lower(${schema.domains.hostname}) = ${h}`);
  if (dupe) throw invalid("That domain is already connected to a wedding.", { hostname: "Already in use" });
  const [row] = await db.insert(schema.domains).values({ weddingId, hostname: h, isPrimary: false }).returning();
  await audit(admin, "domain.added", { weddingId, entityType: "domain", entityId: row.id, metadata: { hostname: h } });
  return row;
}

export async function removeDomain(actor: Actor | null, id: string) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  await db.delete(schema.domains).where(eq(schema.domains.id, id));
  await audit(admin, "domain.removed", { entityType: "domain", entityId: id });
}

export async function setDomainVerified(actor: Actor | null, id: string, verified: boolean) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  await db.update(schema.domains).set({ verifiedAt: verified ? new Date() : null }).where(eq(schema.domains.id, id));
  await audit(admin, verified ? "domain.verified" : "domain.unverified", { entityType: "domain", entityId: id });
}

export async function domainForHost(hostname: string): Promise<string | null> {
  const db = await getDb();
  const [row] = await db
    .select({ slug: schema.weddings.slug })
    .from(schema.domains)
    .innerJoin(schema.weddings, eq(schema.weddings.id, schema.domains.weddingId))
    .where(and(sql`lower(${schema.domains.hostname}) = ${hostname.toLowerCase()}`, sql`${schema.domains.verifiedAt} is not null`, isNull(schema.weddings.archivedAt)));
  return row?.slug ?? null;
}
