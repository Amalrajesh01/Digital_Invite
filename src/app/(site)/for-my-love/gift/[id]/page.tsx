import type { Metadata } from "next";
import { GiftManage } from "@/components/gift/GiftManage";

export const metadata: Metadata = { title: "Your gift", robots: { index: false, follow: false, noarchive: true }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function GiftPage({ params }: { params: Promise<{ id: string }> }) {
  return <GiftManage id={(await params).id} />;
}
