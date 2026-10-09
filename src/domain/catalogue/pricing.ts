import { PACKAGE_DEFAULTS } from "@/domain/packages/catalog";
import { FEATURES, defaultFeaturesFor, type FeatureKey, type PackageKey } from "@/domain/packages/features";
import { listPackages } from "@/domain/packages/service";

/**
 * What the public site says a package costs and includes — always the packages as Super Admin has them (editable in the
 * studio), never a number written into a page. If the database cannot be reached the seed values are shown instead, so the
 * pricing page never breaks. A short in-memory cache keeps a busy page from asking the database on every request.
 */
export interface PublicPackage {
  key: PackageKey;
  name: string;
  tagline: string;
  blurb: string;
  priceMin: number;
  priceMax: number;
  features: FeatureKey[];
}

const TTL_MS = 60_000;
let cached: { at: number; value: PublicPackage[] } | null = null;

const fromDefaults = (): PublicPackage[] =>
  PACKAGE_DEFAULTS.map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, blurb: p.blurb, priceMin: p.priceMin, priceMax: p.priceMax, features: defaultFeaturesFor(p.key) }));

export async function loadPublicPackages(): Promise<PublicPackage[]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  let value: PublicPackage[];
  try {
    const rows = (await listPackages()).filter((p) => p.active);
    value = rows.length
      ? rows.map((p) => ({ key: p.key as PackageKey, name: p.name, tagline: p.tagline, blurb: p.blurb, priceMin: p.priceMin, priceMax: p.priceMax, features: (p.features ?? []).filter((f): f is FeatureKey => f in FEATURES) }))
      : fromDefaults();
  } catch {
    value = fromDefaults();
  }
  cached = { at: Date.now(), value };
  return value;
}

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
/** "₹1,999 – ₹2,499", or "₹4,999" when the range is one number. */
export const priceText = (min: number, max: number) => (min === max ? inr(min) : `${inr(min)} – ${inr(max)}`);
export { inr };
