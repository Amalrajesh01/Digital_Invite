import { beforeAll, describe, expect, it } from "vitest";
import { bootstrap, makeWedding, uniq } from "./helpers";
import type { AdminActor } from "@/domain/auth/access";
import { createGuest, ensureInvite } from "@/domain/guests/service";
import { loadPublicInvitation, loadPreviewInvitation } from "@/domain/wedding/public";
import { saveDraft, getWedding, publishWedding, listVersions, rollbackToVersion, createCheckpoint, unpublishWedding, getReadiness, createWedding, duplicateWedding, updateWeddingSettings, setWeddingStatus } from "@/domain/wedding/service";
import { effectiveStatus, yearsTogether } from "@/domain/wedding/lifecycle";
import { newId } from "@/lib/id";
import { getDb, schema } from "@/db/client";
import { eq } from "drizzle-orm";

let admin: AdminActor;
beforeAll(async () => {
  admin = await bootstrap();
});

describe("lifecycle", () => {
  const base = { status: "PUBLISHED" as const, autoLifecycle: true, timezone: "Asia/Kolkata", weddingDate: "2026-11-14" };
  it("follows the calendar once published", () => {
    expect(effectiveStatus(base, new Date("2026-11-01T05:00:00Z"))).toBe("PUBLISHED");
    expect(effectiveStatus(base, new Date("2026-11-14T05:00:00Z"))).toBe("LIVE_EVENT");
    expect(effectiveStatus(base, new Date("2026-11-16T05:00:00Z"))).toBe("POST_EVENT");
    expect(effectiveStatus(base, new Date("2026-12-20T05:00:00Z"))).toBe("MEMORY");
    expect(effectiveStatus(base, new Date("2027-11-14T05:00:00Z"))).toBe("ANNIVERSARY");
    expect(effectiveStatus(base, new Date("2027-11-30T05:00:00Z"))).toBe("MEMORY");
    expect(yearsTogether(base.weddingDate, base.timezone, new Date("2028-11-20T05:00:00Z"))).toBe(2);
  });
  it("respects the wedding's timezone for 'today'", () => {
    // 20:00 UTC on Nov 13 is already Nov 14 in India
    expect(effectiveStatus(base, new Date("2026-11-13T20:00:00Z"))).toBe("LIVE_EVENT");
  });
  it("never auto-advances drafts and honours manual mode", () => {
    expect(effectiveStatus({ ...base, status: "DRAFT" }, new Date("2030-01-01"))).toBe("DRAFT");
    expect(effectiveStatus({ ...base, autoLifecycle: false, status: "MEMORY" }, new Date("2026-01-01"))).toBe("MEMORY");
  });
});

describe("event visibility is enforced on the server", () => {
  it("hides restricted events, their venues and sections from guests outside the group", async () => {
    const privateVenue = newId();
    const w = await makeWedding(admin, "LUXURY", {
      patch: (d) => {
        d.venues.push({ id: privateVenue, name: { en: "Family Home" }, address: { en: "Secret Lane 12" }, city: { en: "Thrissur" }, mapUrl: "", parking: { info: {}, mapUrl: "" }, directions: { airport: {}, railway: {}, road: {} }, landmarkMap: { pins: [] }, hotels: [], nearby: [], shuttle: { info: {}, schedule: [] }, guide: [] } as never);
        d.events.push({ id: "evt-family", name: { en: "Family Puja" }, date: "2099-12-11", startTime: "08:00", endTime: "", venueId: privateVenue, isMain: false, order: 1, description: {}, dressCode: {}, dressColors: [], notes: {}, mapUrl: "", visibility: { mode: "GROUPS", groups: ["bride-family"] }, ritual: { title: {}, body: {} } } as never);
      },
    });
    const db = await getDb();
    const [family] = await db.select().from(schema.guestGroups).where(eq(schema.guestGroups.key, "bride-family"));
    void family;
    const insider = await createGuest(admin, w.id, { name: "Bride Cousin", phone: "9846100001" });
    const outsider = await createGuest(admin, w.id, { name: "Office Friend", phone: "9846100002" });
    const groups = await db.select().from(schema.guestGroups).where(eq(schema.guestGroups.weddingId, w.id));
    const gid = (k: string) => groups.find((g) => g.key === k)!.id;
    await db.update(schema.guests).set({ groupId: gid("bride-family") }).where(eq(schema.guests.id, insider.id));
    await db.update(schema.guests).set({ groupId: gid("office") }).where(eq(schema.guests.id, outsider.id));

    const pub = await loadPublicInvitation(w.slug);
    expect(pub.ok && pub.view.doc.events.map((e) => e.id)).toEqual(["evt-ceremony"]);
    expect(JSON.stringify(pub)).not.toContain("Secret Lane");

    const insiderRes = await loadPublicInvitation(w.slug, await ensureInvite(w.id, insider.id));
    expect(insiderRes.ok && insiderRes.view.doc.events.map((e) => e.id).sort()).toEqual(["evt-ceremony", "evt-family"]);

    const outsiderRes = await loadPublicInvitation(w.slug, await ensureInvite(w.id, outsider.id));
    expect(outsiderRes.ok && outsiderRes.view.doc.events.map((e) => e.id)).toEqual(["evt-ceremony"]);
    expect(JSON.stringify(outsiderRes)).not.toContain("Secret Lane");
    expect(JSON.stringify(outsiderRes)).not.toContain("Family Puja");
  });

  it("ignores event restrictions on packages without the feature (Essential shows everything)", async () => {
    const w = await makeWedding(admin, "ESSENTIAL", {
      patch: (d) => {
        d.events[0].visibility = { mode: "GROUPS", groups: ["vip"] };
      },
    });
    const res = await loadPublicInvitation(w.slug);
    expect(res.ok && res.view.doc.events).toHaveLength(1);
  });
});

describe("what a guest sees depends on package and lifecycle", () => {
  it("Essential sections exclude Signature/Luxury features", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    const res = await loadPublicInvitation(w.slug);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const types = res.view.sections.map((s) => s.type);
    expect(types).toContain("rsvp");
    expect(types).toContain("events");
    expect(types).not.toContain("guestbook");
    expect(types).not.toContain("qrpass");
    expect(types).not.toContain("photowall");
    expect(res.view.entitlements.features).not.toContain("qr_checkin");
  });

  it("Luxury shows live sections only during the celebration and memories afterwards", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const before = await loadPreviewInvitation(w.id, { asStatus: "PUBLISHED" });
    const live = await loadPreviewInvitation(w.id, { asStatus: "LIVE_EVENT", asGuest: true });
    const after = await loadPreviewInvitation(w.id, { asStatus: "MEMORY" });
    const t = (v: typeof before) => v!.sections.map((s) => s.type);
    expect(t(before)).toContain("rsvp");
    expect(t(before)).not.toContain("photowall");
    expect(t(live)).toContain("photowall");
    expect(t(live)).toContain("livesched");
    expect(t(live)).not.toContain("rsvp");
    expect(t(after)).toContain("thankyou");
    expect(t(after)).toContain("memory");
    expect(t(after)).not.toContain("rsvp");
  });

  it("personalised-only invitations demand a valid token", async () => {
    const w = await makeWedding(admin, "SIGNATURE");
    await updateWeddingSettings(admin, w.id, { accessMode: "PERSONALIZED_ONLY" });
    expect(await loadPublicInvitation(w.slug)).toMatchObject({ ok: false, reason: "invite_required" });
    expect(await loadPublicInvitation(w.slug, "x".repeat(24))).toMatchObject({ ok: false, reason: "invalid_invite" });
    const g = await createGuest(admin, w.id, { name: "Invited", phone: "9846100010" });
    const ok = await loadPublicInvitation(w.slug, await ensureInvite(w.id, g.id));
    expect(ok.ok).toBe(true);
  });

  it("never exposes private guest fields in the public payload", async () => {
    const w = await makeWedding(admin, "SIGNATURE");
    const g = await createGuest(admin, w.id, { name: "Priv Guest", phone: "9846100020", email: "priv@example.com", notes: "allergic to nuts" });
    const res = await loadPublicInvitation(w.slug, await ensureInvite(w.id, g.id));
    const json = JSON.stringify(res);
    expect(json).not.toContain("9846100020");
    expect(json).not.toContain("priv@example.com");
    expect(json).not.toContain("allergic");
  });
});

describe("publishing & versions", () => {
  it("blocks publishing until the essentials are filled in, with friendly reasons", async () => {
    const w = await createWedding(admin, { title: "Empty", packageKey: "ESSENTIAL" });
    const issues = await getReadiness(admin, w.id);
    expect(issues.filter((i) => i.level === "error").map((i) => i.code)).toEqual(expect.arrayContaining(["couple.names", "date", "events.none", "slug", "template", "theme"]));
    await expect(publishWedding(admin, w.id)).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("editing the draft never changes the published invitation", async () => {
    const w = await makeWedding(admin, "SIGNATURE");
    const before = await loadPublicInvitation(w.slug);
    expect(before.ok && before.view.doc.couple.bride.name.en).toBe("Anjali");
    const cur = await getWedding(admin, w.id);
    const doc = structuredClone(cur.draftDoc);
    doc.couple.bride.name = { en: "Changed In Draft" };
    await saveDraft(admin, w.id, doc);
    const still = await loadPublicInvitation(w.slug);
    expect(still.ok && still.view.doc.couple.bride.name.en).toBe("Anjali");
    await publishWedding(admin, w.id);
    const now = await loadPublicInvitation(w.slug);
    expect(now.ok && now.view.doc.couple.bride.name.en).toBe("Changed In Draft");
  });

  it("keeps history and rolls back safely (draft first, or live)", async () => {
    const w = await makeWedding(admin, "SIGNATURE");
    const v1 = (await listVersions(admin, w.id)).find((v) => v.isLive)!;
    const cur = await getWedding(admin, w.id);
    const doc = structuredClone(cur.draftDoc);
    doc.couple.groom.name = { en: "Second Edition" };
    await saveDraft(admin, w.id, doc);
    await publishWedding(admin, w.id, { label: "Second" });
    expect((await listVersions(admin, w.id)).length).toBe(2);

    await rollbackToVersion(admin, w.id, v1.id); // restores as draft only
    let pub = await loadPublicInvitation(w.slug);
    expect(pub.ok && pub.view.doc.couple.groom.name.en).toBe("Second Edition");
    expect((await getWedding(admin, w.id)).draftDoc.couple.groom.name.en).toBe("Sidharth");
    expect((await listVersions(admin, w.id)).some((v) => v.kind === "CHECKPOINT")).toBe(true);

    await rollbackToVersion(admin, w.id, v1.id, { goLive: true });
    pub = await loadPublicInvitation(w.slug);
    expect(pub.ok && pub.view.doc.couple.groom.name.en).toBe("Sidharth");
  });

  it("unpublishing takes the invitation offline without deleting anything", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    await unpublishWedding(admin, w.id);
    expect(await loadPublicInvitation(w.slug)).toMatchObject({ ok: false, reason: "unpublished" });
    await publishWedding(admin, w.id);
    expect((await loadPublicInvitation(w.slug)).ok).toBe(true);
    expect((await listVersions(admin, w.id)).length).toBe(2);
  });

  it("checkpoints preserve a draft state", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    const cp = await createCheckpoint(admin, w.id, "before big edit");
    expect(cp.kind).toBe("CHECKPOINT");
  });

  it("refuses to make an unpublished wedding live via status", async () => {
    const w = await makeWedding(admin, "ESSENTIAL", { publish: false });
    await expect(setWeddingStatus(admin, w.id, "LIVE_EVENT")).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("wedding links are unique, validated and cannot use reserved words", async () => {
    await expect(createWedding(admin, { slug: "admin", packageKey: "ESSENTIAL" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createWedding(admin, { slug: "Bad Slug!!", packageKey: "ESSENTIAL" })).resolves.toMatchObject({ slug: "bad-slug" });
    const slug = uniq("dupe");
    await createWedding(admin, { slug, packageKey: "ESSENTIAL" });
    await expect(createWedding(admin, { slug: slug.toUpperCase(), packageKey: "ESSENTIAL" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("duplicating a wedding copies structure but never private data", async () => {
    const w = await makeWedding(admin, "SIGNATURE");
    await createGuest(admin, w.id, { name: "Private Guest", phone: "9846100030" });
    const copy = await duplicateWedding(admin, w.id, { title: "Copy", slug: uniq("copy") });
    const db = await getDb();
    const guests = await db.select().from(schema.guests).where(eq(schema.guests.weddingId, copy.id));
    expect(guests).toHaveLength(0);
    const c = await getWedding(admin, copy.id);
    expect(c.draftDoc.sections.length).toBeGreaterThan(5);
    expect(c.templateId).toBeTruthy();
  });
});
