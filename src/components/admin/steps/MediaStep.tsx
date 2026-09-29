"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import { AlbumsPanel } from "@/components/media/AlbumsPanel";
import { FormCard, Hint } from "../forms";
import { MediaField } from "../MediaField";
import { useDraft } from "../draft";

export function MediaStep() {
  const { weddingId, doc, update, has } = useDraft();
  const [tab, setTab] = useState<"library" | "albums" | "key">("key");
  const hero = doc.sections.find((s) => s.type === "hero");
  const set = (type: string, key: string, id: string | undefined) => update((d) => { const s = d.sections.find((x) => x.type === type); if (s) s.content = { ...s.content, [key]: id }; });
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Media" className="inline-flex rounded-md border border-rule-strong bg-surface p-0.5 text-[13.5px]">
        {([["key", "Key photographs"], ["library", "Media library"], ["albums", "Gallery albums"]] as const).map(([k, l]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-[4px] px-3.5 py-1.5 font-medium", tab === k ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}>{l}</button>
        ))}
      </div>

      {tab === "key" && (
        <FormCard title="The photographs that matter most" description="Choose these first — they appear on the opening screen and hero. Everything else can be added later.">
          <div className="grid gap-6 md:grid-cols-3">
            <MediaField label="Hero photograph" value={hero?.content.background as string | undefined} category="COUPLE" onChange={(id) => set("hero", "background", id)} aspect="aspect-[3/4]" hint="A full-length or three-quarter photo of the couple. Vertical works best on phones." />
            <MediaField label="Bride’s portrait" value={doc.couple.bride.photo} category="BRIDE" onChange={(id) => update((d) => void (d.couple.bride.photo = id))} aspect="aspect-[3/4]" />
            <MediaField label="Groom’s portrait" value={doc.couple.groom.photo} category="GROOM" onChange={(id) => update((d) => void (d.couple.groom.photo = id))} aspect="aspect-[3/4]" />
          </div>
          <MediaField label="Social preview image (WhatsApp / Facebook)" value={doc.seo.ogImage} category="COUPLE" onChange={(id) => update((d) => void (d.seo.ogImage = id))} aspect="aspect-[1200/630]" hint="Shown when the link is shared. Landscape, with the couple near the centre. Leave empty to use the hero." />
          {hero && has("invitation") && (
            <MediaField label="Hero video (optional, Cinematic template)" kinds={["VIDEO"]} category="VIDEO" value={hero.content.video as string | undefined} onChange={(id) => set("hero", "video", id)} hint="A short, muted loop (10–20 seconds). Phones on data-saver or reduced motion see the photo instead." />
          )}
        </FormCard>
      )}

      {tab === "library" && (
        <FormCard title="Media library" description="Every photo, video and song for this wedding lives here. Drag to reorder, click to rename, crop, rotate or write a description.">
          <MediaLibrary weddingId={weddingId} />
        </FormCard>
      )}

      {tab === "albums" && (
        <FormCard title="Gallery albums" description="Group photographs into albums. Each album can be shown or hidden on the invitation.">
          <AlbumsPanel weddingId={weddingId} advanced={has("advanced_gallery")} />
        </FormCard>
      )}
      <Hint>Photos are resized automatically and location data is removed. Videos up to 200 MB and audio up to 30 MB are supported.</Hint>
    </div>
  );
}
