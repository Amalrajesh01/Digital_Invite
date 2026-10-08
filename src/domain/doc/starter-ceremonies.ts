import type { Ceremony } from "./schema";
import type { EventType } from "./event-types";

/**
 * The ceremonies a NEW invitation starts with, so the section is never empty and nobody has to know the right words.
 * Entirely editable (and deletable) — families differ — and English only: the studio translates them like any content.
 */
type Starter = Pick<Ceremony, "glyph"> & { name: string; description: string };

export const STARTER_CEREMONIES: Record<EventType, Starter[]> = {
  hindu_wedding: [
    { name: "Ganesh Puja", glyph: "kalash", description: "Every beginning starts with Lord Ganesh — a prayer for blessings and an obstacle-free wedding." },
    { name: "Haldi", glyph: "bowl", description: "A paste of turmeric is applied to the bride and groom to bless and brighten them." },
    { name: "Mehendi", glyph: "flower", description: "Henna for the bride’s hands — the darker it stains, the deeper the love, they say." },
    { name: "Baraat", glyph: "drum", description: "The groom arrives in procession with music and dancing." },
    { name: "Kanyadaan", glyph: "knot", description: "The bride’s parents give their daughter’s hand in marriage." },
    { name: "Mangal Phera", glyph: "flame", description: "Seven rounds around the sacred fire, seven promises." },
  ],
  christian_wedding: [
    { name: "Betrothal", glyph: "rings", description: "The families gather to bless the couple’s promise to marry, and the rings are blessed." },
    { name: "The church service", glyph: "lamp", description: "The wedding Mass or service: readings, a homily and the blessing of the marriage." },
    { name: "Exchange of vows", glyph: "knot", description: "The couple make their promises to each other before God and their families." },
    { name: "Blessing of the rings", glyph: "rings", description: "The rings are blessed and exchanged as a sign of faithful love." },
    { name: "Reception", glyph: "flower", description: "Dinner, toasts and dancing with everyone who came to celebrate." },
  ],
  muslim_wedding: [
    { name: "Mehendi", glyph: "flower", description: "An evening of henna, songs and sweets with the women of both families." },
    { name: "Mangni", glyph: "rings", description: "The families formally celebrate the engagement and exchange gifts." },
    { name: "Nikah", glyph: "lamp", description: "The marriage contract: the khutbah, the ijab-o-qubool and the signing of the nikahnama before witnesses." },
    { name: "Rukhsati", glyph: "knot", description: "The bride’s tearful, joyful farewell as she leaves her parents’ home with her husband." },
    { name: "Walima", glyph: "bowl", description: "The groom’s family hosts a feast to celebrate the marriage." },
  ],
  engagement: [
    { name: "Exchange of rings", glyph: "rings", description: "The moment the promise becomes official." },
    { name: "Blessings", glyph: "lamp", description: "Elders bless the couple and the two families meet." },
    { name: "Celebration", glyph: "flower", description: "Music, food and everyone you love in one room." },
  ],
  reception: [
    { name: "Welcome", glyph: "flower", description: "Drinks and good company as guests arrive." },
    { name: "Toasts", glyph: "rings", description: "Words from the people who know the couple best." },
    { name: "Dinner", glyph: "bowl", description: "A long, relaxed meal." },
    { name: "First dance", glyph: "knot", description: "The floor opens for the couple, then for everyone." },
  ],
  birthday: [
    { name: "Welcome", glyph: "flower", description: "Come as you are — the celebration starts on arrival." },
    { name: "The cake", glyph: "flame", description: "Candles, a wish and a very large slice." },
    { name: "Music & dancing", glyph: "drum", description: "The playlist is a surprise." },
  ],
  anniversary: [
    { name: "Renewal of vows", glyph: "rings", description: "A few quiet words, years later." },
    { name: "Dinner", glyph: "bowl", description: "Family and friends around one long table." },
    { name: "Toast", glyph: "flame", description: "To the years behind and the ones ahead." },
  ],
};
