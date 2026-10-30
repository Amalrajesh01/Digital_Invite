import { beforeAll, describe, expect, it } from "vitest";
import { bootstrap, makeWedding } from "./helpers";
import type { AdminActor } from "@/domain/auth/access";
import { createGuest, draftGuestMessages, ensureInvite, guestGreeting, importGuestsCsv, listGroups, listGuests, updateGuest } from "@/domain/guests/service";
import { composeMessage, groupNote, groupNoteKind, nudgeLine, relationKind, variantCount, type RelationKind } from "@/domain/guests/messages";
import { firstNameOf, personalize, stripSalutation } from "@/domain/guests/personalize";
import { emptyDoc } from "@/domain/doc/schema";
import { makeSection } from "@/domain/doc/sections";
import { defaultFeaturesFor } from "@/domain/packages/features";
import { resolveEntitlements } from "@/domain/packages/entitlements";
import { personalFor, visibleSections } from "@/domain/wedding/view";
import { personalPreviewTitle } from "@/domain/wedding/link-preview";
import { loadPublicInvitation } from "@/domain/wedding/public";
import { GET as ogImage } from "@/app/api/og/[slug]/[token]/route";

const KINDS: RelationKind[] = ["elder", "uncleaunt", "sibling", "cousin", "closefriend", "friend", "colleague", "neighbour", "mentor", "family", "default"];
const MALAYALAM = /[ഀ-ൿ]/;

describe("the heartfelt message bank", () => {
  it("understands how a couple describes a guest", () => {
    expect(relationKind("Grandmother")).toBe("elder");
    expect(relationKind("Aunt")).toBe("uncleaunt");
    expect(relationKind("Ammavan")).toBe("uncleaunt");
    expect(relationKind("Brother")).toBe("sibling");
    expect(relationKind("Cousin")).toBe("cousin");
    expect(relationKind("College friend")).toBe("closefriend");
    expect(relationKind("Friend")).toBe("friend");
    expect(relationKind("Colleague")).toBe("colleague");
    expect(relationKind("Neighbour")).toBe("neighbour");
    expect(relationKind("Maths teacher")).toBe("mentor");
    expect(relationKind("Family friend")).toBe("friend");
    expect(relationKind("")).toBe("default");
    // no relationship written: the guest's group still says something
    expect(relationKind("", "bride-family")).toBe("family");
    expect(relationKind("", "friends")).toBe("friend");
    expect(relationKind("", "office")).toBe("colleague");
    expect(relationKind("", "vip")).toBe("default");
  });

  it("has three messages for every kind of guest in English and in Malayalam, with nothing left to fill in", () => {
    for (const kind of KINDS) {
      for (const locale of ["en", "ml"]) {
        expect(variantCount(kind, locale)).toBe(3);
        for (let v = 0; v < 3; v++) {
          const text = composeMessage({ kind, locale, a: "Anjali", b: "Sidharth", first: "Priya", seed: "s", variant: v });
          expect(text.length).toBeGreaterThan(60);
          expect(text).not.toMatch(/[{}]/);
          if (locale === "ml") expect(text).toMatch(MALAYALAM);
          else expect(text).not.toMatch(MALAYALAM);
        }
      }
    }
  });

  it("gives the same guest the same words every time, and different neighbours different ones", () => {
    const one = (seed: string, variant = 0) => composeMessage({ kind: "friend", locale: "en", a: "A", b: "B", seed, variant });
    expect(one("guest-1")).toBe(one("guest-1"));
    expect(new Set(Array.from({ length: 30 }, (_, i) => one(`guest-${i}`))).size).toBe(3);
    expect(one("guest-1", 1)).not.toBe(one("guest-1", 0));
  });

  it("writes a nudge for the RSVP and a note for each group", () => {
    expect(nudgeLine("friend", "en", "Priya")).toContain("Priya");
    expect(nudgeLine("elder", "ml", "Priya")).toMatch(MALAYALAM);
    expect(groupNoteKind("bride-family")).toBe("family");
    expect(groupNoteKind("friends")).toBe("friends");
    expect(groupNoteKind("office")).toBe("colleagues");
    expect(groupNoteKind("vip")).toBe("default");
    expect(groupNoteKind("college-gang")).toBe("friends");
    expect(groupNoteKind(null)).toBe("default");
    for (const k of ["family", "friends", "colleagues", "default"] as const) {
      expect(groupNote(k, "en")).toHaveLength(3);
      expect(groupNote(k, "ml").every((l) => MALAYALAM.test(l))).toBe(true);
    }
  });
});

describe("name tokens in the couple's own words", () => {
  const priya = { name: "Priya Nair", first: "Priya", relationship: "College friend", seats: 3 };
  it("fills in the guest", () => {
    expect(personalize("{first}, here is our weekend", priya)).toBe("Priya, here is our weekend");
    expect(personalize("For {name} — {seats} seats, {relationship}", priya)).toBe("For Priya Nair — 3 seats, College friend");
    expect(personalize("no tokens here", priya)).toBe("no tokens here");
  });
  it("reads well for a visitor without a personal link", () => {
    expect(personalize("Dear {first|friend},", null)).toBe("Dear friend,");
    expect(personalize("{first}, here is our weekend", null)).toBe("Here is our weekend");
    expect(personalize("Welcome, {first}!", null)).toBe("Welcome,!");
  });
  it("finds the first name", () => {
    expect(firstNameOf("  Priya  Nair ")).toBe("Priya");
  });
  it("drops a salutation the envelope already says, and nothing else", () => {
    expect(stripSalutation("Dear Priya Nair, you were there for the umbrella.", ["Priya Nair", "Priya"])).toBe("You were there for the umbrella.");
    expect(stripSalutation("Hi Priya! Come early.", ["Priya Nair", "Priya"])).toBe("Come early.");
    expect(stripSalutation("Dear Raj, welcome.", ["Priya"])).toBe("Dear Raj, welcome.");
    expect(stripSalutation("Priya, you were there.", ["Priya"])).toBe("Priya, you were there.");
  });
});

describe("the words in the envelope", () => {
  const guest = { id: "g1", name: "Priya Nair", customGreeting: {}, relationship: "College friend", groupKey: "friends", seats: 3 };
  const none = { default: {}, byRelationship: [] };
  const auto = { a: "Anjali", b: "Sidharth" };
  it("puts what the couple wrote first, then the relationship's greeting, then a heartfelt message", () => {
    expect(guestGreeting({ ...guest, customGreeting: { en: "Priya, you are our person." } }, none, "en", { advanced: true, fallback: "", auto })).toBe("Priya, you are our person.");
    const byRel = { default: {}, byRelationship: [{ match: "college", text: { en: "We met in the canteen, {first}." } }] };
    expect(guestGreeting(guest, byRel, "en", { advanced: true, fallback: "", auto })).toBe("We met in the canteen, Priya.");
    const written = guestGreeting(guest, none, "en", { advanced: true, fallback: "", auto });
    expect(written).toBe(composeMessage({ kind: "closefriend", locale: "en", a: "Anjali", b: "Sidharth", first: "Priya", seed: "g1" }));
  });
  it("keeps the couple's own general greeting for a guest with no relationship, and writes nothing without Luxury", () => {
    const dflt = { default: { en: "We would love to see you." }, byRelationship: [] };
    expect(guestGreeting({ ...guest, relationship: "", groupKey: null }, dflt, "en", { advanced: true, fallback: "", auto })).toBe("We would love to see you.");
    expect(guestGreeting({ ...guest, relationship: "", groupKey: null }, none, "en", { advanced: true, fallback: "", auto })).toMatch(/place for you|thought of you first|stood by it/);
    expect(guestGreeting(guest, none, "en", { advanced: true, fallback: "" })).toBe("");
  });
  it("uses the name in the guest's own script in a second language", () => {
    const ml = { ...guest, nameLocal: "പ്രിയ നായർ", customGreeting: { ml: "{first}, നിങ്ങൾ ഞങ്ങളുടെ സ്വന്തം." } };
    expect(guestGreeting(ml, none, "ml", { advanced: false, fallback: "" })).toBe("പ്രിയ, നിങ്ങൾ ഞങ്ങളുടെ സ്വന്തം.");
  });
});

describe("what only the right guest receives", () => {
  const doc = emptyDoc();
  doc.personal.groups = [
    { id: "a", groupKey: "friends", title: { en: "For friends" }, text: { en: "friends-only words" }, clip: "11111111-1111-4111-8111-111111111111", photos: [] },
    { id: "b", groupKey: "bride-family", title: { en: "For family" }, text: { en: "family-only words" }, clip: undefined, photos: [] },
    { id: "c", groupKey: "", title: { en: "For everyone else" }, text: { en: "everyone-else words" }, clip: undefined, photos: [] },
  ];
  doc.personal.travel = [
    { id: "t1", match: "Dubai", text: { en: "dubai tip" }, link: "" },
    { id: "t2", match: "Bengaluru", text: { en: "bengaluru tip" }, link: "" },
  ];
  it("sends a guest only their own group's message and their own city's tip", () => {
    const p = personalFor(doc.personal, { groupKey: "friends", city: "Dubai, UAE" });
    expect(p.groups.map((g) => g.id)).toEqual(["a"]);
    expect(p.travel.map((t) => t.id)).toEqual(["t1"]);
    expect(JSON.stringify(p)).not.toContain("family-only");
    expect(JSON.stringify(p)).not.toContain("everyone-else");
    expect(JSON.stringify(p)).not.toContain("bengaluru");
  });
  it("falls back to the entry for everyone else, and to no tip for an unknown city", () => {
    const p = personalFor(doc.personal, { groupKey: "office", city: "Pune" });
    expect(p.groups.map((g) => g.id)).toEqual(["c"]);
    expect(p.travel).toEqual([]);
  });
  it("sends a visitor without a personal link nothing at all", () => {
    const p = personalFor(doc.personal, null);
    expect(p.groups).toEqual([]);
    expect(p.travel).toEqual([]);
  });
});

describe("the personal sections", () => {
  const lux = resolveEntitlements("LUXURY", defaultFeaturesFor("LUXURY"));
  const sig = resolveEntitlements("SIGNATURE", defaultFeaturesFor("SIGNATURE"));
  const base = [makeSection("hero", { order: 0 }), makeSection("story", { order: 1 }), makeSection("rsvp", { order: 2 })];
  const types = (s: ReturnType<typeof visibleSections>) => s.map((x) => x.type);

  it("follow the hero for a Luxury guest with a personal link, on any design and on an older invitation", () => {
    const s = visibleSections(base, { status: "PUBLISHED", entitlements: lux, hasGuest: true, groupKey: "friends", personalEnabled: true });
    expect(types(s)).toEqual(["hero", "foryou", "groupmessage", "story", "rsvp"]);
  });
  it("are not shown to a visitor, without the package, or when the couple switched them off", () => {
    expect(types(visibleSections(base, { status: "PUBLISHED", entitlements: lux, hasGuest: false, groupKey: null, personalEnabled: true }))).toEqual(["hero", "story", "rsvp"]);
    expect(types(visibleSections(base, { status: "PUBLISHED", entitlements: sig, hasGuest: true, groupKey: null, personalEnabled: true }))).toEqual(["hero", "story", "rsvp"]);
    expect(types(visibleSections(base, { status: "PUBLISHED", entitlements: lux, hasGuest: true, groupKey: null, personalEnabled: false }))).toEqual(["hero", "story", "rsvp"]);
  });
  it("are not added twice when the design already has them, and the message stops after the wedding week", () => {
    const own = [...base, makeSection("foryou", { order: 3 })];
    expect(types(visibleSections(own, { status: "PUBLISHED", entitlements: lux, hasGuest: true, groupKey: null, personalEnabled: true })).filter((t) => t === "foryou")).toHaveLength(1);
    // after the wedding the RSVP is closed and the group message has done its job; "Just for you" stays, to say thank you
    expect(types(visibleSections(base, { status: "POST_EVENT", entitlements: lux, hasGuest: true, groupKey: null, personalEnabled: true }))).toEqual(["hero", "foryou", "story"]);
  });
});

describe("a Luxury invitation, as a guest and as a visitor", () => {
  let admin: AdminActor;
  let lux: { id: string; slug: string };
  let sig: { id: string; slug: string };
  let friendsGroupId: string;

  beforeAll(async () => {
    admin = await bootstrap();
    const patch = (d: ReturnType<typeof emptyDoc>) => {
      d.personal.groups = [
        { id: "pg1", groupKey: "friends", title: { en: "A message for our friends" }, text: { en: "friends-only words" }, clip: undefined, photos: [] },
        { id: "pg2", groupKey: "bride-family", title: {}, text: { en: "family-only words" }, clip: undefined, photos: [] },
      ];
      d.personal.travel = [{ id: "pt1", match: "Dubai", text: { en: "Fly into Kochi" }, link: "" }];
    };
    lux = await makeWedding(admin, "LUXURY", { date: "2099-06-01", patch });
    sig = await makeWedding(admin, "SIGNATURE", { date: "2099-06-01", patch });
    friendsGroupId = (await listGroups(admin, lux.id)).find((g) => g.key === "friends")!.id;
  });

  const linkFor = async (w: { id: string }, input: Parameters<typeof createGuest>[2]) => {
    const g = await createGuest(admin, w.id, input);
    return { guest: g, token: await ensureInvite(w.id, g.id) };
  };

  it("greets the guest by relationship, shows them their own group's message and tip, and nobody else's", async () => {
    const { token } = await linkFor(lux, { name: "Priya Nair", relationship: "College friend", groupId: friendsGroupId, seats: 3, city: "Dubai", tableLabel: "Table 7", roomLabel: "Room 204" });
    const r = await loadPublicInvitation(lux.slug, token);
    if (!r.ok) throw new Error(r.reason);
    const v = r.view;
    expect(v.guest?.greetings.en).toMatch(/\S{3,}/);
    expect(v.guest?.greetings.en).not.toMatch(/[{}]/);
    expect(v.guest?.city).toBe("Dubai");
    expect(v.guest?.tableLabel).toBe("Table 7");
    expect(v.guest?.roomLabel).toBe("Room 204");
    expect(v.sections.map((s) => s.type)).toEqual(expect.arrayContaining(["foryou", "groupmessage"]));
    expect(v.doc.personal.groups.map((g) => g.id)).toEqual(["pg1"]);
    expect(v.doc.personal.travel.map((t) => t.id)).toEqual(["pt1"]);
    expect(JSON.stringify(v.doc.personal)).not.toContain("family-only");
  });

  it("sends a visitor without a personal link none of it", async () => {
    const r = await loadPublicInvitation(lux.slug, null);
    if (!r.ok) throw new Error(r.reason);
    expect(r.view.guest).toBeNull();
    expect(r.view.sections.map((s) => s.type)).not.toContain("foryou");
    expect(r.view.sections.map((s) => s.type)).not.toContain("groupmessage");
    expect(r.view.doc.personal.groups).toEqual([]);
    expect(r.view.doc.personal.travel).toEqual([]);
    expect(JSON.stringify(r.view)).not.toContain("friends-only");
  });

  it("keeps a Signature invitation as it was: the guest's name and their own words, no personal sections, no extra details", async () => {
    const { token } = await linkFor(sig, { name: "Priya Nair", relationship: "College friend", seats: 2, city: "Dubai", tableLabel: "Table 7" });
    const r = await loadPublicInvitation(sig.slug, token);
    if (!r.ok) throw new Error(r.reason);
    expect(r.view.guest?.name).toBe("Priya Nair");
    expect(r.view.guest?.greetings.en).toBe("");
    expect(r.view.guest?.tableLabel).toBe("");
    expect(r.view.sections.map((s) => s.type)).not.toContain("foryou");
    // even if the document holds group messages and tips, a package without the feature never sends them to the browser
    expect(r.view.doc.personal.groups).toEqual([]);
    expect(r.view.doc.personal.travel).toEqual([]);
  });

  it("keeps and updates the new details of a guest, and takes them from a spreadsheet", async () => {
    const { guest } = await linkFor(lux, { name: "Latha Menon", nameLocal: "ലത മേനോൻ", city: "Thrissur" });
    await updateGuest(admin, lux.id, guest.id, { tableLabel: "Table 1 · family", roomLabel: "Room 3" });
    const row = (await listGuests(admin, lux.id)).find((g) => g.id === guest.id)!;
    expect([row.nameLocal, row.city, row.tableLabel, row.roomLabel]).toEqual(["ലത മേനോൻ", "Thrissur", "Table 1 · family", "Room 3"]);
    const r = await importGuestsCsv(admin, lux.id, "name,phone,name_local,city,table,room\nRamesh Kumar,9846000077,രമേശ് കുമാർ,Bengaluru,Table 2,Room 9\n");
    expect(r.created).toBe(1);
    const ramesh = (await listGuests(admin, lux.id)).find((g) => g.name === "Ramesh Kumar")!;
    expect([ramesh.nameLocal, ramesh.city, ramesh.tableLabel, ramesh.roomLabel]).toEqual(["രമേശ് കുമാർ", "Bengaluru", "Table 2", "Room 9"]);
  });

  it("writes a message for every guest who has none, never over one they wrote, and only for Luxury", async () => {
    const { guest: own } = await linkFor(lux, { name: "Own Words", relationship: "Aunt", customGreeting: { en: "Aunty, you taught me to cook." } });
    const { guest: blank } = await linkFor(lux, { name: "Blank Slate", relationship: "Colleague" });
    const first = await draftGuestMessages(admin, lux.id);
    expect(first.written).toBeGreaterThan(0);
    const rows = await listGuests(admin, lux.id);
    expect(rows.find((g) => g.id === own.id)!.customGreeting.en).toBe("Aunty, you taught me to cook.");
    const written = rows.find((g) => g.id === blank.id)!.customGreeting.en;
    expect(written).toBe(composeMessage({ kind: "colleague", locale: "en", a: "Anjali", b: "Sidharth", first: "Blank", seed: blank.id }));
    const again = await draftGuestMessages(admin, lux.id);
    expect(again.written).toBe(0);
    const all = await draftGuestMessages(admin, lux.id, { overwrite: true });
    expect(all.written).toBe(rows.length);
    await expect(draftGuestMessages(admin, sig.id)).rejects.toThrow();
  });

  it("makes a link preview card only for the guest whose link it is", async () => {
    const { token } = await linkFor(lux, { name: "Preview Person" });
    const wrong = await ogImage(new Request("http://x"), { params: Promise.resolve({ slug: lux.slug, token: "x".repeat(24) }) });
    expect(wrong.status).toBe(404);
    const { token: sigToken } = await linkFor(sig, { name: "Preview Person" });
    const notLuxury = await ogImage(new Request("http://x"), { params: Promise.resolve({ slug: sig.slug, token: sigToken }) });
    expect(notLuxury.status).toBe(404);
    const other = await ogImage(new Request("http://x"), { params: Promise.resolve({ slug: sig.slug, token }) });
    expect(other.status).toBe(404);
  });

  it("greets the guest by name in the pasted link's heading", () => {
    expect(personalPreviewTitle("Priya", "Anjali & Sidharth")).toBe("Priya, you are invited to Anjali & Sidharth");
    expect(personalPreviewTitle("പ്രിയ", "Anjali & Sidharth", "ml")).toMatch(MALAYALAM);
  });
});
