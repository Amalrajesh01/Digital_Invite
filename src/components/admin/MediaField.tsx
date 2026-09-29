"use client";
import { useState } from "react";
import { ImagePlus, Music, Trash2, Video } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import { useDraft } from "./draft";
import type { MediaRow } from "@/app/actions/media";

/**
 * Pick (or upload) a photo, video or audio file for a field.
 * The document stores only the asset id; the library owns the file.
 */
export function MediaField({ label, value, onChange, category, kinds = ["IMAGE"], hint, className, aspect = "aspect-[4/3]", compact }: {
  label: string; value: string | undefined; onChange: (id: string | undefined) => void; category?: string; kinds?: ("IMAGE" | "VIDEO" | "AUDIO")[]; hint?: string; className?: string; aspect?: string; compact?: boolean;
}) {
  const { weddingId, media, refreshMedia, setMediaRows } = useDraft();
  const [open, setOpen] = useState(false);
  const row = value ? media[value] : undefined;
  const pick = (r: MediaRow) => {
    setMediaRows(Object.values({ ...media, [r.id]: r }));
    onChange(r.id);
    setOpen(false);
    void refreshMedia();
  };
  const Icon = kinds[0] === "AUDIO" ? Music : kinds[0] === "VIDEO" ? Video : ImagePlus;
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[13.5px] font-medium text-ink-2">{label}</p>
      <div className={cn("flex gap-3", compact ? "items-center" : "flex-col")}>
        <button type="button" onClick={() => setOpen(true)} aria-label={value ? `Change ${label}` : `Choose ${label}`} className={cn("group relative overflow-hidden rounded-md border border-dashed border-rule-strong bg-paper-2/60 transition-colors hover:border-accent focus-visible:border-accent", compact ? "size-20 shrink-0" : `w-full ${aspect}`)}>
          {row && row.kind === "IMAGE" ? (
            <img src={row.url.replace("/lg", "/md")} alt="" className="size-full object-cover" />
          ) : row ? (
            <span className="grid size-full place-items-center text-muted"><Icon className="size-7" /><span className="mt-1 block max-w-full truncate px-2 text-[11.5px]">{row.filename}</span></span>
          ) : (
            <span className="grid size-full place-items-center text-muted"><span className="flex flex-col items-center gap-1.5"><Icon className="size-6" /><span className="text-[13px] font-medium">Choose</span></span></span>
          )}
          {row && <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[12px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Change</span>}
        </button>
        {value && (
          <Button type="button" size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => onChange(undefined)} className="self-start text-bad">Remove</Button>
        )}
      </div>
      {hint && <p className="text-[13px] leading-snug text-muted">{hint}</p>}
      <Sheet open={open} onClose={() => setOpen(false)} title={`Choose ${label.toLowerCase()}`} description="Pick from your library or drop a new file to upload it." wide>
        <MediaLibrary weddingId={weddingId} mode="pick" kinds={kinds} defaultCategory={category} onPick={pick} />
      </Sheet>
    </div>
  );
}
