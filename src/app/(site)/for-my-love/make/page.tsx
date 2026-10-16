import type { Metadata } from "next";
import { GiftBuilder } from "@/components/gift/GiftBuilder";
import { giftPriceText } from "@/domain/gifts/pricing";

export const metadata: Metadata = { title: "Make a gift", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function MakeGift() {
  return <GiftBuilder priceText={giftPriceText()} />;
}
