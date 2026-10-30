import { ImageResponse } from "next/og";
import { getEntitlements } from "@/domain/packages/service";
import { canUse } from "@/domain/packages/entitlements";
import { resolveGuestContext } from "@/domain/guests/context";
import { coupleNames } from "@/domain/guests/service";
import { firstNameOf } from "@/domain/guests/personalize";
import { isCoupleEvent } from "@/domain/doc/event-types";
import { getWeddingBySlug, loadPublishedSnapshot } from "@/domain/wedding/snapshot";
import { fmtDate } from "@/invitation/engine/format";

export const dynamic = "force-dynamic";

/**
 * The picture WhatsApp shows when a guest's personal link is pasted: "Priya, you are invited to the wedding of Meenakshi &
 * Aravind", in the invitation's own colours. It is made for the one guest whose unguessable link this is (so a wrong or
 * revoked token, an unpublished invitation or a package without personal touches all answer 404), shows the first name only,
 * and is drawn in Latin letters: the card carries no Malayalam, the page title and the invitation itself do.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const wedding = await getWeddingBySlug(slug);
  const snap = wedding ? await loadPublishedSnapshot(wedding) : null;
  const guest = snap ? await resolveGuestContext(slug, token) : null;
  if (!wedding || !snap || !guest || !canUse(await getEntitlements(wedding.id), "personal_touch")) return new Response("Not found", { status: 404 });

  const c = snap.meta.tokens.colors;
  const couple = isCoupleEvent(snap.doc);
  const { a, b } = coupleNames(snap.doc, "en");
  const headline = couple ? `${a} & ${b}` : snap.meta.title || wedding.title;
  const date = snap.doc.events.find((e) => e.isMain)?.date || snap.meta.weddingDate || "";
  const first = firstNameOf(guest.name);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: c.inverse, color: c.onInverse, padding: 28 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", border: `2px solid ${c.accent}`, padding: 40 }}>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, textTransform: "uppercase", color: c.accent }}>You are invited</div>
          <div style={{ display: "flex", fontSize: first.length > 14 ? 84 : 112, marginTop: 22, lineHeight: 1.05 }}>{`Dear ${first},`}</div>
          <div style={{ display: "flex", fontSize: 34, marginTop: 26, opacity: 0.85 }}>{couple ? "we would love you to join the wedding of" : "we would love you to join"}</div>
          <div style={{ display: "flex", fontSize: headline.length > 26 ? 56 : 76, marginTop: 14, color: c.accent, lineHeight: 1.1 }}>{headline}</div>
          {date && <div style={{ display: "flex", fontSize: 32, marginTop: 28, letterSpacing: 4, opacity: 0.8 }}>{fmtDate(date, "en", "long")}</div>}
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
