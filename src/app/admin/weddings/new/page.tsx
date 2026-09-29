import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listPackages } from "@/domain/packages/service";
import { PageHeader } from "@/components/ui/Bits";
import { NewWeddingForm } from "./NewWeddingForm";

export const metadata: Metadata = { title: "New wedding" };
export const dynamic = "force-dynamic";

export default async function NewWedding() {
  await requireAdminPage("/admin/weddings/new");
  const packages = await listPackages();
  return (
    <>
      <PageHeader eyebrow="Step 1 of 16" title="Begin a new wedding" lede="Choose the package first — it decides which features, dashboards and guest experiences the couple receives. You can change it later." />
      <NewWeddingForm packages={packages.filter((p) => p.active).map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, blurb: p.blurb, priceMin: p.priceMin, priceMax: p.priceMax, hasClientDashboard: p.hasClientDashboard }))} />
    </>
  );
}
