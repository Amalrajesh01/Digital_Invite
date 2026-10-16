import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/** Onam at a Bengaluru residents' association — a community festival invitation. Marigold on night. English only. */
export const ONAM: OccasionCfg = {
  slug: "onam-celebration",
  title: "Onam at Green Meadows",
  date: "2026-12-12",
  template: "festival-lights",
  theme: "midnight-marigold",
  track: "Thiruvathira (ambient)",
  eventType: "festival",
  headline: { title: "Onam at Green Meadows", subtitle: "pookalam, sadya and a very long tug-of-war", invitation: "You and your family are invited to", hosts: "The Green Meadows Residents’ Association", monogram: "GM", dateLabel: "" },
  honoree: { name: "Green Meadows", fullName: "Green Meadows Residents’ Association", role: "Hosts", age: "" },
  about: {
    eyebrow: "One society, one table",
    title: "Come as you are, leave full",
    body: "Every year the whole society lays one long table. Mallu or not, new or old — bring a dish, a chair and anyone who is hungry.\n\nThere is a pookalam to make, a sadya to eat and, as always, a tug-of-war that the second tower has not won in seven years.",
    highlights: [["10 am", "Saturday 12 December", "Pookalam begins"], ["1 pm", "Onam sadya", "On banana leaves"], ["5 pm", "Tug-of-war", "Towers 1 to 4"]],
  },
  images: { couple: "hero" },
  venues: [
    { key: "clubhouse", name: "The Green Meadows Clubhouse lawn", address: "Sarjapur Road, Bengaluru, Karnataka 560035", city: "Bengaluru", lat: 12.9141, lng: 77.6870, mapUrl: "https://www.google.com/maps/search/?api=1&query=Sarjapur+Road+Bengaluru", airport: "Kempegowda International Airport (BLR) is 52 km away.", railway: "Bengaluru City Junction is 20 km away.", road: "Enter by Gate 2 on Sarjapur Road; the clubhouse lawn is straight ahead.", parking: "Visitor parking at Gate 2. Residents: please walk." },
  ],
  events: [
    { name: "Pookalam", date: "2026-12-12", start: "10:00", end: "12:30", venue: "clubhouse", description: "Every family brings a bag of flowers. Together we make a circle that will cover the lawn.", dress: "Kerala saree or mundu if you have one", colors: ["#FFF3DA", "#F4A62A", "#FF7A3D"], photo: "rangoli" },
    { name: "Onam sadya", date: "2026-12-12", start: "13:00", end: "15:00", venue: "clubhouse", description: "Twenty-one dishes on banana leaves, served by volunteers from all four towers.", dress: "", colors: [], photo: "sadya", main: true },
    { name: "Games and cultural programme", date: "2026-12-12", start: "16:00", end: "18:30", venue: "clubhouse", description: "Kids’ races, thiruvathira, a mimicry act that gets longer each year and the tug-of-war.", dress: "", colors: [], photo: "stage" },
    { name: "Lamp-lighting and dinner", date: "2026-12-12", start: "18:30", end: "21:00", venue: "clubhouse", description: "Lamps around the pookalam, music and a light dinner.", dress: "", colors: [], photo: "aarti" },
  ],
  ceremoniesIntro: "For newcomers, a few Onam traditions you will see on the day.",
  ceremonies: [
    ["Pookalam", "10:00 am", "A floral carpet laid at the doorstep to welcome King Mahabali. Each ring has its own colour.", "flower", "rangoli"],
    ["Onam sadya", "1:00 pm", "A feast of twenty-one dishes served on a banana leaf, always eaten sitting on the floor.", "bowl", "sadya"],
    ["Thiruvathira", "4:30 pm", "A slow, circling dance performed by women around a lit lamp.", "lamp", "stage"],
    ["Lamp lighting", "6:30 pm", "As night falls, the pookalam is lit with lamps and everyone sings together.", "flame", "aarti"],
  ],
  sponsors: [{ name: "Prestige Greens Foundation", tier: "Principal supporter" }, { name: "Malabar Spice House", tier: "Sadya partner" }, { name: "Little Wheels Bakery", tier: "Dessert partner" }],
  rsvp: { deadline: "2026-12-05", askMeal: true, askAccommodation: false, askTransport: false, allowCompanions: true, mealOptions: ["Vegetarian sadya", "Sadya with fish"], thankYou: "Thank you, {name}. We will keep a leaf for you." },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  opening: { sealText: "GM", invited: "You and your family are invited to" },
  thankYou: { message: "Thank you for coming, cooking, carrying and cleaning. See you next Onam.\n\nThe Green Meadows Residents’ Association", signature: "The Residents’ Association", photo: "hero" },
  seo: { title: "Onam at Green Meadows — Invitation", description: "A community festival invitation with the day’s programme. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "wc-145136685", "COUPLE", { focal: { x: 50, y: 45 } }],
    ["rangoli", "wc-133359284", "EVENT"],
    ["sadya", "wc-152617626", "EVENT"],
    ["stage", "UX3-_dGbCzk", "EVENT"],
    ["aarti", "wc-162739830", "EVENT", { focal: { x: 50, y: 40 } }],
  ],
  gallery: [
    ["wc-133359284", "Lighting the pookalam"], ["wc-152617626", "The sadya"], ["UX3-_dGbCzk", "The stage, lit with marigold"], ["wc-145136685", "The evening aarti"],
    ["b9xLrj7w2AY", "Walking in together"], ["Zx9In5UiU0w", "A lotus and a smile"], ["wc-97312069", "A doorstep of lamps"], ["SiMzEeMrX2E", "The youngest guest, garlanded"],
  ],
  wishes: [
    ["Indu Nair", "Tower 3", "Last year’s payasam is still on my mind. Count us in."],
    ["Mahesh Gowda", "Tower 2", "This is the year we win the tug-of-war."],
  ],
  extra(doc) {
    sectionCopy(doc, "about", { eyebrow: "One society, one table" });
    sectionCopy(doc, "events", { eyebrow: "Saturday 12 December", title: "The day" });
    sectionCopy(doc, "ceremonies", { eyebrow: "Onam traditions", title: "A newcomer’s guide" });
    sectionCopy(doc, "sponsors", { eyebrow: "With thanks to", title: "Our supporters" });
  },
};
