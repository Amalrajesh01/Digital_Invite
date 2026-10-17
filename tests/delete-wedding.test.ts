import { describe, expect, it, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { storage } from "@/lib/storage";
import { deleteWedding, getWedding } from "@/domain/wedding/service";
import { ingestFile } from "@/domain/media/service";
import type { AdminActor } from "@/domain/auth/access";
import { bootstrap, makeClient, makeWedding, pngBuffer } from "./helpers";

let admin: AdminActor;
beforeAll(async () => { admin = await bootstrap(); });

describe("deleting an invitation for good", () => {
  it("removes the invitation, its records and every stored file, and keeps an audit entry", async () => {
    const w = await makeWedding(admin, "SIGNATURE");
    const asset = await ingestFile({ weddingId: w.id, buffer: await pngBuffer(), filename: "couple.png", category: "COUPLE", allow: ["IMAGE"], source: "ADMIN" });
    const keys = [asset.storageKey, ...Object.values((asset.metadata as { variants?: Record<string, { key: string }> }).variants ?? {}).map((v) => v.key)];
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) expect(await storage().get(k), k).not.toBeNull();

    const title = (await getWedding(admin, w.id)).title || w.slug;
    await deleteWedding(admin, w.id, title);

    const db = await getDb();
    expect(await db.select().from(schema.weddings).where(eq(schema.weddings.id, w.id))).toHaveLength(0);
    expect(await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.weddingId, w.id))).toHaveLength(0);
    for (const k of keys) expect(await storage().get(k), `${k} should be gone`).toBeNull();
    const logged = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.entityId, w.id));
    expect(logged.map((l) => l.action)).toContain("wedding.deleted");
  });

  it("refuses without the right name, for a client, and when nobody is signed in", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    const title = (await getWedding(admin, w.id)).title || w.slug;
    await expect(deleteWedding(admin, w.id, "not the name")).rejects.toThrow();
    const client = await makeClient(admin, w.id);
    await expect(deleteWedding(client, w.id, title)).rejects.toThrow();
    await expect(deleteWedding(null, w.id, title)).rejects.toThrow();
    expect((await getWedding(admin, w.id)).id).toBe(w.id); // still there
  });
});
