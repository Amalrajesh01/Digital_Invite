import { sectionCopy, type ShowcaseCfg } from "./showcase";

/** Tara & Nikhil — an engagement with a ring ceremony in Kochi. Mulberry and champagne. English only. */
export const TARA: ShowcaseCfg = {
  slug: "tara-and-nikhil",
  title: "Tara & Nikhil",
  date: "2027-02-13",
  template: "romance",
  theme: "peony-champagne",
  track: "Slow Dance (ambient)",
  eventType: "engagement",
  journey: { style: "classic", headZoom: { bride: 3.5, groom: 3.6 } },
  images: { couple: "hero", story: "story" },
  bride: { name: "Tara", fullName: "Tara Raghavan", parents: "Daughter of Mr. Mohan & Mrs. Radha Raghavan, Kochi", bio: "A paediatric dentist who has never once been scolded by a child and rarely by anyone else. She plans every holiday with a spreadsheet and abandons it by day two.", photo: "bride" },
  groom: { name: "Nikhil", fullName: "Nikhil Varma", parents: "Son of Mr. Suresh & Mrs. Geetha Varma, Thrissur", bio: "A civil engineer who builds bridges for a living and cannot build a flat-pack wardrobe. He makes the best filter coffee in two districts and will tell you so himself.", photo: "groom" },
  tagline: "A wrong turn, a cup of tea, and a very good question.",
  invitation: "Together with their families",
  quote: { text: "I have found the one whom my soul loves.", author: "Song of Solomon 3:4" },
  hashtag: "TaraSaidYes",
  monogram: "TN",
  venues: [
    { key: "pavilion", name: "The Lotus Pavilion", address: "Vyttila Junction, Kochi, Kerala 682019", city: "Kochi", lat: 9.9677, lng: 76.3184, mapUrl: "https://www.google.com/maps/search/?api=1&query=Vyttila+Kochi", airport: "Cochin International Airport (COK) is 28 km away, about 50 minutes by car.", railway: "Ernakulam South is 6 km away, about 20 minutes.", road: "At Vyttila hub, take the service road beside the metro station; the pavilion is behind the lotus pond, 300 m ahead.", parking: "Parking is at the hub ground, two minutes’ walk. A buggy runs for elders." },
  ],
  events: [
    { name: "Mehendi evening", date: "2027-02-12", start: "17:00", end: "20:00", venue: "pavilion", description: "Henna, bangles and music with the women of both families — and anyone brave enough to try the dance.", dress: "Festive pastels", colors: ["#F4D9D3", "#C4A07A", "#FBF4F0"], photo: "mehendi" },
    { name: "The ring ceremony", date: "2027-02-13", start: "11:00", end: "12:30", venue: "pavilion", description: "The elders bless the couple and the rings are exchanged. Please be seated by 10:45.", dress: "Traditional — blush, champagne and ivory", colors: ["#F4D9D3", "#C4A07A", "#8C4457"], photo: "rings", main: true },
    { name: "Celebration lunch", date: "2027-02-13", start: "13:00", end: "15:30", venue: "pavilion", description: "A sit-down lunch for everyone, with a sadhya for the elders and a long table of sweets for the rest of us.", dress: "As above", colors: ["#FBF4F0", "#C4A07A"] },
  ],
  family: { brideName: "The Raghavan family", groomName: "The Varma family", members: [["bride", "Mr. Mohan Raghavan", "Father of the bride"], ["bride", "Mrs. Radha Raghavan", "Mother of the bride"], ["groom", "Mr. Suresh Varma", "Father of the groom"], ["groom", "Mrs. Geetha Varma", "Mother of the groom"]] },
  intro: "A wrong turn on a hill road.\nA cup of tea that outlasted the rain.\nThree years of small, sure choices.\nAnd then, one question.",
  milestones: [
    ["2023", "A wrong turn", "He was lost. She was the only person at the viewpoint who knew the way back.", "m1"],
    ["2024", "A cup of tea", "It rained for three hours. They were still talking when it stopped.", "m2"],
    ["2026", "Sunrise at the viewpoint", "The same bend in the road, the same hill, a ring in his pocket.", "m3"],
    ["2027", "The engagement", "13 February — with the people who cheered us on.", "m4"],
  ],
  ceremoniesIntro: "The ring ceremony is short and warm. Here is what to expect, so every guest can follow along.",
  ceremonies: [
    ["Lighting the lamp", "11:00 am", "The eldest of both families light the lamp together as a blessing for the day.", "lamp"],
    ["Blessings of the elders", "11:15 am", "Each elder places a hand on the couple’s heads and offers a few words.", "flower"],
    ["Exchange of rings", "11:40 am", "Tara and Nikhil exchange rings, and the two families exchange sweets.", "rings", "rings"],
    ["Gifts & sweets", "12:10 pm", "Families exchange small gifts, and everyone shares a sweet.", "bowl"],
  ],
  rsvp: { deadline: "2027-01-30", pickups: ["Cochin International Airport (COK)", "Ernakulam South Railway Station"], whatsapp: "" },
  whatsapp: "917356741055",
  whatsappMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#F4D9D3", "Blush"], ["#C4A07A", "Champagne"], ["#8C4457", "Mulberry"], ["#FBF4F0", "Ivory"]], note: "Festive pastels — blush, champagne and ivory, with a touch of mulberry if you like." },
  dressAvoid: "Black and bright white, please.",
  opening: { variant: "envelope", sealText: "TN", invited: "You are invited to the engagement of" },
  thankYou: { message: "Thank you for the blessings, the henna, the rings and the sweets. We are glad you were there.\n\nWith love,", signature: "Tara & Nikhil", photo: "hero" },
  seo: { title: "Tara & Nikhil — Engagement Invitation", description: "A romantic engagement invitation with the ring ceremony explained. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "1dzXfvALJxs", "COUPLE", { focal: { x: 49, y: 40 } }],
    ["bride", "1dzXfvALJxs", "BRIDE", { focal: { x: 51, y: 35 } }],
    ["groom", "1dzXfvALJxs", "GROOM", { focal: { x: 57.5, y: 20 } }],
    ["story", "AD3k4pko7wo", "COUPLE", { focal: { x: 45, y: 28 } }],
    ["mehendi", "K2JtyCVdeuQ", "EVENT"],
    ["rings", "OmLrFODvPII", "EVENT"],
    ["m1", "QoBHQuiu9N0", "COUPLE"],
    ["m2", "TLBDWV7RRYI", "COUPLE"],
    ["m3", "xXHyI3ZRByo", "COUPLE"],
    ["m4", "sQcvXmxgPfw", "COUPLE"],
  ],
  gallery: [
    ["AD3k4pko7wo", "In the last of the light"], ["WHNWkO1lBKU", "Forehead to forehead"], ["TLBDWV7RRYI", "Among the autumn leaves"], ["QoBHQuiu9N0", "Walking towards the sun"],
    ["xXHyI3ZRByo", "Through the yellow field"], ["nBFagEIwy0o", "Laughing, as usual"], ["NNNRQgsQXpE", "Under the willow"], ["IjdzkDxKjc4", "Hand in hand, through the tall grass"],
    ["sQcvXmxgPfw", "The question"], ["zy6p2ibONaQ", "Two rings"], ["K2JtyCVdeuQ", "Henna and flowers"],
  ],
  wishes: [
    ["Sneha Rajan", "Friend", "Tara, you said you would never let anyone book your holidays. I am glad someone finally proved you wrong. Congratulations, both of you!"],
    ["Arun Prasad", "Colleague", "Nikhil builds bridges and now he has built one for the two of you. All the best, you two."],
    ["Reshma Das", "Cousin", "We have been waiting for this since the viewpoint story. See you at the Mehendi!"],
  ],
  extra(doc) {
    sectionCopy(doc, "timeline", { eyebrow: "Three years", title: "How we got here" });
    sectionCopy(doc, "countdown", { eyebrow: "Until we say yes — officially" });
    sectionCopy(doc, "ceremonies", { eyebrow: "The ceremony", title: "What to expect" });
    // the two of them embrace too closely to be cut into two portraits, so the “meet the couple” text is an About section
    doc.occasion.about = {
      eyebrow: { en: "The two of them" }, title: { en: "Tara & Nikhil" },
      body: { en: "Tara is a paediatric dentist who has never once been scolded by a child and rarely by anyone else. She plans every holiday with a spreadsheet and abandons it by day two.\n\nNikhil is a civil engineer who builds bridges for a living and cannot build a flat-pack wardrobe. He makes the best filter coffee in two districts and will tell you so himself." },
      quote: { text: { en: "" }, author: { en: "" } },
      highlights: [
        { id: "f1", value: { en: "3 years" }, label: { en: "Together" }, note: { en: "and one very good question" } },
        { id: "f2", value: { en: "13 Feb" }, label: { en: "The ring ceremony" }, note: { en: "11 am, at The Lotus Pavilion" } },
        { id: "f3", value: { en: "Two families" }, label: { en: "One long lunch" }, note: { en: "" } },
      ],
    } as never;
    for (const s of doc.sections) {
      if (s.type === "hero") s.variant = "arch";
    }
  },
};
