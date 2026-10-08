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
  "VPwSJhu5uhs": { alt: "Portrait of the bride in a red veil and gold jewellery, smiling among red roses", focal: { x: 50, y: 34 } },
  "mab4JkLEe80": { alt: "Portrait of the groom in a white sherwani and turban", focal: { x: 50, y: 30 } },
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
};
