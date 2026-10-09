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
  wedding: [
    { name: "The ceremony", glyph: "rings", description: "The vows, the rings and the first kiss as a married couple." },
    { name: "Cocktail hour", glyph: "flower", description: "Drinks and good company while the photographs are taken." },
    { name: "Dinner", glyph: "bowl", description: "A long, relaxed meal with the people who matter." },
    { name: "First dance", glyph: "knot", description: "The floor opens for the couple, then for everyone." },
  ],
  kids_birthday: [
    { name: "Welcome & games", glyph: "flower", description: "Face painting, balloons and a few silly games to start." },
    { name: "The cake", glyph: "flame", description: "Candles, a wish and a very large slice." },
    { name: "Party bags", glyph: "bowl", description: "Something small to take home." },
  ],
  baby_shower: [
    { name: "Welcome", glyph: "flower", description: "Drinks, snacks and a warm hello." },
    { name: "Games", glyph: "drum", description: "A few gentle games — no embarrassing ones, promise." },
    { name: "Blessings & wishes", glyph: "lamp", description: "Words and good wishes for the little one on the way." },
    { name: "Cake", glyph: "flame", description: "Something sweet to finish." },
  ],
  naming_ceremony: [
    { name: "Blessings", glyph: "lamp", description: "Elders bless the baby and the family." },
    { name: "The naming", glyph: "flower", description: "The name is whispered, and then announced to everyone." },
    { name: "Lunch", glyph: "bowl", description: "A meal together to celebrate the new arrival." },
  ],
  housewarming: [
    { name: "Blessing of the home", glyph: "lamp", description: "A prayer and a lamp lit as the family steps in for the first time." },
    { name: "Tour of the new home", glyph: "flower", description: "Come and see where we will be making memories." },
    { name: "Lunch", glyph: "bowl", description: "A meal together to bless the first day." },
  ],
  graduation: [
    { name: "The ceremony", glyph: "lamp", description: "Names are called and degrees are received." },
    { name: "Photographs", glyph: "flower", description: "Caps in the air, on the lawn." },
    { name: "Celebration", glyph: "bowl", description: "Lunch with family and friends." },
  ],
  retirement: [
    { name: "Welcome", glyph: "flower", description: "Drinks and a warm hello." },
    { name: "Tributes", glyph: "lamp", description: "Words from colleagues, friends and family." },
    { name: "Celebration dinner", glyph: "bowl", description: "To the years behind and the ones ahead." },
  ],
  reunion: [
    { name: "Arrivals", glyph: "flower", description: "Name tags, hugs and the first “you haven’t changed a bit”." },
    { name: "Reminiscing", glyph: "lamp", description: "Old photographs, old stories." },
    { name: "Dinner", glyph: "bowl", description: "A long meal together." },
  ],
  private_party: [
    { name: "Arrivals", glyph: "flower", description: "Drinks and good company." },
    { name: "Dinner", glyph: "bowl", description: "A relaxed meal together." },
    { name: "Music & dancing", glyph: "drum", description: "The playlist is a surprise." },
  ],
  religious_ceremony: [
    { name: "Opening prayer", glyph: "lamp", description: "The ceremony begins with a prayer for blessings." },
    { name: "The ceremony", glyph: "kalash", description: "The rites, explained so that every guest can follow along." },
    { name: "Blessings & meal", glyph: "bowl", description: "Prasad or a shared meal to close the day." },
  ],
  cultural_event: [
    { name: "Welcome", glyph: "flower", description: "A traditional welcome for every guest." },
    { name: "Performances", glyph: "drum", description: "Music, dance and storytelling." },
    { name: "Dinner", glyph: "bowl", description: "A shared meal of the season’s dishes." },
  ],
  festival: [
    { name: "Lighting of the lamp", glyph: "lamp", description: "The festival opens with a lamp and a prayer." },
    { name: "Cultural programme", glyph: "drum", description: "Music, dance and games for every age." },
    { name: "The feast", glyph: "bowl", description: "A table full of festival food." },
  ],
  corporate_event: [],
  conclave: [],
  conference: [],
  product_launch: [],
  funeral: [
    { name: "Final respects", glyph: "flower", description: "Family and friends gather to pay their last respects." },
    { name: "Funeral service", glyph: "lamp", description: "A service of prayer, readings and remembrance." },
    { name: "Committal", glyph: "none", description: "The family will lay their loved one to rest. Please speak to the family if you wish to attend." },
  ],
  memorial: [
    { name: "Prayer service", glyph: "lamp", description: "A quiet service of prayer and remembrance." },
    { name: "Tributes", glyph: "flower", description: "Those who loved them share a few words." },
    { name: "Refreshments", glyph: "bowl", description: "Tea and light refreshments for everyone who comes." },
  ],
};
