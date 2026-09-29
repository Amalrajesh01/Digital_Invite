"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import type { ResolvedMedia } from "@/domain/media/service";
import { useInvitation } from "../engine/context";
import { Reveal } from "../engine/motion";
import { Shell, SectionHead, useCopy } from "./shared";

type Item = ResolvedMedia & { by?: string };

export function Lightbox({ items, index, onClose, onIndex }: { items: Item[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const { L, t } = useInvitation();
  const ref = useRef<HTMLDialogElement>(null);
  const startX = useRef<number | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (index != null && !d.open) d.showModal();
    if (index == null && d.open) d.close();
  }, [index]);
  useEffect(() => {
    if (index == null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [index, items.length, onIndex]);
  const item = index != null ? items[index] : null;
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={t("gallery.open")}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-black/95 p-0 text-white backdrop:bg-black"
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current == null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 60 && index != null) onIndex(dx < 0 ? (index + 1) % items.length : (index - 1 + items.length) % items.length);
      }}
    >
      {item && (
        <div className="relative flex h-full w-full flex-col items-center justify-center px-2 py-14 md:px-16">
          <img key={item.id} src={item.url} srcSet={item.srcSet} sizes="100vw" alt={L(item.alt)} className="max-h-full max-w-full select-none object-contain [animation:inv-rise_.5s_var(--ease)]" draggable={false} />
          {(L(item.caption) || item.by) && <p className="absolute inset-x-0 bottom-4 px-6 text-center text-[0.98rem] text-white/85">{L(item.caption)}{item.by ? ` — ${item.by}` : ""}</p>}
          <p className="absolute left-4 top-4 text-sm text-white/60 tabular-nums">{(index ?? 0) + 1} / {items.length}</p>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="size-5" /></button>
          {items.length > 1 && (
            <>
              <button type="button" onClick={() => onIndex(((index ?? 0) - 1 + items.length) % items.length)} aria-label={t("gallery.prev")} className="absolute left-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 md:grid"><ChevronLeft /></button>
              <button type="button" onClick={() => onIndex(((index ?? 0) + 1) % items.length)} aria-label={t("gallery.next")} className="absolute right-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 md:grid"><ChevronRight /></button>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}

function Thumb({ item, onOpen, className, sizes, style }: { item: Item; onOpen: () => void; className?: string; sizes: string; style?: React.CSSProperties }) {
  const { L, t } = useInvitation();
  const [loaded, setLoaded] = useState(false);
  return (
    <button type="button" onClick={onOpen} aria-label={`${t("gallery.open")}${L(item.alt) ? `: ${L(item.alt)}` : ""}`} className={cn("group relative block w-full overflow-hidden", className)} style={{ ...(item.blur ? { backgroundImage: `url(${item.blur})`, backgroundSize: "cover" } : { background: "var(--c-border)" }), borderRadius: "var(--r)", ...style }}>
      <img src={item.url} srcSet={item.srcSet} sizes={sizes} alt={L(item.alt)} width={item.width} height={item.height} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} className={cn("h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]", loaded ? "opacity-100" : "opacity-0")} />
      {L(item.caption) && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-8 text-left text-[0.82rem] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{L(item.caption)}</span>}
    </button>
  );
}

export default function GallerySection({ section }: { section: SectionConfig }) {
  const { view, L, t, has } = useInvitation();
  const copy = useCopy(section, { title: "gallery.title" });
  const advanced = has("advanced_gallery");
  const albums = useMemo(() => view.gallery.filter((a) => advanced || a.kind === "OFFICIAL" || a.kind === "EVENT"), [view.gallery, advanced]);
  const [albumId, setAlbumId] = useState<string>("all");
  const [open, setOpen] = useState<number | null>(null);
  if (!albums.length) return null;
  const shown: Item[] = albumId === "all" ? albums.flatMap((a) => a.items) : albums.find((a) => a.id === albumId)?.items ?? [];
  const variant = section.variant;
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-8" />
      {albums.length > 1 && (
        <div className="inv-tabs mb-10" role="tablist" aria-label={t("gallery.title")}>
          <button role="tab" aria-selected={albumId === "all"} className="inv-tab" onClick={() => setAlbumId("all")}>{t("gallery.all")}</button>
          {albums.map((a) => (<button key={a.id} role="tab" aria-selected={albumId === a.id} className="inv-tab" onClick={() => setAlbumId(a.id)}>{L(a.title) || t("gallery.title")}</button>))}
        </div>
      )}

      {variant === "editorial" ? (
        <div className="grid auto-rows-[9rem] grid-cols-2 gap-3 md:auto-rows-[13rem] md:grid-cols-6 md:gap-4">
          {shown.map((it, i) => {
            const span = ["md:col-span-3 md:row-span-2 row-span-2", "md:col-span-3", "md:col-span-2", "md:col-span-2", "md:col-span-2 row-span-2", "md:col-span-4"][i % 6];
            return (<Reveal key={it.id} delay={(i % 3) * 70} className={cn("min-h-0", span)}><Thumb item={it} onOpen={() => setOpen(i)} className="h-full" sizes="(max-width: 768px) 50vw, 40vw" /></Reveal>);
          })}
        </div>
      ) : variant === "carousel" ? (
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0" tabIndex={0} aria-label={t("gallery.title")}>
          {shown.map((it, i) => (<div key={it.id} className="w-[82vw] shrink-0 snap-center md:w-[34rem]"><Thumb item={it} onOpen={() => setOpen(i)} className="aspect-[4/5] md:aspect-[4/3]" sizes="(max-width: 768px) 82vw, 544px" /></div>))}
        </div>
      ) : (
        <div className="columns-2 gap-3 md:columns-3 md:gap-4 [&>*]:mb-3 md:[&>*]:mb-4">
          {shown.map((it, i) => (
            <Reveal key={it.id} delay={(i % 3) * 60} className="break-inside-avoid">
              <Thumb item={it} onOpen={() => setOpen(i)} sizes="(max-width: 768px) 50vw, 33vw" style={{ aspectRatio: it.width && it.height ? `${it.width} / ${it.height}` : "4 / 5" }} />
            </Reveal>
          ))}
        </div>
      )}
      <Lightbox items={shown} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </Shell>
  );
}
