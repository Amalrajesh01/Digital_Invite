import type { Metadata } from "next";
import { GiftBuilder } from "@/components/gift/GiftBuilder";
import { giftPriceText } from "@/domain/gifts/pricing";
import { availableTags } from "@/domain/letters";
import { listPublicLetters } from "@/domain/letters/service";

export const metadata: Metadata = { title: "Make a gift", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MakeGift({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const cards = await listPublicLetters();
  const q = (await searchParams).letter;
  return <GiftBuilder priceText={giftPriceText()} letters={cards} tags={availableTags(cards)} initialLetter={cards.some((c) => c.slug === q) ? q : undefined} />;
}
