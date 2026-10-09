import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/**
 * Tech Summit 2026 — a community-run, two-day conference for engineers, designers and founders in Bengaluru.
 * Near-black with electric blue. The community, the speakers and the partners are fictional; the photographs are stand-ins.
 */
const D1 = "2026-12-10";
const D2 = "2026-12-11";

export const SUMMIT: OccasionCfg = {
  slug: "tech-summit-2026",
  title: "Tech Summit 2026",
  date: D1,
  template: "summit",
  theme: "signal-dark",
  track: "Signal (ambient)",
  eventType: "conference",
  headline: { title: "Tech Summit 2026", subtitle: "Build what’s next", invitation: "Join us at", hosts: "Northstar Developers", monogram: "TS", dateLabel: "10 – 11 December 2026" },
  about: {
    eyebrow: "The conference",
    title: "Two days. Four tracks. One room full of people who build things.",
    body: "Tech Summit is a community-run conference for engineers, designers and founders: honest talks about what worked, what broke and what we would do differently.\n\nNo vendor keynotes and no slide-ware — only people who shipped something and want to tell you how. Bring your laptop for the workshop, and your questions for everyone else.",
    highlights: [["2 days", "10 – 11 December", "Bengaluru"], ["4 tracks", "Frontend · AI & Data · Infrastructure · Product", ""], ["16 sessions", "Talks, a workshop and a demo hour", ""], ["Open", "Registration for everyone who builds", ""]],
  },
  speakers: [
    { name: "Chidi Okeke", role: "Principal Engineer", org: "Fieldstone Cloud", topic: "Ten years of one monolith", photo: "s1" },
    { name: "Ananya Bose", role: "Head of Design", org: "Paperplane", topic: "The design system that survived a rewrite", photo: "s2" },
    { name: "Sofia Marin", role: "ML Lead", org: "Graphene Labs", topic: "RAG in production: what broke first", photo: "s3" },
    { name: "Wei Zhang", role: "Chief Technology Officer", org: "Brightline", topic: "A data platform with four engineers", photo: "s4" },
    { name: "Maya Fernandes", role: "Founder", org: "Tidepool", topic: "Pricing is a product", photo: "s5" },
    { name: "Ravi Shankar", role: "Staff Engineer", org: "Lumen Atlas", topic: "Observability without the invoice", photo: "s6" },
    { name: "Daniel Kim", role: "VP Engineering", org: "Orbitwise", topic: "What I would tell my younger team", photo: "s7" },
  ],
  agenda: [
    { day: D1, start: "09:00", end: "09:45", title: "Registration & coffee", kind: "break", room: "Atrium" },
    { day: D1, start: "09:45", end: "10:30", title: "Keynote: Ten years of one monolith", speaker: "Chidi Okeke", kind: "keynote", room: "Main stage", description: "What a decade of a single codebase teaches you — and why they are not rewriting it." },
    { day: D1, start: "10:45", end: "11:30", title: "The design system that survived a rewrite", speaker: "Ananya Bose", track: "Frontend", room: "Main stage" },
    { day: D1, start: "10:45", end: "11:30", title: "Edge rendering without the surprises", speaker: "Ravi Shankar", track: "Infrastructure", room: "Stage B" },
    { day: D1, start: "11:45", end: "12:30", title: "RAG in production: what broke first", speaker: "Sofia Marin", track: "AI & Data", room: "Main stage" },
    { day: D1, start: "11:45", end: "12:30", title: "Pricing is a product", speaker: "Maya Fernandes", track: "Product", room: "Stage B" },
    { day: D1, start: "12:30", end: "13:45", title: "Lunch", kind: "break", room: "Atrium" },
    { day: D1, start: "13:45", end: "14:30", title: "A data platform with four engineers", speaker: "Wei Zhang", track: "Infrastructure", room: "Main stage" },
    { day: D1, start: "14:45", end: "15:30", title: "Panel: What we got wrong", speaker: "Chidi Okeke, Daniel Kim, Maya Fernandes", kind: "panel", room: "Main stage", description: "Three leaders, one stage, and the mistakes they would make again." },
    { day: D1, start: "15:45", end: "17:15", title: "Workshop: Build a retrieval pipeline in 75 minutes", speaker: "Sofia Marin", kind: "workshop", track: "AI & Data", room: "Lab 1", description: "Bring a laptop. We will build, break and fix a retrieval pipeline together." },
    { day: D1, start: "17:30", end: "19:00", title: "Demo hour & networking", kind: "networking", room: "Atrium", description: "Twelve small teams, twelve tables, and nothing on the screen but things that work." },
    { day: D2, start: "09:30", end: "10:00", title: "Coffee", kind: "break", room: "Atrium" },
    { day: D2, start: "10:00", end: "10:45", title: "Keynote: What I would tell my younger team", speaker: "Daniel Kim", kind: "keynote", room: "Main stage" },
    { day: D2, start: "11:00", end: "11:45", title: "Observability without the invoice", speaker: "Ravi Shankar", track: "Infrastructure", room: "Main stage" },
    { day: D2, start: "11:00", end: "11:45", title: "Accessible by default", speaker: "Ananya Bose", track: "Frontend", room: "Stage B" },
    { day: D2, start: "12:00", end: "12:45", title: "Small models, big wins", speaker: "Sofia Marin", track: "AI & Data", room: "Main stage" },
    { day: D2, start: "12:00", end: "12:45", title: "From idea to first ten customers", speaker: "Maya Fernandes", track: "Product", room: "Stage B" },
    { day: D2, start: "12:45", end: "14:00", title: "Lunch", kind: "break", room: "Atrium" },
    { day: D2, start: "14:00", end: "14:45", title: "Ship it: five lightning talks", speaker: "Community speakers", kind: "session", room: "Main stage", description: "Five minutes each, five people who shipped something this year." },
    { day: D2, start: "15:00", end: "15:30", title: "Closing & what’s next", speaker: "The Northstar team", kind: "ceremony", room: "Main stage" },
  ],
  sponsors: [
    { name: "Northstar Cloud", tier: "Presenting partner" },
    { name: "Fieldstone", tier: "Gold partners" }, { name: "Graphene Labs", tier: "Gold partners" },
    { name: "Paperplane", tier: "Community partners" }, { name: "Tidepool", tier: "Community partners" }, { name: "Brightline", tier: "Community partners" }, { name: "Open Hours", tier: "Community partners" },
  ],
  registration: { label: "Register", note: "Registration is open to everyone who builds. Seats are limited." },
  images: { couple: "hero" },
  venues: [
    { key: "orbit", name: "Orbit Convention Centre", address: "ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066", city: "Bengaluru", lat: 12.9857, lng: 77.7367, mapUrl: "https://www.google.com/maps/search/?api=1&query=Whitefield+Bengaluru", airport: "Kempegowda International Airport (BLR) is 48 km away, about 1 hour 20 minutes by road.", railway: "Whitefield Railway Station is 3 km away, about 12 minutes by auto.", road: "From the ITPL Main Road, take the service lane beside the metro station. Follow the signs to Orbit; the delegate entrance is on the north side.", parking: "Delegate parking is in the basement. Bicycle racks are at the north entrance." },
  ],
  events: [
    { name: "Day one — Keynote, tracks & workshop", date: D1, start: "09:45", end: "19:00", venue: "orbit", description: "The opening keynote, two parallel tracks, a lunch in the atrium, a panel, a hands-on workshop and the demo hour.", dress: "Come as you are", colors: ["#0A0E1A", "#7C9CFF", "#5EEAD4"], main: true },
    { name: "Day two — Tracks & lightning talks", date: D2, start: "10:00", end: "15:30", venue: "orbit", description: "A keynote, two more parallel tracks, five lightning talks and the closing.", dress: "Come as you are", colors: ["#0A0E1A", "#7C9CFF", "#5EEAD4"] },
  ],
  rsvp: { deadline: "2026-11-27", pickups: ["Kempegowda International Airport (BLR)", "Whitefield Railway Station"], askMeal: true, askAccommodation: false, askTransport: false, allowCompanions: false, mealOptions: ["Vegetarian", "Non-vegetarian", "Vegan", "No preference"], thankYou: "Thank you, {name}. Your seat is noted — see you in Whitefield." },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  opening: { sealText: "TS", invited: "You are invited to" },
  thankYou: { message: "Thank you for two days of honest talks and good arguments. The recordings are coming soon.\n\nNorthstar Developers", signature: "Northstar Developers" },
  seo: { title: "Tech Summit 2026 — Conference Invitation", description: "A two-day technology summit: speakers, a tracked programme, partners and registration. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "V-pSsJdyHs4", "COUPLE", { focal: { x: 50, y: 35 } }],
    ["venue", "bzdhc5b3Bxs", "VENUE", { focal: { x: 50, y: 45 } }],
    ["s1", "LMWaGpIyOTs", "PEOPLE", { focal: { x: 50, y: 25 } }],
    ["s2", "a0EQFTH4ZfA", "PEOPLE", { focal: { x: 50, y: 30 } }],
    ["s3", "9iLbXsMZ6ls", "PEOPLE", { focal: { x: 50, y: 30 } }],
    ["s4", "ixKxQE29Mn0", "PEOPLE", { focal: { x: 68, y: 40 } }],
    ["s5", "2QDYXAEfFPk", "PEOPLE", { focal: { x: 50, y: 38 } }],
    ["s6", "7TI-3jUObYg", "PEOPLE", { focal: { x: 55, y: 30 } }],
    ["s7", "5gZDLuXQo-M", "PEOPLE", { focal: { x: 50, y: 28 } }],
  ],
  gallery: [
    ["bzdhc5b3Bxs", "A demo on the main stage"], ["Tho4zZM8Vhs", "Working between sessions"], ["Y4uoL2SIGUQ", "A team, in the thick of it"], ["2K1CdpU5ABo", "Pair programming"], ["XZkk5xT8Xrk", "Workshop night"],
  ],
  extra(doc) {
    sectionCopy(doc, "about", { eyebrow: "The conference", title: "Two days. Four tracks. One room." });
    sectionCopy(doc, "speakers", { eyebrow: "On stage", title: "Speakers" });
    sectionCopy(doc, "agenda", { eyebrow: "10 – 11 December", title: "The programme" });
    sectionCopy(doc, "sponsors", { eyebrow: "With thanks", title: "Partners" });
    sectionCopy(doc, "countdown", { eyebrow: "Until the doors open" });
    sectionCopy(doc, "rsvp", { eyebrow: "Registration", title: "Will you be attending?" });
    for (const s of doc.sections) {
      if (s.type === "hero") s.variant = "split";
    }
  },
};
