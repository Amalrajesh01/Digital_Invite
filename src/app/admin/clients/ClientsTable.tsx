"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/Bits";
import { Chip } from "@/components/ui/Chip";
import { useConfirm } from "@/components/ui/Confirm";
import { Menu } from "@/components/ui/Menu";
import { setUserDisabledAction, userLoginLinkAction } from "@/app/actions/admin";

interface Row { id: string; name: string; email: string; phone: string; disabled: boolean; lastLoginAt: string | null; weddings: { id: string; title: string }[] }

export function ClientsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const ask = useConfirm();
  const [q, setQ] = useState("");
  const [, start] = useTransition();
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => !s || `${r.name} ${r.email} ${r.phone} ${r.weddings.map((w) => w.title).join(" ")}`.toLowerCase().includes(s));
  }, [rows, q]);

  const copyLink = (id: string) =>
    start(async () => {
      const r = await userLoginLinkAction(id);
      if (!r.ok) { toast.error(r.error.message); return; }
      try { await navigator.clipboard.writeText(r.data.link); toast.success("Sign-in link copied — it works once, for 30 minutes."); } catch { toast.message(r.data.link); }
    });

  if (rows.length === 0) return <EmptyState title="No clients yet" body="Open a Signature or Luxury wedding and use ‘Give the couple access’ to invite the first one." />;
  return (
    <>
      <label className="relative mb-4 block max-w-sm">
        <span className="sr-only">Search clients</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or wedding…" className="field-input !pl-9" />
      </label>
      <div className="overflow-x-auto">
        <table className="ledger">
          <thead><tr><th>Client</th><th>Weddings</th><th>Last sign-in</th><th>Access</th><th className="w-10"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td><p className="font-medium">{c.name || "—"}</p><p className="text-[12.5px] text-muted">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p></td>
                <td className="text-[13.5px]">{c.weddings.length ? c.weddings.map((w, i) => (<span key={w.id}>{i > 0 && ", "}<Link className="underline underline-offset-4" href={`/admin/weddings/${w.id}/settings`}>{w.title}</Link></span>)) : <span className="text-muted">Not linked</span>}</td>
                <td className="whitespace-nowrap text-[13.5px]">{c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : <span className="text-muted">Never</span>}</td>
                <td>{c.disabled ? <Chip tone="bad">Paused</Chip> : <Chip tone="ok">Active</Chip>}</td>
                <td>
                  <Menu label={`Actions for ${c.name || c.email}`} items={[
                    { label: "Copy one-time sign-in link", onSelect: () => copyLink(c.id) },
                    c.disabled
                      ? { label: "Restore access", onSelect: () => start(async () => { const r = await setUserDisabledAction(c.id, false); if (r.ok) { toast.success("Access restored"); router.refresh(); } else toast.error(r.error.message); }) }
                      : { label: "Pause access…", tone: "danger" as const, divider: true, onSelect: async () => { if (await ask({ title: "Pause this client?", message: "They are signed out immediately and cannot sign in until you restore access. Their wedding stays exactly as it is.", confirmLabel: "Pause access", tone: "danger" })) start(async () => { const r = await setUserDisabledAction(c.id, true); if (r.ok) { toast.success("Access paused"); router.refresh(); } else toast.error(r.error.message); }); } },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="py-10 text-center text-muted">No clients match.</p>}
      </div>
    </>
  );
}
