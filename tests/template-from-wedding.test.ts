import { describe, expect, it, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { saveWeddingAsTemplate } from "@/domain/design/service";
import { duplicateWedding, getWedding } from "@/domain/wedding/service";
import type { AdminActor } from "@/domain/auth/access";
import { bootstrap, makeWedding } from "./helpers";

let admin: AdminActor;
beforeAll(async () => { admin = await bootstrap(); });

describe("keeping an edited invitation as a new template", () => {
  it("copies its sections, opening and colours — as a draft — and none of its words", async () => {
    const w = await makeWedding(admin, "SIGNATURE");
    const full = await getWedding(admin, w.id);
    const t = await saveWeddingAsTemplate(admin, w.id, { name: "My own design" });
    expect(t.status).toBe("DRAFT");
    expect(t.slug).toBe("my-own-design");
    const config = t.config as { opening: string; sections: { type: string }[] };
    expect(config.opening).toBe(full.draftDoc.opening.variant);
    expect(config.sections.map((s) => s.type)).toEqual([...full.draftDoc.sections].sort((a, b) => a.order - b.order).map((s) => s.type));
    expect(JSON.stringify(t.config)).not.toContain(full.title);
  });

  it("refuses a nameless template", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    await expect(saveWeddingAsTemplate(admin, w.id, { name: "  " })).rejects.toThrow();
  });
});

describe("duplicating a sample invitation", () => {
  it("makes a paid customer's invitation, not another free portfolio one, and not a sample", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const db = await getDb();
    await db.update(schema.weddings).set({ isDemo: true, customerClass: "FREE_PORTFOLIO" }).where(eq(schema.weddings.id, w.id));
    const copy = await duplicateWedding(admin, w.id, { title: "Cousin's wedding" });
    const row = await getWedding(admin, copy.id);
    expect(row.isDemo).toBe(false);
    expect(row.customerClass).toBe("PAID_LUXURY");
  });
});
