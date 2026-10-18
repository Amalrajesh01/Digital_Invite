import { NextResponse, type NextRequest } from "next/server";
import { guardPreview } from "@/lib/guard";
import { SLUG, SLUG_HEADER, classifyHost, weddingPathPolicy } from "@/lib/hosts";

/**
 * Wedding addresses. A request whose Host is a wedding's address shows that wedding's invitation and nothing else:
 *   https://surej-akshaya.invites.example.com/           → /invite/surej-akshaya
 *   https://surej-akshaya.invites.example.com/{token}    → /invite/surej-akshaya/{token}   (personal guest link)
 *   https://meenakshiandaravind.com/                     → the same, for a verified custom domain
 * The rules live in src/lib/hosts.ts (pure, tested). Our own address (APP_URL, localhost, IPs) is untouched and returns at once.
 *
 * How the rewrite is done, and why: this proxy only decides and marks. It sets the request header SLUG_HEADER, and next.config.ts
 * rewrites `/` and `/:token` on that header. Returning NextResponse.rewrite() from here does not work behind a TLS-terminating proxy:
 * Next builds this request's URL from X-Forwarded-Proto and the bind address, compares it to its own, finds a different origin, and
 * turns the rewrite into a loopback call to `https://localhost:PORT`, which fails (HTTP 500). A config rewrite is always internal.
 * SLUG_HEADER is stripped from every inbound request here first, so a client can never choose which wedding it gets.
 */
const html = (status: number, text: string) =>
  new NextResponse(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text}</title><body style="font:16px system-ui,sans-serif;max-width:32rem;margin:20vh auto;padding:0 1.5rem;color:#222"><h1 style="font-size:1.25rem">${text}</h1>`, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });

function forward(req: NextRequest, slug?: string) {
  if (!slug && !req.headers.has(SLUG_HEADER)) return NextResponse.next(); // the normal case costs nothing
  const headers = new Headers(req.headers);
  headers.delete(SLUG_HEADER);
  if (slug) headers.set(SLUG_HEADER, slug);
  return NextResponse.next({ request: { headers } });
}

// Custom domains are looked up through the app's own /api/host (one database owner, also while developing on the embedded database).
const known = new Map<string, { slug: string | null; until: number }>();

async function customDomainSlug(req: NextRequest, host: string): Promise<string | null> {
  const hit = known.get(host);
  if (hit && hit.until > Date.now()) return hit.slug;
  // Always plain HTTP to this same process: the port is the server's own, never taken from a request header, and the protocol is
  // never taken from X-Forwarded-Proto (which says how the visitor reached nginx, not how nginx reached us).
  const origin = `http://localhost:${req.nextUrl.port || process.env.PORT || "3000"}`;
  try {
    const res = await fetch(`${origin}/api/host?h=${encodeURIComponent(host)}`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const s = ((await res.json()) as { slug?: unknown }).slug;
    const slug = typeof s === "string" && SLUG.test(s) ? s : null;
    if (known.size > 500) known.clear();
    known.set(host, { slug, until: Date.now() + 60_000 }); // only a real answer is remembered; a failed lookup is retried next time
    return slug;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const cls = classifyHost(req.headers.get("host"), process.env.APP_URL || "http://localhost:3000");
  if (cls.kind === "malformed") return html(400, "Bad request");
  if (cls.kind === "unassigned") return html(404, "We couldn’t find that invitation");

  const slug = cls.kind === "wedding" ? cls.slug : cls.kind === "other" ? await customDomainSlug(req, cls.host) : null;
  const path = req.nextUrl.pathname;

  if (!slug) {
    // our own address, or a host that is not a wedding's: the normal application
    if (path.startsWith("/preview/")) {
      const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
      const g = guardPreview(req.headers, ip);
      if (!g.ok) return new NextResponse("Automated access to these previews is not permitted.", { status: g.status, headers: { "Retry-After": String(g.retry ?? 3600), "Cache-Control": "no-store" } });
    }
    return forward(req);
  }

  // a wedding's address: its invitation, its assets and its own public API; everything else is not there
  const verdict = weddingPathPolicy(path, slug);
  if (verdict.action === "block") return html(404, "We couldn’t find that invitation");
  return forward(req, verdict.action === "pass" ? undefined : slug);
}

// Every request except the build's static files: a wedding's address has to be able to refuse /admin, /login, /api/export… too.
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
