import { type PackageKey, defaultFeaturesFor } from "./features";

export interface PackageDefaults {
  key: PackageKey;
  name: string;
  tagline: string;
  blurb: string;
  priceMin: number; // INR — editable from Super Admin, never hard-coded in UI
  priceMax: number;
  hasClientDashboard: boolean;
  sortOrder: number;
}

/** Seed values only. The live values are rows in `wedding_packages` and editable by Super Admin. */
export const PACKAGE_DEFAULTS: PackageDefaults[] = [
  {
    key: "ESSENTIAL",
    name: "Essential",
    tagline: "Beautiful Premium Digital Wedding Invitation",
    blurb: "A stunning invitation that opens like a keepsake: story, events, venue, gallery, music and RSVP.",
    priceMin: 1999,
    priceMax: 2499,
    hasClientDashboard: false,
    sortOrder: 0,
  },
  {
    key: "SIGNATURE",
    name: "Signature",
    tagline: "Interactive Wedding Experience",
    blurb: "Personal guest links, a guest dashboard, wishes, photo & video uploads and lifetime memories.",
    priceMin: 4999,
    priceMax: 4999,
    hasClientDashboard: true,
    sortOrder: 1,
  },
  {
    key: "LUXURY",
    name: "Luxury",
    tagline: "Complete Wedding Experience",
    blurb: "QR guest passes, live event mode, live photo wall, games, time capsule and anniversary memories.",
    priceMin: 7999,
    priceMax: 10000,
    hasClientDashboard: true,
    sortOrder: 2,
  },
];

export function defaultPackageFeatures(key: PackageKey) {
  return defaultFeaturesFor(key);
}

export const CUSTOMER_CLASSES = ["FREE_PORTFOLIO", "PAID_ESSENTIAL", "PAID_SIGNATURE", "PAID_LUXURY"] as const;
export type CustomerClass = (typeof CUSTOMER_CLASSES)[number];

export function formatPriceRange(min: number, max: number): string {
  const f = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return min === max ? f(min) : `${f(min)}–${f(max)}${max >= 10000 ? "+" : ""}`;
}
