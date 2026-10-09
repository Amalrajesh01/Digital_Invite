import { loadPublicPackages } from "@/domain/catalogue/pricing";
import { brand } from "@/lib/brand";

/**
 * The current packages and prices, for the Stack Bridge Labs website, which shows a pricing preview of Invites. The
 * numbers are Super Admin’s — read from the same place as the pricing page — so the two sites can never disagree.
 * Public, read-only and carries no personal data; CORS allows only the company site.
 */
export const dynamic = "force-dynamic";

const ALLOWED = new Set([brand.companyUrl, brand.companyUrl.replace("://www.", "://"), "http://localhost:3000", "http://localhost:3100", "http://localhost:3101"]);

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return ALLOWED.has(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin", "Access-Control-Allow-Methods": "GET, OPTIONS" } : { Vary: "Origin" };
}

export async function GET(req: Request) {
  const packages = await loadPublicPackages();
  return Response.json(
    { currency: "INR", unit: "per invitation, one-time", packages: packages.map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, priceMin: p.priceMin, priceMax: p.priceMax })) },
    { headers: { ...cors(req), "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: { ...cors(req), "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" } });
}
