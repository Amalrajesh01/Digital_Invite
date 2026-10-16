import { sectionCopy, type ShowcaseCfg } from "./showcase";

/** Nandini & Vikram — a garden wedding in Coorg. Sage, blossom and a handwritten hand. English only. */
export const NANDINI: ShowcaseCfg = {
  slug: "nandini-and-vikram",
  title: "Nandini & Vikram",
  date: "2027-04-10",
  template: "garden-romance",
  theme: "sage-blossom",
  track: "Morning Light (ambient)",
  eventType: "wedding",
  journey: { style: "classic", headZoom: { bride: 1.4, groom: 1.4 } },
  images: { couple: "hero", story: "story" },
  bride: { name: "Nandini", fullName: "Nandini Hegde", parents: "Daughter of Mr. Ramesh & Mrs. Sunitha Hegde, Mysuru", bio: "A botanist who talks to her plants and is firmly convinced they answer. She says yes to every trek and no to every spreadsheet.", photo: "bride" },
  groom: { name: "Vikram", fullName: "Vikram Shetty", parents: "Son of Mr. Prakash & Mrs. Anitha Shetty, Mangaluru", bio: "A landscape architect who cannot walk past a bare wall without planning a garden on it. He cooks a very serious pulao and will wait for you to say so.", photo: "groom" },
  tagline: "Two gardeners, one very long walk.",
  invitation: "Together with their families",
  quote: { text: "To plant a garden is to believe in tomorrow.", author: "Audrey Hepburn" },
  hashtag: "NandiniAndVikramGrow",
  monogram: "NV",
  venues: [
    { key: "garden", name: "The Mist Garden Resort", address: "Galibeedu Road, Madikeri, Coorg, Karnataka 571201", city: "Madikeri", lat: 12.4244, lng: 75.7382, mapUrl: "https://www.google.com/maps/search/?api=1&query=Madikeri+Coorg", photo: "garden", airport: "Mangaluru International Airport (IXE) is 135 km away, about 3 hours 30 minutes by road.", railway: "Mysuru Junction is 120 km away, about 3 hours by road.", road: "From Madikeri town take the Galibeedu road for 6 km; the resort gate is marked with a tall silver oak and a signboard.", parking: "Parking is inside the gate, under the coffee trees. A buggy runs from the lot to the lawn." },
  ],
  events: [
    { name: "Haldi brunch", date: "2027-04-09", start: "10:30", end: "13:00", venue: "garden", description: "A slow brunch on the lawn, a little turmeric, and a lot of laughing.", dress: "Yellow, white and every shade of green", colors: ["#F3D26B", "#FFFFFF", "#7C9A6E"], photo: "tea" },
    { name: "The wedding", date: "2027-04-10", start: "16:30", end: "17:45", venue: "garden", description: "Under the silver oak, with the hills behind us. Please be seated by 4:15.", dress: "Soft pastels — sage, blush and ivory", colors: ["#B7C9AE", "#E8C7C0", "#FBF7EE"], photo: "ceremony", main: true },
    { name: "Dinner under the stars", date: "2027-04-10", start: "19:30", end: "23:00", venue: "garden", description: "A long table among the lanterns, a Coorgi feast and a dance floor on the grass.", dress: "As above, with a shawl — the hills get cool after dark", colors: ["#B7C9AE", "#E8C7C0"], photo: "table" },
  ],
  family: { brideName: "The Hegde family", groomName: "The Shetty family", members: [["bride", "Mr. Ramesh Hegde", "Father of the bride"], ["bride", "Mrs. Sunitha Hegde", "Mother of the bride"], ["groom", "Mr. Prakash Shetty", "Father of the groom"], ["groom", "Mrs. Anitha Shetty", "Mother of the groom"]] },
  intro: "She tends a greenhouse.\nHe draws gardens on paper.\nThey met over a bed of marigolds.\nAnd decided to grow old together.",
  milestones: [
    ["2021", "A bed of marigolds", "She was repotting; he was lost. He stayed to hold the watering can.", "m1"],
    ["2023", "The long walk", "A twelve-kilometre trek, one bad map and the easiest decision of their lives.", "m2"],
    ["2025", "A ring in the greenhouse", "Among the ferns, with the sprinklers on — he had not planned that part.", "m3"],
    ["2027", "The wedding", "10 April, in the hills, under the silver oak.", "m4"],
  ],
  ceremoniesIntro: "A few small rituals, in the open air. Everyone is welcome to join in.",
  ceremonies: [
    ["Planting a sapling", "4:30 pm", "Before the ceremony the two families plant a young silver oak together — a tree that will outlive all of us.", "flower"],
    ["Exchange of garlands", "5:00 pm", "Nandini and Vikram garland each other under the oak, with the family’s blessing.", "knot"],
    ["Saptapadi", "5:15 pm", "Seven steps together, each with a promise — read aloud in English and Kannada.", "flame"],
    ["Blessings", "5:40 pm", "The elders bless the couple with akshate, and everyone throws petals.", "bowl"],
  ],
  rsvp: { deadline: "2027-03-20", pickups: ["Mysuru Junction", "Madikeri bus stand"], whatsapp: "" },
  whatsapp: "917356741055",
  whatsappMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#B7C9AE", "Sage"], ["#E8C7C0", "Blush"], ["#FBF7EE", "Ivory"], ["#F3D26B", "Turmeric"]], note: "Soft garden colours — sage, blush and ivory." },
  dressAvoid: "Black, please — the garden wants to look bright.",
  opening: { variant: "bloom", sealText: "NV", invited: "You are invited to the wedding of" },
  thankYou: { message: "Thank you for walking up the hill, for the blessings and the petals. The sapling is doing well.\n\nWith love,", signature: "Nandini & Vikram", photo: "hero" },
  seo: { title: "Nandini & Vikram — Wedding Invitation", description: "A garden wedding in Coorg. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "xXHyI3ZRByo", "COUPLE", { focal: { x: 50, y: 55 } }],
    ["bride", "IiGkUvXXbig", "BRIDE", { focal: { x: 50, y: 28 } }],
    ["groom", "gXWVyFpRCRU", "GROOM", { focal: { x: 50, y: 30 } }],
    ["story", "NNNRQgsQXpE", "COUPLE", { focal: { x: 45, y: 50 } }],
    ["garden", "csK5XPO87lI", "VENUE"],
    ["ceremony", "Gw2ODMZDeK4", "EVENT"],
    ["tea", "hDzql_ITjmY", "EVENT"],
    ["table", "YKBT8rRAzpU", "EVENT"],
    ["m1", "LQoCpIagZmc", "COUPLE"],
    ["m2", "IjdzkDxKjc4", "COUPLE"],
    ["m3", "SHFOaVaVe2A", "COUPLE"],
    ["m4", "d-jyMeP6uNQ", "COUPLE"],
  ],
  gallery: [
    ["SHFOaVaVe2A", "A forest path, the first of many"], ["d-jyMeP6uNQ", "By the river"], ["IjdzkDxKjc4", "Through the tall grass"], ["TLBDWV7RRYI", "Among the autumn leaves"],
    ["QoBHQuiu9N0", "Towards the sun"], ["hYkOoi7z9sA", "The tables, before the guests"], ["PzmfTLaqPT0", "Calla lilies, tied with ribbon"], ["z96DMIRABU0", "Under the white arch"],
  ],
  wishes: [
    ["Meenal Rao", "Cousin", "I have seen you both plant, water and weed together. Looking forward to the harvest!"],
    ["Karthik Bhat", "College friend", "The sapling better be watered. Congratulations, you two."],
  ],
  extra(doc) {
    sectionCopy(doc, "story", { eyebrow: "How it grew" });
    sectionCopy(doc, "events", { eyebrow: "Two days in the hills", title: "The days" });
    sectionCopy(doc, "ceremonies", { eyebrow: "In the open air", title: "What will happen" });
  },
};
