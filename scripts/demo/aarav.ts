import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/** Aarav turns three — a dinosaur-themed children’s birthday in Kochi. Warm cream, coral and sunshine. English only. */
export const AARAV: OccasionCfg = {
  slug: "aarav-turns-three",
  title: "Aarav turns three",
  date: "2027-01-31",
  template: "little-celebration",
  theme: "confetti-pop",
  track: "Tiny Roars (ambient)",
  eventType: "kids_birthday",
  headline: { title: "Aarav", subtitle: "is turning three — roar!", invitation: "You’re invited to a dino-mite party for", hosts: "Mummy, Papa & Anaya", monogram: "A3" },
  honoree: { name: "Aarav", fullName: "Aarav Nambiar", role: "The birthday boy", age: "3" },
  about: {
    eyebrow: "Party details",
    title: "Roar! Here is the plan",
    body: "Dinosaurs, bubbles, balloons and cake. There will be a fossil dig, a roaring contest and a very large dinosaur cake. Come dressed as your favourite explorer — green is encouraged, roaring is compulsory.\n\nGrown-ups are welcome to stay, and so are grandparents: there are plenty of chairs, and plenty of masala chai.",
    highlights: [["3 pm", "Sunday 31 January", "Please arrive by 2:45"], ["Ages 2–6", "Little explorers", "Grown-ups stay too"], ["2 hours", "Of dino-mite fun", "Ending at five"], ["No gifts", "Your roar is enough", "Truly"]],
  },
  images: { couple: "hero" },
  venues: [
    { key: "club", name: "The Garden Room, Jasmine Court Clubhouse", address: "Jasmine Court Apartments, Kakkanad, Kochi, Kerala 682030", city: "Kochi", lat: 10.0159, lng: 76.3419, mapUrl: "https://www.google.com/maps/search/?api=1&query=Kakkanad+Kochi", airport: "Cochin International Airport (COK) is 28 km away, about 50 minutes by car.", railway: "Ernakulam Junction is 12 km away, about 35 minutes.", road: "Take the Seaport–Airport road to Kakkanad junction and follow the balloons. The gate is opposite the pharmacy.", parking: "Visitor parking is inside the main gate. The security desk will wave you through when you say “Aarav’s party”." },
  ],
  events: [
    { name: "Dino arrival & face painting", date: "2027-01-31", start: "15:00", end: "15:30", venue: "club", description: "Little explorers choose a dinosaur face — spots, stripes or scales — and collect an explorer’s badge.", dress: "Explorer outfits — green, orange and yellow", colors: ["#6CB36A", "#F2994A", "#F6C945"], photo: "balloons" },
    { name: "Fossil dig & bubbles", date: "2027-01-31", start: "15:30", end: "16:30", venue: "club", description: "Dig for dinosaur bones in the sandpit, then chase giant bubbles across the lawn.", dress: "", colors: [], photo: "bubbles" },
    { name: "The roaring cake", date: "2027-01-31", start: "16:30", end: "17:00", venue: "club", description: "Candles, a very big wish and the loudest happy-birthday song of the year.", dress: "", colors: [], photo: "cake", main: true },
    { name: "Party bags & goodbyes", date: "2027-01-31", start: "17:00", end: "17:15", venue: "club", description: "Everyone takes home a dinosaur, a badge and a cupcake.", dress: "", colors: [], photo: "cupcakes" },
  ],
  rsvp: { deadline: "2027-01-20", askMeal: false, askAccommodation: false, askTransport: false, allowCompanions: true, thankYou: "Thank you, {name}. Aarav can’t wait to roar with you!" },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#6CB36A", "Jungle green"], ["#F2994A", "Volcano orange"], ["#F6C945", "Sunshine"], ["#5B8DEF", "Sky"]], note: "Come as an explorer: greens, oranges and yellows. Comfortable shoes — there is a sandpit." },
  dressAvoid: "Anything you would mind getting a little sandy or bubbly.",
  message: {
    title: "A note from Aarav’s parents",
    body: "Dear friends and family,\n\nAarav discovered dinosaurs this year and our house has not been quiet since. He can name twelve of them, roar at the sixth and has asked, most evenings, whether the stegosaurus is allowed to come for dinner.\n\nSo for his third birthday we thought: why not invite everyone? We would love you to share the day with us — the roaring, the bubbles and the very large cake.",
    from: "Divya & Anand", role: "Aarav’s mummy and papa",
  },
  opening: { sealText: "A", invited: "You’re invited to a dino-mite party" },
  thankYou: { message: "Thank you for roaring with us! Aarav is still wearing his explorer badge to bed.\n\nWith love,", signature: "Aarav, Divya & Anand", photo: "hero" },
  seo: { title: "Aarav turns three — Birthday Invitation", description: "A dinosaur-themed children’s birthday invitation with party details at a glance. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "iG98pmgWJMU", "COUPLE", { focal: { x: 52, y: 55 } }],
    ["balloons", "Hli3R6LKibo", "EVENT"],
    ["bubbles", "qojqVPsfAiE", "EVENT"],
    ["cake", "As8zq82LBpw", "EVENT"],
    ["cupcakes", "zURPcpLoKA4", "EVENT"],
  ],
  gallery: [
    ["iG98pmgWJMU", "Roar! Two little dinosaurs"], ["yxZjTv30tl8", "The tiniest dinosaurs"], ["Wdb27cW27do", "Bubbles, as far as you can run"], ["vrkSVpOwchk", "All the balloons"],
    ["As8zq82LBpw", "Everyone helps blow out the candles"], ["PhuGmoubvo8", "A very serious bubble"], ["JatNzrnc078", "The plush dinosaur gang"], ["cK6ixOQx1fI", "The wish"], ["zURPcpLoKA4", "Cupcakes, for after the cake"],
  ],
  wishes: [
    ["Meera Krishnan", "Aunty", "Happy third birthday, Aarav! Aunty is bringing a very long book about stegosauruses."],
    ["Joseph Thomas", "Family friend", "Many happy returns to the smallest explorer in Kakkanad. We will be roaring from the first minute."],
    ["Fatima Beevi", "Neighbour", "Save a cupcake for me, little man. We will see you on Sunday!"],
  ],
  extra(doc) {
    sectionCopy(doc, "dresscode", { eyebrow: "What to wear", title: "Come as an explorer" });
    sectionCopy(doc, "events", { eyebrow: "Sunday 31 January", title: "The party plan" });
    sectionCopy(doc, "message", { eyebrow: "A note from home" });
    sectionCopy(doc, "gallery", { title: "Dinosaurs, bubbles & balloons" });
    doc.sections = doc.sections.map((s) => (s.type === "hero" ? { ...s, variant: "arch" } : s));
  },
};
