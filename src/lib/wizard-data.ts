import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { UserActor } from "@/domain/auth/access";
import { getWedding } from "@/domain/wedding/service";
import { getEntitlements, listOverrides, listPackages } from "@/domain/packages/service";
import { listTemplates, listThemes } from "@/domain/design/service";
import { TemplateConfig } from "@/domain/design/templates";
import { ThemeTokens } from "@/domain/design/tokens";
import { FEATURES, type FeatureGroup } from "@/domain/packages/features";
import { env } from "@/lib/env";
import type { WizardProps } from "@/components/admin/wizard/WizardClient";
import type { StepKey } from "@/components/admin/wizard/steps";

const GROUP_ORDER: FeatureGroup[] = ["Invitation", "Guests & RSVP", "Participation", "Travel & Venue", "Games", "Event day", "Memories", "Dashboard"];

export async function loadWizardProps(actor: UserActor, weddingId: string, step: StepKey): Promise<WizardProps> {
  const w = await getWedding(actor, weddingId);
  const db = await getDb();
  const [packages, templates, themes, ent, overrides] = await Promise.all([listPackages(), listTemplates({ status: "PUBLISHED" }), listThemes({ status: "PUBLISHED" }), getEntitlements(weddingId), listOverrides(weddingId)]);
  const groups = await db.select().from(schema.guestGroups).where(eq(schema.guestGroups.weddingId, weddingId)).orderBy(schema.guestGroups.sortOrder);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.guests).where(and(eq(schema.guests.weddingId, weddingId), isNull(schema.guests.archivedAt)));
  const [ver] = w.publishedVersionId ? await db.select({ v: schema.publishedVersions.version }).from(schema.publishedVersions).where(eq(schema.publishedVersions.id, w.publishedVersionId)) : [];
  const clients = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.weddingUsers)
    .innerJoin(schema.users, eq(schema.users.id, schema.weddingUsers.userId))
    .where(eq(schema.weddingUsers.weddingId, weddingId));

  return {
    weddingId,
    step,
    role: actor.kind === "admin" ? "admin" : "client",
    title: w.title,
    slug: w.slug,
    appUrl: env.appUrl,
    initialDoc: w.draftDoc,
    initialSettings: {
      title: w.title, slug: w.slug, weddingDate: w.weddingDate, timezone: w.timezone, defaultLocale: w.defaultLocale, secondaryLocale: w.secondaryLocale, accessMode: w.accessMode, autoLifecycle: w.autoLifecycle,
      contactEmail: w.contactEmail, contactPhone: w.contactPhone, templateId: w.templateId, themeId: w.themeId, themeOverrides: w.themeOverrides, packageKey: w.packageKey, customerClass: w.customerClass,
    },
    features: ent.features,
    groups: groups.map((g) => ({ key: g.key, name: g.name })),
    packages: packages.map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, blurb: p.blurb, priceMin: p.priceMin, priceMax: p.priceMax, hasClientDashboard: p.hasClientDashboard })),
    templates: templates.map((t) => {
      const cfg = TemplateConfig.safeParse(t.config);
      return { id: t.id, slug: t.slug, name: t.name, description: t.description, flavor: cfg.success ? cfg.data.flavor : "minimal", opening: cfg.success ? cfg.data.opening : "envelope", suggestedTheme: cfg.success ? cfg.data.suggestedTheme : undefined };
    }),
    themes: themes.map((t) => ({ id: t.id, slug: t.slug, name: t.name, description: t.description, tokens: ThemeTokens.parse(t.tokens) })),
    overrides: Object.fromEntries(overrides.map((o) => [o.featureKey, o.enabled])),
    groupsOrder: GROUP_ORDER.filter((g) => Object.values(FEATURES).some((f) => f.group === g)),
    guestCount: n,
    published: !!w.publishedVersionId,
    publishedVersion: ver?.v ?? null,
    status: w.status,
    clients,
  };
}
