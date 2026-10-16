import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { CATEGORIES } from "@/domain/catalogue/categories";
import { SITE_TEMPLATES } from "@/domain/catalogue/templates";

/** Every public page worth finding: the site's own pages, each occasion, and each design. (Gifts, previews and invitations are never listed.) */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/templates"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/for-my-love"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/categories"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/how-it-works"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/for-my-love/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
  for (const c of CATEGORIES) pages.push({ url: absoluteUrl(`/templates/${c.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  for (const t of SITE_TEMPLATES) pages.push({ url: absoluteUrl(t.path), lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  return pages;
}
