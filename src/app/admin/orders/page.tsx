import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listOrders } from "@/domain/platform/admin";
import { listWeddings } from "@/domain/wedding/service";
import { Ledger, PageHeader } from "@/components/ui/Bits";
import { OrdersManager } from "./OrdersManager";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default async function OrdersPage() {
  const admin = await requireAdminPage("/admin/orders");
  const [orders, weddings] = await Promise.all([listOrders(admin), listWeddings(admin)]);
  const paid = orders.filter((o) => o.order.status === "PAID");
  const quoted = orders.filter((o) => o.order.status === "QUOTED");
  const sum = (xs: typeof orders) => xs.reduce((n, o) => n + o.order.amountInr, 0);
  return (
    <>
      <PageHeader eyebrow="Studio" title="Orders" lede="A simple ledger of who bought what. Payments happen outside the app — mark an order paid when the money arrives." />
      <Ledger items={[
        { label: "Received", value: inr(sum(paid)), note: `${paid.length} paid order${paid.length === 1 ? "" : "s"}` },
        { label: "Quoted", value: inr(sum(quoted)), note: `${quoted.length} waiting` },
        { label: "Portfolio (free)", value: orders.filter((o) => o.order.status === "FREE_PORTFOLIO").length, note: "first five customers" },
        { label: "All orders", value: orders.length },
      ]} className="mb-8" />
      <OrdersManager
        weddings={weddings.map((w) => ({ id: w.id, title: w.title || w.slug }))}
        rows={orders.map((o) => ({ id: o.order.id, customerName: o.order.customerName, customerContact: o.order.customerContact, packageKey: o.order.packageKey, amountInr: o.order.amountInr, status: o.order.status, notes: o.order.notes, weddingId: o.order.weddingId, weddingTitle: o.wedding, createdAt: o.order.createdAt.toISOString() }))}
      />
    </>
  );
}
