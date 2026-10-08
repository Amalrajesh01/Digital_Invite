import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { refreshBuiltInLibrary, saveTheme } from "@/domain/design/service";
import { THEME_SEEDS } from "@/domain/design/themes";
import type { ThemeTokens } from "@/domain/design/tokens";
import { TEMPLATE_SEEDS, type TemplateConfig } from "@/domain/design/templates";
import { bootstrap } from "./helpers";

/** Turns a built-in row back into what an older release shipped (sans-serif Inter, the old section list). */
async function makeLegacy() {
  const db = await getDb();
  for (const t of THEME_SEEDS) {
    await db.update(schema.themes).set({ tokens: { ...t.tokens, fonts: { heading: "Inter", body: "Inter", script: "Inter" } } }).where(eq(schema.themes.slug, t.slug));
  }
  for (const t of TEMPLATE_SEEDS) {
    await db.update(schema.templates).set({ config: { ...t.config, sections: t.config.sections.filter((s) => s.type !== "ceremonies" && s.type !== "film") } }).where(eq(schema.templates.slug, t.slug));
  }
}

describe("refreshing the built-in design library on an existing database", () => {
  it("brings untouched built-ins up to the shipped design, versioned and audited, and is idempotent", async () => {
    const admin = await bootstrap();
    await makeLegacy();

    const first = await refreshBuiltInLibrary(admin);
    expect(first.skippedEdited).toEqual([]);
    expect(first.updated).toContain("theme:royal-gold");
    expect(first.updated).toContain("template:royal-heritage");

    const db = await getDb();
    const [royal] = await db.select().from(schema.themes).where(eq(schema.themes.slug, "royal-gold"));
    expect((royal.tokens as ThemeTokens).fonts.heading).toBe("Cormorant Garamond");
    expect(royal.version).toBe(2);
    const [tpl] = await db.select().from(schema.templates).where(eq(schema.templates.slug, "royal-heritage"));
    expect((tpl.config as TemplateConfig).sections.some((s) => s.type === "ceremonies")).toBe(true);
    const versions = await db.select().from(schema.templateVersions).where(eq(schema.templateVersions.templateId, tpl.id));
    expect(versions.map((v) => v.version).sort()).toEqual([1, 2]);
    const logged = await db.select().from(schema.auditLogs).where(and(eq(schema.auditLogs.entityId, royal.id), eq(schema.auditLogs.action, "theme.refreshed")));
    expect(logged).toHaveLength(1);

    const second = await refreshBuiltInLibrary(admin);
    expect(second.updated).toEqual([]);
    expect(second.unchanged.length).toBe(THEME_SEEDS.length + TEMPLATE_SEEDS.length);
  });

  it("never overwrites a built-in someone has edited in the studio", async () => {
    const admin = await bootstrap();
    await makeLegacy();
    const db = await getDb();
    const [rose] = await db.select().from(schema.themes).where(eq(schema.themes.slug, "rose-gold"));
    // a studio edit: the designer recolours the theme
    await saveTheme(admin, { id: rose.id, name: "Rose Gold (our pink)", tokens: { ...(rose.tokens as ThemeTokens), colors: { ...(rose.tokens as ThemeTokens).colors, primary: "#B03060" } } });

    const r = await refreshBuiltInLibrary(admin);
    expect(r.skippedEdited).toContain("theme:rose-gold");
    expect(r.updated).not.toContain("theme:rose-gold");
    const [after] = await db.select().from(schema.themes).where(eq(schema.themes.slug, "rose-gold"));
    expect(after.name).toBe("Rose Gold (our pink)");
    expect((after.tokens as ThemeTokens).colors.primary).toBe("#B03060");
    expect((after.tokens as ThemeTokens).fonts.heading).toBe("Inter"); // untouched, exactly as the studio left it
  });
});

describe("faith templates", () => {
  it("ships Christian and Muslim templates that every package may use", async () => {
    
    for (const [slug, eventType] of [["chapel-romance", "christian_wedding"], ["nikah-noor", "muslim_wedding"]] as const) {
      const t = TEMPLATE_SEEDS.find((x) => x.slug === slug);
      expect(t?.config.eventType).toBe(eventType);
      expect(t?.config.demo).toBeTruthy();
    }
  });
});
