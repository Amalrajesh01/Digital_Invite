import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { bootstrap, uniq } from "./helpers";
import type { AdminActor } from "@/domain/auth/access";
import { LETTERS, availableTags, letterBySlug } from "@/domain/letters";
import { GATE_STYLES, LETTER_CATEGORIES, type Beat } from "@/domain/letters/types";
import { applyGuards, beatHasContent, checkSpec, cleanValues, demoValues, guardsOf, itemsOf, missingRequired, textOf, withoutPhoto } from "@/domain/letters/values";
import { listLettersForAdmin, listPublicLetters, setLetterEnabled, submitLetterReply } from "@/domain/letters/service";
import { LETTER_IMAGES } from "@/domain/letters/images";
import { describeExperience } from "@/domain/letters/describe";
import { adminDeleteGift, adminPublishGift, createGift, getGiftForOwner, saveGift, setGiftMusic, submitGift } from "@/domain/gifts/service";
import { MUSIC_LIBRARY } from "@/domain/music/library";
import { loadPublicInvitation } from "@/domain/wedding/public";
import { musicLink } from "@/invitation/letters/Text";

let admin: AdminActor;
beforeAll(async () => { admin = await bootstrap(); });

const ip = () => uniq("ip");
const OWN = "11111111-1111-4111-8111-111111111111";

describe("the catalogue of Forever Letters", () => {
  it("has fifty experiences, numbered 1 to 50, each with a slug and a heading of its own", () => {
    expect(LETTERS.length).toBe(50);
    expect(LETTERS.map((l) => l.n)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    expect(new Set(LETTERS.map((l) => l.slug)).size).toBe(50);
    expect(new Set(LETTERS.map((l) => l.title)).size).toBe(50);
  });

  it("is sound: every reference resolves, every opening is one of ours, every image is in the manifest", () => {
    const known = new Set(LETTER_IMAGES.map((i) => i.id));
    for (const l of LETTERS) {
      expect(checkSpec(l), l.slug).toEqual([]);
      expect(known.has(l.backdrop), `${l.slug} backdrop`).toBe(true);
      const gate = l.beats[0] as Extract<Beat, { type: "gate" }>;
      expect(GATE_STYLES).toContain(gate.style);
      expect(describeExperience(l).length, l.slug).toBeGreaterThan(2);
    }
  });

  it("gives every experience a distinct identity: no two share a palette, and the openings, mechanics and endings vary widely", () => {
    expect(new Set(LETTERS.map((l) => JSON.stringify(l.palette))).size).toBe(50);
    expect(new Set(LETTERS.map((l) => (l.beats[0] as { style: string }).style)).size).toBeGreaterThanOrEqual(25);
    expect(new Set(LETTERS.map((l) => `${l.fonts.display}/${l.fonts.body}`)).size).toBeGreaterThanOrEqual(25);
    // the opening, the mechanics and the way its words arrive, taken together, are never the same twice
    const shape = (l: (typeof LETTERS)[number]) => l.beats.map((b) => (b.type === "gate" ? `gate:${b.style}` : b.type === "lines" ? `lines:${b.mode ?? "fade"}` : b.type)).join(">");
    expect(new Set(LETTERS.map(shape)).size).toBe(50);
    expect(new Set(LETTERS.flatMap((l) => l.beats.map((b) => b.type))).size).toBeGreaterThanOrEqual(24);
    for (const m of ["elegant", "cinematic", "playful", "immersive", "dark"]) expect(LETTERS.some((l) => l.motion === m), m).toBe(true);
  });

  it("keeps the dark theme for the two closure experiences, and keeps them free of games, replies and celebration", () => {
    const closure = LETTERS.filter((l) => l.category === "closure");
    expect(closure.map((l) => l.n)).toEqual([49, 50]);
    for (const l of LETTERS) expect(l.tone === "dark", l.slug).toBe(l.category === "closure");
    for (const l of closure) {
      expect(l.palette.dark).toBe(true);
      expect(l.motion).toBe("dark");
      expect(l.reply).toBe(false);
      expect(l.beats.some((b) => b.type === "ask")).toBe(false);
      expect(l.beats.some((b) => ["quiz", "flip", "deck", "envelopes", "scratch", "order", "match", "tiles", "choose", "clues", "countdown"].includes(b.type))).toBe(false);
      expect(l.beats.find((b) => b.type === "closing")).toMatchObject({ scene: "dark" });
    }
    // and nothing else is dressed as breakup
    expect(LETTERS.filter((l) => l.tone !== "dark" && l.motion === "dark")).toEqual([]);
  });

  it("allows the playful moving “No” only in lighthearted date and confession invitations, never in an apology or a serious question", () => {
    const playful = LETTERS.filter((l) => l.playfulNo).map((l) => l.n);
    expect(playful).toEqual([1, 3, 4]);
    for (const l of LETTERS.filter((x) => x.category === "repair" || x.category === "closure" || x.category === "proposal")) expect(l.playfulNo, l.slug).toBeFalsy();
  });

  it("lets every question be declined or deferred, and builds the filters only from tags that exist", () => {
    for (const l of LETTERS) for (const b of l.beats) if (b.type === "ask") expect(b.choices.some((c) => ["no", "later", "talk", "open"].includes(c.kind)), l.slug).toBe(true);
    const cards = LETTERS.map((l) => ({ tags: l.tags }));
    const tags = availableTags(cards).map((t) => t.key);
    expect(tags).toContain("closure");
    expect(availableTags(cards.filter((c) => !c.tags.includes("distance"))).map((t) => t.key)).not.toContain("distance");
    expect(LETTER_CATEGORIES.length).toBe(6);
  });

  it("asks for a sincere message before a peace offering and an apology can be sent", () => {
    for (const slug of ["i-owe-you-an-apology", "a-little-peace-offering", "the-things-i-should-have-said"]) {
      const l = letterBySlug(slug)!;
      expect(missingRequired(l, {}).length, slug).toBeGreaterThan(0);
      expect(missingRequired(l, demoValues(l)), slug).toEqual([]);
    }
    const peace = letterBySlug("a-little-peace-offering")!;
    expect(peace.beats.findIndex((b) => b.type === "lines" && b.src === "@sincere")).toBeLessThan(peace.beats.findIndex((b) => b.type === "lines" && b.src === "@memory"));
  });
});

describe("what a sender writes", () => {
  const spec = letterBySlug("the-mystery-date")!;

  it("falls back to the suggested words only for what was never touched, and keeps what was cleared on purpose", () => {
    expect(textOf(spec, {}, "opening")).toBe("A small envelope has found you.");
    expect(textOf(spec, { opening: "" }, "opening")).toBe("");
    expect(textOf(spec, {}, "where")).toBe(""); // a personal fact never has a default
  });

  it("drops what the spec did not ask for, limits length and keeps only the sender's own photographs", () => {
    const v = cleanValues(spec, { opening: "x".repeat(900), hacker: "<script>", revealPlace: "yes", themeReveal: "Rooftop", clues: [{ text: "a", icon: "moon", evil: "1" }, { text: "b", icon: "not-an-icon" }] }, (id) => id === OWN);
    expect(v.hacker).toBeUndefined();
    expect((v.opening as string).length).toBeLessThanOrEqual(160);
    expect(v.revealPlace).toBe(""); // a toggle is on or off, nothing else
    expect(v.clues).toEqual([{ text: "a", icon: "moon" }, { text: "b", icon: "" }]);
    const withPhoto = letterBySlug("our-little-museum")!;
    const w = cleanValues(withPhoto, { exhibits: [{ title: "A", caption: "c", photo: OWN, note: "" }, { title: "B", caption: "c", photo: "22222222-2222-4222-8222-222222222222", note: "" }] }, (id) => id === OWN);
    expect(itemsOf(withPhoto, w, "exhibits").map((e) => e.photo)).toEqual([OWN, ""]);
    expect(withoutPhoto(withPhoto, w, OWN).exhibits).toEqual([{ title: "A", caption: "c", photo: "", note: "" }, { title: "B", caption: "c", photo: "", note: "" }]);
  });

  it("removes a private place from the recipient's copy unless the sender switched it on", () => {
    const guards = guardsOf(spec);
    expect(guards).toEqual({ where: "revealPlace" });
    const v = { where: "The Terrace", revealPlace: "" };
    expect(applyGuards(v, guards).where).toBeUndefined();
    expect(applyGuards({ ...v, revealPlace: "1" }, guards).where).toBe("The Terrace");
    const guess = guardsOf(letterBySlug("guess-who-is-thinking-about-you")!);
    expect(guess).toEqual({ reveal: "revealName" });
  });

  it("shows a countdown only for a real date that has not passed", () => {
    const l = letterBySlug("a-thousand-miles-one-heart")!;
    const b = l.beats.find((x) => x.type === "countdown")!;
    expect(beatHasContent(l, {}, b)).toBe(false);
    expect(beatHasContent(l, { meetDate: "2001-01-01" }, b)).toBe(false);
    expect(beatHasContent(l, { meetDate: "2999-01-01" }, b)).toBe(true);
    expect(beatHasContent(l, { meetDate: "next friday" }, b)).toBe(false);
  });

  it("offers a link to a song only when it is https and a known music service", () => {
    expect(musicLink("https://open.spotify.com/track/abc")).toContain("spotify");
    expect(musicLink("http://open.spotify.com/track/abc")).toBeNull();
    expect(musicLink("https://evil.example/spotify.com")).toBeNull();
    expect(musicLink("javascript:alert(1)")).toBeNull();
  });
});

describe("making, publishing and answering a Forever Letter", () => {
  async function make(slug: string, patch: (love: Awaited<ReturnType<typeof getGiftForOwner>>["love"]) => void = () => undefined) {
    const made = await createGift({ scenario: slug, ipKey: ip() });
    const g = await getGiftForOwner(made.id, made.token);
    const love = structuredClone(g.love);
    love.to = "Meera"; love.from = "Arjun";
    patch(love);
    await saveGift(made.id, made.token, love);
    return { ...made, love };
  }

  it("starts a gift for the chosen experience and refuses one that does not exist or is switched off", async () => {
    const made = await createGift({ scenario: "one-question-one-heart", ipKey: ip() });
    const g = await getGiftForOwner(made.id, made.token);
    expect(g.love.experience).toBe("forever");
    expect(g.letter?.slug).toBe("one-question-one-heart");
    expect(g.love.forever.replies).toBe("collect");
    await expect(createGift({ scenario: "no-such-letter", ipKey: ip() })).rejects.toThrow();
    await setLetterEnabled(admin, "the-mystery-date", false);
    await expect(createGift({ scenario: "the-mystery-date", ipKey: ip() })).rejects.toThrow(/not available/);
    expect((await listPublicLetters()).some((c) => c.slug === "the-mystery-date")).toBe(false);
    expect((await listLettersForAdmin(admin)).find((c) => c.slug === "the-mystery-date")?.enabled).toBe(false);
    await setLetterEnabled(admin, "the-mystery-date", true);
    expect((await listPublicLetters()).length).toBe(50);
  });

  it("lets a letter use a track from the licensed music library, with its credit, replacing any earlier song", async () => {
    const made = await createGift({ scenario: "the-letter-i-would-read-to-you", ipKey: ip() });
    const first = MUSIC_LIBRARY[0], second = MUSIC_LIBRARY[1];
    expect((await setGiftMusic(made.id, made.token, { library: first.id }))?.title).toBe(first.title);
    expect((await getGiftForOwner(made.id, made.token)).music?.title).toBe(first.title);
    expect((await setGiftMusic(made.id, made.token, { library: second.id }))?.title).toBe(second.title);
    expect((await getGiftForOwner(made.id, made.token)).music?.title).toBe(second.title);
    await expect(setGiftMusic(made.id, made.token, { library: "no-such-track" })).rejects.toThrow();
    expect(await setGiftMusic(made.id, made.token, null)).toBeNull();
  });

  it("never collects answers for an experience that asks for none", async () => {
    const made = await createGift({ scenario: "the-goodbye-i-could-never-write", ipKey: ip() });
    expect((await getGiftForOwner(made.id, made.token)).love.forever.replies).toBe("off");
  });

  it("cleans what is saved against the experience, and will not turn into another one", async () => {
    const own = await make("the-mystery-date", (love) => {
      love.forever.v = { opening: "Hello", rogue: "x", where: "Somewhere secret", revealPlace: "1", clues: [{ text: "one", icon: "moon" }] };
      love.forever.scenario = "the-goodbye-i-could-never-write";
      love.forever.playfulNo = true;
    });
    const g = await getGiftForOwner(own.id, own.token);
    expect(g.letter?.slug).toBe("the-mystery-date");
    expect(g.love.forever.scenario).toBe("the-mystery-date");
    expect(g.love.forever.v.rogue).toBeUndefined();
    expect(g.love.forever.v.where).toBe("Somewhere secret");
    expect(g.love.forever.guards).toEqual({ where: "revealPlace" });
    expect(g.love.forever.playfulNo).toBe(true); // the mystery date is a lighthearted invitation, so the sender may switch it on
  });

  it("allows the moving No only where the experience does, and only when the sender turned it on", async () => {
    const on = await make("steal-a-little-of-your-time", (love) => { love.forever.playfulNo = true; });
    expect((await getGiftForOwner(on.id, on.token)).love.forever.playfulNo).toBe(true);
    const apology = await make("i-owe-you-an-apology", (love) => { love.forever.playfulNo = true; });
    expect((await getGiftForOwner(apology.id, apology.token)).love.forever.playfulNo).toBe(false);
  });

  it("will not send an apology to us until it has its apology", async () => {
    const made = await make("i-owe-you-an-apology");
    await expect(submitGift(made.id, made.token, { name: "Arjun", phone: "+919846000000" })).rejects.toThrow(/before sending/);
    const full = await make("i-owe-you-an-apology", (love) => { love.forever.v = demoValues(letterBySlug("i-owe-you-an-apology")!); });
    await expect(submitGift(full.id, full.token, { name: "Arjun", phone: "+919846000000" })).resolves.toMatchObject({ ref: expect.any(String) });
  });

  it("keeps a private place out of the published page, publishes the experience, and stores a recipient's answer for its maker alone", async () => {
    const made = await make("the-mystery-date", (love) => {
      love.forever.v = { ...demoValues(letterBySlug("the-mystery-date")!), revealPlace: "" };
      love.forever.replies = "collect";
      love.forever.shareAnswers = false;
    });
    await submitGift(made.id, made.token, { name: "Arjun", phone: "+919846000000" });
    const g0 = await getGiftForOwner(made.id, made.token);
    const url = await adminPublishGift(admin, made.id);
    const slug = url.split("/").pop()!;
    const res = await loadPublicInvitation(slug);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.view.letter?.slug).toBe("the-mystery-date");
    expect(res.view.doc.love.forever.v.where).toBeUndefined(); // never reaches their phone
    expect(res.view.doc.love.forever.v.themeReveal).toBeTruthy();
    expect(JSON.stringify(res.view)).not.toContain("Harbour View");

    // an answer the letter did not offer is refused; an offered one is kept, with its answers dropped (the sender did not ask for them)
    const [w] = await (await getDb()).select().from(schema.weddings).where(eq(schema.weddings.id, g0.weddingId));
    const love = res.view.doc.love;
    await expect(submitLetterReply(w.id, ip(), love, { choice: "maybe-tuesday", label: "x" })).rejects.toThrow();
    await submitLetterReply(w.id, ip(), love, { choice: "yes", label: "Yes — surprise me", note: "Looking forward to it", answers: [{ q: "Q", a: "A" }] });
    await submitLetterReply(w.id, ip(), love, { choice: "alt", label: "Another night?", when: "Saturday instead" });
    const after = await getGiftForOwner(made.id, made.token);
    expect(after.replies.map((r) => r.choice).sort()).toEqual(["alt", "yes"]);
    expect(after.replies.find((r) => r.choice === "yes")).toMatchObject({ note: "Looking forward to it", answers: [] });
    expect(after.replies.find((r) => r.choice === "alt")?.when).toBe("Saturday instead");
    await expect(getGiftForOwner(made.id, "wrong-secret")).rejects.toThrow();

    // switching collection off stops them, and deleting the gift deletes them
    const off = structuredClone(love); off.forever.replies = "off";
    await expect(submitLetterReply(w.id, ip(), off, { choice: "yes", label: "Yes" })).rejects.toThrow(/not collecting/);
    await adminDeleteGift(admin, made.id);
    const left = await (await getDb()).select().from(schema.giftReplies).where(eq(schema.giftReplies.weddingId, w.id));
    expect(left).toEqual([]);
  });

  it("shares a recipient's answers along the way only when the sender asked for them", async () => {
    const made = await make("one-question-one-heart", (love) => { love.forever.shareAnswers = true; });
    const g = await getGiftForOwner(made.id, made.token);
    const [w] = await (await getDb()).select().from(schema.weddings).where(eq(schema.weddings.id, g.weddingId));
    const love = (await getGiftForOwner(made.id, made.token)).love;
    await submitLetterReply(w.id, ip(), love, { choice: "yes", label: "I'd love to", answers: [{ q: "Morning or night?", a: "Night" }] });
    expect((await getGiftForOwner(made.id, made.token)).replies[0].answers).toEqual([{ q: "Morning or night?", a: "Night" }]);
  });
});
