import type { OpeningVariant } from "@/domain/doc/constants";
import type { CategorySlug, EventType } from "@/domain/doc/event-types";
import { AFTER, LIVE, layout, type Item, type TemplateSection } from "./layout";
import type { TemplateFlavor } from "./templates";

/**
 * The templates, one specification each. A template is a *design concept*, not a recolour: it chooses its own
 * visual direction, opening, hero composition and the order in which its story unfolds (see `docs/TEMPLATES.md`,
 * generated from this file). `tests/template-catalogue.test.ts` fails the build if two templates of one occasion
 * open the same way or begin with the same hero.
 *
 * Content is separate: each template is previewed with a sample invitation (`demo`) of its occasion, and a customer's
 * own invitation is made by applying the template to their details — nothing here contains customer data.
 */
export interface TemplateSpec {
  /** Template ID — also the slug in the studio and in the public address. */
  slug: string;
  /** What a customer sees. Short, easy to say. */
  name: string;
  /** The public occasion it is filed under. */
  category: CategorySlug;
  /** What an invitation made from it starts as. */
  eventType: EventType;
  direction: TemplateFlavor;
  hero: string;
  opening: OpeningVariant;
  /** Slug of the colour theme it is shown in. */
  theme: string;
  /** The idea, in a line a customer can picture. */
  concept: string;
  /** One sentence for the card. */
  tagline: string;
  /** Who it is for. */
  target: string[];
  /** How photographs are used. */
  images: string;
  /** What moves, and how. */
  motion: string;
  /** What the guest can touch. */
  interactions: string[];
  /** The slug of the sample invitation whose content previews it. */
  demo: string;
  /** Sections after the hero, in order. */
  flow: Item[];
  /** A faith-specific edition of a design, offered beside the five. */
  edition?: boolean;
  /** Not offered on the public site (older designs that existing invitations still use). */
  legacy?: boolean;
}

export const TEMPLATE_SPECS: TemplateSpec[] = [
  // ═══ WEDDING ════════════════════════════════════════════════════════════════════════════════════════════
  {
    slug: "royal-heritage", name: "Royal Heritage", category: "wedding", eventType: "hindu_wedding", direction: "royal", hero: "gateway", opening: "lamp", theme: "kasavu", demo: "meenakshi-and-aravind",
    concept: "A lamp is lit, a carved gateway opens, and the wedding is told day by day with every ritual explained.",
    tagline: "Light the lamp. Step through the gateway. Kasavu gold and temple lamps.",
    target: ["Traditional Hindu and Kerala weddings", "Families with rituals to explain to guests", "Multi-day celebrations"],
    images: "One tall portrait in a carved arch; ceremony photographs as large editorial spreads.",
    motion: "Slow and symmetrical: the flame flickers, ornament lines draw in, petals fall once.",
    interactions: ["Tap to light the lamp", "Ritual explainers that open on tap", "Add each event to your calendar", "English and Malayalam in one tap"],
    flow: [["story", { variant: "chapters" }], ["timeline", { variant: "vertical" }], ["countdown", { variant: "classic" }], ["couple", { variant: "arch" }], ["events", { variant: "editorial" }], ...LIVE,
      ["ceremonies", { variant: "editorial" }], ["family", { variant: "editorial" }], ["dresscode", { variant: "visual" }], "menu", ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], ["gallery", { variant: "editorial" }], "film", "music", "quiz", "games", "scavenger",
      ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "modern-minimal", name: "Modern Minimal", category: "wedding", eventType: "wedding", direction: "minimal", hero: "poster", opening: "seal", theme: "cream-noir", demo: "isha-and-daniel",
    concept: "A typographic poster, a single wax-seal tap and numbered chapters. Nothing that does not earn its place.",
    tagline: "Cream paper, black ink, one thread of gold. Quiet and exact.",
    target: ["Modern and interfaith weddings", "Smaller guest lists", "Couples who prefer restraint to ornament"],
    images: "The photograph is a wide band under huge names; the date is set over it in large numerals.",
    motion: "Short, crisp fades and drawn lines. No decorative motion at all.",
    interactions: ["Tap the seal to open", "Travel tabs: hotels, directions, things to do", "Add to calendar"],
    flow: [["story", { variant: "cards" }], ["timeline", { variant: "vertical" }], ["countdown", { variant: "ring" }], ["couple", { variant: "editorial" }], ["events", { variant: "rows" }], ...LIVE,
      ["menu", { variant: "classic" }], ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], ["dresscode", { variant: "palette" }], ["gallery", { variant: "masonry" }], "music", ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], ...AFTER, "contact"],
  },
  {
    slug: "cinematic-noir", name: "Cinematic Story", category: "wedding", eventType: "hindu_wedding", direction: "cinematic", hero: "reel", opening: "cinematic", theme: "midnight-sapphire", demo: "ananya-and-arjun",
    concept: "A film-title opening, a photograph held between black bars, then the story in numbered chapters and a film strip of the day.",
    tagline: "Your wedding as a film: title sequence, chapters and a strip of stills.",
    target: ["Couples with strong photography or a wedding film", "Destination weddings", "Anyone who wants guests to feel something"],
    images: "Full-screen photograph with a slow zoom; a horizontal film strip of stills right after the story.",
    motion: "Weighty, slow easing; a short title sequence (tap to skip); letterbox bars frame the page.",
    interactions: ["Tap to skip the title sequence", "Swipe through the film strip", "Watch the wedding film"],
    flow: [["story", { variant: "chapters" }], ["gallery", { variant: "filmstrip" }], ["timeline", { variant: "vertical" }], ["countdown", { variant: "classic" }], ["events", { variant: "timeline" }], ...LIVE,
      ["ceremonies", { variant: "editorial" }], ["couple", { variant: "editorial" }], ["family", { variant: "editorial" }], ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], "film", "music",
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "garden-romance", name: "Garden Romance", category: "wedding", eventType: "wedding", direction: "floral", hero: "garden", opening: "bloom", theme: "sage-blossom", demo: "nandini-and-vikram",
    concept: "A bud unfolds into an oval portrait among hand-drawn leaves; the story is told in soft script over sage and rose.",
    tagline: "A flower blooms, leaves frame your portrait. Soft, green and romantic.",
    target: ["Garden, resort and lawn weddings", "Couples who love flowers and soft colour", "Daytime ceremonies"],
    images: "An oval portrait in a ring of leaves; arched couple portraits; a sliding carousel of garden photographs.",
    motion: "Very soft easing; petals drift down once; the flower opens petal by petal.",
    interactions: ["Tap the bud to bloom", "Illustrated venue map", "Slide through the garden carousel"],
    flow: [["couple", { variant: "arch" }], ["story", { variant: "cards" }], ["countdown", { variant: "ring" }], ["events", { variant: "cards" }], ...LIVE,
      ["ceremonies", { variant: "grid" }], ["family", { variant: "list" }], ["venue", { variant: "map" }], ["dresscode", { variant: "visual" }], ["gallery", { variant: "carousel" }], "music", ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "sangeet-night", name: "Sangeet Night", category: "wedding", eventType: "wedding", direction: "playful", hero: "polaroids", opening: "ticket", theme: "festive-pop", demo: "riya-and-sameer",
    concept: "A ticket to tear, a table of snapshots and stickers: the wedding that starts as a party.",
    tagline: "Tear the ticket, see the snapshots. Colourful, loud and fun.",
    target: ["Sangeet and mehendi nights", "Younger couples", "Weddings where the guests are family and friends first"],
    images: "Three snapshots with tape on a table; photographs stay as polaroids all the way down.",
    motion: "Springy overshoot; the ticket stub falls away; cards pop in with a small tilt.",
    interactions: ["Tear the ticket to open", "Quiz: how well do you know us?", "Games and a photo scavenger hunt on the day"],
    flow: [["countdown", { variant: "events" }], ["events", { variant: "cards" }], ...LIVE, "quiz", "games", "scavenger", ["couple", { variant: "portraits" }], ["story", { variant: "cards" }], "music", ["gallery", { variant: "polaroid" }],
      ["dresscode", { variant: "palette" }], ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "chapel-romance", name: "Chapel Romance", category: "wedding", eventType: "christian_wedding", direction: "royal", hero: "fullbleed", opening: "seal", theme: "ivory-chapel", demo: "anna-and-joseph", edition: true,
    concept: "For a church wedding: a wax-seal opening, a full-screen photograph, the day from betrothal to reception and the service explained.",
    tagline: "A church wedding in ivory, sage and champagne.",
    target: ["Christian weddings", "Betrothals and receptions", "Guest lists with other faiths"],
    images: "Full-screen couple photograph; church and aisle photographs as editorial spreads.",
    motion: "Soft confetti as the invitation opens; slow, symmetrical reveals.",
    interactions: ["Tap the wax seal to open", "Church service explained step by step"],
    flow: [["story", { variant: "chapters" }], ["timeline", { variant: "vertical" }], ["countdown", { variant: "classic" }], ["couple", { variant: "editorial" }], ["events", { variant: "editorial" }], ...LIVE, ["ceremonies", { variant: "editorial" }], ["family", { variant: "editorial" }],
      "dresscode", "menu", "venue", ["travel", { variant: "tabs" }], ["gallery", { variant: "editorial" }], "film", "music", ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "nikah-noor", name: "Nikah Noor", category: "wedding", eventType: "muslim_wedding", direction: "royal", hero: "fullbleed", opening: "curtain", theme: "emerald-ivory", demo: "zainab-and-imran", edition: true,
    concept: "For a Muslim wedding: curtains part on a full-screen photograph; mehendi, nikah and walima set as spreads, traditions explained with care.",
    tagline: "Emerald and gold: the mehendi, the nikah and the walima.",
    target: ["Nikah and walima", "Interfaith guest lists", "Families who want the traditions explained"],
    images: "Full-screen couple photograph; henna and nikah details as spreads.",
    motion: "Curtains part slowly; soft confetti in emerald and gold.",
    interactions: ["Tap to open the curtains", "Traditions explained for guests who are new to them"],
    flow: [["story", { variant: "chapters" }], ["timeline", { variant: "vertical" }], ["countdown", { variant: "classic" }], ["couple", { variant: "arch" }], ["events", { variant: "editorial" }], ...LIVE, ["ceremonies", { variant: "editorial" }], ["family", { variant: "editorial" }],
      "dresscode", "menu", "venue", ["travel", { variant: "tabs" }], ["gallery", { variant: "editorial" }], "film", "music", ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },

  // ═══ ENGAGEMENT ═════════════════════════════════════════════════════════════════════════════════════════
  {
    slug: "ring-ceremony", name: "Ring Ceremony", category: "engagement", eventType: "engagement", direction: "royal", hero: "gateway", opening: "lamp", theme: "marigold-maroon", demo: "tara-and-nikhil",
    concept: "A lamp is lit for the betrothal; the families meet in a carved gateway of maroon and marigold.",
    tagline: "A traditional betrothal in maroon and marigold, with every custom explained.",
    target: ["Ring ceremonies and betrothals", "Two families meeting formally", "Guests from another community"],
    images: "One arched couple portrait; ritual photographs set as editorial spreads.",
    motion: "Slow and symmetrical; the lamp flame flickers; ornament lines draw in.",
    interactions: ["Tap to light the lamp", "Rituals explained one by one", "Add to calendar"],
    flow: [["about", { variant: "editorial" }], ["ceremonies", { variant: "editorial" }], ["countdown", { variant: "classic" }], ["events", { variant: "editorial" }], ...LIVE, ["family", { variant: "editorial" }], ["venue", { variant: "classic" }], ["dresscode", { variant: "palette" }],
      ["gallery", { variant: "editorial" }], "music", ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "romance", name: "Blush Romance", category: "engagement", eventType: "engagement", direction: "floral", hero: "garden", opening: "bloom", theme: "peony-champagne", demo: "tara-and-nikhil",
    concept: "A bud blooms into an oval portrait; the story of the proposal is told in script, and the two of them walk towards each other as you scroll.",
    tagline: "Blush, champagne and a calligraphic hand. The proposal as a love letter.",
    target: ["Romantic ring ceremonies", "Couples with a story to tell", "Intimate guest lists"],
    images: "Oval portrait among leaves; the story in photographs set as soft cards.",
    motion: "Soft and slow; the two small figures walk towards each other as you scroll.",
    interactions: ["Tap the bud to bloom", "The couple walks together as you scroll", "Slide through the gallery"],
    flow: [["countdown", { variant: "ring" }], ["about", { variant: "editorial" }], ["story", { variant: "chapters" }], ["timeline", { variant: "vertical" }], ["events", { variant: "cards" }], ...LIVE, ["ceremonies", { variant: "grid" }], ["venue", { variant: "classic" }],
      ["dresscode", { variant: "palette" }], ["gallery", { variant: "carousel" }], "music", ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "the-proposal", name: "The Proposal", category: "engagement", eventType: "engagement", direction: "cinematic", hero: "reel", opening: "cinematic", theme: "midnight-sapphire", demo: "tara-and-nikhil",
    concept: "How he asked — told as a short film: title cards, a strip of stills, then the evening itself.",
    tagline: "The proposal as a short film, in midnight blue and gold.",
    target: ["Couples who want the story of the proposal told", "Evening ring ceremonies", "Guests who love photographs"],
    images: "Full-screen photograph between black bars; a film strip of stills straight after the story.",
    motion: "Slow zoom on the opening photograph; weighty fades between chapters.",
    interactions: ["Tap to skip the title cards", "Swipe through the film strip"],
    flow: [["story", { variant: "chapters" }], ["timeline", { variant: "vertical" }], ["gallery", { variant: "filmstrip" }], ["countdown", { variant: "classic" }], ["events", { variant: "timeline" }], ...LIVE, ["ceremonies", { variant: "grid" }], ["venue", { variant: "classic" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "say-yes", name: "Say Yes!", category: "engagement", eventType: "engagement", direction: "playful", hero: "polaroids", opening: "balloons", theme: "bubblegum", demo: "tara-and-nikhil",
    concept: "Balloons to pop and a table of snapshots: an engagement party that feels like one.",
    tagline: "Pop the balloons! Bubblegum pink, snapshots and good news.",
    target: ["Engagement parties", "Young couples", "Friend-heavy guest lists"],
    images: "Snapshots with tape, tilted on a table; polaroid-style gallery throughout.",
    motion: "Springy overshoot; balloons burst into confetti; cards pop in with a small tilt.",
    interactions: ["Tap to pop the balloons", "Quiz: how well do you know us?", "Polaroid gallery"],
    flow: [["countdown", { variant: "events" }], ["about", { variant: "facts" }], ["events", { variant: "cards" }], ...LIVE, "quiz", "music", ["gallery", { variant: "polaroid" }], ["dresscode", { variant: "palette" }], ["venue", { variant: "classic" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "two-rings", name: "Two Rings", category: "engagement", eventType: "engagement", direction: "minimal", hero: "numeral", opening: "seal", theme: "paper-blue", demo: "tara-and-nikhil",
    concept: "The day of the month, huge, with your photograph inside it; everything after is hairlines and numbered chapters.",
    tagline: "The date as a giant number with your photo inside. Paper and ink blue.",
    target: ["Small, modern ring ceremonies", "Couples who like design", "Quiet, confident invitations"],
    images: "The couple photograph is the fill of the date numeral; later photographs sit in a plain masonry.",
    motion: "Crisp, short fades. Nothing decorative moves.",
    interactions: ["Tap the seal to open", "Add to calendar"],
    flow: [["about", { variant: "statement" }], ["timeline", { variant: "vertical" }], ["events", { variant: "rows" }], ...LIVE, ["ceremonies", { variant: "grid" }], ["venue", { variant: "classic" }], ["dresscode", { variant: "palette" }], ["gallery", { variant: "masonry" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], ...AFTER, "contact"],
  },

  // ═══ BIRTHDAY ═══════════════════════════════════════════════════════════════════════════════════════════
  {
    slug: "gala-night", name: "Gala Night", category: "birthday", eventType: "birthday", direction: "cinematic", hero: "fullbleed", opening: "ticket", theme: "noir-champagne", demo: "meera-turns-thirty",
    concept: "An admit-one ticket opens onto a full-screen portrait: black lacquer, champagne and a night laid out hour by hour.",
    tagline: "Black tie, champagne and a skyline. Tear the ticket to enter.",
    target: ["Milestone birthdays — 25, 30, 40, 50", "Rooftop and restaurant parties", "Hosts who want a dress code taken seriously"],
    images: "A full-screen portrait of the guest of honour; candlelit table and skyline details.",
    motion: "Slow, weighty fades; the ticket stub tears away.",
    interactions: ["Tear the ticket to open", "Dress code visual guide", "Wall of wishes"],
    flow: [["about", { variant: "statement" }], ["timeline", { variant: "vertical" }], ["countdown", { variant: "classic" }], ["events", { variant: "editorial" }], ...LIVE, ["dresscode", { variant: "visual" }], ["venue", { variant: "classic" }], ["gallery", { variant: "editorial" }], "music",
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "little-celebration", name: "Little Celebration", category: "birthday", eventType: "kids_birthday", direction: "playful", hero: "polaroids", opening: "balloons", theme: "confetti-pop", demo: "aarav-turns-three",
    concept: "Balloons to pop, snapshots on a table and the party plan at a glance — made for parents as much as for children.",
    tagline: "Pop the balloons! Party details at a glance, and a note from the parents.",
    target: ["Birthdays for ages 1 to 12", "Themed parties — dinosaurs, space, jungle", "Parents tired of “what time does it end?”"],
    images: "Snapshots of the birthday child on a table; a polaroid gallery of party photographs.",
    motion: "Springy overshoot; the balloons burst into confetti; sticker cards pop in.",
    interactions: ["Tap to pop the balloons", "Add to calendar", "Wall of birthday wishes"],
    flow: [["about", { variant: "facts" }], ["events", { variant: "cards" }], ...LIVE, ["dresscode", { variant: "palette" }], ["venue", { variant: "classic" }], ["gallery", { variant: "polaroid" }], ["message", { variant: "letter" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "milestone", name: "Big Number", category: "birthday", eventType: "birthday", direction: "minimal", hero: "numeral", opening: "seal", theme: "lime-ink", demo: "meera-turns-thirty",
    concept: "The age, huge, with the birthday portrait inside it; then a clean, numbered invitation in black ink and one line of lime.",
    tagline: "The age as a giant number with your photo inside it.",
    target: ["Milestone birthdays", "Design-minded hosts", "Adults who want something modern, not a card"],
    images: "The portrait is the fill of the age numeral; later photographs in a plain masonry.",
    motion: "Crisp and short; the number draws in.",
    interactions: ["Tap the seal to open", "Add to calendar"],
    flow: [["about", { variant: "statement" }], ["timeline", { variant: "vertical" }], ["events", { variant: "rows" }], ...LIVE, ["venue", { variant: "classic" }], ["dresscode", { variant: "palette" }], ["gallery", { variant: "masonry" }], "music",
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], ...AFTER, "contact"],
  },
  {
    slug: "garden-party", name: "Garden Party", category: "birthday", eventType: "birthday", direction: "floral", hero: "garden", opening: "bloom", theme: "peach-garden", demo: "meera-turns-thirty",
    concept: "An oval portrait among leaves, a bud that blooms to open, and a lunch under the trees.",
    tagline: "A flower blooms, a lunch under the trees. Peach, coral and script.",
    target: ["Daytime birthdays and brunches", "Garden and terrace parties", "Hosts who love flowers"],
    images: "An oval portrait in a ring of leaves; a sliding carousel of party photographs.",
    motion: "Very soft; petals drift down once; the flower opens petal by petal.",
    interactions: ["Tap the bud to bloom", "Slide through the carousel"],
    flow: [["about", { variant: "editorial" }], ["countdown", { variant: "ring" }], ["events", { variant: "cards" }], ...LIVE, ["dresscode", { variant: "visual" }], ["venue", { variant: "map" }], ["gallery", { variant: "carousel" }], ["message", { variant: "pull" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "royal-celebration", name: "Royal Celebration", category: "birthday", eventType: "birthday", direction: "royal", hero: "arch", opening: "curtain", theme: "plum-gold", demo: "meera-turns-thirty",
    concept: "Curtains part on an arched portrait in plum and antique gold: a formal, festive birthday for a grand occasion.",
    tagline: "Curtains part on plum and gold. For a birthday that is a grand occasion.",
    target: ["Big family birthdays — 50th, 60th, 75th", "Formal dinners and banquet halls", "Hosts who want ceremony and ornament"],
    images: "An arched portrait of the guest of honour; photographs of the family as editorial spreads.",
    motion: "Slow, symmetrical; curtains part; ornament lines draw in.",
    interactions: ["Tap to open the curtains", "Dress code guide", "Wall of wishes"],
    flow: [["about", { variant: "editorial" }], ["countdown", { variant: "classic" }], ["events", { variant: "editorial" }], ...LIVE, ["dresscode", { variant: "visual" }], ["venue", { variant: "classic" }], ["gallery", { variant: "editorial" }], "music",
      ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },

  // ═══ ANNIVERSARY ════════════════════════════════════════════════════════════════════════════════════════
  {
    slug: "silver-jubilee", name: "Silver Jubilee", category: "anniversary", eventType: "anniversary", direction: "minimal", hero: "numeral", opening: "seal", theme: "silver-jubilee", demo: "helen-and-george",
    concept: "The number of years, huge, with the couple inside it; then the years as an editorial timeline, a letter from the children and the reception.",
    tagline: "Twenty-five years as a giant number, then the story of them.",
    target: ["Silver and golden jubilees", "Vow renewals", "Families gathering from many cities"],
    images: "The couple's photograph fills the numeral; old family photographs set against the years.",
    motion: "Crisp and calm; the number draws in.",
    interactions: ["Tap the seal to open", "A letter from the children", "Wall of wishes"],
    flow: [["story", { variant: "chapters" }], ["timeline", { variant: "vertical" }], ["people", { variant: "cards" }], ["message", { variant: "letter" }], ["countdown", { variant: "classic" }], ["events", { variant: "rows" }], ...LIVE, ["venue", { variant: "classic" }],
      ["gallery", { variant: "editorial" }], ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "golden-years", name: "Golden Years", category: "anniversary", eventType: "anniversary", direction: "royal", hero: "gateway", opening: "doors", theme: "royal-gold", demo: "helen-and-george",
    concept: "Carved doors swing open onto a gateway of gold: a thanksgiving, a family and the years they built.",
    tagline: "Doors open on gold and maroon. A family celebrates a long marriage.",
    target: ["25th, 40th and 50th anniversaries", "Thanksgiving prayers and receptions", "Large extended families"],
    images: "A couple portrait in a carved arch; family photographs as editorial spreads.",
    motion: "Slow, symmetrical; the doors open in three dimensions; the lamps flicker.",
    interactions: ["Tap to open the doors", "A letter from the children", "Wall of wishes"],
    flow: [["story", { variant: "chapters" }], ["people", { variant: "groups" }], ["message", { variant: "letter" }], ["countdown", { variant: "classic" }], ["events", { variant: "editorial" }], ...LIVE, ["venue", { variant: "classic" }],
      ["gallery", { variant: "editorial" }], "music", ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "years-in-film", name: "Our Years, In Film", category: "anniversary", eventType: "anniversary", direction: "cinematic", hero: "reel", opening: "cinematic", theme: "midnight-sapphire", demo: "helen-and-george",
    concept: "Their years as a film: title cards, a strip of stills from every decade, then the evening.",
    tagline: "A marriage as a short film, from the first photograph to today.",
    target: ["Couples with decades of photographs", "Surprise anniversary parties for parents", "Children organising a tribute"],
    images: "Full-screen photograph between black bars; a film strip of stills through the years.",
    motion: "Slow zoom; weighty fades; letterbox bars.",
    interactions: ["Tap to skip the title cards", "Swipe through the film strip", "Wall of wishes"],
    flow: [["timeline", { variant: "vertical" }], ["gallery", { variant: "filmstrip" }], ["story", { variant: "chapters" }], ["message", { variant: "pull" }], ["countdown", { variant: "classic" }], ["events", { variant: "timeline" }], ...LIVE, ["venue", { variant: "classic" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "rose-garden", name: "Rose Garden", category: "anniversary", eventType: "anniversary", direction: "floral", hero: "garden", opening: "bloom", theme: "rose-gold", demo: "helen-and-george",
    concept: "A rose unfolds into an oval portrait among leaves; the years told in soft script.",
    tagline: "A rose blooms to open. Blush, copper and a handwritten story.",
    target: ["Romantic anniversaries", "Garden lunches and tea parties", "Hosts who love soft colour"],
    images: "An oval portrait in a ring of leaves; a carousel of photographs through the years.",
    motion: "Very soft; petals drift once; the flower opens petal by petal.",
    interactions: ["Tap the bud to bloom", "Slide through the carousel", "Wall of wishes"],
    flow: [["story", { variant: "cards" }], ["message", { variant: "letter" }], ["countdown", { variant: "ring" }], ["events", { variant: "cards" }], ...LIVE, ["venue", { variant: "map" }], ["gallery", { variant: "carousel" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "date-night", name: "Date Night", category: "anniversary", eventType: "anniversary", direction: "playful", hero: "polaroids", opening: "ticket", theme: "sunset-pop", demo: "helen-and-george",
    concept: "A ticket to tear and a table of snapshots: an anniversary party that feels like a night out.",
    tagline: "Tear the ticket — magenta, amber and snapshots from every year.",
    target: ["Younger couples", "Anniversary parties with friends", "Hosts who want a laugh as well as a tear"],
    images: "Snapshots on a table; every gallery photograph is a polaroid.",
    motion: "Springy overshoot; the ticket stub falls away.",
    interactions: ["Tear the ticket to open", "Polaroid gallery", "Wall of wishes"],
    flow: [["countdown", { variant: "events" }], ["events", { variant: "cards" }], ["gallery", { variant: "polaroid" }], ["timeline", { variant: "vertical" }], ...LIVE, "music", ["venue", { variant: "classic" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },

  // ═══ HOUSEWARMING ═══════════════════════════════════════════════════════════════════════════════════════
  {
    slug: "griha-pravesh", name: "Griha Pravesh", category: "housewarming", eventType: "housewarming", direction: "royal", hero: "gateway", opening: "doors", theme: "kasavu", demo: "nair-griha-pravesh",
    concept: "Carved doors swing open onto the new home. The puja, the first boiling of milk and the lunch, set out in order.",
    tagline: "Open the door to the new home. Kasavu gold and temple lamps.",
    target: ["Traditional house blessings", "Hindu, Kerala and South Indian families", "Hosts with rituals to explain"],
    images: "The new home in a carved arch; ritual and room photographs as editorial spreads.",
    motion: "Slow and symmetrical; the doors open in three dimensions; lamps flicker.",
    interactions: ["Tap to open the doors", "Rituals explained one by one", "Directions with one tap"],
    flow: [["about", { variant: "editorial" }], ["ceremonies", { variant: "editorial" }], ["countdown", { variant: "classic" }], ["events", { variant: "editorial" }], ...LIVE, ["message", { variant: "letter" }], ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }],
      ["gallery", { variant: "editorial" }], ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "open-house", name: "Open House", category: "housewarming", eventType: "housewarming", direction: "minimal", hero: "poster", opening: "seal", theme: "paper-blue", demo: "nair-griha-pravesh",
    concept: "The address as a poster, a seal to open, then the day in big dates and plain lines.",
    tagline: "The new address, set like a poster. Paper and ink blue.",
    target: ["Modern apartment and villa housewarmings", "Friends-and-family open houses", "Hosts who like things clean"],
    images: "The home as a wide band under huge type; later photographs in a plain masonry.",
    motion: "Crisp, short fades; nothing decorative moves.",
    interactions: ["Tap the seal to open", "One-tap directions"],
    flow: [["about", { variant: "statement" }], ["events", { variant: "rows" }], ...LIVE, ["ceremonies", { variant: "grid" }], ["venue", { variant: "classic" }], ["gallery", { variant: "masonry" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], ...AFTER, "contact"],
  },
  {
    slug: "home-story", name: "Our First Home", category: "housewarming", eventType: "housewarming", direction: "cinematic", hero: "reel", opening: "cinematic", theme: "ember-dusk", demo: "nair-griha-pravesh",
    concept: "A lit window at dusk: the story of building the home, a strip of stills, then the evening of the blessing.",
    tagline: "How this home was built — told as a short film, in ember and charcoal.",
    target: ["Families who built or renovated their home", "Hosts who want to share the story", "Evening housewarmings"],
    images: "Full-screen photograph of the home between black bars; a film strip of the build and the rooms.",
    motion: "Slow zoom; weighty fades; letterbox bars.",
    interactions: ["Tap to skip the title cards", "Swipe through the film strip", "One-tap directions"],
    flow: [["about", { variant: "statement" }], ["gallery", { variant: "filmstrip" }], ["timeline", { variant: "vertical" }], ["events", { variant: "timeline" }], ...LIVE, ["ceremonies", { variant: "editorial" }], ["venue", { variant: "classic" }], ["message", { variant: "pull" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "garden-home", name: "Garden Home", category: "housewarming", eventType: "housewarming", direction: "floral", hero: "garden", opening: "bloom", theme: "soft-dawn", demo: "nair-griha-pravesh",
    concept: "A flower blooms to open; an oval view of the home among leaves; the blessing, the lunch and the garden.",
    tagline: "A flower blooms, a new home among leaves. Sage, peach and ivory.",
    target: ["Housewarmings with a garden or courtyard", "Soft, family-first gatherings", "Daytime blessings"],
    images: "An oval photograph of the home among leaves; a sliding carousel of rooms and garden.",
    motion: "Very soft; petals drift once; the flower opens petal by petal.",
    interactions: ["Tap the bud to bloom", "Illustrated map to the door", "Slide through the carousel"],
    flow: [["about", { variant: "editorial" }], ["ceremonies", { variant: "grid" }], ["events", { variant: "cards" }], ...LIVE, ["venue", { variant: "map" }], ["gallery", { variant: "carousel" }], ["message", { variant: "letter" }],
      ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "house-party", name: "House Party", category: "housewarming", eventType: "housewarming", direction: "playful", hero: "polaroids", opening: "ticket", theme: "confetti-pop", demo: "nair-griha-pravesh",
    concept: "A ticket to tear and snapshots of the new place: a housewarming that starts as a party.",
    tagline: "Tear the ticket, come see the new place. Bright and friendly.",
    target: ["Young families and friends", "Evening housewarming parties", "Hosts who want it relaxed"],
    images: "Snapshots of the new home on a table; polaroid gallery of the rooms.",
    motion: "Springy overshoot; the ticket stub falls away; cards pop in.",
    interactions: ["Tear the ticket to open", "Polaroid gallery", "One-tap directions"],
    flow: [["about", { variant: "facts" }], ["countdown", { variant: "events" }], ["events", { variant: "cards" }], ...LIVE, ["gallery", { variant: "polaroid" }], ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },

  // ═══ NAMING CEREMONY ════════════════════════════════════════════════════════════════════════════════════
  {
    slug: "naming-lamp", name: "Namakarana", category: "naming-ceremony", eventType: "naming_ceremony", direction: "royal", hero: "gateway", opening: "lamp", theme: "saffron-deep", demo: "aadhya-naming-ceremony",
    concept: "A lamp is lit for the little one; the rituals of the day — the whispered name, the first blessings — explained in a few warm lines.",
    tagline: "Light the lamp for the little one. Saffron, sandalwood and gold.",
    target: ["Traditional naming ceremonies", "Grandparents who want the rituals understood", "Home gatherings"],
    images: "The baby in a carved arch; family and ritual photographs as editorial spreads.",
    motion: "Slow and symmetrical; the lamp flame flickers.",
    interactions: ["Tap to light the lamp", "Rituals explained one by one", "Wall of blessings"],
    flow: [["about", { variant: "editorial" }], ["ceremonies", { variant: "editorial" }], ["message", { variant: "letter" }], ["events", { variant: "editorial" }], ...LIVE, ["venue", { variant: "classic" }], ["gallery", { variant: "editorial" }], ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "blessing", name: "Soft Blessing", category: "naming-ceremony", eventType: "naming_ceremony", direction: "floral", hero: "garden", opening: "bloom", theme: "soft-dawn", demo: "aadhya-naming-ceremony",
    concept: "A flower blooms to open; an oval portrait of the little one among leaves; the rituals and a note from the grandparents.",
    tagline: "A flower blooms for the newborn. Ivory, sage and a touch of peach.",
    target: ["Naming ceremonies and baby welcomes", "Soft, family-first gatherings", "Daytime lunches at home"],
    images: "An oval portrait of the baby among leaves; a masonry of family photographs.",
    motion: "Very soft; petals drift once; the flower opens petal by petal.",
    interactions: ["Tap the bud to bloom", "Rituals explained", "Wall of blessings"],
    flow: [["about", { variant: "editorial" }], ["ceremonies", { variant: "editorial" }], ["events", { variant: "cards" }], ...LIVE, ["message", { variant: "letter" }], ["venue", { variant: "classic" }], ["gallery", { variant: "masonry" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "little-star", name: "Little Star", category: "naming-ceremony", eventType: "naming_ceremony", direction: "playful", hero: "polaroids", opening: "balloons", theme: "baby-pastel", demo: "aadhya-naming-ceremony",
    concept: "Balloons to pop and snapshots of the little one: a welcome party in powder blue and blush.",
    tagline: "Pop the balloons! Powder blue, blush and a little star.",
    target: ["Baby welcomes and naming parties", "Young parents", "Friends-and-family celebrations"],
    images: "Snapshots of the baby on a table; polaroid gallery of the family.",
    motion: "Springy overshoot; balloons burst into confetti; cards pop in.",
    interactions: ["Tap to pop the balloons", "Polaroid gallery", "Wall of blessings"],
    flow: [["about", { variant: "facts" }], ["events", { variant: "cards" }], ["ceremonies", { variant: "grid" }], ...LIVE, ["gallery", { variant: "polaroid" }], ["message", { variant: "letter" }], ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "lullaby", name: "Lullaby", category: "naming-ceremony", eventType: "naming_ceremony", direction: "cinematic", hero: "reel", opening: "cinematic", theme: "lullaby", demo: "aadhya-naming-ceremony",
    concept: "A nursery at night: indigo and candle-gold, a title card for the little one, a strip of first photographs.",
    tagline: "The first photographs as a gentle film. Indigo and candle-gold.",
    target: ["Parents who love photography", "Evening ceremonies", "Naming ceremonies with a story to share"],
    images: "Full-screen portrait between black bars; a film strip of the first weeks.",
    motion: "Slow zoom and slow fades — the calmest cinematic opening of all.",
    interactions: ["Tap to skip the title cards", "Swipe through the film strip", "Wall of blessings"],
    flow: [["about", { variant: "statement" }], ["gallery", { variant: "filmstrip" }], ["ceremonies", { variant: "editorial" }], ["events", { variant: "timeline" }], ...LIVE, ["message", { variant: "pull" }], ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "quiet-welcome", name: "Quiet Welcome", category: "naming-ceremony", eventType: "naming_ceremony", direction: "minimal", hero: "poster", opening: "seal", theme: "ivory-chapel", demo: "aadhya-naming-ceremony",
    concept: "The name of the day, set like a poster; a seal to open; the plan in big dates and plain lines.",
    tagline: "Ivory and sage; the welcome as a poster. Calm and clear.",
    target: ["Small, quiet gatherings", "Modern parents", "Naming ceremonies with only close family"],
    images: "A wide photograph under huge type; later photographs in a plain masonry.",
    motion: "Crisp, short fades; nothing decorative moves.",
    interactions: ["Tap the seal to open", "One-tap directions"],
    flow: [["about", { variant: "statement" }], ["ceremonies", { variant: "grid" }], ["events", { variant: "rows" }], ...LIVE, ["message", { variant: "letter" }], ["venue", { variant: "classic" }], ["gallery", { variant: "masonry" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], ...AFTER, "contact"],
  },

  // ═══ RELIGIOUS & CULTURAL ═══════════════════════════════════════════════════════════════════════════════
  {
    slug: "sacred-lamp", name: "Sacred Lamp", category: "religious", eventType: "religious_ceremony", direction: "royal", hero: "gateway", opening: "lamp", theme: "saffron-deep", demo: "satyanarayana-puja",
    concept: "A lamp is lit, a carved gateway opens, and the rites of the day are explained in order, with the prayer set in full.",
    tagline: "Light the lamp. Saffron, sandalwood and gold, with each rite explained.",
    target: ["Pujas, homams and temple functions", "Guests who need to know what to expect", "Family and community gatherings"],
    images: "The deity or the family in a carved arch; ritual photographs as editorial spreads.",
    motion: "Slow and symmetrical; the lamp flickers; ornament lines draw in.",
    interactions: ["Tap to light the lamp", "The prayer read in full", "One-tap directions"],
    flow: [["about", { variant: "editorial" }], ["ceremonies", { variant: "editorial" }], ["countdown", { variant: "classic" }], ["events", { variant: "editorial" }], ...LIVE, ["prayer", { variant: "verse" }], ["venue", { variant: "classic" }], ["gallery", { variant: "editorial" }], ["rsvp", { variant: "classic" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "quiet-prayer", name: "Quiet Prayer", category: "religious", eventType: "religious_ceremony", direction: "minimal", hero: "poster", opening: "seal", theme: "cream-noir", demo: "satyanarayana-puja",
    concept: "Plain, still and clear: the day as a poster, the rites in a simple grid, the prayer in large type.",
    tagline: "Cream and ink. The rites, the time and the prayer — nothing more.",
    target: ["Any faith: church, mosque, gurdwara, temple or home", "Hosts who want the invitation to be quiet", "Elders who prefer large, clear text"],
    images: "One wide photograph under huge type; later photographs in a plain masonry.",
    motion: "Crisp, short fades; nothing decorative moves.",
    interactions: ["Tap the seal to open", "One-tap directions"],
    flow: [["about", { variant: "statement" }], ["ceremonies", { variant: "grid" }], ["prayer", { variant: "verse" }], ["events", { variant: "rows" }], ...LIVE, ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], ...AFTER, "contact"],
  },
  {
    slug: "festival-lights", name: "Festival of Lights", category: "religious", eventType: "festival", direction: "cinematic", hero: "reel", opening: "cinematic", theme: "midnight-marigold", demo: "onam-celebration",
    concept: "The festival after dark: a title card, a strip of stills, the programme from the first lamp to the feast.",
    tagline: "Marigold and ember on night. A festival as a film.",
    target: ["Diwali, Onam, Navratri and Eid evenings", "Community festivals", "Hosts with a photo history to show"],
    images: "Full-screen photograph between black bars; a film strip of past celebrations.",
    motion: "Slow zoom; weighty fades; letterbox bars.",
    interactions: ["Tap to skip the title cards", "Swipe through the film strip", "One-tap directions"],
    flow: [["about", { variant: "statement" }], ["gallery", { variant: "filmstrip" }], ["events", { variant: "timeline" }], ...LIVE, ["ceremonies", { variant: "editorial" }], ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "flower-offering", name: "Flower Offering", category: "religious", eventType: "religious_ceremony", direction: "floral", hero: "garden", opening: "bloom", theme: "marigold-garden", demo: "satyanarayana-puja",
    concept: "A flower blooms to open; an oval portrait among leaves; the rites and the prayer in soft script.",
    tagline: "A marigold blooms to open. Orange, leaf green and cream.",
    target: ["Pujas with flowers at the centre", "Daytime ceremonies at home or temple", "Softer, family-first gatherings"],
    images: "An oval photograph among leaves; a sliding carousel of the day.",
    motion: "Very soft; petals drift once; the flower opens petal by petal.",
    interactions: ["Tap the bud to bloom", "Illustrated map", "Slide through the carousel"],
    flow: [["about", { variant: "editorial" }], ["ceremonies", { variant: "grid" }], ["events", { variant: "cards" }], ...LIVE, ["prayer", { variant: "verse" }], ["venue", { variant: "map" }], ["gallery", { variant: "carousel" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },
  {
    slug: "community-fest", name: "Community Fest", category: "religious", eventType: "festival", direction: "playful", hero: "polaroids", opening: "balloons", theme: "festive-pop", demo: "onam-celebration",
    concept: "Balloons to pop and snapshots of past years: a neighbourhood festival that wants everyone to come.",
    tagline: "Pop the balloons — a festival for the whole street.",
    target: ["Residents' associations and societies", "Community and cultural festivals", "School and college fests"],
    images: "Snapshots of past festivals on a table; polaroid gallery.",
    motion: "Springy overshoot; balloons burst into confetti.",
    interactions: ["Tap to pop the balloons", "Polaroid gallery", "Partners and supporters"],
    flow: [["about", { variant: "facts" }], ["countdown", { variant: "events" }], ["events", { variant: "cards" }], ...LIVE, ["gallery", { variant: "polaroid" }], ["sponsors", { variant: "tiers" }], ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "wall" }], ...AFTER, "contact"],
  },

  // ═══ CORPORATE EVENTS ═══════════════════════════════════════════════════════════════════════════════════
  {
    slug: "executive-conclave", name: "Executive Conclave", category: "corporate", eventType: "conclave", direction: "minimal", hero: "poster", opening: "ticket", theme: "boardroom-navy", demo: "leadership-conclave-2026",
    concept: "The event as a poster, an entry pass to tear, then the programme in numbered chapters: registration first.",
    tagline: "Navy, ivory and brass. Registration up front, the programme day by day.",
    target: ["Leadership forums and invitation-only gatherings", "Board retreats and annual meets", "Senior audiences"],
    images: "A wide venue or stage photograph under huge type; speaker portraits in a grid.",
    motion: "Crisp, quick fades; the pass tears away.",
    interactions: ["Tear the pass to enter", "Register in one tap", "Add each session to your calendar"],
    flow: [["about", { variant: "facts" }], ["countdown", { variant: "classic" }], ["speakers", { variant: "featured" }], ["agenda", { variant: "days" }], ["sponsors", { variant: "tiers" }], ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], ["dresscode", { variant: "palette" }], ["rsvp", { variant: "classic" }], ...LIVE, ...AFTER, "contact"],
  },
  {
    slug: "annual-gala", name: "Annual Gala", category: "corporate", eventType: "corporate_event", direction: "royal", hero: "fullbleed", opening: "curtain", theme: "noir-champagne", demo: "leadership-conclave-2026",
    concept: "Curtains part on a full-screen photograph: a formal evening of awards, dinner and speeches.",
    tagline: "Curtains part on black and champagne. A formal company evening.",
    target: ["Annual days and award nights", "Dealer and partner meets", "Formal dinners"],
    images: "Full-screen photograph of the hall or the stage; the evening laid out as editorial spreads.",
    motion: "Slow, symmetrical; curtains part; ornament lines draw in.",
    interactions: ["Tap to open the curtains", "Dress code guide", "Register in one tap"],
    flow: [["about", { variant: "editorial" }], ["countdown", { variant: "classic" }], ["events", { variant: "editorial" }], ["agenda", { variant: "timeline" }], ...LIVE, ["dresscode", { variant: "visual" }], ["venue", { variant: "classic" }], ["sponsors", { variant: "tiers" }], ["gallery", { variant: "editorial" }], ["rsvp", { variant: "card" }], ...AFTER, "contact"],
  },
  {
    slug: "keynote", name: "Keynote", category: "corporate", eventType: "corporate_event", direction: "cinematic", hero: "reel", opening: "cinematic", theme: "midnight-sapphire", demo: "leadership-conclave-2026",
    concept: "A title sequence, the keynote speaker on a film frame, then the programme in numbered chapters.",
    tagline: "A launch-event opening: title cards, the speaker, the programme.",
    target: ["Product and company launches", "Keynote-led events", "Brands that want a statement"],
    images: "Full-screen stage or speaker photograph between black bars; a film strip of past events.",
    motion: "Slow zoom; weighty fades; letterbox bars; quick chapter reveals.",
    interactions: ["Tap to skip the title cards", "Register in one tap", "Add sessions to your calendar"],
    flow: [["about", { variant: "statement" }], ["speakers", { variant: "featured" }], ["gallery", { variant: "filmstrip" }], ["agenda", { variant: "days" }], ["countdown", { variant: "classic" }], ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ...LIVE, ...AFTER, "contact"],
  },
  {
    slug: "retreat", name: "Retreat", category: "corporate", eventType: "corporate_event", direction: "floral", hero: "garden", opening: "bloom", theme: "eucalyptus", demo: "leadership-conclave-2026",
    concept: "A flower blooms to open; an offsite among trees: the days, the talks and the time to breathe.",
    tagline: "Eucalyptus green for an offsite among the trees.",
    target: ["Team offsites and wellness retreats", "Leadership off-sites", "Smaller, relaxed company events"],
    images: "An oval photograph among leaves; a carousel of the place.",
    motion: "Very soft; petals drift once; the flower opens petal by petal.",
    interactions: ["Tap the bud to bloom", "Travel planner", "Register in one tap"],
    flow: [["about", { variant: "editorial" }], ["agenda", { variant: "timeline" }], ["events", { variant: "cards" }], ["speakers", { variant: "list" }], ...LIVE, ["venue", { variant: "map" }], ["travel", { variant: "planner" }], ["gallery", { variant: "carousel" }], ["rsvp", { variant: "card" }], ...AFTER, "contact"],
  },
  {
    slug: "team-fest", name: "Team Fest", category: "corporate", eventType: "corporate_event", direction: "playful", hero: "polaroids", opening: "balloons", theme: "festive-pop", demo: "leadership-conclave-2026",
    concept: "Balloons to pop and snapshots of the team: an annual day or festival party that wants everyone there.",
    tagline: "Pop the balloons — a company party in bright colour.",
    target: ["Festival and annual-day parties", "Team celebrations", "Employee family days"],
    images: "Snapshots of the team on a table; polaroid gallery of past events.",
    motion: "Springy overshoot; balloons burst into confetti.",
    interactions: ["Tap to pop the balloons", "Polaroid gallery", "Register in one tap"],
    flow: [["about", { variant: "facts" }], ["countdown", { variant: "events" }], ["events", { variant: "cards" }], ["agenda", { variant: "timeline" }], ...LIVE, ["gallery", { variant: "polaroid" }], ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ...AFTER, "contact"],
  },

  // ═══ CONFERENCES ════════════════════════════════════════════════════════════════════════════════════════
  {
    slug: "summit", name: "Tech Summit", category: "conference", eventType: "conference", direction: "cinematic", hero: "split", opening: "cinematic", theme: "signal-dark", demo: "tech-summit-2026",
    concept: "Near-black with electric blue: a statement, speakers in a grid and a tracked timeline of sessions.",
    tagline: "Four tracks, parallel sessions and a speaker grid. Electric blue on near-black.",
    target: ["Developer and design conferences", "Product launches", "Hackathons and large meetups"],
    images: "An editorial split with the venue or stage; speaker portraits in a grid.",
    motion: "Short title sequence; weighty fades; quick chapter reveals.",
    interactions: ["Tap to skip the title cards", "Tracks and rooms at a glance", "Register in one tap"],
    flow: [["about", { variant: "statement" }], ["speakers", { variant: "grid" }], ["agenda", { variant: "timeline" }], ["countdown", { variant: "classic" }], ["sponsors", { variant: "tiers" }], ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], ["rsvp", { variant: "card" }], ...LIVE, ...AFTER, "contact"],
  },
  {
    slug: "clean-conference", name: "Clean Conference", category: "conference", eventType: "conference", direction: "minimal", hero: "poster", opening: "ticket", theme: "paper-blue", demo: "tech-summit-2026",
    concept: "The conference as a poster, a pass to tear, speakers as a simple list and the programme day by day.",
    tagline: "Paper and ink blue. The programme, the speakers, nothing else.",
    target: ["Academic and industry conferences", "Design-led events", "Audiences who want to find things fast"],
    images: "A wide photograph under huge type; speakers as a plain list.",
    motion: "Crisp, quick fades; the pass tears away.",
    interactions: ["Tear the pass to enter", "Register in one tap", "Add sessions to your calendar"],
    flow: [["about", { variant: "facts" }], ["speakers", { variant: "list" }], ["agenda", { variant: "days" }], ["sponsors", { variant: "tiers" }], ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], ["rsvp", { variant: "classic" }], ...LIVE, ...AFTER, "contact"],
  },
  {
    slug: "grand-forum", name: "Grand Forum", category: "conference", eventType: "conference", direction: "royal", hero: "fullbleed", opening: "curtain", theme: "boardroom-navy", demo: "tech-summit-2026",
    concept: "Curtains part on a full-screen photograph: a formal forum with a keynote, a day-by-day programme and partners by tier.",
    tagline: "Curtains part on navy and brass. A formal forum.",
    target: ["Government, industry and policy forums", "Chamber of commerce events", "Formal multi-day conferences"],
    images: "Full-screen photograph of the hall; the keynote speaker featured.",
    motion: "Slow, symmetrical; curtains part; ornament lines draw in.",
    interactions: ["Tap to open the curtains", "Featured keynote", "Register in one tap"],
    flow: [["about", { variant: "editorial" }], ["speakers", { variant: "featured" }], ["agenda", { variant: "days" }], ["countdown", { variant: "classic" }], ["sponsors", { variant: "tiers" }], ["venue", { variant: "classic" }], ["travel", { variant: "tabs" }], ["rsvp", { variant: "classic" }], ...LIVE, ...AFTER, "contact"],
  },
  {
    slug: "green-summit", name: "Green Summit", category: "conference", eventType: "conference", direction: "floral", hero: "garden", opening: "bloom", theme: "eucalyptus", demo: "tech-summit-2026",
    concept: "A flower blooms to open: for sustainability, wellness and social-impact events.",
    tagline: "Eucalyptus green for sustainability and wellness events.",
    target: ["Sustainability and climate events", "Wellness and social-impact summits", "NGO and foundation events"],
    images: "An oval photograph among leaves; speakers in a soft grid.",
    motion: "Very soft; petals drift once; the flower opens petal by petal.",
    interactions: ["Tap the bud to bloom", "Travel planner", "Register in one tap"],
    flow: [["about", { variant: "editorial" }], ["speakers", { variant: "grid" }], ["agenda", { variant: "timeline" }], ["sponsors", { variant: "tiers" }], ["venue", { variant: "map" }], ["travel", { variant: "planner" }], ["rsvp", { variant: "card" }], ...LIVE, ...AFTER, "contact"],
  },
  {
    slug: "meetup-day", name: "Meetup Day", category: "conference", eventType: "conference", direction: "playful", hero: "polaroids", opening: "balloons", theme: "sunset-pop", demo: "tech-summit-2026",
    concept: "Balloons to pop and snapshots of the last one: a meetup, hack day or college fest.",
    tagline: "Pop the balloons — a meetup in magenta and amber.",
    target: ["Community meetups and hack days", "College and school fests", "Start-up events"],
    images: "Snapshots of past editions on a table; polaroid gallery.",
    motion: "Springy overshoot; balloons burst into confetti.",
    interactions: ["Tap to pop the balloons", "Polaroid gallery", "Register in one tap"],
    flow: [["about", { variant: "facts" }], ["countdown", { variant: "events" }], ["speakers", { variant: "grid" }], ["agenda", { variant: "timeline" }], ["gallery", { variant: "polaroid" }], ["venue", { variant: "classic" }], ["rsvp", { variant: "card" }], ...LIVE, ...AFTER, "contact"],
  },

  // ═══ MEMORIALS ══════════════════════════════════════════════════════════════════════════════════════════
  {
    slug: "remembrance", name: "Remembrance", category: "funeral", eventType: "funeral", direction: "minimal", hero: "fullbleed", opening: "envelope", theme: "quiet-light", demo: "thomas-mathew-memorial",
    concept: "Soft stone and slate, an unhurried serif and no effects at all: a portrait, the years of a life, the service and a place for tributes.",
    tagline: "Quiet and clear. The service, the place and a book of tributes.",
    target: ["Funeral services and burials", "Families who need to tell many people, once", "Any faith"],
    images: "One portrait, full-screen; candles and landscapes only where they help.",
    motion: "No celebration effects; everything moves 40% slower.",
    interactions: ["Open the envelope", "Directions with one tap", "Leave a tribute"],
    flow: [["tribute", { variant: "portrait" }], ["message", { variant: "letter" }], ["timeline", { variant: "vertical" }], ["events", { variant: "timeline" }], ["venue", { variant: "classic" }], ["prayer", { variant: "verse" }], ["people", { variant: "groups" }], ["gallery", { variant: "masonry" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], "livestream", "wishes", "thankyou", "contact"],
  },
  {
    slug: "sacred-farewell", name: "Sacred Farewell", category: "funeral", eventType: "funeral", direction: "royal", hero: "arch", opening: "lamp", theme: "dusk-sandal", demo: "thomas-mathew-memorial",
    concept: "A lamp is lit in remembrance; an arched portrait, the rites and the prayer in a restrained, traditional hand.",
    tagline: "Light a lamp in remembrance. Sandalwood and soft gold.",
    target: ["Traditional last rites and prayer meetings", "Hindu, Christian and Muslim families", "Families who want ceremony without ornament"],
    images: "An arched portrait; ritual and family photographs as quiet spreads.",
    motion: "No celebration effects; slow reveals; the lamp flickers.",
    interactions: ["Tap to light the lamp", "The prayer read in full", "Leave a tribute"],
    flow: [["tribute", { variant: "portrait" }], ["message", { variant: "letter" }], ["events", { variant: "timeline" }], ["venue", { variant: "classic" }], ["prayer", { variant: "verse" }], ["people", { variant: "groups" }], ["timeline", { variant: "vertical" }], ["gallery", { variant: "masonry" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], "livestream", "wishes", "thankyou", "contact"],
  },
  {
    slug: "life-in-pictures", name: "A Life in Pictures", category: "funeral", eventType: "memorial", direction: "cinematic", hero: "reel", opening: "cinematic", theme: "evening-grey", demo: "thomas-mathew-memorial",
    concept: "A life as a gentle film: title cards, a strip of photographs through the years, then the details of the service.",
    tagline: "A strip of photographs through the years, in soft evening grey.",
    target: ["Memorials and prayer meetings with many photographs", "Families who want to celebrate a life", "Evening remembrances"],
    images: "Full-screen portrait between black bars; a film strip of photographs through the years.",
    motion: "No celebration effects; very slow zoom and fades.",
    interactions: ["Tap to skip the title cards", "Swipe through the film strip", "Leave a tribute"],
    flow: [["tribute", { variant: "portrait" }], ["gallery", { variant: "filmstrip" }], ["timeline", { variant: "vertical" }], ["message", { variant: "pull" }], ["events", { variant: "timeline" }], ["venue", { variant: "classic" }], ["prayer", { variant: "verse" }], ["people", { variant: "cards" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], "livestream", "wishes", "thankyou", "contact"],
  },
  {
    slug: "white-lilies", name: "White Lilies", category: "funeral", eventType: "memorial", direction: "floral", hero: "garden", opening: "bloom", theme: "lily-white", demo: "thomas-mathew-memorial",
    concept: "A white flower opens in stillness; an oval portrait among leaves; a garden of remembrance in grey-green and white.",
    tagline: "A white flower opens. Grey-green, white and stone.",
    target: ["Memorials and prayer meetings", "Gentle, family-first remembrances", "Families who love quiet colour"],
    images: "An oval portrait among leaves; a carousel of photographs.",
    motion: "No celebration effects; the flower opens slowly; no falling petals.",
    interactions: ["Tap the bud to open", "Illustrated map", "Leave a tribute"],
    flow: [["tribute", { variant: "portrait" }], ["message", { variant: "letter" }], ["events", { variant: "timeline" }], ["venue", { variant: "map" }], ["prayer", { variant: "verse" }], ["people", { variant: "groups" }], ["gallery", { variant: "carousel" }], ["rsvp", { variant: "card" }], ["guestbook", { variant: "list" }], "livestream", "wishes", "thankyou", "contact"],
  },
  {
    slug: "stories-of-a-life", name: "Stories of a Life", category: "funeral", eventType: "memorial", direction: "editorial", hero: "split", opening: "none", theme: "sandstone", demo: "thomas-mathew-memorial",
    concept: "No opening scene; straight to the portrait. The words of those who loved them come first: stories, tributes and photographs set like a magazine.",
    tagline: "Warm sand and umber. The stories people tell come first.",
    target: ["Celebrations of life", "Families who want people to share stories", "Invitations that must open instantly"],
    images: "An editorial split with the portrait; photographs set as large spreads.",
    motion: "No celebration effects and no opening scene; very gentle fades.",
    interactions: ["Leave a tribute", "Share a voice or video message", "Directions with one tap"],
    flow: [["tribute", { variant: "portrait" }], ["message", { variant: "pull" }], ["timeline", { variant: "vertical" }], ["gallery", { variant: "editorial" }], ["people", { variant: "cards" }], ["events", { variant: "timeline" }], ["venue", { variant: "classic" }], ["prayer", { variant: "verse" }], ["guestbook", { variant: "wall" }], "wishes", ["rsvp", { variant: "card" }], "livestream", "thankyou", "contact"],
  },
];

/** The sections of a template: its hero, then its flow. */
export function specSections(spec: TemplateSpec): TemplateSection[] {
  return layout([["hero", { variant: spec.hero }], ...spec.flow]);
}

/** The templates a customer is shown for an occasion: the five designs first, then any faith editions. */
export function specsFor(category: CategorySlug): TemplateSpec[] {
  const own = TEMPLATE_SPECS.filter((s) => s.category === category && !s.legacy);
  return [...own.filter((s) => !s.edition), ...own.filter((s) => s.edition)];
}

export const specBySlug = (slug: string): TemplateSpec | undefined => TEMPLATE_SPECS.find((s) => s.slug === slug);
