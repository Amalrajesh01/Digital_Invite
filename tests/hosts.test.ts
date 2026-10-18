import { describe, expect, it } from "vitest";
import { RESERVED_LABELS, SLUG, classifyHost, isUsableLabel, normalizeHost, weddingPathPolicy } from "@/lib/hosts";
import { slugProblem } from "@/domain/wedding/service";

const APP = "https://invites.example.com";
const cls = (host: string | null | undefined, app = APP) => classifyHost(host, app);

describe("reading a Host header", () => {
  it("lower-cases, drops the port and one trailing dot", () => {
    expect(normalizeHost("Surej-Akshaya.Invites.Example.COM")).toBe("surej-akshaya.invites.example.com");
    expect(normalizeHost("a.example.com:8004")).toBe("a.example.com");
    expect(normalizeHost("a.example.com.")).toBe("a.example.com");
    expect(normalizeHost("127.0.0.1:3000")).toBe("127.0.0.1");
    expect(normalizeHost("[::1]:3000")).toBe("[::1]");
    expect(normalizeHost("localhost")).toBe("localhost");
  });

  it("treats a missing header as 'none' and every malformed one as malformed", () => {
    expect(normalizeHost(null)).toBe("");
    expect(normalizeHost("")).toBe("");
    const bad = [
      "a b.example.com", "a.example.com, evil.com", "a.example.com/evil", "user@a.example.com", "a_b.example.com", "a..example.com", ".example.com",
      "-a.example.com", "a-.example.com", "a.example.com:notaport", "a.example.com:123456", "a%2eexample.com", "a.example.com\r\nX-Evil: 1", "\u0000.example.com",
      "münchen.example.com", "a.example.com:80:80", `${"x".repeat(64)}.example.com`, `${"a.".repeat(130)}com`, "*.example.com", "a.example.com?x=1", "a.example.com#frag",
    ];
    for (const h of bad) expect(normalizeHost(h), JSON.stringify(h)).toBeNull();
  });
});

describe("which kind of address a request is for", () => {
  it("our own address, localhost, IPs, the empty host and vercel previews are the platform", () => {
    for (const h of ["invites.example.com", "INVITES.example.com:443", "invites.example.com.", "localhost:3000", "127.0.0.1:8104", "65.108.245.110:8004", "[::1]:3000", "", null, "my-app-git-main.vercel.app"]) {
      expect(cls(h), String(h)).toEqual({ kind: "platform" });
    }
  });

  it("{slug}.<our address> is that wedding, however it is spelled", () => {
    expect(cls("surej-akshaya.invites.example.com")).toEqual({ kind: "wedding", slug: "surej-akshaya" });
    expect(cls("SUREJ-AKSHAYA.Invites.Example.Com:443")).toEqual({ kind: "wedding", slug: "surej-akshaya" });
    expect(cls("surej-akshaya.invites.example.com.")).toEqual({ kind: "wedding", slug: "surej-akshaya" });
    expect(cls("a1b.invites.example.com")).toEqual({ kind: "wedding", slug: "a1b" });
    expect(cls("x".repeat(60) + ".invites.example.com")).toEqual({ kind: "wedding", slug: "x".repeat(60) });
  });

  it("anything under our address that cannot be a wedding is unassigned, never the platform", () => {
    const names = [
      "www", "mail", "admin", "app", "api", "login", "client", "editor", "smtp", "ftp", "autodiscover", // reserved
      "ab", "x".repeat(61), // too short, too long for a slug
      "a.b", "deep.er.name", // two levels
      "xn--abc", "a--b", // not a slug (a double hyphen is never in a slug, so punycode names never match one)
    ];
    for (const n of names) expect(cls(`${n}.invites.example.com`), n).toEqual({ kind: "unassigned" });
  });

  it("a host that only looks like ours is not ours", () => {
    for (const h of ["evilinvites.example.com", "invites.example.com.evil.com", "surej-akshaya.invites.example.com.evil.com", "surej-akshaya-invites.example.com", "example.com"]) {
      expect(cls(h), h).toEqual({ kind: "other", host: h });
    }
  });

  it("anything else is 'other' (a possible custom domain) and malformed names are malformed", () => {
    expect(cls("meenakshiandaravind.com")).toEqual({ kind: "other", host: "meenakshiandaravind.com" });
    expect(cls("Meenakshi.COM:443")).toEqual({ kind: "other", host: "meenakshi.com" });
    expect(cls("bad_name.invites.example.com")).toEqual({ kind: "malformed" });
    expect(cls("-ab.invites.example.com")).toEqual({ kind: "malformed" }); // not a valid hostname at all, so 400 rather than 404
    expect(cls("ab-.invites.example.com")).toEqual({ kind: "malformed" });
    expect(cls("a.invites.example.com, evil.com")).toEqual({ kind: "malformed" });
  });

  it("only APP_URL decides what 'our address' is, and an IP APP_URL turns subdomains off", () => {
    expect(cls("surej-akshaya.localhost:3000", "http://localhost:3000")).toEqual({ kind: "wedding", slug: "surej-akshaya" });
    expect(cls("localhost:3000", "http://localhost:3000")).toEqual({ kind: "platform" });
    expect(cls("surej-akshaya.invites.example.com", "http://65.108.245.110:8004")).toEqual({ kind: "other", host: "surej-akshaya.invites.example.com" });
    expect(cls("surej-akshaya.invites.example.com", "not a url")).toEqual({ kind: "other", host: "surej-akshaya.invites.example.com" });
    expect(cls("surej-akshaya.invites.example.com", "https://other.example.org")).toEqual({ kind: "other", host: "surej-akshaya.invites.example.com" });
  });
});

describe("reserved names", () => {
  it("cover the administrative and infrastructure names, and every one is refused as a slug and as an address", () => {
    for (const n of ["www", "mail", "app", "admin", "login", "client", "editor", "api", "smtp", "imap", "ns1", "autodiscover", "status", "dashboard", "staging", "stackbridge", "invite", "preview", "wall"]) {
      expect(RESERVED_LABELS.has(n), n).toBe(true);
    }
    for (const n of RESERVED_LABELS) {
      if (SLUG.test(n) && n.length >= 3) {
        expect(slugProblem(n), `slug ${n}`).toMatch(/reserved/);
        expect(cls(`${n}.invites.example.com`), `host ${n}`).toEqual({ kind: "unassigned" });
      }
    }
  });

  it("a slug that is allowed is exactly a label that is routed", () => {
    for (const s of ["surej-akshaya", "anjali-and-sidharth-2027", "abc", "a-b-c", "wedding123", "9lives"]) {
      expect(slugProblem(s), s).toBeNull();
      expect(isUsableLabel(s), s).toBe(true);
      expect(cls(`${s}.invites.example.com`), s).toEqual({ kind: "wedding", slug: s });
    }
    for (const s of ["ab", "UPPER", "a_b", "a--b", "-ab", "ab-", "has space", "dot.ted"]) {
      expect(slugProblem(s), s).not.toBeNull();
      expect(isUsableLabel(s), s).toBe(false);
    }
  });
});

describe("what a wedding's own address may reach", () => {
  const slug = "surej-akshaya";
  const v = (path: string) => weddingPathPolicy(path, slug).action;

  it("serves the invitation at the root and a guest's personal link at /{token}", () => {
    expect(v("/")).toBe("root");
    expect(v("/Zk3_aBcDeFgHiJkLmNoPqRsT")).toBe("token");
    expect(v("/Zk3_aBcDeFgHiJkLmNoPqRsT/")).toBe("token");
  });

  it("lets the invitation load its own files and call its own API", () => {
    for (const p of [
      "/_next/static/chunks/app.js", "/_next/image", "/brand/mark.png", "/templates/garden-party.webp", "/stock/dYgv-1JnPTA", "/favicon.ico", "/icon.png", "/apple-icon.png", "/robots.txt",
      "/api/media/0a1b2c/large", "/api/public/surej-akshaya/rsvp", "/api/public/Surej-Akshaya/live", "/api/wall/surej-akshaya", "/wall/surej-akshaya",
      "/invite/surej-akshaya", "/invite/surej-akshaya/Zk3_aBcDeFgHiJkLmNoPqRsT", "/invite/SUREJ-AKSHAYA",
    ]) expect(v(p), p).toBe("pass");
  });

  it("refuses every administrative and client-management interface", () => {
    for (const p of [
      "/admin", "/admin/", "/admin/weddings", "/admin/weddings/123/guests", "/client", "/client/weddings/1", "/editor", "/editor/123", "/login", "/login/magic/abc", "/logout",
      "/api/export/rsvp", "/api/reports/123", "/api/cron", "/api/cron/reports", "/api/host", "/api/upload", "/api/health", "/api/site/enquiry", "/api/site/event", "/api/gift", "/api/gift/1/photo",
      "/for-my-love", "/for-my-love/make", "/pricing", "/templates", "/faq", "/start", "/how-it-works", "/categories", "/preview/royal-heritage", "/.well-known/acme-challenge/x", "/sitemap.xml",
    ]) expect(v(p), p).toBe("block");
  });

  it("never lets one wedding's address reach another wedding", () => {
    for (const p of ["/invite/other-couple", "/invite/other-couple/Zk3_aBcDeFgHiJkLmNoPqRsT", "/wall/other-couple", "/api/public/other-couple/rsvp", "/api/wall/other-couple", "/api/public", "/api/public/", "/invite", "/invite/", "/wall", "/api/wall"]) {
      expect(v(p), p).toBe("block");
    }
    expect(weddingPathPolicy("/invite/other-couple", "other-couple").action).toBe("pass"); // and the other wedding's own address does reach it
  });

  it("cannot be tricked by encoding, dots, slashes or odd characters", () => {
    for (const p of [
      "/%61dmin", "/%61dmin/weddings", "/admin%2Fweddings", "/%2e%2e/admin", "/_next/%2e%2e/admin", "/_next/../admin", "/_next/./static/../../admin", "/invite/surej-akshaya/../../admin",
      "/invite/surej-akshaya//x", "//admin", "/invite//admin", "/brand/..%2f..%2fadmin", "/brand\\..\\admin", "/stock/%00", "/a%00b", "/%zz", "/%E0%A4%A", "/Admin", "/LOGIN",
      "/has space", "/dotted.token", "/semi;colon", "/Zk3_aBcDeFgHiJkLmNoPqRsT" + "x".repeat(200),
    ]) expect(v(p), p).toBe("block");
    expect(v("admin")).toBe("block"); // not even a path
  });
});
