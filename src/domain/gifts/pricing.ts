/**
 * What a love gift costs: one price for every one of the five styles — the studio's entry-level product. It is sold outside
 * the three wedding packages, so it is a single number here rather than a package row. GIFT_PRICE_INR overrides it.
 */
export const GIFT_PRICE_DEFAULT_INR = 499;

export function giftPriceText(): string {
  const n = Number(process.env.GIFT_PRICE_INR);
  return `₹${(Number.isFinite(n) && n > 0 ? n : GIFT_PRICE_DEFAULT_INR).toLocaleString("en-IN")}`;
}
