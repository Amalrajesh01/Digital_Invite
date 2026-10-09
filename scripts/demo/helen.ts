import { sectionCopy, type ShowcaseCfg } from "./showcase";

/** Helen & George — a silver-jubilee celebration in Thiruvananthapuram. Slate and silver. English only. */
export const HELEN: ShowcaseCfg = {
  slug: "helen-and-george",
  title: "Helen & George",
  date: "2027-04-18",
  template: "silver-jubilee",
  theme: "silver-jubilee",
  track: "Twenty-Five Years (ambient)",
  eventType: "anniversary",
  journey: { style: "western", headZoom: { bride: 3.2, groom: 3.2 } },
  images: { couple: "hero", story: "story" },
  bride: { name: "Helen", fullName: "Helen Varghese", parents: "Married 18 April 2002", bio: "A school headmistress who still reads every child’s report aloud to the staff room. She keeps a garden that feeds half the street, and a notebook of every recipe she has ever been given.", photo: "bride" },
  groom: { name: "George", fullName: "George Varghese", parents: "Married 18 April 2002", bio: "A retired civil engineer who walks the same four kilometres every morning and knows every dog on the route by name. He has ridden the same scooter since 1998 and will not hear a word against it.", photo: "groom" },
  tagline: "Twenty-five years. Still choosing each other.",
  invitation: "Together with their children",
  quote: { text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott" },
  hashtag: "HelenAndGeorge25",
  monogram: "H25",
  venues: [
    { key: "hall", name: "Rosewood Hall", address: "Vellayambalam, Thiruvananthapuram, Kerala 695010", city: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, mapUrl: "https://www.google.com/maps/search/?api=1&query=Vellayambalam+Thiruvananthapuram", airport: "Trivandrum International Airport (TRV) is 9 km away, about 25 minutes by car.", railway: "Thiruvananthapuram Central is 5 km away, about 18 minutes.", road: "On the Kowdiar road, the hall is opposite the park; the entrance is lit with lanterns on the evening.", parking: "Parking is in the hall’s own ground, with attendants to direct you." },
  ],
  events: [
    { name: "Thanksgiving prayers", date: "2027-04-18", start: "17:00", end: "18:00", venue: "hall", description: "A short service of thanks with family, led by the parish priest. All faiths are welcome.", dress: "Smart traditional", colors: ["#F6F7F9", "#3C4A63"], photo: "album" },
    { name: "Silver jubilee reception", date: "2027-04-18", start: "18:30", end: "22:30", venue: "hall", description: "Dinner, a slideshow of twenty-five years, and the dance Helen and George have not stopped practising.", dress: "Evening smart — slate, silver, navy", colors: ["#3C4A63", "#8791A8", "#F6F7F9", "#232B3C"], photo: "dance", main: true },
  ],
  family: { brideName: "", groomName: "", members: [] },
  intro: "Twenty-five years.\nTwo languages in one kitchen.\nA house that became a home.\nAnd a lifetime still ahead.",
  milestones: [
    ["2002", "The wedding", "A small church, a warm April morning and a hundred and fifty guests who ate all the cake.", "m1"],
    ["2005", "The first home", "A two-room rented house, one table and a lot of borrowed chairs.", "m2"],
    ["2011", "The garden", "The year George planted the mango tree that now shades the whole lane.", "m3"],
    ["2019", "The long walk", "Retirement, and a new routine of four kilometres at dawn, every day.", "m4"],
    ["2027", "Twenty-five years", "18 April — with everyone who has been part of the story.", "m5"],
  ],
  ceremoniesIntro: "",
  ceremonies: [],
  rsvp: { deadline: "2027-04-04", pickups: ["Trivandrum International Airport (TRV)", "Thiruvananthapuram Central Railway Station"], whatsapp: "" },
  whatsapp: "917356741055",
  whatsappMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#3C4A63", "Slate"], ["#8791A8", "Silver"], ["#F6F7F9", "Pearl"], ["#232B3C", "Midnight"]], note: "Evening smart. Slate, silver and navy suit the hall best." },
  dressAvoid: "Bright red and yellow — the hall is silver tonight.",
  opening: { variant: "envelope", sealText: "H25", invited: "You are invited to celebrate twenty-five years of" },
  thankYou: { message: "Thank you for twenty-five years of friendship, and for an evening none of us will forget.\n\nWith love,", signature: "Helen & George", photo: "hero" },
  seo: { title: "Helen & George — Silver Jubilee Invitation", description: "A silver-jubilee anniversary invitation told as twenty-five years of moments. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "0keyorgl820", "COUPLE", { focal: { x: 52, y: 30 } }],
    ["bride", "0keyorgl820", "BRIDE", { focal: { x: 48, y: 28 } }],
    ["groom", "0keyorgl820", "GROOM", { focal: { x: 59, y: 16 } }],
    ["story", "iV9F0sHl7OU", "COUPLE", { focal: { x: 50, y: 38 } }],
    ["album", "73OJLcahQHg", "EVENT"],
    ["dance", "mrQ6Kmfa1jA", "EVENT"],
    ["m1", "73OJLcahQHg", "COUPLE"],
    ["m2", "hZ8bAA8CjcA", "COUPLE"],
    ["m3", "M4RvX4uVb4w", "COUPLE"],
    ["m4", "vN2V5iunLc0", "COUPLE"],
    ["m5", "PPNhNVZal8g", "COUPLE"],
  ],
  gallery: [
    ["0keyorgl820", "Twenty-five years, side by side"], ["73OJLcahQHg", "The old album, opened once more"], ["iV9F0sHl7OU", "A well-worn sofa and a better view"], ["vN2V5iunLc0", "The morning walk"],
    ["mrQ6Kmfa1jA", "Still dancing"], ["PPNhNVZal8g", "Grandmother, on the floor"], ["M4RvX4uVb4w", "Slow dance, last song"], ["hZ8bAA8CjcA", "Hand in hand"],
  ],
  wishes: [
    ["Sarah Varghese", "Daughter", "Amma, Achan — twenty-five years of the best home in Thiruvananthapuram. We love you more than the mango tree, and that is saying something."],
    ["Joseph Thomas", "Brother-in-law", "George, you picked the right headmistress. Helen, you picked the right scooter. Congratulations on twenty-five years!"],
    ["Sister Mary Joseph", "Friend of the family", "May the next twenty-five be as full of light as the first. God bless you both."],
  ],
  extra(doc) {
    sectionCopy(doc, "timeline", { eyebrow: "A quarter century", title: "In five moments" });
    sectionCopy(doc, "story", { eyebrow: "The story so far", title: "Helen & George" });
    sectionCopy(doc, "message", { eyebrow: "From their children" });
    doc.occasion.message = {
      title: { en: "A letter from their children" },
      body: { en: "Dear Amma and Achan,\n\nYou taught us that a home is built with small things: a pot of tea at six, a lamp left on for whoever is late, and a seat kept for anyone who walks in.\n\nTwenty-five years is a long time to keep choosing each other. Thank you for making it look so easy — and for letting us watch.\n\nWe are so proud to be yours." },
      from: { en: "Sarah & Jacob" },
      role: { en: "With all our love" },
      photo: undefined,
    } as never;
    doc.occasion.people = [
      { id: "p1", group: { en: "Their children" }, name: { en: "Sarah Varghese" }, relation: { en: "Daughter" }, note: { en: "The one who inherited the notebook of recipes" }, photo: undefined },
      { id: "p2", group: { en: "Their children" }, name: { en: "Jacob Varghese" }, relation: { en: "Son" }, note: { en: "The one who inherited the scooter" }, photo: undefined },
      { id: "p3", group: { en: "Their parents" }, name: { en: "Mr. Philip & Mrs. Annie Varghese" }, relation: { en: "George’s parents" }, note: { en: "" }, photo: undefined },
      { id: "p4", group: { en: "Their parents" }, name: { en: "Mr. Thomas & Mrs. Lissy Mathew" }, relation: { en: "Helen’s parents" }, note: { en: "" }, photo: undefined },
    ] as never;
    sectionCopy(doc, "people", { eyebrow: "The family they built", title: "Twenty-five years, together" });
    for (const s of doc.sections) {
      if (s.type === "hero") s.variant = "split";
    }
  },
};
