import type { InvitationDoc, LocalizedText } from "../../src/domain/doc/schema";
import type { LoveExperience, LoveMood, LoveOccasion } from "../../src/domain/love/constants";
import { newId } from "../../src/lib/id";
import type { Ids, Need } from "./showcase";

/**
 * Five sample love gifts, one per experience. Everything in them is fictional: the names, the memories, the dates.
 * The photographs are stand-ins; a real gift uses the sender's own, which only ever live in that gift.
 */
const L = (en: string): LocalizedText => ({ en });

export interface LoveCfg {
  slug: string; title: string; template: string; theme: string; track: string; date: string;
  experience: LoveExperience; occasion: LoveOccasion; mood: LoveMood;
  from: string; to: string; nickname?: string; addressAs?: "name" | "nickname" | "both"; signAs?: "name" | "initial" | "anonymous";
  loveDate?: string; dateLabel?: string; headline?: string;
  letter: string; closing?: string;
  apology?: { owning: string; feelings: string; promise: string };
  reasons?: string[];
  memories?: { title: string; body: string; when: string; photo?: string }[];
  /** Keys declared in `needs`, in the order they appear. */
  photos: string[];
  needs: Need[];
}

export function buildLoveDoc(base: InvitationDoc, c: LoveCfg, id: Ids): InvitationDoc {
  const doc = structuredClone(base) as InvitationDoc;
  doc.eventType = "love_gift";
  doc.sections = [];
  doc.opening = { ...doc.opening, variant: "none", celebration: "off" };
  doc.love = {
    experience: c.experience, occasion: c.occasion, mood: c.mood, from: c.from, to: c.to, nickname: c.nickname ?? "", addressAs: c.addressAs ?? "name", signAs: c.signAs ?? "name",
    date: c.loveDate ?? "", dateLabel: L(c.dateLabel ?? ""), language: "en", headline: L(c.headline ?? ""), letter: L(c.letter),
    apology: { owning: L(c.apology?.owning ?? ""), feelings: L(c.apology?.feelings ?? ""), promise: L(c.apology?.promise ?? "") },
    reasons: (c.reasons ?? []).map(L),
    memories: (c.memories ?? []).map((m) => ({ id: newId(), title: L(m.title), body: L(m.body), when: m.when, photo: m.photo ? id(m.photo) : undefined })),
    photos: c.photos.map((k) => id(k)).filter((x): x is string => !!x),
    closing: L(c.closing ?? ""), reply: { enabled: false, whatsapp: "" },
  };
  doc.seo = { title: L("A sample love gift"), description: L("A sample from Invites by Stack Bridge Labs."), ogImage: undefined } as never;
  return doc;
}

export const LOVE_DEMOS: LoveCfg[] = [
  {
    slug: "love-our-story", title: "Our Story — sample", template: "our-story", theme: "love-noir", track: "Slow Evening (ambient)", date: "2027-02-14",
    experience: "story", occasion: "proposal", mood: "cinematic", from: "Arjun", to: "Meera", nickname: "Meeru", addressAs: "name",
    headline: "Meera, this is us",
    memories: [
      { when: "June 2019", title: "The rain at Cubbon Park", body: "You had one umbrella and no plan.\n\nI had no umbrella and every plan. We shared the umbrella for two hours and the plan for the rest of our lives.", photo: "p1" },
      { when: "December 2021", title: "The long drive", body: "Eleven hours to Coorg and you slept for nine of them.\n\nI have never been happier to drive slowly.", photo: "p2" },
      { when: "March 2023", title: "The day my mother asked about you", body: "She asked if you were ‘serious’. I said you were the only serious thing about me.\n\nShe laughed. She has never laughed at anything I said.", photo: "p3" },
      { when: "Today", title: "A question I have been carrying", body: "Seven years of ordinary days, and I want every one that is left.", photo: "p4" },
    ],
    letter: "Meera,\n\nI have written this letter eleven times and deleted it ten. Words are what I do for a living and I still cannot say this properly.\n\nYou make a room feel like a home. You make a Tuesday feel like a festival. When I imagine growing old, you are the one who is annoyed at how slowly I walk.\n\nSo here is the question, the only one I have ever really wanted to ask.",
    closing: "Will you marry me?", photos: ["p1", "p2", "p3", "p4"],
    needs: [["p1", "pLDDrRkLMWY", "COUPLE"], ["p2", "QoBHQuiu9N0", "COUPLE"], ["p3", "TLBDWV7RRYI", "COUPLE"], ["p4", "AD3k4pko7wo", "COUPLE", { focal: { x: 45, y: 28 } }]],
  },
  {
    slug: "love-letter", title: "A Letter to You — sample", template: "letter-to-you", theme: "love-rose", track: "Candlelight (ambient)", date: "2027-02-14",
    experience: "letter", occasion: "valentine", mood: "romantic", from: "Kiran", to: "Anu", nickname: "Anukutty", addressAs: "both",
    letter: "I have been trying to think of what to give you this year, and the truth is that there is nothing in a shop that says it.\n\nSo here is what I know. I know the sound you make when you find the last piece of a jigsaw. I know which side of the bed gets cold first. I know that when you say you are fine, you mean ‘ask me again in ten minutes’.\n\nI know that in a world of loud people, you are the quiet one I would choose to sit next to, every time.\n\nThank you for the thousand small ways you make my life better, and for pretending not to notice that I notice.\n\nI do not say it often enough. I love you. I love you in the morning when you are cross about the alarm, and at night when you steal the blanket, and in all the hours between.",
    closing: "Always yours,", photos: ["p1", "p2", "p3"],
    needs: [["p1", "WHNWkO1lBKU", "COUPLE", { focal: { x: 50, y: 35 } }], ["p2", "nBFagEIwy0o", "COUPLE"], ["p3", "NNNRQgsQXpE", "COUPLE", { focal: { x: 45, y: 50 } }]],
  },
  {
    slug: "love-surprise", title: "Little Surprise — sample", template: "little-surprise", theme: "love-sorbet", track: "Birthday Skip (ambient)", date: "2027-03-09",
    experience: "surprise", occasion: "birthday", mood: "playful", from: "Sneha", to: "Vishnu", nickname: "Vichu", addressAs: "nickname",
    headline: "Happy birthday, Vichu!",
    reasons: ["You laugh at your own jokes before you finish them.", "You remember what I said three months ago and bring it up at exactly the right moment.", "You are the only person who has ever made me enjoy a Monday.", "You carry my bag and pretend it is not heavy.", "Your cooking is terrible and you are proud of it.", "You make everyone around you feel like the funniest person in the room."],
    memories: [
      { when: "Our first trip", title: "The wrong bus to Munnar", body: "We saw more of Kerala in that one wrong bus than in ten right ones.", photo: "p1" },
      { when: "Last year", title: "The cake that fell", body: "It fell. We ate it with spoons on the kitchen floor. Best birthday ever.", photo: "p2" },
    ],
    letter: "Today is all about you. I wanted to give you something you could keep, so I made you this.\n\nThank you for being the kindest, silliest and most reliable person I know. Now go and eat cake.",
    closing: "Love you, birthday boy!", photos: ["p1", "p2", "p3", "p4", "p5"],
    needs: [["p1", "K2JtyCVdeuQ", "COUPLE"], ["p2", "UJynGW4gF-I", "COUPLE"], ["p3", "ch4Fc1cGTq4", "COUPLE"], ["p4", "xXHyI3ZRByo", "COUPLE"], ["p5", "1dzXfvALJxs", "COUPLE", { focal: { x: 48, y: 45 } }]],
  },
  {
    slug: "love-sorry", title: "I’m Sorry, My Love — sample", template: "im-sorry-my-love", theme: "love-mist", track: "Still Water (ambient)", date: "2027-01-20",
    experience: "sorry", occasion: "sorry", mood: "apology", from: "Rohan", to: "Diya", addressAs: "name",
    headline: "Diya, I have something to say",
    apology: {
      owning: "I was not there when you needed me on Saturday, and then I made it worse by getting defensive when you told me how it felt.\n\nThere is no good reason for either. I am not going to offer you one.",
      feelings: "I think it felt like being unimportant. Like the thing you had been looking forward to for weeks was something I could casually put second.\n\nI think it hurt more because it was not the first time you had to remind me. I am so sorry that you had to.",
      promise: "I would like to be the person who shows up without being asked. I have already put your calendar on my phone, with the alarm set the day before.\n\nWhenever you are ready — in a day, a week, longer — I would like to listen, properly, to all of it.",
    },
    memories: [{ when: "A memory I keep coming back to", title: "The night the power went out", body: "We sat on the balcony with one candle and you told me about your grandmother’s house.\n\nI have never felt so trusted. I would like to deserve that again.", photo: "p1" }],
    letter: "", closing: "Take all the time you need.", photos: ["p1"],
    needs: [["p1", "IjdzkDxKjc4", "COUPLE"]],
  },
  {
    slug: "love-special-day", title: "Our Special Day — sample", template: "our-special-day", theme: "love-rose", track: "Golden Hour (ambient)", date: "2027-09-18",
    experience: "day", occasion: "anniversary", mood: "romantic", from: "Ammu", to: "Kunju", nickname: "Kunju", addressAs: "name",
    loveDate: "2019-09-18", dateLabel: "Since the day we said yes", headline: "Happy anniversary, Kunju",
    memories: [
      { when: "2019", title: "A yes at a bus stop", body: "You asked in the rain. I said yes before you finished the sentence.", photo: "p1" },
      { when: "2021", title: "Our first home", body: "One room, one fan, two chairs and a lot of plans.", photo: "p2" },
      { when: "2023", title: "The trip we almost cancelled", body: "I am so glad we did not.", photo: "p3" },
      { when: "2025", title: "Six years of us", body: "Still choosing each other, every ordinary day.", photo: "p4" },
    ],
    letter: "Thank you for six years of being my favourite person.\n\nHere is to the next sixty, and to every small, ordinary morning in between.",
    closing: "Here’s to us.", photos: ["p1", "p2", "p3", "p4", "p5", "p6"],
    needs: [["p1", "cRyUjYf6VBQ", "COUPLE"], ["p2", "OmLrFODvPII", "COUPLE"], ["p3", "xXHyI3ZRByo", "COUPLE"], ["p4", "WHNWkO1lBKU", "COUPLE", { focal: { x: 50, y: 35 } }], ["p5", "TLBDWV7RRYI", "COUPLE"], ["p6", "nBFagEIwy0o", "COUPLE"]],
  },
];
