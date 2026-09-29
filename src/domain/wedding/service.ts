import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { DEFAULT_GROUPS, PUBLIC_STATUSES, type WeddingStatus } from "@/domain/doc/constants";
import { type InvitationDoc, InvitationDoc as InvitationDocSchema } from "@/domain/doc/schema";
import { type Actor, isMemberOf, requireAdmin, requireUser, requireWeddingAccess } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { conflict, forbidden, invalid, notFound } from "@/lib/errors";
import { getEntitlements } from "@/domain/packages/service";
import { type PackageKey, PACKAGE_RANK } from "@/domain/packages/features";
import { type ThemeTokens, ThemeTokens as ThemeTokensSchema, mergeTokens } from "@/domain/design/tokens";
import { TemplateConfig } from "@/domain/design/templates";
import { logError } from "@/domain/platform/logging";
import { buildInitialDoc, publishReadiness } from "./doc-tools";
import { effectiveStatus } from "./lifecycle";
import type { CustomerClass } from "@/domain/packages/catalog";

export type WeddingRow = typeof schema.weddings.$inferSelect;

export const RESERVED_SLUGS = new Set([
  "admin", "api", "login", "logout", "client", "dashboard", "invite", "preview", "pass", "static", "assets", "media",
  "demo", "new", "help", "support", "about", "pricing", "terms", "privacy", "_next", "favicon", "robots", "sitemap",
]);

export function normalizeSlug(input: string): string {
  return input.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export function slugProblem(slug: string): string | null {
  if (slug.length < 3) return "Use at least 3 characters.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Use only lowercase letters, numbers and single hyphens.";
  if (RESERVED_SLUGS.has(slug)) return "That link is reserved. Please choose another.";
  return null;
}

export async function isSlugAvailable(slug: string, exceptWeddingId?: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db.select({ id: schema.weddings.id }).from(schema.weddings).where(sql`lower(${schema.weddings.slug}) = ${slug.toLowerCase()}`);
  return !row || row.id === exceptWeddingId;
}

// ── create ─────────────────────────────────────────────────────────────────
export interface CreateWeddingInput {
  title?: string;
  slug?: string;
  packageKey: PackageKey;
  customerClass?: CustomerClass;
  templateId?: string | null;
  themeId?: string | null;
  defaultLocale?: string;
  secondaryLocale?: string | null;
  weddingDate?: string | null;
}

export async function createWedding(actor: Actor | null, input: CreateWeddingInput): Promise<WeddingRow> {
  const admin = requireAdmin(actor);
  const db = await getDb();
  const slug = input.slug ? normalizeSlug(input.slug) : `draft-${Math.random().toString(36).slice(2, 8)}`;
  if (input.slug) {
    const p = slugProblem(slug);
    if (p) throw invalid(p, { slug: p });
  }
  if (!(await isSlugAvailable(slug))) throw conflict("That wedding link is already taken.");

  const [pkg] = await db.select().from(schema.weddingPackages).where(eq(schema.weddingPackages.key, input.packageKey));
  if (!pkg) throw invalid("Choose a package.");

  const templateId = input.templateId ?? null;
  const [template] = templateId ? await db.select().from(schema.templates).where(eq(schema.templates.id, templateId)) : [];
  const tConfig = template ? TemplateConfig.safeParse(template.config) : null;

  // Entitlements for a wedding that does not exist yet = the package defaults.
  const { resolveEntitlements } = await import("@/domain/packages/entitlements");
  const ent = resolveEntitlements(input.packageKey, pkg.features, []);
  const doc = buildInitialDoc(tConfig?.success ? tConfig.data : null, ent, input.secondaryLocale ?? null);

  const customerClass: CustomerClass = input.customerClass ?? (`PAID_${input.packageKey}` as CustomerClass);

  const [w] = await db
    .insert(schema.weddings)
    .values({
      slug,
      title: input.title?.trim() ?? "",
      packageKey: input.packageKey,
      customerClass,
      templateId,
      themeId: input.themeId ?? null,
      defaultLocale: input.defaultLocale ?? "en",
      secondaryLocale: input.secondaryLocale ?? null,
      weddingDate: input.weddingDate ?? null,
      draftDoc: doc,
      createdBy: admin.userId,
    })
    .returning();

  await db.insert(schema.guestGroups).values(DEFAULT_GROUPS.map((g, i) => ({ weddingId: w.id, key: g.key, name: g.name, kind: g.kind, sortOrder: i })));
  await audit(admin, "wedding.created", { weddingId: w.id, entityType: "wedding", entityId: w.id, metadata: { slug, packageKey: input.packageKey } });
  return w;
}

// ── read ───────────────────────────────────────────────────────────────────
export async function getWedding(actor: Actor | null, id: string): Promise<WeddingRow> {
  await requireWeddingAccess(actor, id);
  const db = await getDb();
  const [w] = await db.select().from(schema.weddings).where(eq(schema.weddings.id, id));
  if (!w) throw notFound();
  return { ...w, draftDoc: InvitationDocSchema.parse(w.draftDoc) };
}

export interface WeddingListItem {
  id: string;
  slug: string;
  title: string;
  packageKey: PackageKey;
  customerClass: CustomerClass;
  status: WeddingStatus;
  effective: WeddingStatus;
  weddingDate: string | null;
  archivedAt: Date | null;
  publishedAt: Date | null;
  draftUpdatedAt: Date;
  views: number;
  guests: number;
  rsvp: { yes: number; no: number; maybe: number; pending: number };
  clients: { id: string; name: string; email: string }[];
}

export async function listWeddings(actor: Actor | null, opts: { includeArchived?: boolean } = {}): Promise<WeddingListItem[]> {
  const user = requireUser(actor);
  const db = await getDb();
  let rows = await db.select().from(schema.weddings).orderBy(desc(schema.weddings.updatedAt));
  if (user.kind === "client") rows = rows.filter((r) => isMemberOf(user, r.id));
  if (!opts.includeArchived) rows = rows.filter((r) => !r.archivedAt);
  const ids = rows.map((r) => r.id);
  if (!ids.length) return [];

  const views = await db
    .select({ weddingId: schema.analyticsEvents.weddingId, n: sql<number>`count(*)::int` })
    .from(schema.analyticsEvents)
    .where(and(inArray(schema.analyticsEvents.weddingId, ids), eq(schema.analyticsEvents.type, "view")))
    .groupBy(schema.analyticsEvents.weddingId);
  const guests = await db
    .select({ weddingId: schema.guests.weddingId, n: sql<number>`count(*)::int` })
    .from(schema.guests)
    .where(and(inArray(schema.guests.weddingId, ids), isNull(schema.guests.archivedAt)))
    .groupBy(schema.guests.weddingId);
  const rsvps = await db
    .select({ weddingId: schema.rsvps.weddingId, status: schema.rsvps.status, n: sql<number>`count(*)::int` })
    .from(schema.rsvps)
    .where(inArray(schema.rsvps.weddingId, ids))
    .groupBy(schema.rsvps.weddingId, schema.rsvps.status);
  const clientRows = await db
    .select({ weddingId: schema.weddingUsers.weddingId, id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.weddingUsers)
    .innerJoin(schema.users, eq(schema.users.id, schema.weddingUsers.userId))
    .where(inArray(schema.weddingUsers.weddingId, ids));

  return rows.map((r) => {
    const guestCount = guests.find((g) => g.weddingId === r.id)?.n ?? 0;
    const count = (s: string) => rsvps.find((x) => x.weddingId === r.id && x.status === s)?.n ?? 0;
    const yes = count("YES"), no = count("NO"), maybe = count("MAYBE");
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      packageKey: r.packageKey,
      customerClass: r.customerClass,
      status: r.status,
      effective: effectiveStatus(r),
      weddingDate: r.weddingDate,
      archivedAt: r.archivedAt,
      publishedAt: r.publishedAt,
      draftUpdatedAt: r.draftUpdatedAt,
      views: views.find((v) => v.weddingId === r.id)?.n ?? 0,
      guests: guestCount,
      rsvp: { yes, no, maybe, pending: Math.max(0, guestCount - yes - no - maybe) },
      clients: clientRows.filter((c) => c.weddingId === r.id).map(({ id, name, email }) => ({ id, name, email })),
    };
  });
}

// ── update ─────────────────────────────────────────────────────────────────
export interface SettingsPatch {
  title?: string;
  slug?: string;
  weddingDate?: string | null;
  timezone?: string;
  defaultLocale?: string;
  secondaryLocale?: string | null;
  accessMode?: "PUBLIC" | "PERSONALIZED_ONLY";
  autoLifecycle?: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
  templateId?: string | null;
  themeId?: string | null;
  themeOverrides?: Record<string, unknown>;
  packageKey?: PackageKey;
  customerClass?: CustomerClass;
  wizardStep?: number;
}

const CLIENT_SETTINGS: (keyof SettingsPatch)[] = ["contactEmail", "contactPhone"];

export async function updateWeddingSettings(actor: Actor | null, id: string, patch: SettingsPatch): Promise<WeddingRow> {
  const scope = await requireWeddingAccess(actor, id);
  const a = scope.actor;
  if (a.kind === "client") {
    const bad = Object.keys(patch).filter((k) => !CLIENT_SETTINGS.includes(k as keyof SettingsPatch));
    if (bad.length) throw forbidden("These settings are managed by your invitation designer.");
  }
  const db = await getDb();
  const set: Partial<typeof schema.weddings.$inferInsert> = { updatedAt: new Date() };

  if (patch.slug !== undefined) {
    const slug = normalizeSlug(patch.slug);
    const p = slugProblem(slug);
    if (p) throw invalid(p, { slug: p });
    if (!(await isSlugAvailable(slug, id))) throw conflict("That wedding link is already taken.");
    set.slug = slug;
  }
  if (patch.title !== undefined) set.title = patch.title.trim();
  if (patch.weddingDate !== undefined) {
    if (patch.weddingDate && !/^\d{4}-\d{2}-\d{2}$/.test(patch.weddingDate)) throw invalid("Enter the date as YYYY-MM-DD.", { weddingDate: "Invalid date" });
    set.weddingDate = patch.weddingDate || null;
  }
  if (patch.timezone) set.timezone = patch.timezone;
  if (patch.defaultLocale) set.defaultLocale = patch.defaultLocale;
  if (patch.secondaryLocale !== undefined) set.secondaryLocale = patch.secondaryLocale || null;
  if (patch.accessMode) set.accessMode = patch.accessMode;
  if (patch.autoLifecycle !== undefined) set.autoLifecycle = patch.autoLifecycle;
  if (patch.contactEmail !== undefined) set.contactEmail = patch.contactEmail || null;
  if (patch.contactPhone !== undefined) set.contactPhone = patch.contactPhone || null;
  if (patch.templateId !== undefined) set.templateId = patch.templateId;
  if (patch.themeId !== undefined) set.themeId = patch.themeId;
  if (patch.themeOverrides !== undefined) set.themeOverrides = patch.themeOverrides;
  if (patch.wizardStep !== undefined) set.wizardStep = patch.wizardStep;
  if (patch.customerClass) set.customerClass = patch.customerClass;
  if (patch.packageKey) {
    const [pkg] = await db.select().from(schema.weddingPackages).where(eq(schema.weddingPackages.key, patch.packageKey));
    if (!pkg) throw invalid("Unknown package.");
    set.packageKey = patch.packageKey;
    if (!patch.customerClass) {
      const [cur] = await db.select({ c: schema.weddings.customerClass }).from(schema.weddings).where(eq(schema.weddings.id, id));
      if (cur?.c !== "FREE_PORTFOLIO") set.customerClass = `PAID_${patch.packageKey}` as CustomerClass;
    }
  }

  const [row] = await db.update(schema.weddings).set(set).where(eq(schema.weddings.id, id)).returning();
  await audit(a, "wedding.settings_updated", { weddingId: id, entityType: "wedding", entityId: id, metadata: { keys: Object.keys(patch) } });
  return row;
}

/** Sections a client may NOT change; everything else is "approved content". */
const CLIENT_DOC_KEYS: (keyof InvitationDoc)[] = [
  "events", "venues", "contacts", "menu", "dressGuide", "palette", "rsvp", "thankYou", "anniversary", "live", "timeCapsule", "story", "family", "games",
];

export async function saveDraft(actor: Actor | null, id: string, input: unknown): Promise<{ savedAt: Date }> {
  const scope = await requireWeddingAccess(actor, id);
  const parsed = InvitationDocSchema.safeParse(input);
  if (!parsed.success) throw invalid("Some content is not valid.", Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
  const next = parsed.data;
  const db = await getDb();

  if (scope.actor.kind === "client") {
    // Clients may only touch approved content — layout, theme, opening and SEO stay with Super Admin.
    const [cur] = await db.select({ draftDoc: schema.weddings.draftDoc }).from(schema.weddings).where(eq(schema.weddings.id, id));
    const current = InvitationDocSchema.parse(cur.draftDoc);
    const merged: InvitationDoc = { ...current };
    for (const k of CLIENT_DOC_KEYS) (merged as Record<string, unknown>)[k] = next[k];
    return persistDraft(scope.actor, id, merged);
  }
  return persistDraft(scope.actor, id, next);
}

async function persistDraft(actor: Actor, id: string, doc: InvitationDoc) {
  const db = await getDb();
  const savedAt = new Date();
  await db
    .update(schema.weddings)
    .set({ draftDoc: doc, draftUpdatedAt: savedAt, draftUpdatedBy: actor.kind === "system" ? null : actor.userId, updatedAt: savedAt })
    .where(eq(schema.weddings.id, id));
  return { savedAt };
}

// ── archive / duplicate ────────────────────────────────────────────────────
export async function archiveWedding(actor: Actor | null, id: string) {
  const { actor: a } = await requireWeddingAccess(actor, id, { adminOnly: true });
  const db = await getDb();
  await db.update(schema.weddings).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(schema.weddings.id, id));
  await audit(a, "wedding.archived", { weddingId: id, entityType: "wedding", entityId: id });
}

export async function restoreWedding(actor: Actor | null, id: string) {
  const { actor: a } = await requireWeddingAccess(actor, id, { adminOnly: true });
  const db = await getDb();
  await db.update(schema.weddings).set({ archivedAt: null, updatedAt: new Date() }).where(eq(schema.weddings.id, id));
  await audit(a, "wedding.restored", { weddingId: id, entityType: "wedding", entityId: id });
}

/**
 * Duplicates structure — template, theme, sections and content — but NOT private data:
 * no guests, messages or guest uploads. Media assets are not copied (they belong to the source wedding).
 */
export async function duplicateWedding(actor: Actor | null, id: string, input: { title: string; slug?: string; keepMedia?: boolean }) {
  const admin = requireAdmin(actor);
  const src = await getWedding(admin, id);
  const clone = await createWedding(admin, {
    title: input.title,
    slug: input.slug,
    packageKey: src.packageKey,
    customerClass: src.customerClass,
    templateId: src.templateId,
    themeId: src.themeId,
    defaultLocale: src.defaultLocale,
    secondaryLocale: src.secondaryLocale,
  });
  const doc = structuredClone(src.draftDoc) as InvitationDoc;
  // Strip anything that identifies the source couple's private media.
  const strip = (o: unknown): void => {
    if (Array.isArray(o)) return o.forEach(strip);
    if (o && typeof o === "object") {
      for (const [k, v] of Object.entries(o)) {
        if (["photo", "audio", "image", "ogImage", "a", "b", "then", "now", "cover"].includes(k) && typeof v === "string") (o as Record<string, unknown>)[k] = undefined;
        else strip(v);
      }
    }
  };
  if (!input.keepMedia) strip(doc);
  const db = await getDb();
  await db.update(schema.weddings).set({ draftDoc: doc, themeOverrides: src.themeOverrides }).where(eq(schema.weddings.id, clone.id));
  await audit(admin, "wedding.duplicated", { weddingId: clone.id, entityType: "wedding", entityId: clone.id, metadata: { from: id } });
  return clone;
}

// ── publishing & versions ──────────────────────────────────────────────────
export interface RenderMeta {
  tokens: ThemeTokens;
  flavor: string;
  templateSlug: string;
  templateName: string;
  title: string;
  weddingDate: string | null;
  timezone: string;
  defaultLocale: string;
  secondaryLocale: string | null;
}

export async function buildRenderMeta(w: WeddingRow): Promise<RenderMeta> {
  const db = await getDb();
  const [theme] = w.themeId ? await db.select().from(schema.themes).where(eq(schema.themes.id, w.themeId)) : [];
  const [template] = w.templateId ? await db.select().from(schema.templates).where(eq(schema.templates.id, w.templateId)) : [];
  const base = ThemeTokensSchema.parse(theme?.tokens);
  const tCfg = template ? TemplateConfig.safeParse(template.config) : null;
  return {
    tokens: mergeTokens(base, w.themeOverrides),
    flavor: tCfg?.success ? tCfg.data.flavor : "minimal",
    templateSlug: template?.slug ?? "",
    templateName: template?.name ?? "",
    title: w.title,
    weddingDate: w.weddingDate,
    timezone: w.timezone,
    defaultLocale: w.defaultLocale,
    secondaryLocale: w.secondaryLocale,
  };
}

export async function getReadiness(actor: Actor | null, id: string) {
  const w = await getWedding(actor, id);
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.galleryItems)
    .where(eq(schema.galleryItems.weddingId, id));
  const [{ m }] = await db.select({ m: sql<number>`count(*)::int` }).from(schema.musicTracks).where(eq(schema.musicTracks.weddingId, id));
  return publishReadiness({
    doc: w.draftDoc,
    slug: w.slug,
    weddingDate: w.weddingDate,
    secondaryLocale: w.secondaryLocale,
    hasTemplate: !!w.templateId,
    hasTheme: !!w.themeId,
    galleryCount: n,
    hasMusic: m > 0,
  });
}

export async function publishWedding(actor: Actor | null, id: string, opts: { label?: string } = {}) {
  const scope = await requireWeddingAccess(actor, id);
  const w = await getWedding(scope.actor, id);
  // Clients may push updates to an invitation their designer has already launched — never the first launch.
  if (scope.actor.kind === "client" && !w.publishedVersionId) throw forbidden("Your invitation designer launches the invitation. After that you can publish your updates.");
  const issues = await getReadiness(scope.actor, id);
  const blockers = issues.filter((i) => i.level === "error");
  if (blockers.length) {
    await logError("publish", new Error("Publish blocked by readiness checks"), { weddingId: id, metadata: { blockers: blockers.map((b) => b.code) } });
    throw invalid(`Not ready to publish: ${blockers[0].message}`, { readiness: blockers.map((b) => b.message).join(" | ") });
  }
  const db = await getDb();
  try {
    const meta = await buildRenderMeta(w);
    const version = await db.transaction(async (tx) => {
      const [{ v }] = await tx
        .select({ v: sql<number>`coalesce(max(${schema.publishedVersions.version}), 0)::int` })
        .from(schema.publishedVersions)
        .where(eq(schema.publishedVersions.weddingId, id));
      const [row] = await tx
        .insert(schema.publishedVersions)
        .values({
          weddingId: id,
          version: v + 1,
          kind: "PUBLISHED",
          label: opts.label ?? "",
          doc: w.draftDoc,
          renderMeta: meta as unknown as Record<string, unknown>,
          templateId: w.templateId,
          themeId: w.themeId,
          createdBy: scope.actor.kind === "system" ? null : scope.actor.userId,
        })
        .returning();
      const nextStatus: WeddingStatus = PUBLIC_STATUSES.includes(w.status) ? w.status : "PUBLISHED";
      await tx
        .update(schema.weddings)
        .set({ publishedVersionId: row.id, publishedAt: new Date(), status: nextStatus, updatedAt: new Date() })
        .where(eq(schema.weddings.id, id));
      return row;
    });
    await audit(scope.actor, "wedding.published", { weddingId: id, entityType: "version", entityId: version.id, metadata: { version: version.version } });
    return version;
  } catch (e) {
    await logError("publish", e, { weddingId: id });
    throw e;
  }
}

export async function unpublishWedding(actor: Actor | null, id: string) {
  const { actor: a } = await requireWeddingAccess(actor, id, { adminOnly: true });
  const db = await getDb();
  await db.update(schema.weddings).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(schema.weddings.id, id));
  await audit(a, "wedding.unpublished", { weddingId: id, entityType: "wedding", entityId: id });
}

export async function setWeddingStatus(actor: Actor | null, id: string, status: WeddingStatus) {
  const { actor: a } = await requireWeddingAccess(actor, id, { adminOnly: true });
  const w = await getWedding(a, id);
  if (PUBLIC_STATUSES.includes(status) && !w.publishedVersionId) throw invalid("Publish the invitation first.");
  const db = await getDb();
  await db.update(schema.weddings).set({ status, updatedAt: new Date() }).where(eq(schema.weddings.id, id));
  await audit(a, "wedding.status_changed", { weddingId: id, entityType: "wedding", entityId: id, metadata: { status } });
}

export async function createCheckpoint(actor: Actor | null, id: string, label: string) {
  const scope = await requireWeddingAccess(actor, id);
  const w = await getWedding(scope.actor, id);
  const db = await getDb();
  const meta = await buildRenderMeta(w);
  const [{ v }] = await db
    .select({ v: sql<number>`coalesce(max(${schema.publishedVersions.version}), 0)::int` })
    .from(schema.publishedVersions)
    .where(eq(schema.publishedVersions.weddingId, id));
  const [row] = await db
    .insert(schema.publishedVersions)
    .values({ weddingId: id, version: v + 1, kind: "CHECKPOINT", label, doc: w.draftDoc, renderMeta: meta as unknown as Record<string, unknown>, templateId: w.templateId, themeId: w.themeId, createdBy: scope.actor.kind === "system" ? null : scope.actor.userId })
    .returning();
  await audit(scope.actor, "wedding.checkpoint", { weddingId: id, entityType: "version", entityId: row.id, metadata: { label } });
  return row;
}

export async function listVersions(actor: Actor | null, id: string) {
  await requireWeddingAccess(actor, id);
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.publishedVersions.id,
      version: schema.publishedVersions.version,
      kind: schema.publishedVersions.kind,
      label: schema.publishedVersions.label,
      createdAt: schema.publishedVersions.createdAt,
      createdBy: schema.users.name,
    })
    .from(schema.publishedVersions)
    .leftJoin(schema.users, eq(schema.users.id, schema.publishedVersions.createdBy))
    .where(eq(schema.publishedVersions.weddingId, id))
    .orderBy(desc(schema.publishedVersions.version));
  const [w] = await db.select({ p: schema.weddings.publishedVersionId }).from(schema.weddings).where(eq(schema.weddings.id, id));
  return rows.map((r) => ({ ...r, isLive: r.id === w?.p }));
}

/**
 * Rollback never destroys anything: it restores an older version as the *draft* (default) or
 * re-points the live invitation at it (`goLive`). Every step is recorded as a new version.
 */
export async function rollbackToVersion(actor: Actor | null, id: string, versionId: string, opts: { goLive?: boolean } = {}) {
  const scope = await requireWeddingAccess(actor, id, { adminOnly: true });
  const db = await getDb();
  const [v] = await db
    .select()
    .from(schema.publishedVersions)
    .where(and(eq(schema.publishedVersions.id, versionId), eq(schema.publishedVersions.weddingId, id)));
  if (!v) throw notFound("That version does not exist for this wedding.");
  // Always checkpoint the current draft first so nothing is lost.
  await createCheckpoint(scope.actor, id, `Before restoring v${v.version}`);
  const restored = InvitationDocSchema.parse(v.doc);
  await db.update(schema.weddings).set({ draftDoc: restored, draftUpdatedAt: new Date(), updatedAt: new Date() }).where(eq(schema.weddings.id, id));
  if (opts.goLive) {
    if (v.kind !== "PUBLISHED") {
      const w = await getWedding(scope.actor, id);
      const pub = await publishWedding(scope.actor, id, { label: `Restored from v${v.version}` });
      void w;
      await audit(scope.actor, "wedding.rollback", { weddingId: id, entityType: "version", entityId: pub.id, metadata: { from: v.version, goLive: true } });
      return pub;
    }
    await db
      .update(schema.weddings)
      .set({ publishedVersionId: v.id, publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.weddings.id, id));
  }
  await audit(scope.actor, "wedding.rollback", { weddingId: id, entityType: "version", entityId: v.id, metadata: { version: v.version, goLive: !!opts.goLive } });
  return v;
}

export function packageAtLeast(pkg: PackageKey, min: PackageKey) {
  return PACKAGE_RANK[pkg] >= PACKAGE_RANK[min];
}

export { getEntitlements };
