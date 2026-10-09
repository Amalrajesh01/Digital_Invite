/**
 * Questions people actually ask before they order. Written plainly, with no claim the product cannot back up.
 * (A guest-privacy answer, for instance, only says what the code does: phone numbers never reach a guest’s browser.)
 */
export interface FaqGroup {
  title: string;
  items: { q: string; a: string }[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Getting started",
    items: [
      { q: "How does it work?", a: "Choose a template, message us on WhatsApp with the details of your occasion and a few photographs, and we set it all into the design. You get a private preview with your names on it; when you are happy, it goes live on its own link." },
      { q: "Do I need to design anything myself?", a: "No. You choose a template and tell us what to say. We write the layout, set your photographs, and handle the language — you only approve." },
      { q: "How long does it take?", a: "It depends on how quickly we receive the details and photographs. Tell us your date when you message us and we will say honestly whether it is possible." },
      { q: "Which occasions do you make invitations for?", a: "Weddings (Hindu, Kerala, Christian, Muslim and modern), engagements, birthdays, anniversaries, naming ceremonies, corporate events such as conclaves and summits, and funeral or memorial services — with more designed on request." },
      { q: "Can you make something that is not in the templates?", a: "Yes. Message us on WhatsApp describing the occasion. The same engine powers every design, so a new occasion is a new arrangement of sections, colours and words." },
    ],
  },
  {
    title: "Your guests",
    items: [
      { q: "Do my guests need an app or an account?", a: "No. They open a link on their phone — or scan a QR code — and the invitation opens in the browser. Nothing to install and nothing to remember." },
      { q: "Will it work for elders and slow phones?", a: "Yes. The text is large and high-contrast, the pages are light, and nothing depends on a fast connection. Guests who prefer reduced motion get a calmer version." },
      { q: "Can the invitation be in my family’s language?", a: "Yes. Guests switch between English and a local language such as Malayalam with one tap. Other languages — Tamil, Telugu, Kannada, Hindi, Marathi — can be added with their own wording." },
      { q: "Who sees what?", a: "You decide. A link can be public or personal for each guest, individual events can be shown only to the guests you choose, and photographs and wishes appear only after you approve them." },
      { q: "Is our guests’ information safe?", a: "Phone numbers and private notes never reach a guest’s browser, personal links cannot be guessed, and our analytics never record who someone is." },
    ],
  },
  {
    title: "Replies and planning",
    items: [
      { q: "How do replies work?", a: "Guests answer yes, no or maybe, tell you how many are coming, and — if you ask — their meal, whether they need a place to stay and whether they need a ride. You see every reply in one place." },
      { q: "Can I change things after sharing the link?", a: "Anytime. Every change is published to the same link, and every publish is saved as a version you can go back to." },
      { q: "What happens after the event?", a: "The same link becomes a gallery, a guestbook and a keepsake. Photographs and messages are kept — they are never auto-deleted." },
      { q: "Is there anything for the day itself?", a: "On the Luxury package: a QR pass for each guest and fast check-in, live updates, a projector photo wall, games, and a time capsule that opens on a date you choose." },
    ],
  },
  {
    title: "Pricing and support",
    items: [
      { q: "What does it cost?", a: "There are three packages — Essential, Signature and Luxury — priced per invitation, one-time, in Indian rupees. The current prices are on the pricing page and in every package card." },
      { q: "Are the templates free to try?", a: "Every sample on the site is open for you to explore as a guest would. A design is yours when you order it and we set it with your details." },
      { q: "What about a conference or a large event?", a: "Tell us what you need — registration, speakers, a programme, partners — and we will quote it. The corporate designs are built for exactly that." },
      { q: "Who do I talk to?", a: "A person at Stack Bridge Labs — message us on WhatsApp and we reply personally." },
      { q: "A loved one has died. Can you help quickly?", a: "Yes. Message us on WhatsApp and our team will take you through it gently. We need only the details of the service, a photograph and the words you want to say." },
    ],
  },
];

export const FAQ_ALL = FAQ_GROUPS.flatMap((g) => g.items);

/** The four questions on the home page. */
export const FAQ_HOME = [FAQ_ALL[0], FAQ_ALL[5], FAQ_ALL[7], FAQ_ALL[12]];
