import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listClients } from "@/domain/auth/service";
import { PageHeader } from "@/components/ui/Bits";
import { ClientsTable } from "./ClientsTable";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const admin = await requireAdminPage("/admin/clients");
  const clients = await listClients(admin);
  return (
    <>
      <PageHeader eyebrow="Studio" title="Clients" lede="Couples and families who can sign in to their own dashboard. Add a client from inside a wedding — Signature and Luxury packages only." />
      <ClientsTable
        rows={clients.map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone ?? "", disabled: !!c.disabledAt, lastLoginAt: c.lastLoginAt?.toISOString() ?? null, weddings: c.weddings.map((w) => ({ id: w.weddingId, title: w.title || w.slug })) }))}
      />
    </>
  );
}
