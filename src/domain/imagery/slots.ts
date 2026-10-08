import type { InvitationDoc } from "@/domain/doc/schema";
import type { MediaCategoryKey } from "@/domain/media/categories";

/**
 * Centralised image configuration.
 *
 * Every photograph the invitation shows belongs to a NAMED SLOT. Sections never reach into the document
 * for "the bride's picture" themselves — they ask for a slot, and this file decides which uploaded photo
 * fills it (with graceful fallbacks when a customer has not provided that one yet). So replacing a
 * photograph is always one change — pick another image for the slot — and no component is touched.
 *
 * Photographs are always the customer's own uploads from the Media library (resized to responsive WebP,
 * EXIF/GPS removed, lazy-loaded, with a blur placeholder). Nothing is hot-linked from a third-party site,
 * so an invitation can never show a broken remote image; if an upload is missing or fails to load, the
 * <Photo> component draws a tasteful themed placeholder instead of a grey box.
 */
export const IMAGE_SLOT_KEYS = ["couple", "coupleWide", "bride", "groom", "ceremony", "family", "story", "venue"] as const;
export type ImageSlot = (typeof IMAGE_SLOT_KEYS)[number];

export interface ImageSlotDef {
  label: string;
  /** Where the photograph appears. */
  usedFor: string;
  /** Recommended crop, so the customer knows what to upload. */
  ratio: string;
  /** Tailwind aspect class used by the editor's picker. */
  aspect: string;
  category: MediaCategoryKey;
  /** What the slot shows when the customer has not chosen a photograph for it. */
  fallback: string;
}

export const IMAGE_SLOTS: Record<ImageSlot, ImageSlotDef> = {
  couple: { label: "Couple photograph", usedFor: "Full-screen hero, “Our story”, thank-you page and WhatsApp preview", ratio: "Portrait 2:3, at least 1600 px tall — faces in the upper half", aspect: "aspect-[2/3]", category: "COUPLE", fallback: "the first gallery photo, then the bride’s or groom’s portrait" },
  coupleWide: { label: "Couple photograph — landscape", usedFor: "Full-screen hero on tablets and desktops (optional)", ratio: "Landscape 16:9 or 3:2, at least 2400 px wide", aspect: "aspect-[16/10]", category: "COUPLE", fallback: "the portrait couple photograph, cropped" },
  bride: { label: "Bride’s portrait", usedFor: "“Meet the couple”", ratio: "Portrait 4:5", aspect: "aspect-[4/5]", category: "BRIDE", fallback: "a themed placeholder" },
  groom: { label: "Groom’s portrait", usedFor: "“Meet the couple”", ratio: "Portrait 4:5", aspect: "aspect-[4/5]", category: "GROOM", fallback: "a themed placeholder" },
  ceremony: { label: "Wedding ceremony photograph", usedFor: "Ceremonies section", ratio: "Landscape 3:2", aspect: "aspect-[3/2]", category: "EVENT", fallback: "the main event’s photo, then the first gallery photo" },
  family: { label: "Family photograph", usedFor: "“With the blessings of our parents”", ratio: "Landscape 3:2", aspect: "aspect-[3/2]", category: "FAMILY", fallback: "typography only — the section simply has no photograph" },
  story: { label: "“Our story” photograph", usedFor: "Beside the opening lines of the story", ratio: "Portrait 4:5 or landscape 4:3", aspect: "aspect-[4/5]", category: "COUPLE", fallback: "‘How we met’ photo, then the couple photograph" },
  venue: { label: "Venue photograph", usedFor: "Venue & map, and the ceremony venue card", ratio: "Landscape 16:9", aspect: "aspect-[16/9]", category: "VENUE", fallback: "a themed placeholder" },
};

/** The slice of the invitation the resolver needs (kept small so it is trivial to test and to call anywhere). */
export interface SlotContext {
  doc: InvitationDoc;
  /** Albums in display order — only the first photograph of the first album is ever used as a fallback. */
  gallery?: { items: { id: string }[] }[];
}

const first = (...ids: (string | undefined | null)[]) => ids.find((x): x is string => !!x);

/** The photo currently chosen for a slot, falling back gracefully. Returns a media id or undefined. */
export function resolveSlot(ctx: SlotContext, slot: ImageSlot): string | undefined {
  const { doc } = ctx;
  const galleryFirst = ctx.gallery?.find((a) => a.items.length)?.items[0]?.id;
  const heroSection = doc.sections.find((s) => s.type === "hero");
  const heroOverride = (heroSection?.content as Record<string, string | undefined> | undefined)?.background;
  const main = doc.events.find((e) => e.isMain) ?? doc.events[0];
  const mainVenue = doc.venues.find((v) => v.id === main?.venueId) ?? doc.venues[0];

  switch (slot) {
    case "couple":
      return first(heroOverride, doc.images.couple, galleryFirst, doc.couple.bride.photo, doc.couple.groom.photo);
    case "coupleWide":
      return first(doc.images.coupleWide);
    case "bride":
      return first(doc.couple.bride.photo);
    case "groom":
      return first(doc.couple.groom.photo);
    case "ceremony":
      return first(doc.images.ceremony, main?.photo, doc.events.find((e) => e.photo)?.photo, galleryFirst);
    case "family":
      return first(doc.images.family);
    case "story":
      return first(doc.images.story, doc.story.introPhoto, doc.story.howWeMet.photo, doc.images.couple);
    case "venue":
      return first(mainVenue?.photo, doc.venues.find((v) => v.photo)?.photo);
  }
}

/** Writes the choice for a slot into the document (used by the editor's picker). */
export function assignSlot(doc: InvitationDoc, slot: ImageSlot, id: string | undefined): void {
  switch (slot) {
    case "couple": {
      doc.images.couple = id;
      // an older hero-only override would otherwise keep winning over the photo the customer just chose
      const hero = doc.sections.find((x) => x.type === "hero");
      if (hero && hero.content.background) hero.content = { ...hero.content, background: undefined };
      break;
    }
    case "coupleWide": doc.images.coupleWide = id; break;
    case "bride": doc.couple.bride.photo = id; break;
    case "groom": doc.couple.groom.photo = id; break;
    case "ceremony": doc.images.ceremony = id; break;
    case "family": doc.images.family = id; break;
    case "story": doc.images.story = id; break;
    case "venue": {
      const main = doc.events.find((e) => e.isMain) ?? doc.events[0];
      const v = doc.venues.find((x) => x.id === main?.venueId) ?? doc.venues[0];
      if (v) v.photo = id;
      break;
    }
  }
}

/** The value stored directly in the slot's own field (no fallbacks) — what the editor's picker shows as "chosen". */
export function ownSlotValue(doc: InvitationDoc, slot: ImageSlot): string | undefined {
  switch (slot) {
    case "couple": return doc.images.couple;
    case "coupleWide": return doc.images.coupleWide;
    case "bride": return doc.couple.bride.photo;
    case "groom": return doc.couple.groom.photo;
    case "ceremony": return doc.images.ceremony;
    case "family": return doc.images.family;
    case "story": return doc.images.story;
    case "venue": {
      const main = doc.events.find((e) => e.isMain) ?? doc.events[0];
      return (doc.venues.find((x) => x.id === main?.venueId) ?? doc.venues[0])?.photo;
    }
  }
}
