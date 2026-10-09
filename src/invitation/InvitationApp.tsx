"use client";
import "./styles/invitation.css";
import "./sections/sections.css";
import "./sections/cinematic.css";
import "./sections/spreads.css";
import "./sections/occasion.css";
import { useEffect, useState } from "react";
import type { InvitationView } from "@/domain/wedding/public";
import { brand } from "@/lib/brand";
import { InvitationProvider, useInvitation } from "./engine/context";
import { SectionRenderer, getVisitorId } from "./engine/SectionRenderer";
import { ShareDialog, MusicPill, StickyRsvp, TopControls } from "./engine/Chrome";
import { themeFontHref, themeStyle } from "./engine/theme";
import { Gate } from "./opening/Gate";
import { useSubject } from "./engine/subject";
import { Divider } from "./engine/Ornament";
import { Celebration } from "./engine/Celebration";
import { Journey, useHeads } from "./engine/Journey";
import { ChatCta } from "./engine/Chat";
import { isSerif } from "@/domain/design/tokens";
import { EVENT_TYPE_INFO, journeyEnabled } from "@/domain/doc/event-types";
import { enquiryLink } from "@/lib/whatsapp";

/**
 * The signature under every invitation: a quiet line of attribution and one honest invitation of our own —
 * worded for the occasion ("Plan My Wedding Invitation", "Create Event Invitation", "Talk to Our Team").
 * It is deliberately small, set in the footer's own colours, and never competes with the host's message.
 */
function BrandSign() {
  const { view, t, locale, isPreview } = useInvitation();
  const info = EVENT_TYPE_INFO[view.doc.eventType];
  const label = locale === "en" ? info.cta : t("footer.cta");
  return (
    <div className="inv-brand" data-tone={info.tone}>
      <p className="inv-brand-love">
        {t("footer.made")}
        <svg viewBox="0 0 24 24" width="0.95em" height="0.95em" aria-hidden className="inv-brand-heart"><path d="M12 21.2S4.6 16.4 2.7 11.3A5.5 5.5 0 0 1 12 6.4a5.5 5.5 0 0 1 9.3 4.9C19.4 16.4 12 21.2 12 21.2Z" fill="currentColor" /></svg>
      </p>
      <p className="inv-brand-by">
        <a href={brand.companyUrl} target="_blank" rel="noopener noreferrer">{t("footer.powered", { brand: brand.company })}</a>
      </p>
      <a className="inv-brand-cta" data-cta="brand" href={enquiryLink(view.doc.eventType)} target="_blank" rel="noopener noreferrer" onClick={(e) => isPreview && e.preventDefault()}>
        {label} <span aria-hidden>→</span>
      </a>
      {view.wedding.isDemo && <p className="inv-brand-sample">{t("footer.sample")}</p>}
    </div>
  );
}

function Footer() {
  const { view, t, journeyTogether } = useInvitation();
  const names = useSubject();
  const tag = view.doc.couple.hashtag;
  const couple = journeyEnabled(view.doc);
  return (
    <footer className="inv-night inv-footer" data-together={journeyTogether}>
      <div className="inv-wrap-narrow text-center">
        <Divider kind={view.tokens.divider} />
        <p className="inv-eyebrow mt-2">{t("footer.closing")}</p>
        <p className="inv-script inv-footer-name mt-4 leading-[1.05] text-[var(--c-on-inverse)]" data-len={names.joined.length > 24 ? "long" : names.joined.length > 14 ? "medium" : "short"}>{names.joined}</p>
        {names.isCouple && tag && <p className="inv-eyebrow mt-5 !text-[var(--c-accent)]">#{tag.replace(/^#/, "")}</p>}
        {!names.isCouple && names.hosts && <p className="inv-muted mt-4 text-[0.95rem]">{t("hero.hostedBy", { hosts: names.hosts })}</p>}
        <ChatCta tone="light" hint className="mt-12" />
        <BrandSign />
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
      data-tone={EVENT_TYPE_INFO[view.doc.eventType].tone}
      data-heads={!!heads.bride && journeyEnabled(view.doc)}
      data-dark={tk.dark}
      data-button={tk.button}
      data-card={tk.card}
      data-decor={tk.decor}
      data-flavor={view.flavor}
      data-status={view.wedding.status}
      data-entered={entered}
      style={themeStyle(tk, view.wedding.secondaryLocale, EVENT_TYPE_INFO[view.doc.eventType].tone)}
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
