import { beforeAll, describe, expect, it } from "vitest";
import { bootstrap, makeClient, makeWedding, pngBuffer } from "./helpers";
import type { AdminActor, ClientActor } from "@/domain/auth/access";
import { getWedding, listWeddings, saveDraft, updateWeddingSettings, publishWedding, archiveWedding } from "@/domain/wedding/service";
import { createGuest, listGuests } from "@/domain/guests/service";
import { listMedia, uploadAsUser } from "@/domain/media/service";
import { rsvpSummary } from "@/domain/guests/rsvp";
import { listMessages } from "@/domain/participation/service";
import { lookupPass } from "@/domain/live/service";

let admin: AdminActor;
let a: { id: string; slug: string };
let b: { id: string; slug: string };
let clientA: ClientActor;

beforeAll(async () => {
  admin = await bootstrap();
  a = await makeWedding(admin, "SIGNATURE");
  b = await makeWedding(admin, "SIGNATURE");
  clientA = await makeClient(admin, a.id);
  await makeClient(admin, b.id);
  await createGuest(admin, a.id, { name: "Guest of A", phone: "9846000001" });
  await createGuest(admin, b.id, { name: "Guest of B", phone: "9846000002" });
});

describe("tenant isolation", () => {
  it("a client sees only their own wedding in lists", async () => {
    const list = await listWeddings(clientA);
    expect(list.map((w) => w.id)).toEqual([a.id]);
  });

  it("a client cannot read another wedding — and cannot tell whether it exists", async () => {
    await expect(getWedding(clientA, b.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getWedding(clientA, "00000000-0000-0000-0000-000000000000")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("guests, RSVPs, media and messages are scoped to the caller's wedding", async () => {
    expect((await listGuests(clientA, a.id)).map((g) => g.name)).toEqual(["Guest of A"]);
    await expect(listGuests(clientA, b.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(rsvpSummary(clientA, b.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(listMedia(clientA, b.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(listMessages(clientA, b.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(createGuest(clientA, b.id, { name: "Intruder" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await listGuests(admin, b.id)).map((g) => g.name)).toEqual(["Guest of B"]);
  });

  it("uploads and settings writes are also tenant-checked", async () => {
    const file = { buffer: await pngBuffer(), filename: "x.png" };
    await expect(uploadAsUser(clientA, b.id, file, { category: "GALLERY" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(updateWeddingSettings(clientA, b.id, { contactEmail: "x@y.com" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(saveDraft(clientA, b.id, {})).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("clients cannot change design, package, slug or publish", async () => {
    await expect(updateWeddingSettings(clientA, a.id, { packageKey: "LUXURY" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateWeddingSettings(clientA, a.id, { slug: "hijack" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateWeddingSettings(clientA, a.id, { themeOverrides: {} })).rejects.toMatchObject({ code: "FORBIDDEN" });
    // A client may publish updates to an already-launched invitation, but not un-publish, archive or launch one.
    const draftOnly = await makeWedding(admin, "SIGNATURE", { publish: false });
    const fresh = await makeClient(admin, draftOnly.id);
    await expect(publishWedding(fresh, draftOnly.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(publishWedding(clientA, a.id)).resolves.toBeTruthy();
    await expect(archiveWedding(clientA, a.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateWeddingSettings(clientA, a.id, { contactEmail: "family@example.com" })).resolves.toBeTruthy();
  });

  it("client edits to the draft never touch layout (sections) or design fields", async () => {
    const w = await getWedding(admin, a.id);
    const tampered = structuredClone(w.draftDoc);
    tampered.sections = [];
    tampered.opening.variant = "none";
    tampered.contacts = [{ id: "c1", name: { en: "Uncle" }, role: { en: "Host" }, phone: "9846000000" }];
    await saveDraft(clientA, a.id, tampered);
    const after = await getWedding(admin, a.id);
    expect(after.draftDoc.sections.length).toBe(w.draftDoc.sections.length);
    expect(after.draftDoc.opening.variant).toBe(w.draftDoc.opening.variant);
    expect(after.draftDoc.contacts[0].name.en).toBe("Uncle");
  });

  it("unauthenticated callers get UNAUTHORIZED", async () => {
    await expect(getWedding(null, a.id)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(listGuests(null, a.id)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("package boundaries", () => {
  it("Essential weddings have no client dashboard and no guest management", async () => {
    const e = await makeWedding(admin, "ESSENTIAL");
    const client = await makeClient(admin, e.id);
    await expect(getWedding(client, e.id)).rejects.toMatchObject({ code: "FEATURE_UNAVAILABLE" });
    await expect(createGuest(admin, e.id, { name: "Nope" })).rejects.toMatchObject({ code: "FEATURE_UNAVAILABLE" });
  });

  it("Signature clients cannot use Luxury features even via direct calls", async () => {
    await expect(lookupPass(clientA, a.id, "ABCDEFGHJK")).rejects.toMatchObject({ code: "FEATURE_UNAVAILABLE" });
  });
});
