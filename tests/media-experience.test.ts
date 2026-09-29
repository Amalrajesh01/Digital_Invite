import { beforeAll, describe, expect, it } from "vitest";
import { bootstrap, makeClient, makeWedding, pngBuffer } from "./helpers";
import type { AdminActor, ClientActor } from "@/domain/auth/access";
import { sniffMedia, validateUpload, sanitizeFilename } from "@/domain/media/validate";
import { uploadAsUser, moderateMedia } from "@/domain/media/service";
import { createGuest, ensureInvite } from "@/domain/guests/service";
import { resolveGuestContext } from "@/domain/guests/context";
import { participantFromGuest, participantAnonymous, submitGuestUpload, submitMessage, listPublicMessages, moderateMessage, listMessages, listPhotoWall, listGuestUploads, submitMediaWish, moderateMediaWish, listPublicMediaWishes } from "@/domain/participation/service";
import { getGuestPass, lookupPass, checkInGuest, checkinStats, computeLiveState, parsePassPayload, undoCheckIn, postLiveUpdate, livePayload, setLiveEvent } from "@/domain/live/service";
import { syncCapsule, submitCapsuleItem, listCapsuleItems, capsuleStatus, unlockCapsuleEarly, hideCapsuleItem, capsuleAssetIsPublic } from "@/domain/memory/service";
import { playGame, leaderboard } from "@/domain/games/service";
import { getDb, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { storage } from "@/lib/storage";
import type { WeddingEvent } from "@/domain/doc/schema";

let admin: AdminActor;
let lux: { id: string; slug: string };
let sig: { id: string; slug: string };
let luxClient: ClientActor;

async function guestCtx(w: { id: string; slug: string }, name: string, phone: string, seats = 2) {
  const g = await createGuest(admin, w.id, { name, phone, seats });
  const ctx = await resolveGuestContext(w.slug, await ensureInvite(w.id, g.id));
  return { g, ctx: ctx! };
}

beforeAll(async () => {
  admin = await bootstrap();
  lux = await makeWedding(admin, "LUXURY", {
    date: "2099-06-01",
    patch: (d) => {
      d.games.trivia.questions = [
        { id: "q1", q: { en: "Where did we meet?" }, options: [{ en: "Cafe" }, { en: "College" }], answer: 1 },
        { id: "q2", q: { en: "Fav food?" }, options: [{ en: "Biryani" }, { en: "Pizza" }], answer: 0 },
      ];
      d.games.wheel.prizes = [{ id: "p1", label: { en: "A hug" }, detail: {} }];
      d.games.bingo.squares = Array.from({ length: 9 }, (_, i) => ({ id: `b${i}`, text: { en: `sq${i}` } }));
      d.timeCapsule.unlockDate = "2099-06-02";
      d.timeCapsule.prompt = { en: "Open on our first anniversary" };
    },
  });
  sig = await makeWedding(admin, "SIGNATURE");
  luxClient = await makeClient(admin, lux.id);
});

describe("upload validation", () => {
  it("identifies files by their bytes, not their names", async () => {
    const png = await pngBuffer();
    expect(sniffMedia(png)?.mime).toBe("image/png");
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(sniffMedia(svg)).toBeNull();
    expect(sniffMedia(Buffer.from("<html><script>alert(1)</script></html>".padEnd(40)))).toBeNull();
    expect(sniffMedia(Buffer.from("MZ" + "\u0000".repeat(60)))).toBeNull();
    const heic = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypheic"), Buffer.alloc(20)]);
    expect(sniffMedia(heic)).toBeNull();
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypisom"), Buffer.alloc(20)]);
    expect(sniffMedia(mp4)?.kind).toBe("VIDEO");
  });

  it("rejects the wrong kind of file for the slot and oversize files", async () => {
    const png = await pngBuffer();
    expect(() => validateUpload(png, { allow: ["AUDIO"] })).toThrow(/not accepted/);
    const big = Buffer.concat([png, Buffer.alloc(21 * 1024 * 1024)]);
    expect(() => validateUpload(big, { allow: ["IMAGE"] })).toThrow(/too large/);
  });

  it("sanitises filenames and never uses them as storage keys", async () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("C:\\evil\\photo<script>.png")).toBe("photoscript.png");
    const asset = await uploadAsUser(admin, lux.id, { buffer: await pngBuffer(), filename: "../../../evil.png" }, { category: "GALLERY" });
    expect(asset.storageKey).toMatch(/^w\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/xl\.webp$/);
    expect(asset.filename).toBe("evil.png");
    expect(asset.mime).toBe("image/webp");
    expect(asset.width).toBe(300);
  });

  it("produces responsive variants and stores them", async () => {
    const asset = await uploadAsUser(admin, lux.id, { buffer: await pngBuffer(3000, 2000), filename: "big.png" }, { category: "GALLERY" });
    const variants = (asset.metadata as { variants: Record<string, { key: string; width: number }> }).variants;
    expect(Object.keys(variants).sort()).toEqual(["lg", "md", "sm", "xl"]);
    expect(variants.lg.width).toBe(1600);
    expect(await storage().get(variants.sm.key)).not.toBeNull();
  });

  it("rejects corrupt images with a friendly error and leaves no orphans", async () => {
    const bad = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 7)]);
    await expect(uploadAsUser(admin, lux.id, { buffer: bad, filename: "x.jpg" }, { category: "GALLERY" })).rejects.toMatchObject({ code: "UPLOAD_REJECTED" });
  });
});

describe("guest content is moderated before it goes public", () => {
  it("guest photos start pending & private, and appear on the wall only after approval", async () => {
    const { ctx } = await guestCtx(lux, "Photo Guest", "9846200001");
    const res = await submitGuestUpload(participantFromGuest(ctx), { buffer: await pngBuffer(), filename: "party.png" });
    expect(res.moderation).toBe("PENDING");
    expect(await listPhotoWall(lux.id)).toHaveLength(0);
    expect((await listGuestUploads(luxClient, lux.id, "PENDING")).length).toBe(1);
    await moderateMedia(luxClient, lux.id, res.id, "APPROVED", "live_photo_wall");
    const wall = await listPhotoWall(lux.id);
    expect(wall).toHaveLength(1);
    expect(wall[0].by).toBe("Photo Guest");
    await moderateMedia(luxClient, lux.id, res.id, "REJECTED", "live_photo_wall");
    expect(await listPhotoWall(lux.id)).toHaveLength(0);
  });

  it("wall polling with `since` only returns newer approvals", async () => {
    const { ctx } = await guestCtx(lux, "Wall Guest", "9846200002");
    const a = await submitGuestUpload(participantFromGuest(ctx), { buffer: await pngBuffer(), filename: "a.png" });
    await moderateMedia(admin, lux.id, a.id, "APPROVED");
    const marker = new Date();
    await new Promise((r) => setTimeout(r, 15));
    const b = await submitGuestUpload(participantFromGuest(ctx), { buffer: await pngBuffer(320, 240), filename: "b.png" });
    await moderateMedia(admin, lux.id, b.id, "APPROVED");
    const fresh = await listPhotoWall(lux.id, { since: marker });
    expect(fresh.map((f) => f.id)).toEqual([b.id]);
  });

  it("wishes stay hidden until approved; private messages are never public", async () => {
    const { ctx } = await guestCtx(lux, "Wisher", "9846200003");
    const p = participantFromGuest(ctx);
    const wish = await submitMessage(p, { kind: "WISH", body: "Congratulations, you two!" });
    await submitMessage(p, { kind: "PRIVATE", body: "A secret only for you" });
    expect(await listPublicMessages(lux.id)).toHaveLength(0);
    await moderateMessage(luxClient, lux.id, wish.id, "APPROVED");
    const pub = await listPublicMessages(lux.id);
    expect(pub.map((m) => m.body)).toEqual(["Congratulations, you two!"]);
  });

  it("sealed private messages cannot be read, even by the couple, before their unlock time", async () => {
    const { ctx } = await guestCtx(lux, "Sealer", "9846200004");
    await submitMessage(participantFromGuest(ctx), { kind: "PRIVATE", body: "Read this after the wedding", sealed: true });
    const rows = await listMessages(luxClient, lux.id, { kind: "PRIVATE" });
    const mine = rows.find((r) => r.authorName === "Sealer")!;
    expect(mine.sealed).toBe(true);
    expect(mine.body).toBe("");
  });

  it("video and voice wishes are moderated too", async () => {
    const { ctx } = await guestCtx(lux, "Voice Guest", "9846200005");
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypisom"), Buffer.alloc(200)]);
    const w = await submitMediaWish(participantFromGuest(ctx), "VIDEO", { buffer: mp4, filename: "wish.mp4" }, "Best wishes");
    expect(await listPublicMediaWishes(lux.id, "VIDEO")).toHaveLength(0);
    await moderateMediaWish(luxClient, lux.id, w.id, "APPROVED");
    expect(await listPublicMediaWishes(lux.id, "VIDEO")).toHaveLength(1);
  });

  it("features are enforced per package for guests too", async () => {
    const { ctx } = await guestCtx(sig, "Sig Guest", "9846200006");
    await expect(submitMediaWish(participantFromGuest(ctx), "VOICE", { buffer: Buffer.alloc(100), filename: "v.webm" })).rejects.toMatchObject({ code: "FEATURE_UNAVAILABLE" });
    const ess = await makeWedding(admin, "ESSENTIAL");
    const anon = participantAnonymous(ess.id, "Visitor", "9.9.9.9");
    await expect(submitMessage(anon, { kind: "WISH", body: "Hello there" })).rejects.toMatchObject({ code: "FEATURE_UNAVAILABLE" });
    await expect(submitGuestUpload(anon, { buffer: await pngBuffer(), filename: "a.png" })).rejects.toMatchObject({ code: "FEATURE_UNAVAILABLE" });
  });
});

describe("QR pass and check-in", () => {
  it("issues a stable pass, checks the guest in once, and shows the check-in on the dashboard", async () => {
    const { g, ctx } = await guestCtx(lux, "Pass Guest", "9846200010", 3);
    const pass = await getGuestPass(ctx);
    expect(pass.seats).toBe(3);
    expect((await getGuestPass(ctx)).code).toBe(pass.code);
    expect(parsePassPayload(pass.payload)).toBe(pass.code);
    const found = await lookupPass(luxClient, lux.id, pass.payload);
    expect(found.name).toBe("Pass Guest");
    const first = await checkInGuest(luxClient, lux.id, { guestId: found.guestId, eventId: "evt-ceremony", seats: 2 });
    expect(first.alreadyCheckedIn).toBe(false);
    const second = await checkInGuest(luxClient, lux.id, { guestId: found.guestId, eventId: "evt-ceremony" });
    expect(second.alreadyCheckedIn).toBe(true);
    const stats = await checkinStats(luxClient, lux.id, "evt-ceremony");
    expect(stats.checkedInGuests).toBeGreaterThanOrEqual(1);
    expect(stats.checkedInSeats).toBeGreaterThanOrEqual(2);
    await undoCheckIn(luxClient, lux.id, g.id, "evt-ceremony");
    expect((await lookupPass(luxClient, lux.id, pass.payload)).checkins).toHaveLength(0);
  });

  it("caps admitted seats at the reservation", async () => {
    const { g } = await guestCtx(lux, "Cap Guest", "9846200011", 2);
    const r = await checkInGuest(admin, lux.id, { guestId: g.id, eventId: "evt-ceremony", seats: 9 });
    expect(r.seats).toBe(2);
  });

  it("a pass from another wedding is rejected and unknown events are refused", async () => {
    const other = await makeWedding(admin, "LUXURY");
    const { ctx } = await guestCtx(other, "Other Guest", "9846200012");
    const pass = await getGuestPass(ctx);
    await expect(lookupPass(luxClient, lux.id, pass.payload)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(lookupPass(luxClient, lux.id, "not a pass!!")).rejects.toMatchObject({ code: "VALIDATION" });
    const { g } = await guestCtx(lux, "Event Guest", "9846200013");
    await expect(checkInGuest(luxClient, lux.id, { guestId: g.id, eventId: "nope" })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("a client of one wedding cannot check guests into another", async () => {
    const other = await makeWedding(admin, "LUXURY");
    const { g } = await guestCtx(other, "Victim", "9846200014");
    await expect(checkInGuest(luxClient, other.id, { guestId: g.id, eventId: "evt-ceremony" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("live event", () => {
  const ev = (id: string, date: string, s: string, e: string): WeddingEvent => ({ id, name: { en: id }, date, startTime: s, endTime: e, description: {}, dressCode: {}, dressColors: [], notes: {}, mapUrl: "", visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: {}, body: {} }, isMain: false, order: 0 });
  it("computes now / next from the clock and honours a manual override", () => {
    const events = [ev("haldi", "2030-01-10", "09:00", "11:00"), ev("wedding", "2030-01-10", "12:00", "14:00"), ev("reception", "2030-01-10", "19:00", "22:00")];
    const at = (t: string) => new Date(`2030-01-10T${t}:00+05:30`);
    expect(computeLiveState(events, "Asia/Kolkata", null, null, at("10:00")).current?.id).toBe("haldi");
    const between = computeLiveState(events, "Asia/Kolkata", null, null, at("11:30"));
    expect(between.current).toBeNull();
    expect(between.next?.id).toBe("wedding");
    expect(computeLiveState(events, "Asia/Kolkata", null, null, at("13:00")).next?.id).toBe("reception");
    const manual = computeLiveState(events, "Asia/Kolkata", "reception", "Running early", at("10:00"));
    expect(manual.current?.id).toBe("reception");
    expect(manual.mode).toBe("MANUAL");
    expect(computeLiveState(events, "Asia/Kolkata", null, null, at("23:00")).next).toBeNull();
  });

  it("publishes updates and reflects the manually selected event", async () => {
    await postLiveUpdate(luxClient, lux.id, { title: { en: "Baraat has arrived" }, pinned: true });
    await setLiveEvent(luxClient, lux.id, "evt-ceremony", "Muhurtham starting");
    const p = await livePayload(lux.id, null);
    expect(p.updates[0].title.en).toBe("Baraat has arrived");
    expect(p.now?.id).toBe("evt-ceremony");
    await expect(setLiveEvent(luxClient, lux.id, "ghost")).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("time capsule is locked on the server", () => {
  it("hides all content before the unlock date, from everyone", async () => {
    const { ctx } = await guestCtx(lux, "Capsule Guest", "9846200020");
    await submitCapsuleItem(participantFromGuest(ctx), { kind: "TEXT", body: "Dear future us, keep dancing." });
    const status = await capsuleStatus(lux.id);
    expect(status?.unlocked).toBe(false);
    expect(status?.count).toBe(1);
    expect(await listCapsuleItems(lux.id)).toEqual([]);
    expect(JSON.stringify(status)).not.toContain("keep dancing");
  });

  it("opens at the unlock moment, lets the couple hide items, and keeps media private while locked", async () => {
    const { ctx } = await guestCtx(lux, "Photo Capsule", "9846200021");
    const item = await submitCapsuleItem(participantFromGuest(ctx), { kind: "PHOTO" }, { buffer: await pngBuffer(), filename: "cap.png" });
    const db = await getDb();
    const [row] = await db.select().from(schema.timeCapsuleItems).where(eq(schema.timeCapsuleItems.id, item.id));
    expect(await capsuleAssetIsPublic(row.assetId!)).toBe(false);
    const future = new Date("2099-06-03T00:00:00Z");
    const items = await listCapsuleItems(lux.id, {}, future);
    expect(items.map((i) => i.authorName)).toEqual(expect.arrayContaining(["Capsule Guest", "Photo Capsule"]));
    expect(await capsuleAssetIsPublic(row.assetId!, future)).toBe(true);
  });

  it("refuses new entries after opening, and only Super Admin can open early (audited)", async () => {
    const w = await makeWedding(admin, "LUXURY", { patch: (d) => { d.timeCapsule.unlockDate = "2099-01-01"; } });
    const c = await makeClient(admin, w.id);
    await expect(unlockCapsuleEarly(c, w.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const { ctx } = await guestCtx(w, "Early Bird", "9846200022");
    await submitCapsuleItem(participantFromGuest(ctx), { kind: "TEXT", body: "Hello future" });
    await syncCapsule(w.id);
    await unlockCapsuleEarly(admin, w.id);
    expect((await capsuleStatus(w.id))?.unlocked).toBe(true);
    await expect(submitCapsuleItem(participantFromGuest(ctx), { kind: "TEXT", body: "Too late" })).rejects.toMatchObject({ code: "LOCKED" });
    const items = await listCapsuleItems(w.id);
    await hideCapsuleItem(c, w.id, items[0].id, true);
    expect(await listCapsuleItems(w.id)).toHaveLength(0);
    const audits = await (await getDb()).select().from(schema.auditLogs).where(eq(schema.auditLogs.action, "capsule.unlocked_early"));
    expect(audits.length).toBeGreaterThan(0);
  });

  it("unavailable on packages without the feature", async () => {
    const { ctx } = await guestCtx(sig, "No Capsule", "9846200023");
    await expect(submitCapsuleItem(participantFromGuest(ctx), { kind: "TEXT", body: "hello" })).rejects.toMatchObject({ code: "FEATURE_UNAVAILABLE" });
  });
});

describe("games are scored on the server", () => {
  it("scores trivia from the configured answers and allows one play per guest", async () => {
    const { ctx } = await guestCtx(lux, "Quizzer", "9846200030");
    const p = participantFromGuest(ctx);
    const res = await playGame(p, { game: "TRIVIA", answers: { q1: 1, q2: 1 } });
    expect(res).toMatchObject({ score: 10, max: 20 });
    const replay = await playGame(p, { game: "TRIVIA", answers: { q1: 1, q2: 0 } });
    expect(replay.alreadyPlayed).toBe(true);
    expect(replay.score).toBe(10);
  });

  it("cannot be cheated with fake scores; unknown games and disabled games fail", async () => {
    const { ctx } = await guestCtx(lux, "Cheater", "9846200031");
    const res = await playGame(participantFromGuest(ctx), { game: "TRIVIA", answers: { q1: 0, q2: 1 }, score: 9999 } as never);
    expect(res.score).toBe(0);
    await expect(playGame(participantFromGuest(ctx), { game: "POKER" })).rejects.toBeTruthy();
    const { ctx: sctx } = await guestCtx(sig, "Sig Player", "9846200032");
    await expect(playGame(participantFromGuest(sctx), { game: "WHEEL" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bingo counts completed lines; the wheel picks a server-side prize", async () => {
    const { ctx } = await guestCtx(lux, "Bingo Guest", "9846200033");
    const p = participantFromGuest(ctx);
    const bingo = await playGame(p, { game: "BINGO", marked: ["b0", "b1", "b2", "b4"] });
    expect(bingo.score).toBe(20);
    const wheel = await playGame(p, { game: "WHEEL" });
    expect(wheel.detail?.label).toBe("A hug");
  });

  it("ranks the leaderboard by total points (Luxury only)", async () => {
    const board = await leaderboard(lux.id, 5);
    expect(board[0].rank).toBe(1);
    expect(board[0].total).toBeGreaterThanOrEqual(board[board.length - 1].total);
    expect(await leaderboard(sig.id)).toEqual([]);
  });
});

