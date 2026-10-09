import { sectionCopy } from "./showcase";
import type { OccasionCfg } from "./occasion";

/**
 * In memory of Thomas Mathew — a funeral service and prayer meeting in Kochi. Soft stone and slate; no effects at all.
 * Every name, date and place is fictional; the photographs are stand-ins and the sample says so in its footer.
 */
export const THOMAS: OccasionCfg = {
  slug: "thomas-mathew-memorial",
  title: "Thomas Mathew",
  date: "2026-10-24",
  template: "remembrance",
  theme: "quiet-light",
  track: "Evening Prayer (ambient)",
  eventType: "funeral",
  headline: { title: "Thomas Mathew", subtitle: "A life of faith, kindness and quiet strength", invitation: "In loving memory of", hosts: "", monogram: "TM", dateLabel: "" },
  honoree: { name: "Thomas Mathew", fullName: "Thomas Mathew", role: "Beloved husband, father, grandfather and teacher", born: "1946-03-12", passed: "2026-10-02", epitaph: "Forever in our hearts", photo: "portrait" },
  about: {
    eyebrow: "His story",
    title: "A life remembered",
    body: "Thomas Mathew was born in 1946 in a small village in central Kerala, the second of five children. He taught mathematics for thirty-eight years — first in a village school and then at the town’s high school, where generations of students remember him for his patience and his chalk-dusted sleeves.\n\nHe married Mary in 1974, and together they raised two children in the house he built beside the paddy field. He was a man of few words and many small kindnesses: the neighbour’s fence mended before they asked, the extra tiffin carried to school, the borrowed umbrella that was never expected back.\n\nAfter retirement he kept teaching — anyone who asked, at the dining table, free of charge. On the morning of 2 October 2026 he passed peacefully at home, with his family beside him.",
  },
  message: {
    title: "A message from the family",
    body: "With hearts full of sorrow and of gratitude, we share the passing of our beloved Appachan.\n\nHe lived simply and gave generously, and we are sure that every one of you carries a small piece of him. We would be comforted to have you with us as we say goodbye — your presence and your prayers matter more than we can say.\n\nIn place of flowers, the family asks that you consider a gift to the village school fund he cared for.",
    from: "Mary, Joseph, Susan and family", role: "On behalf of the family",
  },
  prayer: {
    title: "The Twenty-third Psalm",
    text: "The Lord is my shepherd; I shall not want.\nHe maketh me to lie down in green pastures:\nhe leadeth me beside the still waters.\nHe restoreth my soul.\nYea, though I walk through the valley of the shadow of death,\nI will fear no evil: for thou art with me.\nSurely goodness and mercy shall follow me all the days of my life:\nand I will dwell in the house of the Lord for ever.",
    source: "Psalm 23",
  },
  people: [
    { group: "Beloved wife", name: "Mary Mathew", relation: "Married for fifty-two years" },
    { group: "Children", name: "Joseph Mathew", relation: "Son", note: "With Anita, his wife" },
    { group: "Children", name: "Susan Thomas", relation: "Daughter", note: "With Philip, her husband" },
    { group: "Grandchildren", name: "Ann", relation: "" },
    { group: "Grandchildren", name: "Ethan", relation: "" },
    { group: "Grandchildren", name: "Maya", relation: "" },
    { group: "Brothers and sisters", name: "Varghese, Annamma, Kuriakose and Sosamma", relation: "" },
  ],
  images: { couple: "hero", coupleWide: "wide" },
  milestones: [
    ["1946", "Born", "In a small village in central Kerala, the second of five children.", "m1"],
    ["1968", "The first classroom", "A single room, forty children and a blackboard he repainted every June.", "m2"],
    ["1974", "Married Mary", "A quiet morning in the parish church, and the beginning of fifty-two years.", "m3"],
    ["1985", "The house by the paddy field", "Built brick by brick over three monsoons, with every neighbour’s help.", "m4"],
    ["2004", "Retired — and kept teaching", "At the dining table, any evening, for anyone who asked.", "m5"],
    ["2026", "Called home", "Peacefully, in his own house, on the morning of 2 October.", "m6"],
  ],
  venues: [
    { key: "church", name: "Holy Trinity Chapel", address: "Vyttila, Kochi, Kerala 682019", city: "Kochi", lat: 9.9677, lng: 76.3184, mapUrl: "https://www.google.com/maps/search/?api=1&query=Vyttila+Kochi", photo: "venue", airport: "Cochin International Airport (COK) is 28 km away, about 50 minutes by car.", railway: "Ernakulam South is 6 km away, about 20 minutes.", road: "At the Vyttila hub, take the service road beside the metro station; the chapel is behind the old school, 400 m ahead on the left.", parking: "Parking is available in the school ground, next to the chapel. Volunteers will guide you." },
    { key: "home", name: "Kallarackal House", address: "Near Edappally Toll, Kochi, Kerala 682024", city: "Kochi", lat: 10.0261, lng: 76.3089, mapUrl: "https://www.google.com/maps/search/?api=1&query=Edappally+Kochi", road: "The house is on the left lane after the Edappally toll, beside the pharmacy. Please park along the road.", parking: "Please park along the road, leaving the lane clear." },
  ],
  events: [
    { name: "Final respects at home", date: "2026-10-23", start: "16:00", end: "20:00", venue: "home", description: "Family and friends are welcome to pay their last respects. Prayers will be said every hour.", dress: "Simple and dark or white", colors: ["#F4F2EE", "#4E5A66"] },
    { name: "Funeral service", date: "2026-10-24", start: "10:00", end: "11:30", venue: "church", description: "A service of prayer, readings and remembrance, led by the parish priest. Please be seated by 9:45.", dress: "Simple and dark or white", colors: ["#F4F2EE", "#4E5A66", "#A39A8A"], main: true },
    { name: "Committal", date: "2026-10-24", start: "11:45", end: "12:30", venue: "church", description: "The family will lay Thomas to rest in the parish cemetery. Everyone is welcome to follow.", dress: "", colors: [] },
    { name: "Prayer meeting & refreshments", date: "2026-10-24", start: "16:00", end: "17:30", venue: "home", description: "A quiet gathering at the family home. Tea and light refreshments will be served.", dress: "", colors: [] },
  ],
  rsvp: { deadline: "2026-10-22", pickups: ["Cochin International Airport (COK)", "Ernakulam South Railway Station"], askMeal: false, askAccommodation: true, askTransport: true, allowCompanions: true, thankYou: "Thank you, {name}. It will comfort the family to know you are coming." },
  chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
  contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
  opening: { sealText: "TM", invited: "" },
  thankYou: { message: "Thank you for standing with us, for the prayers and the flowers, for every story about him that we had not heard before.\n\nWith gratitude,", signature: "Mary, Joseph, Susan and family" },
  seo: { title: "In memory of Thomas Mathew — Funeral Invitation", description: "A dignified funeral and memorial invitation: a tribute, the service, a prayer and a place for condolences. A sample design by Invites by Stack Bridge Labs.", og: "hero" },
  needs: [
    ["hero", "UpNwL3hTcRg", "COUPLE", { focal: { x: 50, y: 55 } }],
    ["wide", "3pW91fGAKiE", "COUPLE", { focal: { x: 50, y: 50 } }],
    ["portrait", "tjIrHQzYIVE", "PEOPLE", { focal: { x: 50, y: 38 } }],
    ["venue", "4KkTFccuZ0M", "VENUE"],
    ["m1", "aauHMskRPa8", "COUPLE"],
    ["m2", "heNLI144X7Y", "COUPLE"],
    ["m3", "R1H2Y7T7m3I", "COUPLE"],
    ["m4", "R9tPheZuGnA", "COUPLE"],
    ["m5", "yJFk7YwxDbA", "COUPLE"],
    ["m6", "B5AmTy1K6mk", "COUPLE"],
  ],
  gallery: [
    ["4nN6aN45y7c", "White lilies, his favourite"], ["J3H-rth8cck", "A candle for the evening prayer"], ["GAscwTkEOy8", "Candles, lit one by one"], ["FPVzkHF3wgM", "The evening he loved best"],
    ["df6Z3DPPw5U", "The lamp in the window"], ["heNLI144X7Y", "His books, still open"], ["4KkTFccuZ0M", "The garden by the chapel"], ["R9tPheZuGnA", "The path to the school"],
  ],
  wishes: [
    ["Gopinath Nambiar", "Former colleague", "He taught me how to teach. I still hear his voice every time I pick up the chalk. May he rest in peace."],
    ["Sneha Rajan", "Former student", "Thomas sir, thank you for believing in a girl who was afraid of fractions. I got there in the end, because of you."],
    ["Fatima Beevi", "Neighbour", "He mended our gate in the rain and never once mentioned it. The lane will not be the same. Our prayers are with all of you."],
  ],
  extra(doc) {
    sectionCopy(doc, "message", { eyebrow: "From the family" });
    sectionCopy(doc, "timeline", { eyebrow: "A life in moments", title: "Eighty years" });
    sectionCopy(doc, "events", { eyebrow: "23 – 24 October", title: "The services" });
    sectionCopy(doc, "venue", { title: "Where we will gather" });
    sectionCopy(doc, "gallery", { eyebrow: "Remembering", title: "Moments of quiet" });
    sectionCopy(doc, "people", { eyebrow: "Survived by", title: "His family" });
    for (const s of doc.sections) {
      if (s.type === "hero") s.variant = "fullbleed";
    }
  },
};
