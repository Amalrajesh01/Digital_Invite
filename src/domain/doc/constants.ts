export const WEDDING_STATUSES = ["DRAFT", "PREVIEW", "PUBLISHED", "LIVE_EVENT", "POST_EVENT", "MEMORY", "ANNIVERSARY"] as const;
export type WeddingStatus = (typeof WEDDING_STATUSES)[number];

/** Statuses at which the public invitation is reachable. */
export const PUBLIC_STATUSES: readonly WeddingStatus[] = ["PUBLISHED", "LIVE_EVENT", "POST_EVENT", "MEMORY", "ANNIVERSARY"];

export const SECTION_TYPES = [
  "hero", "countdown", "couple", "story", "timeline", "family", "events", "ceremonies", "venue", "travel",
  "gallery", "film", "dresscode", "menu", "rsvp", "guestbook", "music", "quiz", "games", "scavenger",
  "photowall", "guestupload", "wishes", "qrpass", "checkin", "livesched", "liveupdate", "livestream",
  "timecapsule", "memory", "anniversary", "thankyou", "contact",
  // personal touches for guests with their own link (Luxury): injected after the hero, see visibleSections
  "foryou", "groupmessage",
  // for occasions that are not about a couple
  "about", "tribute", "speakers", "agenda", "sponsors", "message", "people", "prayer", "finale",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

/** How an invitation opens. Each is a different little scene, so two designs never begin the same way. */
export const OPENINGS = ["none", "envelope", "seal", "cinematic", "swipe", "curtain", "lamp", "doors", "balloons", "ticket", "bloom", "spotlight", "marquee", "monogram", "constellation", "storybook", "leader", "cover", "ink", "tide", "panels", "sunrise", "titlecard"] as const;
export type OpeningVariant = (typeof OPENINGS)[number];
export const OPENING_LABELS: Record<OpeningVariant, string> = {
  none: "No opening", envelope: "Wax-sealed envelope", seal: "Wax seal", cinematic: "Film title sequence", swipe: "Swipe up",
  curtain: "Curtains part", lamp: "Light the lamp", doors: "Doors open", balloons: "Pop the balloons", ticket: "Tear the ticket", bloom: "A flower blooms",
  spotlight: "A spotlight finds the names", marquee: "Premiere marquee", monogram: "Monogram drawn in light", constellation: "Connect the stars", storybook: "Open the storybook", leader: "Film leader countdown",
  cover: "Magazine cover", ink: "Ink and wash", tide: "The tide rolls in", panels: "Architectural panels", sunrise: "The sun rises", titlecard: "Title card",
};

export const DEFAULT_GROUPS = [
  { key: "bride-family", name: "Bride's family", kind: "BRIDE_FAMILY" },
  { key: "groom-family", name: "Groom's family", kind: "GROOM_FAMILY" },
  { key: "friends", name: "Friends", kind: "FRIENDS" },
  { key: "office", name: "Office", kind: "OFFICE" },
  { key: "relatives", name: "Relatives", kind: "RELATIVES" },
  { key: "vip", name: "VIP", kind: "VIP" },
  { key: "other", name: "Other", kind: "OTHER" },
] as const;

export const MODERATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const RSVP_STATUSES = ["YES", "NO", "MAYBE"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

/** Languages Super Admin can offer as the secondary (local) language. */
export const LOCALES = [
  { code: "ml", label: "Malayalam", native: "മലയാളം", font: "Noto Sans Malayalam" },
  { code: "ta", label: "Tamil", native: "தமிழ்", font: "Noto Sans Tamil" },
  { code: "te", label: "Telugu", native: "తెలుగు", font: "Noto Sans Telugu" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", font: "Noto Sans Kannada" },
  { code: "hi", label: "Hindi", native: "हिन्दी", font: "Noto Sans Devanagari" },
  { code: "mr", label: "Marathi", native: "मराठी", font: "Noto Sans Devanagari" },
  { code: "bn", label: "Bengali", native: "বাংলা", font: "Noto Sans Bengali" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", font: "Noto Sans Gujarati" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", font: "Noto Sans Gurmukhi" },
  { code: "ur", label: "Urdu", native: "اردو", font: "Noto Nastaliq Urdu" },
] as const;
export type LocaleCode = (typeof LOCALES)[number]["code"];

export function localeInfo(code: string | null | undefined) {
  return LOCALES.find((l) => l.code === code) ?? null;
}
