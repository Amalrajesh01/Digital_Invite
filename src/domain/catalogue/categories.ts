import { CATEGORY_SLUGS, type CategorySlug, type EventType } from "@/domain/doc/event-types";

/**
 * The occasions the public site presents (`/categories`, `/templates/<slug>`).
 *
 * A category is a way to FIND an invitation, not a different product: every one of them is the same engine reading the
 * same document, with the sections, wording and mood of its occasion (see `EVENT_TYPE_INFO`). A category with no sample
 * invitation yet is shown honestly as "designed on request" and kept out of search results until it has one.
 */
export type CategoryGroup = "Weddings & couples" | "Family celebrations" | "Faith & culture" | "Corporate events" | "Remembrance";

export interface CategoryDef {
  slug: CategorySlug;
  /** "Wedding" */
  name: string;
  group: CategoryGroup;
  /** One line for cards. */
  blurb: string;
  /** The H1 of its page and the lead of its SEO title. */
  title: string;
  seoDescription: string;
  intro: string[];
  /** What an invitation of this occasion typically includes. */
  includes: string[];
  faq: { q: string; a: string }[];
  /** The photograph shown on the category card (a bundled stock id), if one suits it. */
  cover?: string;
  /** Event types a sample invitation may have to be listed under this category. */
  eventTypes: EventType[];
}

const NO_APP = { q: "Do my guests need an app or an account?", a: "No. Guests open a link on their phone — or scan a QR code — and the invitation opens in the browser. Nothing to install and nothing to remember." };
const CHANGE = { q: "Can I change details after sharing the link?", a: "Yes. Every change is published to the same link, so a new time or venue reaches everyone at once. Each publish is saved as a version you can go back to." };

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "wedding", name: "Wedding", group: "Weddings & couples", cover: "2oQy4GAGxbk",
    blurb: "Hindu, Kerala, Christian, Muslim and modern — an invitation that opens like an envelope.",
    title: "Digital Wedding Invitation Templates",
    seoDescription: "Digital wedding invitations that open like an envelope: Hindu, Kerala, Christian, Muslim and modern minimal designs with RSVP, venue maps and a memory book.",
    intro: [
      "A wedding invitation your guests open like an envelope, reply to in seconds and keep for a lifetime. Choose a design made for your traditions — Hindu, Kerala, Christian, Muslim, or quietly modern — and we set it with your story, your ceremonies and your photographs.",
      "Every template tells the day in the order your guests will live it: the opening, the couple, how it began, the countdown, each ceremony with its time and place, the venue and directions, and the reply. In English and, if you like, your family’s language.",
    ],
    includes: ["A wax-sealed envelope opening with your names and date", "Your story, a timeline of how it began and a live countdown", "Every ceremony and event with time, place, dress code and ritual explainers", "Venue, map, parking, hotels and travel directions", "RSVP with meal, stay and travel requests", "Wishes, guest photos and a keepsake memory book after the day"],
    faq: [
      { q: "Can the invitation be in two languages?", a: "Yes. Guests switch between English and a local language such as Malayalam with one tap. You provide both versions of each text, and we set the local language in a typeface made for its script." },
      NO_APP,
      CHANGE,
    ],
    eventTypes: ["hindu_wedding", "christian_wedding", "muslim_wedding", "wedding", "reception"],
  },
  {
    slug: "engagement", name: "Engagement", group: "Weddings & couples", cover: "1dzXfvALJxs",
    blurb: "A romantic invitation with the ring ceremony explained and a story told in moments.",
    title: "Engagement Invitation Templates",
    seoDescription: "Romantic digital engagement invitations: an arched portrait, the proposal story, the ring ceremony explained, RSVP and directions — shared in one link.",
    intro: [
      "An engagement is the first time both families are in one room. An engagement invitation should make that room easy to find, and the ceremony easy to follow — especially for guests from the other side who have not seen it before.",
      "Our engagement designs set the couple and their story first, then explain the ring ceremony step by step, give the venue and the dress palette, and collect every reply in one place.",
    ],
    includes: ["An arched couple portrait and the story of the proposal", "The ring ceremony and rituals explained, step by step", "Mehendi, ceremony and lunch as separate events with their own times", "Dress palette so both families coordinate", "Venue, parking and directions", "RSVP and wishes from guests"],
    faq: [
      { q: "Can we explain our ritual to guests from another community?", a: "Yes. The ceremonies section lets you describe each ritual in your own words, with a short line on what it means — so every guest can follow along." },
      NO_APP,
    ],
    eventTypes: ["engagement"],
  },
  {
    slug: "birthday", name: "Birthday", group: "Family celebrations", cover: "iG98pmgWJMU",
    blurb: "From a black-tie thirtieth to a dinosaur party for a three-year-old.",
    title: "Digital Birthday Invitation Templates",
    seoDescription: "Digital birthday invitations for every age: a luxury milestone night or a playful children’s party, with RSVP, directions and a wall of wishes.",
    intro: [
      "A birthday invitation sets the mood before anyone arrives. A thirtieth on a rooftop wants candlelight and a dress code; a three-year-old’s dinosaur party wants balloons and a clear start time for the parents.",
      "We design both ends of the range: glamorous milestone nights and playful children’s parties, each with the party plan at a glance, directions, an RSVP and a wall where guests leave their wishes.",
    ],
    includes: ["A full-screen portrait or a playful arched photograph", "The party plan at a glance — time, age range, dress code", "Each part of the day as its own card", "Venue, map and parking", "RSVP with headcount, so you can plan food and seats", "A wall of birthday wishes"],
    faq: [
      { q: "Is there a design for a children’s party?", a: "Yes — a playful, rounded design with party details at a glance and a note from the parents. There is also a black-tie design for an adult milestone." },
      NO_APP,
    ],
    eventTypes: ["birthday", "kids_birthday"],
  },
  {
    slug: "anniversary", name: "Anniversary", group: "Weddings & couples", cover: "0keyorgl820",
    blurb: "Twenty-five years, told as an editorial timeline — with a letter from the children.",
    title: "Anniversary Invitation Templates",
    seoDescription: "Digital anniversary invitations for a silver jubilee or any milestone: the years told as a timeline, the family they built, a letter from the children and an RSVP.",
    intro: [
      "A silver or golden anniversary is a story that deserves to be told, not just a date and a venue. Our anniversary designs set the years as an editorial timeline, introduce the family that grew from them and make room for a letter from the children.",
      "Guests get the order of the evening, directions, an RSVP and — afterwards — a wall of wishes the couple can keep.",
    ],
    includes: ["The couple’s portrait and the story of the years", "A timeline of the moments that mattered", "The family they built, with a letter from the children", "Thanksgiving prayers, reception and toasts as separate events", "Venue, map and parking", "RSVP and a wall of wishes"],
    faq: [
      { q: "Can we use old family photographs?", a: "Yes. Upload scans or photographs and set them against the years of the timeline. We can also crop portraits out of group photographs for you." },
      NO_APP,
    ],
    eventTypes: ["anniversary"],
  },
  {
    slug: "baby-shower", name: "Baby shower", group: "Family celebrations", cover: "ybvTwLSBtSY",
    blurb: "A soft, gentle invitation for welcoming a little one.",
    title: "Baby Shower Invitation Templates",
    seoDescription: "Digital baby shower invitations, designed on request: a soft design with the plan for the day, directions, an RSVP and a wall of good wishes.",
    intro: [
      "A baby shower is small and warm, and so should its invitation be. We design it on request: a soft palette, the plan for the afternoon, directions, a gentle RSVP and a wall for good wishes.",
      "Tell us the date, the place and the mood you have in mind, and we will send a private preview with your names on it.",
    ],
    includes: ["A soft, personal opening", "The plan for the afternoon", "Venue and directions", "RSVP so you can plan food and seats", "A wall of wishes for the little one"],
    faq: [{ q: "Can this be arranged for a surprise shower?", a: "Yes. Send the link only to the guests you choose, and keep it away from the guest of honour." }],
    eventTypes: ["baby_shower"],
  },
  {
    slug: "naming-ceremony", name: "Naming ceremony", group: "Family celebrations", cover: "ZzlLBmKFxpA",
    blurb: "A tender invitation with the rituals of the day explained, one by one.",
    title: "Naming Ceremony Invitation Templates",
    seoDescription: "Digital naming ceremony invitations: an arched portrait of the little one, the rituals explained one by one, a note from the grandparents and an RSVP.",
    intro: [
      "A naming ceremony is a family moment, and many of your guests will be seeing the rituals for the first time. Our naming-ceremony design sets an arched portrait of the little one first, then explains each ritual — the lamp, the whispered name, the first blessings — in a few warm lines.",
      "A note from the grandparents, the plan for the morning, the lunch and directions to the family home complete it.",
    ],
    includes: ["An arched portrait of the little one", "The rituals of the day explained one by one", "A note from the grandparents", "Blessings, the naming and lunch as separate events", "Directions to the family home", "RSVP and a wall of blessings"],
    faq: [
      { q: "Can we keep the name a surprise until the day?", a: "Yes. You decide what the invitation says — the name can appear only after the ceremony, in the thank-you." },
      NO_APP,
    ],
    eventTypes: ["naming_ceremony"],
  },
  {
    slug: "housewarming", name: "Housewarming", group: "Family celebrations",
    blurb: "Invite everyone to bless the new home.",
    title: "Housewarming Invitation Templates",
    seoDescription: "Digital housewarming invitations, designed on request: the blessing of the home, a tour, lunch, directions and an RSVP — shared in one link.",
    intro: [
      "A new home is best blessed with the people who will fill it. A housewarming invitation gives guests the time of the prayer, the way in and an easy way to reply.",
      "We design it on request, in the tradition you follow, with the plan for the day and a map to the door.",
    ],
    includes: ["The blessing of the home and the plan for the day", "Directions and parking", "RSVP", "A wall of good wishes"],
    faq: [{ q: "Can we add a photo of the new home?", a: "Yes. Any photograph can open the invitation or sit beside the directions." }],
    eventTypes: ["housewarming"],
  },
  {
    slug: "graduation", name: "Graduation", group: "Family celebrations",
    blurb: "Celebrate the degree with the people who got you there.",
    title: "Graduation Invitation Templates",
    seoDescription: "Digital graduation invitations, designed on request: the ceremony, the photographs, the celebration lunch, directions and an RSVP.",
    intro: [
      "A graduation is a day for the whole family. A good invitation gives them the ceremony time, the parking, the celebration afterwards and a simple way to reply.",
      "We design it on request — your colours, your photograph and the plan for the day.",
    ],
    includes: ["The ceremony, photographs and celebration as separate events", "Venue and parking", "RSVP", "A wall of congratulations"],
    faq: [{ q: "Can we invite only family?", a: "Yes. Share the link only with the people you choose, or use personal links so each guest sees their own name." }],
    eventTypes: ["graduation"],
  },
  {
    slug: "retirement", name: "Retirement", group: "Family celebrations",
    blurb: "A farewell worth keeping — with tributes from colleagues and friends.",
    title: "Retirement Party Invitation Templates",
    seoDescription: "Digital retirement party invitations, designed on request: the evening, tributes, dinner, directions and an RSVP — and a wall for colleagues’ messages.",
    intro: [
      "A retirement party brings colleagues, family and friends into one room. The invitation tells them when and where, and invites them to leave a few words for the person being celebrated.",
      "We design it on request, with a tribute wall that stays as a keepsake.",
    ],
    includes: ["The evening’s plan", "Venue and parking", "RSVP", "A wall of tributes from colleagues and friends"],
    faq: [{ q: "Can colleagues leave messages ahead of the party?", a: "Yes. Messages are held for your approval and then appear on the wall." }],
    eventTypes: ["retirement"],
  },
  {
    slug: "reunion", name: "Reunion", group: "Family celebrations",
    blurb: "Bring everyone back together — class, family or friends.",
    title: "Reunion Invitation Templates",
    seoDescription: "Digital reunion invitations, designed on request: a family or class reunion with the plan for the weekend, travel help, an RSVP and a shared photo wall.",
    intro: [
      "Reunions are hard to organise because everyone is somewhere else. A reunion invitation gathers the details — dates, travel, stay — and the replies in one place.",
      "We design it on request, with a photo wall where everyone can add their old pictures.",
    ],
    includes: ["The plan for the day or the weekend", "Travel and stay help", "RSVP with headcount", "A shared photo wall"],
    faq: [{ q: "Can we collect old photographs from guests?", a: "Yes. Guests can upload photographs, which appear after you approve them." }],
    eventTypes: ["reunion"],
  },
  {
    slug: "private-party", name: "Private party", group: "Family celebrations", cover: "vRa4PuRCW18",
    blurb: "Dinner, a rooftop, a long table — invite the right people.",
    title: "Private Party Invitation Templates",
    seoDescription: "Digital private party invitations, designed on request: a dress code, the plan for the night, directions and an RSVP — shared only with the people you choose.",
    intro: [
      "A private party should feel private: a link that goes only to the people you invite, a dress code, a clear plan and an easy reply.",
      "We design it on request, in the mood you describe.",
    ],
    includes: ["The plan for the night", "Dress code and palette", "Venue and parking", "RSVP"],
    faq: [{ q: "Can only invited guests open the link?", a: "Yes. Choose personal links, so each guest opens an invitation with their own name on it." }],
    eventTypes: ["private_party"],
  },
  {
    slug: "religious", name: "Religious ceremony", group: "Faith & culture", cover: "WciKbLIFGxc",
    blurb: "Prayers and rites, explained so that every guest can follow.",
    title: "Religious Ceremony Invitation Templates",
    seoDescription: "Digital invitations for religious ceremonies, designed on request: the rites explained, the schedule, directions, an RSVP and a wall of blessings.",
    intro: [
      "A religious ceremony asks guests to know what to expect: when to arrive, what to wear, what will happen. We design the invitation around exactly that, with each rite explained in a few respectful lines.",
      "Available in the tradition you follow, with directions and a way for guests to send their blessings.",
    ],
    includes: ["The rites explained, one by one", "Time, place and dress", "Directions and parking", "RSVP", "A wall of blessings"],
    faq: [{ q: "Can the invitation follow our tradition’s wording?", a: "Yes. You decide every word; we only provide the structure." }],
    eventTypes: ["religious_ceremony"],
  },
  {
    slug: "cultural", name: "Cultural event", group: "Faith & culture", cover: "UX3-_dGbCzk",
    blurb: "Performances, exhibitions and community evenings.",
    title: "Cultural Event Invitation Templates",
    seoDescription: "Digital invitations for cultural events, designed on request: the programme, the performers, the venue and a simple RSVP.",
    intro: [
      "A cultural evening — a dance recital, a music night, an exhibition — needs a programme, a venue and a way to count the audience. We design the invitation around them.",
      "Speakers and performers, the order of the evening and the directions all sit in one link.",
    ],
    includes: ["The programme and performers", "Venue and parking", "RSVP or registration", "Photographs from the evening afterwards"],
    faq: [{ q: "Can we list performers with photographs?", a: "Yes. Performers appear like speakers, with a photograph, a role and a short line." }],
    eventTypes: ["cultural_event"],
  },
  {
    slug: "festival", name: "Festival", group: "Faith & culture", cover: "zNY2lVIRh7M",
    blurb: "Open the festival with a lamp and a link.",
    title: "Festival Invitation Templates",
    seoDescription: "Digital festival invitations, designed on request: the lighting of the lamp, the cultural programme, the feast, directions and an RSVP.",
    intro: [
      "A festival is shared between neighbours, families and communities. The invitation tells them when the lamp is lit, what the programme is and where to eat.",
      "We design it on request, with the colours and the mood of your festival.",
    ],
    includes: ["The programme from the lamp to the feast", "Venue, parking and directions", "RSVP", "Photographs from the day"],
    faq: [{ q: "Can we invite a whole community?", a: "Yes. A public link can be shared in a group, and replies are counted in one place." }],
    eventTypes: ["festival"],
  },
  {
    slug: "corporate", name: "Corporate event", group: "Corporate events", cover: "3aVlWP-7bg8",
    blurb: "Conclaves, summits, launches and company evenings — registration, programme and partners.",
    title: "Corporate Event Invitation Templates",
    seoDescription: "Digital invitations for corporate events: conclaves, conferences and launches with speakers, a day-by-day programme, partners, registration and travel help.",
    intro: [
      "A corporate invitation has a different job from a wedding’s: to make the right people register, and to give them everything they need to arrive. Our corporate designs open on the date and the venue, make registration one tap away and lay the programme out session by session.",
      "Speakers, partners by tier, travel and hotels, a dress code and a contact for the day — all in one link that works on a phone in a taxi.",
    ],
    includes: ["Registration and an RSVP that asks what you need to plan", "Speakers with photographs, roles and topics", "A day-by-day programme with sessions, rooms and tracks", "Partners and sponsors by tier", "Venue, travel, hotels and a dress code", "Contacts for the day and a thank-you afterwards"],
    faq: [
      { q: "Can delegates register with dietary and travel requests?", a: "Yes. The registration form can ask for dietary preferences, accommodation and airport transfers, and you see every reply live." },
      { q: "Is the design suitable for a corporate brand?", a: "Yes. We set the colours and typefaces to your brand, and the tone is professional — no confetti, no petals." },
    ],
    eventTypes: ["corporate_event", "conclave", "conference", "product_launch"],
  },
  {
    slug: "conclave", name: "Conclave", group: "Corporate events", cover: "gofAFBM6Q7Y",
    blurb: "A two-day, invitation-only gathering of senior leaders.",
    title: "Conclave Invitation Templates",
    seoDescription: "Digital conclave invitations: speakers, a day-by-day programme, partners by tier, registration and travel help — a sample of a two-day leadership conclave.",
    intro: [
      "A conclave is small and serious: a room of senior people for two days. Its invitation should feel like the event — measured, confident and precise.",
      "The Executive Conclave design opens with the date and a Register button, features the keynote speaker, sets the programme day by day and gives out-of-town delegates everything they need.",
    ],
    includes: ["A register button on the opening screen", "A featured keynote speaker and a grid of speakers", "The programme day by day, with sessions, panels and rooms", "Partners by tier", "Travel, hotels and a dress code", "Registration with dietary, stay and transfer requests"],
    faq: [{ q: "Is registration limited to invited guests?", a: "You decide. Share the link only with invitees, or use personal links so each delegate’s name is on their invitation." }],
    eventTypes: ["conclave"],
  },
  {
    slug: "conference", name: "Conference & summit", group: "Corporate events", cover: "V-pSsJdyHs4",
    blurb: "Tracks, speakers and sessions for a technology summit.",
    title: "Conference & Summit Invitation Templates",
    seoDescription: "Digital conference and tech summit invitations: speakers, a tracked timeline of sessions, partners, registration and venue details — a sample of a two-day summit.",
    intro: [
      "A technology summit has tracks, rooms and parallel sessions, and attendees plan their day around them. The Summit design lays the programme out as a tracked timeline, with speakers in a grid and partners by tier.",
      "A dark, geometric design with electric accents — made for engineers, designers and founders.",
    ],
    includes: ["A statement of what the summit is for", "Speakers in a grid, each with a topic", "A tracked timeline of sessions across two days", "Partners by tier", "Venue, travel and registration"],
    faq: [{ q: "Can sessions run in parallel?", a: "Yes. Sessions have a track and a room, so attendees can see what runs at the same time." }],
    eventTypes: ["conference"],
  },
  {
    slug: "product-launch", name: "Product launch", group: "Corporate events",
    blurb: "A launch evening, with the demo, the team and a simple RSVP.",
    title: "Product Launch Invitation Templates",
    seoDescription: "Digital product launch invitations, designed on request: the story, the demo, the team, the venue and registration — shared in one link.",
    intro: [
      "A launch needs the right people in the room and a reason for them to come. The invitation states the reason, shows the demo and makes registration one tap.",
      "We design it on request in your brand’s colours, with the programme and the team.",
    ],
    includes: ["The story of the product and the demo", "The evening’s programme", "Venue and parking", "Registration"],
    faq: [{ q: "Can we collect registrations only from invited guests?", a: "Yes. Use personal links, so each guest registers from their own invitation." }],
    eventTypes: ["product_launch"],
  },
  {
    slug: "funeral", name: "Funeral & memorial", group: "Remembrance", cover: "J3H-rth8cck",
    blurb: "A dignified invitation: a tribute, the service, a prayer and a place for condolences.",
    title: "Funeral & Memorial Invitation Templates",
    seoDescription: "Dignified digital funeral and memorial invitations: a portrait and the years of a life, the service details, a prayer, the family’s message and a place for tributes.",
    intro: [
      "When someone dies, families have to tell many people the same things — when, where, what to wear, who to call — at a time when they have no energy to say them again. A memorial invitation says it once, clearly, and kindly.",
      "Our Remembrance design is still on purpose: soft stone and slate, an unhurried serif, no effects at all. A portrait and the years of a life, a message from the family, the services in order, directions, a prayer, the people left behind and a place for tributes.",
    ],
    includes: ["A portrait and the years of a life", "A message from the family", "The services in order, with time and place", "Directions and a map", "A prayer or reading", "A place for tributes and condolences"],
    faq: [
      { q: "Is there anything celebratory on the page?", a: "No. A memorial invitation has no animation effects, no confetti and no petals. The pace is slower, the colours are quiet and the words come first." },
      { q: "Can the invitation be ready quickly?", a: "Yes. Message us on WhatsApp, and our team will take you through it gently — we only need the details of the service and a photograph." },
    ],
    eventTypes: ["funeral", "memorial"],
  },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
export const categoryBySlug = (slug: string): CategoryDef | undefined => BY_SLUG.get(slug as CategorySlug);
export const isCategorySlug = (s: string): s is CategorySlug => (CATEGORY_SLUGS as readonly string[]).includes(s);
export const CATEGORY_GROUPS: CategoryGroup[] = ["Weddings & couples", "Family celebrations", "Faith & culture", "Corporate events", "Remembrance"];
