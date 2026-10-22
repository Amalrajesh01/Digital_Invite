import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { bootstrap, makeClient, makeWedding, pngBuffer } from "./helpers";
import type { AdminActor } from "@/domain/auth/access";
import { deletePortfolioItem, listPortfolioAdmin, listPublicPortfolio, movePortfolioItem, publicPortfolioItem, publicPortfolioSlugs, savePortfolioItem, setPortfolioStatus } from "@/domain/portfolio/service";
import { uploadAsUser } from "@/domain/media/service";

let admin: AdminActor;
let customer: { id: string; slug: string };
let sample: { id: string; slug: string };

const base = { category: "wedding", templateSlug: "love-story", description: "A film-like invitation.", city: "Amboise" };

beforeAll(async () => {
  admin = await bootstrap();
  customer = await makeWedding(admin, "LUXURY");
  sample = await makeWedding(admin, "LUXURY");
  const db = await getDb();
  await db.update(schema.weddings).set({ isDemo: true }).where(eq(schema.weddings.id, sample.id));
});

describe("the public portfolio wall", () => {
  it("shows nothing until an item is published, and never a hidden one", async () => {
    const id = await savePortfolioItem(admin, { ...base, title: "A cinematic wedding in the Loire" });
    expect(await listPublicPortfolio()).toEqual([]);
    expect(await publicPortfolioItem("a-cinematic-wedding-in-the-loire")).toBeNull();
    await setPortfolioStatus(admin, id, "PUBLISHED");
    expect((await listPublicPortfolio()).map((c) => c.slug)).toEqual(["a-cinematic-wedding-in-the-loire"]);
    expect((await publicPortfolioItem("a-cinematic-wedding-in-the-loire"))?.templateName).toBe("The Cinematic Love Story");
    expect(await publicPortfolioSlugs()).toContain("a-cinematic-wedding-in-the-loire");
    await setPortfolioStatus(admin, id, "DRAFT");
    expect(await listPublicPortfolio()).toEqual([]);
    expect(await publicPortfolioSlugs()).not.toContain("a-cinematic-wedding-in-the-loire");
  });

  it("refuses to publish a customer's invitation without recorded consent, and says how it was given", async () => {
    const draft = { ...base, title: "A Kochi wedding", weddingId: customer.id };
    await expect(savePortfolioItem(admin, { ...draft, status: "PUBLISHED" })).rejects.toThrow(/consent/i);
    await expect(savePortfolioItem(admin, { ...draft, status: "PUBLISHED", consent: true })).rejects.toThrow(/how the consent/i);
    await expect(savePortfolioItem(admin, { ...draft, showLive: true })).rejects.toThrow(/consent/i);
    const id = await savePortfolioItem(admin, { ...draft, status: "PUBLISHED", consent: true, consentNote: "Agreed by WhatsApp, 12 Oct" });
    const card = (await listPublicPortfolio()).find((c) => c.title === "A Kochi wedding")!;
    expect(card).toBeTruthy();
    // the card is made only of what the studio wrote: nothing from the invitation itself reaches the public side
    const text = JSON.stringify(card);
    for (const secret of ["Anjali", "Sidharth", "Grand Hall", "MG Road"]) expect(text).not.toContain(secret);
    // withdrawing consent takes it off the wall at once, even though it is still marked published
    const db = await getDb();
    await db.update(schema.portfolioItems).set({ consent: false }).where(eq(schema.portfolioItems.id, id));
    expect((await listPublicPortfolio()).some((c) => c.title === "A Kochi wedding")).toBe(false);
    await deletePortfolioItem(admin, id);
  });

  it("offers the live invitation only when allowed, consented and the invitation is published", async () => {
    const id = await savePortfolioItem(admin, { ...base, title: "Live sample", weddingId: sample.id, showLive: true, status: "PUBLISHED" });
    expect((await publicPortfolioItem("live-sample"))?.liveHref).toBe(`/invite/${sample.slug}`);
    await savePortfolioItem(admin, { ...base, id, title: "Live sample", weddingId: sample.id, showLive: false, status: "PUBLISHED" });
    expect((await publicPortfolioItem("live-sample"))?.liveHref).toBeNull();
    // an unpublished invitation is never linked to
    const draftWed = await makeWedding(admin, "LUXURY", { publish: false });
    const db = await getDb();
    await db.update(schema.weddings).set({ isDemo: true }).where(eq(schema.weddings.id, draftWed.id));
    const id2 = await savePortfolioItem(admin, { ...base, title: "Unpublished sample", weddingId: draftWed.id, showLive: true, status: "PUBLISHED" });
    expect((await publicPortfolioItem("unpublished-sample"))?.liveHref).toBeNull();
    await deletePortfolioItem(admin, id);
    await deletePortfolioItem(admin, id2);
  });

  it("validates what it is given, and accepts only an approved, public photograph of the linked invitation as a cover", async () => {
    await expect(savePortfolioItem(admin, { ...base, title: "ab" })).rejects.toThrow();
    await expect(savePortfolioItem(admin, { ...base, title: "Bad category", category: "nonsense" })).rejects.toThrow();
    await expect(savePortfolioItem(admin, { ...base, title: "Bad template", templateSlug: "no-such-design" })).rejects.toThrow();
    await expect(savePortfolioItem(admin, { ...base, title: "Bad link", weddingId: "00000000-0000-4000-8000-000000000000" })).rejects.toThrow();
    const photo = await uploadAsUser(admin, sample.id, { buffer: await pngBuffer(1600, 1000), filename: "cover.png" }, { category: "COUPLE" });
    const other = await uploadAsUser(admin, customer.id, { buffer: await pngBuffer(1600, 1000), filename: "other.png" }, { category: "COUPLE" });
    await expect(savePortfolioItem(admin, { ...base, title: "Wrong cover", weddingId: sample.id, coverAssetId: other.id })).rejects.toThrow(/cover/i);
    const id = await savePortfolioItem(admin, { ...base, title: "Good cover", weddingId: sample.id, coverAssetId: photo.id, status: "PUBLISHED" });
    expect((await publicPortfolioItem("good-cover"))?.cover.src).toContain(photo.id);
    await deletePortfolioItem(admin, id);
  });

  it("keeps the studio's order, and only the platform owner can change anything", async () => {
    const a = await savePortfolioItem(admin, { ...base, title: "First story", status: "PUBLISHED" });
    const b = await savePortfolioItem(admin, { ...base, title: "Second story", status: "PUBLISHED" });
    expect((await listPublicPortfolio()).map((c) => c.title)).toEqual(["First story", "Second story"]);
    await movePortfolioItem(admin, b, "up");
    expect((await listPublicPortfolio()).map((c) => c.title)).toEqual(["Second story", "First story"]);
    const client = await makeClient(admin, customer.id);
    await expect(savePortfolioItem(client, { ...base, title: "Sneaky" })).rejects.toThrow();
    await expect(listPortfolioAdmin(client)).rejects.toThrow();
    await expect(setPortfolioStatus(client, a, "DRAFT")).rejects.toThrow();
    await expect(deletePortfolioItem(null, a)).rejects.toThrow();
    expect((await listPublicPortfolio()).map((c) => c.title)).toEqual(["Second story", "First story"]);
  });
});
