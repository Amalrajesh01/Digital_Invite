import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/** Kabir turns ten — a bold, number-led party for a ten-year-old in Kochi. Black ink and one line of lime. English only. */
export const KABIR: OccasionCfg = {
  slug: "kabir-turns-ten",
  title: "Kabir turns ten",
  date: "2027-05-08",
  template: "milestone",
  theme: "lime-ink",
  track: "Ten Out of Ten (ambient)",
  eventType: "kids_birthday",
  headline: { title: "Kabir", subtitle: "turns ten", invitation: "You are invited to celebrate", hosts: "Anita & Vikram", monogram: "K10", dateLabel: "" },
  honoree: { name: "Kabir", fullName: "Kabir Pillai", role: "The birthday boy", age: "10" },
  about: {
    eyebrow: "Double digits",
    title: "Ten years, and he has opinions",
    body: "Kabir is ten. He is now officially too old for the bouncy castle, so we are doing a games afternoon instead: relay races, a treasure hunt, a quiz he has written himself and a cake in the shape of his favourite football.\n\nBring your sneakers and your sense of humour. Parents are welcome to stay and cheer.",
    highlights: [["10", "Years", "and a lot of goals"], ["3 pm", "Saturday 8 May", "Kick-off on time"], ["Ages 8–12", "Friends and cousins", ""], ["5:30 pm", "Pickup", ""]],
  },
  images: { couple: "hero" },
  milestones: [
    ["2017", "Hello", "Born in the middle of a thunderstorm, and loud about it from the first minute.", undefined],
    ["2021", "The first football", "Received on his fourth birthday. Not been seen without it since.", undefined],
    ["2024", "The first goal", "A school-ground miracle. The goalkeeper is still discussing it.", undefined],
    ["2027", "Ten", "A games afternoon, a football cake and everyone he likes best.", undefined],
  ],
  venues: [
    { key: "club", name: "Green Field Sports Club", address: "Panampilly Nagar, Kochi, Kerala 682036", city: "Kochi", lat: 9.9575, lng: 76.2999, mapUrl: "https://www.google.com/maps/search/?api=1&query=Panampilly+Nagar+Kochi", airport: "Cochin International Airport — 35 km", parking: "Free parking at the club gate." },
  ],
  events: [
    { name: "Kick-off and relay races", date: "2027-05-08", start: "15:00", end: "16:00", venue: "club", description: "Teams are picked by Kabir, who has promised to be fair. Mostly.", dress: "Sports kit and sneakers", colors: ["#111111", "#C7F23C"], photo: "games" },
    { name: "The treasure hunt and quiz", date: "2027-05-08", start: "16:00", end: "17:00", venue: "club", description: "Ten clues around the club and a ten-question quiz written by the birthday boy himself.", dress: "", colors: [], photo: "hunt" },
    { name: "The football cake", date: "2027-05-08", start: "17:00", end: "17:30", venue: "club", description: "Ten candles, one wish and the loudest song of the year.", dress: "", colors: [], photo: "cake", main: true },
  ],
  rsvp: { deadline: "2027-04-28", askMeal: false, askAccommodation: false, askTransport: false, allowCompanions: true, thankYou: "Thank you, {name}. Kabir has put you in the red team!" },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  palette: { colors: [["#111111", "Ink"], ["#C7F23C", "Lime"], ["#FFFFFF", "White"], ["#E8E8E4", "Chalk"]], note: "Sports kit or anything you can run in. Lime, black or white if you want to match the team." },
  dressAvoid: "Anything you would mind getting grass-stained.",
  opening: { sealText: "10", invited: "You are invited to celebrate" },
  thankYou: { message: "Thank you for coming, running, shouting and eating a very large amount of cake.\n\nWith love,", signature: "Kabir, Anita & Vikram", photo: "hero" },
  seo: { title: "Kabir turns ten — Birthday Invitation", description: "A bold, number-led birthday invitation for a ten-year-old. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "PhuGmoubvo8", "COUPLE", { focal: { x: 22, y: 40 } }],
    ["games", "Wdb27cW27do", "EVENT"],
    ["hunt", "qojqVPsfAiE", "EVENT"],
    ["cake", "As8zq82LBpw", "EVENT"],
  ],
  gallery: [
    ["PhuGmoubvo8", "Dressed for the occasion"], ["Wdb27cW27do", "Running, as usual"], ["qojqVPsfAiE", "The bubble that got away"],
    ["As8zq82LBpw", "Everyone helps with the candles"], ["cK6ixOQx1fI", "Make a wish"], ["ETGJjk9o-48", "Ten candles"],
  ],
  wishes: [
    ["Arjun Pillai", "Cousin", "Happy tenth, Kabir! I am bringing my football, and my excuses for when you beat me."],
    ["Mrs. Thomas", "Class teacher", "Ten years old and already the best goalkeeper in Class 5. Many happy returns."],
    ["Dev", "Best friend", "Red team forever. Save me some cake."],
  ],
  extra(doc) {
    sectionCopy(doc, "timeline", { eyebrow: "Ten years", title: "In moments" });
    sectionCopy(doc, "events", { eyebrow: "Saturday 8 May", title: "The afternoon" });
  },
};
