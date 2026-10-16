import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listGiftsForAdmin, giftPublicUrl, giftRef } from "@/domain/gifts/service";
import { Ledger, PageHeader } from "@/components/ui/Bits";
import { GiftsManager } from "./GiftsManager";

export const metadata: Metadata = { title: "Love gifts" };
export const dynamic = "force-dynamic";

/**
 * Gifts people have sent to us. Drafts nobody has sent are counted but never listed: a gift is private until its maker
 * hands it over (the promise made on the public site).
 */
export default async function GiftsPage() {
  const admin = await requireAdminPage("/admin/gifts");
  const all = await listGiftsForAdmin(admin);
  const sent = all.filter((g) => g.gift.state !== "DRAFT");
  const count = (s: string) => all.filter((g) => g.gift.state === s).length;
  return (
    <>
      <PageHeader eyebrow="Studio" title="Love gifts" lede="Gifts made on the public site. Publish one once you and the maker have agreed, and its private link goes live. Their words and photographs are theirs: open a gift only to publish it." />
      <Ledger className="mb-8" items={[
        { label: "Waiting to publish", value: count("SUBMITTED") },
        { label: "Live", value: count("LIVE") },
        { label: "Paused", value: count("PAUSED") },
        { label: "Unsent drafts", value: count("DRAFT"), note: "deleted after 14 days" },
      ]} />
      <GiftsManager rows={sent.map((g) => ({
        id: g.gift.id,
        ref: giftRef(g.gift.id),
        state: g.gift.state as "SUBMITTED" | "LIVE" | "PAUSED",
        name: g.gift.contactName,
        phone: g.gift.contactPhone,
        occasion: g.doc.love.occasion,
        experience: g.doc.love.experience,
        url: g.gift.state === "SUBMITTED" ? null : giftPublicUrl(g.slug),
      }))} />
    </>
  );
}
