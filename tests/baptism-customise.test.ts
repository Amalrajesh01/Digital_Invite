import { readFileSync } from "node:fs";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { InvitationDoc } from "@/domain/doc/schema";
import { createWedding, getWedding, publishWedding, saveDraft } from "@/domain/wedding/service";
import { createFromTemplate, loadSampleInfo } from "@/domain/wedding/from-template";
import { loadPublicInvitation } from "@/domain/wedding/public";
import { addToAlbum, collectAssetIds, ingestFile, replaceImage, saveAlbum } from "@/domain/media/service";
import { resolveSlot, slotDef, slotsFor } from "@/domain/imagery/slots";
import type { AdminActor } from "@/domain/auth/access";
import { BAPTISM_DEMOS } from "../scripts/demo/baptism";
import { buildOccasionDoc } from "../scripts/demo/occasion";
import { STORY } from "@/domain/baptism/story";
import { bootstrap } from "./helpers";

/**
 * What a baptism sample becomes in a family’s hands: the baby’s photographs arrive as the family’s own copies and are marked as the sample’s,
 * a replacement keeps its place, caption and layout, and hiding or moving a section leaves a valid, publishable invitation.
 */
let admin: AdminActor;
let templateId: string;
const SLUG = "heavenly-grace";
const cfg = BAPTISM_DEMOS.find((d) => d.template === SLUG)!;

const stock = (id: string) => readFileSync(`assets/stock/${id}.jpg`);

beforeAll(async () => {
  admin = await bootstrap();
  const db = await getDb();
  const [tpl] = await db.select().from(schema.templates).where(eq(schema.templates.slug, SLUG));
  const [theme] = await db.select().from(schema.themes).where(eq(schema.themes.slug, cfg.theme));
  templateId = tpl.id;
  const w = await createWedding(admin, { title: cfg.title, slug: `${cfg.slug}-test`, packageKey: "LUXURY", templateId: tpl.id, themeId: theme.id, weddingDate: cfg.date });
  const ids = new Map<string, string>();
  for (const [key, id, category] of cfg.needs) {
    ids.set(key, (await ingestFile({ weddingId: w.id, buffer: stock(id), filename: `${id}.jpg`, category, allow: ["IMAGE"], source: "SYSTEM" })).id);
  }
  const base = (await getWedding(admin, w.id)).draftDoc;
  await saveDraft(admin, w.id, buildOccasionDoc(base, cfg, (k) => ids.get(k) ?? `media-${k}`, "917356741055"));
  const gallery: string[] = [];
  for (const [id, caption] of cfg.gallery) {
    gallery.push((await ingestFile({ weddingId: w.id, buffer: stock(id), filename: `${id}.jpg`, category: "GALLERY", allow: ["IMAGE"], source: "SYSTEM", caption: { en: caption } })).id);
  }
  const album = await saveAlbum(admin, w.id, { title: { en: "Gallery" }, kind: "OFFICIAL", coverAssetId: gallery[0] });
  await addToAlbum(admin, w.id, album.id, gallery);
  await db.update(schema.weddings).set({ isDemo: true }).where(eq(schema.weddings.id, w.id));
  await db.update(schema.templates).set({ config: { ...(tpl.config as object), demo: w.slug } }).where(eq(schema.templates.id, tpl.id));
});

describe("a family starts from a baptism sample", () => {
  let id: string;
  it("gets their own copies of the baby’s photographs, the gallery with its chapters, and the family’s name in place of the sample’s", async () => {
    const r = await createFromTemplate(admin, { templateId, packageKey: "SIGNATURE", title: "Meera Rose’s baptism", nameA: "Meera Rose Kuriakose", date: "2100-05-09" });
    id = r.id;
    expect(r.fromSample).toBe(true);
    expect(r.photos, "the portrait, the second portrait, the family and the gallery").toBeGreaterThanOrEqual(2 + STORY[SLUG].gallery.length);
    const w = await getWedding(admin, id);
    const json = JSON.stringify(w.draftDoc);
    expect(json).not.toContain("Anya");
    expect(w.draftDoc.occasion.title.en, "the headline is the child’s given names").toBe("Meera Rose");
    expect(w.draftDoc.images.couple, "the opening portrait is this family’s copy").toBeTruthy();
    expect(w.draftDoc.images.story).toBeTruthy();
    const mine = [...collectAssetIds(w.draftDoc)];
    const db = await getDb();
    const rows = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, id));
    const unmarked = rows.filter((a) => a.kind === "IMAGE" && !(a.metadata as { sample?: boolean }).sample).map((a) => `${a.category}/${a.source}/${a.filename}`);
    expect(unmarked, "every copy is marked as the sample’s").toEqual([]);
    expect(mine.every((m) => rows.some((a) => a.id === m))).toBe(true);
    const items = await db.select().from(schema.galleryItems).where(eq(schema.galleryItems.weddingId, id));
    expect(items).toHaveLength(STORY[SLUG].gallery.length);
    const captions = rows.filter((a) => a.category === "GALLERY").map((a) => a.caption.en ?? "");
    expect(captions.filter((c) => !/—/.test(c)), "chapter captions come with the photographs").toEqual([]);
    expect(captions).toHaveLength(STORY[SLUG].gallery.length);
    const types = w.draftDoc.sections.map((s) => s.type);
    expect(types).toEqual(expect.arrayContaining(["gallery", "finale", "guestbook"]));
    expect(w.draftDoc.sections.find((s) => s.type === "gallery")!.variant).toBe("cards");
    expect(w.draftDoc.sections.find((s) => s.type === "guestbook")!.variant).toBe("card");
    expect(w.draftDoc.sections.find((s) => s.type === "finale")!.content.intro, "the closing blessing is the finale’s own wording").toBeTruthy();
    const info = await loadSampleInfo(admin, id);
    expect(info!.photos.length).toBeGreaterThan(0);
    expect(info!.tokens, "the sample’s hosts and people are flagged as still the sample’s").toEqual(expect.arrayContaining(["Reena & Joseph Thomas", "Reena Thomas"]));
  });

  it("keeps a replaced photograph’s place, caption and layout, and no longer calls it the sample’s", async () => {
    const before = (await getWedding(admin, id)).draftDoc;
    const hero = before.images.couple!;
    const db = await getDb();
    const own = await sharp({ create: { width: 1200, height: 1500, channels: 3, background: "#d8c3a5" } }).jpeg().toBuffer();
    await replaceImage(admin, id, hero, own);
    const after = (await getWedding(admin, id)).draftDoc;
    expect(after.images.couple, "the slot still points at the same photograph").toBe(hero);
    expect(resolveSlot({ doc: after }, "couple")).toBe(hero);
    const [row] = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, hero));
    expect((row.metadata as { sample?: boolean }).sample, "it is the family’s now").toBeUndefined();
    expect(row.width).toBe(1200);
    const items = await db.select().from(schema.galleryItems).where(eq(schema.galleryItems.weddingId, id));
    expect(items).toHaveLength(STORY[SLUG].gallery.length);
  });

  it("stays a valid, publishable invitation when a section is hidden and another is moved", async () => {
    const w = await getWedding(admin, id);
    const doc = structuredClone(w.draftDoc);
    doc.sections = doc.sections.map((s) => (s.type === "gallery" ? { ...s, enabled: false } : s));
    const fin = doc.sections.findIndex((s) => s.type === "finale");
    const rsvp = doc.sections.findIndex((s) => s.type === "rsvp");
    const [moved] = doc.sections.splice(fin, 1);
    doc.sections.splice(rsvp, 0, moved);
    doc.sections.forEach((s, i) => (s.order = i));
    await saveDraft(admin, id, doc);
    const saved = (await getWedding(admin, id)).draftDoc;
    expect(InvitationDoc.safeParse(saved).success).toBe(true);
    expect(saved.sections.find((s) => s.type === "gallery")!.enabled).toBe(false);
    const order = saved.sections.map((s) => s.type);
    expect(order.indexOf("finale")).toBeLessThan(order.indexOf("rsvp"));
    await publishWedding(admin, id, { label: "Test" });
    const pub = await loadPublicInvitation((await getWedding(admin, id)).slug);
    expect(pub.ok).toBe(true);
  });
});

describe("the studio names a baptism’s photographs for what they are", () => {
  it("calls the hero photograph the baby’s portrait, and offers no bride or groom", () => {
    expect(slotDef("couple", "baptism").label).toMatch(/baby/i);
    expect(slotDef("couple", "hindu_wedding").label).toMatch(/couple/i);
    expect(slotsFor("baptism")).not.toContain("bride");
    expect(slotsFor("baptism")).not.toContain("groom");
    expect(slotsFor("baptism")).toEqual(expect.arrayContaining(["couple", "story", "venue"]));
    expect(slotsFor("wedding")).toContain("bride");
  });
});
