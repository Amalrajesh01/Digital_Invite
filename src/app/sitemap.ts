import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { CATEGORIES } from "@/domain/catalogue/categories";
import { DEMOS, demosIn } from "@/domain/catalogue/demos";
import { templatePath } from "@/components/site/blocks";

/** Every public page worth finding: the site’s own pages, each occasion that has a sample, and each sample. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/templates"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/categories"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/how-it-works"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
  // an occasion with no sample yet is kept out of search results, so it is kept out of the sitemap too
  for (const c of CATEGORIES) if (demosIn(c.slug).length) pages.push({ url: absoluteUrl(`/templates/${c.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  for (const d of DEMOS) pages.push({ url: absoluteUrl(templatePath(d)), lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  return pages;
}
