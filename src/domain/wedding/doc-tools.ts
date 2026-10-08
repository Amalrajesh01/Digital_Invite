import type { InvitationDoc, LocalizedText } from "@/domain/doc/schema";
import { InvitationDoc as InvitationDocSchema, emptyDoc } from "@/domain/doc/schema";
import { generateSections, type TemplateConfig } from "@/domain/design/templates";
import type { Entitlements } from "@/domain/packages/entitlements";
import { newId } from "@/lib/id";
import { STARTER_CEREMONIES } from "@/domain/doc/starter-ceremonies";

/** Sensible starting content so a freshly generated invitation never looks empty. */
export function buildInitialDoc(template: TemplateConfig | null, ent: Entitlements, locale: string | null): InvitationDoc {
  const doc = emptyDoc();
  const t = (en: string, local?: string): LocalizedText => (locale && local ? { en, [locale]: local } : { en });
  doc.opening.variant = template?.opening ?? "envelope";
  if (template?.eventType) doc.eventType = template.eventType;
  doc.ceremonies.items = STARTER_CEREMONIES[doc.eventType].map((c) => ({ id: newId(), name: t(c.name), when: {}, description: t(c.description), photo: undefined, glyph: c.glyph }));
  doc.rsvp.mealOptions = [
    { id: newId(), label: t("Vegetarian", "സസ്യാഹാരം") },
    { id: newId(), label: t("Non-vegetarian", "മാംസാഹാരം") },
    { id: newId(), label: t("Jain / special diet", "പ്രത്യേക ഭക്ഷണക്രമം") },
  ];
  doc.rsvp.thankYou = t("Thank you. We can't wait to celebrate with you.", "നന്ദി. നിങ്ങളോടൊപ്പം ആഘോഷിക്കാൻ ഞങ്ങൾ കാത്തിരിക്കുന്നു.");
  doc.sections = template ? generateSections(template, ent) : [];
  return doc;
}

const isLocalizedShape = (v: unknown): v is LocalizedText => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o);
  if (!keys.length || !keys.includes("en")) return false;
  return keys.every((k) => /^[a-z]{2,3}$/.test(k) && typeof o[k] === "string");
};

/** Finds every localized string in a document (used for translation coverage in the wizard). */
export function collectLocalized(doc: unknown, base = ""): { path: string; value: LocalizedText }[] {
  const out: { path: string; value: LocalizedText }[] = [];
  const walk = (node: unknown, path: string) => {
    if (isLocalizedShape(node)) {
      out.push({ path, value: node });
      return;
    }
    if (Array.isArray(node)) node.forEach((n, i) => walk(n, `${path}[${i}]`));
    else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        if (k === "i18n") continue; // overrides are not content
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(doc, base);
  return out;
}

export function translationCoverage(doc: InvitationDoc, locale: string | null) {
  if (!locale) return { total: 0, translated: 0, missing: [] as string[] };
  const items = collectLocalized(doc).filter((i) => (i.value.en ?? "").trim().length > 0);
  const missing = items.filter((i) => !(i.value[locale] ?? "").trim()).map((i) => i.path);
  return { total: items.length, translated: items.length - missing.length, missing };
}

export interface ReadinessIssue {
  level: "error" | "warning";
  code: string;
  message: string;
  step?: string;
}

export function publishReadiness(input: {
  doc: InvitationDoc;
  slug: string;
  weddingDate: string | null;
  secondaryLocale: string | null;
  hasTemplate: boolean;
  hasTheme: boolean;
  galleryCount: number;
  hasMusic: boolean;
}): ReadinessIssue[] {
  const { doc } = input;
  const issues: ReadinessIssue[] = [];
  const err = (code: string, message: string, step?: string) => issues.push({ level: "error", code, message, step });
  const warn = (code: string, message: string, step?: string) => issues.push({ level: "warning", code, message, step });

  if (!(doc.couple.bride.name.en ?? "").trim() || !(doc.couple.groom.name.en ?? "").trim()) err("couple.names", "Add the bride's and groom's names.", "couple");
  if (!input.weddingDate) err("date", "Choose the wedding date.", "events");
  if (doc.events.length === 0) err("events.none", "Add at least one event (for example the ceremony).", "events");
  if (doc.events.length && !doc.events.some((e) => e.isMain) ) warn("events.main", "Mark one event as the main ceremony so the countdown knows where to count to.", "events");
  if (input.slug.startsWith("draft-")) err("slug", "Choose a wedding link (for example anjali-and-sidharth).", "couple");
  if (!input.hasTemplate) err("template", "Pick a template.", "template");
  if (!input.hasTheme) err("theme", "Pick a theme.", "theme");
  if (!doc.sections.some((s) => s.enabled)) err("sections", "At least one section must be switched on.", "edit");
  if (doc.events.some((e) => !e.venueId) ) warn("events.venue", "Some events have no venue yet.", "venue");
  if (!doc.couple.bride.photo && !doc.couple.groom.photo) warn("photos", "Add portraits of the couple — photographs make an invitation feel personal.", "media");
  if (input.galleryCount === 0) warn("gallery", "The gallery is empty.", "media");
  if (!input.hasMusic) warn("music", "No background music added.", "music");
  if (!doc.rsvp.deadline) warn("rsvp.deadline", "Set an RSVP deadline so guests know when to reply.", "events");
  if (input.secondaryLocale) {
    const cov = translationCoverage(doc, input.secondaryLocale);
    if (cov.missing.length) warn("translations", `${cov.missing.length} of ${cov.total} texts are not yet translated — guests who switch language will see English for those.`, "couple");
  }
  return issues;
}

export function parseDocStrict(input: unknown): InvitationDoc {
  return InvitationDocSchema.parse(input);
}
