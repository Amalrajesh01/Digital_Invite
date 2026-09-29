"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";
import { Chip } from "@/components/ui/Chip";
import { useConfirm } from "@/components/ui/Confirm";
import { SelectField, TextField } from "@/components/ui/Field";
import { Menu } from "@/components/ui/Menu";
import { Sheet } from "@/components/ui/Sheet";
import { addDomainAction, removeDomainAction, verifyDomainAction } from "@/app/actions/wedding";

interface Row { id: string; hostname: string; verified: boolean; weddingId: string; title: string }

export function DomainsManager({ rows, weddings }: { rows: Row[]; weddings: { id: string; title: string }[] }) {
  const router = useRouter();
  const ask = useConfirm();
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState("");
  const [wedding, setWedding] = useState(weddings[0]?.id ?? "");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, ok: string) =>
    start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error?.message ?? "That did not work."); });

  return (
    <>
      <div className="mb-4 flex justify-end"><Button variant="accent" icon={<Plus className="size-4" />} disabled={!weddings.length} onClick={() => { setOpen(true); setErr(""); setHost(""); }}>Connect a domain</Button></div>
      {rows.length === 0 ? (
        <EmptyState title="No custom domains" body="Every invitation already works at /invite/its-link. A custom domain is a premium touch for Luxury weddings." />
      ) : (
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead><tr><th>Domain</th><th>Wedding</th><th>State</th><th className="w-10"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.hostname}</td>
                  <td>{d.title}</td>
                  <td>{d.verified ? <Chip tone="ok">Verified · live</Chip> : <Chip tone="warn">Waiting for DNS</Chip>}</td>
                  <td>
                    <Menu label={`Actions for ${d.hostname}`} items={[
                      { label: d.verified ? "Mark as not verified" : "Mark as verified", onSelect: () => run(() => verifyDomainAction(d.id, !d.verified), d.verified ? "Domain switched off" : "Domain is live") },
                      { label: "Remove…", tone: "danger" as const, divider: true, onSelect: async () => { if (await ask({ title: `Remove ${d.hostname}?`, message: "The invitation stays available at its normal link.", confirmLabel: "Remove", tone: "danger" })) run(() => removeDomainAction(d.id), "Removed"); } },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="Connect a domain" description="Type the address exactly as the couple will share it."
        footer={<><Button variant="quiet" onClick={() => setOpen(false)}>Cancel</Button><Button loading={pending} disabled={!host.trim() || !wedding} onClick={() => start(async () => { const r = await addDomainAction(wedding, host); if (r.ok) { toast.success("Domain added — now point its DNS"); setOpen(false); router.refresh(); } else setErr(r.error.message); })}>Add domain</Button></>}>
        <div className="grid gap-4">
          <SelectField label="Wedding" value={wedding} onChange={(e) => setWedding(e.target.value)}>{weddings.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}</SelectField>
          <TextField label="Domain" placeholder="meenakshiandaravind.com" value={host} onChange={(e) => setHost(e.target.value)} error={err} hint="After adding, create a CNAME (or A) record at the domain registrar pointing to your host, then come back and mark it verified." />
        </div>
      </Sheet>
    </>
  );
}
