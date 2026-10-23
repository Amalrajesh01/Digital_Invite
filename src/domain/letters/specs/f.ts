import type { LetterSpec } from "../types";
import { closingField, cover, long, milestoneList, palette, text } from "../kit";

/**
 * F — Closure and letting go. The only experiences with the dark theme. They never ask for a reply, never play a game, never use
 * confetti or a countdown, never send a reminder, and never try to bring anyone back: they exist to say what is true, kindly, once.
 */
export const SPECS_F: LetterSpec[] = [
  {
    slug: "the-goodbye-i-could-never-write", n: 49, title: "The Goodbye I Could Never Write",
    purpose: "A heartfelt goodbye after a relationship has ended.", feeling: "Restrained, honest and quiet.",
    category: "closure", tags: ["closure", "letter"], tone: "dark", occasion: "custom",
    palette: palette("#0f1217", "#171b22", "#e4e7ec", "#9aa3b0", "#aab4c3", "#6b2a3a", "#0f1217", true), fonts: { display: "Cormorant Garamond", body: "Inter" },
    motion: "dark", layout: "film", ambient: "dust", backdrop: "moon-dark-sea", treatment: "dim", music: "none", reply: false,
    direction: "Charcoal and midnight, muted silver with one restrained burgundy: rain on a window, slow fades, a letterboxed letter. Nothing celebrates.",
    care: ["Nothing in this experience asks for an answer: no buttons to reply, no countdown, no reminder, no repeated message.", "It is a goodbye, not a way back. It never pressures anyone to return or to respond.", "Music is off unless you choose it."],
    fields: [
      cover(),
      text("opening", "The first line", { default: "A goodbye I could not write until now." }),
      long("intro", "Introducing the letter", { rows: 3, default: "I wrote this for you, and a little for me. You do not need to answer it." }),
      milestoneList("memories", "Memories to keep", 8, [{ title: "The first winter", when: "2021", body: "Hot tea, no heating, and a very long conversation about nothing." }, { title: "The road trip", when: "2022", body: "Wrong turns, good songs, a sunrise we nearly missed." }, { title: "The last good evening", when: "Last spring", body: "We did not know. I am glad it was a good one." }]),
      long("gratitude", "What I am grateful for", { rows: 4, placeholder: "[Something that was good, and true]", sample: "You taught me how to disagree gently, and that I could be loved without performing." }),
      long("sadness", "What I am sad about", { rows: 4, placeholder: "[Honestly, without blaming]", sample: "I am sad that we could not make it hold. I am sad about the plans we will not keep." }),
      long("closure", "What I want to let go of", { rows: 4, placeholder: "[What you are putting down]", sample: "I am putting down the version of this where I keep waiting for a message." }),
      long("letter", "The goodbye", { rows: 10, placeholder: "[Your goodbye, in full]", sample: "I have tried to write this many times, and every draft was either too angry or too soft.\n\nSo I will say it simply.\n\nThank you for the time we had. I am sorry for the ways I fell short.\n\nI wish you well — truly. I am going to look after myself now." }),
      text("quote", "A line to end on (optional)", { max: 140, default: "What was good stays good, even after it ends." }),
      closingField("Goodbye, for now.\nBe well.", "Goodbye, for now.\nBe well."),
    ],
    beats: [
      { type: "gate", style: "rain", title: "@opening", cta: "Open the letter", later: true },
      { type: "lines", src: "@intro", mode: "fade" },
      { type: "timeline", list: "@memories", title: "What I want to keep", style: "rail" },
      { type: "sections", title: "What I feel", parts: [{ label: "What I am grateful for", src: "@gratitude" }, { label: "What I am sad about", src: "@sadness" }, { label: "What I am letting go of", src: "@closure" }] },
      { type: "letter", src: "@letter", title: "The goodbye" },
      { type: "closing", src: "@closing", quote: "@quote", scene: "dark" },
    ],
  },
  {
    slug: "i-will-always-be-grateful-for-us", n: 50, title: "I Will Always Be Grateful for Us",
    purpose: "Thank them, and accept that it has ended.", feeling: "Calm, mature and appreciative.",
    category: "closure", tags: ["closure", "gratitude", "letter"], tone: "dark", occasion: "custom",
    palette: palette("#0c1320", "#131c2e", "#e6eaf1", "#98a3b6", "#c2c9d4", "#7a3342", "#0c1320", true), fonts: { display: "Cormorant Garamond", body: "Jost" },
    motion: "dark", layout: "film", ambient: "dust", backdrop: "lighthouse-dusk", treatment: "mono", music: "none", reply: false,
    direction: "Midnight blue and muted silver: a lamp coming on in the dark, a lighthouse at dusk, a calm letter of thanks and a closing that asks nothing.",
    care: ["No reply is asked for. No countdown, no reminder, no repeated message.", "This is gratitude and acceptance; it is not an invitation to reconsider."],
    fields: [
      cover(),
      text("opening", "The first line", { default: "A quiet thank you." }),
      long("intro", "A quiet introduction", { rows: 3, default: "I wanted to say something kind while I am still able to say it well." }),
      milestoneList("memories", "Memories you want to acknowledge", 8, [{ title: "The beginning", when: "2020", body: "A conversation that did not want to end." }, { title: "The hard year", when: "2023", body: "We were both trying. That counts for a great deal." }, { title: "The last long walk", when: "Last autumn", body: "We were kind to each other. I will keep that." }]),
      long("meaning", "What the relationship meant", { rows: 9, placeholder: "[In your own words, what it gave you]", sample: "You made me braver than I knew how to be.\n\nYou showed me what steady love looks like, even when it was not enough.\n\nI am a better person for having known you." }),
      long("closure", "A respectful goodbye", { rows: 5, placeholder: "[What you want to say as you part]", sample: "I accept that this has ended, and I am not asking for it to be otherwise.\nI hope you are gentle with yourself.\nI hope you find everything you are looking for." }),
      text("quote", "A line to end on (optional)", { max: 140, default: "Grateful is a quieter word than sorry, and it lasts longer." }),
      closingField("Thank you.\nBe well.", "Thank you.\nBe well."),
    ],
    beats: [
      { type: "gate", style: "lamp", title: "@opening", cta: "Read it", later: true },
      { type: "lines", src: "@intro", mode: "fade" },
      { type: "timeline", list: "@memories", title: "What I want to acknowledge", style: "rail" },
      { type: "letter", src: "@meaning", title: "What it meant" },
      { type: "lines", src: "@closure", mode: "film", title: "As we part" },
      { type: "closing", src: "@closing", quote: "@quote", scene: "dark" },
    ],
  },
];
