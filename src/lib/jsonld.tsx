import { brand } from "@/lib/brand";
import { absoluteUrl, SITE } from "@/lib/site";

/** Structured data, rendered as JSON-LD. `<` is escaped so a string can never close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(Array.isArray(data) ? data : [data]).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: brand.company,
  url: brand.companyUrl,
  logo: absoluteUrl("/brand/mark.png"),
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: absoluteUrl("/"),
  description: SITE.description,
  publisher: { "@type": "Organization", name: brand.company, url: brand.companyUrl },
  inLanguage: "en",
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
});

export const faqLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
});

export const itemListLd = (name: string, items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: absoluteUrl(it.path) })),
});

/** The three packages as one offer range — only ever built from the live prices. */
export const pricingLd = (packages: { name: string; description: string; priceMin: number; priceMax: number }[]) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: `${SITE.name} — digital invitations`,
  provider: { "@type": "Organization", name: brand.company, url: brand.companyUrl },
  areaServed: "IN",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Invitation packages",
    itemListElement: packages.map((p) => ({
      "@type": "Offer",
      name: p.name,
      description: p.description,
      priceCurrency: "INR",
      price: p.priceMin,
      priceSpecification: { "@type": "PriceSpecification", priceCurrency: "INR", minPrice: p.priceMin, maxPrice: p.priceMax },
    })),
  },
});
