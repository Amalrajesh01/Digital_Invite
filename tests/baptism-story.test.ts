import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { BAPTISM_SPECS } from "@/domain/design/template-specs-baptism";
import { TEMPLATE_SEEDS } from "@/domain/design/templates";
import { SECTION_META } from "@/domain/doc/sections";
import { ALLOWED_LICENCES, PHOTOS } from "@/domain/baptism/photos";
import { STORY, chapterCaption } from "@/domain/baptism/story";
import { REVEALS } from "@/domain/design/reveals";
import { SCENES } from "@/invitation/sections/grace-art";
import { roman, splitCaption } from "@/invitation/engine/format";
import { BAPTISM_DEMOS } from "../scripts/demo/baptism";

/**
 * The baby of every baptism template: the portrait that opens it, the gallery told as chapters, the finale, the blessing card.
 * (The wider category rules are in baptism.test.ts; the photograph gate itself is src/domain/baptism/check.ts.)
 */
describe("the baby of every template", () => {
  const slugs = BAPTISM_SPECS.map((s) => s.slug);

  it("has a story for every template: a face that opens it, a different baby each time, and a gallery of five to eight", () => {
    expect(Object.keys(STORY).sort()).toEqual([...slugs].sort());
    const heroes = slugs.map((s) => STORY[s].hero);
    expect(new Set(heroes).size, "every template opens on a different baby").toBe(slugs.length);
    for (const slug of slugs) {
      const st = STORY[slug];
      expect(PHOTOS[st.hero]?.face, `${slug} opens on a face`).toBe(true);
      expect(st.gallery.length, slug).toBeGreaterThanOrEqual(5);
      expect(st.gallery.length, slug).toBeLessThanOrEqual(8);
      expect(new Set(st.gallery.map(([id]) => id)).size, `${slug} shows no picture twice`).toBe(st.gallery.length);
      expect(st.gallery.some(([id]) => id === st.hero), `${slug} does not repeat its opening portrait`).toBe(false);
      expect(st.gallery.some(([id]) => PHOTOS[id]?.face), `${slug} shows a face in its gallery`).toBe(true);
    }
    const sets = slugs.map((s) => STORY[s].gallery.map(([id]) => id).sort().join("|"));
    expect(new Set(sets).size, "no two templates tell the same set of pictures").toBe(slugs.length);
  });

  it("never names two chapters of one gallery the same", () => {
    for (const slug of slugs) {
      const titles = STORY[slug].gallery.map(([, ch]) => splitCaption(chapterCaption(slug, ch)).title);
      expect(new Set(titles).size, `${slug}: ${titles.join(" / ")}`).toBe(titles.length);
    }
  });

  it("uses only photographs that exist, are described, licensed for it and credited", () => {
    const credits = readFileSync("assets/stock/CREDITS.md", "utf8");
    for (const [id, p] of Object.entries(PHOTOS)) {
      expect(existsSync(`assets/stock/${id}.jpg`), `${id}.jpg exists`).toBe(true);
      expect(p.alt.length, `${id} has alt text`).toBeGreaterThan(25);
      expect(ALLOWED_LICENCES as readonly string[], `${id} licence`).toContain(p.licence);
      expect(p.by.trim(), `${id} author`).toBeTruthy();
      expect(credits.includes("`" + id + "`"), `${id} is credited`).toBe(true);
      expect(p.alt, id).not.toMatch(/\b(bride|groom|wedding|couple|lehenga|sherwani|honeymoon)\b/i);
    }
  });

  it("tells every gallery as chapters, “Title — a line”, in more than one voice", () => {
    for (const slug of slugs) {
      for (const [, ch] of STORY[slug].gallery) {
        const c = chapterCaption(slug, ch);
        const { title, line } = splitCaption(c);
        expect(title, c).toBeTruthy();
        expect(line, c).toBeTruthy();
        expect(c.length, c).toBeLessThanOrEqual(120);
      }
    }
    expect(new Set(slugs.map((s) => chapterCaption(s, "miracle"))).size, "at least five different openings").toBeGreaterThanOrEqual(5);
    expect(splitCaption("Our little miracle — our sweetest joy.")).toEqual({ title: "Our little miracle", line: "our sweetest joy." });
    expect(splitCaption("Just a title")).toEqual({ title: "Just a title", line: "" });
    expect([1, 2, 4, 9, 10].map(roman)).toEqual(["I", "II", "IV", "IX", "X"]);
  });

  it("gives every template a gallery in a layout of its own kind, a finale after the reply, and a way to bless the child", () => {
    const layouts = new Set<string>();
    for (const s of BAPTISM_SPECS) {
      const seed = TEMPLATE_SEEDS.find((t) => t.slug === s.slug)!;
      const gal = seed.config.sections.find((x) => x.type === "gallery");
      const fin = seed.config.sections.find((x) => x.type === "finale");
      expect(gal?.variant, `${s.slug} gallery`).toBeTruthy();
      layouts.add(gal!.variant!);
      expect(["heavenly", "royal", "floral", "minimal"], `${s.slug} finale`).toContain(fin?.variant);
      const order = seed.config.sections.map((x) => x.type);
      expect(order.indexOf("finale"), `${s.slug}: the finale comes after the reply`).toBeGreaterThan(order.indexOf("rsvp"));
    }
    // the eight styles of the brief (vertical story, editorial, royal frames, floating cards, floral, minimal, reel, magazine) are all in use
    for (const l of ["story", "editorial", "frames", "cards", "floral", "minimal", "reel", "magazine"]) expect(layouts, l).toContain(l);
    const blessed = BAPTISM_SPECS.filter((s) => TEMPLATE_SEEDS.find((t) => t.slug === s.slug)!.config.sections.some((x) => x.type === "guestbook" && x.variant === "card"));
    expect(blessed.length, "templates with a blessing card").toBeGreaterThanOrEqual(10);
    for (const t of ["gallery", "guestbook", "prayer", "finale"] as const) expect(SECTION_META[t].variants.length, t).toBeGreaterThan(1);
  });

  it("opens every hero with a portrait that arrives in one of the named ways", () => {
    const keys = REVEALS.map((r) => r.key);
    for (const s of BAPTISM_SPECS) expect(keys, s.slug).toContain(SCENES[s.hero].reveal);
    expect(new Set(BAPTISM_SPECS.map((s) => SCENES[s.hero].reveal)).size, "the four reveals are all in use").toBeGreaterThanOrEqual(4);
  });

  it("shows each sample the baby, the second portrait and the gallery, taken from its story", () => {
    for (const c of BAPTISM_DEMOS) {
      const st = STORY[c.template];
      expect(c.images.couple, c.slug).toBe("hero");
      expect(c.images.story, c.slug).toBe("story");
      expect(c.needs.find(([k]) => k === "hero")?.[1], c.slug).toBe(st.hero);
      expect(c.needs.find(([k]) => k === "story")?.[1], c.slug).toBe(st.story);
      expect(c.gallery.map(([id]) => id), c.slug).toEqual(st.gallery.map(([id]) => id));
    }
  });
});
