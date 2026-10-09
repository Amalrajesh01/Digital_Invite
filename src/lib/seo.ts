import type { Metadata } from "next";
import { absoluteUrl, ogImage, SITE } from "@/lib/site";

/** The photograph used when a page has none of its own for social previews. */
export const DEFAULT_OG_STOCK = "dYgv-1JnPTA";

/**
 * Metadata for a public page: a title and description of its own, a canonical link, and Open Graph / Twitter cards that
 * use one of our own photographs. (The site name is appended by the root layout’s title template.)
 */
export function pageMetadata(o: { path: string; title: string; description: string; image?: string; absoluteTitle?: boolean; index?: boolean; type?: "website" | "article" }): Metadata {
  const image = ogImage(o.image ?? DEFAULT_OG_STOCK);
  const fullTitle = o.absoluteTitle ? o.title : `${o.title} · ${SITE.name}`;
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: { canonical: absoluteUrl(o.path) },
    robots: o.index === false ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { type: o.type ?? "website", url: absoluteUrl(o.path), title: fullTitle, description: o.description, siteName: SITE.name, locale: SITE.locale, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: fullTitle, description: o.description, images: [image] },
  };
}
