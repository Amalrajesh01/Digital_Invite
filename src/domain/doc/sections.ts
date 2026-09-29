import type { FeatureKey } from "@/domain/packages/features";
import type { SectionConfig } from "./schema";
import type { SectionType, WeddingStatus } from "./constants";
import { newId } from "@/lib/id";

/**
 * Static metadata about each section type: what it is called, which package feature unlocks it,
 * when it appears in the wedding lifecycle and which layout variants exist.
 * (React components live in src/invitation/sections — this file has no UI dependencies.)
 */
export interface SectionMeta {
  type: SectionType;
  label: string;
  description: string;
  group: "Opening" | "Couple" | "Wedding day" | "Travel" | "Guests" | "Interactive" | "Live" | "Memories";
  /** Feature needed to show this section. `null` = always available. */
  feature: FeatureKey | null;
  /** Lifecycle states in which the section is visible unless the visibility rule overrides it. */
  phases: readonly WeddingStatus[];
  variants: { key: string; label: string }[];
  /** Only one instance of this type may exist. */
  single: boolean;
  /** Only shown to guests who opened a personalised link (needs a guest identity). */
  needsGuest?: boolean;
}

const PRE: WeddingStatus[] = ["DRAFT", "PREVIEW", "PUBLISHED"];
const PRE_LIVE: WeddingStatus[] = ["DRAFT", "PREVIEW", "PUBLISHED", "LIVE_EVENT"];
const ALL: WeddingStatus[] = ["DRAFT", "PREVIEW", "PUBLISHED", "LIVE_EVENT", "POST_EVENT", "MEMORY", "ANNIVERSARY"];
const DAY_AND_AFTER: WeddingStatus[] = ["DRAFT", "PREVIEW", "LIVE_EVENT", "POST_EVENT", "MEMORY", "ANNIVERSARY"];
const AFTER: WeddingStatus[] = ["DRAFT", "PREVIEW", "POST_EVENT", "MEMORY", "ANNIVERSARY"];

const v = (...pairs: [string, string][]) => pairs.map(([key, label]) => ({ key, label }));

export const SECTION_META: Record<SectionType, SectionMeta> = {
  hero: { type: "hero", label: "Hero", description: "The first impression: names, date and the opening photograph.", group: "Opening", feature: "invitation", phases: ALL, single: true, variants: v(["arch", "Arch frame"], ["fullbleed", "Full-bleed cinematic"], ["split", "Editorial split"], ["centered", "Centred minimal"]) },
  countdown: { type: "countdown", label: "Countdown", description: "Counts down to the ceremony (or each event).", group: "Opening", feature: "invitation", phases: PRE, single: true, variants: v(["classic", "Classic"], ["ring", "Elegant rings"], ["events", "Every event"]) },
  couple: { type: "couple", label: "The couple", description: "Introduce the bride and groom.", group: "Couple", feature: "invitation", phases: ALL, single: true, variants: v(["portraits", "Portraits"], ["editorial", "Editorial"], ["arch", "Arch frames"]) },
  story: { type: "story", label: "Our story", description: "How we met, then & now, memory cards and voice story.", group: "Couple", feature: "story", phases: ALL, single: true, variants: v(["chapters", "Chapters"], ["cards", "Memory cards"]) },
  timeline: { type: "timeline", label: "Timeline", description: "A vertical timeline of our journey.", group: "Couple", feature: "story", phases: ALL, single: true, variants: v(["vertical", "Vertical"], ["horizontal", "Horizontal scroll"]) },
  family: { type: "family", label: "Family", description: "Both families, the wedding party and the family tree.", group: "Couple", feature: "invitation", phases: ALL, single: true, variants: v(["editorial", "Editorial"], ["tree", "Family tree"], ["list", "Simple list"]) },
  events: { type: "events", label: "Events", description: "Every ceremony and celebration with time and place.", group: "Wedding day", feature: "invitation", phases: PRE_LIVE, single: true, variants: v(["cards", "Ticket cards"], ["timeline", "Day timeline"], ["editorial", "Editorial list"]) },
  venue: { type: "venue", label: "Venue & map", description: "Where to go: map, parking and directions.", group: "Travel", feature: "venue_basic", phases: PRE_LIVE, single: true, variants: v(["classic", "Classic"], ["map", "Illustrated map"]) },
  travel: { type: "travel", label: "Travel & stay", description: "Hotels, airport and railway directions, nearby things to do.", group: "Travel", feature: "travel_info", phases: PRE_LIVE, single: true, variants: v(["tabs", "Tabs"], ["planner", "Travel planner"]) },
  gallery: { type: "gallery", label: "Gallery", description: "Albums and photographs.", group: "Couple", feature: "gallery", phases: ALL, single: true, variants: v(["masonry", "Masonry"], ["editorial", "Editorial grid"], ["carousel", "Carousel"]) },
  dresscode: { type: "dresscode", label: "Dress code & palette", description: "Visual dress code guide and the wedding colour palette.", group: "Wedding day", feature: "venue_basic", phases: PRE_LIVE, single: true, variants: v(["visual", "Visual guide"], ["palette", "Palette only"]) },
  menu: { type: "menu", label: "Wedding menu", description: "The feast, course by course.", group: "Wedding day", feature: "wedding_details", phases: PRE_LIVE, single: true, variants: v(["classic", "Menu card"]) },
  rsvp: { type: "rsvp", label: "RSVP", description: "Will you be joining us?", group: "Guests", feature: "rsvp", phases: PRE, single: true, variants: v(["classic", "Classic"], ["card", "Card"]) },
  guestbook: { type: "guestbook", label: "Guestbook & wishes", description: "Leave a wish for the couple; read the memory wall.", group: "Guests", feature: "guestbook", phases: ALL, single: true, variants: v(["wall", "Memory wall"], ["list", "List"]) },
  music: { type: "music", label: "Couple playlist", description: "Our playlist, track by track.", group: "Couple", feature: "music", phases: ALL, single: true, variants: v(["player", "Player"]) },
  quiz: { type: "quiz", label: "How well do you know us?", description: "A short quiz about the couple.", group: "Interactive", feature: "couple_extras", phases: PRE_LIVE, single: true, variants: v(["classic", "Classic"]) },
  games: { type: "games", label: "Games", description: "Trivia, bingo and other celebration games.", group: "Interactive", feature: "games_basic", phases: PRE_LIVE, single: true, variants: v(["grid", "Game grid"]) },
  scavenger: { type: "scavenger", label: "Scavenger hunt", description: "Photo challenges to complete during the celebration.", group: "Interactive", feature: "scavenger_hunt", phases: DAY_AND_AFTER, single: true, variants: v(["list", "List"]) },
  photowall: { type: "photowall", label: "Live photo wall", description: "Approved guest photos appear live.", group: "Live", feature: "live_photo_wall", phases: DAY_AND_AFTER, single: true, variants: v(["wall", "Wall"], ["stream", "Stream"]) },
  guestupload: { type: "guestupload", label: "Share your photos", description: "Guests upload photos and videos.", group: "Guests", feature: "guest_uploads", phases: DAY_AND_AFTER, single: true, variants: v(["classic", "Classic"]) },
  wishes: { type: "wishes", label: "Video & voice wishes", description: "Record a message for the couple.", group: "Guests", feature: "video_wishes", phases: ALL, single: true, variants: v(["classic", "Classic"]) },
  qrpass: { type: "qrpass", label: "Guest pass", description: "Your personal QR pass for entry.", group: "Live", feature: "qr_pass", phases: ["DRAFT", "PREVIEW", "PUBLISHED", "LIVE_EVENT"], single: true, variants: v(["ticket", "Ticket"]), needsGuest: true },
  checkin: { type: "checkin", label: "Arrival & check-in", description: "Shows check-in status and arrival guidance on the day.", group: "Live", feature: "qr_checkin", phases: ["DRAFT", "PREVIEW", "LIVE_EVENT"], single: true, variants: v(["card", "Card"]), needsGuest: true },
  livesched: { type: "livesched", label: "Live schedule", description: "What's happening now and what is next.", group: "Live", feature: "live_schedule", phases: ["DRAFT", "PREVIEW", "PUBLISHED", "LIVE_EVENT"], single: true, variants: v(["now", "Now & next"]) },
  liveupdate: { type: "liveupdate", label: "Live updates", description: "Announcements from the family.", group: "Live", feature: "live_updates", phases: ["DRAFT", "PREVIEW", "LIVE_EVENT", "POST_EVENT"], single: true, variants: v(["feed", "Feed"]) },
  livestream: { type: "livestream", label: "Live stream", description: "Watch the ceremony from anywhere.", group: "Live", feature: "live_stream", phases: ["DRAFT", "PREVIEW", "PUBLISHED", "LIVE_EVENT"], single: true, variants: v(["embed", "Embed"]) },
  timecapsule: { type: "timecapsule", label: "Time capsule", description: "Leave a message that opens on a future date.", group: "Memories", feature: "time_capsule", phases: ALL, single: true, variants: v(["sealed", "Sealed capsule"]) },
  memory: { type: "memory", label: "Memories", description: "Official photos, guest photos and wishes after the wedding.", group: "Memories", feature: "post_event_gallery", phases: AFTER, single: true, variants: v(["book", "Memory book"], ["gallery", "Gallery first"]) },
  anniversary: { type: "anniversary", label: "Anniversary", description: "One year ago today…", group: "Memories", feature: "anniversary_mode", phases: ["DRAFT", "PREVIEW", "ANNIVERSARY"], single: true, variants: v(["reel", "Memory reel"]) },
  thankyou: { type: "thankyou", label: "Thank you", description: "A personal thank-you from the couple.", group: "Memories", feature: "post_event_gallery", phases: AFTER, single: true, variants: v(["letter", "Letter"]) },
  contact: { type: "contact", label: "Contacts", description: "Who to call on the day.", group: "Guests", feature: "invitation", phases: PRE_LIVE, single: true, variants: v(["list", "List"]) },
};

export const SECTION_TYPES_ORDERED = Object.keys(SECTION_META) as SectionType[];

export function makeSection(type: SectionType, partial: Partial<SectionConfig> = {}): SectionConfig {
  const meta = SECTION_META[type];
  return {
    id: partial.id ?? newId(),
    type,
    enabled: partial.enabled ?? true,
    order: partial.order ?? 0,
    variant: partial.variant ?? meta.variants[0]?.key ?? "default",
    settings: partial.settings ?? {},
    content: partial.content ?? {},
    visibility: partial.visibility ?? { phases: [], groups: [], guestsOnly: false },
  };
}

export function phasesFor(section: SectionConfig): readonly WeddingStatus[] {
  return section.visibility.phases.length ? section.visibility.phases : SECTION_META[section.type].phases;
}
