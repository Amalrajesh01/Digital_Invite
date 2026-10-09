import { describe, expect, it } from "vitest";
import { InvitationDoc, parseDoc, emptyDoc } from "@/domain/doc/schema";
import { EVENT_TYPES, EVENT_TYPE_INFO, celebrationFor, figureStyleFor, journeyEnabled } from "@/domain/doc/event-types";
import { IMAGE_SLOTS, IMAGE_SLOT_KEYS, assignSlot, ownSlotValue, resolveSlot } from "@/domain/imagery/slots";
import { filmSourceFromUrl } from "@/invitation/engine/format";
import { THEME_SEEDS } from "@/domain/design/themes";
import { FONT_CHOICES, ThemeTokens, googleFontsHref } from "@/domain/design/tokens";
import { TEMPLATE_SEEDS, TemplateConfig, generateSections } from "@/domain/design/templates";
import { resolveEntitlements } from "@/domain/packages/entitlements";
import { defaultFeaturesFor } from "@/domain/packages/features";
import { buildInitialDoc } from "@/domain/wedding/doc-tools";
import { EN, ML } from "@/invitation/i18n/strings";
import { buildAnanyaDoc, type AnanyaMedia } from "../scripts/demo/ananya";
import { buildDemoDoc, type DemoMedia } from "../scripts/demo/content";

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("the experience layer is backwards compatible", () => {
  it("a document saved before it existed parses as a Hindu wedding with every new feature at its default", () => {
    const old = parseDoc({ couple: { bride: { name: { en: "A" } }, groom: { name: { en: "B" } } }, sections: [] });
    expect(old.eventType).toBe("hindu_wedding");
    expect(old.journey).toEqual({ enabled: true, style: "auto", headZoom: { bride: 1, groom: 1 } });
    expect(old.opening.celebration).toBe("auto");
    expect(old.images).toEqual({});
    expect(old.ceremonies.items).toEqual([]);
    expect(old.film.url).toBe("");
    expect(old.whatsapp.number).toBe("");
    expect(old.story.milestones).toEqual([]);
  });

  it("rejects an occasion that does not exist", () => {
    expect(InvitationDoc.safeParse({ eventType: "garden_party" }).success).toBe(false);
    for (const k of EVENT_TYPES) expect(InvitationDoc.safeParse({ eventType: k }).success).toBe(true);
  });
});

describe("event types", () => {
  it("every occasion has a label, a celebration and — for confetti — a palette", () => {
    const labels = new Set<string>();
    for (const k of EVENT_TYPES) {
      const i = EVENT_TYPE_INFO[k];
      expect(i.label.length).toBeGreaterThan(2);
      labels.add(i.label);
      if (i.celebration === "confetti") expect(i.confetti.length).toBeGreaterThanOrEqual(4);
    }
    expect(labels.size).toBe(EVENT_TYPES.length);
  });

  it("Hindu weddings get petals; the others get confetti from the sides", () => {
    const doc = (eventType: (typeof EVENT_TYPES)[number], celebration: "auto" | "petals" | "confetti" | "off" = "auto") => ({ eventType, opening: { celebration } });
    expect(celebrationFor(doc("hindu_wedding"))).toBe("petals");
    for (const k of ["christian_wedding", "muslim_wedding", "engagement", "reception", "birthday", "anniversary"] as const) expect(celebrationFor(doc(k))).toBe("confetti");
  });

  it("an explicit choice overrides the occasion, and 'off' plays nothing", () => {
    expect(celebrationFor({ eventType: "hindu_wedding", opening: { celebration: "confetti" } })).toBe("confetti");
    expect(celebrationFor({ eventType: "christian_wedding", opening: { celebration: "petals" } })).toBe("petals");
    expect(celebrationFor({ eventType: "hindu_wedding", opening: { celebration: "off" } })).toBeNull();
  });

  it("the walking couple suits occasions with two people and picks outfits to match", () => {
    expect(journeyEnabled({ eventType: "birthday", journey: { enabled: true } })).toBe(false);
    expect(journeyEnabled({ eventType: "hindu_wedding", journey: { enabled: false } })).toBe(false);
    expect(journeyEnabled({ eventType: "engagement", journey: { enabled: true } })).toBe(true);
    expect(figureStyleFor({ eventType: "hindu_wedding", journey: { style: "auto" } })).toBe("classic");
    expect(figureStyleFor({ eventType: "christian_wedding", journey: { style: "auto" } })).toBe("western");
    expect(figureStyleFor({ eventType: "hindu_wedding", journey: { style: "kerala" } })).toBe("kerala");
  });
});

describe("centralised image slots", () => {
  it("has a definition for every slot", () => {
    expect(Object.keys(IMAGE_SLOTS).sort()).toEqual([...IMAGE_SLOT_KEYS].sort());
    for (const k of IMAGE_SLOT_KEYS) expect(IMAGE_SLOTS[k].ratio.length).toBeGreaterThan(3);
  });

  it("falls back gracefully when a customer has not chosen a photograph for a slot", () => {
    const d = emptyDoc();
    expect(resolveSlot({ doc: d }, "couple")).toBeUndefined();
    expect(resolveSlot({ doc: d, gallery: [{ items: [{ id: ID(9) }] }] }, "couple")).toBe(ID(9));
    d.couple.groom.photo = ID(2);
    expect(resolveSlot({ doc: d, gallery: [] }, "couple")).toBe(ID(2));
    d.couple.bride.photo = ID(1);
    expect(resolveSlot({ doc: d, gallery: [] }, "couple")).toBe(ID(1));
    d.images.couple = ID(3);
    expect(resolveSlot({ doc: d }, "couple")).toBe(ID(3));
    expect(resolveSlot({ doc: d }, "bride")).toBe(ID(1));
    expect(resolveSlot({ doc: d }, "family")).toBeUndefined(); // no stand-in: the section is typographic
  });

  it("the story photograph prefers its own slot, then 'how we met', then the couple photograph", () => {
    const d = emptyDoc();
    d.images.couple = ID(1);
    expect(resolveSlot({ doc: d }, "story")).toBe(ID(1));
    d.story.howWeMet.photo = ID(2);
    expect(resolveSlot({ doc: d }, "story")).toBe(ID(2));
    d.images.story = ID(3);
    expect(resolveSlot({ doc: d }, "story")).toBe(ID(3));
  });

  it("choosing a couple photograph retires an older hero-only override so the new photo actually shows", () => {
    const d = buildInitialDoc(TEMPLATE_SEEDS[0].config, resolveEntitlements("ESSENTIAL", defaultFeaturesFor("ESSENTIAL")), null);
    const hero = d.sections.find((s) => s.type === "hero")!;
    hero.content = { background: ID(7) };
    expect(resolveSlot({ doc: d }, "couple")).toBe(ID(7));
    assignSlot(d, "couple", ID(8));
    expect(resolveSlot({ doc: d }, "couple")).toBe(ID(8));
    expect(ownSlotValue(d, "couple")).toBe(ID(8));
  });

  it("assigns every slot to the field that holds it", () => {
    const d = emptyDoc();
    d.venues = [{ id: "v1", name: {}, address: {}, city: {}, mapUrl: "", parking: { info: {}, mapUrl: "" }, directions: { airport: {}, railway: {}, road: {} }, landmarkMap: { pins: [] }, hotels: [], nearby: [], shuttle: { info: {}, schedule: [] }, guide: [] }] as never;
    IMAGE_SLOT_KEYS.forEach((slot, i) => {
      assignSlot(d, slot, ID(i + 1));
      expect(ownSlotValue(d, slot)).toBe(ID(i + 1));
    });
    assignSlot(d, "ceremony", undefined);
    expect(ownSlotValue(d, "ceremony")).toBeUndefined();
  });
});

describe("the wedding film only ever plays what the page builds itself", () => {
  it("accepts YouTube, Vimeo and direct https video files", () => {
    expect(filmSourceFromUrl("https://www.youtube.com/watch?v=abc123")).toEqual({ kind: "embed", src: "https://www.youtube-nocookie.com/embed/abc123?rel=0&autoplay=1" });
    expect(filmSourceFromUrl("https://youtu.be/abc123")?.kind).toBe("embed");
    expect(filmSourceFromUrl("https://vimeo.com/76979871")).toEqual({ kind: "embed", src: "https://player.vimeo.com/video/76979871?autoplay=1" });
    expect(filmSourceFromUrl("https://cdn.example.com/film.mp4")).toEqual({ kind: "file", src: "https://cdn.example.com/film.mp4" });
    expect(filmSourceFromUrl("https://cdn.example.com/film.webm?v=2")?.kind).toBe("file");
  });

  it("refuses everything else: plain http, scripts, other pages, empty", () => {
    for (const bad of ["", "   ", "http://cdn.example.com/film.mp4", "javascript:alert(1)", "data:text/html,<script>1</script>", "https://evil.example.com/page.html", "https://evil.example.com/watch?v=1", "ftp://x/y.mp4"]) {
      expect(filmSourceFromUrl(bad), bad).toBeNull();
    }
  });
});

describe("typography", () => {
  it("every built-in theme is valid and uses fonts the platform can load", () => {
    for (const t of THEME_SEEDS) {
      expect(ThemeTokens.safeParse(t.tokens).success, t.slug).toBe(true);
      expect(FONT_CHOICES.heading).toContain(t.tokens.fonts.heading);
      expect(FONT_CHOICES.body).toContain(t.tokens.fonts.body);
      expect(FONT_CHOICES.script).toContain(t.tokens.fonts.script);
    }
  });

  it("the elegant themes pair a display serif with Inter, and the serif loads with its italic", () => {
    const royal = THEME_SEEDS.find((t) => t.slug === "royal-gold")!;
    expect(royal.tokens.fonts).toEqual({ heading: "Cormorant Garamond", body: "Inter", script: "Cormorant Garamond" });
    const href = googleFontsHref([royal.tokens.fonts.heading, royal.tokens.fonts.body])!;
    expect(href).toContain("Cormorant+Garamond:ital,wght@0,300");
    expect(href).toContain("1,500");
  });
});

describe("templates tell the story in order", () => {
  const ent = resolveEntitlements("ESSENTIAL", defaultFeaturesFor("ESSENTIAL"));
  it("every template configuration is valid", () => {
    for (const t of TEMPLATE_SEEDS) expect(TemplateConfig.safeParse(t.config).success, t.slug).toBe(true);
  });

  // the traditional Indian wedding templates share one story; the other occasions tell their own (see occasions.test.ts)
  const traditional = TEMPLATE_SEEDS.filter((t) => !t.config.eventType || ["hindu_wedding", "christian_wedding", "muslim_wedding"].includes(t.config.eventType));

  it("traditional wedding sections run hero → story → beginning → countdown → couple → days → ceremonies → families → gallery → film → RSVP", () => {
    expect(traditional.length).toBeGreaterThanOrEqual(6);
    for (const t of traditional) {
      const types = generateSections(t.config, ent).map((s) => s.type);
      const at = (x: string) => types.indexOf(x as never);
      const chain = ["hero", "story", "timeline", "countdown", "couple", "events", "ceremonies", "family", "gallery", "film", "rsvp"];
      chain.forEach((x, i) => {
        expect(at(x), `${t.slug}: ${x}`).toBeGreaterThanOrEqual(0);
        if (i) expect(at(x), `${t.slug}: ${chain[i - 1]} before ${x}`).toBeGreaterThan(at(chain[i - 1]));
      });
    }
  });

  it("every template, of any occasion, opens with its hero and asks for the reply before the day itself", () => {
    for (const t of TEMPLATE_SEEDS) {
      const types = generateSections(t.config, ent).map((s) => s.type);
      expect(types[0], t.slug).toBe("hero");
      expect(types, t.slug).toContain("rsvp");
      if (types.includes("livesched")) expect(types.indexOf("rsvp"), t.slug).toBeLessThan(types.indexOf("livesched"));
    }
  });

  it("the royal and cinematic templates open on the full-screen photograph", () => {
    for (const slug of ["royal-heritage", "cinematic-noir"]) {
      const t = TEMPLATE_SEEDS.find((x) => x.slug === slug)!;
      expect(generateSections(t.config, ent).find((s) => s.type === "hero")?.variant).toBe("fullbleed");
    }
  });
});

describe("interface strings", () => {
  it("Malayalam is complete: every English string has a Malayalam one", () => {
    for (const k of Object.keys(EN)) expect((ML as Record<string, string>)[k]?.trim(), k).toBeTruthy();
  });
});

describe("the demonstration weddings are valid documents", () => {
  const ent = resolveEntitlements("LUXURY", defaultFeaturesFor("LUXURY"));
  const base = (locale: string | null) => buildInitialDoc(TEMPLATE_SEEDS[1].config, ent, locale);

  it("Ananya & Arjun (north Indian, English)", () => {
    const m: AnanyaMedia = {
      hero: ID(1), heroWide: ID(2), couple: ID(3), bride: ID(4), groom: ID(5), venue: ID(6), ceremony: ID(7), family: ID(8), story: ID(9), og: ID(10),
      gallery: [], events: { mehendi: ID(11), sangeet: ID(12), wedding: ID(13), reception: ID(14) },
      ceremonies: { haldi: ID(15), mehendi: ID(16), baraat: ID(17), kanyadaan: ID(18), phera: ID(19), reception: ID(20) },
      milestones: { first: ID(21), chapter: ID(22), promise: ID(23), wedding: ID(24) },
    };
    const doc = InvitationDoc.parse(buildAnanyaDoc(base(null), m));
    expect(doc.eventType).toBe("hindu_wedding");
    expect(doc.images.coupleWide).toBe(ID(2));
    expect(doc.story.milestones.map((x) => x.year)).toEqual(["2019", "2021", "2024", "2026"]);
    expect(doc.events.map((e) => e.name.en)).toEqual(["Mehendi", "Sangeet", "The Wedding", "Reception"]);
    expect(doc.events.filter((e) => e.isMain)).toHaveLength(1);
    expect(doc.ceremonies.items.length).toBeGreaterThanOrEqual(6);
    expect(doc.story.intro.en.split("\n")).toHaveLength(4);
  });

  it("Meenakshi & Aravind (Kerala, English + Malayalam)", () => {
    const m: DemoMedia = {
      hero: ID(1), bride: ID(2), groom: ID(3), venue: ID(4), gallery: [], og: ID(5), puzzleA: ID(6), puzzleB: ID(7), clipA: ID(8), clipB: ID(9),
      story: { cafe: ID(10), corridor: ID(11), train: ID(12), thenA: ID(13), thenB: ID(14) }, family: ID(15),
    };
    const doc = InvitationDoc.parse(buildDemoDoc(base("ml"), m, { full: true }));
    expect(doc.journey.style).toBe("kerala");
    for (const mile of doc.story.milestones) expect(mile.title.ml?.trim(), mile.title.en).toBeTruthy();
    for (const c of doc.ceremonies.items) expect(c.name.ml?.trim(), c.name.en).toBeTruthy();
    expect(doc.sections.find((s) => s.type === "story")?.settings.showChapters).toBe(false);
  });
});
