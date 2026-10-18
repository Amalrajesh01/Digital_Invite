/**
 * Which kind of address is a request for, and what may it reach? Pure functions (no Next.js, no database) so every rule can be
 * tested directly. Used by src/proxy.ts and by slug validation, so a name that cannot be a wedding's web address cannot be a slug.
 *
 *   platform   our own address, localhost, an IP address, *.vercel.app    → the normal application, untouched
 *   wedding    {slug}.<our address>, or a verified custom domain          → that wedding's invitation and nothing else
 *   unassigned under our address but not a usable wedding name            → 404
 *   other      any other host                                             → a custom domain if the database knows it
 *   malformed  not a well-formed Host header                              → 400
 *
 * The only input that is ever believed is the `Host` header, strictly parsed. `X-Forwarded-*` headers decide nothing here.
 */

/** Set by proxy.ts (and by nothing else) on a request it has decided is for one wedding; next.config.ts rewrites on it. */
export const SLUG_HEADER = "x-sb-wedding-slug";

/** Names that can never be a wedding's address: infrastructure, mail, authentication, the studio, and our own brand. */
export const RESERVED_LABELS: ReadonlySet<string> = new Set([
  // infrastructure, mail and DNS
  "www", "www1", "www2", "web", "mail", "mail1", "mail2", "email", "smtp", "smtps", "imap", "imaps", "pop", "pop3", "mx", "mx1", "mx2", "mta", "relay",
  "ns", "ns1", "ns2", "ns3", "ns4", "dns", "ftp", "sftp", "ssh", "vpn", "webmail", "autodiscover", "autoconfig", "cpanel", "whm", "webdisk",
  "localhost", "wildcard", "root", "host", "server", "origin", "gateway", "proxy", "lb", "cdn", "edge", "static", "assets", "media", "files", "img",
  "images", "s3", "storage", "cache", "git", "ci", "jenkins", "grafana", "prometheus", "metrics", "monitor", "monitoring", "status", "uptime", "health",
  "healthz", "internal", "intranet", "private", "secret", "secure", "security",
  // the application, its studio and its sign-in
  "app", "apps", "api", "admin", "administrator", "login", "logout", "signin", "signout", "signup", "register", "auth", "oauth", "sso", "account",
  "accounts", "profile", "user", "users", "client", "clients", "customer", "customers", "editor", "studio", "dashboard", "console", "portal", "billing",
  "pay", "payment", "payments", "checkout", "order", "orders", "shop", "store", "webhook", "webhooks", "callback", "cron", "upload", "uploads", "download", "downloads",
  // routes and environments
  "wall", "invite", "invites", "invitation", "invitations", "preview", "pass", "new", "demo", "test", "tests", "testing", "dev", "development", "stage",
  "staging", "prod", "production", "beta", "alpha", "sandbox", "docs", "doc", "blog", "news", "help", "support", "contact", "about", "pricing", "terms",
  "privacy", "legal", "faq", "sitemap", "robots", "favicon", "_next", "love", "for-my-love", "gift", "gifts", "templates", "themes", "categories", "how-it-works", "start",
  // mailbox roles
  "abuse", "postmaster", "hostmaster", "webmaster", "noreply", "no-reply", "info", "sales", "team", "hello", "office", "press",
  // our own names (so nobody can pose as us)
  "stackbridge", "stackbridgelab", "stackbridgelabs", "netjet", "netjetgo",
]);

/** A wedding's slug, and so the label of its address: lowercase letters and digits, single hyphens inside, 3–60 characters. */
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MIN = 3;
export const SLUG_MAX = 60;

export const isUsableLabel = (label: string) => label.length >= SLUG_MIN && label.length <= SLUG_MAX && SLUG.test(label) && !RESERVED_LABELS.has(label);

const DNS_NAME = /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6_LITERAL = /^\[[0-9a-f:.]+\](:\d{1,5})?$/;

/**
 * The host from a Host header: lower-cased, without a port or one trailing dot.
 * "" = no Host header at all. null = not well-formed (spaces, commas, slashes, @, underscores, empty labels, over-long names…).
 */
export function normalizeHost(raw: string | null | undefined): string | null {
  if (raw == null || raw === "") return "";
  const v = raw.trim().toLowerCase();
  if (!v || v.length > 260) return null;
  if (IPV6_LITERAL.test(v)) return v.slice(0, v.indexOf("]") + 1);
  const m = /^([^:]+)(?::(\d{1,5}))?$/.exec(v);
  if (!m) return null;
  const host = m[1].endsWith(".") ? m[1].slice(0, -1) : m[1];
  return DNS_NAME.test(host) || IPV4.test(host) ? host : null;
}

export type HostClass = { kind: "platform" } | { kind: "wedding"; slug: string } | { kind: "unassigned" } | { kind: "other"; host: string } | { kind: "malformed" };

/** `appUrl` is our own configured address (APP_URL), never anything taken from the request. */
export function classifyHost(rawHost: string | null | undefined, appUrl: string): HostClass {
  const host = normalizeHost(rawHost);
  if (host === null) return { kind: "malformed" };
  if (host === "") return { kind: "platform" };
  let app = "";
  try { app = new URL(appUrl).hostname.toLowerCase(); } catch { /* an unusable APP_URL turns subdomains off */ }
  const appIsName = !!app && !IPV4.test(app) && !app.startsWith("[");
  if (host === app || host === "localhost" || host.startsWith("[") || IPV4.test(host) || host.endsWith(".vercel.app")) return { kind: "platform" };
  if (appIsName && host.endsWith(`.${app}`)) {
    const label = host.slice(0, -(app.length + 1));
    return isUsableLabel(label) ? { kind: "wedding", slug: label } : { kind: "unassigned" }; // a dot in the label means two levels (a.b.<app>): never assigned
  }
  return { kind: "other", host };
}

export type PathVerdict = { action: "root" } | { action: "token" } | { action: "pass" } | { action: "block" };

const GUEST_TOKEN = /^[A-Za-z0-9_-]{1,128}$/;
const STATIC_FILES = new Set(["favicon.ico", "icon.png", "apple-icon.png", "robots.txt"]);
const STATIC_DIRS = new Set(["_next", "brand", "templates", "stock"]);

/**
 * What a wedding's own address may reach. Default deny: the invitation, its guest links, its assets and its own public API.
 * Everything else (the studio, sign-in, client area, editor, exports, reports, cron, uploads, the marketing site…) is `block`.
 * "root" and "token" mean "this is the invitation (or a guest's personal link)": proxy.ts marks them and next.config.ts rewrites them.
 */
export function weddingPathPolicy(pathname: string, slug: string): PathVerdict {
  if (pathname === "/") return { action: "root" };
  if (!pathname.startsWith("/")) return { action: "block" };
  const parts = pathname.slice(1).replace(/\/$/, "").split("/");
  let segs: string[];
  try { segs = parts.map((p) => decodeURIComponent(p)); } catch { return { action: "block" }; }
  // no empty, dot or slash-bearing segments, so "/_next/../admin" or "/invite/x//admin" can never be read as something allowed
  if (segs.some((s) => !s || s === "." || s === ".." || /[\\/\0]/.test(s))) return { action: "block" };
  const [first, second, third] = segs;
  const own = (s: string | undefined) => s?.toLowerCase() === slug;

  if (segs.length === 1) {
    if (STATIC_FILES.has(first)) return { action: "pass" };
    if (RESERVED_LABELS.has(first.toLowerCase())) return { action: "block" };
    return GUEST_TOKEN.test(first) ? { action: "token" } : { action: "block" };
  }
  if (STATIC_DIRS.has(first)) return { action: "pass" };
  if (first === "invite" || first === "wall") return own(second) ? { action: "pass" } : { action: "block" };
  if (first === "api") {
    if (second === "media") return { action: "pass" };
    if ((second === "public" || second === "wall") && own(third)) return { action: "pass" };
  }
  return { action: "block" };
}
