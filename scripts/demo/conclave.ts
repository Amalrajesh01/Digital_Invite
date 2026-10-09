import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/**
 * Leadership Conclave 2026 — a two-day, invitation-only gathering of senior leaders in Mumbai. Navy, ivory and brass.
 * The organisation, the speakers and the partners are fictional; the photographs are stand-ins.
 */
const D1 = "2026-11-19";
const D2 = "2026-11-20";

export const CONCLAVE: OccasionCfg = {
  slug: "leadership-conclave-2026",
  title: "Leadership Conclave 2026",
  date: D1,
  template: "executive-conclave",
  theme: "boardroom-navy",
  track: "The Long View (ambient)",
  eventType: "conclave",
  headline: { title: "Leadership Conclave 2026", subtitle: "Where leaders shape what comes next", invitation: "You are invited to", hosts: "the Halyard Leadership Forum", monogram: "LC", dateLabel: "19 – 20 November 2026" },
  about: {
    eyebrow: "At a glance",
    title: "The Conclave in brief",
    body: "The Leadership Conclave brings senior leaders together for two days of focused conversation on strategy, capital, talent and technology. No product pitches, no panels for the sake of panels — only sessions designed to help you decide something on Monday morning.\n\nAttendance is by invitation. Please register by 30 October so that we can plan seating, dietary needs and travel for you.",
    highlights: [["2 days", "19 – 20 November", "Mumbai"], ["8 speakers", "Across four themes", "Strategy · Capital · Talent · Technology"], ["12 sessions", "Keynotes, panels, a workshop", "And one long dinner"], ["By invitation", "A room, not a crowd", "Seats are limited"]],
  },
  speakers: [
    { name: "Kavitha Rangan", role: "Chair & Chief Executive", org: "Halyard Group", topic: "The decisions that compound", bio: "Leads a forty-year-old family group through its second transformation, and writes its annual letter by hand. Convenes the Conclave every year.", photo: "s1", featured: true },
    { name: "Samuel Okafor", role: "Managing Partner", org: "Anchorage Capital", topic: "Capital that waits", photo: "s2" },
    { name: "Arjun Mehta", role: "Chief Executive Officer", org: "Corvane Systems", topic: "Leading through a platform shift", photo: "s3" },
    { name: "Neha Kulkarni", role: "Chief People Officer", org: "Sundial Health", topic: "The next decade of talent", photo: "s4" },
    { name: "Rohan D’Souza", role: "Founder", org: "Foundry North", topic: "Building for the long game", photo: "s5" },
    { name: "Hiroshi Tanaka", role: "President", org: "Kestrel & Vale", topic: "The quiet kind of leadership", photo: "s6" },
    { name: "Dr. Priya Venkatesh", role: "Professor of Strategy", org: "Westbrook Institute", topic: "What the research says about decisions", photo: "s7" },
    { name: "Adaeze Nwosu", role: "Chief Executive", org: "Lumen Atlas", topic: "AI is a management problem", photo: "s8" },
  ],
  agenda: [
    { day: D1, start: "08:30", end: "09:30", title: "Registration & breakfast", kind: "break", room: "Foyer" },
    { day: D1, start: "09:30", end: "10:15", title: "Opening keynote: The decisions that compound", speaker: "Kavitha Rangan", kind: "keynote", room: "Main hall", description: "Why the choices that look smallest in the room are the ones that decide the decade." },
    { day: D1, start: "10:15", end: "11:15", title: "Leading through a platform shift", speaker: "Arjun Mehta", track: "Strategy", room: "Main hall", description: "What a chief executive does differently in the first ninety days after the ground moves." },
    { day: D1, start: "11:15", end: "11:45", title: "Tea & conversation", kind: "break", room: "Foyer" },
    { day: D1, start: "11:45", end: "12:45", title: "Panel: Capital that waits", speaker: "Samuel Okafor, Rohan D’Souza, Hiroshi Tanaka", kind: "panel", track: "Capital", room: "Main hall", description: "Patience as a competitive advantage — and how to sell it to a board." },
    { day: D1, start: "12:45", end: "14:00", title: "Lunch", kind: "break", room: "Harbour Terrace" },
    { day: D1, start: "14:00", end: "15:00", title: "Workshop: The decision journal", speaker: "Dr. Priya Venkatesh", kind: "workshop", track: "Strategy", room: "Room B", description: "A practical hour on recording decisions so that you can learn from them. Limited to 40 delegates." },
    { day: D1, start: "15:00", end: "16:00", title: "The next decade of talent", speaker: "Neha Kulkarni", track: "Talent", room: "Main hall" },
    { day: D1, start: "16:00", end: "16:30", title: "Tea", kind: "break", room: "Foyer" },
    { day: D1, start: "16:30", end: "17:30", title: "Fireside: What I got wrong", speaker: "Kavitha Rangan, Hiroshi Tanaka", track: "Strategy", room: "Main hall" },
    { day: D1, start: "19:30", end: "22:00", title: "The Conclave dinner", kind: "networking", room: "Harbour Terrace", description: "A long, seated dinner. No speeches — only the people you came to meet." },
    { day: D2, start: "09:00", end: "09:30", title: "Breakfast", kind: "break", room: "Foyer" },
    { day: D2, start: "09:30", end: "10:30", title: "AI is a management problem", speaker: "Adaeze Nwosu", track: "Technology", room: "Main hall" },
    { day: D2, start: "10:30", end: "11:30", title: "Panel: Hiring for the decade after next", speaker: "Neha Kulkarni, Arjun Mehta, Adaeze Nwosu", kind: "panel", track: "Talent", room: "Main hall" },
    { day: D2, start: "11:30", end: "12:00", title: "Tea", kind: "break", room: "Foyer" },
    { day: D2, start: "12:00", end: "13:00", title: "Keynote: The quiet kind of leadership", speaker: "Hiroshi Tanaka", kind: "keynote", room: "Main hall" },
    { day: D2, start: "13:00", end: "14:15", title: "Lunch", kind: "break", room: "Harbour Terrace" },
    { day: D2, start: "14:15", end: "15:15", title: "Three decisions for Monday morning", speaker: "All speakers", track: "Strategy", room: "Main hall", description: "Every speaker names the one decision they would take this week if they were in your seat." },
    { day: D2, start: "15:15", end: "15:30", title: "Closing remarks", speaker: "Kavitha Rangan", kind: "ceremony", room: "Main hall" },
  ],
  sponsors: [
    { name: "Aurelia Capital", tier: "Principal partner" },
    { name: "Veridian Labs", tier: "Knowledge partners" }, { name: "Orchard Row Partners", tier: "Knowledge partners" },
    { name: "Brightwater Advisory", tier: "Supporting partners" }, { name: "Northlight Media", tier: "Supporting partners" }, { name: "Quill & Co.", tier: "Supporting partners" },
  ],
  registration: { label: "Register to attend", note: "Attendance is by invitation. Please confirm by 30 October so that we can plan your seat, your meals and your travel." },
  images: { couple: "hero", coupleWide: "wide" },
  venues: [
    { key: "pavilion", name: "Harbour Pavilion Convention Centre", address: "Bandra Kurla Complex, Mumbai, Maharashtra 400051", city: "Mumbai", lat: 19.0663, lng: 72.8696, mapUrl: "https://www.google.com/maps/search/?api=1&query=Bandra+Kurla+Complex+Mumbai", photo: "venue", airport: "Chhatrapati Shivaji Maharaj International Airport (BOM) is 8 km away — about 30 minutes off-peak, longer in the evening.", railway: "Bandra Terminus is 4 km away, about 20 minutes by car.", road: "Enter from G Block; the delegate entrance is on the left of the main drop-off and is marked with the Conclave’s navy flags.", parking: "Delegate parking is in basement 2. Valet is available at the main drop-off." },
  ],
  events: [
    { name: "Day one — Strategy, capital & talent", date: D1, start: "09:30", end: "22:00", venue: "pavilion", description: "Opening keynote, the platform-shift session, the capital panel, the decision-journal workshop, a fireside and the Conclave dinner.", dress: "Business formal", colors: ["#14213D", "#B48A3C", "#F7F6F2"], main: true },
    { name: "Day two — Technology & the way ahead", date: D2, start: "09:30", end: "15:30", venue: "pavilion", description: "AI as a management problem, the hiring panel, the closing keynote and three decisions for Monday morning.", dress: "Business smart", colors: ["#14213D", "#3A3F4B", "#F7F6F2"] },
  ],
  rsvp: { deadline: "2026-10-30", pickups: ["Chhatrapati Shivaji Maharaj International Airport (BOM)", "Bandra Terminus", "Your hotel"], askMeal: true, askAccommodation: true, askTransport: true, allowCompanions: false, mealOptions: ["Vegetarian", "Non-vegetarian", "Jain", "Vegan", "No preference"], thankYou: "Thank you, {name}. We have noted your attendance and will write to you with your pass." },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#14213D", "Navy"], ["#3A3F4B", "Charcoal"], ["#F7F6F2", "Ivory"], ["#B48A3C", "Brass"]], note: "Business formal by day; business smart for the Conclave dinner." },
  dressAvoid: "Casual wear, please — the dinner is seated and the photographer will be there.",
  opening: { sealText: "LC", invited: "You are invited to" },
  thankYou: { message: "Thank you for two days of unhurried conversation. The decisions are yours now.\n\nThe Halyard Leadership Forum", signature: "The Halyard Leadership Forum" },
  seo: { title: "Leadership Conclave 2026 — Event Invitation", description: "A two-day, invitation-only leadership conclave: speakers, programme, partners and registration. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "gofAFBM6Q7Y", "COUPLE", { focal: { x: 50, y: 40 } }],
    ["wide", "F2KRf_QfCqw", "COUPLE", { focal: { x: 50, y: 60 } }],
    ["venue", "bAwT-vSd46Y", "VENUE", { focal: { x: 50, y: 70 } }],
    ["s1", "P5vYhunc6Ac", "PEOPLE", { focal: { x: 55, y: 40 } }],
    ["s2", "qPFarjVIR8U", "PEOPLE", { focal: { x: 50, y: 35 } }],
    ["s3", "vZbWlXzZtAY", "PEOPLE", { focal: { x: 40, y: 40 } }],
    ["s4", "5pZLu6-Y5Xc", "PEOPLE", { focal: { x: 50, y: 35 } }],
    ["s5", "QF21BkDlQHo", "PEOPLE", { focal: { x: 45, y: 33 } }],
    ["s6", "mUUAVJCjwKA", "PEOPLE", { focal: { x: 65, y: 35 } }],
    ["s7", "u6RJY5F3yM8", "PEOPLE", { focal: { x: 62, y: 40 } }],
    ["s8", "H2nJ05_Vf2U", "PEOPLE", { focal: { x: 50, y: 30 } }],
  ],
  gallery: [
    ["3aVlWP-7bg8", "The main hall, full"], ["-U_5mtNdPtA", "A panel on the main stage"], ["yTsy3PYFPtc", "Between sessions"], ["rjx4A724IuI", "Tea & conversation"], ["ULh4MH-VxwI", "The foyer at the break"], ["bAwT-vSd46Y", "The city at dusk"],
  ],
  extra(doc) {
    sectionCopy(doc, "about", { eyebrow: "At a glance", title: "The Conclave in brief" });
    sectionCopy(doc, "speakers", { eyebrow: "On stage", title: "The speakers" });
    sectionCopy(doc, "agenda", { eyebrow: "19 – 20 November", title: "The programme" });
    sectionCopy(doc, "sponsors", { eyebrow: "With thanks", title: "Our partners" });
    sectionCopy(doc, "countdown", { eyebrow: "Until the doors open" });
    sectionCopy(doc, "rsvp", { eyebrow: "Registration", title: "Will you be attending?" });
    sectionCopy(doc, "travel", { eyebrow: "Getting here", title: "Travel & stay" });
    const v = doc.venues[0];
    v.hotels = [
      { id: "h1", name: { en: "Harbour View Suites" }, area: { en: "Bandra Kurla Complex" }, distanceKm: 0.4, priceHint: "₹9,800 / night", phone: "+91 73567 41055", url: "", note: { en: "Delegate rate on request — mention the Leadership Conclave when you book." }, photo: undefined },
      { id: "h2", name: { en: "The Aster Hotel" }, area: { en: "Bandra East" }, distanceKm: 1.2, priceHint: "₹6,400 / night", phone: "+91 73567 41055", url: "", note: { en: "A quieter option a short ride from the venue." }, photo: undefined },
    ] as never;
    for (const s of doc.sections) {
      if (s.type === "hero") s.variant = "fullbleed";
    }
  },
};
