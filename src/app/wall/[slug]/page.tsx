import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadWallAccess, wallItems } from "@/domain/live/wall";
import { themeFontHref, themeStyle } from "@/invitation/engine/theme";
import { publicUrl } from "@/domain/guests/service";
import { WallScreen } from "./WallScreen";

export const metadata: Metadata = { title: "Live photo wall", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Full-screen slideshow for a projector or TV at the venue. */
export default async function WallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snap = await loadWallAccess(slug);
  if (!snap) notFound();
  const items = await wallItems(snap.wedding.id);
  const fonts = themeFontHref(snap.meta.tokens, null);
  return (
    <div style={themeStyle(snap.meta.tokens, null)}>
      {fonts && <link rel="stylesheet" href={fonts} />}
      <WallScreen slug={slug} title={snap.wedding.title} inviteUrl={publicUrl(slug)} initial={items.map((i) => ({ id: i.id, url: i.url, by: i.by, approvedAt: i.approvedAt, width: i.width ?? null, height: i.height ?? null }))} />
    </div>
  );
}
