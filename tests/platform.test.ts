import { beforeAll, describe, expect, it } from "vitest";
import { bootstrap, makeClient, makeWedding, uniq } from "./helpers";
import type { AdminActor, ClientActor } from "@/domain/auth/access";
import { addDomain, deleteOrder, domainForHost, listDomains, listOrders, removeDomain, saveOrder, setDomainVerified } from "@/domain/platform/admin";
import { analyticsByWedding, mediaByWedding, platformViewsPerDay, searchGuestsAcrossWeddings } from "@/domain/platform/overview";
import { track } from "@/domain/analytics/service";
import { createGuest } from "@/domain/guests/service";
import { updateWeddingSettings } from "@/domain/wedding/service";
import { loadWallAccess } from "@/domain/live/wall";
import { storageLabel } from "@/lib/format-bytes";

let admin: AdminActor;
let client: ClientActor;
let luxury: { id: string; slug: string };
let essential: { id: string; slug: string };
let signature: { id: string; slug: string };

beforeAll(async () => {
  admin = await bootstrap();
  luxury = await makeWedding(admin, "LUXURY");
  essential = await makeWedding(admin, "ESSENTIAL");
  signature = await makeWedding(admin, "SIGNATURE");
  client = await makeClient(admin, luxury.id);
});

describe("orders ledger", () => {
  it("only Super Admin can read or write orders", async () => {
    await expect(listOrders(client)).rejects.toBeTruthy();
    await expect(listOrders(null)).rejects.toBeTruthy();
    await expect(saveOrder(client, { customerName: "X", packageKey: "ESSENTIAL", amountInr: 100, status: "QUOTED" })).rejects.toBeTruthy();
  });

  it("creates, marks paid, and deletes an order", async () => {
    const o = await saveOrder(admin, { customerName: "  Nisha & Rohit ", packageKey: "SIGNATURE", amountInr: 4999.4, status: "QUOTED", weddingId: luxury.id });
    expect(o.customerName).toBe("Nisha & Rohit");
    expect(o.amountInr).toBe(4999);
    expect(o.paidAt).toBeNull();
    const paid = await saveOrder(admin, { id: o.id, customerName: o.customerName, packageKey: "SIGNATURE", amountInr: 4999, status: "PAID" });
    expect(paid.paidAt).toBeInstanceOf(Date);
    await deleteOrder(admin, o.id);
    expect((await listOrders(admin)).some((r) => r.order.id === o.id)).toBe(false);
  });

  it("rejects a blank name and a negative amount", async () => {
    await expect(saveOrder(admin, { customerName: " ", packageKey: "ESSENTIAL", amountInr: 10, status: "QUOTED" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(saveOrder(admin, { customerName: "A", packageKey: "ESSENTIAL", amountInr: -1, status: "QUOTED" })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("custom domains", () => {
  it("validates hostnames and normalises URLs", async () => {
    await expect(addDomain(admin, luxury.id, "not a domain")).rejects.toMatchObject({ code: "VALIDATION" });
    const host = `${uniq("couple")}.example.com`;
    const d = await addDomain(admin, luxury.id, `https://${host.toUpperCase()}/path`);
    expect(d.hostname).toBe(host);
    await expect(addDomain(admin, essential.id, host)).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("only verified domains resolve to a wedding, case-insensitively", async () => {
    const host = `${uniq("verify")}.example.com`;
    const d = await addDomain(admin, luxury.id, host);
    expect(await domainForHost(host)).toBeNull();
    await setDomainVerified(admin, d.id, true);
    expect(await domainForHost(host.toUpperCase())).toBe(luxury.slug);
    await setDomainVerified(admin, d.id, false);
    expect(await domainForHost(host)).toBeNull();
    await removeDomain(admin, d.id);
    expect((await listDomains(admin)).some((r) => r.d.id === d.id)).toBe(false);
  });

  it("clients cannot manage domains", async () => {
    await expect(addDomain(client, luxury.id, "client-try.example.com")).rejects.toBeTruthy();
  });
});

describe("cross-wedding overviews", () => {
  it("finds guests by name or phone across weddings, and is admin-only", async () => {
    const tag = uniq("Zed").replace(/-/g, "");
    await createGuest(admin, luxury.id, { name: `${tag} Kurian`, phone: "9846011111" });
    await createGuest(admin, signature.id, { name: `${tag} Mathew` });
    const r = await searchGuestsAcrossWeddings(admin, tag);
    expect(r.rows.map((g) => g.name).sort()).toEqual([`${tag} Kurian`, `${tag} Mathew`]);
    expect(new Set(r.rows.map((g) => g.weddingId))).toEqual(new Set([luxury.id, signature.id]));
    expect((await searchGuestsAcrossWeddings(admin, "9846011111")).rows).toHaveLength(1);
    await expect(searchGuestsAcrossWeddings(client, tag)).rejects.toBeTruthy();
  });

  it("a wildcard-only search matches nobody", async () => {
    expect((await searchGuestsAcrossWeddings(admin, "%%%_")).rows).toHaveLength(0);
  });

  it("rolls up media and analytics per wedding, bucketed by Indian date", async () => {
    await track(luxury.id, null, { visitorId: uniq("visitor").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30).padEnd(8, "x"), type: "view", device: "mobile" });
    const perDay = await platformViewsPerDay(admin);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    expect(perDay.find((d) => d.day === today)?.views).toBeGreaterThanOrEqual(1);
    const rows = await analyticsByWedding(admin);
    expect(rows.find((r) => r.weddingId === luxury.id)?.views).toBeGreaterThanOrEqual(1);
    expect(rows.find((r) => r.weddingId === essential.id)?.views).toBe(0);
    expect((await mediaByWedding(admin)).some((r) => r.weddingId === luxury.id)).toBe(true);
  });
});

describe("projector wall access", () => {
  it("is available for a live Luxury wedding", async () => {
    const snap = await loadWallAccess(luxury.slug);
    expect(snap?.wedding.id).toBe(luxury.id);
  });

  it("is refused when the package lacks it, the link is unknown, or the invitation is private", async () => {
    expect(await loadWallAccess(essential.slug)).toBeNull();
    expect(await loadWallAccess("no-such-wedding")).toBeNull();
    const priv = await makeWedding(admin, "LUXURY");
    await updateWeddingSettings(admin, priv.id, { accessMode: "PERSONALIZED_ONLY" });
    expect(await loadWallAccess(priv.slug)).toBeNull();
  });
});

describe("storageLabel", () => {
  it("formats sizes for humans", () => {
    expect(storageLabel(0)).toBe("0 B");
    expect(storageLabel(1536)).toBe("1.5 KB");
    expect(storageLabel(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(storageLabel(250 * 1024 * 1024 * 1024)).toBe("250 GB");
  });
});
