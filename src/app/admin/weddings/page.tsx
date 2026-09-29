import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listWeddings } from "@/domain/wedding/service";
import { PageHeader } from "@/components/ui/Bits";
import { LinkButton } from "@/components/ui/Button";
import { WeddingsTable } from "./WeddingsTable";

export const metadata: Metadata = { title: "Weddings" };
export const dynamic = "force-dynamic";

export default async function WeddingsPage() {
  const admin = await requireAdminPage("/admin/weddings");
  const weddings = await listWeddings(admin, { includeArchived: true });
  return (
    <>
      <PageHeader eyebrow="Studio" title="Weddings" lede="Every couple you are designing for — search, open, preview, publish, duplicate or archive." actions={<LinkButton href="/admin/weddings/new" variant="accent">New wedding</LinkButton>} />
      <WeddingsTable
        rows={weddings.map((w) => ({ ...w, weddingDate: w.weddingDate, archivedAt: w.archivedAt?.toISOString() ?? null, publishedAt: w.publishedAt?.toISOString() ?? null, draftUpdatedAt: w.draftUpdatedAt.toISOString() }))}
      />
    </>
  );
}
