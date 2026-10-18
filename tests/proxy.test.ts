import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { SLUG_HEADER } from "@/lib/hosts";
import { config, proxy } from "@/proxy";
import nextConfig from "../next.config";

const savedApp = process.env.APP_URL;
beforeAll(() => { process.env.APP_URL = "https://invites.example.com"; });
afterAll(() => { if (savedApp === undefined) delete process.env.APP_URL; else process.env.APP_URL = savedApp; });
afterEach(() => vi.unstubAllGlobals());

const BROWSER = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36", "accept-language": "en-IN" };
/** A request as the app sees it behind nginx: its own loopback address in the URL, the visitor's host in the Host header. */
const req = (host: string, path = "/", headers: Record<string, string> = {}) => new NextRequest(`http://localhost:8104${path}`, { headers: { host, "x-forwarded-proto": "https", ...headers } });
const go = (host: string, path = "/", headers: Record<string, string> = {}) => proxy(req(host, path, headers));

const next = (r: Response) => r.headers.get("x-middleware-next") === "1";
/** The wedding the proxy marked the request for, as the next stage (config rewrites) will see it. */
const marked = (r: Response) => r.headers.get(`x-middleware-request-${SLUG_HEADER}`);
/** Header names the proxy is passing on; the marker is absent from this list when it has been stripped. */
const passedOn = (r: Response) => (r.headers.get("x-middleware-override-headers") ?? "").split(",").filter(Boolean);
const WEDDING = "surej-akshaya.invites.example.com";

describe("our own address is untouched", () => {
  it("passes every page of the platform through unchanged, the studio and sign-in included", async () => {
    for (const path of ["/", "/pricing", "/login", "/login/magic/abc", "/admin", "/admin/weddings/1/guests", "/client", "/editor/1", "/api/export/rsvp", "/api/reports/1", "/api/health", "/api/host?h=x", "/invite/surej-akshaya", "/invite/surej-akshaya/Zk3_aBcDeFgHiJkLmNoPqRsT", "/wall/surej-akshaya", "/stock/abc"]) {
      for (const host of ["invites.example.com", "INVITES.example.com:443", "localhost:8104", "127.0.0.1:8104", "65.108.245.110:8004", "app-git-main.vercel.app"]) {
        const r = await go(host, path);
        expect(next(r), `${host}${path}`).toBe(true);
        expect(r.status, `${host}${path}`).toBe(200);
        expect(marked(r), `${host}${path}`).toBeNull();
      }
    }
  });

  it("a forged marker header on our own address is removed, so nobody chooses their own wedding", async () => {
    for (const path of ["/", "/login", "/Zk3_aBcDeFgHiJkLmNoPqRsT"]) {
      const r = await go("invites.example.com", path, { [SLUG_HEADER]: "other-couple" });
      expect(next(r)).toBe(true);
      expect(marked(r), path).toBeNull();
      expect(passedOn(r), path).not.toContain(SLUG_HEADER);
    }
  });

  it("keeps the template-preview guard on the platform and shuts previews off on a wedding's address", async () => {
    expect((await go("invites.example.com", "/preview/t/royal", {})).status).toBe(403); // no browser headers
    expect(next(await go("invites.example.com", "/preview/t/royal", BROWSER))).toBe(true);
    expect((await go(WEDDING, "/preview/t/royal", BROWSER)).status).toBe(404);
  });
});

describe("a wedding's address", () => {
  it("marks the invitation and a guest's personal link for the wedding named by the host", async () => {
    for (const path of ["/", "/Zk3_aBcDeFgHiJkLmNoPqRsT"]) {
      const r = await go(WEDDING, path);
      expect(next(r), path).toBe(true);
      expect(marked(r), path).toBe("surej-akshaya");
    }
    expect(marked(await go("SUREJ-AKSHAYA.Invites.Example.com.:443", "/"))).toBe("surej-akshaya");
  });

  it("lets its own files and API through without marking them", async () => {
    for (const path of ["/_next/static/chunks/a.js", "/brand/mark.png", "/stock/abc", "/api/media/1/large", "/api/public/surej-akshaya/rsvp", "/invite/surej-akshaya", "/invite/surej-akshaya/Zk3_aBcDeFgHiJkLmNoPqRsT", "/favicon.ico"]) {
      const r = await go(WEDDING, path);
      expect(next(r), path).toBe(true);
      expect(marked(r), path).toBeNull();
    }
  });

  it("answers 404 for the studio, sign-in, client area, editor, exports, reports, cron, uploads and the marketing site", async () => {
    for (const path of ["/admin", "/admin/weddings", "/login", "/login/magic/x", "/client", "/editor/1", "/api/export/rsvp", "/api/reports/1", "/api/cron", "/api/cron/reports", "/api/upload", "/api/host?h=x", "/api/health", "/pricing", "/for-my-love", "/templates"]) {
      const r = await go(WEDDING, path);
      expect(r.status, path).toBe(404);
      expect(next(r), path).toBe(false);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(r.headers.get("x-robots-tag")).toBe("noindex");
    }
  });

  it("never serves another wedding, whatever the path", async () => {
    for (const path of ["/invite/other-couple", "/invite/other-couple/Zk3_aBcDeFgHiJkLmNoPqRsT", "/api/public/other-couple/rsvp", "/wall/other-couple", "/api/wall/other-couple"]) {
      expect((await go(WEDDING, path)).status, path).toBe(404);
    }
  });

  it("decides from the Host header alone: a forged marker, or forwarded-host headers, change nothing", async () => {
    expect(marked(await go(WEDDING, "/", { [SLUG_HEADER]: "other-couple" }))).toBe("surej-akshaya");
    const asPlatform = await go("invites.example.com", "/", { "x-forwarded-host": WEDDING, forwarded: `host=${WEDDING}`, "x-original-host": WEDDING });
    expect(marked(asPlatform)).toBeNull();
    expect((await go(WEDDING, "/admin", { "x-forwarded-host": "invites.example.com", forwarded: "host=invites.example.com" })).status).toBe(404);
    expect(marked(await go(WEDDING, "/", { "x-forwarded-host": "other-couple.invites.example.com" }))).toBe("surej-akshaya");
  });
});

describe("addresses that are not wedding addresses", () => {
  it("answers 404 for a name under our address that cannot be a wedding", async () => {
    for (const host of ["www.invites.example.com", "admin.invites.example.com", "mail.invites.example.com", "ab.invites.example.com", "a.b.invites.example.com", "xn--abc.invites.example.com"]) {
      for (const path of ["/", "/login", "/anything"]) expect((await go(host, path)).status, `${host}${path}`).toBe(404);
    }
  });

  it("answers 400 for a malformed Host header and never reaches the application", async () => {
    for (const host of ["bad_name.invites.example.com", "a.invites.example.com, evil.com", "a b.invites.example.com", "a..invites.example.com", "-a.invites.example.com", "a.invites.example.com/x", "user@a.invites.example.com"]) {
      const r = await go(host, "/");
      expect(r.status, host).toBe(400);
      expect(next(r), host).toBe(false);
    }
  });

  it("treats a request with no Host header as ours", async () => {
    const r = await proxy(new NextRequest("http://localhost:8104/"));
    expect(next(r)).toBe(true);
    expect(marked(r)).toBeNull();
  });
});

describe("custom domains", () => {
  const stubHost = (answer: () => Promise<Response>) => { const f = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => answer()); vi.stubGlobal("fetch", f); return f; };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  it("looks the host up on this server over plain HTTP, whatever the visitor's headers say, and marks the wedding it names", async () => {
    const f = stubHost(async () => json({ slug: "surej-akshaya" }));
    const r = await go("meenakshi-and-aravind.com", "/", { "x-forwarded-proto": "https", "x-forwarded-host": "evil.example.net", forwarded: "host=evil.example.net;proto=https", origin: "https://evil.example.net" });
    expect(marked(r)).toBe("surej-akshaya");
    expect(f).toHaveBeenCalledTimes(1);
    const url = new URL(String(f.mock.calls[0][0]));
    expect(url.origin).toBe("http://localhost:8104");
    expect(url.pathname).toBe("/api/host");
    expect(url.searchParams.get("h")).toBe("meenakshi-and-aravind.com");
  });

  it("applies the same rules as a subdomain: its own files and API only", async () => {
    stubHost(async () => json({ slug: "surej-akshaya" }));
    const host = "custom-rules.example.org";
    expect(marked(await go(host, "/Zk3_aBcDeFgHiJkLmNoPqRsT"))).toBe("surej-akshaya");
    expect(next(await go(host, "/invite/surej-akshaya"))).toBe(true);
    for (const path of ["/admin", "/login", "/api/export/rsvp", "/invite/other-couple"]) expect((await go(host, path)).status, path).toBe(404);
  });

  it("remembers an answer for a minute, so the next request does not ask again", async () => {
    const f = stubHost(async () => json({ slug: "surej-akshaya" }));
    await go("remembered.example.org", "/");
    await go("remembered.example.org", "/Zk3_aBcDeFgHiJkLmNoPqRsT");
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("an unknown or unverified host is the platform, as it always was", async () => {
    stubHost(async () => json({ slug: null }));
    const r = await go("unverified.example.org", "/login");
    expect(next(r)).toBe(true);
    expect(marked(r)).toBeNull();
    expect(r.status).toBe(200);
  });

  it("a lookup that fails or errors is never a wedding and is not remembered, so the next request asks again", async () => {
    for (const [host, fail] of [["refused.example.org", () => { throw new Error("connection refused"); }], ["broken.example.org", () => json({}, 500)]] as const) {
      let calls = 0;
      const f = stubHost(async () => { calls += 1; return calls === 1 ? fail() : json({ slug: "surej-akshaya" }); });
      const first = await go(host, "/");
      expect(next(first), host).toBe(true);
      expect(marked(first), host).toBeNull(); // the platform, not a 500 and not someone's wedding
      expect(marked(await go(host, "/")), host).toBe("surej-akshaya");
      expect(f, host).toHaveBeenCalledTimes(2);
    }
  });

  it("an answer that is not a valid slug is never a wedding", async () => {
    for (const [host, slug] of [["traversal.example.org", "../../admin"], ["number.example.org", 42], ["upper.example.org", "UPPER"], ["spaces.example.org", "a b"]] as const) {
      stubHost(async () => json({ slug }));
      const r = await go(host, "/");
      expect(next(r), host).toBe(true);
      expect(marked(r), host).toBeNull();
    }
  });

  it("does not look up our own address, an IP, or a malformed host", async () => {
    const f = stubHost(async () => json({ slug: "surej-akshaya" }));
    await go("invites.example.com", "/");
    await go("65.108.245.110:8004", "/");
    await go("bad_name.example.org", "/");
    await go("www.invites.example.com", "/");
    expect(f).not.toHaveBeenCalled();
  });
});

describe("the proxy runs for every path it has to refuse, and the config rewrites only act on its marker", () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`);

  it("is invoked for the studio, sign-in and API paths (otherwise a wedding's address could not refuse them), but not the build's static files", () => {
    for (const p of ["/", "/admin", "/admin/weddings/1", "/login", "/client", "/editor/1", "/api/export/rsvp", "/api/cron", "/invite/x", "/preview/t/x", "/brand/mark.png", "/Zk3_aBcDeFgHiJkLmNoPqRsT"]) expect(matcher.test(p), p).toBe(true);
    for (const p of ["/_next/static/chunks/a.js", "/_next/image"]) expect(matcher.test(p), p).toBe(false);
  });

  it("rewrites the root and a token only when the marker header carries a valid slug", async () => {
    const r = (await nextConfig.rewrites!()) as { beforeFiles: { source: string; has: { type: string; key: string; value: string }[]; destination: string }[]; afterFiles: unknown[]; fallback: unknown[] };
    expect(r.afterFiles).toEqual([]);
    expect(r.fallback).toEqual([]);
    expect(r.beforeFiles.map((x) => [x.source, x.destination])).toEqual([["/", "/invite/:slug"], ["/:token([A-Za-z0-9_-]+)", "/invite/:slug/:token"]]);
    for (const rule of r.beforeFiles) {
      expect(rule.has).toHaveLength(1);
      expect(rule.has[0]).toMatchObject({ type: "header", key: SLUG_HEADER });
      const value = new RegExp(`^${rule.has[0].value}$`);
      for (const ok of ["surej-akshaya", "a1b", "x".repeat(60)]) expect(value.exec(ok)?.groups?.slug, ok).toBe(ok);
      for (const bad of ["", "../admin", "a b", "UPPER", "a--b", "-a", "a/b", "a;b", "a.b"]) expect(value.test(bad), JSON.stringify(bad)).toBe(false);
    }
  });
});
