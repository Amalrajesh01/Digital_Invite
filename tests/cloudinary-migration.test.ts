import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { storage } from "@/lib/storage";
import { ingestFile, replaceImage, toResolved } from "@/domain/media/service";
import { findExcluded, fingerprint, migrate, rollbackWedding, verifyMigrated } from "@/domain/media/cloud-migrate";
import type { AdminActor } from "@/domain/auth/access";
import { assignClientToWedding } from "@/domain/auth/service";
import { bootstrap, makeWedding, pngBuffer, uniq } from "./helpers";
import { cloud } from "./fake-cloudinary";

vi.mock("@/lib/cloudinary", async () => (await import("./fake-cloudinary")).fakeModule());

let admin: AdminActor;
type Row = typeof schema.mediaAssets.$inferSelect;

const configure = () => {
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "testcloud");
  vi.stubEnv("CLOUDINARY_API_KEY", "key-123456");
  vi.stubEnv("CLOUDINARY_API_SECRET", "secret-abcdef");
};
beforeAll(async () => {
  admin = await bootstrap();
});
beforeEach(() => {
  configure();
  cloud.reset();
});
afterEach(() => vi.unstubAllEnvs());

/** An invitation as it was before Cloudinary: its photographs on the old store, `legacy`. */
async function legacyWedding(o: { slug?: string; photos?: number; patch?: Parameters<typeof makeWedding>[2] extends infer T ? (T extends { patch?: infer P } ? P : never) : never; mode?: "legacy" | "pinned" } = {}) {
  const w = await makeWedding(admin, "LUXURY", { slug: o.slug, patch: o.patch });
  const db = await getDb();
  await db.update(schema.weddings).set({ mediaStorage: o.mode ?? "legacy" }).where(eq(schema.weddings.id, w.id));
  vi.stubEnv("CLOUDINARY_API_SECRET", ""); // Cloudinary "not set up yet": these uploads land on the old store
  const rows: Row[] = [];
  for (let i = 0; i < (o.photos ?? 3); i++) {
    rows.push(await ingestFile({ weddingId: w.id, buffer: await pngBuffer(1800 + i * 10, 1200, { r: 40 * i, g: 90, b: 150 }), filename: `p${i}.png`, category: "GALLERY", allow: ["IMAGE"], source: "ADMIN" }));
  }
  const guest = await ingestFile({ weddingId: w.id, buffer: await pngBuffer(900, 600), filename: "g.png", category: "GUEST_UPLOAD", allow: ["IMAGE"], source: "GUEST" });
  vi.stubEnv("CLOUDINARY_API_SECRET", "secret-abcdef");
  return { ...w, rows, guest };
}

const rowsOf = async (weddingId: string) => (await getDb()).select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, weddingId));
const xlKey = (a: Row) => (a.metadata as { variants: Record<string, { key: string }> }).variants.xl.key;

describe("dry run", () => {
  it("reads and checks every source but writes nothing anywhere", async () => {
    const w = await legacyWedding();
    const db = await getDb();
    const before = await fingerprint(db, [w.id]);
    const report = await migrate({ apply: false, only: [w.slug] });
    expect(report.assets.would_migrate).toBe(3);
    expect(report.assets.skipped_private).toBe(1); // the guest's photograph stays behind the access check
    expect(report.assets.migrated).toBe(0);
    expect(report.assets.bytes).toBeGreaterThan(0);
    expect(cloud.uploads).toBe(0);
    expect(await fingerprint(db, [w.id])).toBe(before);
  });
});

describe("migrating", () => {
  it("moves the photographs, proves them, keeps the old files, and switches the invitation over", async () => {
    const w = await legacyWedding();
    const report = await migrate({ apply: true, only: [w.slug] });
    expect(report.assets.migrated).toBe(3);
    expect(report.weddings.completed).toBe(1);
    const rows = await rowsOf(w.id);
    for (const r of rows.filter((x) => x.category === "GALLERY")) {
      const old = w.rows.find((o) => o.id === r.id)!;
      expect(r.provider).toBe("cloudinary");
      expect(r.storageKey).toBe(`sbl-invites/projects/${w.id}/${r.id}`);
      expect(cloud.store.has(r.storageKey)).toBe(true);
      const meta = r.metadata as { legacy: { storageKey: string; variants: unknown }; cloudinary: { version: number }; variants: Record<string, { key: string; width: number }> };
      expect(meta.legacy.storageKey).toBe(old.storageKey); // the way back
      expect(meta.variants.sm.width).toBe(420);
      expect(Object.values(meta.variants).every((v) => v.key === r.storageKey)).toBe(true);
      expect(await storage().get(xlKey(old))).not.toBeNull(); // nothing deleted
      expect(toResolved(r).url).toContain("res.cloudinary.com/testcloud/");
    }
    const guest = rows.find((r) => r.id === w.guest.id)!;
    expect(guest.provider).toBe("legacy");
    expect((await (await getDb()).select().from(schema.weddings).where(eq(schema.weddings.id, w.id)))[0].mediaStorage).toBe("cloudinary");
    expect(await verifyMigrated(await getDb(), undefined, w.id)).toEqual({ checked: 3, bad: 0 });
  });

  it("is safe to run again: nothing is uploaded twice", async () => {
    const w = await legacyWedding();
    await migrate({ apply: true, only: [w.slug] });
    const uploads = cloud.uploads;
    const again = await migrate({ apply: true, only: [w.slug] });
    expect(again.weddings.eligible).toBe(0); // it is on Cloudinary now
    expect(cloud.uploads).toBe(uploads);
    expect(cloud.store.size).toBe(3);
  });

  it("an outage leaves the rows as they were, and the next run finishes the job", async () => {
    const w = await legacyWedding();
    cloud.failNext = 1;
    const first = await migrate({ apply: true, only: [w.slug], concurrency: 1 });
    expect(first.assets.upload_failed).toBe(1);
    expect(first.assets.migrated).toBe(2);
    expect(first.weddings.completed).toBe(0); // not switched over while a photograph is still behind
    expect((await rowsOf(w.id)).filter((r) => r.provider === "legacy" && r.category === "GALLERY")).toHaveLength(1);
    const second = await migrate({ apply: true, only: [w.slug] });
    expect(second.assets.migrated).toBe(1);
    expect(second.assets.already_cloudinary).toBe(2);
    expect(second.weddings.completed).toBe(1);
    expect(cloud.store.size).toBe(3);
  });

  it("a database failure after the upload is picked up again without a duplicate", async () => {
    const w = await legacyWedding({ photos: 2 });
    const db = await getDb();
    const spy = vi.spyOn(db as never as { update: () => unknown }, "update").mockImplementationOnce(() => {
      throw new Error("db down");
    });
    const first = await migrate({ apply: true, only: [w.slug], concurrency: 1 });
    spy.mockRestore();
    expect(first.assets.db_failed).toBe(1);
    expect(first.weddings.completed).toBe(0);
    expect(cloud.store.size).toBe(2); // the failed one is already on Cloudinary
    const uploads = cloud.uploads;
    const second = await migrate({ apply: true, only: [w.slug] });
    expect(second.assets.migrated).toBe(1);
    expect(cloud.uploads).toBe(uploads + 1);
    expect(cloud.store.size).toBe(2); // found by its id, not stored again
    expect(second.weddings.completed).toBe(1);
  });

  it("reports a missing source file and a file that is not an image, moves the rest, and keeps the invitation on the old store", async () => {
    const w = await legacyWedding();
    await storage().delete(xlKey(w.rows[0]));
    await storage().put(xlKey(w.rows[1]), Buffer.from("this is not an image, it is a text file"), "image/webp");
    const report = await migrate({ apply: true, only: [w.slug] });
    expect(report.assets.missing_source).toBe(1);
    expect(report.assets.invalid_image).toBe(1);
    expect(report.assets.migrated).toBe(1);
    expect(report.weddings.completed).toBe(0);
    const [broken, notImage] = [w.rows[0], w.rows[1]].map((o) => o.id);
    const rows = await rowsOf(w.id);
    expect(rows.find((r) => r.id === broken)!.provider).toBe("legacy");
    expect(rows.find((r) => r.id === notImage)!.provider).toBe("legacy");
    expect(cloud.store.size).toBe(1);
  });

  it("does not repoint a photograph Cloudinary cannot serve back", async () => {
    const w = await legacyWedding({ photos: 1 });
    cloud.brokenNext = 1;
    const report = await migrate({ apply: true, only: [w.slug] });
    expect(report.assets.verify_failed).toBe(1);
    expect((await rowsOf(w.id)).find((r) => r.id === w.rows[0].id)!.provider).toBe("legacy");
  });
});

describe("rolling back", () => {
  it("restores the exact old references, keeps the Cloudinary images, and leaves anything edited since where it is", async () => {
    const w = await legacyWedding();
    await migrate({ apply: true, only: [w.slug] });
    const edited = w.rows[0];
    await replaceImage(admin, w.id, edited.id, await pngBuffer(1500, 900, { r: 1, g: 2, b: 3 })); // an edit made after the migration
    const db = await getDb();
    const out = await rollbackWedding(db, w.id);
    expect(out).toEqual({ restored: 2, keptOnCloudinary: 1 });
    const rows = await rowsOf(w.id);
    for (const old of w.rows.slice(1)) {
      const now = rows.find((r) => r.id === old.id)!;
      expect(now.provider).toBe("legacy");
      expect(now.storageKey).toBe(old.storageKey);
      expect(now.metadata).toEqual(old.metadata);
      expect(toResolved(now).url).toMatch(/^\/api\/media\//);
    }
    expect(rows.find((r) => r.id === edited.id)!.provider).toBe("cloudinary");
    expect(cloud.store.size).toBeGreaterThanOrEqual(3); // rollback deletes nothing from Cloudinary
    expect((await db.select().from(schema.weddings).where(eq(schema.weddings.id, w.id)))[0].mediaStorage).toBe("legacy");
  });
});

describe("the invitations that must never be touched (Surej and Akshaya)", () => {
  it("finds them in the records, however they are recorded, and a bulk run — with no filter — never writes to them", async () => {
    const byAddress = await legacyWedding({ slug: `surej-and-akshaya-${uniq("a")}` });
    const inDraft = await legacyWedding({ patch: (d) => { d.couple.bride.fullName = { en: "Akshaya Nair" }; d.couple.groom.fullName = { en: "Surej Menon" }; } });
    const pinned = await legacyWedding({ mode: "pinned" });
    const byId = await legacyWedding();
    const innocent = await legacyWedding();
    vi.stubEnv("CLOUDINARY_EXCLUDE_WEDDING_IDS", byId.id.toUpperCase());

    const db = await getDb();
    const found = await findExcluded(db);
    const reasons = (id: string) => found.find((e) => e.weddingId === id)?.reasons ?? [];
    expect(reasons(byAddress.id)).toContain("name in address");
    expect(reasons(inDraft.id)).toEqual(expect.arrayContaining(["name in draft", "name in published version"]));
    expect(reasons(pinned.id)).toContain("pinned");
    expect(reasons(byId.id)).toContain("CLOUDINARY_EXCLUDE_WEDDING_IDS");
    expect(found.some((e) => e.weddingId === innocent.id)).toBe(false);

    const protectedIds = [byAddress.id, inDraft.id, pinned.id, byId.id];
    const before = await fingerprint(db, protectedIds);
    const rowsBefore = await db.select().from(schema.mediaAssets).where(inArray(schema.mediaAssets.weddingId, protectedIds));
    cloud.reset();

    // bulk, no `only`, and even asking for them by name: they are skipped
    const bulk = await migrate({ apply: true });
    const asked = await migrate({ apply: true, only: [byAddress.slug, inDraft.id] });
    expect(asked.weddings.processed).toBe(0);
    expect(bulk.excludedFingerprint.unchanged).toBe(true);
    expect(bulk.weddings.excluded).toBeGreaterThanOrEqual(4);
    expect(await fingerprint(db, protectedIds)).toBe(before);
    const rowsAfter = await db.select().from(schema.mediaAssets).where(inArray(schema.mediaAssets.weddingId, protectedIds));
    expect(rowsAfter).toEqual(rowsBefore);
    expect(rowsAfter.every((r) => r.provider === "legacy")).toBe(true);
    for (const id of protectedIds) expect([...cloud.store.keys()].some((k) => k.includes(id)), `nothing of ${id} on Cloudinary`).toBe(false);
    expect(bulk.results.some((r) => protectedIds.includes(r.weddingId))).toBe(false);
    // an invitation that is not on the list was migrated by the same run
    expect((await rowsOf(innocent.id)).filter((r) => r.category === "GALLERY").every((r) => r.provider === "cloudinary")).toBe(true);
    // and the tool refuses to roll one back either
    await expect(rollbackWedding(db, byAddress.id)).rejects.toThrow(/excluded/);
  });

  it("also finds them by the customer's account and by the order", async () => {
    const db = await getDb();
    const byAccount = await legacyWedding();
    await assignClientToWedding(admin, { weddingId: byAccount.id, email: `${uniq("owner")}@example.com`, name: "Akshaya K" });
    const byOrder = await legacyWedding();
    await db.insert(schema.orders).values({ weddingId: byOrder.id, customerName: "Surej Varghese", customerContact: "", packageKey: "SIGNATURE" });
    const other = await legacyWedding();
    const found = await findExcluded(db);
    expect(found.find((e) => e.weddingId === byAccount.id)?.reasons).toContain("name in account");
    expect(found.find((e) => e.weddingId === byOrder.id)?.reasons).toContain("name in order");
    expect(found.find((e) => e.weddingId === byOrder.id)?.assets).toBe(4);
    expect(found.some((e) => e.weddingId === other.id)).toBe(false);
  });

  it("new uploads into an invitation that existed before Cloudinary still go where its photographs already are", async () => {
    const w = await legacyWedding({ slug: `surej-akshaya-${uniq("b")}`, photos: 1 });
    const fresh = await ingestFile({ weddingId: w.id, buffer: await pngBuffer(1200, 800), filename: "n.png", category: "GALLERY", allow: ["IMAGE"], source: "ADMIN" });
    expect(fresh.provider).toBe("legacy");
    expect(cloud.store.size).toBe(0);
  });
});
