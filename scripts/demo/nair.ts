import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/** Anand & Divya Nair — Griha Pravesh of their first home in Kochi. Kasavu gold. English only. */
export const NAIR: OccasionCfg = {
  slug: "nair-griha-pravesh",
  title: "Griha Pravesh — Ananda Nilayam",
  date: "2027-03-28",
  template: "griha-pravesh",
  theme: "kasavu",
  track: "Morning Raga (ambient)",
  eventType: "housewarming",
  headline: { title: "Ananda Nilayam", subtitle: "our new home, and you are invited into it", invitation: "You are invited to the house-warming of", hosts: "Anand & Divya Nair", monogram: "AN", dateLabel: "" },
  honoree: { name: "The Nair family", fullName: "Anand & Divya Nair", role: "The new home of", age: "" },
  about: {
    eyebrow: "A new beginning",
    title: "Come and bless our home",
    body: "After eleven years of rented rooms, we have a front door of our own. We would like the people who carried boxes, lent ladders and fed us on the way to be the first to walk through it.\n\nThere will be a puja, milk will be boiled until it overflows — the way it must — and a lunch you should not skip.",
    highlights: [["8:41 am", "Muhurtham", "Griha Pravesh"], ["Sun 28 March", "2027", "Open from 8 am"], ["Lunch", "A sadya", "Served at 1 pm"]],
  },
  images: { couple: "hero" },
  venues: [
    { key: "home", name: "Ananda Nilayam", address: "Ananda Nilayam, Temple Road, Kakkanad, Kochi, Kerala 682030", city: "Kochi", lat: 10.0159, lng: 76.3419, mapUrl: "https://www.google.com/maps/search/?api=1&query=Kakkanad+Kochi", photo: "venue", airport: "Cochin International Airport (COK) is 28 km away, about 50 minutes by car.", railway: "Ernakulam North is 10 km away, about 30 minutes.", road: "From Infopark Phase 1, take the second left after the petrol pump; Palm Grove is the cream building with the coconut palms at its gate.", parking: "Park along the lane in front of the house; the gate will be open all morning." },
  ],
  events: [
    { name: "Ganapathi homam", date: "2027-03-28", start: "06:30", end: "08:00", venue: "home", description: "The fire ritual that clears the way for a new beginning. Only the families need attend.", dress: "Traditional", colors: ["#FBF8EF", "#C2A04C", "#1F4D3A"], photo: "homam" },
    { name: "Griha Pravesh", date: "2027-03-28", start: "08:41", end: "09:30", venue: "home", description: "The first steps into the home, a lamp lit at the threshold and milk boiled until it overflows.", dress: "Traditional — cream and gold", colors: ["#FBF8EF", "#C2A04C", "#1F4D3A"], photo: "rituals", main: true },
    { name: "Blessings and open house", date: "2027-03-28", start: "10:00", end: "13:00", venue: "home", description: "Come when you can; stay as long as you like. Every room is open.", dress: "Smart casual", colors: [], photo: "family" },
    { name: "Lunch", date: "2027-03-28", start: "13:00", end: "15:00", venue: "home", description: "A vegetarian sadhya on banana leaves, with two kinds of payasam.", dress: "", colors: [], photo: "sadya" },
  ],
  ceremoniesIntro: "A few small rituals welcome a home. Here is what each one means, so that every guest can follow along.",
  ceremonies: [
    ["Ganapathi homam", "6:30 am", "A sacred fire is lit for Ganesha, the remover of obstacles, so that nothing comes between the family and its new home.", "flame", "homam"],
    ["Crossing the threshold", "8:41 am", "The lady of the house enters first, right foot forward, carrying a lit lamp. Everyone follows, in silence.", "lamp", "lamp"],
    ["Boiling the milk", "8:50 am", "Milk is boiled until it overflows — a wish that prosperity will spill over in this home, too.", "bowl", "rituals"],
    ["The first meal", "1:00 pm", "The first meal in a new home is shared with everyone. Nobody leaves hungry.", "none", "sadya"],
  ],
  rsvp: { deadline: "2027-03-15", askMeal: true, askAccommodation: false, askTransport: false, allowCompanions: true, mealOptions: ["Vegetarian sadhya"], thankYou: "Thank you, {name}. The door is open for you." },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  message: {
    title: "A note from Anand & Divya",
    body: "Dear family and friends,\n\nA home is not made of walls. It is made of the people who walk in.\n\nPlease come, bring your blessings, and — if you can — one story about the first time you slept in a new place.",
    from: "Anand & Divya", role: "and Amma, who has already rearranged the kitchen",
  },
  opening: { sealText: "AN", invited: "You are invited to the house-warming of" },
  thankYou: { message: "Thank you for filling our home on its very first day. It has never looked so full.\n\nWith love,", signature: "Anand & Divya", photo: "hero" },
  seo: { title: "Griha Pravesh — Housewarming Invitation", description: "A traditional housewarming invitation with the rituals explained. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "wc-23392362", "COUPLE", { focal: { x: 36, y: 55 } }],
    ["venue", "csK5XPO87lI", "VENUE"],
    ["homam", "wc-146118873", "EVENT", { focal: { x: 50, y: 30 } }],
    ["rituals", "WciKbLIFGxc", "EVENT"],
    ["lamp", "zNY2lVIRh7M", "EVENT"],
    ["family", "VJP7K4uihUA", "EVENT"],
    ["sadya", "wc-152617626", "EVENT"],
  ],
  gallery: [
    ["wc-145089568", "Grinding the first batter in the new kitchen"], ["wc-146118873", "The homam fire, ringed with flowers"], ["zNY2lVIRh7M", "The lamp for the threshold"], ["WciKbLIFGxc", "Sweets and kumkum for the puja"],
    ["VJP7K4uihUA", "Family, in cream and gold"], ["y0OAmd_COUM", "Three generations under one roof"], ["73OJLcahQHg", "The family album, ready for new pages"], ["SiMzEeMrX2E", "Father and child, garlanded"], ["wc-152617626", "The sadya, ready"], ["df6Z3DPPw5U", "A single lamp"],
  ],
  wishes: [
    ["Radhika Pillai", "Neighbour", "A home is only a house until someone laughs in the kitchen. Congratulations, both of you."],
    ["Suresh Kumar", "Colleague", "We will be there with a bag of rice and a spare ladder. Warmest wishes."],
  ],
  extra(doc) {
    sectionCopy(doc, "about", { eyebrow: "A new beginning" });
    sectionCopy(doc, "ceremonies", { eyebrow: "The rituals", title: "How the morning unfolds" });
    sectionCopy(doc, "events", { eyebrow: "Sunday 28 March", title: "The day" });
    sectionCopy(doc, "gallery", { eyebrow: "Moments from the preparations", title: "Getting ready" });
    sectionCopy(doc, "message", { eyebrow: "A few words" });
  },
};
