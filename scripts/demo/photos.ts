/**
 * Real photographs for the demonstration weddings.
 *
 * The files live in assets/stock/ (resized from Unsplash originals — see CREDITS.md there for the
 * photographer and licence of every picture). The seed uploads them through the normal media pipeline, exactly
 * as a customer's own photographs would be, so nothing is hot-linked and nothing can break at runtime.
 * If a file is ever missing the seed falls back to the procedural illustrations in art.ts.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "assets", "stock");

export function stockPhoto(id: string): Buffer | null {
  const file = path.join(DIR, `${id}.jpg`);
  return existsSync(file) ? readFileSync(file) : null;
}

export interface StockInfo {
  /** Plain-language description (used as alt text). */
  alt: string;
  /** Focal point in percent — keeps faces in frame when the picture is cropped to a screen. */
  focal?: { x: number; y: number };
}

export const STOCK: Record<string, StockInfo> = {
  // north Indian, red & gold
  "2oQy4GAGxbk": { alt: "The bride and groom walking hand in hand along a tree-lined path, he in an ivory and red sherwani, she in a red lehenga", focal: { x: 50, y: 17 } },
  "2XXQkrL0k-Q": { alt: "The couple walking hand in hand towards a palace gateway lined with flowers and candles at dusk", focal: { x: 50, y: 86 } },
  "3ZISmV72cbM": { alt: "A groom in an orange safa touches foreheads with his bride in a golden dupatta", focal: { x: 50, y: 40 } },
  "VPwSJhu5uhs": { alt: "Portrait of the bride in a red veil and gold jewellery, smiling among red roses", focal: { x: 50, y: 38 } },
  "mab4JkLEe80": { alt: "Portrait of the groom in a white sherwani and turban", focal: { x: 50, y: 33 } },
  "7O422yG_b80": { alt: "A couple seated under a floral mandap during the wedding ceremony", focal: { x: 50, y: 55 } },
  "BEdxXAiRfRM": { alt: "A grand ballroom with a flower-covered mandap and glowing chandeliers", focal: { x: 50, y: 55 } },
  "IFCN-tBVNPI": { alt: "The groom during haldi, showered with marigold petals", focal: { x: 50, y: 35 } },
  "SUwPo4ErQCc": { alt: "Two hands decorated with intricate henna holding each other", focal: { x: 50, y: 50 } },
  "gG5MoExhMnU": { alt: "The groom in a golden sherwani laughing with his family during the baraat", focal: { x: 50, y: 40 } },
  "bWQ6-0c_ZcM": { alt: "Hands with henna and bangles joined with a sacred thread during the ceremony", focal: { x: 50, y: 50 } },
  "lAze38kfdAs": { alt: "Hands joined beside the sacred fire during the pheras", focal: { x: 50, y: 40 } },
  "OQDYhr9HRNo": { alt: "The couple under a glowing floral arch as petals fill the sky", focal: { x: 50, y: 50 } },
  "fVL0zZdk-R4": { alt: "Hands clasped, a golden embroidered lehenga beside a sherwani", focal: { x: 50, y: 40 } },
  "EiGfP6DxgN8": { alt: "An offering of betel leaf and flowers held in henna-decorated hands", focal: { x: 50, y: 50 } },
  "d9RsO9BHFVQ": { alt: "The couple posing under a canopy of golden fairy lights", focal: { x: 50, y: 40 } },
  "SHFOaVaVe2A": { alt: "The couple embracing on a forest path in dappled light", focal: { x: 50, y: 55 } },
  "shqK5G-J-Ac": { alt: "The groom in an embroidered sherwani with his bride in a red dupatta", focal: { x: 50, y: 35 } },
  "NCrvRQdvTx8": { alt: "The couple in traditional attire at night, her dupatta draped over his shoulder", focal: { x: 50, y: 40 } },
  "d-jyMeP6uNQ": { alt: "The couple standing on a rock by a river", focal: { x: 50, y: 50 } },
  "8DItNV005qM": { alt: "The bride seated, the groom standing beside her, both wearing flower garlands", focal: { x: 50, y: 45 } },
  "OzyvCE9a60M": { alt: "The couple holding hands, wearing red flower garlands", focal: { x: 50, y: 40 } },
  "kp7XkkCLnlY": { alt: "The bride and groom standing before an ornate floral backdrop", focal: { x: 50, y: 45 } },
  "M8YKi58QKrM": { alt: "The couple exchanging garlands amid scattered red petals", focal: { x: 50, y: 45 } },
  "ohENjR9w0bk": { alt: "The bride in a pink and red veil with gold jewellery, eyes lowered", focal: { x: 50, y: 40 } },
  "2DZmm6QKFQE": { alt: "The bride in a red and gold lehenga standing in an arched doorway", focal: { x: 50, y: 45 } },
  "Po-nggQqplE": { alt: "The bride in a red and gold outfit with henna on her hands", focal: { x: 50, y: 35 } },
  "ICnMRhxJLYg": { alt: "The groom in a golden sherwani and feathered turban", focal: { x: 50, y: 30 } },
  "Y3QEAct9JT4": { alt: "The couple under a canopy of lights, he in a white sherwani, she in red", focal: { x: 50, y: 45 } },
  "jWBxlyVZ3bg": { alt: "The bride and groom side by side at night in embroidered wedding attire", focal: { x: 50, y: 45 } },
  "DC0d6A2kX0k": { alt: "The couple seen from below beneath a ceiling of jasmine strings", focal: { x: 50, y: 50 } },
  "lKwp3-FQomY": { alt: "A bride’s henna-decorated hand held in the groom’s", focal: { x: 50, y: 50 } },
  // Kerala
  "ZghCtT63KMk": { alt: "The couple in kasavu, wearing green garlands, smiling close together at a temple at dusk", focal: { x: 48, y: 54 } },
  "Zx9In5UiU0w": { alt: "The couple laughing together, she holding a lotus, he in a mundu", focal: { x: 55, y: 58 } },
  "b9xLrj7w2AY": { alt: "The couple walking together, garlanded, he in a mundu, she in a red saree", focal: { x: 50, y: 55 } },
  "VJP7K4uihUA": { alt: "A family in cream kasavu embracing the bride at a railway platform", focal: { x: 50, y: 45 } },
  "Rm9DL9DmGi4": { alt: "Portrait of the bride in a gold and red silk saree by the sea", focal: { x: 50, y: 32 } },
  "gXWVyFpRCRU": { alt: "Portrait of the groom in a white sherwani against a green wall", focal: { x: 50, y: 30 } },
  "UX3-_dGbCzk": { alt: "A golden stage under a banyan tree strung with hanging marigold garlands, lit at dusk", focal: { x: 50, y: 70 } },
  "SiMzEeMrX2E": { alt: "A father and his young child wearing flower garlands, touching foreheads", focal: { x: 50, y: 40 } },
  "rjgFxE3eARQ": { alt: "The bride in a pink and gold kanjivaram saree among yellow blossoms", focal: { x: 50, y: 40 } },
  "lj6_-FoCHng": { alt: "The couple beside a vintage car outside an old church", focal: { x: 50, y: 50 } },
  "ykcXm_u84sg": { alt: "The couple exchanging rings amid falling petals", focal: { x: 50, y: 50 } },
  "Xqa_NWl4xEY": { alt: "The bride in a bright saree and gold jewellery between two trees", focal: { x: 50, y: 35 } },
  "0mYmjAkmScE": { alt: "An ornate arched hall with chandeliers, ready for the ceremony", focal: { x: 50, y: 55 } },
  // Christian (church wedding)
  "Iv3yJpmOmZc": { alt: "The bride and groom walking out of the church between guests holding sparklers, smiling", focal: { x: 47, y: 45 } },
  "c9gbbHY_8RU": { alt: "The bride smiling up at her groom, holding a bouquet of cream roses", focal: { x: 49, y: 46 } },
  "SrWVeL5DyNM": { alt: "The couple kneeling at the altar during the wedding service", focal: { x: 50, y: 60 } },
  "zyguVcuzeGM": { alt: "A cathedral aisle dressed with white flowers and tulle", focal: { x: 50, y: 55 } },
  "7enPZgey7vE": { alt: "A red carpet leading down the aisle of a church", focal: { x: 50, y: 55 } },
  "9ceNKX2ZlT0": { alt: "Two wedding rings resting on an open book", focal: { x: 50, y: 50 } },
  "RJDWzHyh6gE": { alt: "The ring is placed on the bride’s finger during the blessing", focal: { x: 50, y: 50 } },
  "ozOQglKbMuE": { alt: "The couple kneeling before the priest during the ceremony", focal: { x: 50, y: 55 } },
  "nKJzYDP10Zw": { alt: "The couple kneeling at the altar as the priest raises the Eucharist", focal: { x: 50, y: 55 } },
  "6bFp65WVrL8": { alt: "Newlyweds showered with petals as they leave the church", focal: { x: 50, y: 45 } },
  "pyd736FSNvk": { alt: "A wedding reception dinner in a grand hall, guests seated at long tables", focal: { x: 50, y: 50 } },
  "coWejNeBFhE": { alt: "The bride and groom at the altar of a church", focal: { x: 50, y: 55 } },
  "fPFoUSKZGts": { alt: "The bride walking down the aisle with her father", focal: { x: 50, y: 50 } },
  "YyvpmN6PB3I": { alt: "A black-and-white view down the aisle as the couple stand at the altar", focal: { x: 50, y: 50 } },
  "6pUz0KMMCX4": { alt: "The bride in a veil beside the groom, flowers glowing in candlelight", focal: { x: 55, y: 40 } },
  "KiU1Du5pONA": { alt: "The couple embracing on a cobbled street beside an old church wall", focal: { x: 80, y: 50 } },
  "q9GlHcaaSn4": { alt: "The couple walking towards an ornate church at dusk", focal: { x: 50, y: 60 } },
  "G5a1RNy55pw": { alt: "A stained-glass window above a chapel overlooking the sea", focal: { x: 50, y: 40 } },
  "GAFpZ63GEYs": { alt: "The groom holding the bride’s hand, her lace gown and bouquet beside him", focal: { x: 50, y: 50 } },
  "h-Q955luWLI": { alt: "A white wedding gown and bouquet in front of the church pews", focal: { x: 50, y: 50 } },
  "QPL_171Kf5Q": { alt: "A white church with tall spires against a deep blue sky", focal: { x: 50, y: 40 } },
  "ouh94xUqOHk": { alt: "A Kerala church with a tall façade and red steps under a blue sky", focal: { x: 50, y: 50 } },
  "YeJWDWeIZho": { alt: "Two gold rings resting on a page that defines marriage", focal: { x: 50, y: 50 } },
  // Muslim (nikah)
  "l6BafhpDlZM": { alt: "The groom in a cream sherwani and the bride in a red and gold lehenga seated together", focal: { x: 50, y: 40 } },
  "1iuFKizvxQo": { alt: "The bride in a hijab and the groom embracing against an old stone wall", focal: { x: 50, y: 32 } },
  "21NahBnXWxI": { alt: "The bride in a green hijab and yellow outfit smiling, henna on her hands", focal: { x: 50, y: 22 } },
  "_fb7LvFNJ4k": { alt: "The groom in a turban kisses the bride’s forehead, she in a red dupatta", focal: { x: 34, y: 22 } },
  "ryOiannoQ3g": { alt: "The nikahnama being signed, henna-decorated hands beside it", focal: { x: 50, y: 50 } },
  "gfVofr15ICc": { alt: "Women showing hands decorated with intricate black henna patterns", focal: { x: 50, y: 50 } },
  "jt2iZ0ARWoY": { alt: "Two rings in a red box resting on the grass", focal: { x: 50, y: 60 } },
  "t8zrGJlSb0M": { alt: "The couple holding hands at the doorway of an old stone building", focal: { x: 50, y: 60 } },
  "464ps_nOflw": { alt: "The couple holding hands, their shadows on the grass", focal: { x: 50, y: 50 } },
  "9Lq0zlOu_dw": { alt: "The newlyweds in white holding their marriage books", focal: { x: 50, y: 45 } },
  "_G7UyLmY1tc": { alt: "The bride in a white gown, veil and jasmine headpiece", focal: { x: 50, y: 25 } },
  "EcERopBq9dg": { alt: "The bride touching the groom’s hand to her forehead in respect", focal: { x: 50, y: 50 } },
  "XYwHswmjjVs": { alt: "The bride in white lace and jasmine, hands together in prayer", focal: { x: 50, y: 30 } },
  "0QL68R5wGRU": { alt: "The bride’s henna-decorated hands pressed together in a quiet prayer", focal: { x: 50, y: 30 } },
  "-4xe-LfXbDs": { alt: "The bride in a red and gold embroidered dupatta, seen in profile", focal: { x: 50, y: 25 } },
  "AGcM0IujgBU": { alt: "The bride in red and gold, her henna-decorated hands at her face", focal: { x: 50, y: 30 } },
  "_tWvgxrO14M": { alt: "The bride in a beaded ivory gown and dupatta at sunset", focal: { x: 50, y: 25 } },
  "Lk4Au3jIqcY": { alt: "The bride in a maroon and gold bridal gown in a hall of chandeliers", focal: { x: 50, y: 25 } },
  "mb-qgRDcz-s": { alt: "The bride lifting a sheer orange and pink veil", focal: { x: 50, y: 30 } },
  "JY0El1DESkw": { alt: "A heart embroidered on the bride’s sleeve", focal: { x: 50, y: 50 } },
  "cRyUjYf6VBQ": { alt: "The couple standing back to back on a hilltop at dusk", focal: { x: 50, y: 45 } },
  "kdYjB1fsyqw": { alt: "The bride in a beige abaya and tiara in prayer with her family", focal: { x: 50, y: 40 } },
  "A--OZVONuGE": { alt: "Gold embroidery on the groom’s sherwani beside the bride’s henna-decorated hand", focal: { x: 50, y: 50 } },
  "2uWUf5K-INY": { alt: "The bride in a white gown and ornate headpiece in a flower-filled hall", focal: { x: 50, y: 35 } },
  "IiGkUvXXbig": { alt: "A smiling bride in white with a bouquet", focal: { x: 50, y: 28 } },
};
