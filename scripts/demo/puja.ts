import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/** A family Satyanarayana Puja in Chennai — a quiet, devotional invitation. Saffron and sandalwood. English only. */
export const PUJA: OccasionCfg = {
  slug: "satyanarayana-puja",
  title: "Sri Satyanarayana Puja",
  date: "2027-01-17",
  template: "sacred-lamp",
  theme: "saffron-deep",
  track: "Temple Morning (ambient)",
  eventType: "religious_ceremony",
  headline: { title: "Sri Satyanarayana Puja", subtitle: "a morning of prayer at the Iyer home", invitation: "You are invited to", hosts: "The Iyer family", monogram: "SP", dateLabel: "" },
  honoree: { name: "The Iyer family", fullName: "The Iyer family", role: "Hosts", age: "" },
  about: {
    eyebrow: "A day of thanks",
    title: "Please join us in prayer",
    body: "Every year, on the first Sunday after Makar Sankranti, our family sits together for the Satyanarayana Puja — to thank for the year that has passed and to ask for the one ahead.\n\nThe puja takes about two hours. Children are welcome, and so is anyone who would rather just sit and listen. Prasad and lunch follow.",
    highlights: [["9:30 am", "Sunday 17 January", "Puja begins"], ["2 hours", "Approximately", "With the katha"], ["Prasad", "And lunch", "Served at noon"]],
  },
  images: { couple: "hero" },
  venues: [
    { key: "home", name: "The Iyer residence", address: "12, Kutchery Road, Mylapore, Chennai, Tamil Nadu 600004", city: "Chennai", lat: 13.0339, lng: 80.2619, mapUrl: "https://www.google.com/maps/search/?api=1&query=Mylapore+Chennai", airport: "Chennai International Airport (MAA) is 15 km away, about 40 minutes by car.", railway: "Mylapore MRTS station is 1 km away, a 10-minute walk.", road: "From the Kapaleeshwarar temple tank, take Kutchery Road for 400 m; the house is the one with the kolam at the gate.", parking: "Please park along Kutchery Road, or at the tank car park, two minutes away." },
  ],
  events: [
    { name: "Sankalpam and kalasha puja", date: "2027-01-17", start: "09:30", end: "10:15", venue: "home", description: "The family states its intention and invites the divine presence into the kalasha.", dress: "Traditional", colors: ["#FFF7E8", "#E39B1A", "#B5470D"], photo: "fire", main: true },
    { name: "Satyanarayana katha", date: "2027-01-17", start: "10:15", end: "11:30", venue: "home", description: "The five chapters of the katha are read aloud; guests may listen or join in the responses.", dress: "", colors: [], photo: "aarti" },
    { name: "Aarti and prasad", date: "2027-01-17", start: "11:30", end: "12:00", venue: "home", description: "The aarti closes the puja, and prasad is shared with everyone.", dress: "", colors: [], photo: "lamps" },
    { name: "Lunch", date: "2027-01-17", start: "12:00", end: "14:00", venue: "home", description: "A simple vegetarian lunch on banana leaves.", dress: "", colors: [], photo: "sadya" },
  ],
  ceremoniesIntro: "For guests who have not attended before, here is what happens during the puja.",
  ceremonies: [
    ["Sankalpam", "9:30 am", "The head of the household states the purpose of the puja, the date and the family’s names before the deity.", "knot", "fire"],
    ["Kalasha puja", "9:45 am", "A brass pot of water, mango leaves and a coconut is worshipped as the seat of the deity.", "kalash", "fire"],
    ["The katha", "10:15 am", "Five short chapters tell why the vow is kept. After each chapter, the guests respond together.", "flower", "aarti"],
    ["Aarti and prasad", "11:30 am", "A lamp is waved before the deity, and sweet prasad of semolina and banana is shared.", "lamp", "lamps"],
  ],
  rsvp: { deadline: "2027-01-10", askMeal: true, askAccommodation: false, askTransport: false, allowCompanions: true, mealOptions: ["Vegetarian lunch"], thankYou: "Thank you, {name}. We look forward to praying with you." },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  prayer: {
    title: "Om Namo Narayanaya",
    text: "Om Satyanarayanaaya Vidmahe\nVishnu Devaaya Dheemahi\nTanno Vishnu Prachodayat",
    source: "The Satyanarayana gayatri",
  },
  message: {
    title: "A note from the family",
    body: "Dear family and friends,\n\nWe are grateful for every one of you. Please come with an open heart; no gifts, no flowers — only your presence and your blessings.",
    from: "Srinivasan & Lalitha Iyer", role: "and family",
  },
  opening: { sealText: "SP", invited: "You are invited to" },
  thankYou: { message: "Thank you for sitting with us. May the blessings of the puja stay with you through the year.\n\nWith folded hands,", signature: "The Iyer family", photo: "hero" },
  seo: { title: "Sri Satyanarayana Puja — Invitation", description: "A devotional puja invitation with each rite explained. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "wc-146118873", "COUPLE", { focal: { x: 50, y: 30 } }],
    ["fire", "wc-146118873", "EVENT", { focal: { x: 50, y: 30 } }],
    ["aarti", "wc-162739830", "EVENT", { focal: { x: 50, y: 40 } }],
    ["lamps", "zNY2lVIRh7M", "EVENT"],
    ["sadya", "wc-40896574", "EVENT"],
  ],
  gallery: [
    ["wc-146118873", "The sacred fire"], ["wc-145136685", "Evening aarti"], ["zNY2lVIRh7M", "Three lamps"], ["WciKbLIFGxc", "Prasad and kumkum"],
    ["df6Z3DPPw5U", "A lamp in the dark"], ["wc-97312069", "Lamps at the doorstep"], ["wc-145089568", "Preparing for the puja"], ["wc-152617626", "Lunch after the puja"],
  ],
  wishes: [
    ["Vasanthi Raman", "Neighbour", "We have prayed together for twenty years. This year again, with joy."],
    ["Krishnan Subramanian", "Family friend", "Shall bring the flowers, whatever you say."],
  ],
  extra(doc) {
    sectionCopy(doc, "about", { eyebrow: "A day of thanks" });
    sectionCopy(doc, "ceremonies", { eyebrow: "The rites", title: "What happens during the puja" });
    sectionCopy(doc, "events", { eyebrow: "Sunday 17 January", title: "The morning" });
    sectionCopy(doc, "prayer", { eyebrow: "The gayatri", title: "To be said together" });
  },
};
