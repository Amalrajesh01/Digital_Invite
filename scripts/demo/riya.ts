import { sectionCopy, type ShowcaseCfg } from "./showcase";

/** Riya & Sameer — a Bengaluru wedding that starts as a party. Chilli, turmeric and teal. English only. */
export const RIYA: ShowcaseCfg = {
  slug: "riya-and-sameer",
  title: "Riya & Sameer",
  date: "2027-05-22",
  template: "sangeet-night",
  theme: "festive-pop",
  track: "Dance Floor (ambient)",
  eventType: "wedding",
  journey: { style: "classic", headZoom: { bride: 1.4, groom: 1.4 } },
  images: { couple: "hero", story: "story" },
  bride: { name: "Riya", fullName: "Riya Kapoor", parents: "Daughter of Mr. Rajiv & Mrs. Meenu Kapoor, Bengaluru", bio: "A product designer who rearranges any room she walks into. She believes any plan can be improved, apart from the one for the sangeet.", photo: "bride" },
  groom: { name: "Sameer", fullName: "Sameer Qureshi", parents: "Son of Mr. Farhan & Mrs. Nasreen Qureshi, Hyderabad", bio: "A sound engineer who has never once been quiet at a party. He makes the playlist, the biryani and, on request, a speech.", photo: "groom" },
  tagline: "Two families, two cuisines, one very loud dance floor.",
  invitation: "Together with their families",
  quote: { text: "Let’s dance first and be serious later.", author: "Riya & Sameer" },
  hashtag: "RiyaMeetsSameer",
  monogram: "RS",
  venues: [
    { key: "courtyard", name: "The Courtyard at Whitefield", address: "ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066", city: "Bengaluru", lat: 12.9698, lng: 77.7499, mapUrl: "https://www.google.com/maps/search/?api=1&query=Whitefield+Bengaluru", airport: "Kempegowda International Airport (BLR) is 38 km away, about 1 hour 15 minutes by car.", railway: "Whitefield Railway Station is 3 km away, about 12 minutes.", road: "From the ITPL main gate, take the second left after the signal; the courtyard is behind the mango trees.", parking: "Valet parking at the gate. Please use cabs after the sangeet — the music is loud." },
  ],
  events: [
    { name: "Mehendi & lunch", date: "2027-05-21", start: "12:00", end: "16:00", venue: "courtyard", description: "Henna, chaat and a very long lunch. The fastest to finish gets a prize.", dress: "Bright and breezy", colors: ["#F2B705", "#1B998B", "#E4572E"], photo: "mehendi" },
    { name: "Sangeet night", date: "2027-05-21", start: "19:00", end: "00:00", venue: "courtyard", description: "The two families against each other in a dance battle, a DJ who knows every song and a dessert counter that does not close.", dress: "Glitter, sequins and shoes you can dance in", colors: ["#E4572E", "#F2B705", "#1B998B"], photo: "dance" },
    { name: "The wedding", date: "2027-05-22", start: "11:00", end: "13:00", venue: "courtyard", description: "A short, warm ceremony that borrows from both families. Please be seated by 10:45.", dress: "Festive, in pastels", colors: ["#F6D5C8", "#1B998B", "#FFF6E5"], photo: "garlands", main: true },
    { name: "Reception", date: "2027-05-22", start: "19:30", end: "23:30", venue: "courtyard", description: "Dinner, toasts and — yes — more dancing.", dress: "Cocktail, formal", colors: ["#2A2438", "#F2B705"] },
  ],
  family: { brideName: "The Kapoor family", groomName: "The Qureshi family", members: [["bride", "Mr. Rajiv Kapoor", "Father of the bride"], ["bride", "Mrs. Meenu Kapoor", "Mother of the bride"], ["groom", "Mr. Farhan Qureshi", "Father of the groom"], ["groom", "Mrs. Nasreen Qureshi", "Mother of the groom"]] },
  intro: "A concert in a crowded hall.\nTwo strangers, one broken speaker.\nHe fixed the sound.\nShe fixed the playlist.",
  milestones: [
    ["2020", "A broken speaker", "At a friend’s gig. He had the screwdriver; she had the opinion.", "m1"],
    ["2022", "Biryani for two families", "His mother and her mother argued about the rice. They have been friends since.", "m2"],
    ["2026", "The proposal, on a stage", "Mid-song. He had paid the band. The band had told everybody.", "m3"],
    ["2027", "The wedding", "22 May, with more dancing than ceremony.", "m4"],
  ],
  ceremoniesIntro: "The ceremony borrows from both families. Here is what each part means, so that everyone can follow.",
  ceremonies: [
    ["Garlands", "11:10 am", "Riya and Sameer garland each other as the families cheer them on.", "flower", "garlands"],
    ["The nikah and the pheras, together", "11:25 am", "A reading from both traditions, spoken in turn, followed by seven steps around the lamp.", "flame"],
    ["Rings and vows", "12:10 pm", "The couple exchange rings and read vows they wrote themselves.", "rings"],
    ["Blessings and lunch", "12:30 pm", "The elders bless the couple and everyone sits down to a joint feast: biryani, dal and dessert.", "bowl"],
  ],
  rsvp: { deadline: "2027-05-01", pickups: ["Kempegowda International Airport (BLR)", "Whitefield Railway Station"], whatsapp: "" },
  whatsapp: "917356741055",
  whatsappMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#E4572E", "Chilli"], ["#F2B705", "Turmeric"], ["#1B998B", "Teal"], ["#FFF6E5", "Cream"]], note: "Bright, festive colours for the sangeet; pastels for the wedding." },
  dressAvoid: "All-black for the sangeet — we want colour.",
  opening: { variant: "ticket", sealText: "RS", invited: "You are invited to the wedding of" },
  thankYou: { message: "Thank you for dancing, for the speeches and for the biryani debates. We loved every minute.\n\nWith love,", signature: "Riya & Sameer", photo: "hero" },
  seo: { title: "Riya & Sameer — Wedding Invitation", description: "A wedding that starts as a party, in Bengaluru. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "d9RsO9BHFVQ", "COUPLE", { focal: { x: 50, y: 40 } }],
    ["bride", "ohENjR9w0bk", "BRIDE", { focal: { x: 50, y: 40 } }],
    ["groom", "ICnMRhxJLYg", "GROOM", { focal: { x: 50, y: 30 } }],
    ["story", "NCrvRQdvTx8", "COUPLE", { focal: { x: 50, y: 40 } }],
    ["mehendi", "SUwPo4ErQCc", "EVENT"],
    ["dance", "vRa4PuRCW18", "EVENT"],
    ["garlands", "M8YKi58QKrM", "EVENT"],
    ["m1", "J03oQgePJog", "COUPLE"],
    ["m2", "gG5MoExhMnU", "COUPLE"],
    ["m3", "OzyvCE9a60M", "COUPLE"],
    ["m4", "Y3QEAct9JT4", "COUPLE"],
  ],
  gallery: [
    ["OzyvCE9a60M", "Garlands, already"], ["M8YKi58QKrM", "Petals in the air"], ["gG5MoExhMnU", "The groom, laughing"], ["J03oQgePJog", "Everyone, cheering"],
    ["vRa4PuRCW18", "Sangeet rehearsal"], ["Y3QEAct9JT4", "Under the lights"], ["jWBxlyVZ3bg", "Side by side"], ["8DItNV005qM", "A quiet moment"],
  ],
  wishes: [
    ["Aditi Menon", "Colleague", "I have seen her redesign a canteen. I cannot wait to see what she does with a marriage."],
    ["Zaid Khan", "Friend", "Save me the first dance, and the last biryani."],
  ],
  extra(doc) {
    sectionCopy(doc, "events", { eyebrow: "Two days", title: "The plan" });
    sectionCopy(doc, "ceremonies", { eyebrow: "Both families", title: "What happens at the wedding" });
  },
};
