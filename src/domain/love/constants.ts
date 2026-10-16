/**
 * "For My Love" — a personal digital gift rather than an invitation. These are its fixed vocabularies.
 * (The experience itself is rendered by `src/invitation/love/`; the private link and its controls live in `src/domain/gifts/`.)
 */

/** What the gift is for. Every one is optional wording — nothing assumes a particular kind of couple or relationship. */
export const LOVE_OCCASIONS = ["birthday", "anniversary", "sorry", "just_because", "proposal", "valentine", "memory", "custom"] as const;
export type LoveOccasion = (typeof LOVE_OCCASIONS)[number];

/** How it should feel. Chooses the colours; the experience chooses the shape. */
export const LOVE_MOODS = ["cute", "romantic", "emotional", "playful", "cinematic", "minimal", "apology"] as const;
export type LoveMood = (typeof LOVE_MOODS)[number];

/** The five ways a gift can unfold. */
export const LOVE_EXPERIENCES = ["story", "letter", "surprise", "sorry", "day"] as const;
export type LoveExperience = (typeof LOVE_EXPERIENCES)[number];

export interface OccasionInfo {
  label: string;
  /** One line under the label in the builder. */
  hint: string;
  /** The experience that suits it best (the customer can change it). */
  experience: LoveExperience;
  mood: LoveMood;
}

export const OCCASION_INFO: Record<LoveOccasion, OccasionInfo> = {
  birthday: { label: "Birthday", hint: "A surprise for their special day", experience: "surprise", mood: "playful" },
  anniversary: { label: "Anniversary", hint: "Years together, in a few minutes", experience: "day", mood: "romantic" },
  sorry: { label: "Sorry, My Love", hint: "A sincere apology they can read when they are ready", experience: "sorry", mood: "apology" },
  just_because: { label: "Just because", hint: "No reason needed", experience: "letter", mood: "cute" },
  proposal: { label: "Proposal", hint: "The question, asked beautifully", experience: "story", mood: "cinematic" },
  valentine: { label: "Valentine’s Day", hint: "Say it your way", experience: "letter", mood: "romantic" },
  memory: { label: "Our special memory", hint: "One moment, remembered properly", experience: "story", mood: "emotional" },
  custom: { label: "My own message", hint: "Something that is only yours to say", experience: "letter", mood: "minimal" },
};

export const MOOD_LABEL: Record<LoveMood, string> = {
  cute: "Cute", romantic: "Romantic", emotional: "Emotional", playful: "Playful", cinematic: "Cinematic", minimal: "Minimal", apology: "Heartfelt apology",
};

/** The colour theme (see `themes-extra.ts`) each mood uses. */
export const MOOD_THEME: Record<LoveMood, string> = {
  cute: "love-blush", romantic: "love-rose", emotional: "love-dusk", playful: "love-sorbet", cinematic: "love-noir", minimal: "love-paper", apology: "love-mist",
};

/** Prompts that help someone find their words. None is required; every answer lands in the right place in the gift. */
export const LOVE_PROMPTS = [
  { key: "mostLove", question: "What do you love most about this person?", placeholder: "The way you laugh at your own jokes before you reach the end of them…" },
  { key: "memory", question: "What is your favourite memory together?", placeholder: "The evening it rained and we walked home anyway…" },
  { key: "say", question: "What would you like to say to them?", placeholder: "I don’t say it enough, but…" },
  { key: "sorry", question: "Is there something you want to apologise for?", placeholder: "I’m sorry that I…" },
  { key: "special", question: "What makes your relationship special?", placeholder: "We can sit in silence and it is still the best part of my day." },
] as const;

export const LOVE_EXPERIENCE_INFO: Record<LoveExperience, { slug: string; name: string; tagline: string; howItFeels: string }> = {
  story: { slug: "our-story", name: "Our Story", tagline: "A cinematic story of the two of you, chapter by chapter.", howItFeels: "Full-screen photographs, one memory at a time, ending in a letter." },
  letter: { slug: "letter-to-you", name: "A Letter to You", tagline: "An envelope to open and a letter that unfolds.", howItFeels: "Quiet, intimate and simple. Made to be read slowly." },
  surprise: { slug: "little-surprise", name: "Little Surprise", tagline: "A gift to open, with small surprises behind it.", howItFeels: "Playful and warm. Every tap is easy; nothing can go wrong." },
  sorry: { slug: "im-sorry-my-love", name: "I’m Sorry, My Love", tagline: "A sincere apology, offered gently and never demanded.", howItFeels: "Calm and unhurried. They read it when they are ready — or later." },
  day: { slug: "our-special-day", name: "Our Special Day", tagline: "A date, a countdown and the story of your years.", howItFeels: "Celebratory. For birthdays and anniversaries, with a memory timeline." },
};

export const isLoveExperience = (v: unknown): v is LoveExperience => typeof v === "string" && (LOVE_EXPERIENCES as readonly string[]).includes(v);
