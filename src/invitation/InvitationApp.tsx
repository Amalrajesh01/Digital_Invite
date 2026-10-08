"use client";
import "./styles/invitation.css";
import "./sections/sections.css";
import "./sections/cinematic.css";
import "./sections/spreads.css";
import { useEffect, useState } from "react";
import type { InvitationView } from "@/domain/wedding/public";
import { brand } from "@/lib/brand";
import { InvitationProvider, useInvitation } from "./engine/context";
import { SectionRenderer, getVisitorId } from "./engine/SectionRenderer";
import { ShareDialog, MusicPill, StickyRsvp, TopControls } from "./engine/Chrome";
import { themeFontHref, themeStyle } from "./engine/theme";
import { Gate, useCoupleNames } from "./opening/Gate";
import { Divider } from "./engine/Ornament";
import { Celebration } from "./engine/Celebration";
import { Journey, useHeads } from "./engine/Journey";
import { ChatCta } from "./engine/Chat";
import { isSerif } from "@/domain/design/tokens";
import { journeyEnabled } from "@/domain/doc/event-types";

function Footer() {
  const { view, t, journeyTogether } = useInvitation();
  const names = useCoupleNames();
  const tag = view.doc.couple.hashtag;
  const couple = journeyEnabled(view.doc);
  return (
    <footer className="inv-night inv-footer" data-together={journeyTogether}>
      <div className="inv-wrap-narrow text-center">
        <Divider kind={view.tokens.divider} />
        <p className="inv-eyebrow mt-2">{t("footer.closing")}</p>
        <p className="inv-script mt-4 text-[clamp(2.4rem,9vw,4.2rem)] leading-[1.05] text-[var(--c-on-inverse)]">{names.joined}</p>
        {tag && <p className="inv-eyebrow mt-5 !text-[var(--c-accent)]">#{tag.replace(/^#/, "")}</p>}
        <ChatCta tone="light" hint className="mt-12" />
        <p className="mt-12 text-[0.74rem] tracking-wide opacity-55">{t("footer.made")} · {t("footer.powered", { brand: brand.short })}</p>
      </div>
      {/* room for the two figures to stand in, and the line that appears when they meet */}
      <div className="inv-footer-stage" aria-hidden={!couple}>
        {couple && <p className="inv-footer-caption">{t("journey.together")}</p>}
      </div>
    </footer>
  );
}

function Inner({ skipGate }: { skipGate?: boolean }) {
  const { view, locale, post, isPreview, entered } = useInvitation();
  const tk = view.tokens;
  const heads = useHeads();
  const href = themeFontHref(tk, view.wedding.secondaryLocale);

  // one anonymous page-view event per visit (random per-browser id, no IP, no fingerprint)
  useEffect(() => {
    if (isPreview) return;
    const device = window.matchMedia("(max-width: 767px)").matches ? "mobile" : window.matchMedia("(max-width: 1100px)").matches ? "tablet" : "desktop";
    void post("/track", { visitorId: getVisitorId(), type: "view", device }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="inv"
      lang={locale}
      data-locale={locale}
      data-grain={tk.grain}
      data-serif={isSerif(tk.fonts.heading)}
      data-event={view.doc.eventType}
      data-heads={!!heads.bride && journeyEnabled(view.doc)}
      data-dark={tk.dark}
      data-button={tk.button}
      data-card={tk.card}
      data-decor={tk.decor}
      data-flavor={view.flavor}
      data-status={view.wedding.status}
      data-entered={entered}
      style={themeStyle(tk, view.wedding.secondaryLocale)}
    >
      {href && <link rel="stylesheet" href={href} precedence="default" />}
      <Gate skip={skipGate} />
      <Celebration />
      <main id="main">
        {view.sections.map((s) => (
          <SectionRenderer key={s.id} section={s} />
        ))}
      </main>
      <Footer />
      <Journey />
      <TopControls />
      <MusicPill />
      <StickyRsvp />
    </div>
  );
}

export function InvitationApp({ view, initialLocale, skipGate }: { view: InvitationView; initialLocale: string; skipGate?: boolean }) {
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <InvitationProvider view={view} initialLocale={initialLocale} onOpenShare={() => setShareOpen(true)}>
      <Inner skipGate={skipGate} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
    </InvitationProvider>
  );
}
