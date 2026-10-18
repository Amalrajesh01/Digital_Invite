import { createPublicKey, createVerify, generateKeyPairSync } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { submitOpenRsvp } from "@/domain/guests/rsvp";
import { buildReport } from "@/domain/sheets/report";
import { spreadsheetIdFrom } from "@/domain/sheets/google";
import { getSheetStatus, saveSheetConfig, syncAllSheets, syncSheetNow, syncWeddingSheet } from "@/domain/sheets/service";
import type { AdminActor, ClientActor } from "@/domain/auth/access";
import { bootstrap, makeClient, makeWedding, uniq } from "./helpers";

const SHEET = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdefg";
const LINK = `https://docs.google.com/spreadsheets/d/${SHEET}/edit#gid=0`;
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
const saved = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

/** A pretend Google: records every call, and can be told to refuse. */
function fakeGoogle(opts: { existingTabs?: string[]; sheetStatus?: number } = {}) {
  const calls: { url: string; method: string; auth?: string; body?: unknown }[] = [];
  const f = (async (url: string, init: RequestInit = {}) => {
    const u = String(url);
    const headers = (init.headers ?? {}) as Record<string, string>;
    const body = init.body instanceof URLSearchParams ? Object.fromEntries(init.body) : init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url: u, method: init.method ?? "GET", auth: headers.Authorization, body });
    const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status });
    if (u.startsWith("https://oauth2.googleapis.com/token")) return json({ access_token: "tok-123" });
    if (opts.sheetStatus) return json({}, opts.sheetStatus);
    if (u.includes("fields=sheets.properties.title")) return json({ sheets: (opts.existingTabs ?? ["Sheet1"]).map((title) => ({ properties: { title } })) });
    return json({});
  }) as typeof fetch;
  return { f, calls };
}

/** Essential has no guest management, so guests come from open replies; a guest who has not replied is added straight to the table. */
const addGuest = async (weddingId: string, name: string) => { const db = await getDb(); await db.insert(schema.guests).values({ weddingId, name }); };

let admin: AdminActor, client: ClientActor;
beforeAll(async () => {
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "robot@proj.iam.gserviceaccount.com", private_key: privateKey });
  admin = await bootstrap();
});
afterAll(() => { if (saved === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON; else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = saved; });

describe("Google Sheet links", () => {
  it("finds the sheet's id in a link, or a bare id, and nothing in anything else", () => {
    expect(spreadsheetIdFrom(LINK)).toBe(SHEET);
    expect(spreadsheetIdFrom(SHEET)).toBe(SHEET);
    expect(spreadsheetIdFrom("https://example.com/not-a-sheet")).toBeNull();
    expect(spreadsheetIdFrom("")).toBeNull();
  });
});

describe("the daily sheet is for an invitation with no client dashboard", () => {
  it("can be set up on Essential, by the owner, with a real link", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    await saveSheetConfig(admin, w.id, { link: LINK, enabled: true });
    const st = await getSheetStatus(admin, w.id);
    expect(st).toMatchObject({ eligible: true, spreadsheetId: SHEET, enabled: true, configuredOnServer: true, serviceEmail: "robot@proj.iam.gserviceaccount.com" });
    await expect(saveSheetConfig(admin, w.id, { link: "nonsense", enabled: true })).rejects.toThrow();
  });

  it("is refused on a package that has the dashboard, and for clients", async () => {
    const sig = await makeWedding(admin, "SIGNATURE");
    expect((await getSheetStatus(admin, sig.id)).eligible).toBe(false);
    await expect(saveSheetConfig(admin, sig.id, { link: LINK, enabled: true })).rejects.toThrow();
    const ess = await makeWedding(admin, "ESSENTIAL");
    client = await makeClient(admin, ess.id);
    await expect(saveSheetConfig(client, ess.id, { link: LINK, enabled: true })).rejects.toThrow();
    await expect(saveSheetConfig(null, ess.id, { link: LINK, enabled: true })).rejects.toThrow();
  });
});

describe("what goes into the sheet", () => {
  it("has the summary, every guest with their reply, and the daily views", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    const tag = uniq("Sh").replace(/-/g, "");
    await submitOpenRsvp(w.id, { name: `${tag} Coming`, status: "YES", attendingCount: 3, companions: [{ name: "Little One", isChild: true }] }, { ip: `9.9.${Math.floor(Math.random() * 200)}.1` });
    await submitOpenRsvp(w.id, { name: `${tag} Sorry`, status: "NO" }, { ip: `9.8.${Math.floor(Math.random() * 200)}.1` });
    await addGuest(w.id, `${tag} Quiet`);
    const db = await getDb();
    await db.insert(schema.analyticsEvents).values([{ weddingId: w.id, visitorId: "a", type: "view" }, { weddingId: w.id, visitorId: "b", type: "view" }]);
    const [summary, guests, daily] = await buildReport(w.id);
    expect([summary.title, guests.title, daily.title]).toEqual(["Summary", "Guests & replies", "Daily views"]);
    const row = (label: string) => summary.rows.find((r) => r[0] === label)?.[1];
    expect(row("Guests on the list")).toBe(3);
    expect(row("Coming (Yes)")).toBe(1);
    expect(row("People coming")).toBe(3);
    expect(row("Not coming (No)")).toBe(1);
    expect(row("Not replied yet")).toBe(1);
    expect(row("Invitation views, last 30 days")).toBe(2);
    expect(guests.rows[0]).toContain("Reply");
    const coming = guests.rows.find((r) => r[0] === `${tag} Coming`)!;
    expect(coming[6]).toBe("Coming"); expect(coming[7]).toBe(3); expect(coming[9]).toBe("Little One");
    expect(guests.rows.find((r) => r[0] === `${tag} Quiet`)![6]).toBe("Not replied");
    expect(guests.rows.findIndex((r) => r[0] === `${tag} Quiet`)).toBeGreaterThan(guests.rows.findIndex((r) => r[0] === `${tag} Coming`)); // replies first
    expect(daily.rows[1]).toEqual([expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), 2, 2]);
  });
});

describe("sending it to Google", () => {
  it("signs in as the robot account, creates missing tabs, clears and writes — as plain values, never formulas", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    await addGuest(w.id, "=HYPERLINK(\"http://evil\",\"x\")");
    await saveSheetConfig(admin, w.id, { link: LINK, enabled: true });
    const g = fakeGoogle({ existingTabs: ["Summary"] });
    const r = await syncWeddingSheet(w.id, g.f);
    expect(r).toEqual({ ok: true, message: "Sheet updated." });

    const token = g.calls[0];
    expect(token.url).toContain("oauth2.googleapis.com/token");
    const [h, c, s] = (token.body as { assertion: string }).assertion.split(".");
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    const claim = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(claim).toMatchObject({ iss: "robot@proj.iam.gserviceaccount.com", scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token" });
    expect(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(createPublicKey(publicKey), Buffer.from(s, "base64url"))).toBe(true);

    const rest = g.calls.slice(1);
    expect(rest.every((x) => x.auth === "Bearer tok-123")).toBe(true);
    expect(rest.map((x) => x.url.split(SHEET)[1])).toEqual(["?fields=sheets.properties.title", ":batchUpdate", "/values:batchClear", "/values:batchUpdate"]);
    expect((rest[1].body as { requests: { addSheet: { properties: { title: string } } }[] }).requests.map((q) => q.addSheet.properties.title)).toEqual(["Guests & replies", "Daily views"]); // Summary already existed
    const write = rest[3].body as { valueInputOption: string; data: { range: string; values: unknown[][] }[] };
    expect(write.valueInputOption).toBe("RAW");
    expect(write.data.map((d) => d.range)).toEqual(["'Summary'!A1", "'Guests & replies'!A1", "'Daily views'!A1"]);
    expect(JSON.stringify(write.data[1].values)).toContain("=HYPERLINK"); // kept as text: RAW is never evaluated

    const st = await getSheetStatus(admin, w.id);
    expect(st).toMatchObject({ lastStatus: "OK", lastMessage: "Sheet updated." });
    expect(st.lastSyncAt).toBeInstanceOf(Date);
  });

  it("explains how to fix a sheet that has not been shared, and remembers the failure", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    await saveSheetConfig(admin, w.id, { link: LINK, enabled: true });
    const r = await syncSheetNow(admin, w.id, fakeGoogle({ sheetStatus: 403 }).f);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("robot@proj.iam.gserviceaccount.com");
    expect(r.message).toContain("Editor");
    expect(await getSheetStatus(admin, w.id)).toMatchObject({ lastStatus: "ERROR" });
    expect((await syncWeddingSheet(w.id, fakeGoogle({ sheetStatus: 404 }).f)).message).toContain("Check the link");
  });

  it("the 6 pm job updates every enabled sheet, skips switched-off and dashboard weddings, and one failure does not stop the rest", async () => {
    const db = await getDb();
    await db.delete(schema.weddingSheets); // a clean slate for this check
    const on1 = await makeWedding(admin, "ESSENTIAL"), on2 = await makeWedding(admin, "ESSENTIAL"), off = await makeWedding(admin, "ESSENTIAL"), dash = await makeWedding(admin, "SIGNATURE");
    for (const w of [on1, on2]) await saveSheetConfig(admin, w.id, { link: LINK, enabled: true });
    await saveSheetConfig(admin, off.id, { link: LINK, enabled: false });
    // a dashboard wedding that somehow has a row (for example it was upgraded after setup) is not written to
    await db.insert(schema.weddingSheets).values({ weddingId: dash.id, spreadsheetId: SHEET, enabled: true });
    let n = 0;
    const flaky = (async (url: string, init?: RequestInit) => {
      const ok = fakeGoogle();
      if (String(url).includes("fields=sheets") && ++n === 1) return new Response("{}", { status: 403 });
      return ok.f(url, init);
    }) as typeof fetch;
    const r = await syncAllSheets(flaky);
    expect(r).toEqual({ synced: 1, failed: 2 }); // one refused by Google, one is a dashboard wedding; the other updated
    expect((await db.select().from(schema.weddingSheets).where(eq(schema.weddingSheets.weddingId, off.id)))[0].lastSyncAt).toBeNull();
  });
});
