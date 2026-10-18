import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { submitOpenRsvp } from "@/domain/guests/rsvp";
import { saveEmailSettings } from "@/domain/mail/settings";
import { buildReportData, type ReportData, type ReportGuest } from "@/domain/reports/data";
import { composeReportEmail } from "@/domain/reports/email";
import { renderReportPdf } from "@/domain/reports/pdf";
import { getReportStatus, parseRecipients, previewReportPdf, saveReportConfig, sendAllReports, sendReport, sendReportNow } from "@/domain/reports/service";
import type { AdminActor, ClientActor } from "@/domain/auth/access";
import { bootstrap, fakeTransport, makeClient, makeWedding, uniq } from "./helpers";

let admin: AdminActor;
let ip = 10;
const nextIp = () => `7.7.${ip++}.1`;
const addGuest = async (weddingId: string, name: string) => { const db = await getDb(); const [g] = await db.insert(schema.guests).values({ weddingId, name }).returning(); return g; };
const pages = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type \/Page(?![s\w])/g) ?? []).length;

beforeAll(async () => {
  admin = await bootstrap();
  await saveEmailSettings(admin, { host: "smtp.gmail.com", port: 465, secure: true, username: "owner@gmail.com", password: "abcdefghijklmnop", fromName: "Invites", fromEmail: "owner@gmail.com" });
});

describe("what goes into the report", () => {
  it("counts replies, people, meals and who replied in the last 24 hours, with the guests grouped by reply", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    const tag = uniq("Rp").replace(/-/g, "");
    await submitOpenRsvp(w.id, { name: `${tag} Zed`, status: "YES", attendingCount: 3, companions: [{ name: "Little One", isChild: true }] }, { ip: nextIp() });
    await submitOpenRsvp(w.id, { name: `${tag} Amy`, status: "YES", attendingCount: 1 }, { ip: nextIp() });
    await submitOpenRsvp(w.id, { name: `${tag} Old`, status: "NO" }, { ip: nextIp() });
    await submitOpenRsvp(w.id, { name: `${tag} Maybe`, status: "MAYBE" }, { ip: nextIp() });
    await addGuest(w.id, `${tag} Quiet`);
    const db = await getDb();
    for (const n of ["Zed", "Amy"]) { const [g] = await db.select().from(schema.guests).where(eq(schema.guests.name, `${tag} ${n}`)); await db.update(schema.rsvps).set({ meal: "Veg" }).where(eq(schema.rsvps.guestId, g.id)); } // the public form only keeps a meal when the invitation asks for one
    const [old] = await db.select().from(schema.guests).where(eq(schema.guests.name, `${tag} Old`));
    await db.update(schema.rsvps).set({ respondedAt: new Date(Date.now() - 3 * 86400000) }).where(eq(schema.rsvps.guestId, old.id)); // answered three days ago

    const d = await buildReportData(w.id);
    expect(d.totals).toEqual({ guests: 5, replied: 4, yes: 2, people: 4, maybe: 1, no: 1, pending: 1 });
    expect(d.guests.map((g) => g.name)).toEqual([`${tag} Amy`, `${tag} Zed`, `${tag} Maybe`, `${tag} Old`, `${tag} Quiet`]); // coming, maybe, not coming, not replied; by name inside
    expect(d.guests.find((g) => g.name === `${tag} Zed`)).toMatchObject({ reply: "YES", people: 3, meal: "Veg", also: "Little One" });
    expect(d.guests.find((g) => g.name === `${tag} Quiet`)).toMatchObject({ reply: null, people: null });
    expect(d.recent.map((g) => g.name).sort()).toEqual([`${tag} Amy`, `${tag} Maybe`, `${tag} Zed`]); // "Old" is outside the 24 hours
    expect(d.meals).toEqual([{ meal: "Veg", count: 2 }]);
    expect(d.link).toMatch(new RegExp(`/invite/${w.slug}$`));
  });

  it("buckets views by India's day, fills quiet days with zero, and keeps the 14-day chart in order", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    const now = new Date("2026-10-18T12:30:00Z"); // 6 pm in India
    const db = await getDb();
    const ev = (iso: string, visitorId: string) => ({ weddingId: w.id, visitorId, type: "view", createdAt: new Date(iso) });
    await db.insert(schema.analyticsEvents).values([
      ev("2026-10-17T19:00:00Z", "visitor-aaaa"), // 00:30 on the 18th in India, so it belongs to the 18th
      ev("2026-10-18T05:00:00Z", "visitor-bbbb"),
      ev("2026-10-18T06:00:00Z", "visitor-bbbb"),
      ev("2026-10-15T08:00:00Z", "visitor-cccc"),
      ev("2026-09-01T08:00:00Z", "visitor-dddd"), // older than 30 days: not counted at all
    ]);
    const d = await buildReportData(w.id, now);
    expect(d.views).toHaveLength(14);
    expect(d.views[13]).toEqual({ day: "2026-10-18", views: 3 });
    expect(d.views[0].day).toBe("2026-10-05");
    expect(d.views.find((v) => v.day === "2026-10-15")?.views).toBe(1);
    expect(d.views.find((v) => v.day === "2026-10-16")?.views).toBe(0);
    expect(d.views30).toBe(4);
    expect(d.visitors30).toBe(3);
  });
});

describe("the PDF", () => {
  const guest = (name: string, reply: ReportGuest["reply"] = "YES", extra: Partial<ReportGuest> = {}): ReportGuest => ({ name, reply, people: reply === "YES" ? 2 : null, meal: "", also: "", note: "", repliedAt: null, ...extra });
  const data = (guests: ReportGuest[]): ReportData => ({
    title: "Surej & Akshaya", slug: "surej-and-akshaya", link: "https://example.com/invite/surej-and-akshaya", weddingDate: "2026-11-24", generatedAt: new Date("2026-10-18T12:30:00Z"),
    totals: { guests: guests.length, replied: guests.filter((g) => g.reply).length, yes: guests.filter((g) => g.reply === "YES").length, people: 2 * guests.filter((g) => g.reply === "YES").length, maybe: 0, no: 0, pending: guests.filter((g) => !g.reply).length },
    recent: [], meals: [], views: Array.from({ length: 14 }, (_, i) => ({ day: `2026-10-${String(5 + i).padStart(2, "0")}`, views: i })), views30: 91, visitors30: 40, guests,
  });

  it("is a real PDF, and a long guest list runs over several pages", async () => {
    const small = await renderReportPdf(data([guest("Anusha Pillai")]));
    expect(small.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pages(small)).toBe(1);
    const big = await renderReportPdf(data(Array.from({ length: 150 }, (_, i) => guest(`Guest ${i}`, i % 3 ? "YES" : null))));
    expect(pages(big)).toBeGreaterThan(3);
    expect(big.length).toBeGreaterThan(small.length);
  });

  it("copes with an empty list, Malayalam, mixed scripts, very long names and notes, and a title that is very long", async () => {
    expect(pages(await renderReportPdf(data([])))).toBe(1);
    const odd = await renderReportPdf({ ...data([
      guest("അനുഷ പിള്ള"), guest("Rajan രാജൻ Menon", "MAYBE"), guest("W".repeat(300)), guest("Note", "NO", { note: "very long note ".repeat(200), also: "A, B, C".repeat(40), meal: "Non-vegetarian, no onion or garlic" }),
      guest("₹ £ – “quotes” … ‘x’"), guest("日本語 or Ελληνικά"), // scripts without a font show as boxes but must not break the report
    ]), title: "A very long wedding title ".repeat(10) });
    expect(odd.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("who gets it", () => {
  it("reads addresses separated by commas, spaces, semicolons or new lines, lower-cases them and drops repeats", () => {
    expect(parseRecipients("A@x.com, b@y.com;  a@X.com\nc@z.in")).toEqual({ list: ["a@x.com", "b@y.com", "c@z.in"], bad: [] });
    expect(parseRecipients("ok@x.com not-an-address").bad).toEqual(["not-an-address"]);
    expect(parseRecipients("")).toEqual({ list: [], bad: [] });
  });

  it("is set up by the owner on an Essential invitation, defaulting to the wedding's contact email", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    const db = await getDb();
    await db.update(schema.weddings).set({ contactEmail: "couple@example.com" }).where(eq(schema.weddings.id, w.id));
    expect(await getReportStatus(admin, w.id)).toMatchObject({ eligible: true, mailReady: true, saved: false, enabled: true, recipients: "couple@example.com" });
    await saveReportConfig(admin, w.id, { recipients: "Owner@Example.com; mum@example.com", enabled: true });
    expect(await getReportStatus(admin, w.id)).toMatchObject({ saved: true, recipients: "owner@example.com, mum@example.com" });
  });

  it("checks the addresses", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    await expect(saveReportConfig(admin, w.id, { recipients: "", enabled: true })).rejects.toThrow(/email address/i);
    await expect(saveReportConfig(admin, w.id, { recipients: "nope", enabled: true })).rejects.toThrow(/nope/);
    await expect(saveReportConfig(admin, w.id, { recipients: "a@x.com b@x.com c@x.com d@x.com e@x.com f@x.com", enabled: true })).rejects.toThrow(/at most 5/);
  });

  it("is refused on a package that has the dashboard, and for clients and strangers", async () => {
    const sig = await makeWedding(admin, "SIGNATURE");
    expect((await getReportStatus(admin, sig.id)).eligible).toBe(false);
    await expect(saveReportConfig(admin, sig.id, { recipients: "a@x.com", enabled: true })).rejects.toThrow();
    const ess = await makeWedding(admin, "ESSENTIAL");
    const client: ClientActor = await makeClient(admin, ess.id);
    for (const who of [client, null]) {
      await expect(saveReportConfig(who, ess.id, { recipients: "a@x.com", enabled: true })).rejects.toThrow();
      await expect(getReportStatus(who, ess.id)).rejects.toThrow();
      await expect(sendReportNow(who, ess.id, { recipients: "a@x.com", enabled: true })).rejects.toThrow();
      await expect(previewReportPdf(who, ess.id)).rejects.toThrow();
    }
  });
});

describe("sending it", () => {
  it("emails the PDF and a summary to every address, and remembers it went", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    await submitOpenRsvp(w.id, { name: "<b>Bold</b> & Co", status: "YES", attendingCount: 2 }, { ip: nextIp() });
    await saveReportConfig(admin, w.id, { recipients: "owner@example.com, mum@example.com", enabled: true });
    const { t, sent } = fakeTransport();
    expect(await sendReport(w.id, { transport: t })).toEqual({ ok: true, message: "Sent to owner@example.com, mum@example.com." });
    const m = sent[0];
    expect(m.to).toEqual(["owner@example.com", "mum@example.com"]);
    expect(m.from).toContain("owner@gmail.com");
    expect(m.subject).toMatch(/^Daily RSVP report: Anjali & Sidharth \(\d+ \w+\)$/);
    expect(m.text).toContain("attached as a PDF");
    expect(m.text).toContain("<b>Bold</b> & Co: Coming (2 people)"); // plain text shows the name as typed
    expect(m.html).toContain("&lt;b&gt;Bold&lt;/b&gt; &amp; Co"); // HTML never shows a guest's text as markup
    expect(m.html).not.toContain("<b>Bold</b>");
    expect(m.attachments?.[0].filename).toMatch(new RegExp(`^invitation-report-${w.slug}-\\d{4}-\\d{2}-\\d{2}\\.pdf$`));
    expect(m.attachments?.[0].content.subarray(0, 5).toString()).toBe("%PDF-");
    expect(m.attachments?.[0].contentType).toBe("application/pdf");
    expect(await getReportStatus(admin, w.id)).toMatchObject({ lastStatus: "OK", lastMessage: "Sent to owner@example.com, mum@example.com." });
  });

  it("Send now saves what is on the form first, then sends", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    const { t, sent } = fakeTransport();
    const r = await sendReportNow(admin, w.id, { recipients: "fresh@example.com", enabled: false }, { transport: t });
    expect(r.ok).toBe(true);
    expect(sent[0].to).toEqual(["fresh@example.com"]);
    expect(await getReportStatus(admin, w.id)).toMatchObject({ saved: true, enabled: false, recipients: "fresh@example.com" });
    await expect(sendReportNow(admin, w.id, { recipients: "broken", enabled: true }, { transport: t })).rejects.toThrow(); // nothing is sent for a bad address
    expect(sent).toHaveLength(1);
  });

  it("a mail failure is reported in plain words and remembered, never thrown", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    await saveReportConfig(admin, w.id, { recipients: "owner@example.com", enabled: true });
    const r = await sendReport(w.id, { transport: fakeTransport({ code: "EAUTH" }).t });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("App password");
    expect(await getReportStatus(admin, w.id)).toMatchObject({ lastStatus: "ERROR", lastMessage: r.message });
    expect((await sendReport(randomUUID(), { transport: fakeTransport().t })).ok).toBe(false); // nothing set up
  });

  it("the composed email has a summary a phone can show, and says when nothing new came in", async () => {
    const d: ReportData = { title: "A & B", slug: "a-b", link: "https://x/invite/a-b", weddingDate: null, generatedAt: new Date("2026-10-18T12:30:00Z"), totals: { guests: 10, replied: 6, yes: 4, people: 9, maybe: 1, no: 1, pending: 4 }, recent: [], meals: [], views: [], views30: 33, visitors30: 12, guests: [] };
    const m = await composeReportEmail(d, ["o@x.com"]);
    expect(m.text).toContain("No new replies in the last 24 hours.");
    expect(m.text).toContain("4 replied yes, 9 people coming");
    expect(m.text).toContain("4 of 10 guests have not replied yet");
    expect(m.text).toContain("33 views");
    expect(m.subject).toBe("Daily RSVP report: A & B (18 Oct)");
  });

  it("the 6 pm job emails every enabled report, skips switched-off and dashboard weddings, and one failure does not stop the rest", async () => {
    const db = await getDb();
    await db.delete(schema.weddingReports); // a clean slate for this check
    const good1 = await makeWedding(admin, "ESSENTIAL"), good2 = await makeWedding(admin, "ESSENTIAL"), bad = await makeWedding(admin, "ESSENTIAL"), off = await makeWedding(admin, "ESSENTIAL"), dash = await makeWedding(admin, "SIGNATURE");
    await saveReportConfig(admin, good1.id, { recipients: "one@example.com", enabled: true });
    await saveReportConfig(admin, good2.id, { recipients: "two@example.com", enabled: true });
    await saveReportConfig(admin, bad.id, { recipients: "reject@example.com", enabled: true });
    await saveReportConfig(admin, off.id, { recipients: "off@example.com", enabled: false });
    await db.insert(schema.weddingReports).values({ weddingId: dash.id, recipients: "dash@example.com", enabled: true }); // upgraded after setup: not written to
    const sent: string[][] = [];
    const t = { sendMail: async (m: { to: string[] }) => { if (m.to.includes("reject@example.com")) throw Object.assign(new Error("no"), { code: "EENVELOPE" }); sent.push(m.to); return {}; } } as never;
    expect(await sendAllReports({ transport: t })).toEqual({ sent: 2, failed: 2 });
    expect(sent.flat().sort()).toEqual(["one@example.com", "two@example.com"]);
    expect((await db.select().from(schema.weddingReports).where(eq(schema.weddingReports.weddingId, off.id)))[0].lastSentAt).toBeNull();
    expect((await db.select().from(schema.weddingReports).where(eq(schema.weddingReports.weddingId, dash.id)))[0].lastMessage).toContain("client dashboard");
  });
});
