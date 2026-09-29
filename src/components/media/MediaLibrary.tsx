"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Cropper from "react-easy-crop";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Crop, ImagePlus, Music, RotateCcw, RotateCw, Search, Trash2, Upload, Video as VideoIcon, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { TextField, SelectField } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/Bits";
import { ModerationChip } from "@/components/ui/Chip";
import { useConfirm } from "@/components/ui/Confirm";
import { LText } from "@/components/admin/forms";
import { MEDIA_CATEGORIES } from "@/domain/media/categories";
import { deleteMediaAction, listMediaAction, moderateMediaAction, reorderMediaAction, rotateMediaAction, updateMediaAction, type MediaRow } from "@/app/actions/media";
import { audioDuration, cropToFile, uploadFile } from "./upload";

interface Job { id: string; name: string; pct: number; state: "up" | "done" | "fail"; error?: string }
type Kind = "IMAGE" | "VIDEO" | "AUDIO";

export interface MediaLibraryProps {
  weddingId: string;
  initial?: MediaRow[];
  mode?: "manage" | "pick";
  categories?: string[];
  defaultCategory?: string;
  kinds?: Kind[];
  onPick?: (row: MediaRow) => void;
  /** Pick several at once: clicking toggles selection and a bar offers "Add selected". */
  multiple?: boolean;
  onPickMany?: (rows: MediaRow[]) => void;
  pickLabel?: string;
  excludeGuest?: boolean;
  onChange?: (rows: MediaRow[]) => void;
  className?: string;
}

function Thumb({ row, className }: { row: MediaRow; className?: string }) {
  if (row.kind === "IMAGE") return <img src={row.url.replace("/lg", "/md")} srcSet={row.srcSet} sizes="240px" alt="" className={cn("size-full object-cover", className)} loading="lazy" style={row.blur ? { backgroundImage: `url(${row.blur})`, backgroundSize: "cover" } : undefined} />;
  const Icon = row.kind === "VIDEO" ? VideoIcon : Music;
  return <div className={cn("grid size-full place-items-center bg-paper-2 text-muted", className)}><Icon className="size-8" /></div>;
}

function SortableCard({ row, selected, onOpen, sortable, pick }: { row: MediaRow; selected: boolean; onOpen: () => void; sortable: boolean; pick: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id, disabled: !sortable });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("group relative", isDragging && "z-10 opacity-70")}>
      <button type="button" onClick={onOpen} {...(sortable ? { ...attributes, ...listeners } : {})} aria-label={`${pick ? "Choose" : "Open"} ${row.title || row.filename}`} className={cn("relative block aspect-square w-full overflow-hidden rounded-md border bg-paper-2 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-accent", selected ? "border-accent ring-2 ring-accent" : "border-rule hover:shadow-[var(--shadow-1)]")}>
        <Thumb row={row} />
        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 pb-1 pt-5 text-left text-[11.5px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{row.title || row.filename}</span>
        {row.moderation !== "APPROVED" && <span className="absolute left-1.5 top-1.5"><ModerationChip status={row.moderation} /></span>}
        {row.retention === "PERMANENT" && <span title="Kept forever" className="absolute right-1.5 top-1.5 rounded-full bg-brass px-1.5 py-0.5 text-[10px] font-semibold text-white">∞</span>}
      </button>
    </li>
  );
}

function CropDialog({ row, weddingId, onClose, onDone }: { row: MediaRow; weddingId: string; onClose: () => void; onDone: () => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(4 / 5);
  const [area, setArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const presets: [string, number | undefined][] = [["Portrait 4:5", 4 / 5], ["Square", 1], ["Tall 3:4", 3 / 4], ["Wide 16:9", 16 / 9], ["Classic 4:3", 4 / 3], ["Arch 3:4", 3 / 4]];
  const save = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const src = row.srcSet?.split(", ").pop()?.split(" ")[0] ?? row.url;
      const file = await cropToFile(src, area, rotation, row.filename);
      await uploadFile({ weddingId, file, category: row.category, replaceId: row.id });
      toast.success("Photo updated everywhere it is used");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not crop that photo.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} title="Crop & straighten" description="The cropped photo replaces this one everywhere it appears." wide
      footer={<><Button variant="quiet" onClick={onClose}>Cancel</Button><Button onClick={save} loading={busy}>Apply crop</Button></>}>
      <div className="relative h-[52vh] min-h-72 overflow-hidden rounded-md bg-ink">
        <Cropper image={row.srcSet?.split(", ").pop()?.split(" ")[0] ?? row.url} crop={crop} zoom={zoom} rotation={rotation} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} onCropComplete={(_, px) => setArea(px)} />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="text-[13.5px] font-medium text-ink-2">Zoom<input type="range" min={1} max={3} step={0.02} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label>
        <label className="text-[13.5px] font-medium text-ink-2">Straighten ({rotation}°)<input type="range" min={-45} max={45} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Crop shape">
        {presets.map(([l, a]) => (<button key={l} type="button" onClick={() => setAspect(a)} aria-pressed={aspect === a} className={cn("btn btn-sm", aspect === a ? "btn-primary" : "btn-quiet")}>{l}</button>))}
        <button type="button" onClick={() => setAspect(undefined)} aria-pressed={aspect === undefined} className={cn("btn btn-sm", aspect === undefined ? "btn-primary" : "btn-quiet")}>Free</button>
      </div>
    </Sheet>
  );
}

function Detail({ row, weddingId, onClose, onChanged, canModerate }: { row: MediaRow; weddingId: string; onClose: () => void; onChanged: () => void; canModerate: boolean }) {
  const ask = useConfirm();
  const [title, setTitle] = useState(row.title);
  const [alt, setAlt] = useState(row.alt);
  const [caption, setCaption] = useState(row.caption);
  const [category, setCategory] = useState(row.category);
  const [busy, start] = useTransition();
  const [crop, setCrop] = useState(false);
  const call = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, msg?: string, close = false) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (msg) toast.success(msg);
        onChanged();
        if (close) onClose();
      } else toast.error(r.error?.message ?? "That did not work.");
    });
  return (
    <>
      <Sheet open onClose={onClose} variant="drawer" title={row.title || row.filename} description={`${row.kind.toLowerCase()} · ${(row.sizeBytes / 1024 / 1024).toFixed(2)} MB${row.width ? ` · ${row.width}×${row.height}` : ""}`}
        footer={<><Button variant="danger" size="sm" icon={<Trash2 className="size-4" />} onClick={async () => { if (await ask({ title: "Delete this file?", message: "It will be removed from everywhere it is used. This cannot be undone.", confirmLabel: "Delete", tone: "danger" })) call(() => deleteMediaAction(weddingId, row.id), "Deleted", true); }}>Delete</Button><span className="flex-1" /><Button variant="quiet" onClick={onClose}>Close</Button><Button loading={busy} onClick={() => call(() => updateMediaAction(weddingId, row.id, { title, alt, caption, category }), "Saved")}>Save</Button></>}>
        <div className="space-y-5">
          <div className="overflow-hidden rounded-md border border-rule bg-paper-2">
            {row.kind === "IMAGE" ? <img src={row.url} alt="" className="max-h-80 w-full object-contain" /> : row.kind === "VIDEO" ? <video src={row.url} controls className="max-h-80 w-full" /> : <div className="p-6"><audio src={row.url} controls className="w-full" /></div>}
          </div>
          {row.kind === "IMAGE" && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="quiet" icon={<RotateCcw className="size-4" />} loading={busy} onClick={() => call(() => rotateMediaAction(weddingId, row.id, 270), "Rotated")}>Rotate left</Button>
              <Button size="sm" variant="quiet" icon={<RotateCw className="size-4" />} loading={busy} onClick={() => call(() => rotateMediaAction(weddingId, row.id, 90), "Rotated")}>Rotate right</Button>
              <Button size="sm" variant="quiet" icon={<Crop className="size-4" />} onClick={() => setCrop(true)}>Crop…</Button>
            </div>
          )}
          <TextField label="Name" value={title} onChange={(e) => setTitle(e.target.value)} hint="Only you see this. It helps you find the photo later." />
          <SelectField label="Belongs to" value={category} onChange={(e) => setCategory(e.target.value)}>{MEDIA_CATEGORIES.map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}</SelectField>
          {row.kind === "IMAGE" && <LText label="Photo description (for screen readers)" value={alt} onChange={setAlt} hint="Describe what is in the picture, e.g. “Meenakshi and Aravind on the jetty at sunset”." />}
          <LText label="Caption (shown in the gallery)" value={caption} onChange={setCaption} />
          {canModerate && row.source === "GUEST" && (
            <div className="flex items-center justify-between gap-3 rounded-md bg-paper-2 p-3">
              <span className="text-[14px]">Uploaded by a guest — <ModerationChip status={row.moderation} /></span>
              <span className="flex gap-2"><Button size="sm" variant="quiet" onClick={() => call(() => moderateMediaAction(weddingId, row.id, "APPROVED"), "Approved")} icon={<Check className="size-4" />}>Approve</Button><Button size="sm" variant="danger" onClick={() => call(() => moderateMediaAction(weddingId, row.id, "REJECTED"), "Hidden")} icon={<X className="size-4" />}>Hide</Button></span>
            </div>
          )}
        </div>
      </Sheet>
      {crop && <CropDialog row={row} weddingId={weddingId} onClose={() => setCrop(false)} onDone={() => { setCrop(false); onChanged(); }} />}
    </>
  );
}

export function MediaLibrary({ weddingId, initial, mode = "manage", categories, defaultCategory, kinds = ["IMAGE", "VIDEO", "AUDIO"], onPick, multiple, onPickMany, pickLabel = "Add selected", excludeGuest = true, onChange, className }: MediaLibraryProps) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [rows, setRows] = useState<MediaRow[] | null>(initial ?? null);
  const [cat, setCat] = useState<string>(defaultCategory ?? "");
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drag, setDrag] = useState(false);
  const [open, setOpen] = useState<MediaRow | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const cats = MEDIA_CATEGORIES.filter((c) => (!categories || categories.includes(c.key)) && !(excludeGuest && c.key === "GUEST_UPLOAD"));
  const uploadCat = cat || defaultCategory || cats[0]?.key || "GALLERY";

  const refresh = useCallback(async () => {
    const r = await listMediaAction(weddingId);
    if (r.ok) {
      setRows(r.data);
      onChange?.(r.data);
    } else toast.error(r.error.message);
  }, [weddingId, onChange]);

  useEffect(() => {
    if (!rows) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => (!excludeGuest || r.category !== "GUEST_UPLOAD") && kinds.includes(r.kind) && (!cat || r.category === cat) && (!categories || categories.includes(r.category)) && (!s || `${r.filename} ${r.title}`.toLowerCase().includes(s)));
  }, [rows, cat, q, kinds, categories, excludeGuest]);

  const accept = kinds.flatMap((k) => (k === "IMAGE" ? ["image/jpeg", "image/png", "image/webp"] : k === "VIDEO" ? ["video/mp4", "video/quicktime", "video/webm"] : ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/x-m4a"])).join(",");

  const doUpload = async (files: FileList | File[] | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 30);
    for (const file of arr) {
      const id = crypto.randomUUID();
      setJobs((j) => [{ id, name: file.name, pct: 0, state: "up" }, ...j]);
      try {
        const dur = file.type.startsWith("audio/") ? await audioDuration(file) : undefined;
        const res = await uploadFile({ weddingId, file, category: file.type.startsWith("audio/") ? "MUSIC" : file.type.startsWith("video/") ? "VIDEO" : uploadCat, durationSec: dur, onProgress: (pct) => setJobs((j) => j.map((x) => (x.id === id ? { ...x, pct } : x))) });
        setJobs((j) => j.map((x) => (x.id === id ? { ...x, state: "done", pct: 100 } : x)));
        if (mode === "pick" && arr.length === 1) {
          await refresh();
          const r = await listMediaAction(weddingId);
          const row = r.ok ? r.data.find((x) => x.id === res.id) : undefined;
          if (row) onPick?.(row);
          continue;
        }
      } catch (e) {
        setJobs((j) => j.map((x) => (x.id === id ? { ...x, state: "fail", error: e instanceof Error ? e.message : "Failed" } : x)));
      }
    }
    await refresh();
    setTimeout(() => setJobs((j) => j.filter((x) => x.state === "fail")), 4000);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id || !rows) return;
    const ids = list.map((r) => r.id);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    const map = new Map(rows.map((r) => [r.id, r]));
    const reordered = next.map((id, i) => ({ ...map.get(id)!, sortOrder: i }));
    setRows([...reordered, ...rows.filter((r) => !next.includes(r.id))]);
    const r = await reorderMediaAction(weddingId, next);
    if (!r.ok) toast.error(r.error.message);
  };

  const canReorder = mode === "manage" && !q;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button icon={<Upload className="size-4" />} onClick={() => input.current?.click()}>Upload {kinds.length === 1 && kinds[0] === "AUDIO" ? "music" : "files"}</Button>
        <input ref={input} type="file" multiple hidden accept={accept} onChange={(e) => { void doUpload(e.target.files); e.target.value = ""; }} />
        <label className="relative min-w-48 flex-1 sm:max-w-xs"><span className="sr-only">Search files</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><input className="field-input !pl-9" placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <p className="ml-auto text-[13px] text-muted">{list.length} file{list.length === 1 ? "" : "s"}</p>
      </div>
      {cats.length > 1 && (
        <div className="-mx-1 flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
          <button type="button" onClick={() => setCat("")} aria-pressed={!cat} className={cn("btn btn-sm", !cat ? "btn-primary" : "btn-quiet")}>All</button>
          {cats.map((c) => (<button key={c.key} type="button" onClick={() => setCat(c.key)} aria-pressed={cat === c.key} className={cn("btn btn-sm", cat === c.key ? "btn-primary" : "btn-quiet")}>{c.label}<span className="text-[11px] opacity-60">{(rows ?? []).filter((r) => r.category === c.key).length || ""}</span></button>))}
        </div>
      )}

      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void doUpload(e.dataTransfer.files); }} className={cn("min-h-40 rounded-lg border border-dashed p-3 transition-colors", drag ? "border-accent bg-accent-soft/40" : "border-rule-strong")}>
        {jobs.length > 0 && (
          <ul className="mb-3 space-y-1.5" aria-live="polite">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center gap-3 rounded bg-paper-2 px-3 py-2 text-[13.5px]">
                <span className="min-w-0 flex-1 truncate">{j.name}</span>
                {j.state === "up" && <span className="tnum text-muted">{j.pct}%</span>}
                {j.state === "done" && <span className="flex items-center gap-1 text-ok"><Check className="size-4" />Done</span>}
                {j.state === "fail" && <span className="text-bad">{j.error}</span>}
              </li>
            ))}
          </ul>
        )}
        {rows === null ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => (<Skeleton key={i} className="aspect-square" />))}</div>
        ) : list.length === 0 ? (
          <EmptyState mark="◈" title={rows.length ? "Nothing here matches" : "Drop photos here"} body={rows.length ? "Try another type or clear the search." : "Drag files onto this box, or press Upload. Photos, videos and music are all welcome."} action={<Button variant="quiet" icon={<ImagePlus className="size-4" />} onClick={() => input.current?.click()}>Choose files</Button>} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={list.map((r) => r.id)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {list.map((r) => (<SortableCard key={r.id} row={r} sortable={canReorder} pick={mode === "pick"} selected={open?.id === r.id || chosen.includes(r.id)} onOpen={() => (mode === "pick" ? (multiple ? setChosen((c) => (c.includes(r.id) ? c.filter((x) => x !== r.id) : [...c, r.id])) : onPick?.(r)) : setOpen(r))} />))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
      {mode === "pick" && multiple && (
        <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 rounded-md border border-rule-strong bg-surface px-4 py-3 shadow-[var(--shadow-2)]"><span className="text-[14px]">{chosen.length} selected</span><Button disabled={!chosen.length} onClick={() => { onPickMany?.((rows ?? []).filter((r) => chosen.includes(r.id))); setChosen([]); }}>{pickLabel}</Button></div>
      )}
      {canReorder && list.length > 1 && <p className="text-[12.5px] text-muted">Tip: drag photos to reorder them. Click a photo for name, description, crop and rotate.</p>}
      {open && mode === "manage" && <Detail row={open} weddingId={weddingId} canModerate onClose={() => setOpen(null)} onChanged={async () => { const r = await listMediaAction(weddingId); if (r.ok) { setRows(r.data); onChange?.(r.data); setOpen(r.data.find((x) => x.id === open.id) ?? null); } }} />}
    </div>
  );
}
