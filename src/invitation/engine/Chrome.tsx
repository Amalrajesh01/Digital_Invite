"use client";
import { useEffect, useState } from "react";
import { Copy, Languages, MessageCircle, Pause, Play, Share2, Volume2, VolumeX, QrCode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { localeInfo } from "@/domain/doc/constants";
import { useInvitation } from "./context";
import { InvDialog } from "./Dialog";
import { Qr } from "./qr";
import { whatsappHref } from "./format";

/** Floating controls: language switch, share, music, sticky RSVP. Solid, quiet, thumb-reachable. */
const pill = "grid place-items-center border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] shadow-[0_6px_20px_-10px_rgba(0,0,0,.4)] transition-transform hover:-translate-y-0.5 active:translate-y-0";

export function LanguageToggle() {
  const { view, locale, setLocale, multilingual, t } = useInvitation();
  if (!multilingual || !view.wedding.secondaryLocale) return null;
  const sec = view.wedding.secondaryLocale;
  const def = view.wedding.defaultLocale;
  const on = (l: string) => locale === l;
  return (
    <div role="group" aria-label={t("common.language")} className="flex overflow-hidden rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] text-[0.78rem] font-medium shadow-[0_6px_20px_-10px_rgba(0,0,0,.4)]">
      {[def, sec].map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={on(l)} onClick={() => setLocale(l)} className={cn("min-h-11 min-w-11 px-3.5 transition-colors", on(l) ? "bg-[var(--c-primary)] text-[var(--c-on-primary)]" : "text-[var(--c-muted)] hover:text-[var(--c-text)]")}>
          {l === def ? (def === "en" ? "EN" : localeInfo(def)?.native ?? def.toUpperCase()) : localeInfo(l)?.native ?? l.toUpperCase()}
        </button>
      ))}
      <span className="sr-only"><Languages /></span>
    </div>
  );
}

export function MusicPill() {
  const { music, t, entered } = useInvitation();
  if (!music.ready || !entered) return null;
  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 md:bottom-6 md:left-6">
      <button type="button" onClick={music.toggle} aria-pressed={music.playing} aria-label={music.playing ? t("music.pause") : t("music.play")} className={cn(pill, "size-12 rounded-full")}>
        {music.playing ? (
          <span className="flex h-4 items-end gap-[3px]" aria-hidden>
            {[0, 1, 2].map((i) => (<span key={i} className="w-[3px] rounded-full bg-[var(--c-primary)]" style={{ height: "100%", animation: `eq 1s ease-in-out ${i * 0.18}s infinite alternate` }} />))}
          </span>
        ) : (<Play className="size-4 translate-x-px" />)}
      </button>
      {music.playing && (
        <button type="button" onClick={music.toggleMute} aria-label={music.muted ? t("music.unmute") : t("music.mute")} className={cn(pill, "size-10 rounded-full")}>
          {music.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      )}
      {music.playing && music.current && (
        <span className="hidden max-w-[14rem] truncate rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-[0.8rem] text-[var(--c-muted)] md:block">{music.current.title}{music.current.artist ? ` · ${music.current.artist}` : ""}</span>
      )}
      <style>{`@keyframes eq { from { transform: scaleY(.25); } to { transform: scaleY(1); } } @media (prefers-reduced-motion: reduce) { [style*="eq "] { animation: none !important; } }`}</style>
      {false && <Pause />}
    </div>
  );
}

export function StickyRsvp() {
  const { view, t, entered } = useInvitation();
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
    <a href="#s-rsvp" className={cn("fixed bottom-5 left-1/2 z-40 -translate-x-1/2 transition-all duration-500 md:hidden", visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0")}>
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
