import { NextResponse, type NextRequest } from "next/server";
import { guardPreview } from "@/lib/guard";

/**
 * Custom domains. A verified domain such as meenakshiandaravind.com shows that couple's invitation:
 *   https://meenakshiandaravind.com/           → /invite/{slug}
 *   https://meenakshiandaravind.com/{token}    → /invite/{slug}/{token}   (personal guest link)
 * Requests on the platform's own host return immediately, so normal traffic pays nothing.
 */
const cache = new Map<string, { slug: string | null; until: number }>();

async function resolveSlug(origin: string, host: string): Promise<string | null> {
  const hit = cache.get(host);
  if (hit && hit.until > Date.now()) return hit.slug;
  let slug: string | null = null;
  try {
    const res = await fetch(`${origin}/api/host?h=${encodeURIComponent(host)}`, { cache: "no-store" });
    if (res.ok) slug = ((await res.json()) as { slug: string | null }).slug;
  } catch {
    /* leave slug null: the platform's own 404 is the right fallback */
  }
  if (cache.size > 500) cache.clear();
  cache.set(host, { slug, until: Date.now() + 60_000 });
  return slug;
}

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/preview/")) {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
    const g = guardPreview(req.headers, ip);
    if (!g.ok) return new NextResponse("Automated access to these previews is not permitted.", { status: g.status, headers: { "Retry-After": String(g.retry ?? 3600), "Cache-Control": "no-store" } });
    return NextResponse.next();
  }
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const appHost = new URL(process.env.APP_URL || "http://localhost:3000").hostname.toLowerCase();
  if (!host || host === appHost || host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app")) return NextResponse.next();

  const slug = await resolveSlug(req.nextUrl.origin, host);
  if (!slug) return NextResponse.next();

  const path = req.nextUrl.pathname;
  const url = req.nextUrl.clone();
  url.pathname = path === "/" ? `/invite/${slug}` : `/invite/${slug}${path}`;
  return NextResponse.rewrite(url);
}

// Only the invitation entry points: the root and a single token segment. Assets and APIs are never touched.
export const config = { matcher: ["/preview/:path*", "/", "/((?!api|_next|invite|wall|admin|client|editor|preview|login|favicon.ico|robots.txt|sitemap.xml)[^/.]+)"] };
