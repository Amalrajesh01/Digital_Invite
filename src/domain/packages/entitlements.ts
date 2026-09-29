import { FEATURE_KEYS, FEATURES, type FeatureKey, type PackageKey, isFeatureKey } from "./features";
import { AppError } from "@/lib/errors";

/**
 * A resolved, serialisable snapshot of what a wedding may use.
 * Safe to pass to client components (they only ever *read* it via `canUse`).
 * It is never a security boundary on its own — servers re-resolve entitlements for every mutation.
 */
export interface Entitlements {
  packageKey: PackageKey;
  features: FeatureKey[];
}

export interface EntitlementOverride {
  featureKey: string;
  enabled: boolean;
}

export function resolveEntitlements(
  packageKey: PackageKey,
  packageFeatures: readonly string[],
  overrides: readonly EntitlementOverride[] = [],
): Entitlements {
  const set = new Set<FeatureKey>(packageFeatures.filter(isFeatureKey));
  for (const o of overrides) {
    if (!isFeatureKey(o.featureKey)) continue;
    if (o.enabled) set.add(o.featureKey);
    else set.delete(o.featureKey);
  }
  // Keep a stable, catalogue order.
  return { packageKey, features: FEATURE_KEYS.filter((k) => set.has(k)) };
}

export function canUse(ent: Entitlements | null | undefined, feature: FeatureKey): boolean {
  return !!ent && ent.features.includes(feature);
}

export function canUseAll(ent: Entitlements | null | undefined, features: readonly FeatureKey[]): boolean {
  return features.every((f) => canUse(ent, f));
}

export function canUseAny(ent: Entitlements | null | undefined, features: readonly FeatureKey[]): boolean {
  return features.some((f) => canUse(ent, f));
}

export class FeatureNotAvailableError extends AppError {
  readonly feature: FeatureKey;
  constructor(feature: FeatureKey) {
    super("FEATURE_UNAVAILABLE", `${FEATURES[feature].label} is not included in this wedding’s package.`);
    this.name = "FeatureNotAvailableError";
    this.feature = feature;
  }
}

export function assertCanUse(ent: Entitlements | null | undefined, feature: FeatureKey): void {
  if (!canUse(ent, feature)) throw new FeatureNotAvailableError(feature);
}
