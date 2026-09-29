"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";
import { Chip, PackageChip, type Tone } from "@/components/ui/Chip";
import { useConfirm } from "@/components/ui/Confirm";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { Menu } from "@/components/ui/Menu";
import { Sheet } from "@/components/ui/Sheet";
import { deleteOrderAction, saveOrderAction } from "@/app/actions/wedding";

type Pkg = "ESSENTIAL" | "SIGNATURE" | "LUXURY";
type St = "QUOTED" | "PAID" | "FREE_PORTFOLIO" | "REFUNDED" | "CANCELLED";
interface Row { id: string; customerName: string; customerContact: string; packageKey: Pkg; amountInr: number; status: St; notes: string; weddingId: string | null; weddingTitle: string | null; createdAt: string }
interface Draft { id?: string; customerName: string; customerContact: string; packageKey: Pkg; amountInr: string; status: St; notes: string; weddingId: string }

const TONE: Record<St, [Tone, string]> = { QUOTED: ["info", "Quoted"], PAID: ["ok", "Paid"], FREE_PORTFOLIO: ["brass", "Free · portfolio"], REFUNDED: ["warn", "Refunded"], CANCELLED: ["neutral", "Cancelled"] };
const blank: Draft = { customerName: "", customerContact: "", packageKey: "SIGNATURE", amountInr: "", status: "QUOTED", notes: "", weddingId: "" };

export function OrdersManager({ rows, weddings }: { rows: Row[]; weddings: { id: string; title: string }[] }) {
  const router = useRouter();
  const ask = useConfirm();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () =>
    draft &&
    start(async () => {
      const r = await saveOrderAction({ id: draft.id, customerName: draft.customerName, customerContact: draft.customerContact, packageKey: draft.packageKey, amountInr: draft.status === "FREE_PORTFOLIO" ? 0 : Number(draft.amountInr || 0), status: draft.status, notes: draft.notes, weddingId: draft.weddingId || null });
      if (r.ok) { toast.success("Order saved"); setDraft(null); router.refresh(); } else toast.error(r.error.message);
    });

  return (
    <>
      <div className="mb-4 flex justify-end"><Button variant="accent" icon={<Plus className="size-4" />} onClick={() => setDraft(blank)}>New order</Button></div>
      {rows.length === 0 ? (
        <EmptyState title="No orders yet" body="Record each customer here so you always know what is paid, what is quoted and who your five free portfolio weddings went to." />
      ) : (
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead><tr><th>Customer</th><th>Package</th><th>Wedding</th><th className="text-right">Amount</th><th>Status</th><th className="w-10"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><p className="font-medium">{o.customerName}</p><p className="text-[12.5px] text-muted">{o.customerContact || "No contact saved"}</p></td>
                  <td><PackageChip pkg={o.packageKey} /></td>
                  <td className="text-[13.5px]">{o.weddingTitle ?? <span className="text-muted">Not linked</span>}</td>
                  <td className="text-right tnum">₹{o.amountInr.toLocaleString("en-IN")}</td>
                  <td><Chip tone={TONE[o.status][0]}>{TONE[o.status][1]}</Chip></td>
                  <td>
                    <Menu label={`Actions for ${o.customerName}`} items={[
                      { label: "Edit", onSelect: () => setDraft({ id: o.id, customerName: o.customerName, customerContact: o.customerContact, packageKey: o.packageKey, amountInr: String(o.amountInr), status: o.status, notes: o.notes, weddingId: o.weddingId ?? "" }) },
                      ...(o.status !== "PAID" ? [{ label: "Mark as paid", onSelect: () => start(async () => { const r = await saveOrderAction({ id: o.id, customerName: o.customerName, customerContact: o.customerContact, packageKey: o.packageKey, amountInr: o.amountInr, status: "PAID", notes: o.notes, weddingId: o.weddingId }); if (r.ok) { toast.success("Marked as paid"); router.refresh(); } else toast.error(r.error.message); }) }] : []),
                      { label: "Delete…", tone: "danger" as const, divider: true, onSelect: async () => { if (await ask({ title: "Delete this order?", message: "Only the ledger entry is removed. The wedding is untouched.", confirmLabel: "Delete", tone: "danger" })) start(async () => { const r = await deleteOrderAction(o.id); if (r.ok) { toast.success("Deleted"); router.refresh(); } else toast.error(r.error.message); }); } },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Edit order" : "New order"}
        footer={<><Button variant="quiet" onClick={() => setDraft(null)}>Cancel</Button><Button loading={pending} disabled={!draft?.customerName.trim()} onClick={save}>Save order</Button></>}>
        {draft && (
          <div className="grid gap-4">
            <TextField label="Customer name" value={draft.customerName} onChange={(e) => set("customerName", e.target.value)} required />
            <TextField label="Phone or email" value={draft.customerContact} onChange={(e) => set("customerContact", e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Package" value={draft.packageKey} onChange={(e) => set("packageKey", e.target.value as Pkg)}><option value="ESSENTIAL">Essential</option><option value="SIGNATURE">Signature</option><option value="LUXURY">Luxury</option></SelectField>
              <SelectField label="Status" value={draft.status} onChange={(e) => set("status", e.target.value as St)}>{(Object.keys(TONE) as St[]).map((s) => <option key={s} value={s}>{TONE[s][1]}</option>)}</SelectField>
            </div>
            <TextField label="Amount (₹)" type="number" min={0} inputMode="numeric" disabled={draft.status === "FREE_PORTFOLIO"} value={draft.status === "FREE_PORTFOLIO" ? "0" : draft.amountInr} onChange={(e) => set("amountInr", e.target.value)} hint="Free portfolio weddings are always ₹0." />
            <SelectField label="Linked wedding" value={draft.weddingId} onChange={(e) => set("weddingId", e.target.value)}><option value="">Not linked</option>{weddings.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}</SelectField>
            <TextArea label="Notes" value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        )}
      </Sheet>
    </>
  );
}
