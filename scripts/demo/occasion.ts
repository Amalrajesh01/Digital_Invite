import type { InvitationDoc, LocalizedText } from "../../src/domain/doc/schema";
import type { EventType } from "../../src/domain/doc/event-types";
import type { PackageKey } from "../../src/domain/packages/features";
import { newId } from "../../src/lib/id";
import { buildEvents, buildVenues, type EventCfg, type Ids, type Need, type VenueCfg } from "./showcase";

/**
 * A showcase for an occasion that is not about a couple — a birthday, a naming ceremony, a conclave, a summit, a memorial.
 * Describe the occasion, the days, the people and the photographs once; get a complete, valid invitation document.
 * English only. Every name, date and place in these configs is fictional.
 */
const L = (en: string): LocalizedText => ({ en });

export interface AgendaCfg {
  day: string; start: string; end?: string; title: string; speaker?: string; track?: string; room?: string;
  kind?: "session" | "keynote" | "panel" | "workshop" | "break" | "networking" | "ceremony"; description?: string;
}

export interface OccasionCfg {
  slug: string; title: string; date: string; template: string; theme: string; track: string;
  eventType: EventType;
  package?: PackageKey;
  headline: { title: string; subtitle: string; invitation: string; hosts?: string; monogram: string; dateLabel?: string };
  honoree?: { name: string; fullName?: string; role?: string; age?: string; born?: string; passed?: string; photo?: string; epitaph?: string };
  about?: { eyebrow?: string; title?: string; body: string; quote?: [text: string, author: string]; highlights?: [value: string, label: string, note?: string][] };
  speakers?: { name: string; role: string; org?: string; topic?: string; bio?: string; photo?: string; featured?: boolean }[];
  agenda?: AgendaCfg[];
  sponsors?: { name: string; tier: string; url?: string }[];
  message?: { title?: string; body: string; from: string; role?: string; photo?: string };
  people?: { group: string; name: string; relation?: string; note?: string; photo?: string }[];
  registration?: { label?: string; note?: string; url?: string };
  prayer?: { title?: string; text: string; source?: string };
  images: { couple: string; coupleWide?: string; story?: string };
  /** Opening lines of the story section, one thought per line (only for templates that include the story section). */
  intro?: string;
  venues: VenueCfg[];
  events: EventCfg[];
  milestones?: [year: string, title: string, caption: string, photo?: string][];
  ceremoniesIntro?: string;
  ceremonies?: [name: string, when: string, description: string, glyph: "lamp" | "kalash" | "flame" | "rings" | "drum" | "flower" | "bowl" | "knot" | "none", photo?: string][];
  rsvp: { deadline: string; pickups?: string[]; askMeal?: boolean; askAccommodation?: boolean; askTransport?: boolean; allowCompanions?: boolean; mealOptions?: string[]; thankYou?: string };
  /** What the “chat with us” button pre-fills — these samples chat with Stack Bridge Labs. */
  chatMessage: string;
  contacts: [name: string, role: string, phone: string][];
  palette?: { colors: [hex: string, name: string][]; note: string };
  dressAvoid?: string;
  looks?: { title: string; forWhom: "women" | "men" | "everyone"; description: string; colors: string[]; photo?: string }[];
  opening: { sealText?: string; invited?: string };
  thankYou?: { message: string; signature: string; photo?: string };
  seo: { title: string; description: string; og: string };
  needs: Need[];
  gallery: [stock: string, caption: string][];
  wishes?: [name: string, relationship: string, message: string][];
  extra?: (doc: InvitationDoc, id: Ids) => void;
}

export function buildOccasionDoc(base: InvitationDoc, c: OccasionCfg, id: Ids, whatsapp: string): InvitationDoc {
  const doc = structuredClone(base) as InvitationDoc;
  const photo = (k?: string) => (k ? id(k) : undefined);
  doc.eventType = c.eventType;
  doc.journey = { enabled: false, style: "auto", headZoom: { bride: 1, groom: 1 } };
  doc.images = { couple: id(c.images.couple), coupleWide: photo(c.images.coupleWide), story: photo(c.images.story), ceremony: undefined, family: undefined };

  const h = c.honoree;
  doc.occasion = {
    title: L(c.headline.title), subtitle: L(c.headline.subtitle), invitation: L(c.headline.invitation), hosts: L(c.headline.hosts ?? ""), dateLabel: L(c.headline.dateLabel ?? ""), monogram: c.headline.monogram,
    honoree: {
      name: L(h?.name ?? ""), fullName: L(h?.fullName ?? ""), role: L(h?.role ?? ""), age: h?.age ?? "", born: h?.born ?? "", passed: h?.passed ?? "", photo: photo(h?.photo), epitaph: L(h?.epitaph ?? ""),
    },
    about: {
      eyebrow: L(c.about?.eyebrow ?? ""), title: L(c.about?.title ?? ""), body: L(c.about?.body ?? ""),
      quote: { text: L(c.about?.quote?.[0] ?? ""), author: L(c.about?.quote?.[1] ?? "") },
      highlights: (c.about?.highlights ?? []).map(([value, label, note]) => ({ id: newId(), value: L(value), label: L(label), note: L(note ?? "") })),
    },
    speakers: (c.speakers ?? []).map((s) => ({ id: newId(), name: L(s.name), role: L(s.role), org: L(s.org ?? ""), topic: L(s.topic ?? ""), bio: L(s.bio ?? ""), photo: photo(s.photo), featured: !!s.featured })),
    agenda: (c.agenda ?? []).map((a) => ({ id: newId(), day: a.day, start: a.start, end: a.end ?? "", title: L(a.title), speaker: L(a.speaker ?? ""), track: L(a.track ?? ""), room: L(a.room ?? ""), kind: a.kind ?? "session", description: L(a.description ?? "") })),
    sponsors: (c.sponsors ?? []).map((s) => ({ id: newId(), name: L(s.name), tier: L(s.tier), url: s.url ?? "", logo: undefined, blurb: {} })),
    message: { title: L(c.message?.title ?? ""), body: L(c.message?.body ?? ""), from: L(c.message?.from ?? ""), role: L(c.message?.role ?? ""), photo: photo(c.message?.photo) },
    people: (c.people ?? []).map((p) => ({ id: newId(), group: L(p.group), name: L(p.name), relation: L(p.relation ?? ""), note: L(p.note ?? ""), photo: photo(p.photo) })),
    registration: { label: L(c.registration?.label ?? ""), note: L(c.registration?.note ?? ""), url: c.registration?.url ?? "" },
    prayer: { title: L(c.prayer?.title ?? ""), text: L(c.prayer?.text ?? ""), source: L(c.prayer?.source ?? "") },
  };

  const built = buildVenues(c.venues, id);
  doc.venues = built.venues;
  doc.events = buildEvents(c.events, built.ids, id);

  doc.story = {
    ...doc.story, intro: L(c.intro ?? ""), introPhoto: photo(c.images.story),
    milestones: (c.milestones ?? []).map(([year, title, caption, p]) => ({ id: newId(), year, title: L(title), caption: L(caption), photo: photo(p) })),
    howWeMet: { title: {}, body: {}, photo: undefined }, chapters: [], thenNow: [], memoryCards: [], personality: { bride: [], groom: [] }, voiceStory: { transcript: {} },
  } as never;

  doc.ceremonies = {
    intro: L(c.ceremoniesIntro ?? ""),
    items: (c.ceremonies ?? []).map(([name, when, description, glyph, p]) => ({ id: newId(), name: L(name), when: L(when), description: L(description), glyph, photo: photo(p) })),
  } as never;

  const r = c.rsvp;
  doc.rsvp = {
    ...doc.rsvp, deadline: r.deadline, askMeal: r.askMeal ?? false, askAccommodation: r.askAccommodation ?? false, askTransport: r.askTransport ?? false, askEventResponses: true,
    allowCompanions: r.allowCompanions ?? true, mealOptions: (r.mealOptions ?? []).map((m) => ({ id: newId(), label: L(m) })),
    pickupLocations: (r.pickups ?? []).map((p) => ({ id: newId(), label: L(p) })), whatsappNumber: "",
    thankYou: L(r.thankYou ?? "Thank you, {name}. We look forward to seeing you."),
  } as never;
  doc.whatsapp = { number: whatsapp, message: L(c.chatMessage) };
  doc.contacts = c.contacts.map(([name, role, phone]) => ({ id: newId(), name: L(name), role: L(role), phone })) as never;
  doc.menu = { courses: [], note: {} } as never;
  doc.palette = { colors: (c.palette?.colors ?? []).map(([hex, name]) => ({ id: newId(), hex, name: L(name) })), note: L(c.palette?.note ?? "") } as never;
  doc.dressGuide = {
    looks: (c.looks ?? []).map((l) => ({ id: newId(), title: L(l.title), forWhom: l.forWhom, description: L(l.description), colors: l.colors, photo: photo(l.photo) })),
    avoid: L(c.dressAvoid ?? ""),
  } as never;
  doc.guestGreetings = { default: L("Dear {name}, you are warmly invited."), byRelationship: [] } as never;
  doc.opening = { variant: "envelope", sealText: c.opening.sealText ?? "", dateReveal: true, showInitials: true, locationAware: false, invitedLine: L(c.opening.invited ?? ""), celebration: "auto" } as never;
  doc.thankYou = { message: L(c.thankYou?.message ?? ""), signature: L(c.thankYou?.signature ?? ""), photo: photo(c.thankYou?.photo) } as never;
  doc.seo = { title: L(c.seo.title), description: L(c.seo.description), ogImage: id(c.seo.og) } as never;
  doc.film = { url: "", video: undefined, poster: undefined, title: {}, caption: {} };
  doc.live = { streamUrl: "", streamLabel: {} };
  for (const s of doc.sections) {
    if (s.type === "venue") s.variant = "classic";
  }
  c.extra?.(doc, id);
  return doc;
}
