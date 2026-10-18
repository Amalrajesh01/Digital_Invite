import { beforeAll, describe, expect, it } from "vitest";
import { GET as hostLookup } from "@/app/api/host/route";
import { addDomain, domainForHost, setDomainVerified } from "@/domain/platform/admin";
import { archiveWedding, createWedding, updateWeddingSettings } from "@/domain/wedding/service";
import { getWeddingBySlug, loadPublishedSnapshot } from "@/domain/wedding/snapshot";
import { RESERVED_LABELS, classifyHost, weddingPathPolicy } from "@/lib/hosts";
import type { AdminActor } from "@/domain/auth/access";
import { bootstrap, firstTemplateAndTheme, makeWedding, uniq } from "./helpers";

const APP = "https://invites.example.com";
let admin: AdminActor;
beforeAll(async () => { admin = await bootstrap(); });

/** What a request for {slug}.<our address> reaches: the wedding the label names (the same one /invite/{slug} reaches). */
const reached = async (host: string) => { const c = classifyHost(host, APP); return c.kind === "wedding" ? (await getWeddingBySlug(c.slug)) : null; };

describe("a slug is the wedding's address", () => {
  it("cannot be a reserved name, when a wedding is made and when its link is changed", async () => {
    const { templateId, themeId } = await firstTemplateAndTheme();
    for (const slug of ["www", "mail", "admin", "app", "login", "client", "editor", "api", "autodiscover", "stackbridge", "start"]) {
      await expect(createWedding(admin, { title: "T", slug, packageKey: "ESSENTIAL", templateId, themeId }), slug).rejects.toMatchObject({ code: "VALIDATION" });
    }
    const w = await makeWedding(admin, "ESSENTIAL");
    for (const slug of ["www", "mail", "dashboard", "ab", "WWW", "  Admin  "]) {
      await expect(updateWeddingSettings(admin, w.id, { slug }), slug).rejects.toMatchObject({ code: "VALIDATION" });
    }
    expect((await updateWeddingSettings(admin, w.id, { slug: `${uniq("Has Space")} X` })).slug).toMatch(/^has-space-[a-z0-9-]+-x$/); // typed text is made into a valid slug, as before
    const changed = await updateWeddingSettings(admin, w.id, { slug: uniq("nice-name") });
    expect(classifyHost(`${changed.slug}.invites.example.com`, APP)).toEqual({ kind: "wedding", slug: changed.slug });
  });

  it("is a label that every reserved word fails and every generated slug passes", async () => {
    const w = await makeWedding(admin, "ESSENTIAL");
    expect(classifyHost(`${w.slug}.invites.example.com`, APP)).toEqual({ kind: "wedding", slug: w.slug });
    const draft = await createWedding(admin, { title: "Draft", packageKey: "ESSENTIAL", ...(await firstTemplateAndTheme()) }); // no slug given: one is made up
    expect(classifyHost(`${draft.slug}.invites.example.com`, APP)).toEqual({ kind: "wedding", slug: draft.slug });
    expect(RESERVED_LABELS.has(draft.slug)).toBe(false);
  });
});

describe("tenant isolation", () => {
  it("each address reaches its own wedding and no other", async () => {
    const a = await makeWedding(admin, "ESSENTIAL", { publish: true });
    const b = await makeWedding(admin, "ESSENTIAL", { publish: true });
    expect((await reached(`${a.slug}.invites.example.com`))?.id).toBe(a.id);
    expect((await reached(`${b.slug}.invites.example.com`))?.id).toBe(b.id);
    // and the paths a wedding's address may use name only that wedding
    expect(weddingPathPolicy(`/invite/${b.slug}`, a.slug).action).toBe("block");
    expect(weddingPathPolicy(`/invite/${a.slug}`, a.slug).action).toBe("pass");
    expect(weddingPathPolicy(`/api/public/${b.slug}/rsvp`, a.slug).action).toBe("block");
  });

  it("an address nobody holds reaches nothing", async () => {
    expect(await reached(`${uniq("nobody")}.invites.example.com`)).toBeNull();
    expect(await reached("www.invites.example.com")).toBeNull();
    expect(await reached("a.b.invites.example.com")).toBeNull();
  });

  it("an archived or unpublished wedding shows no invitation on its address, same as on its /invite link", async () => {
    const live = await makeWedding(admin, "ESSENTIAL", { publish: true });
    const row = (await reached(`${live.slug}.invites.example.com`))!;
    expect(await loadPublishedSnapshot(row)).not.toBeNull();
    const draft = await makeWedding(admin, "ESSENTIAL", { publish: false });
    expect(await loadPublishedSnapshot((await reached(`${draft.slug}.invites.example.com`))!)).toBeNull();
    await archiveWedding(admin, live.id);
    expect(await loadPublishedSnapshot((await getWeddingBySlug(live.slug))!)).toBeNull();
  });
});

describe("custom domains keep working", () => {
  it("a verified domain still resolves to its wedding through the lookup API, and only to that one", async () => {
    const a = await makeWedding(admin, "LUXURY"), b = await makeWedding(admin, "LUXURY");
    const hostA = `${uniq("first")}.example.com`, hostB = `${uniq("second")}.example.com`;
    for (const [w, h] of [[a, hostA], [b, hostB]] as const) await setDomainVerified(admin, (await addDomain(admin, w.id, h)).id, true);
    const ask = async (h: string) => (await (await hostLookup(new Request(`http://localhost/api/host?h=${encodeURIComponent(h)}`))).json()) as { slug: string | null };
    expect(await ask(hostA)).toEqual({ slug: a.slug });
    expect(await ask(hostB.toUpperCase())).toEqual({ slug: b.slug });
    expect(await domainForHost(hostA)).toBe(a.slug);
    expect(await ask("never-added.example.com")).toEqual({ slug: null });
    for (const bad of ["", "a b.example.com", "x.example.com/evil", "%00", "a_b.example.com", "x'; drop table domains;--"]) expect(await ask(bad), JSON.stringify(bad)).toEqual({ slug: null });
  });

  it("an unverified domain, and an archived wedding's domain, resolve to nothing", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const host = `${uniq("pending")}.example.com`;
    const d = await addDomain(admin, w.id, host);
    expect(await domainForHost(host)).toBeNull();
    await setDomainVerified(admin, d.id, true);
    expect(await domainForHost(host)).toBe(w.slug);
    await archiveWedding(admin, w.id);
    expect(await domainForHost(host)).toBeNull();
  });

  it("an address under the platform's own cannot be added as a custom domain (it is already every wedding's own)", async () => {
    const w = await makeWedding(admin, "LUXURY");
    const own = new URL(process.env.APP_URL || "http://localhost:3000").hostname;
    for (const h of [`couple.${own}`, `www.${own}`, `${w.slug}.${own}`]) await expect(addDomain(admin, w.id, h), h).rejects.toMatchObject({ code: "VALIDATION", message: expect.stringContaining("belongs to this platform") });
    await expect(addDomain(admin, w.id, `${uniq("fine")}.example.org`)).resolves.toBeTruthy();
  });
});
