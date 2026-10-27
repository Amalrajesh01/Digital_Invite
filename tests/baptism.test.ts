import { describe, expect, it } from "vitest";
import { BAPTISM_SPECS } from "@/domain/design/template-specs-baptism";
import { TEMPLATE_SEEDS } from "@/domain/design/templates";
import { specsFor } from "@/domain/design/template-specs";
import { THEME_SEEDS } from "@/domain/design/themes";
import { SECTION_META } from "@/domain/doc/sections";
import { CATEGORY_SLUGS, EVENT_TYPE_INFO, eventTypesIn } from "@/domain/doc/event-types";
import { STARTER_CEREMONIES } from "@/domain/doc/starter-ceremonies";
import { categoryBySlug } from "@/domain/catalogue/categories";
import { BAPTISM_SAMPLES } from "@/domain/catalogue/baptism-samples";
import { DEMOS, demosIn } from "@/domain/catalogue/demos";
import { libraryTrack } from "@/domain/music/library";
import { VERSES, TRANSLATION, verseText, verseSource } from "@/domain/baptism/scripture";
import { MANIFEST, OFF_TOPIC, SLOTS, assetIdFor } from "@/domain/baptism/images";
import { checkBaptism } from "@/domain/baptism/check";
import { GENERATED } from "@/domain/baptism/generated";
import { SCENES } from "@/invitation/sections/grace-art";
import { BAPTISM_DEMOS } from "../scripts/demo/baptism";

describe("the baptism category", () => {
  it("is a public category of its own, with its own event type, that opens quietly", () => {
    expect(CATEGORY_SLUGS as readonly string[]).toContain("baptism");
    const info = EVENT_TYPE_INFO.baptism;
    expect(info.category).toBe("baptism");
    expect(info.celebration, "nothing falls or bursts when a baptism opens").toBe("none");
    expect(eventTypesIn("baptism")).toEqual(["baptism"]);
    expect(categoryBySlug("baptism")?.group).toBe("Faith & culture");
    expect(STARTER_CEREMONIES.baptism.length).toBeGreaterThanOrEqual(3);
  });

  it("offers exactly twenty-five designs, the flagship first", () => {
    expect(BAPTISM_SPECS).toHaveLength(25);
    expect(specsFor("baptism").map((s) => s.slug)).toHaveLength(25);
    expect(specsFor("baptism")[0].slug).toBe("a-new-beginning");
    for (const s of BAPTISM_SPECS) { expect(s.category).toBe("baptism"); expect(s.eventType).toBe("baptism"); }
  });

  it("are twenty-five different designs, not twenty-five recolours", () => {
    const all = BAPTISM_SPECS;
    expect(new Set(all.map((s) => s.name)).size, "names").toBe(25);
    expect(new Set(all.map((s) => s.slug)).size, "slugs").toBe(25);
    expect(new Set(all.map((s) => s.theme)).size, "palettes").toBe(25);
    expect(new Set(all.map((s) => s.hero)).size, "hero scenes").toBe(25);
    expect(new Set(all.map((s) => s.demo)).size, "samples").toBe(25);
    expect(new Set(all.map((s) => s.concept)).size, "concepts").toBe(25);
    const primaries = all.map((s) => THEME_SEEDS.find((t) => t.slug === s.theme)?.tokens.colors.primary);
    expect(new Set(primaries).size, "primary colours").toBeGreaterThanOrEqual(24);
    const count = (f: (s: (typeof all)[number]) => string) => { const m = new Map<string, number>(); for (const s of all) m.set(f(s), (m.get(f(s)) ?? 0) + 1); return Math.max(...m.values()); };
    expect(new Set(all.map((s) => s.opening)).size, "distinct openings").toBeGreaterThanOrEqual(17);
    expect(count((s) => s.opening), "most-used opening").toBeLessThanOrEqual(2);
    expect(new Set(all.map((s) => s.direction)).size, "distinct directions").toBeGreaterThanOrEqual(11);
    expect(new Set(all.map((s) => JSON.stringify(s.flow))).size, "section arrangements").toBe(25);
  });

  it("carry the whole differentiation matrix, music that exists, and a scene that is drawn", () => {
    for (const s of BAPTISM_SPECS) {
      for (const k of ["concept", "tagline", "tone", "story", "gallery", "transition", "mobile", "images", "motion"] as const) expect(s[k], `${s.slug} ${k}`).toBeTruthy();
      expect(s.tags?.length, `${s.slug} tags`).toBeGreaterThan(0);
      expect(s.music?.length, `${s.slug} music`).toBeGreaterThan(0);
      for (const id of s.music ?? []) expect(libraryTrack(id), `${s.slug} music ${id}`).toBeTruthy();
      expect(SCENES[s.hero], `${s.slug} scene ${s.hero}`).toBeTruthy();
      expect(SECTION_META.hero.variants.map((v) => v.key), `${s.slug} hero variant`).toContain(s.hero);
      expect(s.opening, s.slug).not.toBe("balloons");
      expect(s.opening, s.slug).not.toBe("ticket");
      expect(s.direction, s.slug).not.toBe("playful");
    }
  });

  it("make valid templates, each with the RSVP, the venue and the livestream, and a verse and a family section", () => {
    for (const s of BAPTISM_SPECS) {
      const seed = TEMPLATE_SEEDS.find((t) => t.slug === s.slug);
      expect(seed, s.slug).toBeTruthy();
      const types = seed!.config.sections.map((x) => x.type);
      expect(types[0]).toBe("hero");
      expect(new Set(types).size, `${s.slug} repeats a section`).toBe(types.length);
      for (const need of ["rsvp", "venue", "livestream", "events", "prayer", "people", "about", "gallery", "finale"] as const) expect(types, `${s.slug} ${need}`).toContain(need);
      for (const sec of seed!.config.sections) if (sec.variant) expect(SECTION_META[sec.type].variants.map((v) => v.key), `${s.slug}/${sec.type}`).toContain(sec.variant);
    }
  });
});

describe("the baptism sample invitations", () => {
  it("are twenty-five, one per template, and agree with the shop window", () => {
    expect(BAPTISM_DEMOS).toHaveLength(25);
    expect(demosIn("baptism")).toHaveLength(25);
    for (const spec of BAPTISM_SPECS) {
      const cfg = BAPTISM_DEMOS.find((d) => d.template === spec.slug)!;
      const f = BAPTISM_SAMPLES[spec.slug];
      expect(cfg.slug, spec.slug).toBe(spec.demo);
      expect(cfg.theme).toBe(spec.theme);
      expect(cfg.date).toBe(f.date);
      expect(cfg.headline.title).toBe(f.child);
      expect(cfg.venues[0].name).toBe(f.church);
      expect(cfg.venues[0].city).toBe(f.city);
      expect(cfg.eventType).toBe("baptism");
      expect(new Date(`${f.date}T12:00:00Z`).getUTCDay(), `${f.child}'s baptism is on a Sunday`).toBe(0);
      expect(DEMOS.some((d) => d.slug === spec.demo && d.eventType === "baptism"), spec.slug).toBe(true);
    }
    expect(new Set(BAPTISM_DEMOS.map((d) => d.headline.title)).size, "children").toBe(25);
  });

  it("introduce a family in the family’s own words, and only show what is there", () => {
    for (const c of BAPTISM_DEMOS) {
      const groups = new Set((c.people ?? []).map((p) => p.group.toLowerCase()));
      expect(c.people?.length, c.slug).toBeGreaterThanOrEqual(3);
      expect([...groups].some((g) => /parent|mother|family|church/.test(g)), `${c.slug} names its parents`).toBe(true);
      expect(c.contacts[0][1], c.slug).toMatch(/Stack Bridge Labs/);
    }
    const grandparentLed = BAPTISM_DEMOS.find((c) => c.template === "generations-of-faith")!;
    expect(grandparentLed.message?.from, "the grandparents write first").toMatch(/Kalapurackal/);
    expect(grandparentLed.people!.filter((p) => /grandmother|achamma|appachan|ammachi/i.test(`${p.group} ${p.relation}`)).length, "grandparents named").toBeGreaterThanOrEqual(4);
  });
});

describe("the scripture", () => {
  it("is a list of unique verses of one named, public-domain translation, each with a reference", () => {
    expect(TRANSLATION.id).toBe("kjv");
    expect(TRANSLATION.licence).toBe("Public domain");
    expect(new Set(VERSES.map((v) => v.id)).size).toBe(VERSES.length);
    for (const v of VERSES) {
      expect(v.ref, v.id).toMatch(/^(\d )?[A-Z][a-z]+ \d+:\d+(–\d+)?$/);
      expect(v.text.length, v.id).toBeGreaterThan(20);
      expect(verseSource(v)).toBe(`${v.ref} · KJV`);
    }
    for (const needed of ["Psalm 127:3", "Proverbs 22:6", "Matthew 19:14", "Mark 10:16", "Numbers 6:24–26", "Isaiah 43:1", "Psalm 139:14", "Jeremiah 1:5", "Matthew 28:19", "Romans 6:4"]) expect(VERSES.some((v) => v.ref === needed), needed).toBe(true);
  });

  it("is quoted exactly: every sample prints a verse from the list, unaltered, and each template quotes a different one", () => {
    const used = new Set<string>();
    for (const c of BAPTISM_DEMOS) {
      const v = VERSES.find((x) => verseText(x) === c.prayer?.text && verseSource(x) === c.prayer?.source);
      expect(v, `${c.slug} quotes a verse that is not in the verified list`).toBeTruthy();
      used.add(v!.id);
    }
    expect(used.size, "verses used").toBe(25);
  });

  it("never prints a quotation that starts mid-sentence without saying so, or ends on a bare colon", () => {
    for (const v of VERSES) {
      const t = verseText(v);
      expect(t, v.id).toMatch(/[.!?]$/);
      if (/^[a-z]/.test(v.text)) expect(t, v.id).toMatch(/^…/);
    }
  });
});

describe("the baptism photography", () => {
  it("accounts for every slot of every template, with a prompt of its own and nothing off-topic in it", () => {
    expect(MANIFEST).toHaveLength(25 * SLOTS.length);
    expect(new Set(MANIFEST.map((r) => r.prompt)).size, "prompts").toBe(MANIFEST.length);
    expect(new Set(MANIFEST.map((r) => r.assetId)).size, "asset ids").toBe(MANIFEST.length);
    for (const r of MANIFEST) {
      expect(r.prompt, `${r.templateId}/${r.slot}`).not.toMatch(OFF_TOPIC);
      expect(r.assetId).toBe(assetIdFor(r.templateId, r.slot));
      expect(r.approved, "approval is the owner’s, never the code’s").toBe(false);
    }
  });

  it("passes its own gate: files present, licensed, described, never a wedding picture, never reused for another template", async () => {
    const findings = await checkBaptism();
    expect(findings.filter((f) => f.level === "error").map((f) => `${f.templateId}/${f.slot}: ${f.message}`)).toEqual([]);
  });

  it("claims nothing it did not do: stand-ins are licensed photographs, and a generated picture always says what made it", () => {
    expect(MANIFEST.filter((r) => r.status === "stand-in").every((r) => r.source === "licensed")).toBe(true);
    for (const r of MANIFEST.filter((x) => x.status === "generated")) { expect(GENERATED[r.assetId].tool, r.assetId).toBeTruthy(); expect(GENERATED[r.assetId].date, r.assetId).toBeTruthy(); }
  });
});
