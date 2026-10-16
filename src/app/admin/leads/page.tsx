import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listLeads } from "@/domain/growth/service";
import { listOrders } from "@/domain/platform/admin";
import { Ledger, PageHeader } from "@/components/ui/Bits";
import { LeadsManager } from "./LeadsManager";

export const metadata: Metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const admin = await requireAdminPage("/admin/leads");
  const [leads, orders] = await Promise.all([listLeads(admin), listOrders(admin)]);
  const count = (...s: string[]) => leads.filter((l) => s.includes(l.status)).length;
  return (
    <>
      <PageHeader eyebrow="Studio" title="Enquiries" lede="People who asked us to make something, from the public site. Move each one from New to Won, and link the order once they pay so the funnel can see what sells." />
      <Ledger className="mb-8" items={[
        { label: "New", value: count("NEW") },
        { label: "In conversation", value: count("CONTACTED", "QUOTED") },
        { label: "Won", value: count("WON") },
        { label: "Lost", value: count("LOST") },
      ]} />
      <LeadsManager
        orders={orders.map((o) => ({ id: o.order.id, label: `${o.order.customerName} · ₹${o.order.amountInr.toLocaleString("en-IN")}` }))}
        rows={leads.map((l) => ({ id: l.id, kind: l.kind, name: l.name, phone: l.phone, occasion: l.occasion, templateSlug: l.templateSlug, eventDate: l.eventDate, message: l.message, status: l.status, notes: l.notes, source: l.source, orderId: l.orderId, createdAt: l.createdAt.toISOString() }))}
      />
    </>
  );
}
