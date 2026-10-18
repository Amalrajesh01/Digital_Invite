"use client";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormCard, LText } from "@/components/admin/forms";
import { MediaField } from "@/components/admin/MediaField";
import { useDraft } from "@/components/admin/draft";
import { linkPreview } from "@/domain/wedding/link-preview";

/**
 * How the invitation's link looks when it is pasted into WhatsApp, and the message that goes with it — with a live
 * preview that follows every keystroke. (The phone preview cannot show this: it is the chat app that draws it.)
 */
export function LinkPreviewPanel() {
  const { doc, update, settings, media } = useDraft();
  const p = linkPreview(doc, settings.title || "our celebration", settings.weddingDate, settings.defaultLocale);
  const own = doc.seo.ogImage ?? doc.images.couple;
  const image = own ? Object.values(media).find((m) => m.id === own)?.url : undefined;
  const host = typeof window === "undefined" ? "" : window.location.host;
  const unset = !doc.seo.title.en && !doc.seo.description.en && !doc.seo.shareMessage.en && !doc.seo.ogImage;
  const reset = () => update((d) => { d.seo.title = {}; d.seo.description = {}; d.seo.shareMessage = {}; d.seo.ogImage = undefined; });

  return (
    <div className="space-y-6">
      {/* sticky, so the preview stays in view while the fields below are edited */}
      <div className="sticky -top-4 z-10 -mx-4 -mt-4 border-b border-rule bg-paper px-4 pb-4 pt-4">
        <p className="eyebrow mb-2">Live preview</p>
        <div className="rounded-xl p-3" style={{ background: "#efeae2" }} aria-label="Preview of the link in WhatsApp">
          <div className="ml-auto max-w-[22rem] rounded-lg p-1.5 shadow-sm" style={{ background: "#d9fdd3" }}>
            <div className="flex overflow-hidden rounded-md" style={{ background: "#c5ecbf" }}>
              <div className="grid size-24 shrink-0 place-items-center bg-white">
                {image ? <img src={image} alt="" className="size-full object-cover" /> : <img src="/brand/mark.png" alt="" className="size-14 object-contain" />}
              </div>
              <div className="min-w-0 px-3 py-2" style={{ color: "#111b21" }}>
                <p className="line-clamp-2 text-[14px] font-semibold leading-snug">{p.title}</p>
                <p className="mt-0.5 line-clamp-3 text-[12.5px] leading-snug" style={{ color: "#54656f" }}>{p.description}</p>
                <p className="mt-1 truncate text-[12px]" style={{ color: "#667781" }}>{host}</p>
              </div>
            </div>
            <p className="whitespace-pre-line break-words px-1.5 pb-0.5 pt-1.5 text-[14px]" style={{ color: "#111b21" }}>{p.message}{"\n"}<span style={{ color: "#027eb5" }} className="underline">{host}/invite/{settings.slug}</span></p>
            <p className="px-1.5 text-right text-[11px]" style={{ color: "#667781" }}>3:33 pm ✓✓</p>
          </div>
        </div>
        {!image && <p className="mt-2 text-[12.5px] text-muted">No picture yet, so WhatsApp shows the app icon. Add one below, or put a couple photograph in the Hero.</p>}
      </div>

      <FormCard title="What guests see in the chat" description="Each part is separate. Leave one empty and it is written for you from the names, the date and the venue.">
        <LText label="Main heading" value={doc.seo.title} onChange={(v) => update((d) => void (d.seo.title = v))} placeholder={p.title} hint="The bold line next to the picture." />
        <LText label="Sub heading" multiline value={doc.seo.description} onChange={(v) => update((d) => void (d.seo.description = v))} placeholder={p.description} hint="The grey lines under it." />
        <LText label="Message with the link" multiline value={doc.seo.shareMessage} onChange={(v) => update((d) => void (d.seo.shareMessage = v))} placeholder="You are invited to {title}" hint="What a guest sends along with the link when they share the invitation. Type {title} to put the invitation’s name in." />
        <MediaField label="Picture (icon)" value={doc.seo.ogImage} category="COUPLE" onChange={(id) => update((d) => void (d.seo.ogImage = id))} aspect="aspect-[1200/630]" hint="1200 × 630 pixels works best. Without one, the couple photograph from the Hero is used." />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-muted">WhatsApp remembers a link’s preview. A link that was already shared may keep the old one for a while.</p>
          <Button size="sm" variant="quiet" icon={<RotateCcw className="size-4" />} disabled={unset} onClick={reset}>Back to automatic</Button>
        </div>
      </FormCard>
    </div>
  );
}
