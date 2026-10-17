import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/** Ira turns one — a soft garden lunch for a first birthday in Kozhikode. Peach, cream and leaf green. English only. */
export const IRA: OccasionCfg = {
  slug: "ira-turns-one",
  title: "Ira turns one",
  date: "2027-03-14",
  template: "garden-party",
  theme: "peach-garden",
  track: "Little Lullaby (ambient)",
  eventType: "kids_birthday",
  headline: { title: "Ira", subtitle: "turns one", invitation: "Please join us to celebrate", hosts: "Neha & Rohan", monogram: "I1" },
  honoree: { name: "Ira", fullName: "Ira Menon", role: "Our little one", age: "1" },
  about: {
    eyebrow: "Our first year",
    title: "One year, and every day a first",
    body: "A year ago a very small person arrived and rearranged our whole house. She has since learned to clap, to crawl at speed and to wave at everyone, including the postman.\n\nCome and share a slow garden lunch with us. There will be a soft blessing, a very small cake and plenty of cushions on the lawn. Bring your own little ones; there is a quiet room for naps.",
    highlights: [["12 noon", "Sunday 14 March", "Please arrive by 11:45"], ["Under 5s", "Welcome", "Cushions and a nap room"], ["Garden lunch", "Vegetarian", "Allergies noted at RSVP"], ["No gifts", "Your company is plenty", "Truly"]],
  },
  images: { couple: "hero" },
  venues: [
    { key: "garden", name: "The Rose Courtyard", address: "Beach Road, Kozhikode, Kerala 673032", city: "Kozhikode", lat: 11.2588, lng: 75.7804, mapUrl: "https://www.google.com/maps/search/?api=1&query=Beach+Road+Kozhikode", airport: "Calicut International Airport — 30 km", parking: "Free parking beside the courtyard gate." },
  ],
  events: [
    { name: "Welcome and blessings", date: "2027-03-14", start: "12:00", end: "12:30", venue: "garden", description: "The elders bless Ira and she tries, once again, to eat the flowers.", dress: "Soft pastels", colors: ["#F5C9A8", "#FBEFE3", "#B9D3A8"], photo: "garden" },
    { name: "The first cake", date: "2027-03-14", start: "12:30", end: "13:00", venue: "garden", description: "One candle, one very small cake and a great deal of clapping. Ira will help with the icing.", dress: "", colors: [], photo: "cake", main: true },
    { name: "Garden lunch", date: "2027-03-14", start: "13:00", end: "15:00", venue: "garden", description: "A vegetarian lunch laid out under the trees, with a corner of toys for the very young.", dress: "", colors: [], photo: "balloons" },
  ],
  rsvp: { deadline: "2027-03-04", askMeal: false, askAccommodation: false, askTransport: false, allowCompanions: true, thankYou: "Thank you, {name}. Ira will save you a cushion!" },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#F5C9A8", "Peach"], ["#FBEFE3", "Cream"], ["#B9D3A8", "Leaf"], ["#E9A18F", "Coral"]], note: "Soft garden pastels. Flat shoes for the lawn." },
  dressAvoid: "Anything you would mind a tiny sticky hand touching.",
  looks: [{ title: "Garden pastels", forWhom: "everyone", description: "Peach, cream and soft green. Flat shoes for the lawn, and something you can sit on the grass in.", colors: ["#F5C9A8", "#FBEFE3", "#B9D3A8"] }],
  message: {
    title: "A note from Ira’s parents",
    body: "Dear family and friends,\n\nThank you for every phone call, every borrowed pram and every 3 a.m. piece of advice this year. We could not have done any of it without you.\n\nSo come on a Sunday, eat well and watch one small person be thoroughly the centre of attention. We would love to see you.",
    from: "Neha & Rohan", role: "Ira’s mummy and papa",
  },
  opening: { sealText: "I", invited: "Please join us to celebrate" },
  thankYou: { message: "Thank you for filling our garden with clapping. Ira has not stopped waving since.\n\nWith love,", signature: "Ira, Neha & Rohan", photo: "hero" },
  seo: { title: "Ira turns one — First Birthday Invitation", description: "A soft garden invitation for a first birthday, with a note from the parents. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "ybvTwLSBtSY", "COUPLE", { focal: { x: 60, y: 70 } }],
    ["garden", "4KkTFccuZ0M", "VENUE"],
    ["cake", "ETGJjk9o-48", "EVENT"],
    ["balloons", "Hli3R6LKibo", "EVENT"],
  ],
  gallery: [
    ["zx0Xt9u1ekw", "Tiny feet, big year"], ["saW6YxGBFkw", "A heart in two hands"], ["I8Ik4L3lPrs", "Twelve months of mischief"],
    ["ETGJjk9o-48", "One candle"], ["4KkTFccuZ0M", "The courtyard, ready for Sunday"], ["Hli3R6LKibo", "The balloons"],
  ],
  wishes: [
    ["Latha Menon", "Grandmother", "Our little Ira is one! Valyamma has already booked the front cushion."],
    ["Dr. Priya Nair", "Family friend", "Happy first birthday, Ira. Thank you for making your parents the happiest tired people I know."],
    ["Faisal & Amina", "Neighbours", "See you on Sunday. We are bringing a very noisy rattle, with apologies."],
  ],
  extra(doc) {
    sectionCopy(doc, "events", { eyebrow: "Sunday 14 March", title: "The day" });
    sectionCopy(doc, "message", { eyebrow: "A note from home" });
    sectionCopy(doc, "gallery", { title: "Twelve months, in pictures" });
  },
};
