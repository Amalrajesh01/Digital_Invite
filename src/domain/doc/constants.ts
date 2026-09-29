export const WEDDING_STATUSES = ["DRAFT", "PREVIEW", "PUBLISHED", "LIVE_EVENT", "POST_EVENT", "MEMORY", "ANNIVERSARY"] as const;
export type WeddingStatus = (typeof WEDDING_STATUSES)[number];

/** Statuses at which the public invitation is reachable. */
export const PUBLIC_STATUSES: readonly WeddingStatus[] = ["PUBLISHED", "LIVE_EVENT", "POST_EVENT", "MEMORY", "ANNIVERSARY"];

export const SECTION_TYPES = [
  "hero", "countdown", "couple", "story", "timeline", "family", "events", "venue", "travel",
  "gallery", "dresscode", "menu", "rsvp", "guestbook", "music", "quiz", "games", "scavenger",
  "photowall", "guestupload", "wishes", "qrpass", "checkin", "livesched", "liveupdate", "livestream",
  "timecapsule", "memory", "anniversary", "thankyou", "contact",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

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
  { code: "ml", label: "Malayalam", native: "മലയാളം", font: "Noto Serif Malayalam" },
  { code: "ta", label: "Tamil", native: "தமிழ்", font: "Noto Serif Tamil" },
  { code: "te", label: "Telugu", native: "తెలుగు", font: "Noto Serif Telugu" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", font: "Noto Serif Kannada" },
  { code: "hi", label: "Hindi", native: "हिन्दी", font: "Noto Serif Devanagari" },
  { code: "mr", label: "Marathi", native: "मराठी", font: "Noto Serif Devanagari" },
  { code: "bn", label: "Bengali", native: "বাংলা", font: "Noto Serif Bengali" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", font: "Noto Serif Gujarati" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", font: "Noto Serif Gurmukhi" },
  { code: "ur", label: "Urdu", native: "اردو", font: "Noto Nastaliq Urdu" },
] as const;
export type LocaleCode = (typeof LOCALES)[number]["code"];

export function localeInfo(code: string | null | undefined) {
  return LOCALES.find((l) => l.code === code) ?? null;
}
