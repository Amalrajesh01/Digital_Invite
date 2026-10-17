import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/** Anaya & Arnav turn five — a royal birthday for twins in Thiruvananthapuram. Plum and antique gold. English only. */
export const TWINS: OccasionCfg = {
  slug: "anaya-and-arnav-turn-five",
  title: "Anaya & Arnav turn five",
  date: "2027-04-17",
  template: "royal-celebration",
  theme: "plum-gold",
  track: "Two Little Crowns (ambient)",
  eventType: "kids_birthday",
  headline: { title: "Anaya & Arnav", subtitle: "turn five", invitation: "You are invited to a royal birthday for", hosts: "Smitha & Jayan", monogram: "A&A" },
  honoree: { name: "Anaya & Arnav", fullName: "Anaya and Arnav Warrier", role: "Our birthday twins", age: "5" },
  about: {
    eyebrow: "Double the celebration",
    title: "Two birthdays, one very large cake",
    body: "Five years ago two tiny people arrived on the same morning, and neither has agreed on anything since, except cake.\n\nSo this year there is one party for both of them: a royal garden, two crowns, a magician and a cake with two names on it. Little princes and princesses, grown-up knights and everyone in between are welcome.",
    highlights: [["4 pm", "Saturday 17 April", "Please arrive by 3:45"], ["Ages 3–8", "Little royals", "Grown-ups stay too"], ["Two crowns", "One per twin", "And one for you"], ["6 pm", "The last bow", ""]],
  },
  images: { couple: "hero" },
  venues: [
    { key: "lawn", name: "The Orchid Lawn, Palace Gardens", address: "Kowdiar, Thiruvananthapuram, Kerala 695003", city: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, mapUrl: "https://www.google.com/maps/search/?api=1&query=Kowdiar+Thiruvananthapuram", airport: "Trivandrum International Airport — 9 km", parking: "Valet and free parking at the garden gate." },
  ],
  events: [
    { name: "The royal welcome", date: "2027-04-17", start: "16:00", end: "16:30", venue: "lawn", description: "Every guest is given a crown and a place in the court. Anaya and Arnav receive their guests together.", dress: "Royal colours — plum, gold, cream", colors: ["#5B2A4D", "#C8A15A", "#F5EBDD"], photo: "welcome" },
    { name: "The magician and the games", date: "2027-04-17", start: "16:30", end: "17:30", venue: "lawn", description: "A magician who has promised to make exactly one cupcake disappear, then a treasure hunt in the palace garden.", dress: "", colors: [], photo: "games" },
    { name: "The two-name cake", date: "2027-04-17", start: "17:30", end: "18:00", venue: "lawn", description: "Ten candles between them, two wishes and one song sung twice, so nobody feels left out.", dress: "", colors: [], photo: "cake", main: true },
  ],
  rsvp: { deadline: "2027-04-07", askMeal: false, askAccommodation: false, askTransport: false, allowCompanions: true, thankYou: "Thank you, {name}. Anaya and Arnav have saved you a crown!" },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#5B2A4D", "Plum"], ["#C8A15A", "Antique gold"], ["#F5EBDD", "Cream"], ["#8C3B5E", "Rose"]], note: "Royal colours: plum, gold and cream. A crown will be waiting for you." },
  dressAvoid: "Anything you would mind a glitter-covered hug on.",
  looks: [
    { title: "Little princes and princesses", forWhom: "everyone", description: "Plum, gold or cream, with a cape or a crown if you have one. Comfortable shoes: there is a lawn to run on.", colors: ["#5B2A4D", "#C8A15A", "#F5EBDD"] },
  ],
  opening: { sealText: "A&A", invited: "You are invited to a royal birthday" },
  thankYou: { message: "Thank you for being part of the court. The twins are still wearing their crowns to bed.\n\nWith love,", signature: "Anaya, Arnav, Smitha & Jayan", photo: "hero" },
  seo: { title: "Anaya & Arnav turn five — Twins’ Birthday Invitation", description: "A royal birthday invitation for twins, with the party plan at a glance. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "iG98pmgWJMU", "COUPLE", { focal: { x: 52, y: 55 } }],
    ["welcome", "Hli3R6LKibo", "EVENT"],
    ["games", "yxZjTv30tl8", "EVENT"],
    ["cake", "As8zq82LBpw", "EVENT"],
  ],
  gallery: [
    ["iG98pmgWJMU", "Twins, in matching tees"], ["cK6ixOQx1fI", "The wish"], ["As8zq82LBpw", "Everyone helps with the candles"],
    ["Hli3R6LKibo", "The balloon arch"], ["yxZjTv30tl8", "The tiniest guests"], ["ETGJjk9o-48", "Ten candles, two names"],
  ],
  wishes: [
    ["Radha Warrier", "Grandmother", "Two birthdays, two crowns, and one very proud Ammamma. Many happy returns, my loves."],
    ["Dr. Suresh Nair", "Family friend", "Happy fifth, Anaya and Arnav. Thank you for the hour of laughter every time you visit."],
    ["Meenu & Hari", "Neighbours", "We are bringing the loudest present we could find. See you on Saturday!"],
  ],
  extra(doc) {
    sectionCopy(doc, "events", { eyebrow: "Saturday 17 April", title: "The royal programme" });
    sectionCopy(doc, "gallery", { title: "Two crowns, one court" });
  },
};
