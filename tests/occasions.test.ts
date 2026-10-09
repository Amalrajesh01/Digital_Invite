import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { InvitationDoc, emptyDoc, parseDoc } from "@/domain/doc/schema";
import { SECTION_TYPES } from "@/domain/doc/constants";
import { SECTION_META } from "@/domain/doc/sections";
import { CATEGORY_SLUGS, EVENT_TYPES, EVENT_TYPE_INFO, celebrationFor, eventTypesIn, isCoupleEvent, journeyEnabled, subjectKind, toneOf } from "@/domain/doc/event-types";
import { STARTER_CEREMONIES } from "@/domain/doc/starter-ceremonies";
import { TEMPLATE_SEEDS, TemplateConfig, generateSections } from "@/domain/design/templates";
import { THEME_SEEDS } from "@/domain/design/themes";
import { ThemeTokens } from "@/domain/design/tokens";
import { resolveEntitlements } from "@/domain/packages/entitlements";
import { defaultFeaturesFor } from "@/domain/packages/features";
import { buildInitialDoc, publishReadiness } from "@/domain/wedding/doc-tools";
import { sectionIsVisible } from "@/domain/wedding/view";
import { loadPublicInvitation } from "@/domain/wedding/public";
import { CATEGORIES, categoryBySlug } from "@/domain/catalogue/categories";
import { DEMOS, demoBySlug, demosIn, primaryCategory, sectionLabels, templateOf, themeOf } from "@/domain/catalogue/demos";
import { FAQ_ALL, FAQ_GROUPS } from "@/domain/catalogue/faq";
import { loadPublicPackages } from "@/domain/catalogue/pricing";
import { STOCK, stockInfo, STOCK_ID } from "@/domain/imagery/stock";
import { EN, EVENT_VOICES, ML, makeTranslator } from "@/invitation/i18n/strings";
import { initialsOf } from "@/invitation/engine/subject";
import { enquiryLink, enquiryMessage, waLink } from "@/lib/whatsapp";
import { brand } from "@/lib/brand";
import { absoluteUrl } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { getDb, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { GET as stockRoute } from "@/app/stock/[id]/route";
import { GET as pricingApi, OPTIONS as pricingOptions } from "@/app/api/public/pricing/route";
import { buildShowcaseDoc, type ShowcaseCfg } from "../scripts/demo/showcase";
import { buildOccasionDoc, type OccasionCfg } from "../scripts/demo/occasion";
import { ISHA } from "../scripts/demo/isha";
import { TARA } from "../scripts/demo/tara";
import { HELEN } from "../scripts/demo/helen";
import { MEERA } from "../scripts/demo/meera";
import { AARAV } from "../scripts/demo/aarav";
import { AADHYA } from "../scripts/demo/aadhya";
import { CONCLAVE } from "../scripts/demo/conclave";
import { SUMMIT } from "../scripts/demo/summit";
import { THOMAS } from "../scripts/demo/thomas";
import { CHRISTIAN } from "../scripts/demo/christian";
import { MUSLIM } from "../scripts/demo/muslim";
import { ANANYA } from "../scripts/demo/ananya";
import { DEMO } from "../scripts/demo/content";
import { bootstrap, makeWedding } from "./helpers";
import type { AdminActor } from "@/domain/auth/access";

const LUXURY = resolveEntitlements("LUXURY", defaultFeaturesFor("LUXURY"));
const media = (k: string) => `media-${k}`;

describe("the occasion registry", () => {
  it("describes every occasion completely and keeps every category reachable", () => {
    for (const t of EVENT_TYPES) {
      const i = EVENT_TYPE_INFO[t];
      expect(CATEGORY_SLUGS, t).toContain(i.category);
      expect(categoryBySlug(i.category)?.eventTypes, `${t} must be listed in its own category`).toContain(t);
      expect(EVENT_VOICES[i.voice], t).toBeDefined();
      expect(i.cta.length, t).toBeGreaterThan(8);
      expect(i.enquiry.length, t).toBeGreaterThan(5);
      expect(STARTER_CEREMONIES[t], t).toBeDefined();
    }
    expect(EVENT_TYPES.length).toBeGreaterThanOrEqual(20);
    // every kind of occasion the product promises
    for (const wanted of ["wedding", "engagement", "birthday", "anniversary", "baby_shower", "naming_ceremony", "housewarming", "religious_ceremony", "corporate_event", "conclave", "conference", "product_launch", "graduation", "reunion", "funeral", "memorial", "cultural_event", "festival", "retirement", "private_party"]) expect(EVENT_TYPES, wanted).toContain(wanted);
  });

  it("every category covers at least one event type, and eventTypesIn agrees with the registry", () => {
    expect(CATEGORIES.map((c) => c.slug).sort()).toEqual([...CATEGORY_SLUGS].sort());
    for (const c of CATEGORIES) {
      expect(c.eventTypes.length, c.slug).toBeGreaterThan(0);
      expect(c.intro.length, c.slug).toBeGreaterThanOrEqual(1);
      expect(c.faq.length, c.slug).toBeGreaterThanOrEqual(1);
      expect(c.seoDescription.length, c.slug).toBeLessThanOrEqual(175);
      for (const t of eventTypesIn(c.slug)) expect(c.eventTypes).toContain(t);
    }
  });

  it("a solemn or professional occasion plays no effect, whatever an old setting says; a celebration still can", () => {
    for (const t of EVENT_TYPES) {
      const tone = toneOf({ eventType: t });
      const doc = (celebration: "auto" | "petals" | "confetti" | "off") => ({ eventType: t, opening: { celebration } });
      if (tone === "solemn") for (const c of ["auto", "petals", "confetti"] as const) expect(celebrationFor(doc(c)), `${t}/${c}`).toBeNull();
      if (tone === "professional") expect(celebrationFor(doc("auto")), t).toBeNull();
      if (EVENT_TYPE_INFO[t].celebration !== "none" && tone === "celebratory") expect(celebrationFor(doc("auto")), t).not.toBeNull();
    }
    expect(celebrationFor({ eventType: "funeral", opening: { celebration: "confetti" } })).toBeNull();
    expect(celebrationFor({ eventType: "birthday", opening: { celebration: "off" } })).toBeNull();
    expect(celebrationFor({ eventType: "conclave", opening: { celebration: "confetti" } })).toBe("confetti"); // an explicit choice for a business event is the owner's to make
  });

  it("only occasions about a couple get the walking figures and a bride-and-groom opening", () => {
    for (const t of EVENT_TYPES) {
      const couple = isCoupleEvent({ eventType: t });
      expect(journeyEnabled({ eventType: t, journey: { enabled: true } }), t).toBe(EVENT_TYPE_INFO[t].couple);
      if (!couple) expect(EVENT_TYPE_INFO[t].couple, t).toBe(false);
    }
    expect(subjectKind({ eventType: "funeral" })).toBe("memorial");
    expect(subjectKind({ eventType: "conclave" })).toBe("occasion");
    expect(subjectKind({ eventType: "kids_birthday" })).toBe("person");
    expect(subjectKind({ eventType: "engagement" })).toBe("couple");
  });
});

describe("the document", () => {
  it("a document saved before occasions existed parses with an empty occasion and nothing else changed", () => {
    const old = parseDoc({ couple: { bride: { name: { en: "A" } }, groom: { name: { en: "B" } } }, sections: [] });
    expect(old.eventType).toBe("hindu_wedding");
    expect(old.occasion.title).toEqual({});
    expect(old.occasion.speakers).toEqual([]);
    expect(old.occasion.agenda).toEqual([]);
    expect(old.occasion.registration.url).toBe("");
    expect(emptyDoc().occasion.honoree.born).toBe("");
  });

  it("rejects a programme item of an unknown kind and a section type that does not exist", () => {
    expect(InvitationDoc.safeParse({ occasion: { agenda: [{ id: "a", kind: "party" }] } }).success).toBe(false);
    expect(InvitationDoc.safeParse({ occasion: { agenda: [{ id: "a", kind: "keynote", start: "09:30", day: "2026-11-19" }] } }).success).toBe(true);
    expect(InvitationDoc.safeParse({ sections: [{ id: "x", type: "hologram" }] }).success).toBe(false);
    expect(InvitationDoc.safeParse({ occasion: { agenda: [{ id: "a", start: "9.30" }] } }).success).toBe(false);
  });

  it("every section type has its metadata, and every new one is available in every package", () => {
    for (const t of SECTION_TYPES) expect(SECTION_META[t], t).toBeDefined();
    for (const t of ["about", "tribute", "speakers", "agenda", "sponsors", "message", "people", "prayer"] as const) expect(SECTION_META[t].feature, t).toBe("invitation");
  });

  it("new sections follow the same visibility rules as every other", () => {
    const ent = resolveEntitlements("ESSENTIAL", defaultFeaturesFor("ESSENTIAL"));
    const section = (type: (typeof SECTION_TYPES)[number], enabled = true) => ({ id: "s", type, enabled, order: 0, variant: "default", settings: {}, content: {}, visibility: { phases: [], groups: [], guestsOnly: false } });
    const ctx = (status: "PUBLISHED" | "MEMORY") => ({ status, entitlements: ent, hasGuest: false, groupKey: null });
    expect(sectionIsVisible(section("agenda"), ctx("PUBLISHED"))).toBe(true);
    expect(sectionIsVisible(section("agenda"), ctx("MEMORY"))).toBe(false); // a programme is for before and during the event
    expect(sectionIsVisible(section("tribute"), ctx("MEMORY"))).toBe(true);
    expect(sectionIsVisible(section("speakers", false), ctx("PUBLISHED"))).toBe(false);
  });
});

describe("the interface wording of each occasion", () => {
  it("English and Malayalam are both complete for every string, including the new ones", () => {
    for (const k of Object.keys(EN)) expect((ML as Record<string, string>)[k]?.trim(), k).toBeTruthy();
  });

  it("a memorial speaks gently, a conclave professionally, and a wedding as it always did", () => {
    const en = (voice: Parameters<typeof makeTranslator>[2]) => makeTranslator("en", {}, voice);
    expect(en("wedding")("rsvp.yes")).toBe("Yes, with joy");
    expect(en("memorial")("rsvp.yes")).toBe("I will attend");
    expect(en("memorial")("guestbook.title")).toBe("Tributes & condolences");
    expect(en("professional")("rsvp.title")).toBe("Will you be attending?");
    expect(en("professional")("nav.rsvp")).toBe("Register");
    expect(en(undefined)("rsvp.yes")).toBe("Yes, with joy");
    // no celebratory wording survives in a memorial
    for (const [k, v] of Object.entries(EVENT_VOICES.memorial)) expect(v, k).not.toMatch(/celebrat|joy|party|wish/i);
  });

  it("an owner’s own wording wins over the occasion; another language keeps its own strings", () => {
    expect(makeTranslator("en", { en: { "rsvp.yes": "Gladly" } }, "memorial")("rsvp.yes")).toBe("Gladly");
    expect(makeTranslator("ml", {}, "memorial")("rsvp.yes")).toBe(ML["rsvp.yes"]);
    expect(makeTranslator("en", {}, "memorial")("invite.dear", { name: "Mary" })).toBe("Dear Mary,");
  });

  it("initials of a headline use its significant words", () => {
    expect(initialsOf("Leadership Conclave 2026")).toBe("LC");
    expect(initialsOf("Tech Summit 2026")).toBe("TS");
    expect(initialsOf("The Menon Family")).toBe("MF");
    expect(initialsOf("Meera")).toBe("M");
    expect(initialsOf("")).toBe("");
  });
});

describe("publishing an invitation that is not about a couple", () => {
  const input = (patch: (d: InvitationDoc) => void, over: Partial<Parameters<typeof publishReadiness>[0]> = {}) => {
    const doc = emptyDoc();
    patch(doc);
    return publishReadiness({ doc, slug: "leadership-conclave-2026", weddingDate: "2026-11-19", secondaryLocale: null, hasTemplate: true, hasTheme: true, galleryCount: 1, hasMusic: true, ...over });
  };
  const withEvent = (d: InvitationDoc) => {
    d.sections = generateSections(TEMPLATE_SEEDS.find((t) => t.slug === "executive-conclave")!.config, LUXURY);
    d.events = [{ id: "e", name: { en: "Day one" }, date: "2026-11-19", startTime: "09:30", endTime: "", description: {}, dressCode: {}, dressColors: [], notes: {}, mapUrl: "", visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: {}, body: {} }, isMain: true, order: 0, venueId: "v" }] as never;
  };

  it("asks for the occasion’s title, not for a bride and groom", () => {
    const issues = input((d) => { d.eventType = "conclave"; withEvent(d); });
    expect(issues.find((i) => i.code === "occasion.title")?.level).toBe("error");
    expect(issues.some((i) => i.code === "couple.names")).toBe(false);
  });

  it("is ready with a title; a couple still needs both names", () => {
    const ok = input((d) => { d.eventType = "conclave"; withEvent(d); d.occasion.title = { en: "Leadership Conclave 2026" }; d.images.couple = media("hero"); d.rsvp.deadline = "2026-10-30"; });
    expect(ok.filter((i) => i.level === "error")).toEqual([]);
    const couple = input((d) => { d.eventType = "wedding"; withEvent(d); });
    expect(couple.find((i) => i.code === "couple.names")?.level).toBe("error");
  });

  it("a funeral’s reply deadline is worded for the family", () => {
    const issues = input((d) => { d.eventType = "funeral"; withEvent(d); d.occasion.title = { en: "Thomas Mathew" }; });
    expect(issues.find((i) => i.code === "rsvp.deadline")?.message).toMatch(/family/);
  });

  it("a new invitation of any occasion starts with its own starter content and valid sections", () => {
    for (const t of TEMPLATE_SEEDS) {
      const doc = buildInitialDoc(t.config, LUXURY, null);
      expect(InvitationDoc.safeParse(doc).success, t.slug).toBe(true);
      expect(doc.eventType, t.slug).toBe(t.config.eventType ?? "hindu_wedding");
      expect(doc.sections.length, t.slug).toBeGreaterThan(3);
    }
  });
});

describe("the template and theme library", () => {
  it("every template and theme is valid and every template’s theme and demo exist", () => {
    for (const t of THEME_SEEDS) expect(ThemeTokens.safeParse(t.tokens).success, t.slug).toBe(true);
    for (const t of TEMPLATE_SEEDS) {
      expect(TemplateConfig.safeParse(t.config).success, t.slug).toBe(true);
      if (t.config.suggestedTheme) expect(THEME_SEEDS.map((x) => x.slug), `${t.slug} → ${t.config.suggestedTheme}`).toContain(t.config.suggestedTheme);
      if (t.config.demo) expect(demoBySlug(t.config.demo), `${t.slug} → demo ${t.config.demo}`).toBeDefined();
      const types = t.config.sections.map((s) => s.type);
      expect(new Set(types).size, `${t.slug} lists a section twice`).toBe(types.length);
      expect(types, t.slug).toContain("hero");
      for (const s of t.config.sections) expect(SECTION_META[s.type].variants.map((v) => v.key), `${t.slug}/${s.type}`).toContain(s.variant);
    }
  });

  it("each business template carries a programme, speakers and partners, and the memorial carries a tribute and no countdown", () => {
    const types = (slug: string) => generateSections(TEMPLATE_SEEDS.find((t) => t.slug === slug)!.config, LUXURY).map((s) => s.type);
    for (const slug of ["executive-conclave", "summit"]) for (const t of ["agenda", "speakers", "sponsors", "rsvp"]) expect(types(slug), `${slug}/${t}`).toContain(t);
    expect(types("remembrance")).toEqual(expect.arrayContaining(["tribute", "message", "prayer", "people", "guestbook"]));
    expect(types("remembrance")).not.toContain("countdown");
    expect(types("remembrance")).not.toContain("games");
  });

  it("the Essential package can still make every new kind of invitation (no occasion is gated behind a paid feature)", () => {
    const ess = resolveEntitlements("ESSENTIAL", defaultFeaturesFor("ESSENTIAL"));
    for (const slug of ["executive-conclave", "summit", "remembrance", "gala-night", "little-celebration"]) {
      const ts = generateSections(TEMPLATE_SEEDS.find((t) => t.slug === slug)!.config, ess).map((s) => s.type);
      expect(ts, slug).toContain("hero");
      expect(ts, slug).toContain("rsvp");
    }
  });
});

describe("the sample invitations and the shop window agree", () => {
  const CONFIGS: { cfg: ShowcaseCfg | OccasionCfg; kind: "couple" | "occasion" }[] = [
    { cfg: ISHA, kind: "couple" }, { cfg: TARA, kind: "couple" }, { cfg: HELEN, kind: "couple" }, { cfg: CHRISTIAN, kind: "couple" }, { cfg: MUSLIM, kind: "couple" },
    { cfg: MEERA, kind: "occasion" }, { cfg: AARAV, kind: "occasion" }, { cfg: AADHYA, kind: "occasion" }, { cfg: CONCLAVE, kind: "occasion" }, { cfg: SUMMIT, kind: "occasion" }, { cfg: THOMAS, kind: "occasion" },
  ];
  const build = (c: (typeof CONFIGS)[number]) => {
    const tpl = TEMPLATE_SEEDS.find((t) => t.slug === c.cfg.template)!;
    const base = buildInitialDoc(tpl.config, LUXURY, null);
    return c.kind === "couple" ? buildShowcaseDoc(base, c.cfg as ShowcaseCfg, media) : buildOccasionDoc(base, c.cfg as OccasionCfg, media, brand.whatsapp);
  };

  it("the catalogue lists exactly the invitations the seed creates, with the same template, theme and occasion", () => {
    const seeded = new Map<string, { template: string; theme: string; eventType: string }>([
      [ANANYA.slug, { template: "cinematic-noir", theme: "royal-gold", eventType: "hindu_wedding" }],
      [DEMO.slug, { template: "royal-heritage", theme: "kasavu", eventType: "hindu_wedding" }],
      ...CONFIGS.map((c) => [c.cfg.slug, { template: c.cfg.template, theme: c.cfg.theme, eventType: c.cfg.eventType }] as const),
    ]);
    expect(DEMOS.map((d) => d.slug).sort()).toEqual([...seeded.keys()].sort());
    for (const d of DEMOS) {
      const s = seeded.get(d.slug)!;
      expect({ template: d.template, theme: d.theme, eventType: d.eventType }, d.slug).toEqual(s);
      expect(templateOf(d), d.slug).toBeDefined();
      expect(themeOf(d), d.slug).toBeDefined();
    }
  });

  it("every sample is a valid, complete document with one main event and a consistent look", () => {
    for (const c of CONFIGS) {
      const doc = InvitationDoc.parse(build(c));
      expect(doc.eventType, c.cfg.slug).toBe(c.cfg.eventType);
      expect(doc.events.filter((e) => e.isMain), c.cfg.slug).toHaveLength(1);
      expect(doc.sections.length, c.cfg.slug).toBeGreaterThan(5);
      // samples chat with Stack Bridge Labs, never with a private number
      expect(doc.whatsapp.number, c.cfg.slug).toBe(brand.whatsapp);
      expect(doc.rsvp.whatsappNumber, c.cfg.slug).toBe("");
      for (const k of doc.contacts) expect(k.phone, c.cfg.slug).toBe("+91 73567 41055");
    }
  });

  it("the facts a sample states about itself are true of its own data", () => {
    const conclave = InvitationDoc.parse(build({ cfg: CONCLAVE, kind: "occasion" }));
    const real = (d: InvitationDoc) => d.occasion.agenda.filter((a) => a.kind !== "break");
    const fact = (d: InvitationDoc, label: RegExp) => d.occasion.about.highlights.find((h) => label.test(h.value.en ?? ""))?.value.en ?? "";
    expect(fact(conclave, /speakers/)).toBe(`${conclave.occasion.speakers.length} speakers`);
    expect(fact(conclave, /sessions/)).toBe(`${real(conclave).length} sessions`);
    expect(new Set(conclave.occasion.agenda.map((a) => a.day)).size).toBe(2);
    const summit = InvitationDoc.parse(build({ cfg: SUMMIT, kind: "occasion" }));
    expect(fact(summit, /sessions/)).toBe(`${real(summit).length} sessions`);
    const tracks = new Set(summit.occasion.agenda.map((a) => a.track.en).filter(Boolean));
    expect(tracks.size).toBe(4);
    // every speaker named in the programme is on the speaker list
    for (const doc of [conclave, summit]) {
      const names = doc.occasion.speakers.map((s) => s.name.en);
      for (const a of doc.occasion.agenda) {
        for (const who of (a.speaker.en ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
          if (/^(all speakers|community speakers|the northstar team)$/i.test(who)) continue;
          expect(names, `${a.title.en} → ${who}`).toContain(who);
        }
      }
    }
  });

  it("the memorial has every part the brief asks for", () => {
    const doc = InvitationDoc.parse(build({ cfg: THOMAS, kind: "occasion" }));
    expect(doc.occasion.honoree.born).toBe("1946-03-12");
    expect(doc.occasion.honoree.passed).toBe("2026-10-02");
    expect(doc.occasion.honoree.photo).toBeTruthy();
    expect(doc.occasion.prayer.text.en).toMatch(/shepherd/);
    expect(doc.occasion.people.length).toBeGreaterThan(3);
    expect(doc.occasion.message.body.en).toBeTruthy();
    expect(doc.story.milestones.length).toBeGreaterThanOrEqual(5);
    expect(doc.events.length).toBeGreaterThanOrEqual(3);
    expect(doc.venues.every((v) => v.lat != null && v.mapUrl)).toBe(true);
    expect(celebrationFor(doc)).toBeNull();
    expect(doc.sections.some((s) => s.type === "countdown")).toBe(false);
  });

  it("every photograph a sample or the site asks for exists, is described and is credited", () => {
    const credits = readFileSync("assets/stock/CREDITS.md", "utf8");
    const wanted = new Set<string>();
    for (const c of CONFIGS) {
      for (const [, id] of c.cfg.needs) wanted.add(id);
      for (const [id] of c.cfg.gallery) wanted.add(id);
    }
    for (const d of DEMOS) { wanted.add(d.cover); d.strip.forEach((s) => wanted.add(s)); }
    for (const c of CATEGORIES) if (c.cover) wanted.add(c.cover);
    for (const id of wanted) {
      expect(STOCK_ID.test(id), id).toBe(true);
      expect(existsSync(path.join("assets", "stock", `${id}.jpg`)), `${id}.jpg is in assets/stock`).toBe(true);
      expect(stockInfo(id)?.alt?.length ?? 0, `${id} has alt text`).toBeGreaterThan(15);
      expect(credits.includes(id), `${id} has a credit row`).toBe(true);
    }
    // nothing in the folder is uncredited
    for (const f of readdirSync("assets/stock").filter((x) => x.endsWith(".jpg"))) expect(credits.includes(f.slice(0, -4)), `${f} is credited`).toBe(true);
    for (const id of Object.keys(STOCK)) expect(existsSync(path.join("assets", "stock", `${id}.jpg`)), `STOCK lists ${id} but the file is missing`).toBe(true);
  });
});

describe("the public catalogue", () => {
  it("files every sample under its own occasion and lists it wherever a wider category covers it", () => {
    for (const d of DEMOS) {
      expect(demosIn(primaryCategory(d)).map((x) => x.slug), d.slug).toContain(d.slug);
      expect(d.styles.length, d.slug).toBeGreaterThan(0);
      expect(d.highlights.length, d.slug).toBeGreaterThanOrEqual(3);
      expect(sectionLabels(d).length, d.slug).toBeGreaterThan(5);
    }
    expect(demosIn("corporate").map((d) => d.slug)).toEqual(expect.arrayContaining(["leadership-conclave-2026", "tech-summit-2026"]));
    expect(demosIn("conclave").map((d) => d.slug)).toEqual(["leadership-conclave-2026"]);
    expect(demosIn("funeral").map((d) => d.slug)).toEqual(["thomas-mathew-memorial"]);
    expect(demosIn("birthday").map((d) => d.slug).sort()).toEqual(["aarav-turns-three", "meera-turns-thirty"]);
    expect(demosIn("housewarming")).toEqual([]);
  });

  it("covers the ten required designs and keeps their distinct looks distinct", () => {
    const wanted = ["ananya-and-arjun", "isha-and-daniel", "meenakshi-and-aravind", "meera-turns-thirty", "aarav-turns-three", "tara-and-nikhil", "helen-and-george", "leadership-conclave-2026", "tech-summit-2026", "thomas-mathew-memorial"];
    expect(DEMOS.map((d) => d.slug).slice(0, 10)).toEqual(wanted);
    expect(new Set(DEMOS.map((d) => d.template)).size).toBeGreaterThanOrEqual(10); // the samples are not one template re-coloured
    expect(new Set(DEMOS.map((d) => d.theme)).size).toBeGreaterThanOrEqual(10);
  });

  it("states no claim it cannot back up", () => {
    const text = JSON.stringify([DEMOS, CATEGORIES, FAQ_GROUPS]).toLowerCase();
    for (const banned of ["testimonial", "customers love", "thousands of", "award", "#1", "best-selling", "trusted by", "guarantee", "100%", "certified", "official partner"]) expect(text, banned).not.toContain(banned);
    expect(FAQ_ALL.length).toBeGreaterThanOrEqual(12);
  });
});

describe("the WhatsApp links", () => {
  it("open Stack Bridge Labs’ number with a message that says what the visitor wants", () => {
    expect(brand.whatsapp).toBe("917356741055");
    expect(waLink()).toBe("https://wa.me/917356741055");
    expect(waLink("Hi there")).toBe("https://wa.me/917356741055?text=Hi%20there");
    expect(enquiryMessage("hindu_wedding")).toBe("Hi, I’m interested in creating a wedding invitation.");
    expect(enquiryMessage("birthday")).toBe("Hi, I’m interested in creating a birthday invitation.");
    expect(enquiryMessage("funeral")).toMatch(/talk to your team about a memorial/);
    for (const t of EVENT_TYPES) {
      expect(enquiryMessage(t), t).toMatch(/^Hi, /);
      expect(enquiryLink(t), t).toContain("wa.me/917356741055?text=");
    }
  });

  it("each occasion’s invitation signs off with its own line", () => {
    expect(EVENT_TYPE_INFO.hindu_wedding.cta).toBe("Plan My Wedding Invitation");
    expect(EVENT_TYPE_INFO.birthday.cta).toBe("Create My Birthday Invite");
    expect(EVENT_TYPE_INFO.conclave.cta).toBe("Create Event Invitation");
    expect(EVENT_TYPE_INFO.funeral.cta).toBe("Talk to Our Team");
  });
});

describe("the product site’s routes", () => {
  it("lists every public page and only the occasions that have a sample", () => {
    const urls = sitemap().map((s) => s.url);
    for (const p of ["/", "/templates", "/categories", "/pricing", "/how-it-works", "/faq"]) expect(urls).toContain(absoluteUrl(p));
    expect(urls).toContain(absoluteUrl("/templates/wedding"));
    expect(urls).toContain(absoluteUrl("/templates/wedding/isha-and-daniel"));
    expect(urls).not.toContain(absoluteUrl("/templates/housewarming"));
    expect(urls.filter((u) => /\/templates\/[^/]+\/[^/]+$/.test(u))).toHaveLength(DEMOS.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("keeps previews, invitations and the studio out of search, and refuses AI crawlers", () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const all = rules.find((x) => x.userAgent === "*")!;
    for (const p of ["/preview/", "/invite/", "/admin/", "/api/"]) expect(all.disallow).toContain(p);
    expect(rules.some((x) => Array.isArray(x.userAgent) && x.userAgent.includes("GPTBot") && x.disallow === "/")).toBe(true);
    expect(r.sitemap).toBe(absoluteUrl("/sitemap.xml"));
  });

  it("gives each page a canonical link and social cards from our own photographs", () => {
    const m = pageMetadata({ path: "/pricing", title: "Pricing", description: "x", image: "dYgv-1JnPTA" });
    expect(m.alternates?.canonical).toBe(absoluteUrl("/pricing"));
    expect(JSON.stringify(m.openGraph)).toContain("/stock/dYgv-1JnPTA?og=1");
    expect(pageMetadata({ path: "/templates/housewarming", title: "x", description: "y", index: false }).robots).toEqual({ index: false, follow: true });
  });

  it("serves a stock photograph resized and cropped, and nothing else", async () => {
    const ask = (id: string, q = "") => stockRoute(new Request(`http://localhost/stock/${id}${q}`), { params: Promise.resolve({ id }) });
    const res = await ask("dYgv-1JnPTA", "?w=480&r=4:5");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(res.headers.get("cache-control")).toContain("immutable");
    const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    expect(meta.width).toBe(480);
    expect(Math.abs((meta.height ?? 0) - 600)).toBeLessThanOrEqual(1);
    const og = await sharp(Buffer.from(await (await ask("dYgv-1JnPTA", "?og=1")).arrayBuffer())).metadata();
    expect([og.width, og.height]).toEqual([1200, 630]);
    // a size that was not offered rounds up to one that was
    expect((await sharp(Buffer.from(await (await ask("dYgv-1JnPTA", "?w=500")).arrayBuffer())).metadata()).width).toBe(640);
    for (const bad of ["..%2F..%2Fpackage", "../package", "nope", "x".repeat(40), "not-a-stock-id"]) expect((await ask(bad)).status, bad).toBe(404);
  });
});

describe("pricing on the public site and for the company site", () => {
  beforeAll(async () => {
    await bootstrap();
  });

  it("shows the live packages — three of them, with the prices Super Admin set", async () => {
    const packages = await loadPublicPackages();
    expect(packages.map((p) => p.key)).toEqual(["ESSENTIAL", "SIGNATURE", "LUXURY"]);
    expect(packages[0].priceMin).toBe(1999);
    expect(packages[2].priceMax).toBe(10000);
    for (const p of packages) expect(p.features.length).toBeGreaterThan(5);
  });

  it("serves the same numbers to the company site, and only to the company site", async () => {
    const allowed = await pricingApi(new Request("http://localhost/api/public/pricing", { headers: { origin: brand.companyUrl } }));
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("access-control-allow-origin")).toBe(brand.companyUrl);
    const body = (await allowed.json()) as { currency: string; packages: { key: string; priceMin: number }[] };
    expect(body.currency).toBe("INR");
    expect(body.packages.map((p) => p.key)).toEqual(["ESSENTIAL", "SIGNATURE", "LUXURY"]);
    const stranger = await pricingApi(new Request("http://localhost/api/public/pricing", { headers: { origin: "https://evil.example" } }));
    expect(stranger.headers.get("access-control-allow-origin")).toBeNull();
    expect(JSON.stringify(body)).not.toMatch(/email|phone|token|secret/i);
    expect(pricingOptions(new Request("http://localhost/api/public/pricing", { headers: { origin: brand.companyUrl } })).status).toBe(204);
  });
});

describe("a sample invitation may be opened on the product site; a customer’s may not", () => {
  let admin: AdminActor;
  beforeAll(async () => {
    admin = await bootstrap();
  });

  it("marks a demonstration invitation as a sample, and an ordinary one as not", async () => {
    const w = await makeWedding(admin, "LUXURY", { publish: true });
    const before = await loadPublicInvitation(w.slug);
    expect(before.ok && before.view.wedding.isDemo).toBe(false);
    const db = await getDb();
    await db.update(schema.weddings).set({ isDemo: true }).where(eq(schema.weddings.id, w.id));
    const after = await loadPublicInvitation(w.slug);
    expect(after.ok && after.view.wedding.isDemo).toBe(true);
    // and a non-demo invitation never takes a different lifecycle state from the address bar
    await db.update(schema.weddings).set({ isDemo: false }).where(eq(schema.weddings.id, w.id));
    const forced = await loadPublicInvitation(w.slug, null, { asStatus: "MEMORY" });
    expect(forced.ok && forced.view.wedding.status).not.toBe("MEMORY");
  });
});
