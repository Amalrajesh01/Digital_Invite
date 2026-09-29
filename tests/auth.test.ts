import { beforeAll, describe, expect, it } from "vitest";
import { createUser, login, getActorFromSessionToken, destroySession, requestMagicLink, consumeMagicLink, setUserDisabled, changePassword } from "@/domain/auth/service";
import { requireAdmin, type AdminActor } from "@/domain/auth/access";
import { hashPassword, verifyPassword, passwordProblem } from "@/domain/auth/password";
import { bootstrap, uniq } from "./helpers";
import { getDb, schema } from "@/db/client";

let admin: AdminActor;
beforeAll(async () => {
  admin = await bootstrap();
});

describe("passwords", () => {
  it("hashes with scrypt and verifies", async () => {
    const h = await hashPassword("Correct-horse-9");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Correct-horse-9", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
    expect(await verifyPassword("anything", null)).toBe(false);
  });
  it("enforces a minimal policy", () => {
    expect(passwordProblem("short1")).toBeTruthy();
    expect(passwordProblem("onlyletterslong")).toBeTruthy();
    expect(passwordProblem("Long-enough-1")).toBeNull();
  });
});

describe("authentication", () => {
  it("logs in with correct credentials and resolves the session to an actor", async () => {
    const email = `${uniq("u")}@example.com`;
    await createUser({ email, name: "Sam", role: "CLIENT", password: "Sup3rSecret-pass" });
    const s = await login(email.toUpperCase(), "Sup3rSecret-pass");
    const actor = await getActorFromSessionToken(s.token);
    expect(actor?.kind).toBe("client");
    await destroySession(s.token);
    expect(await getActorFromSessionToken(s.token)).toBeNull();
  });

  it("rejects wrong passwords and unknown accounts with the same message", async () => {
    const email = `${uniq("u")}@example.com`;
    await createUser({ email, name: "Sam", role: "CLIENT", password: "Sup3rSecret-pass" });
    const a = await login(email, "nope-nope-nope-1").catch((e) => e);
    const b = await login("nobody@example.com", "nope-nope-nope-1").catch((e) => e);
    expect(a.code).toBe("UNAUTHORIZED");
    expect(a.message).toBe(b.message);
  });

  it("stores only a hash of the session token", async () => {
    const email = `${uniq("u")}@example.com`;
    await createUser({ email, name: "Sam", role: "CLIENT", password: "Sup3rSecret-pass" });
    const s = await login(email, "Sup3rSecret-pass");
    const db = await getDb();
    const rows = await db.select().from(schema.sessions);
    expect(rows.some((r) => r.id === s.token)).toBe(false);
  });

  it("rate-limits repeated failed logins", async () => {
    const email = `${uniq("u")}@example.com`;
    await createUser({ email, name: "Sam", role: "CLIENT", password: "Sup3rSecret-pass" });
    let last: { code?: string } = {};
    for (let i = 0; i < 10; i++) last = await login(email, "bad-bad-bad-1").catch((e) => e);
    expect(last.code).toBe("RATE_LIMITED");
  });

  it("disabled users cannot use existing sessions", async () => {
    const email = `${uniq("u")}@example.com`;
    const u = await createUser({ email, name: "Sam", role: "CLIENT", password: "Sup3rSecret-pass" });
    const s = await login(email, "Sup3rSecret-pass");
    await setUserDisabled(admin, u.id, true);
    expect(await getActorFromSessionToken(s.token)).toBeNull();
    await expect(login(email, "Sup3rSecret-pass")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("magic links work once and only for client accounts", async () => {
    const email = `${uniq("m")}@example.com`;
    await createUser({ email, name: "Mira", role: "CLIENT" });
    const req = await requestMagicLink(email);
    expect(req).not.toBeNull();
    const s = await consumeMagicLink(req!.token);
    expect((await getActorFromSessionToken(s.token))?.kind).toBe("client");
    await expect(consumeMagicLink(req!.token)).rejects.toMatchObject({ code: "EXPIRED" });
    expect(await requestMagicLink(admin.email)).toBeNull(); // Super Admin never gets passwordless login
    expect(await requestMagicLink("ghost@example.com")).toBeNull();
  });

  it("changing the password signs out every session", async () => {
    const email = `${uniq("u")}@example.com`;
    const u = await createUser({ email, name: "Sam", role: "CLIENT", password: "Sup3rSecret-pass" });
    const s = await login(email, "Sup3rSecret-pass");
    await changePassword(u.id, "Sup3rSecret-pass", "An0ther-Secret-pass");
    expect(await getActorFromSessionToken(s.token)).toBeNull();
    await expect(login(email, "Sup3rSecret-pass")).rejects.toBeTruthy();
    await expect(login(email, "An0ther-Secret-pass")).resolves.toBeTruthy();
  });

  it("only Super Admin passes requireAdmin", async () => {
    const email = `${uniq("u")}@example.com`;
    await createUser({ email, name: "Sam", role: "CLIENT", password: "Sup3rSecret-pass" });
    const s = await login(email, "Sup3rSecret-pass");
    const client = await getActorFromSessionToken(s.token);
    expect(() => requireAdmin(client)).toThrow();
    expect(() => requireAdmin(null)).toThrow();
    expect(requireAdmin(admin).kind).toBe("admin");
  });
});
