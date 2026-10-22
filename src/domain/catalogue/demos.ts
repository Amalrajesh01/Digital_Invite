import { EVENT_TYPE_INFO, type CategorySlug, type EventType } from "@/domain/doc/event-types";
import { TEMPLATE_SEEDS } from "@/domain/design/templates";
import { THEME_SEEDS } from "@/domain/design/themes";
import { SECTION_META } from "@/domain/doc/sections";
import { categoryBySlug } from "./categories";
import { CINEMATIC_SPECS } from "@/domain/design/template-specs-cinematic";
import { CASTING } from "@/domain/imagery/casting";
import { stockInfo } from "@/domain/imagery/stock";
import { CINEMATIC_SAMPLE_FACTS } from "./cinematic-samples";

/**
 * The sample invitations shown on the public template gallery. Each one is a real, published invitation
 * (`/invite/<slug>`, seeded by `SEED_ONLY=public-demos`) built from a template and a theme, with fictional names.
 *
 * This file is only the shop window: what to call it, what it is good for, which photograph represents it. What an
 * invitation actually contains lives in its document; which sections a template includes lives in the template.
 */
export type StyleTag = "Traditional" | "Modern & minimal" | "Luxury" | "Romantic" | "Playful" | "Corporate" | "Solemn";
export const STYLE_TAGS: StyleTag[] = ["Traditional", "Modern & minimal", "Luxury", "Romantic", "Playful", "Corporate", "Solemn"];

export interface DemoDef {
  /** The slug of the published sample: /invite/<slug>. */
  slug: string;
  /** Names on the sample: "Isha & Daniel". */
  name: string;
  /** What it is, as the gallery names it: "Modern Minimal Wedding". */
  title: string;
  eventType: EventType;
  /** The template (structure) and theme (colours and type) it is made from. */
  template: string;
  theme: string;
  styles: StyleTag[];
  /** Bundled stock photographs: the card image and a few more for the detail page. */
  cover: string;
  coverFocal?: { x: number; y: number };
  strip: string[];
  tagline: string;
  description: string;
  highlights: string[];
  bestFor: string[];
  languages: string[];
  /** For the card: when and where the fictional event is. */
  when: string;
  where: string;
}

const BASE_DEMOS: DemoDef[] = [
  {
    slug: "ananya-and-arjun", name: "Ananya & Arjun", title: "Luxury Hindu Wedding", eventType: "hindu_wedding", template: "cinematic-noir", theme: "royal-gold", styles: ["Traditional", "Luxury"],
    cover: "2oQy4GAGxbk", coverFocal: { x: 50, y: 17 }, strip: ["2XXQkrL0k-Q", "OQDYhr9HRNo", "gG5MoExhMnU", "DC0d6A2kX0k"],
    tagline: "Mehendi, sangeet, pheras and a palace gateway — told in a cinematic title sequence.",
    description: "A north Indian wedding over four days. A full-screen photograph, falling petals, the days set as magazine spreads and every ritual explained for the guests who are new to them.",
    highlights: ["Opens with falling marigold and rose petals", "Mehendi, sangeet, wedding and reception as separate events", "Haldi, baraat, kanyadaan and pheras explained one by one", "The couple walking towards each other as you scroll"],
    bestFor: ["Multi-day Hindu weddings", "Destination weddings with out-of-town guests", "Families with traditions to explain"], languages: ["English"], when: "12 December 2026", where: "Udaipur",
  },
  {
    slug: "isha-and-daniel", name: "Isha & Daniel", title: "Modern Minimal Wedding", eventType: "wedding", template: "modern-minimal", theme: "cream-noir", styles: ["Modern & minimal", "Romantic"],
    cover: "dYgv-1JnPTA", coverFocal: { x: 50, y: 30 }, strip: ["aen7e0u2UhA", "ys_8FnQv6Is", "YKBT8rRAzpU", "4ExHGkN7fzQ"],
    tagline: "Cream, black and a thread of gold. Nothing that does not earn its place.",
    description: "A quiet, editorial invitation for a modern wedding in the hills. Hairline rules, a ring countdown, the dinner menu and a travel guide for guests coming a long way.",
    highlights: ["Editorial split opening with generous whitespace", "A ring countdown to the ceremony", "The dinner menu, course by course", "Travel tabs: hotels, directions and things to do nearby"],
    bestFor: ["Modern and interfaith weddings", "Smaller guest lists", "Couples who prefer restraint to ornament"], languages: ["English"], when: "6 March 2027", where: "Wayanad",
  },
  {
    slug: "meenakshi-and-aravind", name: "Meenakshi & Aravind", title: "Kerala Traditional Wedding", eventType: "hindu_wedding", template: "royal-heritage", theme: "kasavu", styles: ["Traditional", "Luxury"],
    cover: "Zx9In5UiU0w", coverFocal: { x: 55, y: 58 }, strip: ["UX3-_dGbCzk", "rjgFxE3eARQ", "VJP7K4uihUA", "b9xLrj7w2AY"],
    tagline: "Kasavu, a lamp and the backwaters.",
    description: "Our flagship: a Kerala Hindu wedding in cream, gold and forest green. Guests can play, reply and share photographs on the day.",
    highlights: ["Games, a quiz and a live photo wall for the wedding day", "A QR guest pass and live schedule", "A time capsule and anniversary memories afterwards"],
    bestFor: ["Kerala weddings", "Weddings with a lively wedding-day programme"], languages: ["English"], when: "24 January 2027", where: "Kumarakom",
  },
  {
    slug: "meera-turns-twenty-five", name: "Meera turns twenty-five", title: "Luxury Birthday — 25th", eventType: "birthday", template: "gala-night", theme: "noir-champagne", styles: ["Luxury", "Modern & minimal"],
    cover: "aHJ0hciTzG4", coverFocal: { x: 50, y: 28 }, strip: ["u2tgn9AA5uY", "UJynGW4gF-I", "ch4Fc1cGTq4", "EGDqdOwzGJo"],
    tagline: "Black tie, champagne and a skyline. Twenty-five years in a sentence.",
    description: "A glamorous birthday invitation for a woman in her twenties: a full-screen portrait, a statement about her, twenty-five years told as moments and the night laid out hour by hour, with a dress guide and a wall for wishes.",
    highlights: ["Full-screen portrait opening in black and champagne", "“Twenty-five years, in a sentence” and a timeline of moments", "The night hour by hour, with a dress code and palette", "A wall of birthday wishes"],
    bestFor: ["21st, 25th and 30th birthdays", "Rooftop and restaurant parties", "Hosts who want a dress code to be taken seriously"], languages: ["English"], when: "20 February 2027", where: "Bengaluru",
  },
  {
    slug: "aarav-turns-three", name: "Aarav turns three", title: "Children’s Birthday", eventType: "kids_birthday", template: "little-celebration", theme: "confetti-pop", styles: ["Playful"],
    cover: "qojqVPsfAiE", coverFocal: { x: 40, y: 50 }, strip: ["Wdb27cW27do", "Hli3R6LKibo", "yxZjTv30tl8", "As8zq82LBpw"],
    tagline: "Dinosaurs, bubbles and balloons — with the party details parents actually need.",
    description: "A playful invitation with the party plan at a glance: when to arrive, which ages, what to wear and when it ends. An arched portrait of the birthday child and a note from their parents.",
    highlights: ["Party details at a glance — time, ages, duration", "The party plan as four simple cards", "A dress palette (“come as an explorer”)", "A note from the parents and a wall of wishes"],
    bestFor: ["Birthdays for ages 2 to 6", "Themed parties — dinosaurs, space, jungle", "Parents who want fewer “what time does it end?” messages"], languages: ["English"], when: "31 January 2027", where: "Kochi",
  },
  {
    slug: "tara-and-nikhil", name: "Tara & Nikhil", title: "Engagement", eventType: "engagement", template: "romance", theme: "peony-champagne", styles: ["Romantic", "Traditional"],
    cover: "ykcXm_u84sg", coverFocal: { x: 50, y: 30 }, strip: ["AD3k4pko7wo", "K2JtyCVdeuQ", "OmLrFODvPII", "WHNWkO1lBKU"],
    tagline: "A wrong turn, a cup of tea and a very good question.",
    description: "A romantic engagement invitation: an arched portrait, the story of how they met, the ring ceremony explained step by step and the two of them walking towards each other as you scroll.",
    highlights: ["The couple walking towards each other as you scroll", "The ring ceremony explained, step by step", "A mehendi evening, ceremony and lunch as separate events", "A blush, champagne and mulberry dress palette"],
    bestFor: ["Ring ceremonies and betrothals", "Two families meeting for the first time", "Couples who want a story, not just a date"], languages: ["English"], when: "13 February 2027", where: "Kochi",
  },
  {
    slug: "helen-and-george", name: "Helen & George", title: "Anniversary — 25th", eventType: "anniversary", template: "silver-jubilee", theme: "silver-jubilee", styles: ["Luxury", "Romantic"],
    cover: "0keyorgl820", coverFocal: { x: 48, y: 30 }, strip: ["73OJLcahQHg", "iV9F0sHl7OU", "mrQ6Kmfa1jA", "vN2V5iunLc0"],
    tagline: "Twenty-five years, told as an editorial timeline — with a letter from the children.",
    description: "A silver-jubilee invitation in slate and silver. The years set as moments, the family they built, a letter from the children, the thanksgiving prayers and the reception.",
    highlights: ["Twenty-five years as five moments", "The family they built — children and parents, grouped", "A letter from the children", "Thanksgiving prayers and reception as separate events"],
    bestFor: ["Silver and golden jubilees", "Vow renewals", "Families gathering from many cities"], languages: ["English"], when: "18 April 2027", where: "Thiruvananthapuram",
  },
  {
    slug: "leadership-conclave-2026", name: "Leadership Conclave 2026", title: "Corporate Conclave", eventType: "conclave", template: "executive-conclave", theme: "boardroom-navy", styles: ["Corporate", "Luxury"],
    cover: "gofAFBM6Q7Y", coverFocal: { x: 50, y: 40 }, strip: ["F2KRf_QfCqw", "-U_5mtNdPtA", "yTsy3PYFPtc", "bAwT-vSd46Y"],
    tagline: "A two-day, invitation-only gathering of senior leaders. Registration up front.",
    description: "Navy, ivory and brass. A Register button on the opening screen, a featured keynote, the programme day by day, partners by tier and everything an out-of-town delegate needs.",
    highlights: ["A Register button on the opening screen", "A featured keynote and a grid of speakers", "The programme day by day, with sessions, panels and rooms", "Partners by tier, hotels and travel help"],
    bestFor: ["Leadership forums and conclaves", "Invitation-only industry events", "Board retreats and annual gatherings"], languages: ["English"], when: "19–20 November 2026", where: "Mumbai",
  },
  {
    slug: "tech-summit-2026", name: "Tech Summit 2026", title: "Tech Summit", eventType: "conference", template: "summit", theme: "signal-dark", styles: ["Corporate", "Modern & minimal"],
    cover: "V-pSsJdyHs4", coverFocal: { x: 50, y: 35 }, strip: ["bzdhc5b3Bxs", "Tho4zZM8Vhs", "2K1CdpU5ABo", "XZkk5xT8Xrk"],
    tagline: "Four tracks, parallel sessions and a speaker grid — in electric blue on near-black.",
    description: "A dark, geometric design for a technology summit: a statement of what it is for, speakers in a grid, a tracked timeline of sessions across two days, partners and registration.",
    highlights: ["Speakers in a grid, each with a topic", "A tracked timeline of sessions across two days", "Parallel sessions with a room and a track", "Partners by tier and open registration"],
    bestFor: ["Developer and design conferences", "Product launches", "Hackathons and community meetups"], languages: ["English"], when: "10–11 December 2026", where: "Bengaluru",
  },
  {
    slug: "thomas-mathew-memorial", name: "Thomas Mathew", title: "Funeral & Memorial", eventType: "funeral", template: "remembrance", theme: "quiet-light", styles: ["Solemn"],
    cover: "UpNwL3hTcRg", coverFocal: { x: 50, y: 55 }, strip: ["4nN6aN45y7c", "J3H-rth8cck", "FPVzkHF3wgM", "heNLI144X7Y"],
    tagline: "A portrait, a life, the service and a place for tributes. No effects at all.",
    description: "Soft stone and slate in an unhurried serif. A portrait and the years of a life, a message from the family, the services in order, directions, a prayer, the people left behind and a place for condolences.",
    highlights: ["No animation effects — no confetti, no petals", "A portrait, the years of a life and a life story", "The services in order, with directions and a map", "A prayer, the family’s message and a book of tributes"],
    bestFor: ["Funeral services and burials", "Memorial and prayer meetings", "Families who need to tell many people clearly, once"], languages: ["English"], when: "24 October 2026", where: "Kochi",
  },
  {
    slug: "anna-and-joseph", name: "Anna & Joseph", title: "Christian Wedding", eventType: "christian_wedding", template: "chapel-romance", theme: "ivory-chapel", styles: ["Traditional", "Romantic"],
    cover: "Iv3yJpmOmZc", coverFocal: { x: 47, y: 45 }, strip: ["SrWVeL5DyNM", "zyguVcuzeGM", "6bFp65WVrL8", "fPFoUSKZGts"],
    tagline: "A church wedding in ivory, sage and champagne — from the betrothal to the reception.",
    description: "A Syrian Christian wedding in Kochi: a wax-seal opening, the day told from betrothal to reception and the church service explained for guests of other faiths.",
    highlights: ["Betrothal, wedding Mass and reception as separate events", "The church service and vows explained", "Soft confetti as the invitation opens", "Hotels, directions and parking at the parish ground"], bestFor: ["Church weddings", "Interfaith guest lists", "Betrothals and receptions"], languages: ["English"], when: "6 February 2027", where: "Kochi",
  },
  {
    slug: "zainab-and-imran", name: "Zainab & Imran", title: "Muslim Wedding (Nikah)", eventType: "muslim_wedding", template: "nikah-noor", theme: "emerald-ivory", styles: ["Traditional", "Romantic"],
    cover: "1iuFKizvxQo", coverFocal: { x: 50, y: 32 }, strip: ["l6BafhpDlZM", "ryOiannoQ3g", "gfVofr15ICc", "A--OZVONuGE"],
    tagline: "Emerald and gold: the mehendi, the nikah and the walima, with the traditions explained.",
    description: "A nikah in Hyderabad. Curtains part on a full-screen photograph; the mehendi, nikah and walima are set as spreads, and the traditions are explained with care for guests who are new to them.",
    highlights: ["Mehendi, nikah and walima as separate events", "The nikah, ijab-o-qubool and walima explained", "Emerald and gold, curtains opening", "Dress guide and palette for guests"], bestFor: ["Nikah and walima", "Interfaith guest lists", "Families who want the traditions explained"], languages: ["English"], when: "13 March 2027", where: "Hyderabad",
  },
  {
    slug: "aadhya-naming-ceremony", name: "Aadhya’s naming ceremony", title: "Naming Ceremony", eventType: "naming_ceremony", template: "blessing", theme: "soft-dawn", styles: ["Traditional", "Romantic"],
    cover: "ZzlLBmKFxpA", coverFocal: { x: 28, y: 40 }, strip: ["wDGrvGUWOpE", "I8Ik4L3lPrs", "zNY2lVIRh7M", "WciKbLIFGxc"],
    tagline: "A tender invitation with the rituals of the day explained, one by one.",
    description: "Warm ivory, sage and a touch of peach. An arched portrait of the little one, the rituals of the day explained in a few warm lines, a note from the grandparents and a table laid for lunch.",
    highlights: ["An arched portrait of the newborn", "The lamp, the whispered name and the first blessings explained", "A note from the grandparents", "A wall of blessings for the little one"], bestFor: ["Naming ceremonies", "Baby welcomes and blessings", "Family gatherings at home"], languages: ["English"], when: "14 March 2027", where: "Thrissur",
  },
  {
    slug: "nandini-and-vikram", name: "Nandini & Vikram", title: "Garden Wedding", eventType: "wedding", template: "garden-romance", theme: "sage-blossom", styles: ["Romantic", "Modern & minimal"],
    cover: "xXHyI3ZRByo", coverFocal: { x: 50, y: 55 }, strip: ["NNNRQgsQXpE", "SHFOaVaVe2A", "IjdzkDxKjc4", "csK5XPO87lI"],
    tagline: "Two gardeners, one very long walk — in the hills of Coorg.", description: "A garden wedding over two days: an oval portrait among leaves, a sapling planted before the ceremony and a long table under lanterns.",
    highlights: ["A flower blooms to open the invitation", "Saplings, garlands and the seven steps explained", "An illustrated map to the garden", "A carousel of garden photographs"], bestFor: ["Garden, resort and lawn weddings", "Daytime ceremonies"], languages: ["English"], when: "10 April 2027", where: "Coorg",
  },
  {
    slug: "riya-and-sameer", name: "Riya & Sameer", title: "Sangeet-Night Wedding", eventType: "wedding", template: "sangeet-night", theme: "festive-pop", styles: ["Playful"],
    cover: "d9RsO9BHFVQ", coverFocal: { x: 50, y: 40 }, strip: ["OzyvCE9a60M", "M8YKi58QKrM", "gG5MoExhMnU", "J03oQgePJog"],
    tagline: "Two families, two cuisines, one very loud dance floor.", description: "A wedding that begins as a party: a ticket to tear, a table of snapshots, a quiz about the couple and a ceremony that borrows from both families.",
    highlights: ["Tear the ticket to open", "Quiz, games and a photo scavenger hunt", "A ceremony that explains both families' customs", "Polaroid-style photo gallery"], bestFor: ["Sangeet and mehendi nights", "Interfaith and modern weddings"], languages: ["English"], when: "22 May 2027", where: "Bengaluru",
  },
  {
    slug: "nair-griha-pravesh", name: "Ananda Nilayam", title: "Griha Pravesh (Housewarming)", eventType: "housewarming", template: "griha-pravesh", theme: "kasavu", styles: ["Traditional"],
    cover: "Zx9In5UiU0w", coverFocal: { x: 55, y: 42 }, strip: ["wc-146118873", "WciKbLIFGxc", "zNY2lVIRh7M", "wc-152617626"],
    tagline: "Open the door to the new home — with every ritual explained.", description: "A traditional housewarming in Kochi: the homam, the first step across the threshold, the milk boiled until it overflows and the first meal.",
    highlights: ["Doors that open onto the new home", "Each ritual explained for guests who are new to it", "One-tap directions and parking", "A wall of good wishes"], bestFor: ["Griha Pravesh and house blessings", "Families with rituals to explain"], languages: ["English"], when: "28 March 2027", where: "Kochi",
  },
  {
    slug: "satyanarayana-puja", name: "Sri Satyanarayana Puja", title: "Puja", eventType: "religious_ceremony", template: "sacred-lamp", theme: "saffron-deep", styles: ["Traditional"],
    cover: "wc-146118873", coverFocal: { x: 50, y: 30 }, strip: ["wc-145136685", "zNY2lVIRh7M", "df6Z3DPPw5U", "wc-40896574"],
    tagline: "A morning of prayer at the family home, with every rite explained.", description: "A devotional invitation for a family puja: the sankalpam, the katha, the aarti and lunch, with the prayer set out in full.",
    highlights: ["Light the lamp to open", "Every rite explained, one by one", "The prayer to be said together", "Directions and parking"], bestFor: ["Pujas and homams", "Temple and community functions"], languages: ["English"], when: "17 January 2027", where: "Chennai",
  },
  {
    slug: "onam-celebration", name: "Onam at Green Meadows", title: "Community Festival", eventType: "festival", template: "festival-lights", theme: "midnight-marigold", styles: ["Luxury", "Traditional"],
    cover: "wc-145136685", coverFocal: { x: 50, y: 45 }, strip: ["wc-133359284", "wc-152617626", "UX3-_dGbCzk", "wc-162739830"],
    tagline: "Pookalam, sadya and a very long tug-of-war.", description: "A residents' association festival: the day's programme from the first flower to the last lamp, with the traditions explained for newcomers.",
    highlights: ["A film strip of festival pictures", "A newcomer's guide to Onam traditions", "Supporters and partners listed", "Register and bring a dish"], bestFor: ["Residents' associations", "Community and cultural festivals"], languages: ["English"], when: "12 December 2026", where: "Bengaluru",
  },
  {
    slug: "ira-turns-one", name: "Ira turns one", title: "First Birthday", eventType: "kids_birthday", template: "garden-party", theme: "peach-garden", styles: ["Romantic", "Playful"],
    cover: "ybvTwLSBtSY", coverFocal: { x: 60, y: 70 }, strip: ["zx0Xt9u1ekw", "saW6YxGBFkw", "ETGJjk9o-48", "4KkTFccuZ0M"],
    tagline: "A bud blooms, a lunch under the trees. Soft peach for a very small guest of honour.",
    description: "A gentle garden invitation for a first birthday: a countdown ring, the day as three soft cards, a note from the parents and a carousel of the first year.",
    highlights: ["A flower blooms to open the invitation", "A countdown ring and the day as soft cards", "Garden pastels and what to wear on the lawn", "A note from the parents and a wall of wishes"],
    bestFor: ["First birthdays", "Daytime garden and terrace parties", "Families gathering for a blessing and lunch"], languages: ["English"], when: "14 March 2027", where: "Kozhikode",
  },
  {
    slug: "kabir-turns-ten", name: "Kabir turns ten", title: "Tenth Birthday", eventType: "kids_birthday", template: "milestone", theme: "lime-ink", styles: ["Modern & minimal", "Playful"],
    cover: "PhuGmoubvo8", coverFocal: { x: 22, y: 40 }, strip: ["Wdb27cW27do", "qojqVPsfAiE", "As8zq82LBpw", "cK6ixOQx1fI"],
    tagline: "The age as a giant number with his photo inside it.",
    description: "A bold invitation for a ten-year-old who has outgrown cartoons: the age drawn huge with the portrait inside it, ten years told as moments and the games afternoon laid out in clean rows.",
    highlights: ["The age as a giant number with the portrait inside", "Ten years as four moments", "The party in clean, readable rows", "A wall of wishes from friends and cousins"],
    bestFor: ["Tenth, thirteenth and sixteenth birthdays", "Games and sports parties", "Parents who want something modern, not a cartoon card"], languages: ["English"], when: "8 May 2027", where: "Kochi",
  },
  {
    slug: "anaya-and-arnav-turn-five", name: "Anaya & Arnav turn five", title: "Twins’ Birthday", eventType: "kids_birthday", template: "royal-celebration", theme: "plum-gold", styles: ["Luxury", "Playful"],
    cover: "iG98pmgWJMU", coverFocal: { x: 52, y: 55 }, strip: ["cK6ixOQx1fI", "As8zq82LBpw", "Hli3R6LKibo", "yxZjTv30tl8"],
    tagline: "Curtains part on plum and gold. A royal birthday for two.",
    description: "A royal invitation for twins who share one party: curtains that part on an arched portrait, a countdown, the royal programme and a dress guide for little princes and princesses.",
    highlights: ["Curtains part on an arched portrait of the twins", "The royal programme: welcome, magician, the two-name cake", "A dress guide in plum, gold and cream", "A wall of wishes for both"],
    bestFor: ["Twins and siblings sharing a party", "Little princes-and-princesses parties", "Formal family birthdays for children"], languages: ["English"], when: "17 April 2027", where: "Thiruvananthapuram",
  },
  {
    slug: "love-our-story", name: "Our Story — sample", title: "Love Gift: Our Story", eventType: "love_gift", template: "our-story", theme: "love-noir", styles: ["Romantic"],
    cover: "pLDDrRkLMWY", strip: ["QoBHQuiu9N0", "TLBDWV7RRYI", "AD3k4pko7wo", "WHNWkO1lBKU"],
    tagline: "The story of two people, told in chapters.", description: "A sample proposal told as a short film: a full-screen photograph for each memory, and a letter that ends with a question.",
    highlights: ["A chapter for every memory", "Full-screen photographs", "A letter at the end", "Nothing to answer"], bestFor: ["A proposal", "A special memory"], languages: ["English"], when: "Private gift", where: "A link only they have",
  },
  {
    slug: "love-letter", name: "A Letter to You — sample", title: "Love Gift: A Letter to You", eventType: "love_gift", template: "letter-to-you", theme: "love-rose", styles: ["Romantic"],
    cover: "WHNWkO1lBKU", strip: ["nBFagEIwy0o", "NNNRQgsQXpE", "AD3k4pko7wo", "pLDDrRkLMWY"],
    tagline: "A sealed envelope and a letter that unfolds.", description: "A sample Valentine's letter: a wax seal to open, paragraphs that appear as you read, and photographs tucked in between.",
    highlights: ["A seal to open", "Paragraph by paragraph", "Photographs tucked in", "Quiet and simple"], bestFor: ["Valentine's Day", "A message that is only yours"], languages: ["English"], when: "Private gift", where: "A link only they have",
  },
  {
    slug: "love-surprise", name: "Little Surprise — sample", title: "Love Gift: Little Surprise", eventType: "love_gift", template: "little-surprise", theme: "love-sorbet", styles: ["Playful"],
    cover: "UJynGW4gF-I", strip: ["K2JtyCVdeuQ", "ch4Fc1cGTq4", "xXHyI3ZRByo", "ykcXm_u84sg"],
    tagline: "A gift to open, with small surprises behind it.", description: "A sample birthday surprise: a wrapped gift, then one small surprise at a time, with a big finish and a skip button always in reach.",
    highlights: ["A gift to open", "One easy tap per surprise", "Skip to the end any time", "Confetti on the last one only"], bestFor: ["A birthday", "Someone who loves surprises"], languages: ["English"], when: "Private gift", where: "A link only they have",
  },
  {
    slug: "love-sorry", name: "I’m Sorry, My Love — sample", title: "Love Gift: I’m Sorry, My Love", eventType: "love_gift", template: "im-sorry-my-love", theme: "love-mist", styles: ["Solemn"],
    cover: "IjdzkDxKjc4", strip: ["IjdzkDxKjc4", "NNNRQgsQXpE", "TLBDWV7RRYI", "QoBHQuiu9N0"],
    tagline: "A sincere apology, offered gently and never demanded.", description: "A sample apology that asks for nothing: read now or later, plain words, how it must have felt, and what the sender would like to do.",
    highlights: ["‘Not right now’ is always fine", "Plain, honest words", "No effects, no pressure", "A reply only if the sender allows it"], bestFor: ["After an argument", "Reconnecting gently"], languages: ["English"], when: "Private gift", where: "A link only they have",
  },
  {
    slug: "love-special-day", name: "Our Special Day — sample", title: "Love Gift: Our Special Day", eventType: "love_gift", template: "our-special-day", theme: "love-rose", styles: ["Romantic"],
    cover: "cRyUjYf6VBQ", strip: ["OmLrFODvPII", "xXHyI3ZRByo", "WHNWkO1lBKU", "nBFagEIwy0o"],
    tagline: "A date, a countdown and the story of your years.", description: "A sample anniversary: a live countdown, the years together, a timeline of memories and a celebration at the end.",
    highlights: ["A live countdown", "Years together, counted", "A timeline of memories", "A burst of celebration"], bestFor: ["Anniversaries", "Milestone birthdays"], languages: ["English"], when: "Private gift", where: "A link only they have",
  },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const TAG_STYLE: Record<string, StyleTag> = { minimalist: "Modern & minimal", royal: "Traditional", traditional: "Traditional", romantic: "Romantic", cinematic: "Luxury", editorial: "Luxury", destination: "Luxury", animated: "Romantic" };

/** The shop window of the twenty-five cinematic weddings, made from what the specification and the casting already say. */
const CINEMATIC_DEMOS: DemoDef[] = CINEMATIC_SPECS.map((s): DemoDef => {
  const cast = CASTING[s.slug];
  const [name, date, , city] = CINEMATIC_SAMPLE_FACTS[s.slug];
  const styles = [...new Set((s.tags ?? []).map((t) => TAG_STYLE[t]).filter((t): t is StyleTag => !!t))];
  return {
    slug: s.demo, name, title: s.name, eventType: s.eventType, template: s.slug, theme: s.theme, styles: styles.length ? styles : ["Luxury"],
    cover: cast.hero, coverFocal: stockInfo(cast.hero)?.focal, strip: cast.gallery.filter((g) => g !== cast.hero).slice(0, 4),
    tagline: s.tagline, description: s.concept, highlights: s.interactions.slice(0, 4), bestFor: s.target, languages: ["English"],
    when: `${Number(date.slice(8))} ${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`, where: city,
  };
});

export const DEMOS: DemoDef[] = [...BASE_DEMOS, ...CINEMATIC_DEMOS];

// ── lookups ─────────────────────────────────────────────────────────────────
const BY_SLUG = new Map(DEMOS.map((d) => [d.slug, d]));
export const demoBySlug = (slug: string): DemoDef | undefined => BY_SLUG.get(slug);

/** The category a sample is filed under first (its event type's own category). */
export function primaryCategory(d: DemoDef): CategorySlug {
  return EVENT_TYPE_INFO[d.eventType].category;
}

/** Samples listed on a category's page: any whose event type the category covers (so “Corporate” also shows the conclave and the summit). */
export function demosIn(category: CategorySlug): DemoDef[] {
  const cat = categoryBySlug(category);
  if (!cat) return [];
  return DEMOS.filter((d) => cat.eventTypes.includes(d.eventType));
}

export function relatedDemos(d: DemoDef, n = 3): DemoDef[] {
  const sameKind = DEMOS.filter((x) => x.slug !== d.slug && primaryCategory(x) === primaryCategory(d));
  const others = DEMOS.filter((x) => x.slug !== d.slug && !sameKind.includes(x));
  return [...sameKind, ...others].slice(0, n);
}

export function themeOf(d: DemoDef) {
  return THEME_SEEDS.find((t) => t.slug === d.theme);
}
export function templateOf(d: DemoDef) {
  return TEMPLATE_SEEDS.find((t) => t.slug === d.template);
}

/** What a guest sees before the day, as plain labels: the sections of the template, in order. */
export function sectionLabels(d: DemoDef): string[] {
  const tpl = templateOf(d);
  if (!tpl) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of tpl.config.sections) {
    const meta = SECTION_META[s.type];
    if (!s.enabled || !meta.phases.includes("PUBLISHED") || seen.has(meta.label)) continue;
    seen.add(meta.label);
    out.push(meta.label);
  }
  return out;
}

/** Display numbers for the gallery order. */
export const demoNumber = (d: DemoDef) => String(DEMOS.indexOf(d) + 1).padStart(2, "0");
