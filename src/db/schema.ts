import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { InvitationDoc, LocalizedText } from "@/domain/doc/schema";
import type { WeddingStatus } from "@/domain/doc/constants";

/**
 * Multi-tenant model: ONE database, MANY weddings. Every tenant-owned table carries `wedding_id`
 * and every domain service filters by it (see src/domain/auth/access.ts).
 *
 * Domain separation:
 *   identity      users, sessions, magic_links, wedding_users
 *   commerce      wedding_packages, feature_entitlements, orders
 *   design        templates, template_versions, themes
 *   wedding       weddings, published_versions, domains
 *   media         media_assets, gallery_albums, gallery_items, music_tracks
 *   guests        guest_groups, guests, guest_invites, guest_companions, rsvps, accommodation_requests, transport_requests
 *   participation guest_messages, media_wishes
 *   event day     qr_passes, checkins, live_updates
 *   games         game_plays
 *   memory        time_capsules, time_capsule_items, memory_books, anniversary_entries
 *   platform      notifications, audit_logs, system_events, analytics_events, rate_limits
 */

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const createdAt = () => ts("created_at").defaultNow().notNull();
const updatedAt = () => ts("updated_at").defaultNow().notNull();
const pk = () => uuid("id").primaryKey().defaultRandom();
const weddingRef = () => uuid("wedding_id").notNull().references(() => weddings.id, { onDelete: "cascade" });

// ── identity ───────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: pk(),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    role: text("role").$type<"SUPER_ADMIN" | "CLIENT">().notNull().default("CLIENT"),
    passwordHash: text("password_hash"),
    phone: text("phone"),
    /** MFA-ready: an encrypted TOTP secret can be stored here without a schema change. */
    totpSecret: text("totp_secret"),
    mfaEnabledAt: ts("mfa_enabled_at"),
    disabledAt: ts("disabled_at"),
    lastLoginAt: ts("last_login_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** sha256 of the cookie token — a DB leak cannot be replayed as a login. */
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ts("expires_at").notNull(),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const magicLinks = pgTable(
  "magic_links",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdAt: createdAt(),
  },
  (t) => [index("magic_links_user_idx").on(t.userId)],
);

export const weddingUsers = pgTable(
  "wedding_users",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    weddingId: weddingRef(),
    role: text("role").$type<"OWNER" | "EDITOR">().notNull().default("OWNER"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.weddingId] }), index("wedding_users_wedding_idx").on(t.weddingId)],
);

// ── commerce ───────────────────────────────────────────────────────────────
export const weddingPackages = pgTable("wedding_packages", {
  key: text("key").$type<"ESSENTIAL" | "SIGNATURE" | "LUXURY">().primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  blurb: text("blurb").notNull().default(""),
  priceMin: integer("price_min").notNull(),
  priceMax: integer("price_max").notNull(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  hasClientDashboard: boolean("has_client_dashboard").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: updatedAt(),
});

export const featureEntitlements = pgTable(
  "feature_entitlements",
  {
    weddingId: weddingRef(),
    featureKey: text("feature_key").notNull(),
    enabled: boolean("enabled").notNull(),
    reason: text("reason").notNull().default(""),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.weddingId, t.featureKey] })],
);

export const orders = pgTable(
  "orders",
  {
    id: pk(),
    weddingId: uuid("wedding_id").references(() => weddings.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerContact: text("customer_contact").notNull().default(""),
    packageKey: text("package_key").$type<"ESSENTIAL" | "SIGNATURE" | "LUXURY">().notNull(),
    amountInr: integer("amount_inr").notNull().default(0),
    status: text("status").$type<"QUOTED" | "PAID" | "FREE_PORTFOLIO" | "REFUNDED" | "CANCELLED">().notNull().default("QUOTED"),
    notes: text("notes").notNull().default(""),
    paidAt: ts("paid_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("orders_wedding_idx").on(t.weddingId)],
);

// ── design ─────────────────────────────────────────────────────────────────
export const templates = pgTable(
  "templates",
  {
    id: pk(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").$type<"DRAFT" | "PUBLISHED" | "ARCHIVED">().notNull().default("PUBLISHED"),
    supportedPackages: jsonb("supported_packages").$type<string[]>().notNull().default(["ESSENTIAL", "SIGNATURE", "LUXURY"]),
    version: integer("version").notNull().default(1),
    thumbnail: text("thumbnail").notNull().default(""),
    /** Structure only — flavour, default section order/variants, opening. Never customer data. */
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("templates_slug_uq").on(t.slug)],
);

export const templateVersions = pgTable(
  "template_versions",
  {
    id: pk(),
    templateId: uuid("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("template_versions_uq").on(t.templateId, t.version)],
);

export const themes = pgTable(
  "themes",
  {
    id: pk(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").$type<"DRAFT" | "PUBLISHED" | "ARCHIVED">().notNull().default("PUBLISHED"),
    supportedPackages: jsonb("supported_packages").$type<string[]>().notNull().default(["ESSENTIAL", "SIGNATURE", "LUXURY"]),
    version: integer("version").notNull().default(1),
    tokens: jsonb("tokens").$type<Record<string, unknown>>().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("themes_slug_uq").on(t.slug)],
);

// ── weddings ───────────────────────────────────────────────────────────────
export const weddings = pgTable(
  "weddings",
  {
    id: pk(),
    slug: text("slug").notNull(),
    /** Display title, e.g. "Anjali & Sidharth". */
    title: text("title").notNull().default(""),
    eventType: text("event_type").notNull().default("WEDDING"),
    status: text("status").$type<WeddingStatus>().notNull().default("DRAFT"),
    /** When true the public experience follows the wedding date automatically (live day → memory → anniversary). */
    autoLifecycle: boolean("auto_lifecycle").notNull().default(true),
    customerClass: text("customer_class").$type<"FREE_PORTFOLIO" | "PAID_ESSENTIAL" | "PAID_SIGNATURE" | "PAID_LUXURY">().notNull().default("PAID_ESSENTIAL"),
    packageKey: text("package_key").$type<"ESSENTIAL" | "SIGNATURE" | "LUXURY">().notNull().references(() => weddingPackages.key),
    templateId: uuid("template_id").references(() => templates.id, { onDelete: "set null" }),
    themeId: uuid("theme_id").references(() => themes.id, { onDelete: "set null" }),
    themeOverrides: jsonb("theme_overrides").$type<Record<string, unknown>>().notNull().default({}),
    defaultLocale: text("default_locale").notNull().default("en"),
    /** The local language Super Admin adds for this wedding (e.g. "ml"). Null = English only. */
    secondaryLocale: text("secondary_locale"),
    /** 'YYYY-MM-DD' of the main day, in `timezone`. */
    weddingDate: text("wedding_date"),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    accessMode: text("access_mode").$type<"PUBLIC" | "PERSONALIZED_ONLY">().notNull().default("PUBLIC"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    draftDoc: jsonb("draft_doc").$type<InvitationDoc>().notNull(),
    draftUpdatedAt: updatedAt(),
    draftUpdatedBy: uuid("draft_updated_by").references(() => users.id, { onDelete: "set null" }),
    publishedVersionId: uuid("published_version_id"),
    publishedAt: ts("published_at"),
    wizardStep: integer("wizard_step").notNull().default(1),
    /** Live event mode: which event Super Admin / client marked as "happening now". */
    liveEventId: text("live_event_id"),
    liveNote: text("live_note"),
    archivedAt: ts("archived_at"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("weddings_slug_uq").on(sql`lower(${t.slug})`), index("weddings_status_idx").on(t.status)],
);

export const publishedVersions = pgTable(
  "published_versions",
  {
    id: pk(),
    weddingId: weddingRef(),
    version: integer("version").notNull(),
    kind: text("kind").$type<"PUBLISHED" | "CHECKPOINT">().notNull().default("PUBLISHED"),
    label: text("label").notNull().default(""),
    doc: jsonb("doc").$type<InvitationDoc>().notNull(),
    themeSnapshot: jsonb("theme_snapshot").$type<Record<string, unknown>>().notNull().default({}),
    templateId: uuid("template_id"),
    themeId: uuid("theme_id"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("published_versions_uq").on(t.weddingId, t.version)],
);

export const domains = pgTable(
  "domains",
  {
    id: pk(),
    weddingId: weddingRef(),
    hostname: text("hostname").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    verifiedAt: ts("verified_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("domains_hostname_uq").on(sql`lower(${t.hostname})`)],
);

// ── media ──────────────────────────────────────────────────────────────────
export const galleryAlbums = pgTable(
  "gallery_albums",
  {
    id: pk(),
    weddingId: weddingRef(),
    title: jsonb("title").$type<LocalizedText>().notNull().default({}),
    kind: text("kind").$type<"OFFICIAL" | "GUEST" | "LIVE" | "MEMORY" | "EVENT">().notNull().default("OFFICIAL"),
    coverAssetId: uuid("cover_asset_id"),
    isPublic: boolean("is_public").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("gallery_albums_wedding_idx").on(t.weddingId)],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: pk(),
    weddingId: weddingRef(),
    category: text("category")
      .$type<"BRIDE" | "GROOM" | "COUPLE" | "FAMILY" | "GALLERY" | "EVENT" | "VENUE" | "VIDEO" | "MUSIC" | "GUEST_UPLOAD" | "MEMORY" | "OTHER">()
      .notNull()
      .default("OTHER"),
    kind: text("kind").$type<"IMAGE" | "VIDEO" | "AUDIO">().notNull(),
    storageKey: text("storage_key").notNull(),
    mime: text("mime").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    durationSec: doublePrecision("duration_sec"),
    /** Sanitised original filename — for display only, never used as a path. */
    filename: text("filename").notNull().default(""),
    title: text("title").notNull().default(""),
    alt: jsonb("alt").$type<LocalizedText>().notNull().default({}),
    caption: jsonb("caption").$type<LocalizedText>().notNull().default({}),
    albumId: uuid("album_id").references(() => galleryAlbums.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
    focalX: doublePrecision("focal_x"),
    focalY: doublePrecision("focal_y"),
    visibility: text("visibility").$type<"PUBLIC" | "PRIVATE">().notNull().default("PUBLIC"),
    moderation: text("moderation").$type<"PENDING" | "APPROVED" | "REJECTED">().notNull().default("APPROVED"),
    /** temporary upload → published content → permanent memory. Memory is never auto-deleted. */
    retention: text("retention").$type<"TEMPORARY" | "PUBLISHED" | "PERMANENT">().notNull().default("PUBLISHED"),
    source: text("source").$type<"ADMIN" | "CLIENT" | "GUEST" | "SYSTEM">().notNull().default("ADMIN"),
    uploadedByGuestId: uuid("uploaded_by_guest_id"),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    moderatedAt: ts("moderated_at"),
    moderatedBy: uuid("moderated_by").references(() => users.id, { onDelete: "set null" }),
    archivedAt: ts("archived_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("media_wedding_idx").on(t.weddingId, t.category),
    index("media_moderation_idx").on(t.weddingId, t.moderation),
    index("media_album_idx").on(t.albumId),
  ],
);

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: pk(),
    weddingId: weddingRef(),
    albumId: uuid("album_id").notNull().references(() => galleryAlbums.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
    caption: jsonb("caption").$type<LocalizedText>().notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("gallery_items_uq").on(t.albumId, t.assetId), index("gallery_items_wedding_idx").on(t.weddingId)],
);

export const musicTracks = pgTable(
  "music_tracks",
  {
    id: pk(),
    weddingId: weddingRef(),
    assetId: uuid("asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    artist: text("artist").notNull().default(""),
    coverAssetId: uuid("cover_asset_id"),
    isPrimary: boolean("is_primary").notNull().default(false),
    inPlaylist: boolean("in_playlist").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("music_wedding_idx").on(t.weddingId)],
);

// ── guests ─────────────────────────────────────────────────────────────────
export const guestGroups = pgTable(
  "guest_groups",
  {
    id: pk(),
    weddingId: weddingRef(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    kind: text("kind").notNull().default("CUSTOM"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("guest_groups_uq").on(t.weddingId, t.key)],
);

export const guests = pgTable(
  "guests",
  {
    id: pk(),
    weddingId: weddingRef(),
    groupId: uuid("group_id").references(() => guestGroups.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** Normalised digits with country code, e.g. 919846000000. */
    phone: text("phone"),
    email: text("email"),
    /** Seats reserved for this invitation (guest + companions). */
    seats: integer("seats").notNull().default(1),
    /** "Uncle", "College friend", "Colleague" — drives relationship-specific greetings. */
    relationship: text("relationship").notNull().default(""),
    customGreeting: jsonb("custom_greeting").$type<LocalizedText>().notNull().default({}),
    preferredLocale: text("preferred_locale"),
    notes: text("notes").notNull().default(""),
    invitationStatus: text("invitation_status").$type<"NOT_SENT" | "SENT" | "OPENED" | "RESPONDED">().notNull().default("NOT_SENT"),
    sentAt: ts("sent_at"),
    firstOpenedAt: ts("first_opened_at"),
    lastOpenedAt: ts("last_opened_at"),
    openCount: integer("open_count").notNull().default(0),
    archivedAt: ts("archived_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("guests_wedding_idx").on(t.weddingId),
    uniqueIndex("guests_phone_uq").on(t.weddingId, t.phone).where(sql`${t.phone} is not null and ${t.archivedAt} is null`),
  ],
);

export const guestInvites = pgTable(
  "guest_invites",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    revokedAt: ts("revoked_at"),
    lastUsedAt: ts("last_used_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("guest_invites_token_uq").on(t.token), index("guest_invites_guest_idx").on(t.guestId)],
);

export const guestCompanions = pgTable(
  "guest_companions",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isChild: boolean("is_child").notNull().default(false),
    meal: text("meal").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("guest_companions_guest_idx").on(t.guestId)],
);

export const rsvps = pgTable(
  "rsvps",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    status: text("status").$type<"YES" | "NO" | "MAYBE">().notNull(),
    attendingCount: integer("attending_count").notNull().default(0),
    meal: text("meal").notNull().default(""),
    needsAccommodation: boolean("needs_accommodation").notNull().default(false),
    needsTransport: boolean("needs_transport").notNull().default(false),
    pickupLocation: text("pickup_location").notNull().default(""),
    /** eventId → attending, for weddings that ask per-event. */
    eventResponses: jsonb("event_responses").$type<Record<string, boolean>>().notNull().default({}),
    note: text("note").notNull().default(""),
    respondedAt: ts("responded_at").defaultNow().notNull(),
    updatedAt: updatedAt(),
    reminderCount: integer("reminder_count").notNull().default(0),
  },
  (t) => [uniqueIndex("rsvps_guest_uq").on(t.guestId), index("rsvps_wedding_idx").on(t.weddingId)],
);

export const accommodationRequests = pgTable(
  "accommodation_requests",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    rooms: integer("rooms").notNull().default(1),
    arrival: text("arrival").notNull().default(""),
    departure: text("departure").notNull().default(""),
    notes: text("notes").notNull().default(""),
    status: text("status").$type<"REQUESTED" | "CONFIRMED" | "DECLINED">().notNull().default("REQUESTED"),
    assignment: text("assignment").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("accommodation_guest_uq").on(t.guestId), index("accommodation_wedding_idx").on(t.weddingId)],
);

export const transportRequests = pgTable(
  "transport_requests",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    pickupLocation: text("pickup_location").notNull().default(""),
    mode: text("mode").notNull().default(""),
    arrivalAt: text("arrival_at").notNull().default(""),
    reference: text("reference").notNull().default(""), // flight / train number
    passengers: integer("passengers").notNull().default(1),
    notes: text("notes").notNull().default(""),
    status: text("status").$type<"REQUESTED" | "CONFIRMED" | "DECLINED">().notNull().default("REQUESTED"),
    vehicle: text("vehicle").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("transport_guest_uq").on(t.guestId), index("transport_wedding_idx").on(t.weddingId)],
);

// ── participation ──────────────────────────────────────────────────────────
export const guestMessages = pgTable(
  "guest_messages",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").references(() => guests.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    kind: text("kind").$type<"WISH" | "PRIVATE" | "SHOUTOUT">().notNull().default("WISH"),
    body: text("body").notNull(),
    locale: text("locale").notNull().default("en"),
    moderation: text("moderation").$type<"PENDING" | "APPROVED" | "REJECTED">().notNull().default("PENDING"),
    /** Private messages can stay sealed until this moment (post-event unlock). */
    unlockAt: ts("unlock_at"),
    pinned: boolean("pinned").notNull().default(false),
    moderatedAt: ts("moderated_at"),
    moderatedBy: uuid("moderated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("guest_messages_wedding_idx").on(t.weddingId, t.kind, t.moderation)],
);

export const mediaWishes = pgTable(
  "media_wishes",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").references(() => guests.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    kind: text("kind").$type<"VIDEO" | "VOICE">().notNull(),
    assetId: uuid("asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
    message: text("message").notNull().default(""),
    moderation: text("moderation").$type<"PENDING" | "APPROVED" | "REJECTED">().notNull().default("PENDING"),
    moderatedAt: ts("moderated_at"),
    createdAt: createdAt(),
  },
  (t) => [index("media_wishes_wedding_idx").on(t.weddingId, t.kind, t.moderation)],
);

// ── event day ──────────────────────────────────────────────────────────────
export const qrPasses = pgTable(
  "qr_passes",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    revokedAt: ts("revoked_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("qr_passes_code_uq").on(t.code), uniqueIndex("qr_passes_guest_uq").on(t.guestId)],
);

export const checkins = pgTable(
  "checkins",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    /** Event id inside the invitation document. */
    eventId: text("event_id").notNull(),
    seatsAdmitted: integer("seats_admitted").notNull().default(1),
    method: text("method").$type<"QR" | "MANUAL">().notNull().default("QR"),
    note: text("note").notNull().default(""),
    checkedInBy: uuid("checked_in_by").references(() => users.id, { onDelete: "set null" }),
    checkedInAt: ts("checked_in_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("checkins_uq").on(t.guestId, t.eventId), index("checkins_wedding_idx").on(t.weddingId, t.eventId)],
);

export const liveUpdates = pgTable(
  "live_updates",
  {
    id: pk(),
    weddingId: weddingRef(),
    title: jsonb("title").$type<LocalizedText>().notNull().default({}),
    body: jsonb("body").$type<LocalizedText>().notNull().default({}),
    kind: text("kind").$type<"INFO" | "ALERT" | "SCHEDULE" | "MILESTONE">().notNull().default("INFO"),
    eventId: text("event_id"),
    pinned: boolean("pinned").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("live_updates_wedding_idx").on(t.weddingId, t.createdAt)],
);

// ── games ──────────────────────────────────────────────────────────────────
export const gamePlays = pgTable(
  "game_plays",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id").references(() => guests.id, { onDelete: "set null" }),
    playerName: text("player_name").notNull(),
    game: text("game").notNull(),
    score: integer("score").notNull().default(0),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("game_plays_wedding_idx").on(t.weddingId, t.game), uniqueIndex("game_plays_guest_game_uq").on(t.weddingId, t.guestId, t.game).where(sql`${t.guestId} is not null`)],
);

// ── memory ─────────────────────────────────────────────────────────────────
export const timeCapsules = pgTable("time_capsules", {
  id: pk(),
  weddingId: weddingRef().unique(),
  unlockAt: ts("unlock_at").notNull(),
  prompt: jsonb("prompt").$type<LocalizedText>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const timeCapsuleItems = pgTable(
  "time_capsule_items",
  {
    id: pk(),
    weddingId: weddingRef(),
    capsuleId: uuid("capsule_id").notNull().references(() => timeCapsules.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").references(() => guests.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    kind: text("kind").$type<"TEXT" | "PHOTO" | "VIDEO" | "VOICE">().notNull(),
    body: text("body").notNull().default(""),
    assetId: uuid("asset_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("capsule_items_capsule_idx").on(t.capsuleId)],
);

export const memoryBooks = pgTable("memory_books", {
  id: pk(),
  weddingId: weddingRef().unique(),
  title: jsonb("title").$type<LocalizedText>().notNull().default({}),
  intro: jsonb("intro").$type<LocalizedText>().notNull().default({}),
  pinnedMessageIds: jsonb("pinned_message_ids").$type<string[]>().notNull().default([]),
  pinnedAssetIds: jsonb("pinned_asset_ids").$type<string[]>().notNull().default([]),
  publishedAt: ts("published_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const anniversaryEntries = pgTable(
  "anniversary_entries",
  {
    id: pk(),
    weddingId: weddingRef(),
    year: integer("year").notNull(),
    title: jsonb("title").$type<LocalizedText>().notNull().default({}),
    body: jsonb("body").$type<LocalizedText>().notNull().default({}),
    assetIds: jsonb("asset_ids").$type<string[]>().notNull().default([]),
    unlocksAt: ts("unlocks_at"),
    createdAt: createdAt(),
  },
  (t) => [index("anniversary_wedding_idx").on(t.weddingId, t.year)],
);

// ── platform ───────────────────────────────────────────────────────────────
export const notifications = pgTable(
  "notifications",
  {
    id: pk(),
    weddingId: uuid("wedding_id").references(() => weddings.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").references(() => guests.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").$type<"EMAIL" | "WHATSAPP" | "INAPP">().notNull(),
    template: text("template").notNull(),
    toAddress: text("to_address").notNull().default(""),
    subject: text("subject").notNull().default(""),
    body: text("body").notNull().default(""),
    link: text("link").notNull().default(""),
    status: text("status").$type<"QUEUED" | "SENT" | "FAILED" | "SKIPPED" | "READ">().notNull().default("QUEUED"),
    error: text("error"),
    scheduledFor: ts("scheduled_for"),
    sentAt: ts("sent_at"),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_wedding_idx").on(t.weddingId, t.createdAt), index("notifications_user_idx").on(t.userId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: pk(),
    weddingId: uuid("wedding_id").references(() => weddings.id, { onDelete: "set null" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorLabel: text("actor_label").notNull().default(""),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull().default(""),
    entityId: text("entity_id").notNull().default(""),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("audit_wedding_idx").on(t.weddingId, t.createdAt), index("audit_created_idx").on(t.createdAt)],
);

export const systemEvents = pgTable(
  "system_events",
  {
    id: pk(),
    level: text("level").$type<"INFO" | "WARN" | "ERROR">().notNull().default("INFO"),
    area: text("area").notNull(), // upload | publish | auth | rsvp | email …
    message: text("message").notNull(),
    weddingId: uuid("wedding_id").references(() => weddings.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("system_events_created_idx").on(t.createdAt), index("system_events_wedding_idx").on(t.weddingId)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: pk(),
    weddingId: weddingRef(),
    guestId: uuid("guest_id"),
    /** Random per-browser id — no IP address, no fingerprinting. */
    visitorId: text("visitor_id").notNull(),
    type: text("type").notNull(), // view | section | rsvp | share | play
    section: text("section"),
    device: text("device"),
    createdAt: createdAt(),
  },
  (t) => [index("analytics_wedding_idx").on(t.weddingId, t.type, t.createdAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: ts("window_start").notNull(),
  count: integer("count").notNull().default(0),
});
