"use client";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Check, EyeOff, Lock, Pin, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Bits";
import { ModerationChip, Chip } from "@/components/ui/Chip";
import { useConfirm } from "@/components/ui/Confirm";
import {
  deleteMessageAction, listMediaWishesAction, listMessagesAction, listUploadsAction, moderateMediaWishAction, moderateMessageAction, moderateUploadAction, pinMessageAction, type MessageRow,
} from "@/app/actions/participation";

type Mod = "PENDING" | "APPROVED" | "REJECTED";
const ago = (iso: string) => {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="mb-5 flex flex-wrap gap-1 border-b border-rule">
      {items.map((i) => (
        <button key={i.value} role="tab" type="button" aria-selected={value === i.value} onClick={() => onChange(i.value)} className={cn("relative min-h-11 px-4 text-[14.5px] transition-colors", value === i.value ? "font-medium text-ink" : "text-muted hover:text-ink")}>
          {i.label}{i.count ? <span className="ml-1.5 rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">{i.count}</span> : null}
          {value === i.value && <span aria-hidden className="absolute inset-x-2 -bottom-px h-[2px] bg-accent" />}
        </button>
      ))}
    </div>
  );
}

export function MessagesBoard({ weddingId, canPrivate, initialTab = "PENDING" }: { weddingId: string; canPrivate: boolean; initialTab?: "PENDING" | "APPROVED" | "REJECTED" | "PRIVATE" }) {
  const ask = useConfirm();
  const [tab, setTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "PRIVATE">(initialTab);
  const [rows, setRows] = useState<MessageRow[] | null>(null);
  const [counts, setCounts] = useState({ p: 0 });
  const [pending, start] = useTransition();
  const load = useCallback(async () => {
    const r = tab === "PRIVATE" ? await listMessagesAction(weddingId, { kind: "PRIVATE" }) : await listMessagesAction(weddingId, { moderation: tab });
    if (r.ok) setRows(tab === "PRIVATE" ? r.data : r.data.filter((m) => m.kind !== "PRIVATE"));
    else toast.error(r.error.message);
    const p = await listMessagesAction(weddingId, { moderation: "PENDING" });
    if (p.ok) setCounts({ p: p.data.filter((m) => m.kind !== "PRIVATE").length });
  }, [weddingId, tab]);
  useEffect(() => { setRows(null); void load(); }, [load]);
  const act = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, msg?: string) => start(async () => { const r = await fn(); if (r.ok) { if (msg) toast.success(msg); await load(); } else toast.error(r.error?.message ?? "That did not work."); });
  return (
    <div>
      <Tabs value={tab} onChange={setTab} items={[{ value: "PENDING", label: "Waiting", count: counts.p }, { value: "APPROVED", label: "On the wall" }, { value: "REJECTED", label: "Hidden" }, ...(canPrivate ? [{ value: "PRIVATE" as const, label: "Private notes" }] : [])]} />
      {rows === null ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div> : rows.length === 0 ? (
        <EmptyState mark="✎" title={tab === "PENDING" ? "Nothing waiting" : "Nothing here yet"} body={tab === "PENDING" ? "New wishes appear here for your approval before guests can see them." : undefined} />
      ) : (
        <ul className={cn("space-y-3", pending && "opacity-70")}>
          {rows.map((m) => (
            <li key={m.id} className="rounded-lg border border-rule bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted"><span className="text-[15px] font-medium text-ink">{m.authorName}</span><Chip tone="neutral">{m.kind === "SHOUTOUT" ? "Shout-out" : m.kind === "PRIVATE" ? "Private" : "Wish"}</Chip>{m.kind !== "PRIVATE" && <ModerationChip status={m.moderation} />}{m.pinned && <Chip tone="brass">Pinned</Chip>}<span className="ml-auto">{ago(m.createdAt)}</span></div>
              {m.sealed ? <p className="mt-3 flex items-center gap-2 rounded bg-paper-2 px-3 py-3 text-[14px] text-muted"><Lock className="size-4" />Sealed until {m.unlockAt ? new Date(m.unlockAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "later"} — it opens after the wedding.</p> : <p className="mt-3 whitespace-pre-line text-[15.5px] leading-relaxed">{m.body}</p>}
              {m.kind !== "PRIVATE" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.moderation !== "APPROVED" && <Button size="sm" icon={<Check className="size-4" />} onClick={() => act(() => moderateMessageAction(weddingId, m.id, "APPROVED"), "Approved — it’s on the wall")}>Approve</Button>}
                  {m.moderation !== "REJECTED" && <Button size="sm" variant="quiet" icon={<EyeOff className="size-4" />} onClick={() => act(() => moderateMessageAction(weddingId, m.id, "REJECTED"), "Hidden")}>Hide</Button>}
                  {m.moderation === "APPROVED" && <Button size="sm" variant="quiet" icon={<Pin className="size-4" />} onClick={() => act(() => pinMessageAction(weddingId, m.id, !m.pinned))}>{m.pinned ? "Unpin" : "Pin to top"}</Button>}
                  <Button size="sm" variant="ghost" className="ml-auto text-bad" icon={<Trash2 className="size-4" />} onClick={async () => { if (await ask({ title: "Delete this message?", message: "It is removed permanently.", confirmLabel: "Delete", tone: "danger" })) act(() => deleteMessageAction(weddingId, m.id), "Deleted"); }}>Delete</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type UploadRow = { id: string; kind: string; by: string; url: string; thumb: string; moderation: string; createdAt: string };

export function UploadsBoard({ weddingId, wallHref }: { weddingId: string; wallHref?: string }) {
  const [tab, setTab] = useState<Mod>("PENDING");
  const [rows, setRows] = useState<UploadRow[] | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [view, setView] = useState<UploadRow | null>(null);
  const [pending, start] = useTransition();
  const load = useCallback(async () => {
    const r = await listUploadsAction(weddingId, tab);
    if (r.ok) setRows(r.data as UploadRow[]);
    else toast.error(r.error.message);
  }, [weddingId, tab]);
  useEffect(() => { setRows(null); setSel(new Set()); void load(); }, [load]);
  const bulk = (d: Mod) => start(async () => { const ids = sel.size ? [...sel] : (rows ?? []).map((r) => r.id); await Promise.all(ids.map((id) => moderateUploadAction(weddingId, id, d))); toast.success(d === "APPROVED" ? `${ids.length} approved` : `${ids.length} hidden`); setSel(new Set()); await load(); });
  const one = (id: string, d: Mod) => start(async () => { const r = await moderateUploadAction(weddingId, id, d); if (r.ok) { setView(null); await load(); } else toast.error(r.error.message); });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><Tabs value={tab} onChange={setTab} items={[{ value: "PENDING", label: "Waiting" }, { value: "APPROVED", label: "On the wall" }, { value: "REJECTED", label: "Hidden" }]} />{wallHref && <a className="btn btn-quiet btn-sm mb-5" href={wallHref} target="_blank" rel="noopener noreferrer">Open the live wall (for a projector)</a>}</div>
      {rows === null ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}</div> : rows.length === 0 ? (
        <EmptyState mark="✧" title={tab === "PENDING" ? "No photos waiting" : "Nothing here"} body={tab === "PENDING" ? "Guest photos appear here for review before they reach the wall." : undefined} />
      ) : (
        <>
          {tab !== "APPROVED" && <div className="mb-4 flex flex-wrap items-center gap-2"><Button size="sm" onClick={() => bulk("APPROVED")} loading={pending} icon={<Check className="size-4" />}>{sel.size ? `Approve ${sel.size} selected` : `Approve all ${rows.length}`}</Button>{tab === "PENDING" && <Button size="sm" variant="quiet" onClick={() => bulk("REJECTED")} loading={pending} icon={<X className="size-4" />}>{sel.size ? "Hide selected" : "Hide all"}</Button>}</div>}
          <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6", pending && "opacity-70")}>
            {rows.map((r) => (
              <li key={r.id} className="group relative">
                <button type="button" onClick={() => setView(r)} className="relative block aspect-square w-full overflow-hidden rounded-md border border-rule bg-paper-2" aria-label={`View photo by ${r.by}`}>{r.kind === "IMAGE" ? <img src={r.thumb} alt="" className="size-full object-cover" loading="lazy" /> : <video src={r.url} className="size-full object-cover" muted />}<span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/65 to-transparent px-2 pb-1 pt-6 text-left text-[12px] text-white">{r.by}</span></button>
                <input type="checkbox" aria-label={`Select photo by ${r.by}`} checked={sel.has(r.id)} onChange={(e) => setSel((s) => { const n = new Set(s); if (e.target.checked) n.add(r.id); else n.delete(r.id); return n; })} className="absolute left-2 top-2 size-5 accent-[var(--accent)]" />
              </li>
            ))}
          </ul>
        </>
      )}
      {view && (
        <dialog open className="fixed inset-0 z-50 m-0 grid h-dvh w-screen max-w-none place-items-center bg-black/85 p-4" onClick={() => setView(null)}>
          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {view.kind === "IMAGE" ? <img src={view.url} alt="" className="max-h-[75vh] rounded-md" /> : <video src={view.url} controls className="max-h-[75vh] rounded-md" />}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-white"><span className="mr-2">{view.by} · {ago(view.createdAt)}</span><Button icon={<Check className="size-4" />} onClick={() => one(view.id, "APPROVED")}>Approve</Button><Button variant="quiet" className="!bg-white/10 !text-white" icon={<EyeOff className="size-4" />} onClick={() => one(view.id, "REJECTED")}>Hide</Button><Button variant="ghost" className="!text-white" onClick={() => setView(null)}>Close</Button></div>
          </div>
        </dialog>
      )}
    </div>
  );
}

type WishRow = { id: string; authorName: string; message: string; moderation: string; createdAt: string; url: string; mediaKind: string };

export function MediaWishesBoard({ weddingId, kind }: { weddingId: string; kind: "VIDEO" | "VOICE" }) {
  const [tab, setTab] = useState<Mod>("PENDING");
  const [rows, setRows] = useState<WishRow[] | null>(null);
  const [pending, start] = useTransition();
  const load = useCallback(async () => { const r = await listMediaWishesAction(weddingId, kind, tab); if (r.ok) setRows(r.data as WishRow[]); else toast.error(r.error.message); }, [weddingId, kind, tab]);
  useEffect(() => { setRows(null); void load(); }, [load]);
  const mod = (id: string, d: "APPROVED" | "REJECTED") => start(async () => { const r = await moderateMediaWishAction(weddingId, id, d); if (r.ok) { toast.success(d === "APPROVED" ? "Approved" : "Hidden"); await load(); } else toast.error(r.error.message); });
  return (
    <div>
      <Tabs value={tab} onChange={setTab} items={[{ value: "PENDING", label: "Waiting" }, { value: "APPROVED", label: "Shown to guests" }, { value: "REJECTED", label: "Hidden" }]} />
      {rows === null ? <Skeleton className="h-40" /> : rows.length === 0 ? <EmptyState mark={kind === "VIDEO" ? "▶" : "♪"} title="Nothing here yet" body={`${kind === "VIDEO" ? "Video" : "Voice"} wishes recorded by guests will appear here for approval.`} /> : (
        <ul className={cn("grid gap-4", kind === "VIDEO" ? "sm:grid-cols-2 lg:grid-cols-3" : "", pending && "opacity-70")}>
          {rows.map((w) => (
            <li key={w.id} className="rounded-lg border border-rule bg-surface p-4">
              {kind === "VIDEO" ? <video src={w.url} controls preload="metadata" className="aspect-[3/4] w-full rounded bg-black object-cover" /> : <audio src={w.url} controls preload="none" className="w-full" />}
              <p className="mt-3 text-[15px] font-medium">{w.authorName}</p>
              {w.message && <p className="text-[14px] text-muted">{w.message}</p>}
              <div className="mt-3 flex gap-2">{w.moderation !== "APPROVED" && <Button size="sm" icon={<Check className="size-4" />} onClick={() => mod(w.id, "APPROVED")}>Approve</Button>}{w.moderation !== "REJECTED" && <Button size="sm" variant="quiet" icon={<EyeOff className="size-4" />} onClick={() => mod(w.id, "REJECTED")}>Hide</Button>}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One place for everything waiting: wishes, photos, video and voice. */
export function InboxBoard({ weddingId, features }: { weddingId: string; features: { messages: boolean; uploads: boolean; video: boolean; voice: boolean } }) {
  const [msgs, setMsgs] = useState<MessageRow[] | null>(null);
  const [ups, setUps] = useState<UploadRow[] | null>(null);
  const [vids, setVids] = useState<WishRow[]>([]);
  const [voices, setVoices] = useState<WishRow[]>([]);
  const [pending, start] = useTransition();
  const load = useCallback(async () => {
    const [m, u, v, a] = await Promise.all([features.messages ? listMessagesAction(weddingId, { moderation: "PENDING" }) : null, features.uploads ? listUploadsAction(weddingId, "PENDING") : null, features.video ? listMediaWishesAction(weddingId, "VIDEO", "PENDING") : null, features.voice ? listMediaWishesAction(weddingId, "VOICE", "PENDING") : null]);
    setMsgs(m?.ok ? m.data.filter((x) => x.kind !== "PRIVATE") : []);
    setUps(u?.ok ? (u.data as UploadRow[]) : []);
    setVids(v?.ok ? (v.data as WishRow[]) : []);
    setVoices(a?.ok ? (a.data as WishRow[]) : []);
  }, [weddingId, features]);
  useEffect(() => void load(), [load]);
  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>) => start(async () => { const r = await fn(); if (!r.ok) toast.error(r.error?.message ?? "That did not work."); await load(); });
  const total = (msgs?.length ?? 0) + (ups?.length ?? 0) + vids.length + voices.length;
  const all = useMemo(() => total, [total]);
  if (msgs === null) return <Skeleton className="h-64" />;
  if (all === 0) return <EmptyState mark="✓" title="Inbox zero" body="Nothing is waiting for approval. New wishes, photos and messages will appear here." />;
  const btns = (approve: () => Promise<{ ok: boolean }>, hide: () => Promise<{ ok: boolean }>) => (<div className="mt-3 flex gap-2"><Button size="sm" icon={<Check className="size-4" />} onClick={() => run(approve as never)}>Approve</Button><Button size="sm" variant="quiet" icon={<EyeOff className="size-4" />} onClick={() => run(hide as never)}>Hide</Button></div>);
  return (
    <ul className={cn("space-y-3", pending && "opacity-70")}>
      {msgs.map((m) => (<li key={m.id} className="rounded-lg border border-rule bg-surface p-5"><div className="flex items-center gap-2 text-[13px] text-muted"><Chip tone="neutral">Wish</Chip><span className="text-[15px] font-medium text-ink">{m.authorName}</span><span className="ml-auto">{ago(m.createdAt)}</span></div><p className="mt-2 whitespace-pre-line text-[15px]">{m.body}</p>{btns(() => moderateMessageAction(weddingId, m.id, "APPROVED"), () => moderateMessageAction(weddingId, m.id, "REJECTED"))}</li>))}
      {(ups ?? []).map((u) => (<li key={u.id} className="flex gap-4 rounded-lg border border-rule bg-surface p-4"><div className="size-24 shrink-0 overflow-hidden rounded bg-paper-2">{u.kind === "IMAGE" ? <img src={u.thumb} alt="" className="size-full object-cover" /> : <video src={u.url} className="size-full object-cover" muted />}</div><div><div className="flex items-center gap-2 text-[13px] text-muted"><Chip tone="neutral">Photo</Chip><span className="text-[15px] font-medium text-ink">{u.by}</span><span>{ago(u.createdAt)}</span></div>{btns(() => moderateUploadAction(weddingId, u.id, "APPROVED"), () => moderateUploadAction(weddingId, u.id, "REJECTED"))}</div></li>))}
      {vids.map((w) => (<li key={w.id} className="rounded-lg border border-rule bg-surface p-4"><div className="flex items-center gap-2 text-[13px] text-muted"><Chip tone="neutral">Video</Chip><span className="text-[15px] font-medium text-ink">{w.authorName}</span></div><video src={w.url} controls preload="metadata" className="mt-2 max-h-72 rounded bg-black" />{btns(() => moderateMediaWishAction(weddingId, w.id, "APPROVED"), () => moderateMediaWishAction(weddingId, w.id, "REJECTED"))}</li>))}
      {voices.map((w) => (<li key={w.id} className="rounded-lg border border-rule bg-surface p-4"><div className="flex items-center gap-2 text-[13px] text-muted"><Chip tone="neutral">Voice</Chip><span className="text-[15px] font-medium text-ink">{w.authorName}</span></div><audio src={w.url} controls preload="none" className="mt-2 w-full" />{btns(() => moderateMediaWishAction(weddingId, w.id, "APPROVED"), () => moderateMediaWishAction(weddingId, w.id, "REJECTED"))}</li>))}
    </ul>
  );
}
