import type { TemplateSeed } from "@/domain/design/templates";
import { LOVE_EXPERIENCE_INFO, MOOD_THEME, type LoveExperience, type LoveMood } from "./constants";

/**
 * The five "For My Love" experiences. They are not five colourings of one page: each opens differently, moves
 * differently and asks something different of the person who receives it (see `src/invitation/love/`).
 * The mood — chosen separately — only supplies the colours.
 */
export interface LoveSpec {
  experience: LoveExperience;
  slug: string;
  name: string;
  tagline: string;
  concept: string;
  /** The moods that suit it best; the first is its default and the one the gallery shows it in. */
  moods: LoveMood[];
  target: string[];
  images: string;
  motion: string;
  interactions: string[];
  /** What the person who receives it must (not) do. */
  recipient: string;
  /** The sample gift whose words and photographs preview it. */
  demo: string;
  /** The nearest visual direction (only used for the data attribute; the experience has its own styling). */
  direction: "royal" | "minimal" | "cinematic" | "floral" | "playful";
}

export const LOVE_SPECS: LoveSpec[] = [
  {
    experience: "story", ...LOVE_EXPERIENCE_INFO.story, concept: "A title card, then your story in chapters: a full-screen photograph for each memory, the words appearing line by line, and a letter at the end.",
    moods: ["cinematic", "emotional", "romantic"], direction: "cinematic",
    target: ["A proposal", "A special memory", "Anyone with photographs from many years"],
    images: "One full-screen photograph per chapter, held while its words arrive.", motion: "Slow fades, a quiet zoom on each photograph, a gentle parallax. Nothing moves fast.",
    interactions: ["Tap to begin", "Scroll through the chapters", "Play or pause the music"],
    recipient: "Scrolls and reads. There is nothing to answer.", demo: "love-our-story",
  },
  {
    experience: "letter", ...LOVE_EXPERIENCE_INFO.letter, concept: "A sealed envelope that opens onto a letter. The words unfold paragraph by paragraph; photographs are tucked in between.",
    moods: ["romantic", "minimal", "cute"], direction: "floral",
    target: ["Valentine’s Day", "A message that is just yours to say", "Long-distance love"],
    images: "Photographs as small prints tucked between paragraphs; one on the closing page.", motion: "A seal that cracks, a letter that rises; paragraphs fade in as you read.",
    interactions: ["Tap the seal to open", "Scroll to read", "Play or pause the music"],
    recipient: "Opens and reads. There is nothing to answer.", demo: "love-letter",
  },
  {
    experience: "surprise", ...LOVE_EXPERIENCE_INFO.surprise, concept: "A wrapped gift to open, then small surprises one tap at a time: a memory, a reason, a photograph, a message — and a big final one.",
    moods: ["playful", "cute", "romantic"], direction: "playful",
    target: ["A birthday surprise", "Someone who loves to be spoiled", "Couples who laugh a lot"],
    images: "Photographs revealed one at a time as little prints; a collage at the finish.", motion: "Springy and warm; confetti on the last surprise only.",
    interactions: ["Tap the gift to open", "One big ‘Next surprise’ button each time", "‘Skip to the end’ is always there"],
    recipient: "Taps a big button. Every step can be skipped; nothing can be failed.", demo: "love-surprise",
  },
  {
    experience: "sorry", ...LOVE_EXPERIENCE_INFO.sorry, concept: "A calm page that begins by asking nothing. An honest apology, an acknowledgement of how it felt, a memory and a promise — read at their own pace.",
    moods: ["apology", "emotional", "minimal"], direction: "minimal",
    target: ["After an argument", "A real apology that needs space", "Reconnecting gently"],
    images: "Optional — one quiet photograph, never more than a few.", motion: "Very slow fades. No confetti, no sound unless they choose it.",
    interactions: ["‘Read it now’ or ‘Not right now’ — both are fine", "Scroll to read", "Optional reply, only if you allow it"],
    recipient: "Chooses whether and when to read it. Is never asked to forgive, answer or react.", demo: "love-sorry",
  },
  {
    experience: "day", ...LOVE_EXPERIENCE_INFO.day, concept: "The date in large numerals, a live countdown (or the years so far), a timeline of your memories and a celebration at the end.",
    moods: ["romantic", "playful", "cute"], direction: "royal",
    target: ["Birthdays and anniversaries", "Milestones: one year, ten years", "Couples with a story to count"],
    images: "A collage at the start; a photograph for each point on the timeline.", motion: "Counting numerals, a sliding timeline, a burst of petals at the end.",
    interactions: ["Tap to begin", "Swipe through the timeline", "Play or pause the music"],
    recipient: "Swipes through the memories. There is nothing to answer.", demo: "love-special-day",
  },
];

export const loveSpecByExperience = (e: LoveExperience): LoveSpec => LOVE_SPECS.find((s) => s.experience === e)!;
export const loveSpecBySlug = (slug: string) => LOVE_SPECS.find((s) => s.slug === slug);

/** The templates the studio and the preview know about. The experience renders the whole page, so there are no sections. */
export const LOVE_TEMPLATE_SEEDS: TemplateSeed[] = LOVE_SPECS.map((s) => ({
  slug: s.slug,
  name: s.name,
  description: `${s.tagline} ${s.concept}`,
  config: { flavor: s.direction, opening: "none", suggestedTheme: MOOD_THEME[s.moods[0]], eventType: "love_gift", demo: s.demo, experience: s.experience, sections: [] },
}));

