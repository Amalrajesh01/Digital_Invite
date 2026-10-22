import { listPublicPortfolio } from "@/domain/portfolio/service";

/**
 * The published portfolio as JSON. The same server-side filter as the pages and the sitemap: hidden items, and items for a customer
 * who has not consented, are not in this response — there is nothing to filter out on the client. Read-only; no personal data.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listPublicPortfolio();
  return Response.json(
    { items: items.map((p) => ({ slug: p.slug, title: p.title, description: p.description, category: p.category, template: p.templateSlug, city: p.city, cover: p.cover.src, live: p.liveHref })) },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } },
  );
}
