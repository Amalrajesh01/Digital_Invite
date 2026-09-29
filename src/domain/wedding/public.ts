import { getEntitlements } from "@/domain/packages/service";
import { canUse, type Entitlements } from "@/domain/packages/entitlements";
import type { InvitationDoc, SectionConfig } from "@/domain/doc/schema";
import type { WeddingStatus } from "@/domain/doc/constants";
import type { ThemeTokens } from "@/domain/design/tokens";
import { collectAssetIds, loadPublicGallery, loadPublicTracks, resolveMediaMap, type PublicTrack, type ResolvedMedia } from "@/domain/media/service";
import { type GuestContext, resolveGuestContext } from "@/domain/guests/context";
import { getGuestRsvp } from "@/domain/guests/rsvp";
import { guestGreeting } from "@/domain/guests/service";
import { capsuleStatus, listAnniversaryEntries, loadPublicMemoryBook, type PublicMemoryBook } from "@/domain/memory/service";
import { listPublicMessages, listPublicMediaWishes } from "@/domain/participation/service";
import { listLiveUpdates } from "@/domain/live/service";
import { effectiveStatus, nextAnniversary, yearsTogether } from "./lifecycle";
import { loadDraftSnapshot, loadPublishedSnapshot, getWeddingBySlug, getWeddingRow, type Snapshot } from "./snapshot";
import { filterDocForGuest, visibleSections } from "./view";
import { env } from "@/lib/env";
import { localeInfo } from "@/domain/doc/constants";
import { SECTION_META } from "@/domain/doc/sections";
import { tx } from "@/domain/doc/schema";

export interface PublicGuest {
  name: string;
  seats: number;
  groupKey: string | null;
  relationship: string;
  token: string | null;
  greetings: Record<string, string>;
  preferredLocale: string | null;
  rsvp: Awaited<ReturnType<typeof getGuestRsvp>>;
  isPreview?: boolean;
}

export interface InvitationView {
  mode: "public" | "preview";
  wedding: {
    slug: string;
    title: string;
    weddingDate: string | null;
    timezone: string;
    defaultLocale: string;
    secondaryLocale: string | null;
    secondaryLabel: string | null;
    status: WeddingStatus;
    storedStatus: WeddingStatus;
    yearsTogether: number;
    nextAnniversary: string | null;
  };
  doc: InvitationDoc;
  sections: SectionConfig[];
  tokens: ThemeTokens;
  flavor: string;
  entitlements: Entitlements;
  media: Record<string, ResolvedMedia>;
  gallery: Awaited<ReturnType<typeof loadPublicGallery>>;
  tracks: PublicTrack[];
  guest: PublicGuest | null;
  initial: {
    wishes: Awaited<ReturnType<typeof listPublicMessages>>;
    videoWishes: Awaited<ReturnType<typeof listPublicMediaWishes>>;
    voiceWishes: Awaited<ReturnType<typeof listPublicMediaWishes>>;
    updates: Awaited<ReturnType<typeof listLiveUpdates>>;
    capsule: Awaited<ReturnType<typeof capsuleStatus>>;
    memoryBook: PublicMemoryBook | null;
    anniversary: Awaited<ReturnType<typeof listAnniversaryEntries>>;
  };
  urls: { canonical: string; ogImage: string | null };
  version: number | null;
}

export type LoadResult =
  | { ok: true; view: InvitationView }
  | { ok: false; reason: "not_found" | "unpublished" | "invite_required" | "invalid_invite" };

export const PREVIEW_GUEST = { name: "Priya Nair", seats: 3, groupKey: "friends", relationship: "College friend" };

function greetingsFor(g: { name: string; customGreeting: Record<string, string>; relationship: string }, doc: InvitationDoc, locales: string[], advanced: boolean): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of locales) {
    out[l] = guestGreeting(g, doc.guestGreetings, l, { advanced, fallback: "" });
  }
  return out;
}

async function assemble(opts: { snap: Snapshot; guest: GuestContext | null; mode: "public" | "preview"; asStatus?: WeddingStatus; previewAsGuest?: boolean }): Promise<InvitationView> {
  const { snap, guest, mode } = opts;
  const { wedding, meta } = snap;
  const ent = await getEntitlements(wedding.id);
  const status = opts.asStatus ?? effectiveStatus(wedding);
  const locales = [meta.defaultLocale, ...(meta.secondaryLocale ? [meta.secondaryLocale] : [])];
  const advanced = canUse(ent, "advanced_greetings");
  const enforceVis = canUse(ent, "event_visibility");

  const previewGuest = opts.previewAsGuest && !guest ? PREVIEW_GUEST : null;
  const groupKey = guest?.groupKey ?? previewGuest?.groupKey ?? null;
  const doc = filterDocForGuest(snap.doc, { groupKey, enforceEventVisibility: enforceVis });
  const sections = visibleSections(doc.sections, { status, entitlements: ent, hasGuest: !!guest || !!previewGuest, groupKey });
  const types = new Set(sections.map((s) => s.type));

  const mediaIds = [...collectAssetIds(doc)];
  const media = await resolveMediaMap(wedding.id, mediaIds, { includePrivate: mode === "preview" });
  const [gallery, tracks] = await Promise.all([types.has("gallery") || types.has("memory") || types.has("hero") ? loadPublicGallery(wedding.id) : Promise.resolve([]), canUse(ent, "music") ? loadPublicTracks(wedding.id) : Promise.resolve([])]);

  let publicGuest: PublicGuest | null = null;
  if (guest) {
    publicGuest = {
      name: guest.name,
      seats: guest.seats,
      groupKey: guest.groupKey,
      relationship: guest.relationship,
      token: guest.token,
      greetings: greetingsFor(guest, doc, locales, advanced),
      preferredLocale: guest.preferredLocale,
      rsvp: await getGuestRsvp(guest),
    };
  } else if (previewGuest) {
    publicGuest = {
      ...previewGuest,
      token: null,
      greetings: greetingsFor({ name: previewGuest.name, customGreeting: {}, relationship: previewGuest.relationship }, doc, locales, advanced),
      preferredLocale: null,
      rsvp: null,
      isPreview: true,
    };
  }

  const want = (t: string) => types.has(t as never);
  const initial = {
    wishes: want("guestbook") || want("memory") ? await listPublicMessages(wedding.id, { limit: 40 }) : [],
    videoWishes: want("wishes") ? await listPublicMediaWishes(wedding.id, "VIDEO") : [],
    voiceWishes: want("wishes") && canUse(ent, "voice_wishes") ? await listPublicMediaWishes(wedding.id, "VOICE") : [],
    updates: want("liveupdate") ? await listLiveUpdates(wedding.id, 20) : [],
    capsule: want("timecapsule") ? await capsuleStatus(wedding.id) : null,
    memoryBook: want("memory") && canUse(ent, "memory_book") ? await loadPublicMemoryBook(wedding.id) : null,
    anniversary: want("anniversary") ? await listAnniversaryEntries(wedding.id) : [],
  };

  const ogId = doc.seo.ogImage ?? doc.couple.bride.photo ?? doc.couple.groom.photo;
  const canonical = `${env.appUrl}/invite/${wedding.slug}`;
  return {
    mode,
    wedding: {
      slug: wedding.slug,
      title: meta.title || wedding.title,
      weddingDate: meta.weddingDate,
      timezone: meta.timezone,
      defaultLocale: meta.defaultLocale,
      secondaryLocale: canUse(ent, "multilingual") ? meta.secondaryLocale : null,
      secondaryLabel: localeInfo(meta.secondaryLocale)?.native ?? null,
      status,
      storedStatus: wedding.status,
      yearsTogether: yearsTogether(meta.weddingDate, meta.timezone),
      nextAnniversary: nextAnniversary(meta.weddingDate, meta.timezone),
    },
    doc,
    sections,
    tokens: meta.tokens,
    flavor: meta.flavor,
    entitlements: ent,
    media,
    gallery,
    tracks,
    guest: publicGuest,
    initial,
    urls: { canonical, ogImage: ogId && media[ogId] ? media[ogId].url : null },
    version: snap.versionNumber,
  };
}

/** Public entry point used by /invite/[slug] and /invite/[slug]/[token]. */
export async function loadPublicInvitation(slug: string, token?: string | null): Promise<LoadResult> {
  const wedding = await getWeddingBySlug(slug);
  if (!wedding) return { ok: false, reason: "not_found" };
  const snap = await loadPublishedSnapshot(wedding);
  if (!snap) return { ok: false, reason: "unpublished" };
  let guest: GuestContext | null = null;
  if (token) {
    guest = await resolveGuestContext(slug, token);
    if (!guest) return { ok: false, reason: "invalid_invite" };
  } else if (wedding.accessMode === "PERSONALIZED_ONLY") {
    return { ok: false, reason: "invite_required" };
  }
  const ent = await getEntitlements(wedding.id);
  // Personalised links only exist for packages that include them; ignore tokens if the feature is off.
  if (guest && !canUse(ent, "personalized_urls")) guest = null;
  return { ok: true, view: await assemble({ snap, guest, mode: "public" }) };
}

/** Draft preview for Super Admin / clients (caller has already authorised access). */
export async function loadPreviewInvitation(weddingId: string, opts: { asStatus?: WeddingStatus; asGuest?: boolean; draft?: InvitationDoc } = {}): Promise<InvitationView | null> {
  const wedding = await getWeddingRow(weddingId);
  if (!wedding) return null;
  const snap = await loadDraftSnapshot(wedding);
  if (opts.draft) snap.doc = opts.draft;
  return assemble({ snap, guest: null, mode: "preview", asStatus: opts.asStatus ?? (wedding.status === "DRAFT" || wedding.status === "PREVIEW" ? "PUBLISHED" : effectiveStatus(wedding)), previewAsGuest: opts.asGuest });
}

export function wantsTypes(view: InvitationView, ...types: string[]) {
  return types.some((t) => view.sections.some((s) => s.type === t));
}

export { tx, SECTION_META };
