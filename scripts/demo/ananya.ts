import type { InvitationDoc, LocalizedText } from "../../src/domain/doc/schema";
import { newId } from "../../src/lib/id";

/**
 * A second, fictional couple: Ananya & Arjun — a north Indian Hindu wedding in Udaipur, English only.
 * It exists to show the cinematic template with a different culture, a full set of ceremonies and a
 * date that is always in the near future of a demo.
 */
const L = (en: string): LocalizedText => ({ en });

export const ANANYA = { slug: "ananya-and-arjun", title: "Ananya & Arjun", date: "2026-12-12" };

export interface AnanyaMedia {
  hero: string; heroWide: string; couple: string; bride: string; groom: string; venue: string; ceremony: string; family?: string; story: string; og: string;
  gallery: { id: string; caption: LocalizedText; alt: LocalizedText }[];
  events: { mehendi: string; sangeet: string; wedding: string; reception: string };
  ceremonies: { haldi: string; mehendi: string; baraat: string; kanyadaan: string; phera: string; reception: string; puja?: string };
  milestones: { first: string; chapter: string; promise: string; wedding: string };
}

export function buildAnanyaDoc(base: InvitationDoc, m: AnanyaMedia): InvitationDoc {
  const doc = structuredClone(base) as InvitationDoc;

  doc.eventType = "hindu_wedding";
  doc.journey = { enabled: true, style: "classic", headZoom: { bride: 0.62, groom: 1.4 } };
  doc.images = { couple: m.hero, coupleWide: m.heroWide, ceremony: m.ceremony, family: m.family, story: m.story };

  doc.couple = {
    ...doc.couple,
    bride: { name: L("Ananya"), fullName: L("Ananya Sharma"), parents: L("Daughter of Mr. Rajesh & Mrs. Meera Sharma, Jaipur"), bio: L("A museum curator who can tell you the story behind any painting, and the best chai stall in any city. She believes the best days start with a long walk and end with a longer conversation."), photo: m.bride },
    groom: { name: L("Arjun"), fullName: L("Arjun Mehra"), parents: L("Son of Mr. Vikram & Mrs. Sunita Mehra, Udaipur"), bio: L("A structural engineer who builds bridges by day and plays the harmonium badly by night. He proposed with a map, a thermos of chai and a very long speech he forgot."), photo: m.groom },
    order: "bride-first",
    tagline: L("Two paths. One promise."),
    invitation: L("Together with their families"),
    quote: { text: L("A great marriage is not when the perfect couple comes together. It is when an imperfect couple learns to enjoy their differences."), author: L("Dave Meurer") },
    hashtag: "AnanyaWedsArjun",
    monogram: "AA",
  };

  const palace = newId(), lawn = newId();
  doc.venues = [
    {
      id: palace, name: L("Suryavilas Palace"), address: L("City Palace Road, Lake Pichola, Udaipur, Rajasthan 313001"), city: L("Udaipur"),
      lat: 24.5764, lng: 73.6835, mapUrl: "https://www.google.com/maps/search/?api=1&query=City+Palace+Udaipur", photo: m.venue,
      parking: { info: L("Valet parking at the palace gate. Guests with elders may be dropped at the Haveli steps."), mapUrl: "" },
      directions: { airport: L("Maharana Pratap Airport (UDR) is 24 km away, about 45 minutes by car. Pre-paid taxis are at the arrivals exit."), railway: L("Udaipur City station is 3 km from the palace, about 15 minutes."), road: L("From the highway, follow signs for Lake Pichola and City Palace; the main gate is on City Palace Road.") },
      landmarkMap: { pins: [] }, hotels: [], nearby: [], shuttle: { info: {}, schedule: [] }, guide: [],
    },
    {
      id: lawn, name: L("Moti Mahal Lawns"), address: L("Fatehsagar Road, Udaipur, Rajasthan 313004"), city: L("Udaipur"), lat: 24.6, lng: 73.68, mapUrl: "https://www.google.com/maps/search/?api=1&query=Fatehsagar+Lake+Udaipur", photo: undefined,
      parking: { info: {}, mapUrl: "" }, directions: { airport: {}, railway: {}, road: {} }, landmarkMap: { pins: [] }, hotels: [], nearby: [], shuttle: { info: {}, schedule: [] }, guide: [],
    },
  ] as never;

  const ev = (id: string, name: string, date: string, start: string, end: string, venueId: string, description: string, dress: string, colors: string[], photo: string | undefined, isMain = false, order = 0) => ({
    id, name: L(name), date, startTime: start, endTime: end, venueId, isMain, order, description: L(description), dressCode: L(dress), dressColors: colors, notes: {}, mapUrl: "",
    visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: {}, body: {} }, photo,
  });
  doc.events = [
    ev("evt-mehendi", "Mehendi", "2026-12-10", "17:00", "21:00", lawn, "An evening of henna, folk music and chaat on the lawn, with the families getting to know each other over steaming kulhads of chai.", "Pastels — mint, peach, lemon", ["#BFE3D0", "#F7C9A8", "#F6E7A0"], m.events.mehendi, false, 0),
    ev("evt-sangeet", "Sangeet", "2026-12-11", "19:00", "23:30", palace, "Songs, skits and a lot of questionable choreography. The dance floor opens after the first toast; comfortable shoes recommended.", "Festive — jewel tones, sequins welcome", ["#7A1F2B", "#C9A24B", "#1F4D6B"], m.events.sangeet, false, 1),
    ev("evt-wedding", "The Wedding", "2026-12-12", "10:30", "13:30", palace, "The pheras, the vows and the blessings of the elders, beneath the open sky of the palace courtyard. Please take your seats by 10:00.", "Traditional — ivory, gold and red", ["#F6EDD8", "#C9A24B", "#A8142F"], m.events.wedding, true, 2),
    ev("evt-reception", "Reception", "2026-12-12", "19:30", "23:00", palace, "An evening under the lamps — dinner, toasts and a first dance that has been rehearsed in a kitchen for six months.", "Evening formal", ["#1F2A44", "#C9A24B", "#8A2432"], m.events.reception, false, 3),
  ] as never;

  doc.family = {
    brideFamilyName: L("The Sharma family"),
    groomFamilyName: L("The Mehra family"),
    members: [
      { id: newId(), side: "bride", name: L("Mr. Rajesh Sharma"), relation: L("Father of the bride"), blurb: {} },
      { id: newId(), side: "bride", name: L("Mrs. Meera Sharma"), relation: L("Mother of the bride"), blurb: {} },
      { id: newId(), side: "bride", name: L("Kavya"), relation: L("Sister of the bride"), blurb: {} },
      { id: newId(), side: "groom", name: L("Mr. Vikram Mehra"), relation: L("Father of the groom"), blurb: {} },
      { id: newId(), side: "groom", name: L("Mrs. Sunita Mehra"), relation: L("Mother of the groom"), blurb: {} },
      { id: newId(), side: "groom", name: L("Rohan"), relation: L("Brother of the groom"), blurb: {} },
    ],
    party: [],
  } as never;

  doc.story = {
    ...doc.story,
    intro: L("Two paths.\nOne unexpected meeting.\nA thousand memories.\nAnd now, forever."),
    introPhoto: m.story,
    milestones: [
      { id: newId(), year: "2019", title: L("First meeting"), caption: L("The last copy of a second-hand book at a Jaipur literature festival — and neither of them would let go of it."), photo: m.milestones.first },
      { id: newId(), year: "2021", title: L("A new chapter"), caption: L("Two cities, a hundred video calls and a standing Sunday date, whatever the time zone."), photo: m.milestones.chapter },
      { id: newId(), year: "2024", title: L("Forever became a promise"), caption: L("A map, a thermos of chai and a speech he forgot. She said yes before he found the ring."), photo: m.milestones.promise },
      { id: newId(), year: "2026", title: L("The wedding"), caption: L("12 December, beneath the open sky of a palace courtyard, with everyone they love."), photo: m.milestones.wedding },
    ],
    howWeMet: { title: {}, body: {}, photo: undefined },
    chapters: [], thenNow: [], memoryCards: [], personality: { bride: [], groom: [] }, voiceStory: { transcript: {} },
  } as never;

  doc.ceremonies = {
    intro: L("Our families have kept these traditions for generations. A short guide, so that everyone can follow along — and join in."),
    items: [
      { id: newId(), name: L("Ganesh Puja"), when: L("Morning of 10 December"), description: L("Every beginning starts with Lord Ganesh. A prayer for blessings and an obstacle-free wedding."), glyph: "kalash", photo: m.ceremonies.puja },
      { id: newId(), name: L("Haldi"), when: L("11 December, morning"), description: L("A paste of turmeric is applied to the bride and groom — to bless, to brighten, and to splatter every white outfit in sight."), photo: m.ceremonies.haldi, glyph: "bowl" },
      { id: newId(), name: L("Mehendi"), when: L("10 December, evening"), description: L("Henna for the bride’s hands. Legend says the darker it stains, the deeper the love — and the groom’s name hides somewhere in the design."), photo: m.ceremonies.mehendi, glyph: "flower" },
      { id: newId(), name: L("Sangeet"), when: L("11 December, night"), description: L("A night of song and dance where the two families finally meet on the dance floor."), glyph: "drum" },
      { id: newId(), name: L("Baraat"), when: L("12 December, 9:30 am"), description: L("The groom arrives in procession with drums, dancing and a very patient horse."), photo: m.ceremonies.baraat, glyph: "drum" },
      { id: newId(), name: L("Kanyadaan"), when: L("12 December, 10:45 am"), description: L("The bride’s parents give their daughter’s hand in marriage — the most tender moment of the day."), photo: m.ceremonies.kanyadaan, glyph: "knot" },
      { id: newId(), name: L("Mangal Phera"), when: L("12 December, 11:30 am"), description: L("Seven rounds around the sacred fire, seven promises. Marriage, made official."), photo: m.ceremonies.phera, glyph: "flame" },
      { id: newId(), name: L("Reception"), when: L("12 December, 7:30 pm"), description: L("A formal evening of dinner, dancing and good wishes."), photo: m.ceremonies.reception, glyph: "rings" },
    ],
  } as never;

  doc.rsvp = {
    ...doc.rsvp, deadline: "2026-11-25", askMeal: true, askAccommodation: true, askTransport: true, askEventResponses: true, allowCompanions: true,
    pickupLocations: [{ id: newId(), label: L("Maharana Pratap Airport (UDR)") }, { id: newId(), label: L("Udaipur City station") }],
    whatsappNumber: "", thankYou: L("Thank you, {name}. We can’t wait to celebrate with you."),
  } as never;
  doc.whatsapp = { number: "917356741055", message: L("Hello! I’m writing about {title}.") };
  doc.contacts = [
    { id: newId(), name: L("Kavya (wedding coordinator)"), role: L("Travel, stay and anything on the day"), phone: "+91 73567 41055" },
    { id: newId(), name: L("Rohan"), role: L("Music and the baraat"), phone: "+91 73567 41055" },
  ] as never;
  doc.menu = { courses: [], note: {} } as never;
  doc.palette = { colors: [{ id: newId(), hex: "#F6EDD8", name: L("Ivory") }, { id: newId(), hex: "#C9A24B", name: L("Gold") }, { id: newId(), hex: "#A8142F", name: L("Bridal red") }, { id: newId(), hex: "#E9B7A0", name: L("Blush") }], note: L("Ivory and gold for the wedding; jewel tones for the sangeet.") } as never;
  doc.dressGuide = { looks: [], avoid: L("White and black for the wedding ceremony.") } as never;
  doc.guestGreetings = { default: L("Dear {name}, we would love to celebrate this special day with you."), byRelationship: [] } as never;
  doc.opening = { variant: "cinematic", sealText: "", dateReveal: true, showInitials: true, locationAware: false, invitedLine: L("You are invited to the wedding of"), celebration: "auto" } as never;
  doc.thankYou = { message: L("From the bottom of our hearts — thank you for travelling, blessing, dancing and making our day complete.\n\nWith love and gratitude,"), signature: L("Ananya & Arjun"), photo: m.couple } as never;
  doc.seo = { title: L("Ananya & Arjun — Wedding Invitation"), description: L("Together with our families, we invite you to celebrate our wedding on 12 December 2026 in Udaipur."), ogImage: m.og } as never;
  doc.timeCapsule = { unlockDate: "2027-12-12", prompt: L("Write to us for our first anniversary."), allowPhoto: true, allowVideo: true, allowVoice: true } as never;
  // The demo ships without a film (the section then hides itself). SEED_FILM_URL=<youtube/vimeo link> shows it.
  doc.film = { url: process.env.SEED_FILM_URL ?? "", video: undefined, poster: undefined, title: {}, caption: {} };

  for (const s of doc.sections) {
    if (s.type === "venue") s.variant = "classic";
    if (s.type === "family") s.variant = "editorial";
  }
  return doc;
}
