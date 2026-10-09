/**
 * The single source of truth for *what can be sold*.
 *
 * Every capability of the product is a `FeatureKey`. Packages are simply sets of feature keys.
 * UI components NEVER check a package name — they ask `canUse(entitlements, "qr_checkin")`.
 * Super Admin can edit a package's feature set (stored in DB) or override one wedding.
 */

export const PACKAGE_KEYS = ["ESSENTIAL", "SIGNATURE", "LUXURY"] as const;
export type PackageKey = (typeof PACKAGE_KEYS)[number];

export const PACKAGE_RANK: Record<PackageKey, number> = { ESSENTIAL: 0, SIGNATURE: 1, LUXURY: 2 };

export type FeatureGroup =
  | "Invitation"
  | "Guests & RSVP"
  | "Participation"
  | "Travel & Venue"
  | "Games"
  | "Event day"
  | "Memories"
  | "Dashboard";

export interface FeatureDef {
  label: string;
  description: string;
  group: FeatureGroup;
  /** The lowest package that includes this feature by default. */
  tier: PackageKey;
}

export const FEATURES = {
  // ── Invitation (Essential) ────────────────────────────────────────────
  invitation: { label: "Premium invitation", description: "Templates, themes, opening animation, countdown and all core sections.", group: "Invitation", tier: "ESSENTIAL" },
  custom_url: { label: "Custom invitation URL", description: "A memorable link such as /invite/nihal-and-fida.", group: "Invitation", tier: "ESSENTIAL" },
  music: { label: "Background music", description: "Tap-to-play music with cover art and progress.", group: "Invitation", tier: "ESSENTIAL" },
  story: { label: "Story & timeline", description: "How it began, timeline chapters and the story behind the occasion.", group: "Invitation", tier: "ESSENTIAL" },
  gallery: { label: "Photo gallery & film", description: "Albums, editorial spreads, a full-screen viewer and an optional film.", group: "Invitation", tier: "ESSENTIAL" },
  venue_basic: { label: "Venue, map & parking", description: "Google Maps link, parking and dress code.", group: "Travel & Venue", tier: "ESSENTIAL" },
  rsvp: { label: "RSVP", description: "Will you be joining us? Yes / No / Maybe with a simple form.", group: "Guests & RSVP", tier: "ESSENTIAL" },
  whatsapp_share: { label: "WhatsApp & link sharing", description: "One-tap share to WhatsApp, native share and copy link.", group: "Invitation", tier: "ESSENTIAL" },
  wedding_details: { label: "Menu, palette & ritual guide", description: "A digital menu, colour palette, dress guide and ritual explainers.", group: "Invitation", tier: "ESSENTIAL" },

  // ── Signature ────────────────────────────────────────────────────────
  client_dashboard: { label: "Client dashboard", description: "Your own dashboard to manage guests, RSVPs, wishes and gallery.", group: "Dashboard", tier: "SIGNATURE" },
  guest_management: { label: "Guest management", description: "Guest list, groups, CSV import, bulk actions and invitation status.", group: "Guests & RSVP", tier: "SIGNATURE" },
  personalized_urls: { label: "Personalised guest links", description: "A private link for each guest with their name and greeting.", group: "Guests & RSVP", tier: "SIGNATURE" },
  guest_rsvp: { label: "Guest-specific RSVP", description: "Reserved seats, family RSVP and companions per guest.", group: "Guests & RSVP", tier: "SIGNATURE" },
  rsvp_dashboard: { label: "Live RSVP dashboard", description: "See who is coming, meal choices and headcount live.", group: "Guests & RSVP", tier: "SIGNATURE" },
  rsvp_reminders: { label: "RSVP reminders", description: "Reminder messages to guests who haven't replied.", group: "Guests & RSVP", tier: "SIGNATURE" },
  meal_preference: { label: "Meal preferences", description: "Collect veg / non-veg / custom meal choices.", group: "Guests & RSVP", tier: "SIGNATURE" },
  accommodation: { label: "Accommodation requests", description: "Guests can request a stay; you assign rooms.", group: "Travel & Venue", tier: "SIGNATURE" },
  transport: { label: "Transport requests", description: "Pickup locations and travel assistance requests.", group: "Travel & Venue", tier: "SIGNATURE" },
  guestbook: { label: "Guestbook & wishes", description: "Moderated wishes, memory wall and shout-outs.", group: "Participation", tier: "SIGNATURE" },
  private_messages: { label: "Private messages", description: "Private messages only the hosts can read, with optional post-event unlock.", group: "Participation", tier: "SIGNATURE" },
  guest_uploads: { label: "Guest photo uploads", description: "Guests share their photos with moderation.", group: "Participation", tier: "SIGNATURE" },
  video_wishes: { label: "Video wishes", description: "Guests record or upload a short video wish.", group: "Participation", tier: "SIGNATURE" },
  family_tree: { label: "Interactive family tree", description: "Explore both families and how everyone is related.", group: "Invitation", tier: "SIGNATURE" },
  couple_extras: { label: "Then vs now, memory cards & quiz", description: "Then/now slider, memory cards, personality cards and a quiz about the hosts.", group: "Invitation", tier: "SIGNATURE" },
  travel_info: { label: "Travel & hotel information", description: "Hotel recommendations, airport & railway directions.", group: "Travel & Venue", tier: "SIGNATURE" },
  games_basic: { label: "Trivia & bingo", description: "How well do you know us, party bingo.", group: "Games", tier: "SIGNATURE" },
  multilingual: { label: "Local language switch", description: "Guests can switch the invitation to the local language.", group: "Invitation", tier: "SIGNATURE" },
  post_event_gallery: { label: "Post-event gallery", description: "Official photos and guest photos after the event.", group: "Memories", tier: "SIGNATURE" },
  lifetime_memories: { label: "Lifetime memory access", description: "Photo albums, wishes and memories stay online for life.", group: "Memories", tier: "SIGNATURE" },

  // ── Luxury ───────────────────────────────────────────────────────────
  qr_pass: { label: "Digital guest pass (QR)", description: "A beautiful QR pass with name, seats and event details.", group: "Event day", tier: "LUXURY" },
  qr_checkin: { label: "QR check-in", description: "Scan at the venue to check guests in and update the dashboard live.", group: "Event day", tier: "LUXURY" },
  advanced_greetings: { label: "Relationship-specific greetings", description: "Different heartfelt messages for uncle, college friend, colleague…", group: "Guests & RSVP", tier: "LUXURY" },
  event_visibility: { label: "Personalised event visibility", description: "Guests only see the events meant for them (enforced on the server).", group: "Guests & RSVP", tier: "LUXURY" },
  live_schedule: { label: "Live schedule & What's Happening Now", description: "A live schedule that highlights the current and next event.", group: "Event day", tier: "LUXURY" },
  live_updates: { label: "Live updates", description: "Post announcements to every guest's invitation in real time.", group: "Event day", tier: "LUXURY" },
  live_stream: { label: "Live stream", description: "Embed a YouTube / Vimeo live stream for those who can't travel.", group: "Event day", tier: "LUXURY" },
  live_photo_wall: { label: "Live photo wall", description: "Guest photos appear on a live wall after moderation.", group: "Event day", tier: "LUXURY" },
  voice_wishes: { label: "Voice wishes", description: "Guests record a voice message for the hosts.", group: "Participation", tier: "LUXURY" },
  advanced_gallery: { label: "Guest, live & memory galleries", description: "Official, guest, live and memory galleries side by side.", group: "Memories", tier: "LUXURY" },
  custom_venue_map: { label: "Custom venue map", description: "An illustrated venue map with pinned locations.", group: "Travel & Venue", tier: "LUXURY" },
  travel_planner: { label: "Advanced travel planner", description: "Step-by-step routes by air, rail and road, plus shuttle timings.", group: "Travel & Venue", tier: "LUXURY" },
  nearby_guide: { label: "Nearby things to do & destination guide", description: "Local attractions and a full destination guide.", group: "Travel & Venue", tier: "LUXURY" },
  parking_qr: { label: "Parking & navigation QR", description: "QR codes for parking and event navigation.", group: "Travel & Venue", tier: "LUXURY" },
  games_advanced: { label: "Advanced games", description: "Prediction wheel, scratch card, fortune cookie, crossword, find-the-difference, guess the song.", group: "Games", tier: "LUXURY" },
  scavenger_hunt: { label: "Scavenger hunt", description: "Photo challenges guests complete during the celebration.", group: "Games", tier: "LUXURY" },
  leaderboard: { label: "Guest leaderboard", description: "Points from every game on a shared leaderboard.", group: "Games", tier: "LUXURY" },
  time_capsule: { label: "Digital time capsule", description: "Guests leave notes and media that unlock on a future date.", group: "Memories", tier: "LUXURY" },
  memory_mode: { label: "After-the-event memory mode", description: "The invitation becomes a thank-you and memory website.", group: "Memories", tier: "LUXURY" },
  memory_book: { label: "Memory book", description: "A curated keepsake of photos and wishes.", group: "Memories", tier: "LUXURY" },
  anniversary_mode: { label: "Anniversary mode & countdown", description: "'One year ago today…' with an anniversary countdown.", group: "Memories", tier: "LUXURY" },
  memory_notifications: { label: "Memory notifications", description: "Gentle reminders when memories unlock or anniversaries arrive.", group: "Memories", tier: "LUXURY" },
  digital_legacy: { label: "Permanent digital legacy", description: "A permanent home for everything, with export.", group: "Memories", tier: "LUXURY" },
  event_day_mode: { label: "Event-day control room", description: "Current event, headcount, check-ins, photos and wishes in one place.", group: "Event day", tier: "LUXURY" },
  advanced_analytics: { label: "Richer analytics", description: "Section views, devices and check-in trends.", group: "Dashboard", tier: "LUXURY" },
  location_opening: { label: "Location-aware opening", description: "'You're 320 km away — we can't wait to see you' (opt-in by the guest).", group: "Invitation", tier: "LUXURY" },
} as const satisfies Record<string, FeatureDef>;

export type FeatureKey = keyof typeof FEATURES;
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

export function isFeatureKey(k: string): k is FeatureKey {
  return Object.prototype.hasOwnProperty.call(FEATURES, k);
}

/** Default feature set of a package: everything at or below its tier. */
export function defaultFeaturesFor(pkg: PackageKey): FeatureKey[] {
  return FEATURE_KEYS.filter((k) => PACKAGE_RANK[FEATURES[k].tier] <= PACKAGE_RANK[pkg]);
}
