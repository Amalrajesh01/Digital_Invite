import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listPackages } from "@/domain/packages/service";
import { FEATURES } from "@/domain/packages/features";
import { PageHeader } from "@/components/ui/Bits";
import { PackagesEditor } from "./PackagesEditor";

export const metadata: Metadata = { title: "Packages" };
export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  await requireAdminPage("/admin/packages");
  const packages = await listPackages();
  const features = Object.entries(FEATURES).map(([key, f]) => ({ key, label: f.label, description: f.description, group: f.group, tier: f.tier }));
  return (
    <>
      <PageHeader eyebrow="Design library" title="Packages" lede="Essential, Signature and Luxury are the same invitation engine with different features switched on. Change a price or a feature here and every wedding on that package follows — apart from the ones you have customised." />
      <PackagesEditor
        features={features}
        packages={packages.map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, blurb: p.blurb, priceMin: p.priceMin, priceMax: p.priceMax, features: p.features, active: p.active, hasClientDashboard: p.hasClientDashboard }))}
      />
    </>
  );
}
