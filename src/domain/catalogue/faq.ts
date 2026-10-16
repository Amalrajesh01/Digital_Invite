/**
 * Questions people actually ask before they order. Written in plain words, with no claim the product cannot back up.
 * (A privacy answer, for instance, only says what the code does: phone numbers never reach a guest’s browser.)
 */
export interface FaqGroup {
  title: string;
  items: { q: string; a: string }[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Getting started",
    items: [
      { q: "How does it work?", a: "Pick a design you like. Send us the details — names, date, place and a few photographs — on WhatsApp or in a short form. We put it all into the design and send you a private preview. When you are happy, we publish it on its own link, ready to share on WhatsApp." },
      { q: "Do I have to design anything myself?", a: "No. You choose a design and tell us what to say. We set the layout and your photographs, and we handle the languages. You only say yes." },
      { q: "How long does it take?", a: "It depends on how quickly we receive your details and photographs. Tell us your date when you message us, and we will say honestly whether it can be ready in time." },
      { q: "Which occasions do you make invitations for?", a: "Weddings (Hindu, Kerala, Christian, Muslim and modern), engagements, birthdays, anniversaries, housewarmings, naming ceremonies, pujas and festivals, corporate events and conferences, and funeral or memorial services. For something else, just ask — the same designs adapt." },
      { q: "What if my occasion is not on the list?", a: "Message us on WhatsApp and describe it. The designs are flexible: a new occasion is a new arrangement of pages, colours and words." },
      { q: "Are the five designs for each occasion really different?", a: "Yes. Each one opens differently (a lamp, a door, a balloon, a ticket, a flower, an envelope), is laid out differently and tells the story in a different order. On the Choose Your Design page you can look at all five side by side." },
    ],
  },
  {
    title: "Your guests",
    items: [
      { q: "Do my guests need an app or an account?", a: "No. They open a link on their phone, or scan a QR code, and the invitation opens in the browser. Nothing to install and nothing to remember." },
      { q: "Will it work for elders and older phones?", a: "Yes. The letters are large and clear, the pages are light, and nothing needs a fast connection. People who prefer less movement on screen get a calmer version automatically." },
      { q: "Can the invitation be in my family’s language?", a: "Yes. You can write the invitation in the language your family speaks. With the Signature and Luxury packages, guests can also switch between English and that language with one tap. Malayalam is fully supported; other languages work with your own wording." },
      { q: "Who sees what?", a: "You decide. A link can be open to everyone or personal for each guest, some events can be shown only to the guests you choose, and photographs and wishes appear only after you approve them." },
      { q: "Is our guests’ information safe?", a: "Phone numbers and private notes never reach a guest’s phone, personal links cannot be guessed, and our visitor counting never records who someone is." },
    ],
  },
  {
    title: "Replies and planning",
    items: [
      { q: "How do replies work?", a: "Guests answer yes, no or maybe and tell you how many are coming — and, if you ask, their food choice, whether they need a place to stay and whether they need a ride. You see every reply in one place." },
      { q: "Can I change things after sharing the link?", a: "Any time. Every change goes to the same link, and every version is saved so you can go back." },
      { q: "What happens after the event?", a: "The same link becomes a gallery and a guestbook, and with Signature or Luxury your photographs, wishes and memories stay online for life." },
      { q: "Is there anything for the day itself?", a: "With the Luxury package: a QR pass for each guest and quick check-in, live updates, a photo wall for the venue screen, games, and a time capsule that opens on a date you choose." },
    ],
  },
  {
    title: "For My Love gifts",
    items: [
      { q: "What is a For My Love gift?", a: "A private page made for one person: your words, your photographs and, if you like, a song. You choose how it unfolds — a story, a letter, a surprise, an apology or a special day — and send the link only to them." },
      { q: "Who can see my gift?", a: "Only people who have the link. It cannot be guessed, search engines are told to ignore it, and you can pause it at any time. Pausing stops the link working immediately." },
      { q: "What happens to my photographs?", a: "They are used only inside your gift and stored privately. You can delete a photograph, or the whole gift, whenever you like. A gift you start but never send to us is deleted after 14 days." },
      { q: "Does the person have to reply?", a: "Never. A reply button appears only if you switch it on, and even then it is a quiet link at the very end. The apology gift asks for nothing at all." },
    ],
  },
  {
    title: "Pricing and support",
    items: [
      { q: "What does it cost?", a: "There are three packages — Essential, Signature and Luxury — priced per invitation, one-time, in Indian rupees. The current prices are on the Pricing page. If you want something larger, such as a conference, tell us and we will quote it." },
      { q: "Can I try a design before I order?", a: "Yes. Every design on the site opens like a real invitation, with sample details. A design becomes yours when you order it and we set it with your details. You always see the private preview before anyone else." },
      { q: "How do I pay?", a: "We confirm the details and the package with you on WhatsApp, and you pay us directly. There is nothing to pay on this website." },
      { q: "Who do I talk to?", a: "A person at Stack Bridge Labs. Message us on WhatsApp and we reply personally." },
      { q: "A loved one has died. Can you help quickly?", a: "Yes. Message us on WhatsApp and our team will take you through it gently. We only need the details of the service, a photograph and the words you want to say." },
    ],
  },
];

export const FAQ_ALL = FAQ_GROUPS.flatMap((g) => g.items);
const pick = (q: string) => FAQ_ALL.find((f) => f.q === q)!;

/** The four questions on the home page. */
export const FAQ_HOME = [pick("How does it work?"), pick("Do my guests need an app or an account?"), pick("Can the invitation be in my family’s language?"), pick("What does it cost?")];
