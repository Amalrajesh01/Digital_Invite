"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";
import { Chip, type Tone } from "@/components/ui/Chip";
import { SelectField, TextArea } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { setLeadAction } from "@/app/actions/growth";
import { waLink } from "@/lib/whatsapp";

type St = "NEW" | "CONTACTED" | "QUOTED" | "WON" | "LOST";
interface Row { id: string; kind: "ENQUIRY" | "GIFT"; name: string; phone: string; occasion: string; templateSlug: string; eventDate: string | null; message: string; status: St; notes: string; source: string; orderId: string | null; createdAt: string }
const TONE: Record<St, [Tone, string]> = { NEW: ["accent", "New"], CONTACTED: ["info", "Contacted"], QUOTED: ["brass", "Quoted"], WON: ["ok", "Won"], LOST: ["neutral", "Lost"] };

export function LeadsManager({ rows, orders }: { rows: Row[]; orders: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<Row | null>(null);
  const [status, setStatus] = useState<St>("NEW");
  const [notes, setNotes] = useState("");
  const [orderId, setOrderId] = useState("");

  const edit = (l: Row) => { setOpen(l); setStatus(l.status); setNotes(l.notes); setOrderId(l.orderId ?? ""); };
  const save = () => open && start(async () => {
    const r = await setLeadAction(open.id, { status, notes, orderId: orderId || null });
    if (r.ok) { toast.success("Saved"); setOpen(null); router.refresh(); } else toast.error(r.error.message);
  });

  if (!rows.length) return <EmptyState title="No enquiries yet" body="When someone fills in the form on the site, or sends a love gift, they appear here." />;
  return (
    <>
      <div className="overflow-x-auto">
        <table className="ledger">
          <thead><tr><th>Who</th><th>Wants</th><th>Date</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="align-top">
                <td><p className="font-medium">{l.name}</p><p className="text-[12.5px] text-muted">{l.phone}</p><p className="text-[12px] text-muted">{l.kind === "GIFT" ? "Love gift" : "Enquiry"}{l.source ? ` · ${l.source}` : ""}</p></td>
                <td className="text-[13.5px]"><p>{l.occasion || "—"}</p><p className="text-muted">{l.templateSlug}</p>{l.message && <p className="mt-1 max-w-xs text-muted">{l.message}</p>}</td>
                <td className="text-[13.5px]">{l.eventDate ?? "—"}<p className="text-[12px] text-muted">asked {new Date(l.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}</p></td>
                <td><Chip tone={TONE[l.status][0]}>{TONE[l.status][1]}</Chip>{l.orderId && <p className="mt-1 text-[12px] text-muted">Order linked</p>}</td>
                <td className="whitespace-nowrap">
                  <a className="btn btn-sm btn-quiet" href={waLink(`Hi ${l.name.split(" ")[0]}, this is Stack Bridge Labs about your ${l.occasion || "invitation"} enquiry.`, l.phone.replace(/\D/g, ""))} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  <button type="button" className="btn btn-sm btn-ghost ml-1" onClick={() => edit(l)}>Update</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? `${open.name}` : ""}
        footer={<><Button variant="quiet" onClick={() => setOpen(null)}>Cancel</Button><Button loading={pending} onClick={save}>Save</Button></>}>
        {open && (
          <div className="grid gap-4">
            <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as St)}>{(Object.keys(TONE) as St[]).map((s) => <option key={s} value={s}>{TONE[s][1]}</option>)}</SelectField>
            <SelectField label="Order they paid for" hint="Link it once they pay, so the funnel shows which designs sell." value={orderId} onChange={(e) => setOrderId(e.target.value)}><option value="">Not linked</option>{orders.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</SelectField>
            <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        )}
      </Sheet>
    </>
  );
}
