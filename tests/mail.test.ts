import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { seal, unseal } from "@/lib/secret-box";
import { getEmailSettings, saveEmailSettings, sendTestEmail } from "@/domain/mail/settings";
import { loadSmtp, mailReady, MailError, sendMail } from "@/domain/mail/transport";
import type { AdminActor, ClientActor } from "@/domain/auth/access";
import { bootstrap, fakeTransport, makeClient, makeWedding } from "./helpers";

const GMAIL = { host: "smtp.gmail.com", port: 465, secure: true, username: "owner@gmail.com", password: "abcd efgh ijkl mnop", fromName: "Invites by Stack Bridge Labs", fromEmail: "owner@gmail.com" };
let admin: AdminActor;

beforeAll(async () => { admin = await bootstrap(); });
beforeEach(async () => { const db = await getDb(); await db.delete(schema.emailSettings); });

describe("the secret box", () => {
  it("round-trips, is different every time, and refuses anything altered", () => {
    const a = seal("app-password-123");
    expect(unseal(a)).toBe("app-password-123");
    expect(seal("app-password-123")).not.toBe(a);
    expect(a).not.toContain("app-password");
    const [v, iv, tag, body] = a.split(".");
    expect(unseal([v, iv, tag, body.slice(0, -2) + (body.endsWith("AA") ? "BB" : "AA")].join("."))).toBeNull();
    expect(unseal("garbage")).toBeNull();
    expect(unseal("")).toBeNull();
  });
});

describe("Settings → Email", () => {
  it("saves the account encrypted, strips the spaces Google puts in app passwords, and never gives the password back", async () => {
    await saveEmailSettings(admin, GMAIL);
    const db = await getDb();
    const [row] = await db.select().from(schema.emailSettings);
    expect(row.passwordEnc).not.toContain("abcd");
    expect(JSON.stringify(row)).not.toContain("abcdefghijklmnop");
    expect((await loadSmtp())?.password).toBe("abcdefghijklmnop");
    const view = await getEmailSettings(admin);
    expect(view).toMatchObject({ saved: true, host: "smtp.gmail.com", port: 465, secure: true, username: "owner@gmail.com", hasPassword: true });
    expect(JSON.stringify(view)).not.toContain("abcdefghijklmnop");
    expect(JSON.stringify(view)).not.toContain(row.passwordEnc);
    expect(await mailReady()).toBe(true);
  });

  it("keeps the saved password when the field is left empty, and replaces it when a new one is typed", async () => {
    await saveEmailSettings(admin, GMAIL);
    await saveEmailSettings(admin, { ...GMAIL, password: "", fromName: "Renamed" });
    expect(await loadSmtp()).toMatchObject({ password: "abcdefghijklmnop", fromName: "Renamed" });
    await saveEmailSettings(admin, { ...GMAIL, password: "zzzz yyyy xxxx wwww" });
    expect((await loadSmtp())?.password).toBe("zzzzyyyyxxxxwwww");
  });

  it("needs a password the first time, and checks the other fields", async () => {
    await expect(saveEmailSettings(admin, { ...GMAIL, password: "" })).rejects.toThrow(/password/i);
    await expect(saveEmailSettings(admin, { ...GMAIL, host: "https://smtp.gmail.com" })).rejects.toThrow(/server name/i);
    await expect(saveEmailSettings(admin, { ...GMAIL, host: "" })).rejects.toThrow();
    await expect(saveEmailSettings(admin, { ...GMAIL, port: 0 })).rejects.toThrow(/port/i);
    await expect(saveEmailSettings(admin, { ...GMAIL, port: 99999 })).rejects.toThrow(/port/i);
    await expect(saveEmailSettings(admin, { ...GMAIL, fromEmail: "not an email" })).rejects.toThrow(/email/i);
    expect((await getEmailSettings(admin)).saved).toBe(false);
  });

  it("is for the platform owner only", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    const client: ClientActor = await makeClient(admin, w.id);
    for (const who of [client, null]) {
      await expect(saveEmailSettings(who, GMAIL)).rejects.toThrow();
      await expect(getEmailSettings(who)).rejects.toThrow();
      await expect(sendTestEmail(who, "a@b.co")).rejects.toThrow();
    }
  });

  it("cannot read a saved password after APP_SECRET changes, and asks for it again", async () => {
    await saveEmailSettings(admin, GMAIL);
    const db = await getDb();
    await db.update(schema.emailSettings).set({ passwordEnc: seal("x").replace(/^v1\.[^.]+/, "v1.AAAAAAAAAAAAAAAA") }).where(eq(schema.emailSettings.id, "main")); // as if sealed under another key
    expect(await loadSmtp()).toBeNull();
    expect((await getEmailSettings(admin)).hasPassword).toBe(false);
    await expect(saveEmailSettings(admin, { ...GMAIL, password: "" })).rejects.toThrow(/password/i);
    await saveEmailSettings(admin, GMAIL);
    expect(await loadSmtp()).not.toBeNull();
  });
});

describe("sending", () => {
  it("sends through the saved account with the sender, recipients and attachment as given", async () => {
    await saveEmailSettings(admin, GMAIL);
    const { t, sent } = fakeTransport();
    const pdf = Buffer.from("%PDF-1.4 test");
    const r = await sendMail({ to: ["a@x.com", "b@x.com"], subject: "Hello", text: "Body", html: "<p>Body</p>", attachments: [{ filename: "r.pdf", content: pdf, contentType: "application/pdf" }] }, { transport: t });
    expect(r).toEqual({ via: "smtp" });
    expect(sent[0]).toMatchObject({ from: '"Invites by Stack Bridge Labs" <owner@gmail.com>', to: ["a@x.com", "b@x.com"], subject: "Hello", text: "Body" });
    expect(sent[0].attachments?.[0]).toMatchObject({ filename: "r.pdf", contentType: "application/pdf" });
  });

  it("does not let a sender name inject headers", async () => {
    await saveEmailSettings(admin, { ...GMAIL, fromName: 'Evil"\r\nBcc: x@y.z' });
    const { t, sent } = fakeTransport();
    await sendMail({ to: ["a@x.com"], subject: "s", text: "t" }, { transport: t });
    expect(sent[0].from).not.toMatch(/[\r\n]/);
  });

  it("says exactly what is wrong in plain words", async () => {
    await saveEmailSettings(admin, GMAIL);
    await expect(sendMail({ to: ["a@x.com"], subject: "s", text: "t" }, { transport: fakeTransport({ code: "EAUTH" }).t })).rejects.toThrow(/App password/);
    await expect(sendMail({ to: ["a@x.com"], subject: "s", text: "t" }, { transport: fakeTransport({ code: "ECONNECTION" }).t })).rejects.toThrow(/smtp\.gmail\.com:465/);
    await expect(sendMail({ to: ["a@x.com"], subject: "s", text: "t" }, { transport: fakeTransport({ code: "EENVELOPE" }).t })).rejects.toThrow(/addresses/);
    await expect(sendMail({ to: ["a@x.com"], subject: "s", text: "t" }, { transport: fakeTransport({ code: "EOTHER", message: "550 mailbox full" }).t })).rejects.toThrow(/550 mailbox full/);
  });

  it("refuses with a clear message when no account is saved", async () => {
    const saved = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    try {
      expect(await mailReady()).toBe(false);
      await expect(sendMail({ to: ["a@x.com"], subject: "s", text: "t" })).rejects.toMatchObject({ code: "NOT_CONFIGURED", message: expect.stringContaining("Settings → Email") });
      await expect(sendMail({ to: ["a@x.com"], subject: "s", text: "t" })).rejects.toBeInstanceOf(MailError);
    } finally { if (saved !== undefined) process.env.RESEND_API_KEY = saved; }
  });

  it("the test email tells you whether it worked, and remembers", async () => {
    await saveEmailSettings(admin, GMAIL);
    const good = fakeTransport();
    expect(await sendTestEmail(admin, "me@example.com", { transport: good.t })).toMatchObject({ ok: true });
    expect(good.sent[0].to).toEqual(["me@example.com"]);
    expect(await getEmailSettings(admin)).toMatchObject({ lastTestStatus: "OK" });
    const bad = await sendTestEmail(admin, "me@example.com", { transport: fakeTransport({ code: "EAUTH" }).t });
    expect(bad.ok).toBe(false);
    expect(await getEmailSettings(admin)).toMatchObject({ lastTestStatus: "ERROR", lastTestMessage: expect.stringContaining("App password") });
    await expect(sendTestEmail(admin, "not-an-address")).rejects.toThrow();
    await saveEmailSettings(admin, GMAIL); // changing the account clears the old test result
    expect((await getEmailSettings(admin)).lastTestStatus).toBeNull();
  });
});
