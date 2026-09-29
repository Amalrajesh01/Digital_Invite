"use client";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Copy, Download, Mail, MessageCircle, Plus, Search, Send, Upload, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { SelectField, TextField, TextArea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Bits";
import { Chip, RsvpChip } from "@/components/ui/Chip";
import { Menu } from "@/components/ui/Menu";
import { useConfirm } from "@/components/ui/Confirm";
import { LText, LocaleProvider } from "@/components/admin/forms";
import type { LocalizedText } from "@/domain/doc/schema";
import { CSV_TEMPLATE } from "@/domain/guests/csv";
import {
  archiveGuestsAction, bulkGroupAction, createGroupAction, createGuestAction, listGroupsAction, importCsvAction, listGuestsAction, markSentAction, regenerateInviteAction, remindersAction, sendEmailsAction, shareListAction,
  updateGuestAction, type GuestRow,
} from "@/app/actions/guests";

interface Group { id: string; name: string; key: string; count: number }
const INVITE: Record<string, [string, "neutral" | "info" | "warn" | "ok"]> = { NOT_SENT: ["Not sent", "neutral"], SENT: ["Sent", "info"], OPENED: ["Opened", "warn"], RESPONDED: ["Replied", "ok"] };

interface FormState { id?: string; name: string; phone: string; email: string; groupId: string; seats: number; relationship: string; notes: string; customGreeting: LocalizedText; preferredLocale: string }
const empty = (): FormState => ({ name: "", phone: "", email: "", groupId: "", seats: 1, relationship: "", notes: "", customGreeting: {}, preferredLocale: "" });

export function GuestManager({ weddingId, slug, initial, groups: initialGroups, secondary, canRemind, canShare, base }: { weddingId: string; slug: string; initial: GuestRow[]; groups: Group[]; secondary: string | null; canRemind: boolean; canShare: boolean; base: string }) {
  const ask = useConfirm();
  const [rows, setRows] = useState(initial);
  const [groups, setGroups] = useState(initialGroups);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [rsvp, setRsvp] = useState("");
  const [inv, setInv] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [csv, setCsv] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; skipped: { row: number; name: string; reason: string }[]; errors: { row: number; message: string }[] } | null>(null);
  const [share, setShare] = useState<{ guestId: string; name: string; link: string; whatsapp: string | null }[] | null>(null);
  const [groupSheet, setGroupSheet] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [pending, start] = useTransition();

  const refresh = useCallback(async () => {
    const r = await listGuestsAction(weddingId);
    if (r.ok) {
      setRows(r.data as GuestRow[]);
      setGroups((g) => g.map((x) => ({ ...x, count: r.data.filter((y) => y.groupId === x.id).length })));
    } else toast.error(r.error.message);
  }, [weddingId]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((g) => (!s || `${g.name} ${g.phone ?? ""} ${g.email ?? ""}`.toLowerCase().includes(s)) && (!group || g.groupId === group) && (!rsvp || (rsvp === "PENDING" ? !g.rsvp : g.rsvp?.status === rsvp)) && (!inv || g.invitationStatus === inv));
  }, [rows, q, group, rsvp, inv]);

  const allSel = list.length > 0 && list.every((g) => sel.has(g.id));
  const ids = [...sel];
  const link = (g: GuestRow) => (g.token ? `${base}/invite/${slug}/${g.token}` : "");

  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string }; data?: unknown }>, ok?: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (ok) toast.success(ok);
        await refresh();
      } else toast.error(r.error?.message ?? "That did not work.");
    });

  const save = () =>
    start(async () => {
      if (!form) return;
      setErrors({});
      const payload = { name: form.name, phone: form.phone || null, email: form.email || null, groupId: form.groupId || null, seats: form.seats, relationship: form.relationship, notes: form.notes, customGreeting: form.customGreeting, preferredLocale: form.preferredLocale || null };
      const r = form.id ? await updateGuestAction(weddingId, form.id, payload) : await createGuestAction(weddingId, payload);
      if (r.ok) {
        toast.success(form.id ? "Guest updated" : "Guest added — their personal link is ready");
        setForm(null);
        await refresh();
      } else {
        setErrors(r.error.fields ?? {});
        toast.error(r.error.message);
      }
    });

  const openShare = (which?: string[]) =>
    start(async () => {
      const r = await shareListAction(weddingId, which, "en");
      if (r.ok) setShare(r.data);
      else toast.error(r.error.message);
    });

  return (
    <LocaleProvider value={{ secondary }}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={<UserPlus className="size-4" />} onClick={() => { setErrors({}); setForm(empty()); }}>Add a guest</Button>
          <Button variant="quiet" icon={<Upload className="size-4" />} onClick={() => { setCsv(""); setImportResult(null); setImporting(true); }}>Import from spreadsheet</Button>
          {canShare && <Button variant="quiet" icon={<Send className="size-4" />} onClick={() => openShare()}>Share all invitations</Button>}
          <a className="btn btn-quiet" href={`/api/export/rsvp?weddingId=${weddingId}`}><Download className="size-4" />Export RSVPs</a>
          <Button variant="ghost" icon={<Users className="size-4" />} onClick={() => setGroupSheet(true)}>Groups</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-52 flex-1 sm:max-w-xs"><span className="sr-only">Search guests</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><input className="field-input !pl-9" placeholder="Search name, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <select aria-label="Group" className="field-input !w-auto" value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All groups</option>{groups.map((g) => (<option key={g.id} value={g.id}>{g.name} ({g.count})</option>))}</select>
          <select aria-label="RSVP" className="field-input !w-auto" value={rsvp} onChange={(e) => setRsvp(e.target.value)}><option value="">Any reply</option><option value="YES">Attending</option><option value="MAYBE">Maybe</option><option value="NO">Declined</option><option value="PENDING">No reply yet</option></select>
          <select aria-label="Invitation" className="field-input !w-auto" value={inv} onChange={(e) => setInv(e.target.value)}><option value="">Any invitation status</option><option value="NOT_SENT">Not sent</option><option value="SENT">Sent</option><option value="OPENED">Opened</option><option value="RESPONDED">Replied</option></select>
          <span className="ml-auto text-[13px] text-muted">{list.length} of {rows.length} guests · {list.reduce((n, g) => n + g.seats, 0)} seats</span>
        </div>

        {sel.size > 0 && (
          <div role="region" aria-label="Bulk actions" className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-md border border-ink bg-ink px-4 py-2.5 text-paper shadow-[var(--shadow-2)]">
            <span className="mr-2 text-[14px] font-medium">{sel.size} selected</span>
            <select aria-label="Move to group" className="rounded border border-white/25 bg-transparent px-2 py-1.5 text-[13.5px]" value="" onChange={(e) => e.target.value && run(() => bulkGroupAction(weddingId, ids, e.target.value === "none" ? null : e.target.value), "Group updated")}><option value="">Move to group…</option><option value="none">No group</option>{groups.map((g) => (<option key={g.id} value={g.id} className="text-ink">{g.name}</option>))}</select>
            {canShare && <Button size="sm" variant="quiet" className="!border-white/30 !text-paper hover:!bg-white/10" onClick={() => openShare(ids)}>Share links</Button>}
            <Button size="sm" variant="quiet" className="!border-white/30 !text-paper hover:!bg-white/10" onClick={() => run(() => markSentAction(weddingId, ids), "Marked as sent")}>Mark sent</Button>
            {canShare && <Button size="sm" variant="quiet" className="!border-white/30 !text-paper hover:!bg-white/10" icon={<Mail className="size-4" />} onClick={() => run(() => sendEmailsAction(weddingId, ids).then((r) => (r.ok ? { ok: true } : r)), "Emails queued")}>Email</Button>}
            {canRemind && <Button size="sm" variant="quiet" className="!border-white/30 !text-paper hover:!bg-white/10" onClick={() => start(async () => { const r = await remindersAction(weddingId, ids); if (r.ok) { setShare(r.data.items.map((i) => ({ guestId: i.guestId, name: i.name, link: i.link, whatsapp: i.whatsapp }))); toast.success(`${r.data.count} reminder${r.data.count === 1 ? "" : "s"} prepared`); await refresh(); } else toast.error(r.error.message); })}>Remind</Button>}
            <Button size="sm" variant="quiet" className="!border-white/30 !text-[#ffb4ad] hover:!bg-white/10" onClick={async () => { if (await ask({ title: `Remove ${sel.size} guest${sel.size === 1 ? "" : "s"}?`, message: "Their links stop working immediately. Their replies are kept in your records.", confirmLabel: "Remove", tone: "danger" })) { run(() => archiveGuestsAction(weddingId, ids), "Removed"); setSel(new Set()); } }}>Remove</Button>
            <button className="ml-auto text-[13px] underline" onClick={() => setSel(new Set())}>Clear</button>
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState mark="✦" title="Start your guest list" body="Add guests one by one, or import a spreadsheet. Every guest gets a private link with their own name on it." action={<div className="flex flex-wrap justify-center gap-3"><Button icon={<Plus className="size-4" />} onClick={() => setForm(empty())}>Add the first guest</Button><Button variant="quiet" onClick={() => setImporting(true)}>Import a spreadsheet</Button></div>} />
        ) : list.length === 0 ? (
          <EmptyState title="No guests match" body="Try clearing a filter." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-rule bg-surface">
            <table className="ledger">
              <thead><tr><th className="w-10"><input type="checkbox" aria-label="Select all" className="size-4 accent-[var(--accent)]" checked={allSel} onChange={(e) => setSel(e.target.checked ? new Set(list.map((g) => g.id)) : new Set())} /></th><th>Guest</th><th>Group</th><th className="text-center">Seats</th><th>Reply</th><th>Invitation</th><th className="w-10"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className={cn(pending && "opacity-60")}>
                {list.map((g) => (
                  <tr key={g.id} className={cn(sel.has(g.id) && "bg-accent-soft/40")}>
                    <td><input type="checkbox" aria-label={`Select ${g.name}`} className="size-4 accent-[var(--accent)]" checked={sel.has(g.id)} onChange={(e) => setSel((s) => { const n = new Set(s); if (e.target.checked) n.add(g.id); else n.delete(g.id); return n; })} /></td>
                    <td><button type="button" className="text-left font-medium hover:underline" onClick={() => { setErrors({}); setForm({ id: g.id, name: g.name, phone: g.phone ?? "", email: g.email ?? "", groupId: g.groupId ?? "", seats: g.seats, relationship: g.relationship, notes: g.notes, customGreeting: g.customGreeting, preferredLocale: g.preferredLocale ?? "" }); }}>{g.name}</button><span className="block text-[12.5px] text-muted">{[g.relationship, g.phone ? `+${g.phone}` : "", g.email].filter(Boolean).join(" · ")}</span></td>
                    <td className="text-[13.5px]">{g.groupName ?? <span className="text-muted">—</span>}</td>
                    <td className="text-center tnum">{g.seats}</td>
                    <td><RsvpChip status={g.rsvp?.status ?? "PENDING"} />{g.rsvp?.status === "YES" && <span className="ml-1.5 text-[12.5px] text-muted tnum">{g.rsvp.attendingCount}/{g.seats}</span>}{(g.accommodation || g.transport) && <span className="mt-1 flex gap-1">{g.accommodation && <Chip tone="info">Stay</Chip>}{g.transport && <Chip tone="info">Ride</Chip>}</span>}</td>
                    <td><Chip tone={INVITE[g.invitationStatus][1]}>{INVITE[g.invitationStatus][0]}</Chip>{g.checkedIn && <Chip tone="ok" className="ml-1">Arrived</Chip>}</td>
                    <td>
                      <Menu label={`Actions for ${g.name}`} items={[
                        { label: "Edit", onSelect: () => setForm({ id: g.id, name: g.name, phone: g.phone ?? "", email: g.email ?? "", groupId: g.groupId ?? "", seats: g.seats, relationship: g.relationship, notes: g.notes, customGreeting: g.customGreeting, preferredLocale: g.preferredLocale ?? "" }) },
                        ...(canShare ? [
                          { label: "Copy personal link", onSelect: () => { void navigator.clipboard.writeText(link(g)); toast.success("Link copied"); } },
                          ...(g.phone ? [{ label: "Send on WhatsApp", onSelect: () => openShare([g.id]) }] : []),
                          { label: "Open their invitation", href: link(g) },
                          { label: "Replace link…", onSelect: async () => { if (await ask({ title: "Replace this guest’s link?", message: "The old link stops working — useful if it was forwarded to someone else.", confirmLabel: "Replace link" })) run(() => regenerateInviteAction(weddingId, g.id), "New link created"); } },
                        ] : []),
                        { label: "Remove", tone: "danger" as const, divider: true, onSelect: async () => { if (await ask({ title: `Remove ${g.name}?`, message: "Their link stops working. Their reply is kept in your records.", confirmLabel: "Remove", tone: "danger" })) run(() => archiveGuestsAction(weddingId, [g.id]), "Removed"); } },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={!!form} onClose={() => setForm(null)} variant="drawer" title={form?.id ? "Edit guest" : "Add a guest"} description="Each guest gets a private link with their name on it."
        footer={<><Button variant="quiet" onClick={() => setForm(null)}>Cancel</Button><Button loading={pending} onClick={save}>{form?.id ? "Save changes" : "Add guest"}</Button></>}>
        {form && (
          <div className="space-y-4">
            <TextField label="Name" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <div className="grid gap-4 sm:grid-cols-2"><TextField label="Phone / WhatsApp" inputMode="tel" value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} hint="10-digit Indian numbers work as they are." /><TextField label="Email (optional)" type="email" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Group" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}><option value="">No group</option>{groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}</SelectField>
              <TextField label="Seats reserved" type="number" min={1} max={30} value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) || 1 })} hint="Guest + family they may bring." />
            </div>
            <TextField label="Relationship" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Aunt, College friend, Colleague…" hint="Can select a different heartfelt greeting (Luxury)." />
            <LText label="Personal greeting (optional)" multiline value={form.customGreeting} onChange={(v) => setForm({ ...form, customGreeting: v })} hint="Overrides the default greeting for this guest. Use {name} for their name." />
            {secondary && <SelectField label="Opens in" value={form.preferredLocale} onChange={(e) => setForm({ ...form, preferredLocale: e.target.value })}><option value="">Default language</option><option value="en">English</option><option value={secondary}>{secondary.toUpperCase()}</option></SelectField>}
            <TextArea label="Private notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} hint="Only you see these (e.g. allergies, seating wishes)." />
          </div>
        )}
      </Sheet>

      <Sheet open={importing} onClose={() => setImporting(false)} title="Import guests" description="Use a spreadsheet saved as CSV. Duplicate phone numbers are skipped safely." wide
        footer={<><Button variant="quiet" onClick={() => setImporting(false)}>Close</Button><Button loading={pending} disabled={!csv.trim()} onClick={() => start(async () => { const r = await importCsvAction(weddingId, csv); if (r.ok) { setImportResult(r.data); await refresh(); toast.success(`${r.data.created} guest${r.data.created === 1 ? "" : "s"} added`); } else toast.error(r.error.message); })}>Import</Button></>}>
        <div className="space-y-4">
          <p className="text-[14px] text-muted">Columns: <code>name, phone, email, group, seats, relationship, meal, accommodation, transport</code>. Only <em>name</em> is required.</p>
          <div className="flex flex-wrap gap-3"><a className="btn btn-quiet btn-sm" href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`} download="guest-list-template.csv"><Download className="size-4" />Download the template</a><label className="btn btn-quiet btn-sm cursor-pointer"><Upload className="size-4" />Choose a CSV file<input type="file" accept=".csv,text/csv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); e.target.value = ""; }} /></label></div>
          <TextArea label="Or paste rows here" rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={CSV_TEMPLATE} />
          {importResult && (
            <div role="status" className="space-y-2 rounded-md bg-paper-2 p-4 text-[14px]">
              <p className="font-medium text-ok">{importResult.created} added</p>
              {importResult.skipped.length > 0 && <div><p className="font-medium">{importResult.skipped.length} skipped (already on your list)</p><ul className="text-muted">{importResult.skipped.slice(0, 6).map((s) => (<li key={s.row}>Row {s.row}: {s.name} — {s.reason}</li>))}</ul></div>}
              {importResult.errors.length > 0 && <div><p className="font-medium text-bad">{importResult.errors.length} need attention</p><ul className="text-muted">{importResult.errors.slice(0, 6).map((s) => (<li key={s.row}>Row {s.row}: {s.message}</li>))}</ul></div>}
            </div>
          )}
        </div>
      </Sheet>

      <Sheet open={!!share} onClose={() => setShare(null)} title="Share invitations" description="Each guest has their own private link. Send them on WhatsApp or copy the link." wide footer={<><Button variant="quiet" onClick={() => setShare(null)}>Close</Button><Button variant="quiet" onClick={() => run(() => markSentAction(weddingId, share?.map((s) => s.guestId) ?? []), "Marked as sent")}>Mark all as sent</Button></>}>
        <ul className="divide-y divide-rule">
          {share?.map((s) => (
            <li key={s.guestId} className="flex flex-wrap items-center gap-3 py-3"><span className="min-w-0 flex-1"><span className="block font-medium">{s.name}</span><span className="block truncate text-[12.5px] text-muted">{s.link}</span></span>
              {s.whatsapp ? <a className="btn btn-quiet btn-sm" href={s.whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => void markSentAction(weddingId, [s.guestId])}><MessageCircle className="size-4" />WhatsApp</a> : <span className="text-[12.5px] text-muted">no phone</span>}
              <Button size="sm" variant="ghost" icon={<Copy className="size-4" />} onClick={() => { void navigator.clipboard.writeText(s.link); toast.success("Link copied"); }}>Copy</Button></li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={groupSheet} onClose={() => setGroupSheet(false)} title="Guest groups" description="Groups decide who sees which events (Luxury) and help you plan.">
        <ul className="divide-y divide-rule">{groups.map((g) => (<li key={g.id} className="flex items-center justify-between py-2.5 text-[15px]"><span>{g.name}</span><span className="text-muted tnum">{g.count}</span></li>))}</ul>
        <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!newGroup.trim()) return; start(async () => { const r = await createGroupAction(weddingId, newGroup); if (r.ok) { setNewGroup(""); const g = await listGroupsAction(weddingId); if (g.ok) setGroups(g.data as Group[]); toast.success("Group added"); } else toast.error(r.error.message); }); }}>
          <input className="field-input" aria-label="New group name" placeholder="e.g. Neighbours" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} /><Button loading={pending}>Add group</Button>
        </form>
      </Sheet>
    </LocaleProvider>
  );
}
