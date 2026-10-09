export type MediaCategoryKey = "BRIDE" | "GROOM" | "COUPLE" | "FAMILY" | "GALLERY" | "EVENT" | "VENUE" | "VIDEO" | "MUSIC" | "GUEST_UPLOAD" | "MEMORY" | "PEOPLE" | "OTHER";

export const MEDIA_CATEGORIES: { key: MediaCategoryKey; label: string }[] = [
  { key: "BRIDE", label: "Bride" },
  { key: "GROOM", label: "Groom" },
  { key: "COUPLE", label: "Couple" },
  { key: "FAMILY", label: "Family" },
  { key: "GALLERY", label: "Gallery" },
  { key: "EVENT", label: "Events" },
  { key: "VENUE", label: "Venue" },
  { key: "VIDEO", label: "Videos" },
  { key: "MUSIC", label: "Music" },
  { key: "GUEST_UPLOAD", label: "Guest uploads" },
  { key: "MEMORY", label: "Memories" },
  { key: "PEOPLE", label: "People & speakers" },
  { key: "OTHER", label: "Other" },
];
