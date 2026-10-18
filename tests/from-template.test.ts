import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { getWedding, saveDraft } from "@/domain/wedding/service";
import { createFromTemplate, loadSampleInfo } from "@/domain/wedding/from-template";
import { collectAssetIds, ingestFile } from "@/domain/media/service";
import type { AdminActor } from "@/domain/auth/access";
import { bootstrap, makeWedding, pngBuffer } from "./helpers";

let admin: AdminActor;
let templateId: string;
let sampleId: string;
let samplePhoto: string;

beforeAll(async () => {
  admin = await bootstrap();
  const db = await getDb();
  // a sample invitation: Anjali & Sidharth, a story that names them, one photograph, a contact and a gallery
  const s = await makeWedding(admin, "LUXURY", { date: "2100-02-10", patch: (d) => {
    d.couple.bride.fullName = { en: "Anjali Nair" };
    d.couple.groom.fullName = { en: "Sidharth Menon" };
    d.sections = d.sections.map((x) => (x.type === "story" ? { ...x, content: { title: { en: "How Anjali met Sidharth" } } } : x));
    d.contacts = [{ id: "c1", name: { en: "Sample contact" }, role: { en: "Stack Bridge Labs" }, phone: "+91 73567 41055" }];
    d.whatsapp.number = "917356741055";
    d.rsvp.deadline = "2100-01-25";
    d.couple.hashtag = "#AnjaliWedsSidharth";
    d.couple.monogram = "AS";
    d.seo.description = { en: "Join Anjali and Sidharth on 10 February in Udaipur" };
    d.seo.title = { en: "Anjali & Sidharth — Wedding" };
  } });
  sampleId = s.id;
  const photo = await ingestFile({ weddingId: s.id, buffer: await pngBuffer(), filename: "couple.png", category: "COUPLE", allow: ["IMAGE"], source: "ADMIN" });
  samplePhoto = photo.id;
  const cur = (await getWedding(admin, s.id)).draftDoc;
  const doc = structuredClone(cur);
  doc.images.couple = photo.id;
  doc.couple.bride.photo = photo.id;
  await saveDraft(admin, s.id, doc);
  const [album] = await db.insert(schema.galleryAlbums).values({ weddingId: s.id, title: { en: "Official" }, kind: "OFFICIAL" }).returning();
  await db.insert(schema.galleryItems).values({ weddingId: s.id, albumId: album.id, assetId: photo.id, caption: { en: "Us" } });
  await db.update(schema.weddings).set({ isDemo: true }).where(eq(schema.weddings.id, s.id));
  const [t] = await db.select().from(schema.templates).limit(1);
  templateId = t.id;
  await db.update(schema.templates).set({ config: { ...(t.config as object), demo: s.slug } }).where(eq(schema.templates.id, t.id));
});

describe("starting an invitation from a template's sample", () => {
  it("brings the whole sample, with this customer's names and dates, their own copies of the photographs, and none of the sample's contacts", async () => {
    const r = await createFromTemplate(admin, { templateId, packageKey: "SIGNATURE", title: "Divya & Rahul", nameA: "Divya Pillai", nameB: "Rahul Varma", date: "2100-03-01" });
    expect(r.fromSample).toBe(true);
    expect(r.photos).toBe(1);
    const w = await getWedding(admin, r.id);
    const json = JSON.stringify(w.draftDoc);
    expect(w.isDemo).toBe(false);
    expect(w.customerClass).toBe("PAID_SIGNATURE");
    expect(w.weddingDate).toBe("2100-03-01");
    // names swapped everywhere, including inside sentences
    expect(json).not.toContain("Anjali");
    expect(json).not.toContain("Sidharth");
    expect(w.draftDoc.couple.bride.name.en).toBe("Divya");
    expect(w.draftDoc.couple.groom.fullName.en).toBe("Rahul Varma");
    expect(json).toContain("How Divya met Rahul");
    expect(w.draftDoc.couple.hashtag).toBe("#DivyaWedsRahul");
    expect(w.draftDoc.couple.monogram).toBe("DR");
    // the link preview starts automatic, not as the sample's own text
    expect(w.draftDoc.seo.title).toEqual({});
    expect(w.draftDoc.seo.description).toEqual({});
    expect(w.draftDoc.seo.ogImage).toBeUndefined();
    // every date moved by the same 19 days (10 Feb → 1 Mar), the deadline included
    expect(w.draftDoc.events[0].date).toBe("2100-03-01");
    expect(w.draftDoc.rsvp.deadline).toBe("2100-02-13");
    // the sample's contact buttons are not carried over
    expect(w.draftDoc.contacts).toEqual([]);
    expect(w.draftDoc.whatsapp.number).not.toBe("917356741055");
    // photographs are this invitation's own copies, flagged as sample
    const mine = [...collectAssetIds(w.draftDoc)];
    expect(mine.length).toBeGreaterThan(0);
    expect(mine).not.toContain(samplePhoto);
    const db = await getDb();
    const rows = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, r.id));
    expect(rows.every((a) => (a.metadata as { sample?: boolean }).sample === true)).toBe(true);
    expect(mine.every((id) => rows.some((a) => a.id === id))).toBe(true);
    expect(await db.select().from(schema.galleryItems).where(eq(schema.galleryItems.weddingId, r.id))).toHaveLength(1);
    // the sample itself is untouched
    expect(JSON.stringify((await getWedding(admin, sampleId)).draftDoc)).toContain("Anjali");
  });

  it("tells the editor what is still the sample, and stops mentioning words the customer has replaced", async () => {
    const r = await createFromTemplate(admin, { templateId, packageKey: "SIGNATURE", title: "Divya & Rahul", nameA: "Divya", nameB: "Rahul", date: "2100-03-01" });
    const info = await loadSampleInfo(admin, r.id);
    expect(info).not.toBeNull();
    expect(info!.photos.length).toBeGreaterThan(0);
    expect(info!.tokens).toEqual(expect.arrayContaining(["Anjali Nair", "Sidharth Menon"]));
  });

  it("only an owner can do it, and it needs a date", async () => {
    await expect(createFromTemplate(null, { templateId, packageKey: "ESSENTIAL", title: "x", date: "2100-03-01" })).rejects.toThrow();
    await expect(createFromTemplate(admin, { templateId, packageKey: "ESSENTIAL", title: "x", date: "" })).rejects.toThrow();
  });
});
