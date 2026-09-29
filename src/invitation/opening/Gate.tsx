"use client";
import "./gate.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronUp } from "lucide-react";
import { useInvitation } from "../engine/context";
import { fmtDate } from "../engine/format";
import { distanceKm } from "../engine/format";

type State = "closed" | "opening" | "leaving" | "gone";
const DURATION: Record<string, number> = { envelope: 2400, seal: 1500, cinematic: 250, swipe: 350, curtain: 1600, none: 0 };

export function useCoupleNames() {
  const { view, L, t } = useInvitation();
  const c = view.doc.couple;
  const bride = L(c.bride.name) || "Bride";
  const groom = L(c.groom.name) || "Groom";
  const [a, b] = c.order === "groom-first" ? [groom, bride] : [bride, groom];
  const [ia, ib] = c.order === "groom-first" ? [c.groom.name.en ?? groom, c.bride.name.en ?? bride] : [c.bride.name.en ?? bride, c.groom.name.en ?? groom];
  const initials = c.monogram || `${(ia ?? "").trim().charAt(0)}${(ib ?? "").trim().charAt(0)}`.toUpperCase();
  return { a, b, initials, joined: `${a} ${t("invite.and")} ${b}`, ia: (ia ?? "").trim().charAt(0).toUpperCase(), ib: (ib ?? "").trim().charAt(0).toUpperCase() };
}

function GateMonogram() {
  const { ia, ib } = useCoupleNames();
  return (
    <svg viewBox="0 0 160 70" className="h-20 w-auto" aria-hidden>
      <text x="8" y="56" fontSize="64" className="mono-stroke" style={{ fontFamily: "var(--f-heading)" }}>{ia}</text>
      <text x="64" y="46" fontSize="30" style={{ fontFamily: "var(--f-script)", fill: "var(--c-on-inverse)", opacity: 0.85 }}>&amp;</text>
      <text x="92" y="56" fontSize="64" className="mono-stroke" style={{ fontFamily: "var(--f-heading)", animationDelay: "0.6s, 2.6s" }}>{ib}</text>
    </svg>
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
  const variant = op.variant;
  const [state, setState] = useState<State>(variant === "none" || skip ? "gone" : "closed");
  const [seqDone, setSeqDone] = useState(false);
  const primary = useRef<HTMLButtonElement>(null);
  const names = useCoupleNames();
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
          {Header}
          <div className="env" data-open={isOpening} role="button" tabIndex={0} aria-label={t("gate.tapToOpen")} onClick={() => open(wantsMusic)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open(wantsMusic))}>
            <div className="env-body" />
            <div className="env-card">
              <div>
                <p className="inv-eyebrow" style={{ fontSize: "0.6rem", color: "var(--c-primary)" }}>{t("invite.together")}</p>
                <p className="mt-2 text-2xl" style={{ fontFamily: "var(--f-heading)" }}>{names.a}</p>
                <p className="inv-script my-0.5 text-3xl text-[var(--c-accent)]">&amp;</p>
                <p className="text-2xl" style={{ fontFamily: "var(--f-heading)" }}>{names.b}</p>
              </div>
            </div>
            <div className="env-pocket" />
            <div className="env-flap" />
            <div className="env-seal" aria-hidden>{op.sealText || names.initials.charAt(0)}</div>
          </div>
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
          <h1 className="gate-names">{names.a} <span className="amp">{t("invite.and")}</span> {names.b}</h1>
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
              {names.a}<span className="amp"> {t("invite.and")} </span>{names.b}
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
          <h1 className="gate-names">{names.a} <span className="amp">{t("invite.and")}</span> {names.b}</h1>
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
            <h1 className="gate-names">{names.a} <span className="amp">{t("invite.and")}</span> {names.b}</h1>
            {seatsText && <p className="gate-hint">{seatsText}</p>}
            {Actions}
          </div>
        </>
      )}
    </motion.div>
  );
}
