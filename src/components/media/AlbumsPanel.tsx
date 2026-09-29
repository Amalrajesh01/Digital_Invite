"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Switch, SelectField } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Bits";
import { useConfirm } from "@/components/ui/Confirm";
import { LText } from "@/components/admin/forms";
import type { LocalizedText } from "@/domain/doc/schema";
import { MediaLibrary } from "./MediaLibrary";
import { addToAlbumAction, captionItemAction, deleteAlbumAction, listAlbumsAction, listMediaAction, removeFromAlbumAction, reorderAlbumAction, saveAlbumAction, type MediaRow } from "@/app/actions/media";

type Album = { id: string; title: LocalizedText; kind: string; isPublic: boolean; coverAssetId: string | null; items: { id: string; assetId: string; caption: LocalizedText; sortOrder: number }[] };

const KINDS = [["OFFICIAL", "Official gallery"], ["EVENT", "Event photos"], ["GUEST", "Guest photos"], ["LIVE", "Live gallery"], ["MEMORY", "Memory gallery"]] as const;

export function AlbumsPanel({ weddingId, advanced }: { weddingId: string; advanced: boolean }) {
  const ask = useConfirm();
  const [albums, setAlbums] = useState<Album[] | null>(null);
  const [rows, setRows] = useState<Record<string, MediaRow>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();
  const [draftTitle, setDraftTitle] = useState<LocalizedText>({});
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [a, m] = await Promise.all([listAlbumsAction(weddingId), listMediaAction(weddingId)]);
    if (a.ok) {
      setAlbums(a.data as unknown as Album[]);
      setSel((s) => s ?? a.data[0]?.id ?? null);
    } else toast.error(a.error.message);
    if (m.ok) setRows(Object.fromEntries(m.data.map((r) => [r.id, r])));
  }, [weddingId]);
  useEffect(() => void load(), [load]);

  const album = albums?.find((a) => a.id === sel) ?? null;
  const call = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, msg?: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (msg) toast.success(msg);
        await load();
      } else toast.error(r.error?.message ?? "That did not work.");
    });

  const move = (i: number, d: -1 | 1) => {
    if (!album) return;
    const ids = [...album.items].sort((a, b) => a.sortOrder - b.sortOrder).map((x) => x.assetId);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    call(() => reorderAlbumAction(weddingId, album.id, ids));
  };

  if (!albums) return <p className="py-8 text-muted">Loading albums…</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <aside>
        <ul className="space-y-1">
          {albums.map((a) => (
            <li key={a.id}><button type="button" onClick={() => setSel(a.id)} aria-current={sel === a.id} className={cn("flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-[14.5px] transition-colors", sel === a.id ? "bg-surface font-medium shadow-[var(--shadow-1)]" : "hover:bg-paper-2")}><span className="truncate">{a.title.en || "Untitled album"}</span><span className="tnum text-[12.5px] text-muted">{a.items.length}</span></button></li>
          ))}
        </ul>
        <Button variant="quiet" size="sm" className="mt-3 w-full" icon={<Plus className="size-4" />} onClick={() => { setDraftTitle({}); setCreating(true); }}>New album</Button>
      </aside>

      <div>
        {!album ? (
          <EmptyState mark="❦" title="Create your first album" body="Albums group photographs on the invitation — for example ‘Pre-wedding’, ‘Haldi’ or ‘The families’." />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <LText label="Album title" value={album.title} onChange={(v) => setAlbums((s) => s!.map((x) => (x.id === album.id ? { ...x, title: v } : x)))} />
              <div className="space-y-3">
                <SelectField label="Type" value={album.kind} onChange={(e) => call(() => saveAlbumAction(weddingId, { id: album.id, title: album.title, kind: e.target.value as never }))} hint={!advanced ? "Guest, live and memory galleries are Luxury features." : undefined}>
                  {KINDS.map(([k, l]) => (<option key={k} value={k} disabled={!advanced && !["OFFICIAL", "EVENT"].includes(k)}>{l}</option>))}
                </SelectField>
                <Switch label="Show on the invitation" checked={album.isPublic} onChange={(v) => call(() => saveAlbumAction(weddingId, { id: album.id, title: album.title, isPublic: v }))} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" loading={pending} onClick={() => call(() => saveAlbumAction(weddingId, { id: album.id, title: album.title }), "Saved")}>Save title</Button>
              <Button size="sm" variant="quiet" icon={<ImagePlus className="size-4" />} onClick={() => setAdding(true)}>Add photos from library</Button>
              <Button size="sm" variant="danger" onClick={async () => { if (await ask({ title: "Delete this album?", message: "The photos stay in your library — only the album is removed.", confirmLabel: "Delete album", tone: "danger" })) { call(() => deleteAlbumAction(weddingId, album.id), "Album deleted"); setSel(null); } }}>Delete album</Button>
            </div>

            {album.items.length === 0 ? (
              <p className="rounded-md border border-dashed border-rule-strong px-4 py-8 text-center text-muted">This album is empty. Add photos from your library.</p>
            ) : (
              <ul className="divide-y divide-rule rounded-md border border-rule bg-surface">
                {[...album.items].sort((a, b) => a.sortOrder - b.sortOrder).map((it, i) => {
                  const r = rows[it.assetId];
                  return (
                    <li key={it.id} className="flex items-start gap-4 p-3">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded bg-paper-2">{r && <img src={r.url.replace("/lg", "/sm")} alt="" className="size-full object-cover" />}{album.coverAssetId === it.assetId && <span className="absolute left-1 top-1 rounded bg-brass px-1 text-[10px] font-semibold text-white">Cover</span>}</div>
                      <div className="min-w-0 flex-1"><LText label="Caption" value={it.caption} onChange={(v) => setAlbums((s) => s!.map((x) => (x.id === album.id ? { ...x, items: x.items.map((y) => (y.id === it.id ? { ...y, caption: v } : y)) } : x)))} /><Button size="sm" variant="ghost" className="mt-1" onClick={() => call(() => captionItemAction(weddingId, album.id, it.assetId, it.caption), "Caption saved")}>Save caption</Button></div>
                      <div className="flex flex-col gap-1">
                        <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="size-4" /></button>
                        <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={() => move(i, 1)} disabled={i === album.items.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></button>
                        <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={() => call(() => saveAlbumAction(weddingId, { id: album.id, title: album.title, coverAssetId: it.assetId }), "Cover set")} aria-label="Use as cover"><Star className="size-4" /></button>
                        <button type="button" className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => call(() => removeFromAlbumAction(weddingId, album.id, it.assetId))} aria-label="Remove from album"><Trash2 className="size-4" /></button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add photos to the album" wide>
        <MediaLibrary weddingId={weddingId} mode="pick" multiple kinds={["IMAGE"]} pickLabel="Add to album" onPickMany={(picked) => { setAdding(false); if (album) call(() => addToAlbumAction(weddingId, album.id, picked.map((p) => p.id)), `${picked.length} added`); }} />
      </Sheet>
      <Sheet open={creating} onClose={() => setCreating(false)} title="New album" footer={<><Button variant="quiet" onClick={() => setCreating(false)}>Cancel</Button><Button loading={pending} disabled={!draftTitle.en?.trim()} onClick={() => start(async () => { const r = await saveAlbumAction(weddingId, { title: draftTitle }); if (r.ok) { setCreating(false); setSel(r.data); await load(); } else toast.error(r.error.message); })}>Create album</Button></>}>
        <LText label="Album title" value={draftTitle} onChange={setDraftTitle} placeholder="Pre-wedding stories" />
      </Sheet>
    </div>
  );
}
