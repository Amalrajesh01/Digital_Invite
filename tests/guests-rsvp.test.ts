import { beforeAll, describe, expect, it } from "vitest";
import { bootstrap, makeWedding, setStatusDirect } from "./helpers";
import type { AdminActor } from "@/domain/auth/access";
import { createGuest, importGuestsCsv, listGuests, regenerateInvite, exportRsvpCsv, normalizePhone, guestGreeting, ensureInvite, updateGuest } from "@/domain/guests/service";
import { resolveGuestContext } from "@/domain/guests/context";
import { submitGuestRsvp, submitOpenRsvp, rsvpSummary, getGuestRsvp, sendRsvpReminders } from "@/domain/guests/rsvp";
import { saveDraft, getWedding } from "@/domain/wedding/service";
import { publishWedding } from "@/domain/wedding/service";

let admin: AdminActor;
let w: { id: string; slug: string };
let mealVeg: string;

beforeAll(async () => {
  admin = await bootstrap();
  w = await makeWedding(admin, "SIGNATURE", { date: "2099-06-01" });
  const doc = (await getWedding(admin, w.id)).draftDoc;
  mealVeg = doc.rsvp.mealOptions[0].id;
});

const ctxFor = async (guestId: string) => {
  const token = await ensureInvite(w.id, guestId);
  const ctx = await resolveGuestContext(w.slug, token);
  if (!ctx) throw new Error("no ctx");
  return ctx;
};

describe("phone normalisation", () => {
  it("adds +91 to Indian mobiles and strips punctuation", () => {
    expect(normalizePhone("98460 00001")).toBe("919846000001");
    expect(normalizePhone("+91-98460-00001")).toBe("919846000001");
    expect(normalizePhone("09846000001")).toBe("919846000001");
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
  });
});

describe("guest management", () => {
  it("creates guests with secure links and rejects duplicate phone numbers", async () => {
    const g = await createGuest(admin, w.id, { name: "Aunt Meera", phone: "9846000011", seats: 3, relationship: "Aunt" });
    const ctx = await ctxFor(g.id);
    expect(ctx.token.length).toBeGreaterThanOrEqual(20);
    await expect(createGuest(admin, w.id, { name: "Someone else", phone: "+91 98460 00011" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("validates input", async () => {
    await expect(createGuest(admin, w.id, { name: "  " })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createGuest(admin, w.id, { name: "X", email: "not-an-email" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createGuest(admin, w.id, { name: "X", phone: "12" })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("imports a CSV, skipping duplicates and reporting bad rows", async () => {
    const csv = ["name,phone,email,group,seats,relationship", "Ravi Kumar,9846000021,ravi@example.com,Friends,2,College friend", "Ravi Again,9846000021,,Friends,1,", ",9846000022,,Friends,1,", "Sita,9846000023,,Neighbours,4,Neighbour"].join("\n");
    const res = await importGuestsCsv(admin, w.id, csv);
    expect(res.created).toBe(2);
    expect(res.skipped).toHaveLength(1);
    expect(res.errors).toHaveLength(1);
    const guests = await listGuests(admin, w.id, { q: "Sita" });
    expect(guests[0].group?.name).toBe("Neighbours"); // custom group auto-created
  });

  it("a regenerated invite link revokes the old one", async () => {
    const g = await createGuest(admin, w.id, { name: "Uncle Raj", phone: "9846000031" });
    const oldCtx = await ctxFor(g.id);
    const fresh = await regenerateInvite(admin, w.id, g.id);
    expect(fresh).not.toBe(oldCtx.token);
    expect(await resolveGuestContext(w.slug, oldCtx.token)).toBeNull();
    expect(await resolveGuestContext(w.slug, fresh)).not.toBeNull();
  });

  it("a token only works for its own wedding slug and rejects junk", async () => {
    const other = await makeWedding(admin, "SIGNATURE");
    const g = await createGuest(admin, w.id, { name: "Token Test", phone: "9846000041" });
    const ctx = await ctxFor(g.id);
    expect(await resolveGuestContext(other.slug, ctx.token)).toBeNull();
    expect(await resolveGuestContext(w.slug, "short")).toBeNull();
    expect(await resolveGuestContext(w.slug, "../../etc/passwd-not-a-real-token-1234")).toBeNull();
    expect(await resolveGuestContext(w.slug, null)).toBeNull();
  });

  it("greetings: custom > relationship (Luxury) > default, with {name}", () => {
    const greetings = { default: { en: "Dear {name}, welcome." }, byRelationship: [{ match: "uncle", text: { en: "Dear {name}, your blessings mean the world." } }] };
    const base = { name: "Raj", customGreeting: {}, relationship: "Uncle" };
    expect(guestGreeting(base, greetings, "en", { advanced: true, fallback: "x" })).toBe("Dear Raj, your blessings mean the world.");
    expect(guestGreeting(base, greetings, "en", { advanced: false, fallback: "x" })).toBe("Dear Raj, welcome.");
    expect(guestGreeting({ ...base, customGreeting: { en: "Hi {name}!" } }, greetings, "en", { advanced: true, fallback: "x" })).toBe("Hi Raj!");
    expect(guestGreeting(base, { default: {}, byRelationship: [] }, "en", { advanced: false, fallback: "Dear {name}" })).toBe("Dear Raj");
  });
});

describe("RSVP", () => {
  it("records YES with seats, meal and companions; the guest can change their mind", async () => {
    const g = await createGuest(admin, w.id, { name: "Family Menon", phone: "9846000051", seats: 4 });
    const ctx = await ctxFor(g.id);
    const res = await submitGuestRsvp(ctx, { status: "YES", attendingCount: 3, meal: mealVeg, companions: [{ name: "Anu" }, { name: "Kiran", isChild: true }] });
    expect(res.status).toBe("YES");
    expect(res.message).toMatch(/celebrate/i);
    const stored = await getGuestRsvp(ctx);
    expect(stored?.companions).toHaveLength(2);
    await submitGuestRsvp(ctx, { status: "NO" });
    const after = await getGuestRsvp(ctx);
    expect(after?.status).toBe("NO");
    expect(after?.attendingCount).toBe(0);
    expect(after?.companions).toHaveLength(0);
  });

  it("enforces reserved seats and valid meal choices on the server", async () => {
    const g = await createGuest(admin, w.id, { name: "Two Seats", phone: "9846000052", seats: 2 });
    const ctx = await ctxFor(g.id);
    await expect(submitGuestRsvp(ctx, { status: "YES", attendingCount: 5 })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(submitGuestRsvp(ctx, { status: "YES", attendingCount: 0 })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(submitGuestRsvp(ctx, { status: "YES", attendingCount: 1, meal: "not-an-option" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(submitGuestRsvp(ctx, { status: "PERHAPS" })).rejects.toBeTruthy();
  });

  it("stores accommodation and transport needs only when asked", async () => {
    const g = await createGuest(admin, w.id, { name: "Needs Stay", phone: "9846000053", seats: 2 });
    const ctx = await ctxFor(g.id);
    await submitGuestRsvp(ctx, { status: "YES", attendingCount: 2, needsAccommodation: true, accommodation: { rooms: 1, arrival: "Dec 10" }, needsTransport: true, transport: { pickupLocation: "Kochi Airport" } });
    const list = await listGuests(admin, w.id, { q: "Needs Stay" });
    expect(list[0].accommodation).toBe("REQUESTED");
    expect(list[0].transport).toBe("REQUESTED");
    await submitGuestRsvp(ctx, { status: "YES", attendingCount: 2, needsAccommodation: false });
    const again = await listGuests(admin, w.id, { q: "Needs Stay" });
    expect(again[0].accommodation).toBeNull();
  });

  it("closes after the RSVP deadline and once the celebration has begun", async () => {
    const closed = await makeWedding(admin, "SIGNATURE", { date: "2099-06-01", patch: (d) => { d.rsvp.deadline = "2020-01-01"; } });
    const g = await createGuest(admin, closed.id, { name: "Late Guest", phone: "9846000061" });
    const token = await ensureInvite(closed.id, g.id);
    const ctx = (await resolveGuestContext(closed.slug, token))!;
    await expect(submitGuestRsvp(ctx, { status: "YES", attendingCount: 1 })).rejects.toMatchObject({ code: "LOCKED" });

    const live = await makeWedding(admin, "SIGNATURE");
    const g2 = await createGuest(admin, live.id, { name: "Day Guest", phone: "9846000062" });
    const t2 = await ensureInvite(live.id, g2.id);
    const c2 = (await resolveGuestContext(live.slug, t2))!;
    await setStatusDirect(live.id, "LIVE_EVENT");
    await expect(submitGuestRsvp(c2, { status: "YES", attendingCount: 1 })).rejects.toMatchObject({ code: "LOCKED" });
  });

  it("summarises replies for the dashboard", async () => {
    const s = await rsvpSummary(admin, w.id);
    expect(s.invited).toBeGreaterThan(3);
    expect(s.yes + s.no + s.maybe + s.pending).toBe(s.invited);
    expect(s.byGroup.length).toBeGreaterThan(0);
  });

  it("sends reminders only to guests who have not replied", async () => {
    const before = await rsvpSummary(admin, w.id);
    const r = await sendRsvpReminders(admin, w.id);
    expect(r.count).toBe(before.pending);
    expect(r.items.every((i) => i.link.includes(`/invite/${w.slug}/`))).toBe(true);
  });

  it("exports RSVP data as CSV and neutralises spreadsheet formulas", async () => {
    await createGuest(admin, w.id, { name: "=HYPERLINK(\"http://evil\")", phone: "9846000071" });
    const csv = await exportRsvpCsv(admin, w.id);
    expect(csv.split("\n")[0]).toContain("name,phone");
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).not.toMatch(/(^|,)=HYPERLINK/m);
  });
});

describe("open RSVP (Essential)", () => {
  it("lets anyone reply without an account and keeps the response as a guest record", async () => {
    const e = await makeWedding(admin, "ESSENTIAL");
    const res = await submitOpenRsvp(e.id, { name: "Neha", phone: "9846000081", status: "YES", attendingCount: 2 }, { ip: "1.2.3.4" });
    expect(res.status).toBe("YES");
    const again = await submitOpenRsvp(e.id, { name: "Neha", phone: "9846000081", status: "NO" }, { ip: "1.2.3.4" });
    expect(again.status).toBe("NO");
    await expect(submitOpenRsvp(e.id, { name: "", status: "YES" }, { ip: "1.2.3.4" })).rejects.toBeTruthy();
  });

  it("does not let visitors exceed the open seat limit", async () => {
    const e = await makeWedding(admin, "ESSENTIAL");
    await expect(submitOpenRsvp(e.id, { name: "Crowd", status: "YES", attendingCount: 30 }, { ip: "1.2.3.5" })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("guest edits", () => {
  it("updates a guest and keeps phone unique", async () => {
    const a = await createGuest(admin, w.id, { name: "Edit A", phone: "9846000091" });
    await createGuest(admin, w.id, { name: "Edit B", phone: "9846000092" });
    await expect(updateGuest(admin, w.id, a.id, { phone: "9846000092" })).rejects.toMatchObject({ code: "CONFLICT" });
    const u = await updateGuest(admin, w.id, a.id, { name: "Edit A2", seats: 5 });
    expect(u.seats).toBe(5);
  });
});

void saveDraft;
void publishWedding;
