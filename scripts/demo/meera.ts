import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/** Meera turns thirty — a luxury birthday on a Bengaluru rooftop. Noir & champagne. English only. */
export const MEERA: OccasionCfg = {
  slug: "meera-turns-thirty",
  title: "Meera turns thirty",
  date: "2027-02-20",
  template: "gala-night",
  theme: "noir-champagne",
  track: "Midnight Champagne (ambient)",
  eventType: "birthday",
  headline: { title: "Meera", subtitle: "turns thirty", invitation: "You are invited to celebrate", hosts: "Rhea & Karan", monogram: "M30", dateLabel: "" },
  honoree: { name: "Meera", fullName: "Meera Iyer", role: "Our birthday girl", age: "30" },
  about: {
    eyebrow: "The woman of the hour",
    title: "Thirty years, in a sentence",
    body: "Thirty years. Three cities. One extraordinary woman who still laughs the loudest at her own jokes.\n\nJoin us for a night of champagne, music and the people who made her who she is. Black tie, a rooftop, the whole skyline — and no speech longer than a song.",
    highlights: [["30", "Years", "and counting"], ["8 pm", "Doors open", "Saturday 20 February"], ["Black tie", "Noir & champagne", ""], ["1 am", "The last dance", ""]],
  },
  images: { couple: "hero", coupleWide: "wide" },
  milestones: [
    ["1997", "The beginning", "Born on a monsoon morning in Kochi, and loud about it from the first minute.", "m1"],
    ["2008", "The first stage", "A school-hall solo, a wobbling microphone and a standing ovation from her grandmother.", "m2"],
    ["2015", "The big move", "One suitcase, one scholarship, one city that did not know what was coming.", "m3"],
    ["2020", "The leap", "Quit the safe job, opened her own studio, never looked back.", "m4"],
    ["2027", "Thirty", "A rooftop, a skyline and everyone she loves.", "m5"],
  ],
  venues: [
    { key: "terrace", name: "The Terrace at Skyline House", address: "12th Floor, Skyline House, Vittal Mallya Road, Bengaluru 560001", city: "Bengaluru", lat: 12.9716, lng: 77.5946, mapUrl: "https://www.google.com/maps/search/?api=1&query=Vittal+Mallya+Road+Bengaluru", photo: "venue", airport: "Kempegowda International Airport (BLR) is 38 km away — about 1 hour by car; allow longer at night-time traffic.", railway: "Bengaluru City Junction is 6 km away, about 25 minutes.", road: "Enter from Vittal Mallya Road. The lifts to the terrace are in the lobby on your left; the doorman will show you.", parking: "Valet parking is complimentary at the main entrance." },
  ],
  events: [
    { name: "Doors & champagne", date: "2027-02-20", start: "20:00", end: "21:00", venue: "terrace", description: "Arrive, find your drink and your friends. The skyline does the rest.", dress: "Black tie — noir & champagne", colors: ["#0F0E0D", "#D8BE82", "#F0EADD"], photo: "toast" },
    { name: "Dinner", date: "2027-02-20", start: "21:00", end: "22:30", venue: "terrace", description: "A seated, candle-lit dinner for sixty — five courses, no menus, all of it by Meera’s favourite chef.", dress: "As above", colors: ["#0F0E0D", "#D8BE82"], photo: "dinner", main: true },
    { name: "The toast & the cake", date: "2027-02-20", start: "22:30", end: "23:00", venue: "terrace", description: "A few words, a very large cake and thirty candles. Please hold your phones up for the fireworks, not the speeches.", dress: "", colors: [], photo: "cake" },
    { name: "Dancing", date: "2027-02-20", start: "23:00", end: "01:00", venue: "terrace", description: "The floor opens at eleven. The DJ has been told to play whatever Meera shouts for.", dress: "", colors: [], photo: "dance" },
  ],
  rsvp: { deadline: "2027-02-06", askMeal: true, askAccommodation: false, askTransport: false, allowCompanions: true, mealOptions: ["Vegetarian tasting menu", "Non-vegetarian tasting menu"], thankYou: "Thank you, {name}. See you on the roof." },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#0F0E0D", "Noir"], ["#D8BE82", "Champagne"], ["#F0EADD", "Ivory"], ["#8A2432", "Garnet"]], note: "Evening black, with champagne or garnet as your accent." },
  looks: [
    { title: "Evening gown or tailored jumpsuit", forWhom: "women", description: "Floor-length or sharp and tailored — jewel tones and metallics welcome. The terrace is warm, but a wrap is wise after midnight.", colors: ["#0F0E0D", "#D8BE82", "#8A2432"] },
    { title: "Dinner jacket", forWhom: "men", description: "Black tie. A velvet jacket in garnet or midnight is entirely welcome.", colors: ["#0F0E0D", "#F0EADD"] },
  ],
  dressAvoid: "Anything you would not dance in until one in the morning.",
  opening: { sealText: "M", invited: "You are invited to celebrate" },
  thankYou: { message: "Thank you for the champagne, the speeches that stayed short and the dancing that did not.\n\nWith love,", signature: "Meera", photo: "hero" },
  seo: { title: "Meera turns thirty — Birthday Invitation", description: "A luxury milestone-birthday invitation: noir, champagne and a rooftop. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "aHJ0hciTzG4", "COUPLE", { focal: { x: 50, y: 28 } }],
    ["wide", "u2tgn9AA5uY", "COUPLE", { focal: { x: 35, y: 45 } }],
    ["venue", "EGDqdOwzGJo", "VENUE"],
    ["toast", "ch4Fc1cGTq4", "EVENT"],
    ["dinner", "PyL-lApI1F8", "EVENT"],
    ["cake", "UJynGW4gF-I", "EVENT"],
    ["dance", "vRa4PuRCW18", "EVENT"],
    ["m1", "ETGJjk9o-48", "COUPLE"],
    ["m2", "XKCo9N6gyS4", "COUPLE"],
    ["m3", "OYIMPsTYVbQ", "COUPLE"],
    ["m4", "6ciLddToTgM", "COUPLE"],
    ["m5", "F-q2-0GmtPU", "COUPLE"],
  ],
  gallery: [
    ["ch4Fc1cGTq4", "A toast in the afternoon sun"], ["csK5XPO87lI", "The pergola, lit for the evening"], ["u2tgn9AA5uY", "Sunset, before the night begins"], ["UJynGW4gF-I", "Thirty, in sugar roses"],
    ["vRa4PuRCW18", "The rooftop floor"], ["hDzql_ITjmY", "Dinner for the people she loves"], ["XKCo9N6gyS4", "A sparkler for the countdown"], ["H7JlEmkKqW8", "Pink, for the afternoon"],
    ["OYIMPsTYVbQ", "The harbour, a glass in hand"], ["F-q2-0GmtPU", "Make a wish"],
  ],
  wishes: [
    ["Anjali Rao", "Oldest friend", "Thirty! The girl who cried at her own school-hall solo is now running a studio and a skyline. I am so proud of you, Meera."],
    ["Karan Malhotra", "Friend", "To Meera: still the loudest laugh in every room I have ever been in. Cannot wait for the roof."],
    ["Zoya Khan", "Colleague", "Thank you for turning thirty in such good company. The dress code has made me buy my first velvet jacket."],
  ],
  extra(doc) {
    sectionCopy(doc, "timeline", { eyebrow: "Thirty years", title: "In moments" });
    sectionCopy(doc, "events", { eyebrow: "Saturday 20 February", title: "The night" });
    sectionCopy(doc, "venue", { title: "The rooftop" });
    sectionCopy(doc, "countdown", { eyebrow: "Until the doors open" });
    for (const s of doc.sections) {
      if (s.type === "hero") s.variant = "fullbleed";
    }
  },
};
