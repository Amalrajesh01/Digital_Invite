"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Lock, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Switch, TextField, SelectField } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/Bits";
import { Chip } from "@/components/ui/Chip";
import { useConfirm } from "@/components/ui/Confirm";
import { FormCard, Grid, Hint, LText } from "@/components/admin/forms";
import { MediaField } from "@/components/admin/MediaField";
import { useDraft } from "@/components/admin/draft";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import type { LocalizedText } from "@/domain/doc/schema";
import { LOCALES } from "@/domain/doc/constants";
import { capsuleDashboardAction, deleteAnniversaryAction, hideCapsuleItemAction, listMessagesAction, saveAnniversaryAction, saveMemoryBookAction, unlockCapsuleAction } from "@/app/actions/participation";
import { rollbackAction, checkpointAction, saveSettingsAction, setStatusAction, versionsAction } from "@/app/actions/wedding";

// ── time capsule ────────────────────────────────────────────────────────────
export function CapsulePanel({ weddingId, isAdmin }: { weddingId: string; isAdmin: boolean }) {
  const { doc, update } = useDraft();
  const ask = useConfirm();
  const [data, setData] = useState<Awaited<ReturnType<typeof capsuleDashboardAction>> | null>(null);
  const [pending, start] = useTransition();
  const load = useCallback(async () => setData(await capsuleDashboardAction(weddingId)), [weddingId]);
  useEffect(() => void load(), [load]);
  const cap = doc.timeCapsule;
  const d = data?.ok ? data.data : null;
  return (
    <div className="space-y-6">
      <FormCard title="The capsule" description="Guests leave notes, photos, videos and voice messages that stay sealed — even from you — until the unlock date.">
        <Grid>
          <TextField label="Opens on" type="date" value={cap.unlockDate} onChange={(e) => update((x) => void (x.timeCapsule.unlockDate = e.target.value))} hint="For example your first anniversary. It can only be moved later, never earlier, once guests have added messages." />
          <div className="space-y-3 pt-6">
            <Switch label="Guests can add photos" checked={cap.allowPhoto} onChange={(v) => update((x) => void (x.timeCapsule.allowPhoto = v))} />
            <Switch label="Guests can add videos" checked={cap.allowVideo} onChange={(v) => update((x) => void (x.timeCapsule.allowVideo = v))} />
            <Switch label="Guests can add voice notes" checked={cap.allowVoice} onChange={(v) => update((x) => void (x.timeCapsule.allowVoice = v))} />
          </div>
        </Grid>
        <LText label="Invitation to guests" multiline value={cap.prompt} onChange={(v) => update((x) => void (x.timeCapsule.prompt = v))} placeholder="Write to us for our first anniversary — we will open it together." />
      </FormCard>

      <FormCard title="Inside the capsule">
        {!d ? <Skeleton className="h-24" /> : !d.status ? <EmptyState mark="⌛" title="Set an opening date" body="Choose the date above and publish — the capsule opens for guests to fill." /> : !d.status.unlocked ? (
          <div className="flex flex-wrap items-center justify-between gap-4"><p className="flex items-center gap-3 text-[16px]"><Lock className="size-5 text-brass" />Sealed until <strong>{new Date(d.status.unlockAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong> — {d.status.count} message{d.status.count === 1 ? "" : "s"} inside. Nobody can read them yet.</p>{isAdmin && <Button variant="danger" size="sm" loading={pending} onClick={async () => { if (await ask({ title: "Open the capsule early?", message: "Every message becomes readable immediately and guests can no longer add more. This is recorded in the audit log.", confirmLabel: "Open now", tone: "danger" })) start(async () => { const r = await unlockCapsuleAction(weddingId); if (r.ok) { toast.success("Capsule opened"); await load(); } else toast.error(r.error.message); }); }}>Open early (owner only)</Button>}</div>
        ) : d.items.length === 0 ? <p className="text-muted">The capsule is open, but nobody added anything.</p> : (
          <ul className="grid gap-3 sm:grid-cols-2">{d.items.map((it) => (<li key={it.id} className="rounded-md border border-rule p-4"><div className="flex items-center justify-between gap-2"><span className="font-medium">{it.authorName}</span><Chip tone="neutral">{it.kind.toLowerCase()}</Chip></div>{it.media?.kind === "IMAGE" && <img src={it.media.url} alt="" className="mt-2 max-h-48 rounded" />}{it.media && it.media.kind !== "IMAGE" && (it.kind === "VOICE" ? <audio src={it.media.url} controls className="mt-2 w-full" /> : <video src={it.media.url} controls className="mt-2 max-h-56 rounded" />)}{it.body && <p className="mt-2 whitespace-pre-line text-[14.5px]">{it.body}</p>}<Button size="sm" variant="ghost" className="mt-2" icon={<EyeOff className="size-4" />} onClick={() => start(async () => { const r = await hideCapsuleItemAction(weddingId, it.id, !it.hidden); if (r.ok) await load(); })}>{it.hidden ? "Show on the invitation" : "Hide from the invitation"}</Button></li>))}</ul>
        )}
      </FormCard>
    </div>
  );
}

// ── memory (thank-you + memory book) ────────────────────────────────────────
export function MemoryEditor({ weddingId, bookInit, canBook }: { weddingId: string; bookInit: { title: LocalizedText; intro: LocalizedText; pinnedMessageIds: string[]; pinnedAssetIds: string[]; published: boolean } | null; canBook: boolean }) {
  const { doc, update, media, refreshMedia } = useDraft();
  const [title, setTitle] = useState<LocalizedText>(bookInit?.title ?? {});
  const [intro, setIntro] = useState<LocalizedText>(bookInit?.intro ?? {});
  const [pinnedM, setPinnedM] = useState<string[]>(bookInit?.pinnedMessageIds ?? []);
  const [pinnedA, setPinnedA] = useState<string[]>(bookInit?.pinnedAssetIds ?? []);
  const [publish, setPublish] = useState(bookInit?.published ?? false);
  const [msgs, setMsgs] = useState<{ id: string; authorName: string; body: string }[]>([]);
  const [picking, setPicking] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => { void listMessagesAction(weddingId, { moderation: "APPROVED" }).then((r) => r.ok && setMsgs(r.data.filter((m) => m.kind !== "PRIVATE"))); void refreshMedia(); }, [weddingId, refreshMedia]);
  const ty = doc.thankYou;
  return (
    <div className="space-y-6">
      <FormCard title="Thank-you note" description="Shown on the invitation after the wedding — guests see “Thank you for celebrating with us”.">
        <LText label="Your message" multiline rows={6} value={ty.message} onChange={(v) => update((d) => void (d.thankYou.message = v))} />
        <Grid><LText label="Signed" value={ty.signature} onChange={(v) => update((d) => void (d.thankYou.signature = v))} placeholder="Meenu & Aravind" /><MediaField label="Photograph" value={ty.photo} category="COUPLE" onChange={(id) => update((d) => void (d.thankYou.photo = id))} aspect="aspect-[4/5]" /></Grid>
      </FormCard>

      {canBook ? (
        <FormCard title="Memory book" description="Choose the wishes and photographs you want to keep together as a keepsake." actions={<Chip tone={publish ? "ok" : "neutral"}>{publish ? "Shown to guests" : "Private draft"}</Chip>}>
          <Grid><LText label="Title" value={title} onChange={setTitle} placeholder="Our memory book" /><LText label="Introduction" value={intro} onChange={setIntro} /></Grid>
          <div>
            <p className="mb-2 text-[13.5px] font-medium text-ink-2">Photographs ({pinnedA.length})</p>
            <div className="flex flex-wrap gap-2">{pinnedA.map((id) => (<button key={id} type="button" onClick={() => setPinnedA((s) => s.filter((x) => x !== id))} className="group relative size-20 overflow-hidden rounded border border-rule" aria-label="Remove photograph">{media[id] && <img src={media[id].url.replace("/lg", "/sm")} alt="" className="size-full object-cover" />}<span className="absolute inset-0 grid place-items-center bg-ink/60 text-white opacity-0 group-hover:opacity-100">✕</span></button>))}<Button variant="quiet" onClick={() => setPicking(true)}>Add photographs</Button></div>
          </div>
          <div>
            <p className="mb-2 text-[13.5px] font-medium text-ink-2">Wishes to include ({pinnedM.length})</p>
            {msgs.length === 0 ? <p className="text-[14px] text-muted">Approved wishes will be listed here.</p> : <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-rule p-2">{msgs.map((m) => (<li key={m.id}><label className="flex cursor-pointer items-start gap-3 rounded px-2 py-2 hover:bg-paper-2"><input type="checkbox" className="mt-1 size-[18px] accent-[var(--accent)]" checked={pinnedM.includes(m.id)} onChange={(e) => setPinnedM((s) => (e.target.checked ? [...s, m.id] : s.filter((x) => x !== m.id)))} /><span className="text-[14.5px]"><strong>{m.authorName}</strong> — {m.body.slice(0, 140)}</span></label></li>))}</ul>}
          </div>
          <div className="flex flex-wrap items-center gap-4"><Switch label="Show the memory book to guests" checked={publish} onChange={setPublish} /><Button loading={pending} onClick={() => start(async () => { const r = await saveMemoryBookAction(weddingId, { title, intro, pinnedMessageIds: pinnedM, pinnedAssetIds: pinnedA, publish }); if (r.ok) toast.success("Memory book saved"); else toast.error(r.error.message); })}>Save memory book</Button></div>
          <Sheet open={picking} onClose={() => setPicking(false)} wide title="Choose photographs"><MediaLibrary weddingId={weddingId} mode="pick" multiple kinds={["IMAGE"]} pickLabel="Add to memory book" onPickMany={(rows) => { setPinnedA((s) => [...new Set([...s, ...rows.map((r) => r.id)])]); setPicking(false); }} /></Sheet>
        </FormCard>
      ) : <Hint>The memory book is part of the Luxury package.</Hint>}
    </div>
  );
}

// ── anniversary ─────────────────────────────────────────────────────────────
export function AnniversaryEditor({ weddingId, entries }: { weddingId: string; entries: { id: string; year: number; title: LocalizedText; body: LocalizedText }[] }) {
  const { doc, update } = useDraft();
  const router = useRouter();
  const [list, setList] = useState(entries);
  const [edit, setEdit] = useState<{ id?: string; year: number; title: LocalizedText; body: LocalizedText } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      <FormCard title="Anniversary message" description="Around every anniversary the invitation turns into a ‘One year ago today…’ page, with your photographs, this message and a countdown to the next anniversary.">
        <LText label="Message" multiline value={doc.anniversary.message} onChange={(v) => update((d) => void (d.anniversary.message = v))} />
      </FormCard>
      <FormCard title="Anniversary memories" description="Add a note for each year — for example what you did on your first anniversary." actions={<Button size="sm" onClick={() => setEdit({ year: (list[0]?.year ?? 0) + 1 || 1, title: {}, body: {} })}>Add a year</Button>}>
        {list.length === 0 ? <p className="text-muted">No yearly notes yet.</p> : <ul className="divide-y divide-rule">{list.map((e) => (<li key={e.id} className="flex items-center gap-4 py-3"><span className="display tnum w-14 text-[28px] text-accent">{e.year}</span><span className="min-w-0 flex-1 truncate">{e.title.en || "Untitled"}</span><Button size="sm" variant="quiet" onClick={() => setEdit(e)}>Edit</Button><Button size="sm" variant="ghost" className="text-bad" icon={<Trash2 className="size-4" />} aria-label="Delete" onClick={() => start(async () => { const r = await deleteAnniversaryAction(weddingId, e.id); if (r.ok) { setList((s) => s.filter((x) => x.id !== e.id)); router.refresh(); } })} /></li>))}</ul>}
      </FormCard>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit anniversary note" : "New anniversary note"} footer={<><Button variant="quiet" onClick={() => setEdit(null)}>Cancel</Button><Button loading={pending} onClick={() => start(async () => { if (!edit) return; const r = await saveAnniversaryAction(weddingId, { id: edit.id, year: edit.year, title: edit.title, body: edit.body }); if (r.ok) { toast.success("Saved"); setEdit(null); router.refresh(); setList((s) => [{ id: edit.id ?? crypto.randomUUID(), year: edit.year, title: edit.title, body: edit.body }, ...s.filter((x) => x.id !== edit.id)].sort((a, b) => b.year - a.year)); } else toast.error(r.error.message); })}>Save</Button></>}>
        {edit && <div className="space-y-4"><TextField label="Which anniversary?" type="number" min={1} value={edit.year} onChange={(e) => setEdit({ ...edit, year: Number(e.target.value) || 1 })} className="w-32" /><LText label="Title" value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })} /><LText label="Note" multiline value={edit.body} onChange={(v) => setEdit({ ...edit, body: v })} /></div>}
      </Sheet>
    </div>
  );
}

// ── settings ────────────────────────────────────────────────────────────────
export function SettingsForm({ weddingId, isAdmin, initial, status }: { weddingId: string; isAdmin: boolean; initial: { contactEmail: string; contactPhone: string; accessMode: "PUBLIC" | "PERSONALIZED_ONLY"; autoLifecycle: boolean; timezone: string; secondaryLocale: string | null }; status: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [st, setSt] = useState(status);
  const save = () => start(async () => {
    const r = await saveSettingsAction(weddingId, isAdmin ? { contactEmail: v.contactEmail, contactPhone: v.contactPhone, accessMode: v.accessMode, autoLifecycle: v.autoLifecycle, timezone: v.timezone, secondaryLocale: v.secondaryLocale } : { contactEmail: v.contactEmail, contactPhone: v.contactPhone });
    if (r.ok) { toast.success("Settings saved"); router.refresh(); } else toast.error(r.error.message);
  });
  return (
    <div className="space-y-6">
      <FormCard title="Contact details" description="Where notifications go and who guests can reach.">
        <Grid><TextField label="Email" type="email" value={v.contactEmail} onChange={(e) => setV({ ...v, contactEmail: e.target.value })} /><TextField label="Phone / WhatsApp" value={v.contactPhone} onChange={(e) => setV({ ...v, contactPhone: e.target.value })} /></Grid>
      </FormCard>
      {isAdmin && (
        <FormCard title="Access & lifecycle" description="Control who can open the invitation and how it changes through the wedding.">
          <Grid>
            <SelectField label="Who can open it?" value={v.accessMode} onChange={(e) => setV({ ...v, accessMode: e.target.value as never })}><option value="PUBLIC">Anyone with the link</option><option value="PERSONALIZED_ONLY">Only guests with a personal link</option></SelectField>
            <SelectField label="Time zone" value={v.timezone} onChange={(e) => setV({ ...v, timezone: e.target.value })}>{["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "America/Los_Angeles", "Australia/Sydney"].map((z) => (<option key={z}>{z}</option>))}</SelectField>
          </Grid>
          <SelectField label="Local language" value={v.secondaryLocale ?? ""} onChange={(e) => setV({ ...v, secondaryLocale: e.target.value || null })}><option value="">English only</option>{LOCALES.map((l) => (<option key={l.code} value={l.code}>{l.label} — {l.native}</option>))}</SelectField>
          <Switch label="Follow the wedding date automatically" hint="The invitation switches to “Welcome to our celebration” on the day, “Thank you” afterwards, then memories and anniversaries." checked={v.autoLifecycle} onChange={(x) => setV({ ...v, autoLifecycle: x })} />
          {!v.autoLifecycle && (
            <SelectField label="Show the invitation as" value={st} onChange={(e) => start(async () => { const r = await setStatusAction(weddingId, e.target.value); if (r.ok) { setSt(e.target.value); toast.success("State changed"); router.refresh(); } else toast.error(r.error.message); })}>
              {["PUBLISHED", "LIVE_EVENT", "POST_EVENT", "MEMORY", "ANNIVERSARY"].map((s) => (<option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>))}
            </SelectField>
          )}
        </FormCard>
      )}
      <Button loading={pending} onClick={save}>Save settings</Button>
    </div>
  );
}

// ── versions ────────────────────────────────────────────────────────────────
type Ver = { id: string; version: number; kind: string; label: string; createdAt: Date | string; createdBy: string | null; isLive: boolean };

export function VersionsPanel({ weddingId }: { weddingId: string }) {
  const ask = useConfirm();
  const router = useRouter();
  const [rows, setRows] = useState<Ver[] | null>(null);
  const [label, setLabel] = useState("");
  const [pending, start] = useTransition();
  const load = useCallback(async () => { const r = await versionsAction(weddingId); if (r.ok) setRows(r.data as Ver[]); else toast.error(r.error.message); }, [weddingId]);
  useEffect(() => void load(), [load]);
  const restore = async (v: Ver, goLive: boolean) => {
    const ok = await ask({ title: goLive ? `Make version ${v.version} live?` : `Restore version ${v.version} as the draft?`, message: goLive ? "Guests will immediately see this version. Your current draft is saved as a checkpoint first." : "Your current draft is saved as a checkpoint first, then replaced by this version. Nothing live changes until you publish.", confirmLabel: goLive ? "Make live" : "Restore as draft", tone: goLive ? "danger" : "primary" });
    if (ok) start(async () => { const r = await rollbackAction(weddingId, v.id, goLive); if (r.ok) { toast.success(goLive ? "Rolled back — live now" : "Restored as draft"); await load(); router.refresh(); } else toast.error(r.error.message); });
  };
  return (
    <div className="space-y-6">
      <FormCard title="Save a checkpoint" description="Snapshot the current draft so you can come back to it. Checkpoints never go live by themselves.">
        <div className="flex flex-wrap items-end gap-3"><TextField label="Name" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Before adding the Malayalam text" className="min-w-64 flex-1" /><Button variant="quiet" loading={pending} onClick={() => start(async () => { const r = await checkpointAction(weddingId, label); if (r.ok) { toast.success("Checkpoint saved"); setLabel(""); await load(); } else toast.error(r.error.message); })}>Save checkpoint</Button></div>
      </FormCard>
      <FormCard title="History">
        {!rows ? <Skeleton className="h-32" /> : rows.length === 0 ? <p className="text-muted">Nothing published yet.</p> : (
          <ul className="divide-y divide-rule">{rows.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-4 py-3.5"><span className="display tnum w-10 text-[28px]">v{v.version}</span><div className="min-w-0 flex-1"><p className="font-medium">{v.label || (v.kind === "PUBLISHED" ? "Published" : "Checkpoint")} {v.isLive && <Chip tone="ok" className="ml-1">Live</Chip>}{v.kind === "CHECKPOINT" && <Chip tone="neutral" className="ml-1">Checkpoint</Chip>}</p><p className="text-[13px] text-muted">{new Date(v.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}{v.createdBy ? ` · ${v.createdBy}` : ""}</p></div>
              <Button size="sm" variant="quiet" icon={<RotateCcw className="size-4" />} onClick={() => void restore(v, false)}>Restore as draft</Button>{!v.isLive && <Button size="sm" variant="danger" onClick={() => void restore(v, true)}>Make live</Button>}</li>
          ))}</ul>
        )}
      </FormCard>
      <p className="text-[13px] text-muted">Rolling back never deletes anything: it creates a checkpoint of your current draft first, so every step can be undone.</p>
    </div>
  );
}
