import { brand } from "@/lib/brand";
import { env } from "@/lib/env";

/** The public product site: where it lives, what it is called, how to link to it and to its parent company. */
export const SITE = {
  get url() {
    return env.appUrl;
  },
  name: brand.name,
  short: "Invites",
  company: brand.company,
  companyUrl: brand.companyUrl,
  description: "Beautiful digital invitations, crafted for moments that matter — weddings, birthdays, milestones, corporate events and remembrance. By Stack Bridge Labs.",
  locale: "en_IN",
} as const;

/** Absolute URL of a path on this site (canonical links, sitemap, Open Graph). */
export function absoluteUrl(path = "/"): string {
  return `${env.appUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Absolute URL of a bundled photograph sized for social previews. */
export function ogImage(stockId: string): string {
  return absoluteUrl(`/stock/${stockId}?og=1`);
}

/** The company site, with a path. */
export function companyLink(path = ""): string {
  return `${brand.companyUrl}${path}`;
}
