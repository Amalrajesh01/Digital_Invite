"use client";
import "./styles/invitation.css";
import "./sections/sections.css";
import { useEffect, useState } from "react";
import type { InvitationView } from "@/domain/wedding/public";
import { brand } from "@/lib/brand";
import { InvitationProvider, useInvitation } from "./engine/context";
import { SectionRenderer, getVisitorId } from "./engine/SectionRenderer";
import { ShareDialog, MusicPill, StickyRsvp, TopControls } from "./engine/Chrome";
import { themeFontHref, themeStyle } from "./engine/theme";
import { Gate } from "./opening/Gate";
import { Divider } from "./engine/Ornament";

function Footer() {
  const { view, t, L } = useInvitation();
  const tag = view.doc.couple.hashtag;
  return (
    <footer className="inv-night px-5 py-16 text-center">
      <Divider kind={view.tokens.divider} />
      <p className="inv-script mt-2 text-[clamp(2rem,8vw,3rem)] text-[var(--c-accent)]">{view.wedding.title || L(view.doc.couple.tagline)}</p>
      {tag && <p className="inv-eyebrow mt-4 !text-[var(--c-on-inverse)] opacity-80">#{tag.replace(/^#/, "")}</p>}
      <p className="mt-10 text-[0.78rem] opacity-60">{t("footer.made")} · {t("footer.powered", { brand: brand.short })}</p>
    </footer>
  );
}

function Inner({ skipGate }: { skipGate?: boolean }) {
  const { view, locale, post, isPreview, entered } = useInvitation();
  const tk = view.tokens;
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
      <main id="main">
        {view.sections.map((s) => (
          <SectionRenderer key={s.id} section={s} />
        ))}
      </main>
      <Footer />
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
