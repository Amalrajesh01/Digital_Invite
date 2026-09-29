import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listDomains } from "@/domain/platform/admin";
import { listWeddings } from "@/domain/wedding/service";
import { PageHeader } from "@/components/ui/Bits";
import { DomainsManager } from "./DomainsManager";

export const metadata: Metadata = { title: "Domains" };
export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const admin = await requireAdminPage("/admin/domains");
  const [domains, weddings] = await Promise.all([listDomains(admin), listWeddings(admin)]);
  return (
    <>
      <PageHeader eyebrow="Insight" title="Custom domains" lede="Give a couple their own address, such as meenakshiandaravind.com. Add it here, point its DNS at your host, then mark it verified — only verified domains serve the invitation." />
      <DomainsManager
        weddings={weddings.map((w) => ({ id: w.id, title: w.title || w.slug }))}
        rows={domains.map((d) => ({ id: d.d.id, hostname: d.d.hostname, verified: !!d.d.verifiedAt, weddingId: d.d.weddingId, title: d.title || d.slug }))}
      />
    </>
  );
}
