import { EVENT_TYPE_INFO } from "@/domain/doc/event-types";
import type { InvitationDoc } from "@/domain/doc/schema";
import { fmtDate } from "@/invitation/engine/format";

/**
 * What a pasted link looks like in WhatsApp — the heading and the sub-heading — and the message that travels with it.
 * One function, used by the page's real metadata and by the editor's live preview, so the two cannot disagree.
 * What the person types wins; otherwise the heading and sub-heading are made from the names, the main event and its venue.
 * Browser-safe.
 */
export interface LinkPreview { title: string; description: string; message: string }

const pick = (t: Record<string, string | undefined>, locale: string) => t[locale] || t.en || "";

export function linkPreview(doc: InvitationDoc, weddingTitle: string, weddingDate: string | null, locale = "en"): LinkPreview {
  const seo = doc.seo;
  const couple = EVENT_TYPE_INFO[doc.eventType].subject === "couple";
  const main = doc.events.find((e) => e.isMain) ?? doc.events[0];
  const venue = doc.venues.find((v) => v.id === main?.venueId);
  const date = main?.date || weddingDate;
  const when = `${date ? ` on ${fmtDate(date, "en", "long")}` : ""}${venue ? ` at ${venue.name.en ?? ""}` : ""}`;
  return {
    title: pick(seo.title, locale) || `${weddingTitle} — ${couple ? "Wedding Invitation" : "Invitation"}`,
    description: pick(seo.description, locale) || (couple ? `Together with our families, we joyfully invite you to celebrate our wedding${when}.` : `You are invited to ${weddingTitle}${when}.`),
    message: (pick(seo.shareMessage, locale) || "You are invited to {title}").replaceAll("{title}", weddingTitle),
  };
}

/** The heading of a pasted *personal* link: it greets the guest by name, so the preview already feels like it was written for them. */
export const personalPreviewTitle = (first: string, weddingTitle: string, locale = "en"): string =>
  locale.toLowerCase().startsWith("ml") ? `${first}, നിങ്ങളെ ${weddingTitle}-ലേക്ക് ക്ഷണിക്കുന്നു` : `${first}, you are invited to ${weddingTitle}`;

/** The message only when the person wrote one (the guest page falls back to its own, translated, default). */
export const customShareMessage = (doc: InvitationDoc, weddingTitle: string, locale = "en"): string | null => {
  const m = pick(doc.seo.shareMessage, locale);
  return m ? m.replaceAll("{title}", weddingTitle) : null;
};
