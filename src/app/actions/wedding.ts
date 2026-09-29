"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { act } from "@/lib/act";
import { requireAdmin, requireWeddingAccess } from "@/domain/auth/access";
import {
  archiveWedding, createCheckpoint, createWedding, duplicateWedding, getReadiness, listVersions, publishWedding, restoreWedding, rollbackToVersion, saveDraft, setWeddingStatus,
  unpublishWedding, updateWeddingSettings, isSlugAvailable, normalizeSlug, slugProblem, type SettingsPatch,
} from "@/domain/wedding/service";
import { PACKAGE_KEYS, isFeatureKey } from "@/domain/packages/features";
import { WEDDING_STATUSES } from "@/domain/doc/constants";
import { getDb, schema } from "@/db/client";
import { and, eq } from "drizzle-orm";
import { assignClientToWedding, createMagicLink } from "@/domain/auth/service";
import { audit } from "@/domain/audit/audit";
import { updatePackage } from "@/domain/packages/service";
import { saveOrder, deleteOrder, addDomain, removeDomain, setDomainVerified } from "@/domain/platform/admin";
import { env } from "@/lib/env";
import { enqueue } from "@/domain/notify/service";
import { generateSections, TemplateConfig } from "@/domain/design/templates";
import { getTemplate } from "@/domain/design/service";
import { getEntitlements } from "@/domain/packages/service";
import { getWedding } from "@/domain/wedding/service";
import { invalid } from "@/lib/errors";

const revalidate = (id?: string) => {
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/client/${id}`, "layout");
};

export const createWeddingAction = async (input: { packageKey: string; title?: string; customerClass?: string }) =>
  act(async (a) => {
    const pkg = z.enum(PACKAGE_KEYS).parse(input.packageKey);
    const [tpl] = await (await getDb()).select().from(schema.templates).where(eq(schema.templates.slug, "royal-heritage"));
    const [thm] = await (await getDb()).select().from(schema.themes).where(eq(schema.themes.slug, "royal-gold"));
    const w = await createWedding(a, {
      packageKey: pkg,
      title: input.title,
      customerClass: input.customerClass as never,
      templateId: tpl?.id ?? null,
      themeId: thm?.id ?? null,
      secondaryLocale: "ml",
    });
    revalidate(w.id);
    return { id: w.id };
  });

export const saveDraftAction = async (weddingId: string, doc: unknown) => act((a) => saveDraft(a, weddingId, doc), { area: "draft", weddingId });

export const saveSettingsAction = async (weddingId: string, patch: SettingsPatch) =>
  act(async (a) => {
    const row = await updateWeddingSettings(a, weddingId, patch);
    revalidate(weddingId);
    return { slug: row.slug };
  }, { weddingId });

export const checkSlugAction = async (weddingId: string, raw: string) =>
  act(async (a) => {
    await requireWeddingAccess(a, weddingId, { adminOnly: true });
    const slug = normalizeSlug(raw);
    const problem = slugProblem(slug);
    return { slug, ok: !problem && (await isSlugAvailable(slug, weddingId)), problem: problem ?? (!(await isSlugAvailable(slug, weddingId)) ? "That link is already taken." : null) };
  });

export const readinessAction = async (weddingId: string) => act((a) => getReadiness(a, weddingId), { weddingId });

export const publishAction = async (weddingId: string, label?: string) =>
  act(async (a) => {
    const v = await publishWedding(a, weddingId, { label });
    revalidate(weddingId);
    return { version: v.version };
  }, { area: "publish", weddingId });

export const unpublishAction = async (weddingId: string) => act(async (a) => (await unpublishWedding(a, weddingId), revalidate(weddingId), true), { weddingId });
export const archiveAction = async (weddingId: string) => act(async (a) => (await archiveWedding(a, weddingId), revalidate(weddingId), true), { weddingId });
export const restoreAction = async (weddingId: string) => act(async (a) => (await restoreWedding(a, weddingId), revalidate(weddingId), true), { weddingId });
export const setStatusAction = async (weddingId: string, status: string) => act(async (a) => (await setWeddingStatus(a, weddingId, z.enum(WEDDING_STATUSES).parse(status)), revalidate(weddingId), true), { weddingId });

export const duplicateAction = async (weddingId: string, input: { title: string; slug?: string }) =>
  act(async (a) => {
    const w = await duplicateWedding(a, weddingId, input);
    revalidate();
    return { id: w.id };
  }, { weddingId });

export const checkpointAction = async (weddingId: string, label: string) => act(async (a) => (await createCheckpoint(a, weddingId, label || "Checkpoint"), revalidate(weddingId), true), { weddingId });
export const versionsAction = async (weddingId: string) => act((a) => listVersions(a, weddingId), { weddingId });
export const rollbackAction = async (weddingId: string, versionId: string, goLive: boolean) => act(async (a) => (await rollbackToVersion(a, weddingId, versionId, { goLive }), revalidate(weddingId), true), { weddingId });

/** Regenerate section layout from a template (content is preserved; layout resets). */
export const regenerateSectionsAction = async (weddingId: string, templateId: string) =>
  act(async (a) => {
    await requireWeddingAccess(a, weddingId, { adminOnly: true });
    const tpl = await getTemplate(templateId);
    const cfg = TemplateConfig.parse(tpl.config);
    const w = await getWedding(a, weddingId);
    const ent = await getEntitlements(weddingId);
    const doc = structuredClone(w.draftDoc);
    const old = new Map(doc.sections.map((s) => [s.type, s]));
    doc.sections = generateSections(cfg, ent).map((s) => ({ ...s, content: old.get(s.type)?.content ?? {} }));
    doc.opening.variant = cfg.opening;
    await saveDraft(a, weddingId, doc);
    await updateWeddingSettings(a, weddingId, { templateId });
    revalidate(weddingId);
    return { sections: doc.sections.length };
  }, { weddingId });

// ── entitlements (per-wedding overrides) ────────────────────────────────────
export const setFeatureOverrideAction = async (weddingId: string, featureKey: string, mode: "default" | "on" | "off") =>
  act(async (a) => {
    const admin = requireAdmin(a);
    if (!isFeatureKey(featureKey)) throw invalid("Unknown feature.");
    const db = await getDb();
    if (mode === "default") await db.delete(schema.featureEntitlements).where(and(eq(schema.featureEntitlements.weddingId, weddingId), eq(schema.featureEntitlements.featureKey, featureKey)));
    else
      await db
        .insert(schema.featureEntitlements)
        .values({ weddingId, featureKey, enabled: mode === "on", createdBy: admin.userId })
        .onConflictDoUpdate({ target: [schema.featureEntitlements.weddingId, schema.featureEntitlements.featureKey], set: { enabled: mode === "on", createdBy: admin.userId } });
    await audit(admin, "entitlement.override", { weddingId, entityType: "feature", entityId: featureKey, metadata: { mode } });
    revalidate(weddingId);
    return true;
  }, { weddingId });

// ── clients ────────────────────────────────────────────────────────────────
export const assignClientAction = async (weddingId: string, input: { email: string; name: string; phone?: string }) =>
  act(async (a) => {
    const user = await assignClientToWedding(a, { weddingId, ...input, role: "OWNER" });
    const link = `${env.appUrl}/login/magic/${await createMagicLink(a, user.id)}`;
    const w = await getWedding(a, weddingId);
    await enqueue({ template: "client_invitation", channel: "EMAIL", weddingId, userId: user.id, to: user.email, vars: { name: user.name, title: w.title, link }, link });
    revalidate(weddingId);
    return { userId: user.id, link };
  }, { weddingId });

export const clientLinkAction = async (weddingId: string, userId: string) =>
  act(async (a) => {
    requireAdmin(a);
    return { link: `${env.appUrl}/login/magic/${await createMagicLink(a, userId)}` };
  }, { weddingId });

// ── platform ───────────────────────────────────────────────────────────────
export const updatePackageAction = async (key: string, patch: { name?: string; tagline?: string; blurb?: string; priceMin?: number; priceMax?: number; features?: string[]; active?: boolean }) =>
  act(async (a) => {
    const admin = requireAdmin(a);
    const row = await updatePackage(z.enum(PACKAGE_KEYS).parse(key), patch);
    await audit(admin, "package.updated", { entityType: "package", entityId: key });
    revalidate();
    return row.key;
  });

export const saveOrderAction = async (input: Parameters<typeof saveOrder>[1]) => act(async (a) => (await saveOrder(a, input), revalidate(), true));
export const deleteOrderAction = async (id: string) => act(async (a) => (await deleteOrder(a, id), revalidate(), true));
export const addDomainAction = async (weddingId: string, hostname: string) => act(async (a) => (await addDomain(a, weddingId, hostname), revalidate(), true), { weddingId });
export const removeDomainAction = async (id: string) => act(async (a) => (await removeDomain(a, id), revalidate(), true));
export const verifyDomainAction = async (id: string, verified: boolean) => act(async (a) => (await setDomainVerified(a, id, verified), revalidate(), true));
