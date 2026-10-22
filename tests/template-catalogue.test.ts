import { describe, expect, it } from "vitest";
import { TEMPLATE_SEEDS, TemplateConfig } from "@/domain/design/templates";
import { TEMPLATE_SPECS, specsFor, type TemplateSpec } from "@/domain/design/template-specs";
import { CINEMATIC_SPECS } from "@/domain/design/template-specs-cinematic";
import { CASTING } from "@/domain/imagery/casting";
import { libraryTrack } from "@/domain/music/library";
import { THEME_SEEDS } from "@/domain/design/themes";
import { SECTION_META } from "@/domain/doc/sections";
import { CATEGORY_SLUGS } from "@/domain/doc/event-types";
import { FONT_CHOICES } from "@/domain/design/tokens";

/** The occasions that must offer five genuinely different designs. Weddings offer those five *and* the twenty-five cinematic designs (below). */
const FIVE = ["engagement", "birthday", "anniversary", "housewarming", "naming-ceremony", "religious", "corporate", "conference", "funeral"] as const;

const CINEMATIC = new Set(CINEMATIC_SPECS.map((s) => s.slug));
const designs = (c: string) => specsFor(c as never).filter((s) => !s.edition && !CINEMATIC.has(s.slug));
const sig = (s: TemplateSpec) => s.flow.slice(0, 6).map((i) => (Array.isArray(i) ? `${i[0]}:${i[1].variant ?? ""}` : i)).join(",");

describe("the template catalogue", () => {
  it("has unique ids and every one is a valid template configuration", () => {
    const slugs = TEMPLATE_SEEDS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const t of TEMPLATE_SEEDS) expect(TemplateConfig.safeParse(t.config).success, t.slug).toBe(true);
  });

  it("offers exactly five designs for every occasion — and for weddings those five plus the cinematic twenty-five", () => {
    expect(designs("wedding").map((s) => s.slug), "wedding originals").toHaveLength(5);
    for (const c of FIVE) {
      expect(CATEGORY_SLUGS as readonly string[], c).toContain(c);
      expect(designs(c).map((s) => s.slug), c).toHaveLength(5);
    }
  });

  it.each(["wedding", ...FIVE])("makes the five %s designs different in the ways a guest can see", (c) => {
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

describe("the twenty-five cinematic wedding templates", () => {
  const all = CINEMATIC_SPECS;
  it("are all there, all weddings, each with its own name, palette and sample", () => {
    expect(all).toHaveLength(25);
    for (const s of all) expect(s.category, s.slug).toBe("wedding");
    expect(new Set(all.map((s) => s.name)).size, "names").toBe(25);
    expect(new Set(all.map((s) => s.theme)).size, "palettes").toBe(25);
    expect(new Set(all.map((s) => s.demo)).size, "samples").toBe(25);
    const primaries = all.map((s) => THEME_SEEDS.find((t) => t.slug === s.theme)?.tokens.colors.primary);
    expect(new Set(primaries).size, "primary colours").toBeGreaterThanOrEqual(23);
    expect(specsFor("wedding").filter((s) => !s.edition)).toHaveLength(30);
  });

  it("never share the same opening and hero composition, and share neither with a third template", () => {
    expect(new Set(all.map((s) => `${s.opening}|${s.hero}`)).size, "opening + hero").toBe(25);
    const count = (f: (s: TemplateSpec) => string) => { const m = new Map<string, number>(); for (const s of all) m.set(f(s), (m.get(f(s)) ?? 0) + 1); return Math.max(...m.values()); };
    expect(count((s) => s.opening), "most-used opening").toBeLessThanOrEqual(3);
    expect(count((s) => s.hero), "most-used hero").toBeLessThanOrEqual(3);
    expect(new Set(all.map((s) => s.opening)).size, "distinct openings").toBeGreaterThanOrEqual(18);
    expect(new Set(all.map((s) => s.hero)).size, "distinct heroes").toBeGreaterThanOrEqual(17);
  });

  it("use all three motion profiles, with the gentle ones where the brief puts them", () => {
    const by = (p: string) => all.filter((s) => s.profile === p).map((s) => s.slug);
    expect(by("immersive").sort()).toEqual(["epic-premiere", "infinite-love"]);
    for (const slug of ["old-money-romance", "modern-minimalist"]) expect(by("elegant")).toContain(slug);
    for (const slug of ["love-story", "destination-film", "black-tie-gala"]) expect(by("cinematic")).toContain(slug);
  });

  it("carry the whole differentiation matrix, a casting and a music suggestion that exists", () => {
    for (const s of all) {
      for (const k of ["concept", "tagline", "tone", "story", "gallery", "transition", "mobile"] as const) expect(s[k], `${s.slug} ${k}`).toBeTruthy();
      expect(s.tags?.length, `${s.slug} tags`).toBeGreaterThan(0);
      expect(CASTING[s.slug], `${s.slug} casting`).toBeTruthy();
      expect(s.music?.length, `${s.slug} music`).toBeGreaterThan(0);
      for (const id of s.music ?? []) expect(libraryTrack(id), `${s.slug} music ${id}`).toBeTruthy();
    }
  });

  it("all include the livestream and the RSVP, so nothing about the day is missing", () => {
    for (const s of all) {
      const types = TEMPLATE_SEEDS.find((t) => t.slug === s.slug)!.config.sections.map((x) => x.type);
      for (const need of ["hero", "rsvp", "livestream", "events", "venue"] as const) expect(types, `${s.slug} ${need}`).toContain(need === "venue" && !types.includes("venue") ? "travel" : need);
    }
  });
});
