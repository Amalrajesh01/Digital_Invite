import type { InvitationDoc, LocalizedText } from "../../src/domain/doc/schema";
import type { EventType } from "../../src/domain/doc/event-types";
import type { PackageKey } from "../../src/domain/packages/features";
import { newId } from "../../src/lib/id";

/**
 * A generic, English-only showcase wedding: describe the couple, the days, the ceremonies and the photographs once,
 * and get a complete, valid invitation document. Used for the Christian and Muslim demonstration weddings.
 */
const L = (en: string): LocalizedText => ({ en });
/** Resolves a photograph key (declared in the showcase's `needs`) to the uploaded media id. */
export type Ids = (key: string) => string | undefined;
/** [key, stock photo id, media category, optional caption / focal-point override] */
export type Need = [key: string, stock: string, category: "COUPLE" | "BRIDE" | "GROOM" | "EVENT" | "VENUE" | "FAMILY" | "PEOPLE" | "OTHER", opts?: { focal?: { x: number; y: number } }];

export interface Person { name: string; fullName: string; parents: string; bio: string; photo: string }
export interface ShowcaseCfg {
  slug: string; title: string; date: string; template: string; theme: string; track: string;
  eventType: EventType;
  journey: { style: "auto" | "classic" | "kerala" | "western"; headZoom: { bride: number; groom: number } };
  images: { couple: string; coupleWide?: string; ceremony?: string; story?: string; family?: string };
  bride: Person; groom: Person;
  tagline: string; invitation: string; quote: { text: string; author: string }; hashtag: string; monogram: string;
  venues: VenueCfg[];
  events: EventCfg[];
  family: { brideName: string; groomName: string; members: [side: "bride" | "groom", name: string, relation: string][] };
  intro: string;
  milestones: [year: string, title: string, caption: string, photo?: string][];
  ceremoniesIntro: string;
  ceremonies: [name: string, when: string, description: string, glyph: "lamp" | "kalash" | "flame" | "rings" | "drum" | "flower" | "bowl" | "knot", photo?: string][];
  rsvp: { deadline: string; pickups: string[]; whatsapp?: string };
  whatsapp: string;
  whatsappMessage?: string;
  contacts: [name: string, role: string, phone: string][];
  palette: { colors: [hex: string, name: string][]; note: string };
  dressAvoid: string;
  opening: { variant: "none" | "envelope" | "seal" | "cinematic" | "swipe" | "curtain"; sealText: string; invited: string };
  thankYou: { message: string; signature: string; photo: string };
  seo: { title: string; description: string; og: string };
  needs: Need[];
  gallery: [stock: string, caption: string][];
  /** Defaults to LUXURY. */
  package?: PackageKey;
  celebration?: "auto" | "petals" | "confetti" | "off";
  /** Guests who leave a wish on the sample invitation: [name, relationship, message]. */
  wishes?: [name: string, relationship: string, message: string][];
  /** Everything the generic builder does not know about: menus, hotels, section copy, a letter from the children… */
  extra?: (doc: InvitationDoc, id: Ids) => void;
}

export type VenueCfg = { key: string; name: string; address: string; city: string; lat: number; lng: number; mapUrl: string; photo?: string; airport?: string; railway?: string; road?: string; parking?: string };
export type EventCfg = { name: string; date: string; start: string; end: string; venue: string; description: string; dress: string; colors: string[]; photo?: string; main?: boolean };

/** Venue documents from the short form used by the demo configs. */
export function buildVenues(list: VenueCfg[], id: Ids): { venues: InvitationDoc["venues"]; ids: Map<string, string> } {
  const ids = new Map<string, string>();
  const venues = list.map((v) => {
    const vid = newId();
    ids.set(v.key, vid);
    return {
      id: vid, name: L(v.name), address: L(v.address), city: L(v.city), lat: v.lat, lng: v.lng, mapUrl: v.mapUrl, photo: v.photo ? id(v.photo) : undefined,
      parking: { info: L(v.parking ?? ""), mapUrl: "" }, directions: { airport: L(v.airport ?? ""), railway: L(v.railway ?? ""), road: L(v.road ?? "") },
      landmarkMap: { pins: [] }, hotels: [], nearby: [], shuttle: { info: {}, schedule: [] }, guide: [],
    };
  }) as never as InvitationDoc["venues"];
  return { venues, ids };
}

export function buildEvents(list: EventCfg[], venueIds: Map<string, string>, id: Ids): InvitationDoc["events"] {
  return list.map((e, i) => ({
    id: newId(), name: L(e.name), date: e.date, startTime: e.start, endTime: e.end, venueId: venueIds.get(e.venue), isMain: !!e.main, order: i,
    description: L(e.description), dressCode: L(e.dress), dressColors: e.colors, notes: {}, mapUrl: "",
    visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: {}, body: {} }, photo: e.photo ? id(e.photo) : undefined,
  })) as never as InvitationDoc["events"];
}

/** Sets a section's own heading copy (eyebrow / title / intro) — how one section type reads in a different occasion. */
export function sectionCopy(doc: InvitationDoc, type: InvitationDoc["sections"][number]["type"], copy: { eyebrow?: string; title?: string; intro?: string }) {
  const s = doc.sections.find((x) => x.type === type);
  if (!s) return;
  const c = { ...s.content } as Record<string, unknown>;
  for (const k of ["eyebrow", "title", "intro"] as const) if (copy[k] !== undefined) c[k] = L(copy[k]!);
  s.content = c;
}

export function buildShowcaseDoc(base: InvitationDoc, c: ShowcaseCfg, id: Ids): InvitationDoc {
  const doc = structuredClone(base) as InvitationDoc;
  const person = (p: Person) => ({ name: L(p.name), fullName: L(p.fullName), parents: L(p.parents), bio: L(p.bio), photo: id(p.photo) });
  doc.eventType = c.eventType;
  doc.journey = { enabled: true, style: c.journey.style, headZoom: c.journey.headZoom };
  doc.images = { couple: id(c.images.couple), coupleWide: c.images.coupleWide ? id(c.images.coupleWide) : undefined, ceremony: c.images.ceremony ? id(c.images.ceremony) : undefined, story: c.images.story ? id(c.images.story) : undefined, family: c.images.family ? id(c.images.family) : undefined };
  doc.couple = { ...doc.couple, bride: person(c.bride), groom: person(c.groom), order: "bride-first", tagline: L(c.tagline), invitation: L(c.invitation), quote: { text: L(c.quote.text), author: L(c.quote.author) }, hashtag: c.hashtag, monogram: c.monogram };

  const built = buildVenues(c.venues, id);
  doc.venues = built.venues;
  doc.events = buildEvents(c.events, built.ids, id);

  doc.family = {
    brideFamilyName: L(c.family.brideName), groomFamilyName: L(c.family.groomName), party: [],
    members: c.family.members.map(([side, name, relation]) => ({ id: newId(), side, name: L(name), relation: L(relation), blurb: {} })),
  } as never;

  doc.story = {
    ...doc.story, intro: L(c.intro), introPhoto: c.images.story ? id(c.images.story) : undefined,
    milestones: c.milestones.map(([year, title, caption, photo]) => ({ id: newId(), year, title: L(title), caption: L(caption), photo: photo ? id(photo) : undefined })),
    howWeMet: { title: {}, body: {}, photo: undefined }, chapters: [], thenNow: [], memoryCards: [], personality: { bride: [], groom: [] }, voiceStory: { transcript: {} },
  } as never;

  doc.ceremonies = {
    intro: L(c.ceremoniesIntro),
    items: c.ceremonies.map(([name, when, description, glyph, photo]) => ({ id: newId(), name: L(name), when: L(when), description: L(description), glyph, photo: photo ? id(photo) : undefined })),
  } as never;

  doc.rsvp = {
    ...doc.rsvp, deadline: c.rsvp.deadline, askMeal: true, askAccommodation: true, askTransport: true, askEventResponses: true, allowCompanions: true,
    pickupLocations: c.rsvp.pickups.map((p) => ({ id: newId(), label: L(p) })), whatsappNumber: c.rsvp.whatsapp ?? c.whatsapp, thankYou: L("Thank you, {name}. We can’t wait to celebrate with you."),
  } as never;
  doc.whatsapp = { number: c.whatsapp, message: L(c.whatsappMessage ?? "Hello! I’m writing about {title}.") };
  doc.contacts = c.contacts.map(([name, role, phone]) => ({ id: newId(), name: L(name), role: L(role), phone })) as never;
  doc.menu = { courses: [], note: {} } as never;
  doc.palette = { colors: c.palette.colors.map(([hex, name]) => ({ id: newId(), hex, name: L(name) })), note: L(c.palette.note) } as never;
  doc.dressGuide = { looks: [], avoid: L(c.dressAvoid) } as never;
  doc.guestGreetings = { default: L("Dear {name}, we would love to celebrate this special day with you."), byRelationship: [] } as never;
  doc.opening = { variant: c.opening.variant, sealText: c.opening.sealText, dateReveal: true, showInitials: true, locationAware: false, invitedLine: L(c.opening.invited), celebration: "auto" } as never;
  doc.thankYou = { message: L(c.thankYou.message), signature: L(c.thankYou.signature), photo: id(c.thankYou.photo) } as never;
  doc.seo = { title: L(c.seo.title), description: L(c.seo.description), ogImage: id(c.seo.og) } as never;
  doc.film = { url: process.env.SEED_FILM_URL ?? "", video: undefined, poster: undefined, title: {}, caption: {} };
  for (const s of doc.sections) {
    if (s.type === "venue") s.variant = "classic";
    if (s.type === "family") s.variant = "editorial";
  }
  c.extra?.(doc, id);
  return doc;
}
