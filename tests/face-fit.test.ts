import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { getDb, schema } from "@/db/client";
import { detectHead } from "@/domain/media/face";
import { ensureFaces, ingestFile } from "@/domain/media/service";
import { fitFor, headFromBox } from "@/invitation/engine/headfit";
import type { AdminActor } from "@/domain/auth/access";
import { bootstrap, makeWedding, pngBuffer } from "./helpers";

// a front-facing portrait that ships with the repo (a woman against a dark background, face in the upper middle)
const portrait = () => readFileSync("assets/stock/aHJ0hciTzG4.jpg");

describe("finding a head in a photograph", () => {
  it("finds the face in an ordinary portrait, in the upper middle of the picture", async () => {
    const head = await detectHead(portrait());
    expect(head).not.toBeNull();
    expect(head!.x).toBeGreaterThan(0.35); expect(head!.x).toBeLessThan(0.65);
    expect(head!.y).toBeGreaterThan(0.2); expect(head!.y).toBeLessThan(0.5);
    expect(head!.size).toBeGreaterThan(0.2); expect(head!.size).toBeLessThan(0.6);
  });

  it("finds nothing in a plain picture, and the figure then keeps its fixed framing", async () => {
    expect(await detectHead(await pngBuffer(400, 300))).toBeNull();
    expect(fitFor(null)).toBeNull();
  });

  it("zooms a small face in and a large face out, so the head always fills the circle about the same", () => {
    const small = fitFor({ x: 0.5, y: 0.4, size: 0.2 })!, large = fitFor({ x: 0.5, y: 0.4, size: 0.8 })!;
    expect(small.zoom).toBeGreaterThan(large.zoom);
    expect(small.zoom * 0.2).toBeCloseTo(large.zoom * 0.8, 5);
    expect(fitFor({ x: 0.5, y: 0.5, size: 1 })!.zoom).toBeGreaterThanOrEqual(0.4); // never zoomed out of the allowed range
  });

  it("turns the detector's face box into a head: wider than the face and a little higher", () => {
    const h = headFromBox({ x: 40, y: 40, size: 40 }, 200, 200)!;
    expect(h.x).toBeCloseTo(0.3, 5);
    expect(h.size).toBeCloseTo(0.28, 5);
    expect(h.y).toBeLessThan(0.3); // centre of the box would be 0.3
    expect(headFromBox(undefined, 200, 200)).toBeNull();
  });
});

describe("remembering where the face is", () => {
  let admin: AdminActor;
  beforeAll(async () => { admin = await bootstrap(); });

  it("looks for it at upload for the photographs a figure's head can come from, and later for older ones, once", async () => {
    const w = await makeWedding(admin, "SIGNATURE");
    const db = await getDb();
    const bride = await ingestFile({ weddingId: w.id, buffer: portrait(), filename: "bride.jpg", category: "BRIDE", allow: ["IMAGE"], source: "ADMIN" });
    expect((bride.metadata as { face?: unknown }).face).toMatchObject({ x: expect.any(Number), y: expect.any(Number), size: expect.any(Number) });

    // an older photograph: uploaded under another category, so nobody has looked at it yet
    const old = await ingestFile({ weddingId: w.id, buffer: portrait(), filename: "old.jpg", category: "OTHER", allow: ["IMAGE"], source: "ADMIN" });
    expect((old.metadata as { face?: unknown }).face).toBeUndefined();
    const found = await ensureFaces(w.id, [old.id, undefined]);
    expect(found.get(old.id)).not.toBeNull();
    const [row] = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, old.id));
    expect((row.metadata as { face?: unknown }).face).toEqual(found.get(old.id));

    // a picture with no face is remembered as "none", not looked at again
    const blank = await ingestFile({ weddingId: w.id, buffer: await sharp({ create: { width: 400, height: 300, channels: 3, background: "#336" } }).jpeg().toBuffer(), filename: "wall.jpg", category: "OTHER", allow: ["IMAGE"], source: "ADMIN" });
    expect((await ensureFaces(w.id, [blank.id])).get(blank.id)).toBeNull();
    const [row2] = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, blank.id));
    expect((row2.metadata as { face?: unknown }).face).toBeNull();
  });
});
