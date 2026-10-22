import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { invalid, notFound } from "@/lib/errors";
import { type Actor, requireAdmin } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { PUBLIC_STATUSES } from "@/domain/doc/constants";
import { categoryBySlug } from "@/domain/catalogue/categories";
import { siteTemplateBySlug } from "@/domain/catalogue/templates";
import { toResolved } from "@/domain/media/service";

/**
 * The public portfolio wall. What a visitor can ever see is decided HERE, on the server, in one query (`PUBLIC_WHERE`):
 *
 *   · only items the studio has published (status PUBLISHED); everything else is invisible to every public route, the listing API and the sitemap;
 *   · an item that stands for a customer's real invitation additionally needs that customer's consent recorded on the item;
 *     a sample invitation (`is_demo`) and a pure template showcase (no invitation at all) need none;
 *   · the card is made only of what is written on the item (title, description, city), the template's name and an approved cover.
 *     Names, dates, guests and everything else in the invitation are never read — and the live invitation is offered only when
 *     the studio switched that on, consent exists, and the invitation is itself published.
 */
export interface PortfolioCard {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryName: string;
  templateSlug: string;
  templateName: string;
  styleLabel: string;
  city: string;
  cover: { src: string; srcSet?: string; alt: string; width?: number; height?: number };
  /** Where "see it live" goes, or null. */
  liveHref: string | null;
}

const PUBLIC_WHERE = and(
  eq(schema.portfolioItems.status, "PUBLISHED"),
  sql`(${schema.portfolioItems.weddingId} is null or ${schema.weddings.isDemo} = true or ${schema.portfolioItems.consent} = true)`,
);

const live = (w: { status: string; publishedVersionId: string | null; archivedAt: Date | null } | null) =>
  !!w && !!w.publishedVersionId && (PUBLIC_STATUSES as readonly string[]).includes(w.status) && !w.archivedAt;

async function rows(where: ReturnType<typeof and>) {
  const db = await getDb();
  return db
    .select({ item: schema.portfolioItems, wedding: { slug: schema.weddings.slug, isDemo: schema.weddings.isDemo, status: schema.weddings.status, publishedVersionId: schema.weddings.publishedVersionId, archivedAt: schema.weddings.archivedAt }, cover: schema.mediaAssets })
    .from(schema.portfolioItems)
    .leftJoin(schema.weddings, eq(schema.weddings.id, schema.portfolioItems.weddingId))
    .leftJoin(schema.mediaAssets, eq(schema.mediaAssets.id, schema.portfolioItems.coverAssetId))
    .where(where)
    .orderBy(asc(schema.portfolioItems.sortOrder), desc(schema.portfolioItems.createdAt));
}

type Row = Awaited<ReturnType<typeof rows>>[number];

function toCard(r: Row): PortfolioCard {
  const i = r.item;
  const tpl = siteTemplateBySlug(i.templateSlug);
  const w = r.wedding && r.wedding.slug ? r.wedding : null;
  const hasWedding = !!i.weddingId && !!w;
  const consented = !hasWedding || w!.isDemo || i.consent;
  const wedLive = hasWedding && live(w);
  // an approved photograph of the invitation, only while that invitation is live (the media route would refuse it otherwise)
  const asset = r.cover && r.cover.kind === "IMAGE" && r.cover.visibility === "PUBLIC" && r.cover.moderation === "APPROVED" && !r.cover.archivedAt && (wedLive || !hasWedding) ? toResolved(r.cover) : null;
  const cover = asset ? { src: asset.url, srcSet: asset.srcSet, alt: i.title, width: asset.width, height: asset.height } : { src: tpl?.thumb ?? "/templates/royal-heritage.webp", alt: tpl ? `The ${tpl.name} design` : i.title };
  return {
    slug: i.slug, title: i.title, description: i.description, category: i.category, categoryName: categoryBySlug(i.category as never)?.name ?? i.category,
    templateSlug: i.templateSlug, templateName: tpl?.name ?? "", styleLabel: tpl?.styleLabel ?? "", city: i.city, cover,
    liveHref: !i.showLive ? null : hasWedding ? (consented && wedLive ? `/invite/${w!.slug}` : null) : tpl ? tpl.path : null,
  };
}

/** The published portfolio, in the studio's order. This is the only thing the public site, the listing API and the sitemap read. */
export async function listPublicPortfolio(limit = 60): Promise<PortfolioCard[]> {
  return (await rows(PUBLIC_WHERE)).slice(0, limit).map(toCard);
}

export async function publicPortfolioItem(slug: string): Promise<PortfolioCard | null> {
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) return null;
  const r = (await rows(and(PUBLIC_WHERE, eq(schema.portfolioItems.slug, slug))))[0];
  return r ? toCard(r) : null;
}

// ── the studio ───────────────────────────────────────────────────────────

export interface PortfolioInput {
  id?: string;
  title: string;
  description?: string;
  category: string;
  templateSlug?: string;
  city?: string;
  weddingId?: string | null;
  coverAssetId?: string | null;
  showLive?: boolean;
  consent?: boolean;
  consentNote?: string;
  status?: "DRAFT" | "PUBLISHED";
}

const clean = (s: unknown, max: number) => String(s ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";

export async function listPortfolioAdmin(actor: Actor | null) {
  requireAdmin(actor);
  const db = await getDb();
  const items = await db
    .select({ item: schema.portfolioItems, wedding: { id: schema.weddings.id, title: schema.weddings.title, slug: schema.weddings.slug, isDemo: schema.weddings.isDemo, status: schema.weddings.status } })
    .from(schema.portfolioItems)
    .leftJoin(schema.weddings, eq(schema.weddings.id, schema.portfolioItems.weddingId))
    .orderBy(asc(schema.portfolioItems.sortOrder), desc(schema.portfolioItems.createdAt));
  return items.map((r) => ({ ...r.item, wedding: r.wedding?.id ? r.wedding : null }));
}

/** The invitations a portfolio item may point at: every sample, and any customer invitation (publishing one still needs consent). */
export async function linkableWeddings(actor: Actor | null) {
  requireAdmin(actor);
  const db = await getDb();
  return db.select({ id: schema.weddings.id, title: schema.weddings.title, slug: schema.weddings.slug, isDemo: schema.weddings.isDemo, status: schema.weddings.status }).from(schema.weddings).where(sql`${schema.weddings.archivedAt} is null`).orderBy(desc(schema.weddings.isDemo), asc(schema.weddings.title)).limit(400);
}

/** Public photographs of one invitation that could serve as its cover. */
export async function coverChoices(actor: Actor | null, weddingId: string) {
  requireAdmin(actor);
  const db = await getDb();
  const rowsOf = await db.select().from(schema.mediaAssets).where(and(eq(schema.mediaAssets.weddingId, weddingId), eq(schema.mediaAssets.kind, "IMAGE"), eq(schema.mediaAssets.visibility, "PUBLIC"), eq(schema.mediaAssets.moderation, "APPROVED"), sql`${schema.mediaAssets.archivedAt} is null`)).orderBy(asc(schema.mediaAssets.sortOrder)).limit(60);
  return rowsOf.map((a) => ({ id: a.id, url: toResolved(a).url, alt: a.filename }));
}

export async function savePortfolioItem(actor: Actor | null, input: PortfolioInput) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  const title = clean(input.title, 120);
  if (title.length < 3) throw invalid("Give the project a title.", { title: "At least three characters" });
  if (!categoryBySlug(input.category as never)) throw invalid("Choose what kind of invitation it is.", { category: "Required" });
  const templateSlug = clean(input.templateSlug, 80);
  if (templateSlug && !siteTemplateBySlug(templateSlug)) throw invalid("That template does not exist.", { templateSlug: "Unknown template" });

  const existing = input.id ? (await db.select().from(schema.portfolioItems).where(eq(schema.portfolioItems.id, input.id)))[0] : undefined;
  if (input.id && !existing) throw notFound();

  const weddingId = input.weddingId || null;
  const [wedding] = weddingId ? await db.select({ id: schema.weddings.id, isDemo: schema.weddings.isDemo }).from(schema.weddings).where(eq(schema.weddings.id, weddingId)) : [];
  if (weddingId && !wedding) throw invalid("That invitation does not exist.", { weddingId: "Unknown invitation" });
  const consent = !!input.consent;
  const consented = !wedding || wedding.isDemo || consent;
  const status = input.status ?? existing?.status ?? "DRAFT";
  const showLive = !!input.showLive;

  if (showLive && !wedding && !templateSlug) throw invalid("Choose an invitation or a template to preview.", { showLive: "Nothing to show" });
  if (showLive && wedding && !consented) throw invalid("A customer's invitation can be shown only with their consent. Tick the consent box and say how it was given.", { consent: "Required" });
  if (status === "PUBLISHED") {
    if (!consented) throw invalid("This stands for a customer's invitation. Record their consent before publishing it.", { consent: "Required" });
    if (!templateSlug && !input.coverAssetId) throw invalid("Choose a template or an approved cover photograph so the card has a picture.", { templateSlug: "Required" });
  }
  if (consent && !clean(input.consentNote, 300) && wedding && !wedding.isDemo) throw invalid("Say how the consent was given (for example: “agreed by WhatsApp, 12 Oct”).", { consentNote: "Required" });

  const coverAssetId: string | null = input.coverAssetId || null;
  if (coverAssetId) {
    const [a] = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, coverAssetId));
    if (!a || a.weddingId !== weddingId || a.kind !== "IMAGE" || a.visibility !== "PUBLIC" || a.moderation !== "APPROVED" || a.archivedAt) throw invalid("The cover must be an approved, public photograph of the linked invitation.", { coverAssetId: "Not allowed" });
  }

  const values = {
    title, description: clean(input.description, 600), category: input.category, templateSlug, city: clean(input.city, 60), weddingId, coverAssetId, showLive, consent, consentNote: clean(input.consentNote, 300), status, updatedAt: new Date(),
  };
  if (existing) {
    await db.update(schema.portfolioItems).set(values).where(eq(schema.portfolioItems.id, existing.id));
    await audit(admin, "portfolio.updated", { entityType: "portfolio", entityId: existing.id, weddingId, metadata: { status, consent } });
    return existing.id;
  }
  let slug = slugify(title);
  for (let n = 2; (await db.select({ id: schema.portfolioItems.id }).from(schema.portfolioItems).where(eq(schema.portfolioItems.slug, slug))).length; n++) slug = `${slugify(title).slice(0, 56)}-${n}`;
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${schema.portfolioItems.sortOrder}), -1)::int` }).from(schema.portfolioItems);
  const [row] = await db.insert(schema.portfolioItems).values({ ...values, slug, sortOrder: max + 1 }).returning({ id: schema.portfolioItems.id });
  await audit(admin, "portfolio.created", { entityType: "portfolio", entityId: row.id, weddingId, metadata: { status } });
  return row.id;
}

export async function deletePortfolioItem(actor: Actor | null, id: string) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  await db.delete(schema.portfolioItems).where(eq(schema.portfolioItems.id, id));
  await audit(admin, "portfolio.deleted", { entityType: "portfolio", entityId: id });
}

/** Hide or show without touching anything else. Showing re-checks consent, exactly as publishing does. */
export async function setPortfolioStatus(actor: Actor | null, id: string, status: "DRAFT" | "PUBLISHED") {
  requireAdmin(actor);
  const db = await getDb();
  const [i] = await db.select().from(schema.portfolioItems).where(eq(schema.portfolioItems.id, id));
  if (!i) throw notFound();
  return savePortfolioItem(actor, { id: i.id, title: i.title, description: i.description, category: i.category, templateSlug: i.templateSlug, city: i.city, weddingId: i.weddingId, coverAssetId: i.coverAssetId, showLive: i.showLive, consent: i.consent, consentNote: i.consentNote, status });
}

/** Moves an item one place earlier or later in the wall. */
export async function movePortfolioItem(actor: Actor | null, id: string, direction: "up" | "down") {
  requireAdmin(actor);
  const db = await getDb();
  const all = await db.select({ id: schema.portfolioItems.id }).from(schema.portfolioItems).orderBy(asc(schema.portfolioItems.sortOrder), desc(schema.portfolioItems.createdAt));
  const ids = all.map((r) => r.id);
  const i = ids.indexOf(id);
  if (i < 0) throw notFound();
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await db.transaction(async (tx) => {
    for (const [n, x] of ids.entries()) await tx.update(schema.portfolioItems).set({ sortOrder: n }).where(eq(schema.portfolioItems.id, x));
  });
}

/** For tests and the sitemap: the slugs the public may see. */
export async function publicPortfolioSlugs(): Promise<string[]> {
  return (await listPublicPortfolio(500)).map((c) => c.slug);
}

