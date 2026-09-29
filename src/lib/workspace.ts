import type { IconName } from "@/components/shell/Shell";
import type { FeatureKey } from "@/domain/packages/features";
import { canUse, type Entitlements } from "@/domain/packages/entitlements";

export interface WsItem {
  slug: string; // '' = overview
  label: string;
  icon: IconName;
  feature?: FeatureKey;
  /** Shown in the client dashboard? (Super Admin sees every item.) */
  client: boolean;
  desc: string;
}

/** The wedding workspace. Only what the package allows is enabled; the rest is shown locked for Super Admin. */
export const WORKSPACE: WsItem[] = [
  { slug: "", label: "Overview", icon: "overview", client: true, desc: "Where things stand" },
  { slug: "invitation", label: "Invitation", icon: "invitation", client: true, desc: "Edit and preview the invitation" },
  { slug: "guests", label: "Guests", icon: "guests", feature: "guest_management", client: true, desc: "Guest list, groups and personal links" },
  { slug: "rsvp", label: "RSVP", icon: "rsvp", feature: "rsvp_dashboard", client: true, desc: "Who is coming" },
  { slug: "events", label: "Events", icon: "events", client: true, desc: "Times, places and dress codes" },
  { slug: "gallery", label: "Gallery", icon: "gallery", feature: "gallery", client: true, desc: "Photographs and albums" },
  { slug: "guestbook", label: "Guestbook", icon: "guestbook", feature: "guestbook", client: true, desc: "Written wishes and private notes" },
  { slug: "wishes", label: "Wishes inbox", icon: "wishes", feature: "guestbook", client: true, desc: "Everything waiting for approval" },
  { slug: "photos", label: "Photo wall", icon: "photowall", feature: "guest_uploads", client: true, desc: "Guest photos and the live wall" },
  { slug: "video-wishes", label: "Video wishes", icon: "video", feature: "video_wishes", client: true, desc: "Video messages from guests" },
  { slug: "voice-wishes", label: "Voice wishes", icon: "voice", feature: "voice_wishes", client: true, desc: "Voice messages from guests" },
  { slug: "accommodation", label: "Accommodation", icon: "stay", feature: "accommodation", client: true, desc: "Stay requests and room plan" },
  { slug: "transport", label: "Transport", icon: "transport", feature: "transport", client: true, desc: "Pickup requests and vehicles" },
  { slug: "share", label: "Share", icon: "share", feature: "whatsapp_share", client: true, desc: "Links, QR codes and WhatsApp" },
  { slug: "checkin", label: "QR check-in", icon: "checkin", feature: "qr_checkin", client: true, desc: "Scan guest passes at the venue" },
  { slug: "live", label: "Live event", icon: "live", feature: "event_day_mode", client: true, desc: "Run the day: schedule, updates, headcount" },
  { slug: "games", label: "Games", icon: "games", feature: "games_basic", client: true, desc: "Set up games and see scores" },
  { slug: "time-capsule", label: "Time capsule", icon: "capsule", feature: "time_capsule", client: true, desc: "Messages sealed until a future date" },
  { slug: "memory", label: "Memory", icon: "memory", feature: "memory_mode", client: true, desc: "Thank-you note and memory book" },
  { slug: "anniversary", label: "Anniversary", icon: "anniversary", feature: "anniversary_mode", client: true, desc: "One year ago today…" },
  { slug: "analytics", label: "Analytics", icon: "analytics", client: true, desc: "Views, replies and engagement" },
  { slug: "settings", label: "Settings", icon: "settings", client: true, desc: "Contact details and preferences" },
];

export const ADMIN_EXTRA: WsItem[] = [
  { slug: "versions", label: "Versions", icon: "audit", client: false, desc: "Publish history and rollback" },
];

export function itemsFor(role: "admin" | "client", ent: Entitlements) {
  return WORKSPACE.filter((i) => role === "admin" || i.client).map((i) => ({ ...i, locked: !!i.feature && !canUse(ent, i.feature) }));
}

export function hrefFor(base: string, slug: string, role: "admin" | "client") {
  if (slug === "") return base;
  if (slug === "invitation") return role === "admin" ? `${base}/edit` : `${base}/setup/events`;
  if (slug === "events") return `${base}/setup/events`;
  return `${base}/${slug}`;
}
