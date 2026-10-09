import type { InvitationDoc } from "../../src/domain/doc/schema";
import { newId } from "../../src/lib/id";
import { sectionCopy, type ShowcaseCfg } from "./showcase";

const L = (en: string) => ({ en });

/** Isha & Daniel — a modern, minimal wedding in the hills of Wayanad. Cream, black and a thread of gold. English only. */
export const ISHA: ShowcaseCfg = {
  slug: "isha-and-daniel",
  title: "Isha & Daniel",
  date: "2027-03-06",
  template: "modern-minimal",
  theme: "cream-noir",
  track: "Still Water (ambient)",
  eventType: "wedding",
  journey: { style: "western", headZoom: { bride: 1, groom: 1 } },
  images: { couple: "hero", coupleWide: "wide", story: "story", ceremony: "ceremony" },
  bride: { name: "Isha", fullName: "Isha Menon", parents: "Daughter of Mr. Ravi & Mrs. Sunita Menon, Kochi", bio: "An architect who photographs doorways and cannot walk past a bookshop. She believes the best conversations happen on long drives and that every plan improves with a thermos of coffee.", photo: "bride" },
  groom: { name: "Daniel", fullName: "Daniel Fernandes", parents: "Son of Mr. Anthony & Mrs. Maria Fernandes, Goa", bio: "A sound engineer who listens to rooms the way other people look at them. He cooks on Sundays, loses at board games gracefully and has never once been late to anything that mattered.", photo: "groom" },
  tagline: "Quiet certainty, loudly celebrated.",
  invitation: "Together with their families",
  quote: { text: "Whatever our souls are made of, his and mine are the same.", author: "Emily Brontë" },
  hashtag: "IshaAndDaniel",
  monogram: "ID",
  venues: [
    { key: "retreat", name: "Mistral Ridge Retreat", address: "Vythiri, Wayanad, Kerala 673576", city: "Wayanad", lat: 11.5503, lng: 76.0398, mapUrl: "https://www.google.com/maps/search/?api=1&query=Vythiri+Wayanad", photo: "venue", airport: "Calicut International Airport (CCJ) is 85 km away — about 2 hours 15 minutes by road.", railway: "Kozhikode Railway Station is 70 km away, about 2 hours.", road: "Take the Thamarassery ghat road to Lakkidi, then follow the signs to Vythiri. The retreat is 6 km beyond the town; the last stretch is gravel.", parking: "Parking is at the lower meadow. A buggy runs to the chapel every ten minutes." },
  ],
  events: [
    { name: "Welcome dinner", date: "2027-03-05", start: "19:00", end: "22:00", venue: "retreat", description: "A relaxed supper under the trees for everyone who arrives early. Wood-fired food, long tables, no seating plan.", dress: "Easy and comfortable", colors: ["#F7F3EC", "#E3DCCD"], photo: "dinner" },
    { name: "The ceremony", date: "2027-03-06", start: "16:30", end: "17:30", venue: "retreat", description: "A short, personal ceremony in the glass chapel, with the forest on three sides. Please be seated by 16:15.", dress: "Black tie optional — cream, black and white", colors: ["#F7F3EC", "#1C1A17", "#FFFFFF", "#A8884A"], photo: "ceremony", main: true },
    { name: "Dinner & dancing", date: "2027-03-06", start: "19:00", end: "00:00", venue: "retreat", description: "A long dinner by candlelight, then the floor opens. The band plays until midnight; the bonfire burns until you leave.", dress: "As above", colors: ["#1C1A17", "#A8884A", "#F7F3EC"], photo: "table" },
  ],
  family: { brideName: "The Menon family", groomName: "The Fernandes family", members: [] },
  intro: "A shared umbrella.\nA long train home.\nFour years of ordinary days made extraordinary.\nNow, one very good Saturday.",
  milestones: [
    ["2022", "A friend’s terrace", "She came for the view. He was fixing the speakers. Neither of them stayed for the party.", "m1"],
    ["2023", "Coffee, then dinner", "One flat white turned into four hours, and then a table for two.", "m2"],
    ["2025", "The question", "At the edge of a lake, with nobody else around and no plan at all.", "m3"],
    ["2027", "The wedding", "6 March, among the trees.", "m4"],
  ],
  ceremoniesIntro: "",
  ceremonies: [],
  rsvp: { deadline: "2027-02-06", pickups: ["Calicut International Airport (CCJ)", "Kozhikode Railway Station"], whatsapp: "" },
  whatsapp: "917356741055",
  whatsappMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#F7F3EC", "Cream"], ["#1C1A17", "Black"], ["#FFFFFF", "White"], ["#A8884A", "Muted gold"]], note: "Black tie optional. Cream, black and white, please — with a little gold if you like." },
  dressAvoid: "The ground is gravel and grass: block heels may sink, so flats or wedges will be kinder.",
  opening: { variant: "envelope", sealText: "ID", invited: "You are invited to the wedding of" },
  thankYou: { message: "Thank you for climbing a mountain, for the toasts and for dancing until the bonfire went out.\n\nWith love,", signature: "Isha & Daniel", photo: "hero" },
  seo: { title: "Isha & Daniel — Wedding Invitation", description: "A modern, minimal wedding invitation: cream, black and a thread of gold. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "dYgv-1JnPTA", "COUPLE", { focal: { x: 50, y: 30 } }],
    ["wide", "aen7e0u2UhA", "COUPLE", { focal: { x: 36, y: 55 } }],
    ["story", "1cc4TpwK2fE", "COUPLE"],
    ["bride", "z96DMIRABU0", "BRIDE", { focal: { x: 50, y: 22 } }],
    ["groom", "DnJioJ8nhxI", "GROOM", { focal: { x: 50, y: 50 } }],
    ["venue", "ys_8FnQv6Is", "VENUE"],
    ["ceremony", "NApm82co2l4", "EVENT"],
    ["dinner", "hYkOoi7z9sA", "EVENT"],
    ["table", "YKBT8rRAzpU", "EVENT"],
    ["m1", "J03oQgePJog", "COUPLE"],
    ["m2", "THEJX2MIVPI", "COUPLE"],
    ["m3", "pLDDrRkLMWY", "COUPLE"],
    ["m4", "Gw2ODMZDeK4", "EVENT"],
  ],
  gallery: [
    ["pLDDrRkLMWY", "Foreheads together"], ["ys_8FnQv6Is", "The glass chapel"], ["4ExHGkN7fzQ", "Green and white"], ["PzmfTLaqPT0", "Calla lilies, a pearl glove"],
    ["Jky1XZp--hI", "The tent at the edge of the forest"], ["J03oQgePJog", "The first kiss, among friends"], ["LQoCpIagZmc", "Ranunculus and eucalyptus"], ["Gw2ODMZDeK4", "Chairs, waiting in the sun"],
    ["z96DMIRABU0", "Beneath the arch"], ["1cc4TpwK2fE", "Noses together"], ["aen7e0u2UhA", "By the water"], ["NApm82co2l4", "The chapel at night"],
  ],
  wishes: [
    ["Rhea Kapoor", "Friend", "I have watched you two argue about the thermostat for four years and I have never seen two people so happy to lose. Congratulations, both of you."],
    ["Dev Anand", "Colleague", "Daniel, you are the only person who made me enjoy a three-hour soundcheck. Isha, thank you for lending him to us. See you on the dance floor."],
    ["Marina Fernandes", "Cousin", "From Goa with love — we are bringing the prawns and the old guitar."],
  ],
  extra(doc: InvitationDoc) {
    doc.journey.enabled = false; // a minimal invitation has nothing walking across it
    doc.menu = {
      courses: [
        { id: newId(), title: L("To begin"), items: [{ id: newId(), name: L("Burrata, charred peach, basil oil"), note: L(""), veg: true }, { id: newId(), name: L("Wayanad pepper prawns on toast"), note: L(""), veg: false }] },
        { id: newId(), title: L("To follow"), items: [{ id: newId(), name: L("Slow-roast lamb, rosemary, smoked aubergine"), note: L(""), veg: false }, { id: newId(), name: L("Wild mushroom & thyme risotto"), note: L(""), veg: true }] },
        { id: newId(), title: L("To end"), items: [{ id: newId(), name: L("Dark chocolate, sea salt, filter-coffee ice cream"), note: L(""), veg: true }] },
      ],
      note: L("Dietary needs? Tell us in your reply and the kitchen will take care of it."),
    } as never;
    const v = doc.venues[0];
    v.hotels = [
      { id: newId(), name: L("The Cottages at Mistral Ridge"), area: L("On the retreat"), distanceKm: 0, priceHint: "₹9,500 / night", phone: "+91 73567 41055", url: "", note: L("Eight timber cottages at the edge of the forest — our block is held until 6 February."), photo: undefined },
      { id: newId(), name: L("Valley View Homestay"), area: L("Vythiri town"), distanceKm: 6, priceHint: "₹3,800 / night", phone: "+91 73567 41055", url: "", note: L("A warm, family-run homestay with a view of the tea hills."), photo: undefined },
    ] as never;
    v.nearby = [
      { id: newId(), name: L("Lakkidi viewpoint"), kind: "View", note: L("The mist is thickest before nine in the morning."), mapUrl: "", photo: undefined },
      { id: newId(), name: L("Pookode Lake"), kind: "Walk", note: L("A gentle circuit around the lake — good for a quiet morning-after."), mapUrl: "", photo: undefined },
    ] as never;
    sectionCopy(doc, "timeline", { eyebrow: "Four years", title: "The beginning" });
    sectionCopy(doc, "menu", { eyebrow: "Dinner", title: "What we will eat" });
    for (const s of doc.sections) {
      if (s.type === "gallery") s.variant = "masonry";
    }
  },
};
