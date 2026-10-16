import { describe, expect, it } from "vitest";
import { TEMPLATE_SEEDS, TemplateConfig } from "@/domain/design/templates";
import { TEMPLATE_SPECS, specsFor, type TemplateSpec } from "@/domain/design/template-specs";
import { THEME_SEEDS } from "@/domain/design/themes";
import { SECTION_META } from "@/domain/doc/sections";
import { CATEGORY_SLUGS } from "@/domain/doc/event-types";
import { FONT_CHOICES } from "@/domain/design/tokens";

/** The occasions that must offer five genuinely different designs. */
const FIVE = ["wedding", "engagement", "birthday", "anniversary", "housewarming", "naming-ceremony", "religious", "corporate", "conference", "funeral"] as const;

const designs = (c: string) => specsFor(c as never).filter((s) => !s.edition);
const sig = (s: TemplateSpec) => s.flow.slice(0, 6).map((i) => (Array.isArray(i) ? `${i[0]}:${i[1].variant ?? ""}` : i)).join(",");

describe("the template catalogue", () => {
  it("has unique ids and every one is a valid template configuration", () => {
    const slugs = TEMPLATE_SEEDS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const t of TEMPLATE_SEEDS) expect(TemplateConfig.safeParse(t.config).success, t.slug).toBe(true);
  });

  it("offers exactly five designs for every occasion", () => {
    for (const c of FIVE) {
      expect(CATEGORY_SLUGS as readonly string[], c).toContain(c);
      expect(designs(c).map((s) => s.slug), c).toHaveLength(5);
    }
  });

  it.each(FIVE)("makes the five %s designs different in the ways a guest can see", (c) => {
    const five = designs(c);
    const unique = (f: (s: TemplateSpec) => string) => new Set(five.map(f)).size;
    expect(unique((s) => s.opening), "openings").toBe(5);
    expect(unique((s) => s.hero), "hero compositions").toBe(5);
    expect(unique((s) => s.direction), "visual directions").toBe(5);
    expect(unique((s) => s.theme), "colour themes").toBe(5);
    expect(unique(sig), "the way the story begins").toBe(5);
    const primaries = five.map((s) => THEME_SEEDS.find((t) => t.slug === s.theme)?.tokens.colors.primary);
    expect(new Set(primaries).size, "palettes").toBe(5);
    expect(unique((s) => s.name), "names").toBe(5);
  });

  it("only uses themes, section variants and fonts that exist, and never repeats a section", () => {
    for (const s of TEMPLATE_SPECS) {
      expect(THEME_SEEDS.some((t) => t.slug === s.theme), `${s.slug} theme ${s.theme}`).toBe(true);
      const types = [s.hero, ...s.flow].length && TEMPLATE_SEEDS.find((t) => t.slug === s.slug)!.config.sections;
      if (!types) continue;
      const seen = new Set<string>();
      expect(types[0].type, s.slug).toBe("hero");
      expect(types[0].variant, s.slug).toBe(s.hero);
      for (const sec of types) {
        expect(seen.has(sec.type), `${s.slug} repeats ${sec.type}`).toBe(false);
        seen.add(sec.type);
        const meta = SECTION_META[sec.type];
        if (sec.variant) expect(meta.variants.map((v) => v.key), `${s.slug}/${sec.type}`).toContain(sec.variant);
      }
    }
    for (const t of THEME_SEEDS) {
      expect(FONT_CHOICES.heading as readonly string[], `${t.slug} heading font`).toContain(t.tokens.fonts.heading);
      expect(FONT_CHOICES.body as readonly string[], `${t.slug} body font`).toContain(t.tokens.fonts.body);
      expect(FONT_CHOICES.script as readonly string[], `${t.slug} script font`).toContain(t.tokens.fonts.script);
    }
  });

  it("keeps the memorial designs free of anything festive", () => {
    for (const s of specsFor("funeral")) {
      expect(["playful"], s.slug).not.toContain(s.direction);
      expect(["balloons", "ticket"], s.slug).not.toContain(s.opening);
    }
  });
});
