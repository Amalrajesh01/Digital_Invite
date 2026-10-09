import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/** Aadhya’s naming ceremony — a quiet family blessing in Thrissur. Soft dawn. English only. */
export const AADHYA: OccasionCfg = {
  slug: "aadhya-naming-ceremony",
  title: "Aadhya’s naming ceremony",
  date: "2027-03-14",
  template: "blessing",
  theme: "soft-dawn",
  track: "First Light (ambient)",
  eventType: "naming_ceremony",
  headline: { title: "Aadhya", subtitle: "a name, spoken with love", invitation: "You are invited to the naming ceremony of", hosts: "Nitya & Sreejith Menon", monogram: "A" },
  honoree: { name: "Aadhya", fullName: "Aadhya Menon", role: "Our daughter", age: "28 days" },
  about: {
    eyebrow: "The little one",
    title: "Welcome, Aadhya",
    body: "On the twenty-eighth day of her life, we will whisper a name into our daughter’s ear and then say it aloud for everyone she will ever love.\n\nCome and bless her. Bring your wishes, your lullabies and your appetite — the family kitchen has been busy since Thursday.",
    highlights: [["28 days", "Old on the day", ""], ["11 am", "Sunday 14 March", "The blessing begins"], ["Lunch", "A shared feast", "Served at one"]],
  },
  images: { couple: "hero" },
  venues: [
    { key: "home", name: "Sree Vilas, the Menon family home", address: "Poonkunnam, Thrissur, Kerala 680002", city: "Thrissur", lat: 10.5276, lng: 76.2144, mapUrl: "https://www.google.com/maps/search/?api=1&query=Poonkunnam+Thrissur", airport: "Cochin International Airport (COK) is 55 km away, about 1 hour 20 minutes by car.", railway: "Thrissur Railway Station is 3 km away, about 12 minutes.", road: "From the Swaraj Round, take the Shoranur road; the house is the cream one with the tulsi in the courtyard, after the second bus stop.", parking: "Please park along the lane, or at the temple ground two minutes away." },
  ],
  events: [
    { name: "Blessings", date: "2027-03-14", start: "11:00", end: "11:45", venue: "home", description: "The elders bless Aadhya, a lamp is lit and the family gathers in the courtyard.", dress: "Traditional or smart-casual", colors: ["#F6EEE3", "#E9C9B8", "#9DB5A0"], photo: "diya" },
    { name: "The naming", date: "2027-03-14", start: "11:45", end: "12:15", venue: "home", description: "The name is whispered into her ear — and then announced to everyone.", dress: "", colors: [], photo: "hands", main: true },
    { name: "Lunch", date: "2027-03-14", start: "13:00", end: "15:00", venue: "home", description: "A vegetarian sadhya on banana leaves, served by the family. Payasam for everyone.", dress: "", colors: [], photo: "sweets" },
  ],
  ceremoniesIntro: "A few small rituals mark the day. Nothing is long, and every guest is welcome to join in.",
  ceremonies: [
    ["Lighting of the lamp", "11:00 am", "The eldest in the family lights the nilavilakku, and everyone present offers a silent blessing for the child.", "lamp", "diya"],
    ["Whispering the name", "11:45 am", "Her father whispers the name into her right ear three times, and then her mother says it softly into the left.", "flower", "hands"],
    ["The first blessings", "12:00 noon", "Each elder places a drop of honey or a touch of sandal paste on her forehead and says a wish for her.", "none", "elders"],
    ["Sweets for all", "12:30 pm", "Laddus and payasam are shared, and every guest is given a small gift to take home.", "bowl", "sweets"],
  ],
  rsvp: { deadline: "2027-03-01", askMeal: true, askAccommodation: false, askTransport: false, allowCompanions: true, mealOptions: ["Vegetarian sadhya"], thankYou: "Thank you, {name}. Aadhya will feel your blessing." },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  message: {
    title: "From the grandparents",
    body: "Our dearest ones,\n\nA new light has come into our home, and we would like you to share it with us.\n\nWe have waited a long time to hold her. Come and bless her, so that the name we give her carries every wish you have for her.",
    from: "Lakshmi & Gopalan Menon", role: "Aadhya’s paternal grandparents",
  },
  opening: { sealText: "A", invited: "You are invited to the naming ceremony of" },
  thankYou: { message: "Your blessings will stay with Aadhya all her life. Thank you for coming, for the gifts and for the laughter that filled our courtyard.\n\nWith love,", signature: "Nitya, Sreejith & Aadhya", photo: "hero" },
  seo: { title: "Aadhya’s naming ceremony — Invitation", description: "A gentle naming-ceremony invitation with the rituals explained. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "ZzlLBmKFxpA", "COUPLE", { focal: { x: 28, y: 40 } }],
    ["diya", "zNY2lVIRh7M", "EVENT"],
    ["hands", "y0OAmd_COUM", "EVENT"],
    ["elders", "ZLmLOclfeE4", "EVENT"],
    ["sweets", "WciKbLIFGxc", "EVENT"],
  ],
  gallery: [
    ["wDGrvGUWOpE", "Twenty-eight days old, and already smiling"], ["qx7ZQwbgm1c", "Asleep, between meals"], ["I8Ik4L3lPrs", "Ten tiny toes"], ["saW6YxGBFkw", "Held, always"],
    ["ybvTwLSBtSY", "Under grandmother’s blanket"], ["zx0Xt9u1ekw", "Her feet, in her father’s hand"], ["ZLmLOclfeE4", "Four generations of hands"], ["zNY2lVIRh7M", "The lamp for her first blessing"],
  ],
  wishes: [
    ["Latha Menon", "Great-aunt", "May she grow up kind and curious. My first blessing for the newest Menon, with all my love."],
    ["Anusha Pillai", "Friend", "Welcome to the world, little Aadhya! We have already chosen the lullabies."],
    ["Gopinath Nambiar", "Family friend", "A beautiful name for a beautiful day. Looking forward to the payasam."],
  ],
  extra(doc) {
    sectionCopy(doc, "about", { eyebrow: "The little one" });
    sectionCopy(doc, "ceremonies", { eyebrow: "The rituals", title: "How the day unfolds" });
    sectionCopy(doc, "events", { eyebrow: "Sunday 14 March", title: "The morning" });
    sectionCopy(doc, "gallery", { eyebrow: "Welcome, little one", title: "Her first weeks" });
    sectionCopy(doc, "message", { eyebrow: "A few words" });
  },
};
