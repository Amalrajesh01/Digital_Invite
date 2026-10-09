/**
 * Real photographs for the demonstration weddings.
 *
 * The files live in assets/stock/ (resized from Unsplash originals — see CREDITS.md there for the
 * photographer and licence of every picture). The seed uploads them through the normal media pipeline, exactly
 * as a customer's own photographs would be, so nothing is hot-linked and nothing can break at runtime.
 * If a file is ever missing the seed falls back to the procedural illustrations in art.ts.
 * The alt text and focal point of every picture is in src/domain/imagery/stock.ts.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export { STOCK, type StockInfo } from "../../src/domain/imagery/stock";

const DIR = path.join(process.cwd(), "assets", "stock");

export function stockPhoto(id: string): Buffer | null {
  const file = path.join(DIR, `${id}.jpg`);
  return existsSync(file) ? readFileSync(file) : null;
}
