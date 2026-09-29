"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/Bits";
import { LinkButton } from "@/components/ui/Button";
import { PackageChip, StatusChip } from "@/components/ui/Chip";
import { useConfirm } from "@/components/ui/Confirm";
import { Menu } from "@/components/ui/Menu";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { archiveAction, duplicateAction, publishAction, restoreAction, unpublishAction } from "@/app/actions/wedding";

interface Row {
  id: string; slug: string; title: string; packageKey: string; customerClass: string; status: string; effective: string; weddingDate: string | null;
  archivedAt: string | null; publishedAt: string | null; draftUpdatedAt: string; views: number; guests: number;
  rsvp: { yes: number; no: number; maybe: number; pending: number };
  clients: { id: string; name: string; email: string }[];
}

function RsvpBar({ r, guests }: { r: Row["rsvp"]; guests: number }) {
  if (!guests) return <span className="text-muted">—</span>;
  const seg = (n: number, c: string, l: string) => n > 0 && <span className={c} style={{ width: `${(n / guests) * 100}%` }} title={`${l}: ${n}`} />;
  return (
    <div className="w-36">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-paper-2" role="img" aria-label={`${r.yes} attending, ${r.maybe} maybe, ${r.no} declined, ${r.pending} not replied`}>
        {seg(r.yes, "bg-ok", "Attending")}{seg(r.maybe, "bg-warn", "Maybe")}{seg(r.no, "bg-bad", "Declined")}
      </div>
      <p className="mt-1.5 text-[12.5px] text-muted tnum">{r.yes} yes · {r.maybe} maybe · {r.no} no · {r.pending} open</p>
    </div>
  );
}

export function WeddingsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const ask = useConfirm();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [pkg, setPkg] = useState("");
  const [archived, setArchived] = useState(false);
  const [dup, setDup] = useState<Row | null>(null);
  const [dupTitle, setDupTitle] = useState("");
  const [pending, start] = useTransition();

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (archived ? !!r.archivedAt : !r.archivedAt) && (!status || r.effective === status) && (!pkg || r.packageKey === pkg) && (!s || `${r.title} ${r.slug} ${r.clients.map((c) => c.name + c.email).join(" ")}`.toLowerCase().includes(s)));
  }, [rows, q, status, pkg, archived]);

  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, success: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(success);
        router.refresh();
      } else toast.error(r.error?.message ?? "That did not work.");
    });

  const days = (d: string | null) => {
    if (!d) return null;
    const n = Math.round((new Date(d + "T00:00:00Z").getTime() - Date.now()) / 86400000);
    return n;
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1 sm:max-w-sm">
          <span className="sr-only">Search weddings</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search couple, link or client…" className="field-input !pl-9" />
        </label>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="field-input !w-auto"><option value="">All states</option>{["DRAFT", "PREVIEW", "PUBLISHED", "LIVE_EVENT", "POST_EVENT", "MEMORY", "ANNIVERSARY"].map((s) => (<option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>))}</select>
        <select aria-label="Filter by package" value={pkg} onChange={(e) => setPkg(e.target.value)} className="field-input !w-auto"><option value="">All packages</option><option value="ESSENTIAL">Essential</option><option value="SIGNATURE">Signature</option><option value="LUXURY">Luxury</option></select>
        <label className="flex cursor-pointer items-center gap-2 text-[14px] text-ink-2"><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="size-4 accent-[var(--accent)]" />Archived</label>
      </div>

      {list.length === 0 ? (
        <EmptyState title={rows.length ? "No weddings match" : "No weddings yet"} body={rows.length ? "Try clearing the search or filters." : "Create your first wedding to begin."} action={!rows.length ? <LinkButton href="/admin/weddings/new" variant="accent">New wedding</LinkButton> : undefined} />
      ) : (
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead><tr><th>Couple</th><th>Package</th><th>Date</th><th>Status</th><th>Client</th><th className="text-right">Views</th><th>RSVPs</th><th className="w-10"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className={cn(pending && "opacity-60")}>
              {list.map((w) => {
                const d = days(w.weddingDate);
                return (
                  <tr key={w.id}>
                    <td><Link href={`/admin/weddings/${w.id}`} className="block font-medium hover:underline">{w.title || "Untitled wedding"}</Link><span className="text-[12.5px] text-muted">/invite/{w.slug}</span></td>
                    <td><PackageChip pkg={w.packageKey} />{w.customerClass === "FREE_PORTFOLIO" && <span className="ml-1.5 text-[11.5px] text-brass">portfolio</span>}</td>
                    <td className="whitespace-nowrap">{w.weddingDate ? new Date(w.weddingDate + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : <span className="text-muted">Not set</span>}{d != null && d >= 0 && <span className="block text-[12.5px] text-muted">in {d} day{d === 1 ? "" : "s"}</span>}</td>
                    <td><StatusChip status={w.effective} />{w.archivedAt && <span className="ml-1.5 text-[12px] text-muted">archived</span>}</td>
                    <td className="text-[13.5px]">{w.clients.length ? w.clients.map((c) => c.name || c.email).join(", ") : <span className="text-muted">—</span>}</td>
                    <td className="text-right tnum">{w.views.toLocaleString("en-IN")}</td>
                    <td><RsvpBar r={w.rsvp} guests={w.guests} /></td>
                    <td>
                      <Menu
                        label={`Actions for ${w.title}`}
                        items={[
                          { label: "Open", href: `/admin/weddings/${w.id}` },
                          { label: "Edit invitation", href: `/admin/weddings/${w.id}/edit` },
                          { label: "Preview", href: `/preview/${w.id}` },
                          ...(w.publishedAt && !["DRAFT", "PREVIEW"].includes(w.status) ? [{ label: "View live invitation", href: `/invite/${w.slug}` }] : []),
                          { label: w.status === "DRAFT" || w.status === "PREVIEW" ? "Publish…" : "Publish latest changes…", divider: true, onSelect: async () => { if (await ask({ title: "Publish this invitation?", message: `Guests will see the current draft of ${w.title || "this wedding"} at /invite/${w.slug}. You can roll back any time.`, confirmLabel: "Publish" })) run(() => publishAction(w.id), "Published"); } },
                          ...(w.status !== "DRAFT" ? [{ label: "Unpublish…", onSelect: async () => { if (await ask({ title: "Take it offline?", message: "Guests will see a “not live yet” page. Nothing is deleted.", confirmLabel: "Unpublish", tone: "danger" as const })) run(() => unpublishAction(w.id), "Unpublished"); } }] : []),
                          { label: "Duplicate…", onSelect: () => { setDup(w); setDupTitle(`${w.title} (copy)`); } },
                          { label: "Version history & rollback", href: `/admin/weddings/${w.id}/versions` },
                          w.archivedAt
                            ? { label: "Restore", divider: true, onSelect: () => run(() => restoreAction(w.id), "Restored") }
                            : { label: "Archive…", divider: true, tone: "danger" as const, onSelect: async () => { if (await ask({ title: "Archive this wedding?", message: "It leaves your list and its public link is taken offline. Nothing is deleted and you can restore it.", confirmLabel: "Archive", tone: "danger" })) run(() => archiveAction(w.id), "Archived"); } },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!dup} onClose={() => setDup(null)} title="Duplicate wedding" description="Copies the template, theme, sections and content. Guests, wishes and guest uploads are never copied."
        footer={<><Button variant="quiet" onClick={() => setDup(null)}>Cancel</Button><Button loading={pending} onClick={() => dup && start(async () => { const r = await duplicateAction(dup.id, { title: dupTitle }); if (r.ok) { toast.success("Duplicated"); setDup(null); router.push(`/admin/weddings/${r.data.id}`); } else toast.error(r.error.message); })}>Duplicate</Button></>}>
        <TextField label="Title for the copy" value={dupTitle} onChange={(e) => setDupTitle(e.target.value)} />
      </Sheet>
    </>
  );
}
