"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";
import { Chip, type Tone } from "@/components/ui/Chip";
import { useConfirm } from "@/components/ui/Confirm";
import { deleteGiftAction, pauseGiftAction, publishGiftAction } from "@/app/actions/growth";
import { waLink } from "@/lib/whatsapp";

interface Row { id: string; ref: string; state: "SUBMITTED" | "LIVE" | "PAUSED"; name: string; phone: string; occasion: string; experience: string; url: string | null }
const TONE: Record<Row["state"], [Tone, string]> = { SUBMITTED: ["warn", "Waiting to publish"], LIVE: ["ok", "Live"], PAUSED: ["neutral", "Paused"] };

export function GiftsManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const ask = useConfirm();
  const [pending, start] = useTransition();
  if (!rows.length) return <EmptyState title="No gifts sent to us yet" body="When someone finishes a gift on the public site and sends it, it appears here." />;

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: { message: string } }>, done: string) =>
    start(async () => { const r = await fn(); if (r.ok) { toast.success(done); router.refresh(); } else toast.error(r.error.message); });

  return (
    <div className="overflow-x-auto">
      <table className="ledger">
        <thead><tr><th>Ref</th><th>Maker</th><th>Gift</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id} className="align-top">
              <td className="tnum font-medium">{g.ref}</td>
              <td><p className="font-medium">{g.name || "—"}</p><p className="text-[12.5px] text-muted">{g.phone}</p></td>
              <td className="text-[13.5px]">{g.occasion.replace(/_/g, " ")}<p className="text-muted">{g.experience}</p></td>
              <td><Chip tone={TONE[g.state][0]}>{TONE[g.state][1]}</Chip></td>
              <td className="min-w-64">
                <div className="flex flex-wrap gap-1.5">
                  {g.state !== "LIVE" && <Button size="sm" variant="accent" disabled={pending} onClick={() => run(() => publishGiftAction(g.id), "Published. The link is live.")}>{g.state === "PAUSED" ? "Publish again" : "Publish"}</Button>}
                  {g.state === "LIVE" && <Button size="sm" variant="quiet" disabled={pending} onClick={() => run(() => pauseGiftAction(g.id), "Paused")}>Pause</Button>}
                  {g.url && <a className="btn btn-sm btn-quiet" href={waLink(`Hi ${g.name.split(" ")[0] || "there"}, your gift is ready. Here is its private link: ${g.url}`, g.phone.replace(/\D/g, ""))} target="_blank" rel="noopener noreferrer">Send link on WhatsApp</a>}
                  <Button size="sm" variant="danger" disabled={pending} onClick={async () => { if (await ask({ title: "Delete this gift?", message: "The gift and every photograph in it are removed for good. This cannot be undone.", confirmLabel: "Delete", tone: "danger" })) run(() => deleteGiftAction(g.id), "Deleted"); }}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
