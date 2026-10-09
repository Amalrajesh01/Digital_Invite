"use client";
import "./gate.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronUp } from "lucide-react";
import { useInvitation } from "../engine/context";
import { fmtDate } from "../engine/format";
import { distanceKm } from "../engine/format";
import { useSubject, type Subject } from "../engine/subject";

type State = "closed" | "opening" | "leaving" | "gone";
const DURATION: Record<string, number> = { envelope: 3000, seal: 1500, cinematic: 250, swipe: 350, curtain: 1600, none: 0 };

function GateMonogram() {
  const s = useSubject();
  if (!s.isCouple) {
    return (
      <svg viewBox="0 0 160 70" className="h-20 w-auto" aria-hidden>
        <text x="80" y="56" textAnchor="middle" fontSize="60" className="mono-stroke" style={{ fontFamily: "var(--f-heading)" }}>{s.initials}</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 70" className="h-20 w-auto" aria-hidden>
      <text x="8" y="56" fontSize="64" className="mono-stroke" style={{ fontFamily: "var(--f-heading)" }}>{s.ia}</text>
      <text x="64" y="46" fontSize="30" style={{ fontFamily: "var(--f-script)", fill: "var(--c-on-inverse)", opacity: 0.85 }}>&amp;</text>
      <text x="92" y="56" fontSize="64" className="mono-stroke" style={{ fontFamily: "var(--f-heading)", animationDelay: "0.6s, 2.6s" }}>{s.ib}</text>
    </svg>
  );
}

/** The wax stamp: bride, groom and the date pressed into the seal — or, for any other occasion, its monogram and the date. */
function SealFace({ subject, date, sealText }: { subject: Subject; date: string; sealText?: string }) {
  const parts = date ? date.split("-").map(Number) : [];
  const short = parts.length === 3 ? `${String(parts[2]).padStart(2, "0")} · ${String(parts[1]).padStart(2, "0")} · ${parts[0]}` : sealText ?? "";
  if (!subject.isCouple) {
    return (
      <div className="disc">
        <span className="wax-name wax-mono">{sealText || subject.initials}</span>
        {short && <span className="wax-date">{short}</span>}
      </div>
    );
  }
  return (
    <div className="disc">
      <span className="wax-name">{subject.a}</span>
      <span className="wax-amp">&amp;</span>
      <span className="wax-name">{subject.b}</span>
      {short && <span className="wax-date">{short}</span>}
    </div>
  );
}

function RollingDate({ date, active, locale }: { date: string; active: boolean; locale: string }) {
  // Digits roll into place when the invitation opens. Shows the plain date for screen readers.
  const label = fmtDate(date, locale, "long");
  const parts = date.split("-").map(Number); // y m d
  const text = `${String(parts[2]).padStart(2, "0")}·${String(parts[1]).padStart(2, "0")}·${parts[0]}`;
  return (
    <div aria-label={label} className="dateroll">
      {text.split("").map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i} className="px-[0.12em] opacity-70">{ch}</span>;
        const n = Number(ch);
        return (
          <span key={i} className="col" aria-hidden>
            <span className="strip" style={{ transform: active ? `translateY(-${n * 1.1}em)` : "translateY(0)", transitionDelay: `${i * 70}ms` }}>
              {Array.from({ length: 10 }).map((_, d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function LocationHint() {
  const { view, t, L } = useInvitation();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const venue = view.doc.venues.find((v) => v.lat != null && v.lng != null);
  if (!venue || !view.doc.opening.locationAware) return null;
  const ask = () => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Computed on the device only — the location is never sent to our servers.
        const km = distanceKm({ lat: pos.coords.latitude, lng: pos.coords.longitude }, { lat: venue.lat!, lng: venue.lng! });
        setMsg(t("location.away", { km }));
        setBusy(false);
      },
      () => setBusy(false),
      { timeout: 8000, maximumAge: 600000 },
    );
  };
  void L;
  return msg ? (
    <p className="max-w-xs text-sm opacity-90" role="status">{msg}</p>
  ) : (
    <button type="button" onClick={ask} disabled={busy} className="gate-skip !opacity-60">{t("location.ask")}</button>
  );
}

export function Gate({ skip }: { skip?: boolean }) {
  const { view, t, L, music, setEntered, reducedMotion, slug, locale, has } = useInvitation();
  const op = view.doc.opening;
  // Every invitation opens with the same realistic wax-sealed envelope; "none" still skips the opening entirely.
  // (The older seal / cinematic / swipe / curtain scenes below are kept but are no longer selected.)
  const variant = (op.variant === "none" ? "none" : "envelope") as typeof op.variant;
  const [state, setState] = useState<State>(variant === "none" || skip ? "gone" : "closed");
  const [seqDone, setSeqDone] = useState(false);
  const primary = useRef<HTMLButtonElement>(null);
  const names = useSubject();
  const guest = view.guest;
  const key = `inv-entered-${slug}`;
  const wantsMusic = music.ready;

  useEffect(() => {
    if (state === "gone") {
      setEntered(true);
      return;
    }
    try {
      if (sessionStorage.getItem(key) === "1" && view.mode === "public") {
        setState("gone");
        setEntered(true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state === "gone") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [state]);

  useEffect(() => {
    if (variant === "cinematic" && state === "closed") {
      const id = setTimeout(() => setSeqDone(true), reducedMotion ? 0 : 6200);
      return () => clearTimeout(id);
    }
  }, [variant, state, reducedMotion]);

  useEffect(() => {
    if (state === "closed") primary.current?.focus({ preventScroll: true });
  }, [state, seqDone]);

  const open = useCallback(
    (withMusic: boolean) => {
      if (state !== "closed") return;
      // Music only ever starts here — inside the guest's own tap.
      if (withMusic && music.ready) music.play();
      setState("opening");
      const wait = reducedMotion ? 0 : DURATION[variant] ?? 800;
      window.setTimeout(() => setState("leaving"), wait);
      window.setTimeout(() => {
        setState("gone");
        setEntered(true);
        try {
          sessionStorage.setItem(key, "1");
        } catch {}
      }, wait + (reducedMotion ? 60 : 1100));
    },
    [state, music, reducedMotion, variant, setEntered, key],
  );

  const greeting = useMemo(() => {
    if (!guest) return null;
    return t("invite.dear", { name: guest.name.split(" ")[0] });
  }, [guest, t]);

  if (state === "gone") return null;
  const isOpening = state !== "closed";
  const mainDate = view.doc.events.find((e) => e.isMain)?.date || view.wedding.weddingDate || "";
  const invited = L(op.invitedLine) || t("gate.invitedTo");
  const seatsText = guest ? (guest.seats > 1 ? t("gate.seats", { n: guest.seats }) : t("gate.seat")) : null;

  const Actions = (
    <div className="gate-actions">
      <button ref={primary} type="button" className="inv-btn" onClick={() => open(wantsMusic)} disabled={isOpening}>
        {variant === "swipe" ? t("gate.enter") : wantsMusic ? t("gate.withMusic") : t("gate.tapToOpen")}
      </button>
      {wantsMusic && (
        <button type="button" className="gate-skip" onClick={() => open(false)} disabled={isOpening}>
          {t("gate.silent")}
        </button>
      )}
      {has("location_opening") && <LocationHint />}
    </div>
  );

  const Header = (
    <>
      {op.showInitials && variant !== "cinematic" && <GateMonogram />}
      <p className="inv-eyebrow !text-[var(--c-accent)]">{invited}</p>
      {greeting && <p className="gate-dear">{greeting}</p>}
    </>
  );

  return (
    <motion.div
      className="gate"
      data-state={state}
      role="dialog"
      aria-modal="true"
      aria-label={invited}
      drag={variant === "swipe" && state === "closed" ? "y" : false}
      dragConstraints={{ top: -600, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -110 || info.velocity.y < -600) open(wantsMusic);
      }}
      animate={variant === "swipe" && isOpening ? { y: "-105%" } : { y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.9, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {variant === "envelope" && (
        <div className="gate-inner">
          <p className="inv-eyebrow !text-[var(--c-accent)]">{invited}</p>
          {greeting && <p className="gate-dear">{greeting}</p>}
          <div className="env" data-open={isOpening} role="button" tabIndex={0} aria-label={t("gate.tapToOpen")} onClick={() => open(wantsMusic)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open(wantsMusic))}>
            <div className="env-back" />
            <div className="env-card">
              {names.isCouple ? (
                <div>
                  <p className="inv-eyebrow" style={{ fontSize: "0.6rem", color: "var(--c-primary)" }}>{t("invite.together")}</p>
                  <p className="mt-2 text-2xl" style={{ fontFamily: "var(--f-heading)" }}>{names.a}</p>
                  <p className="inv-script my-0.5 text-3xl text-[var(--c-accent)]">&amp;</p>
                  <p className="text-2xl" style={{ fontFamily: "var(--f-heading)" }}>{names.b}</p>
                  {mainDate && <p className="mt-3 text-[0.7rem] tracking-[0.3em] opacity-70">{fmtDate(mainDate, locale, "long")}</p>}
                </div>
              ) : (
                <div className="px-1">
                  <p className="inv-eyebrow" style={{ fontSize: "0.6rem", color: "var(--c-primary)" }}>{names.invitation || t("gate.cardLine")}</p>
                  <p className="mt-2.5 leading-[1.08]" style={{ fontFamily: "var(--f-heading)", fontSize: names.a.length > 26 ? "1.3rem" : names.a.length > 14 ? "1.6rem" : "2.1rem", textWrap: "balance" }}>{names.a}</p>
                  {names.subtitle && <p className="inv-script mt-1.5 text-[1.05rem] text-[var(--c-accent)]">{names.subtitle}</p>}
                  {mainDate && <p className="mt-3 text-[0.7rem] tracking-[0.3em] opacity-70">{fmtDate(mainDate, locale, "long")}</p>}
                </div>
              )}
            </div>
            <div className="env-pocket" />
            <div className="env-flap"><div className="face front" /><div className="face back" /></div>
            <div className="wax" aria-hidden>
              <div className="wax-half l"><SealFace subject={names} date={mainDate} sealText={op.sealText} /></div>
              <div className="wax-half r"><SealFace subject={names} date={mainDate} sealText={op.sealText} /></div>
            </div>
          </div>
          {wantsMusic && !isOpening && <p className="gate-hint">{t("gate.tapToOpen")}</p>}
          {seatsText && <p className="gate-hint">{seatsText}</p>}
          {Actions}
        </div>
      )}

      {variant === "seal" && (
        <div className="gate-inner">
          {Header}
          <div className="seal-wrap" data-open={isOpening} role="button" tabIndex={0} aria-label={t("gate.tapToOpen")} onClick={() => open(wantsMusic)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open(wantsMusic))}>
            <svg className="seal-ring" viewBox="0 0 200 200" aria-hidden>
              <defs><path id="ring" d="M100,100 m-88,0 a88,88 0 1,1 176,0 a88,88 0 1,1 -176,0" /></defs>
              <text fontSize="9.5" letterSpacing="5" fill="currentColor" style={{ fontFamily: "var(--f-body)", textTransform: "uppercase" }}>
                <textPath href="#ring">{`${invited} · ${invited} · ${invited} ·`}</textPath>
              </text>
            </svg>
            <div className="seal-half l"><div className="disc">{op.sealText || names.initials}</div></div>
            <div className="seal-half r"><div className="disc">{op.sealText || names.initials}</div></div>
          </div>
          <h1 className="gate-names">{names.a}{names.isCouple && <> <span className="amp">{t("invite.and")}</span> {names.b}</>}</h1>
          {seatsText && <p className="gate-hint">{seatsText}</p>}
          {Actions}
        </div>
      )}

      {variant === "cinematic" && (
        <div className={`cine ${seqDone ? "cine-skip" : ""}`} onClick={() => setSeqDone(true)}>
          <div className="cine-bar t" /><div className="cine-bar b" />
          <div className="gate-inner">
            <p className="cine-line l1 inv-eyebrow !text-[var(--c-accent)]" style={seqDone ? { animation: "none", opacity: 1, transform: "none" } : undefined}>{invited}</p>
            {greeting && <p className="cine-line l1 gate-dear" style={seqDone ? { animation: "none", opacity: 1, transform: "none" } : undefined}>{greeting}</p>}
            <h1 className="cine-line l2 gate-names" style={{ fontSize: "clamp(2.6rem, 12vw, 5rem)", ...(seqDone ? { animation: "none", opacity: 1, transform: "none" } : {}) }}>
              {names.a}{names.isCouple && <><span className="amp"> {t("invite.and")} </span>{names.b}</>}
            </h1>
            {mainDate && (
              <div className="cine-line l3" style={seqDone ? { animation: "none", opacity: 1, transform: "none" } : undefined}>
                <RollingDate date={mainDate} active={seqDone || isOpening} locale={locale} />
              </div>
            )}
            <div className="cine-line l4" style={seqDone ? { animation: "none", opacity: 1, transform: "none" } : undefined}>{Actions}</div>
          </div>
        </div>
      )}

      {variant === "swipe" && (
        <div className="gate-inner">
          {Header}
          <h1 className="gate-names">{names.a}{names.isCouple && <> <span className="amp">{t("invite.and")}</span> {names.b}</>}</h1>
          {mainDate && <RollingDate date={mainDate} active={isOpening} locale={locale} />}
          {seatsText && <p className="gate-hint">{seatsText}</p>}
          <div className="swipe-handle" role="button" tabIndex={0} aria-label={t("gate.enter")} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open(wantsMusic))}>
            <span className="swipe-arrow"><ChevronUp className="size-6" /></span>
            <span className="gate-hint">{t("gate.swipeUp")}</span>
          </div>
          {Actions}
        </div>
      )}

      {variant === "curtain" && (
        <>
          <div className="curtain-rod" />
          <div className="curtain l" data-open={isOpening} />
          <div className="curtain r" data-open={isOpening} />
          <div className="gate-inner" style={{ position: "relative", zIndex: 5, opacity: isOpening ? 0 : 1, transition: "opacity .5s" }}>
            {Header}
            <h1 className="gate-names">{names.a}{names.isCouple && <> <span className="amp">{t("invite.and")}</span> {names.b}</>}</h1>
            {seatsText && <p className="gate-hint">{seatsText}</p>}
            {Actions}
          </div>
        </>
      )}
    </motion.div>
  );
}
