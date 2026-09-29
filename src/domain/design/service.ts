import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { conflict, invalid, notFound } from "@/lib/errors";
import { type Actor, requireAdmin } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { TEMPLATE_SEEDS, TemplateConfig } from "./templates";
import { THEME_SEEDS } from "./themes";
import { ThemeTokens } from "./tokens";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Inserts built-in templates & themes that are missing. Never overwrites admin edits. */
export async function ensureDesignLibrary(): Promise<void> {
  const db = await getDb();
  for (const t of TEMPLATE_SEEDS) {
    const [row] = await db
      .insert(schema.templates)
      .values({ slug: t.slug, name: t.name, description: t.description, config: t.config, status: "PUBLISHED" })
      .onConflictDoNothing()
      .returning();
    if (row) await db.insert(schema.templateVersions).values({ templateId: row.id, version: 1, config: t.config });
  }
  for (const t of THEME_SEEDS) {
    await db
      .insert(schema.themes)
      .values({ slug: t.slug, name: t.name, description: t.description, tokens: t.tokens, status: "PUBLISHED" })
      .onConflictDoNothing();
  }
}

export async function listTemplates(opts: { status?: Status; packageKey?: string } = {}) {
  const db = await getDb();
  const rows = await db.select().from(schema.templates).orderBy(schema.templates.createdAt);
  return rows.filter((r) => (!opts.status || r.status === opts.status) && (!opts.packageKey || r.supportedPackages.includes(opts.packageKey)));
}

export async function listThemes(opts: { status?: Status; packageKey?: string } = {}) {
  const db = await getDb();
  const rows = await db.select().from(schema.themes).orderBy(schema.themes.createdAt);
  return rows.filter((r) => (!opts.status || r.status === opts.status) && (!opts.packageKey || r.supportedPackages.includes(opts.packageKey)));
}

export async function getTemplate(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.templates).where(eq(schema.templates.id, id));
  if (!row) throw notFound("Template not found.");
  return row;
}

export async function getTheme(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.themes).where(eq(schema.themes.id, id));
  if (!row) throw notFound("Theme not found.");
  return row;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

export async function saveTemplate(
  actor: Actor,
  input: { id?: string; name: string; slug?: string; description?: string; status?: Status; supportedPackages?: string[]; config: unknown },
) {
  const admin = requireAdmin(actor);
  const config = TemplateConfig.safeParse(input.config);
  if (!config.success) throw invalid("The template configuration is not valid.");
  const db = await getDb();
  if (input.id) {
    const current = await getTemplate(input.id);
    const configChanged = JSON.stringify(current.config) !== JSON.stringify(config.data);
    const version = configChanged ? current.version + 1 : current.version;
    const [row] = await db
      .update(schema.templates)
      .set({
        name: input.name,
        description: input.description ?? current.description,
        status: input.status ?? current.status,
        supportedPackages: input.supportedPackages ?? current.supportedPackages,
        config: config.data,
        version,
        updatedAt: new Date(),
      })
      .where(eq(schema.templates.id, input.id))
      .returning();
    if (configChanged) await db.insert(schema.templateVersions).values({ templateId: row.id, version, config: config.data });
    await audit(admin, "template.updated", { entityType: "template", entityId: row.id });
    return row;
  }
  const slug = slugify(input.slug || input.name);
  const [dupe] = await db.select({ id: schema.templates.id }).from(schema.templates).where(eq(schema.templates.slug, slug));
  if (dupe) throw conflict("A template with that name already exists.");
  const [row] = await db
    .insert(schema.templates)
    .values({ slug, name: input.name, description: input.description ?? "", status: input.status ?? "DRAFT", supportedPackages: input.supportedPackages ?? ["ESSENTIAL", "SIGNATURE", "LUXURY"], config: config.data })
    .returning();
  await db.insert(schema.templateVersions).values({ templateId: row.id, version: 1, config: config.data });
  await audit(admin, "template.created", { entityType: "template", entityId: row.id });
  return row;
}

export async function setTemplateStatus(actor: Actor, id: string, status: Status) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  await db.update(schema.templates).set({ status, updatedAt: new Date() }).where(eq(schema.templates.id, id));
  await audit(admin, `template.${status.toLowerCase()}`, { entityType: "template", entityId: id });
}

export async function duplicateTemplate(actor: Actor, id: string) {
  const src = await getTemplate(id);
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.templates).where(sql`${schema.templates.slug} like ${src.slug + "-copy%"}`);
  return saveTemplate(actor, {
    name: `${src.name} (copy${n ? ` ${n + 1}` : ""})`,
    slug: `${src.slug}-copy${n ? `-${n + 1}` : ""}`,
    description: src.description,
    supportedPackages: src.supportedPackages,
    status: "DRAFT",
    config: src.config,
  });
}

export async function saveTheme(
  actor: Actor,
  input: { id?: string; name: string; slug?: string; description?: string; status?: Status; supportedPackages?: string[]; tokens: unknown },
) {
  const admin = requireAdmin(actor);
  const tokens = ThemeTokens.safeParse(input.tokens);
  if (!tokens.success) throw invalid("The theme colours or fonts are not valid.");
  const db = await getDb();
  if (input.id) {
    const current = await getTheme(input.id);
    const changed = JSON.stringify(current.tokens) !== JSON.stringify(tokens.data);
    const [row] = await db
      .update(schema.themes)
      .set({
        name: input.name,
        description: input.description ?? current.description,
        status: input.status ?? current.status,
        supportedPackages: input.supportedPackages ?? current.supportedPackages,
        tokens: tokens.data,
        version: changed ? current.version + 1 : current.version,
        updatedAt: new Date(),
      })
      .where(eq(schema.themes.id, input.id))
      .returning();
    await audit(admin, "theme.updated", { entityType: "theme", entityId: row.id });
    return row;
  }
  const slug = slugify(input.slug || input.name);
  const [dupe] = await db.select({ id: schema.themes.id }).from(schema.themes).where(eq(schema.themes.slug, slug));
  if (dupe) throw conflict("A theme with that name already exists.");
  const [row] = await db
    .insert(schema.themes)
    .values({ slug, name: input.name, description: input.description ?? "", status: input.status ?? "DRAFT", supportedPackages: input.supportedPackages ?? ["ESSENTIAL", "SIGNATURE", "LUXURY"], tokens: tokens.data })
    .returning();
  await audit(admin, "theme.created", { entityType: "theme", entityId: row.id });
  return row;
}

export async function setThemeStatus(actor: Actor, id: string, status: Status) {
  const admin = requireAdmin(actor);
  const db = await getDb();
  await db.update(schema.themes).set({ status, updatedAt: new Date() }).where(eq(schema.themes.id, id));
  await audit(admin, `theme.${status.toLowerCase()}`, { entityType: "theme", entityId: id });
}

export async function duplicateTheme(actor: Actor, id: string) {
  const src = await getTheme(id);
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.themes).where(and(sql`${schema.themes.slug} like ${src.slug + "-copy%"}`));
  return saveTheme(actor, {
    name: `${src.name} (copy${n ? ` ${n + 1}` : ""})`,
    slug: `${src.slug}-copy${n ? `-${n + 1}` : ""}`,
    description: src.description,
    supportedPackages: src.supportedPackages,
    status: "DRAFT",
    tokens: src.tokens,
  });
}
