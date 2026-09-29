import { z } from "zod";
import { SECTION_TYPES, WEDDING_STATUSES } from "./constants";

/**
 * The Invitation Document — everything an invitation *says*, independent of who is looking at it.
 * It is edited as a draft, snapshotted on publish (`published_versions`) and rendered by the section engine.
 *
 * Every guest-visible string is a `LocalizedText`: `{ en: "…", ml: "…" }`.
 * Media is referenced by asset id and resolved to URLs at render time.
 */

// ── primitives ─────────────────────────────────────────────────────────────
export const LocalizedText = z.record(z.string(), z.string());
export type LocalizedText = z.infer<typeof LocalizedText>;

const L = () => LocalizedText.default({});
const MediaId = z.string().optional();
const ObjDefault = <T extends z.ZodRawShape>(shape: T) => z.object(shape).prefault({} as never);

const HexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
const Time = z.string().regex(/^\d{2}:\d{2}$/).or(z.literal(""));
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal(""));

// ── couple ─────────────────────────────────────────────────────────────────
export const Person = z.object({
  name: L(), // short display name (first name)
  fullName: L(),
  parents: L(), // "Son of Mr. Rajan & Mrs. Latha Nair"
  bio: L(),
  photo: MediaId,
});
export type Person = z.infer<typeof Person>;

export const CoupleDoc = ObjDefault({
  bride: Person.prefault({}),
  groom: Person.prefault({}),
  order: z.enum(["bride-first", "groom-first"]).default("bride-first"),
  tagline: L(),
  invitation: L(), // the formal invitation line ("Together with their families …")
  quote: ObjDefault({ text: L(), author: L() }),
  hashtag: z.string().default(""),
  monogram: z.string().max(4).default(""),
});
export type CoupleDoc = z.infer<typeof CoupleDoc>;

// ── family ─────────────────────────────────────────────────────────────────
export const FamilyMember = z.object({
  id: z.string(),
  side: z.enum(["bride", "groom"]),
  name: L(),
  relation: L(), // "Father of the bride", "Elder sister"
  blurb: L(),
  photo: MediaId,
  parentId: z.string().optional(), // enables the interactive family tree
  spouseOf: z.string().optional(),
});
export type FamilyMember = z.infer<typeof FamilyMember>;

export const PartyMember = z.object({
  id: z.string(),
  side: z.enum(["bride", "groom"]),
  name: L(),
  role: L(), // "Maid of honour", "Best man"
  note: L(),
  photo: MediaId,
});
export type PartyMember = z.infer<typeof PartyMember>;

export const FamilyDoc = ObjDefault({
  members: z.array(FamilyMember).default([]),
  party: z.array(PartyMember).default([]),
  brideFamilyName: L(),
  groomFamilyName: L(),
});
export type FamilyDoc = z.infer<typeof FamilyDoc>;

// ── story ──────────────────────────────────────────────────────────────────
export const StoryChapter = z.object({
  id: z.string(),
  when: L(), // "Summer 2019"
  title: L(),
  body: L(),
  photo: MediaId,
});
export type StoryChapter = z.infer<typeof StoryChapter>;

export const StoryDoc = ObjDefault({
  chapters: z.array(StoryChapter).default([]),
  howWeMet: ObjDefault({ title: L(), body: L(), photo: MediaId }),
  thenNow: z
    .array(z.object({ id: z.string(), label: L(), then: MediaId, now: MediaId }))
    .default([]),
  memoryCards: z
    .array(z.object({ id: z.string(), title: L(), body: L(), photo: MediaId }))
    .default([]),
  personality: ObjDefault({
    bride: z.array(z.object({ id: z.string(), label: L(), value: L() })).default([]),
    groom: z.array(z.object({ id: z.string(), label: L(), value: L() })).default([]),
  }),
  voiceStory: ObjDefault({ audio: MediaId, transcript: L() }),
});
export type StoryDoc = z.infer<typeof StoryDoc>;

// ── venues & events ────────────────────────────────────────────────────────
export const Hotel = z.object({
  id: z.string(),
  name: L(),
  area: L(),
  distanceKm: z.number().nonnegative().optional(),
  priceHint: z.string().default(""),
  phone: z.string().default(""),
  url: z.string().default(""),
  note: L(),
  photo: MediaId,
});
export type Hotel = z.infer<typeof Hotel>;

export const Venue = z.object({
  id: z.string(),
  name: L(),
  address: L(),
  city: L(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  mapUrl: z.string().default(""),
  photo: MediaId,
  parking: ObjDefault({ info: L(), mapUrl: z.string().default("") }),
  directions: ObjDefault({ airport: L(), railway: L(), road: L() }),
  landmarkMap: ObjDefault({
    image: MediaId,
    pins: z
      .array(z.object({ id: z.string(), label: L(), x: z.number().min(0).max(100), y: z.number().min(0).max(100) }))
      .default([]),
  }),
  hotels: z.array(Hotel).default([]),
  nearby: z
    .array(z.object({ id: z.string(), name: L(), kind: z.string().default(""), note: L(), mapUrl: z.string().default(""), photo: MediaId }))
    .default([]),
  shuttle: ObjDefault({
    info: L(),
    schedule: z.array(z.object({ id: z.string(), time: z.string().default(""), from: L(), to: L() })).default([]),
  }),
  guide: z.array(z.object({ id: z.string(), title: L(), body: L() })).default([]),
});
export type Venue = z.infer<typeof Venue>;

export const EventVisibility = z.object({
  mode: z.enum(["EVERYONE", "GROUPS"]).default("EVERYONE"),
  /** guest_groups.key values. Enforced on the server before the document reaches the browser. */
  groups: z.array(z.string()).default([]),
});
export type EventVisibility = z.infer<typeof EventVisibility>;

export const WeddingEvent = z.object({
  id: z.string(),
  name: L(),
  date: IsoDate,
  startTime: Time.default(""),
  endTime: Time.default(""),
  venueId: z.string().optional(),
  description: L(),
  dressCode: L(),
  dressColors: z.array(HexColor).default([]),
  notes: L(),
  photo: MediaId,
  mapUrl: z.string().default(""),
  visibility: EventVisibility.prefault({}),
  ritual: ObjDefault({ title: L(), body: L() }),
  isMain: z.boolean().default(false), // the ceremony / muhurtham the countdown targets
  order: z.number().int().default(0),
});
export type WeddingEvent = z.infer<typeof WeddingEvent>;

// ── details ────────────────────────────────────────────────────────────────
export const MenuDoc = ObjDefault({
  courses: z
    .array(
      z.object({
        id: z.string(),
        title: L(),
        items: z.array(z.object({ id: z.string(), name: L(), note: L(), veg: z.boolean().default(true) })).default([]),
      }),
    )
    .default([]),
  note: L(),
});
export type MenuDoc = z.infer<typeof MenuDoc>;

export const PaletteDoc = ObjDefault({
  colors: z.array(z.object({ id: z.string(), hex: HexColor, name: L() })).default([]),
  note: L(),
});

export const DressGuideDoc = ObjDefault({
  looks: z
    .array(
      z.object({
        id: z.string(),
        title: L(),
        forWhom: z.enum(["women", "men", "everyone"]).default("everyone"),
        description: L(),
        colors: z.array(HexColor).default([]),
        photo: MediaId,
      }),
    )
    .default([]),
  avoid: L(),
});

export const RsvpDoc = ObjDefault({
  deadline: IsoDate.default(""),
  askMeal: z.boolean().default(true),
  mealOptions: z.array(z.object({ id: z.string(), label: L() })).default([]),
  askAccommodation: z.boolean().default(true),
  askTransport: z.boolean().default(true),
  pickupLocations: z.array(z.object({ id: z.string(), label: L() })).default([]),
  allowCompanions: z.boolean().default(true),
  askEventResponses: z.boolean().default(false),
  thankYou: L(),
  whatsappNumber: z.string().default(""),
});
export type RsvpDoc = z.infer<typeof RsvpDoc>;

export const ContactDoc = z.array(z.object({ id: z.string(), name: L(), role: L(), phone: z.string().default("") })).default([]);

// ── games ──────────────────────────────────────────────────────────────────
export const GamesDoc = ObjDefault({
  trivia: ObjDefault({
    title: L(),
    questions: z
      .array(z.object({ id: z.string(), q: L(), options: z.array(LocalizedText).default([]), answer: z.number().int().default(0) }))
      .default([]),
  }),
  bingo: ObjDefault({ squares: z.array(z.object({ id: z.string(), text: L() })).default([]) }),
  wheel: ObjDefault({ prizes: z.array(z.object({ id: z.string(), label: L(), detail: L() })).default([]) }),
  scratch: ObjDefault({ prizes: z.array(z.object({ id: z.string(), label: L(), detail: L() })).default([]) }),
  fortune: ObjDefault({ messages: z.array(z.object({ id: z.string(), text: L() })).default([]) }),
  findDiff: ObjDefault({
    a: MediaId,
    b: MediaId,
    spots: z.array(z.object({ id: z.string(), x: z.number(), y: z.number(), r: z.number().default(8) })).default([]),
  }),
  guessSong: ObjDefault({
    rounds: z
      .array(z.object({ id: z.string(), clue: L(), audio: MediaId, options: z.array(LocalizedText).default([]), answer: z.number().int().default(0) }))
      .default([]),
  }),
  crossword: ObjDefault({ words: z.array(z.object({ id: z.string(), answer: z.string(), clue: L() })).default([]) }),
  scavenger: ObjDefault({
    tasks: z.array(z.object({ id: z.string(), title: L(), hint: L(), points: z.number().int().default(10) })).default([]),
  }),
});
export type GamesDoc = z.infer<typeof GamesDoc>;

// ── misc content ───────────────────────────────────────────────────────────
export const OpeningDoc = ObjDefault({
  variant: z.enum(["none", "envelope", "seal", "cinematic", "swipe", "curtain"]).default("envelope"),
  sealText: z.string().max(4).default(""),
  dateReveal: z.boolean().default(true),
  showInitials: z.boolean().default(true),
  locationAware: z.boolean().default(false),
  invitedLine: L(), // "You are invited"
});

export const TimeCapsuleDoc = ObjDefault({
  unlockDate: IsoDate.default(""),
  prompt: L(),
  allowPhoto: z.boolean().default(true),
  allowVideo: z.boolean().default(true),
  allowVoice: z.boolean().default(true),
});

export const ThankYouDoc = ObjDefault({ message: L(), signature: L(), photo: MediaId });
export const AnniversaryDoc = ObjDefault({ message: L(), highlightPhotos: z.array(z.string()).default([]) });
export const LiveDoc = ObjDefault({ streamUrl: z.string().default(""), streamLabel: L() });
export const SeoDoc = ObjDefault({ title: L(), description: L(), ogImage: MediaId });

export const GreetingsDoc = ObjDefault({
  /** Fallback greeting for personalised links. {name} is replaced with the guest name. */
  default: L(),
  byRelationship: z.array(z.object({ id: z.string(), match: z.string().default(""), text: L() })).default([]),
});
export type GreetingsDoc = z.infer<typeof GreetingsDoc>;

export const I18nDoc = ObjDefault({
  /** Per-wedding overrides of built-in interface strings: { ml: { "rsvp.title": "…" } } */
  overrides: z.record(z.string(), z.record(z.string(), z.string())).default({}),
});

// ── sections ───────────────────────────────────────────────────────────────
export const SectionVisibility = z.object({
  /** Which lifecycle states the section appears in. Empty = the section's built-in default. */
  phases: z.array(z.enum(WEDDING_STATUSES)).default([]),
  /** Restrict to guests in these groups. Empty = everybody. Only applies to personalised links. */
  groups: z.array(z.string()).default([]),
  guestsOnly: z.boolean().default(false),
});

export const SectionConfig = z.object({
  id: z.string(),
  type: z.enum(SECTION_TYPES),
  enabled: z.boolean().default(true),
  order: z.number().int().default(0),
  variant: z.string().default("default"),
  settings: z.record(z.string(), z.unknown()).default({}),
  /** Section-level copy overrides (eyebrow, title, intro …) and section media (background, video …). */
  content: z.record(z.string(), z.unknown()).default({}),
  visibility: SectionVisibility.prefault({}),
});
export type SectionConfig = z.infer<typeof SectionConfig>;

// ── the document ───────────────────────────────────────────────────────────
export const InvitationDoc = z.object({
  schemaVersion: z.literal(1).default(1),
  couple: CoupleDoc,
  family: FamilyDoc,
  story: StoryDoc,
  venues: z.array(Venue).default([]),
  events: z.array(WeddingEvent).default([]),
  menu: MenuDoc,
  palette: PaletteDoc,
  dressGuide: DressGuideDoc,
  rsvp: RsvpDoc,
  contacts: ContactDoc,
  games: GamesDoc,
  opening: OpeningDoc,
  timeCapsule: TimeCapsuleDoc,
  thankYou: ThankYouDoc,
  anniversary: AnniversaryDoc,
  live: LiveDoc,
  seo: SeoDoc,
  i18n: I18nDoc,
  guestGreetings: GreetingsDoc,
  sections: z.array(SectionConfig).default([]),
});
export type InvitationDoc = z.infer<typeof InvitationDoc>;

export function parseDoc(input: unknown): InvitationDoc {
  return InvitationDoc.parse(input ?? {});
}

export function emptyDoc(): InvitationDoc {
  return InvitationDoc.parse({});
}

/** Helper for reading localized text with graceful fallbacks. */
export function tx(value: LocalizedText | undefined | null, locale: string, fallbackLocale = "en"): string {
  if (!value) return "";
  const direct = value[locale];
  if (direct && direct.trim()) return direct;
  const fb = value[fallbackLocale];
  if (fb && fb.trim()) return fb;
  for (const v of Object.values(value)) if (v && v.trim()) return v;
  return "";
}
