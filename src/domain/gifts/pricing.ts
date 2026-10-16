/**
 * What a love gift costs, if the studio has set it. The gift is sold outside the three invitation packages, so its
 * price is a single setting (GIFT_PRICE_INR); when it is not set the site says the price is shared on WhatsApp
 * rather than inventing one.
 */
export function giftPriceText(): string | null {
  const n = Number(process.env.GIFT_PRICE_INR);
  return Number.isFinite(n) && n > 0 ? `₹${n.toLocaleString("en-IN")}` : null;
}
