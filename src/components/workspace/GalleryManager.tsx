"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import { AlbumsPanel } from "@/components/media/AlbumsPanel";
import { ConfirmProvider } from "@/components/ui/Confirm";

export function GalleryManager({ weddingId, advanced, confirmProvided }: { weddingId: string; advanced: boolean; confirmProvided?: boolean }) {
  const [tab, setTab] = useState<"albums" | "library">("albums");
  const body = (
    <div>
      <div role="tablist" className="mb-6 inline-flex rounded-md border border-rule-strong bg-surface p-0.5 text-[13.5px]">
        {([["albums", "Albums on the invitation"], ["library", "All photos & files"]] as const).map(([k, l]) => (<button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-[4px] px-3.5 py-1.5 font-medium", tab === k ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}>{l}</button>))}
      </div>
      {tab === "albums" ? <AlbumsPanel weddingId={weddingId} advanced={advanced} /> : <MediaLibrary weddingId={weddingId} />}
    </div>
  );
  return confirmProvided ? body : <ConfirmProvider>{body}</ConfirmProvider>;
}
