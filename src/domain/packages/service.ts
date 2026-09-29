import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { PACKAGE_DEFAULTS, defaultPackageFeatures } from "./catalog";
import { type Entitlements, resolveEntitlements } from "./entitlements";
import { type PackageKey, isFeatureKey } from "./features";
import { invalid, notFound } from "@/lib/errors";

/** Inserts the three packages if missing. Never overwrites values Super Admin has edited. */
export async function ensurePackages(): Promise<void> {
  const db = await getDb();
  for (const p of PACKAGE_DEFAULTS) {
    await db
      .insert(schema.weddingPackages)
      .values({
        key: p.key,
        name: p.name,
        tagline: p.tagline,
        blurb: p.blurb,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        features: defaultPackageFeatures(p.key),
        hasClientDashboard: p.hasClientDashboard,
        sortOrder: p.sortOrder,
      })
      .onConflictDoNothing();
  }
}

export async function listPackages() {
  const db = await getDb();
  return db.select().from(schema.weddingPackages).orderBy(schema.weddingPackages.sortOrder);
}

export async function updatePackage(
  key: PackageKey,
  patch: { name?: string; tagline?: string; blurb?: string; priceMin?: number; priceMax?: number; features?: string[]; active?: boolean },
) {
  if (patch.priceMin != null && patch.priceMax != null && patch.priceMin > patch.priceMax) throw invalid("Minimum price cannot be above the maximum.");
  if (patch.features) patch.features = patch.features.filter(isFeatureKey);
  const db = await getDb();
  const [row] = await db
    .update(schema.weddingPackages)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.weddingPackages.key, key))
    .returning();
  if (!row) throw notFound("Package not found.");
  return row;
}

/** Resolve what a wedding may use: its package features plus per-wedding overrides. */
export async function getEntitlements(weddingId: string): Promise<Entitlements> {
  const db = await getDb();
  const [w] = await db
    .select({ packageKey: schema.weddings.packageKey, features: schema.weddingPackages.features })
    .from(schema.weddings)
    .innerJoin(schema.weddingPackages, eq(schema.weddingPackages.key, schema.weddings.packageKey))
    .where(eq(schema.weddings.id, weddingId));
  if (!w) throw notFound("Wedding not found.");
  const overrides = await db
    .select({ featureKey: schema.featureEntitlements.featureKey, enabled: schema.featureEntitlements.enabled })
    .from(schema.featureEntitlements)
    .where(eq(schema.featureEntitlements.weddingId, weddingId));
  return resolveEntitlements(w.packageKey, w.features, overrides);
}

export async function listOverrides(weddingId: string) {
  const db = await getDb();
  return db.select().from(schema.featureEntitlements).where(eq(schema.featureEntitlements.weddingId, weddingId));
}
