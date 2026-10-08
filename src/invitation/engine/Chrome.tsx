"use client";
import { useEffect, useState } from "react";
import { Copy, Languages, MessageCircle, Share2, Volume2, VolumeX, QrCode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { localeInfo } from "@/domain/doc/constants";
import { useInvitation } from "./context";
import { InvDialog } from "./Dialog";
import { Qr } from "./qr";
import { whatsappHref } from "./format";

/** Floating controls: music, language, share, sticky RSVP. Dark frosted glass, so they read over a photograph and over paper alike. */
const pill = "inv-glass grid place-items-center transition-transform hover:-translate-y-0.5 active:translate-y-0";

export function LanguageToggle() {
  const { view, locale, setLocale, multilingual, t } = useInvitation();
  if (!multilingual || !view.wedding.secondaryLocale) return null;
  const sec = view.wedding.secondaryLocale;
  const def = view.wedding.defaultLocale;
  const on = (l: string) => locale === l;
  return (
    <div role="group" aria-label={t("common.language")} className="inv-glass flex overflow-hidden rounded-full text-[0.78rem] font-medium">
      {[def, sec].map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={on(l)} onClick={() => setLocale(l)} className={cn("min-h-11 min-w-11 px-3.5 transition-colors", on(l) ? "bg-white/90 text-[#1c1a17]" : "text-white/80 hover:text-white")}>
          {l === def ? (def === "en" ? "EN" : localeInfo(def)?.native ?? def.toUpperCase()) : localeInfo(l)?.native ?? l.toUpperCase()}
        </button>
      ))}
      <span className="sr-only"><Languages /></span>
    </div>
  );
}

/**
 * "♪ Music" — three honest states: off (never started), playing, paused. Music never starts on its own;
 * it begins only from the guest's tap on the opening screen or on this control.
 */
export function MusicPill() {
  const { music, t, entered } = useInvitation();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (music.playing) setStarted(true);
  }, [music.playing]);
  if (!music.ready || !entered) return null;
  const state = music.playing ? "playing" : started ? "paused" : "off";
  const status = state === "playing" ? t("music.playingNow") : state === "paused" ? t("music.paused") : t("music.off");
  return (
    <div className="fixed left-3 top-3 z-40 flex items-center gap-2 md:left-6 md:top-5">
      <button type="button" onClick={music.toggle} aria-pressed={music.playing} aria-label={music.playing ? t("music.pause") : t("music.play")} data-state={state} className="inv-glass music-pill">
        <span className="music-glyph" aria-hidden>
          {music.playing ? (
            <span className="flex h-3.5 items-end gap-[2.5px]">
              {[0, 1, 2, 3].map((i) => (<span key={i} className="w-[2.5px] rounded-full bg-current" style={{ height: "100%", animation: `eq 1s ease-in-out ${i * 0.15}s infinite alternate` }} />))}
            </span>
          ) : (
            <span className="music-note">♪</span>
          )}
        </span>
        <span className="music-text"><span className="music-label">{t("music.label")}</span><span className="music-status">{status}</span></span>
      </button>
      {music.playing && (
        <button type="button" onClick={music.toggleMute} aria-label={music.muted ? t("music.unmute") : t("music.mute")} className={cn(pill, "size-10 rounded-full")}>
          {music.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      )}
      <style>{`@keyframes eq { from { transform: scaleY(.25); } to { transform: scaleY(1); } } @media (prefers-reduced-motion: reduce) { [style*="eq "] { animation: none !important; } }`}</style>
    </div>
  );
}

export function StickyRsvp() {
  const { view, t, entered, journeyTogether } = useInvitation();
  const [visible, setVisible] = useState(false);
  const has = view.sections.some((s) => s.type === "rsvp");
  const replied = !!view.guest?.rsvp;
  useEffect(() => {
    if (!has || !entered) return;
    const target = document.getElementById("s-rsvp");
    const hero = document.getElementById("s-hero");
    if (!target) return;
    let inRsvp = false;
    let pastHero = false;
    const upd = () => setVisible(pastHero && !inRsvp);
    const a = new IntersectionObserver(([e]) => { inRsvp = e.isIntersecting; upd(); }, { threshold: 0.05 });
    const b = new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; upd(); }, { threshold: 0.2 });
    a.observe(target);
    if (hero) b.observe(hero); else { pastHero = true; upd(); }
    return () => { a.disconnect(); b.disconnect(); };
  }, [has, entered]);
  if (!has || replied) return null;
  return (
    <a href="#s-rsvp" className={cn("fixed bottom-[6.6rem] left-1/2 z-40 -translate-x-1/2 transition-all duration-500 md:hidden", visible && !journeyTogether ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0")}>
      <span className="inv-btn !rounded-full shadow-[0_14px_30px_-12px_rgba(0,0,0,.55)]">{t("nav.rsvp")}</span>
    </a>
  );
}

export function TopControls() {
  const { openShare, entered, t } = useInvitation();
  if (!entered) return null;
  return (
    <div className="fixed right-3 top-3 z-40 flex items-center gap-2 md:right-6 md:top-5">
      <LanguageToggle />
      <button type="button" onClick={openShare} aria-label={t("share.title")} className={cn(pill, "size-11 rounded-full")}><Share2 className="size-[1.05rem]" /></button>
    </div>
  );
}

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { view, t, has, post, isPreview } = useInvitation();
  const [showQr, setShowQr] = useState(false);
  const url = view.urls.canonical; // the PUBLIC link — a guest's personal link is never forwarded
  const message = t("share.message", { title: view.wedding.title });
  const track = () => !isPreview && void post("/track", { visitorId: "share", type: "share" }).catch(() => undefined);
  const native = typeof navigator !== "undefined" && !!navigator.share;
  return (
    <InvDialog open={open} onClose={onClose} title={t("share.title")}>
      <div className="space-y-3">
        {has("whatsapp_share") && (
          <a href={whatsappHref("", `${message}\n${url}`).replace("wa.me//", "wa.me/")} target="_blank" rel="noopener noreferrer" onClick={track} className="inv-btn w-full"><MessageCircle className="size-4" /> {t("share.whatsapp")}</a>
        )}
        {native && <button type="button" className="inv-btn inv-btn-ghost w-full" onClick={() => { track(); void navigator.share({ title: view.wedding.title, text: message, url }).catch(() => undefined); }}><Share2 className="size-4" /> {t("share.native")}</button>}
        <button type="button" className="inv-btn inv-btn-ghost w-full" onClick={() => { void navigator.clipboard?.writeText(url); toast.success(t("share.copied")); track(); }}><Copy className="size-4" /> {t("share.copy")}</button>
        <button type="button" className="inv-btn inv-btn-ghost w-full" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}><QrCode className="size-4" /> {t("share.qr")}</button>
        {showQr && <div className="grid place-items-center pt-2"><Qr text={url} size={220} className="rounded bg-white p-2" label={t("share.qr")} /></div>}
      </div>
    </InvDialog>
  );
}
