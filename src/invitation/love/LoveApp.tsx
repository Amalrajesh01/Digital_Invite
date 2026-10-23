"use client";
import "./love.css";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useInvitation } from "../engine/context";
import { MusicPill } from "../engine/Chrome";
import { Photo } from "../engine/Photo";
import { Reveal, useInView } from "../engine/motion";
import { themeFontHref, themeStyle } from "../engine/theme";
import { useLove, useSpecialDate } from "./useLove";
import { ForeverApp } from "../letters/ForeverApp";

/** A page of the main site, as an absolute address: a gift can be opened on its own address, where a relative link would not be found. */
const platformLink = (canonical: string, path: string) => { try { return new URL(path, canonical).href; } catch { return path; } };

/**
 * “For My Love”: a gift, not an invitation. Five experiences, each with its own opening, pace and way of ending.
 * A few rules hold for all of them: nothing plays by itself, nothing is asked of the person who receives it, every
 * playful step can be skipped, and the page says nothing about who else may have seen it.
 */
type Love = ReturnType<typeof useLove>;

// ── shared pieces ───────────────────────────────────────────────────────────────────────────────────────
/** Lock the page behind an opening screen, and give it back. */
function useLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [locked]);
}

/** A burst of small paper pieces from the middle of the screen. CSS only; `fire` flips it on. */
function Confetti({ fire, count = 28 }: { fire: boolean; count?: number }) {
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({ a: (i / count) * 360 + (i % 4) * 7, d: 110 + ((i * 41) % 120), r: (i * 67) % 360, k: i % 6 })), [count]);
  return (
    <div className="lb-burst" data-fire={fire} aria-hidden>
      {bits.map((b, i) => (<i key={i} data-k={b.k} style={{ "--a": `${b.a}deg`, "--d": `${b.d}px`, "--r": `${b.r}deg` } as React.CSSProperties} />))}
    </div>
  );
}

function ReplyBlock({ l }: { l: Love }) {
  if (!l.reply) return null;
  return (
    <div className="lv-reply">
      <p>{l.t("replyHint")}</p>
      <a className="inv-btn inv-btn-ghost" href={l.reply} target="_blank" rel="noopener noreferrer">{l.t("reply")}</a>
    </div>
  );
}

function StartButtons({ l, onGo, label }: { l: Love; onGo: (withMusic: boolean) => void; label?: string }) {
  const { music } = useInvitation();
  return (
    <div className="lv-start-actions">
      <button type="button" className="inv-btn" onClick={() => onGo(music.ready)}>{label ?? (music.ready ? l.t("beginMusic") : l.t("begin"))}</button>
      {music.ready && <button type="button" className="lv-quiet" onClick={() => onGo(false)}>{l.t("begin")}</button>}
    </div>
  );
}

// ── 1. OUR STORY ────────────────────────────────────────────────────────────────────────────────────────
function Chapter({ n, c, l }: { n: number; c: { when: string; title: string; body: string[]; photo?: string }; l: Love }) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.3 });
  return (
    <section ref={ref} className="ls-chap" data-in={inView} data-photo={!!c.photo}>
      <div className="ls-sticky">
        {c.photo ? <Photo id={c.photo} className="ls-photo" seed={n} sizes="100vw" /> : <span className="ls-numeral" aria-hidden>{String(n).padStart(2, "0")}</span>}
        <div className="ls-scrim" />
        <div className="ls-text">
          {c.when && <p className="ls-when">{c.when}</p>}
          {c.title && <h2 className="ls-ttl">{c.title}</h2>}
          {c.body.map((p, k) => (<p key={k} className="ls-line" style={{ transitionDelay: `${300 + k * 260}ms` }}>{p}</p>))}
          {!c.title && !c.body.length && <p className="ls-when">{l.t("chapter", { n })}</p>}
        </div>
      </div>
    </section>
  );
}

function Story({ l, auto }: { l: Love; auto?: boolean }) {
  const { music, setEntered } = useInvitation();
  const [begun, setBegun] = useState(!!auto);
  useLock(!begun);
  const go = (withMusic: boolean) => { if (withMusic) music.play(); setBegun(true); setEntered(true); window.scrollTo({ top: 0 }); };
  // Chapters come from the memories; if there are none, each photograph becomes a chapter and the reasons speak over them.
  const chapters = useMemo(() => {
    if (l.memories.length) return l.memories.map((m) => ({ when: m.when, title: m.title, body: m.body, photo: m.photo }));
    return l.photos.map((p, i) => ({ when: "", title: "", body: l.reasons[i] ? [l.reasons[i]] : [], photo: p.id }));
  }, [l.memories, l.photos, l.reasons]);
  const cover = l.photos[0]?.id;
  return (
    <div className="ls" data-begun={begun}>
      {!begun && (
        <section className="ls-start" aria-label={l.title}>
          {cover && <Photo id={cover} priority className="ls-start-photo" sizes="100vw" />}
          <div className="ls-start-scrim" />
          <div className="ls-start-copy">
            <p className="lv-eyebrow">{l.t("start")}</p>
            <h1 className="lv-display">{l.title}</h1>
            {l.secondary && <p className="lv-sub">{l.secondary}</p>}
            <StartButtons l={l} onGo={go} />
          </div>
        </section>
      )}
      {begun && (
        <>
          <header className="ls-title"><p className="lv-eyebrow">{l.fromLine}</p><h1 className="lv-display">{l.title}</h1></header>
          {chapters.map((c, i) => (<Chapter key={i} n={i + 1} c={c} l={l} />))}
          {l.letter.length > 0 && (
            <section className="ls-letter">
              <div className="ls-letter-in">
                {l.letter.map((p, i) => (<Reveal key={i} delay={i * 60}><p className="ls-letter-p">{p}</p></Reveal>))}
              </div>
            </section>
          )}
          <section className="ls-end">
            <Reveal><p className="lv-script ls-always">{l.closing || l.t("always")}</p><p className="lv-sign">{l.signature}</p></Reveal>
            <ReplyBlock l={l} />
          </section>
        </>
      )}
    </div>
  );
}

// ── 2. A LETTER TO YOU ──────────────────────────────────────────────────────────────────────────────────
function Print({ id, tilt }: { id: string; tilt: number }) {
  return (<div className="ll-print" style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}><Photo id={id} ratio="aspect-[5/4]" className="ll-print-img" sizes="(max-width: 700px) 80vw, 420px" /><i className="ll-tape" aria-hidden /></div>);
}

function Letter({ l, auto }: { l: Love; auto?: boolean }) {
  const { music, setEntered } = useInvitation();
  const [phase, setPhase] = useState<"closed" | "opening" | "open">(auto ? "open" : "closed");
  useLock(phase !== "open");
  const open = (withMusic: boolean) => {
    if (phase !== "closed") return;
    if (withMusic) music.play();
    setPhase("opening");
    window.setTimeout(() => { setPhase("open"); setEntered(true); window.scrollTo({ top: 0 }); }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1500);
  };
  const initial = l.signature.charAt(0).toUpperCase() || "♥";
  const photoIds = l.photos.map((p) => p.id);
  // a photograph is tucked in after every second paragraph; whatever is left goes at the end
  const tuck: Record<number, string> = {};
  let placed = 0;
  l.letter.forEach((_, i) => { if (i % 2 === 1 && placed < photoIds.length) tuck[i] = photoIds[placed++]; });
  const rest = photoIds.slice(placed);
  return (
    <div className="ll" data-phase={phase}>
      {phase !== "open" && (
        <section className="ll-start" aria-label={l.title}>
          <p className="lv-eyebrow">{l.t("wroteThis", { name: l.signature })}</p>
          <button type="button" className="ll-env" data-open={phase === "opening"} onClick={() => open(music.ready)} aria-label={l.t("openLetterHint")}>
            <span className="ll-back" /><span className="ll-card"><span className="lv-script">{l.address}</span></span><span className="ll-pocket" /><span className="ll-flap" /><span className="ll-seal">{initial}</span>
          </button>
          <p className="lv-hint">{l.t("openLetterHint")}</p>
          {music.ready && <button type="button" className="lv-quiet" onClick={() => open(false)}>{l.t("openLetter")}</button>}
        </section>
      )}
      {phase === "open" && (
        <article className="ll-paper">
          <p className="lv-script ll-dear">{l.t("dear", { name: l.address })}</p>
          {l.secondary && <p className="lv-sub ll-alt">{l.secondary}</p>}
          {l.letter.map((p, i) => (
            <Fragment key={i}>
              <Reveal><p className="ll-p">{p}</p></Reveal>
              {tuck[i] && <Reveal><Print id={tuck[i]} tilt={i % 4 === 1 ? -2.2 : 1.8} /></Reveal>}
            </Fragment>
          ))}
          {rest.map((id, i) => (<Reveal key={id}><Print id={id} tilt={i % 2 ? 1.6 : -2} /></Reveal>))}
          <Reveal><p className="lv-script ll-close">{l.closing || l.t("always")}</p><p className="ll-sign">{l.signature}</p></Reveal>
          <ReplyBlock l={l} />
        </article>
      )}
    </div>
  );
}

// ── 3. LITTLE SURPRISE ──────────────────────────────────────────────────────────────────────────────────
type Step =
  | { kind: "hello" }
  | { kind: "memory"; m: Love["memories"][number] }
  | { kind: "reasons" }
  | { kind: "photo"; id: string }
  | { kind: "words" }
  | { kind: "finale" };

function Surprise({ l, auto }: { l: Love; auto?: boolean }) {
  const { music, setEntered } = useInvitation();
  const [opened, setOpened] = useState(!!auto);
  const [bang, setBang] = useState(false);
  const [i, setI] = useState(0);
  useLock(!opened);
  const steps = useMemo<Step[]>(() => {
    const s: Step[] = [{ kind: "hello" }];
    l.memories.forEach((m) => s.push({ kind: "memory", m }));
    if (l.reasons.length) s.push({ kind: "reasons" });
    const memoryPhotos = new Set(l.memories.map((m) => m.photo));
    l.photos.filter((p) => !memoryPhotos.has(p.id)).slice(0, 4).forEach((p) => s.push({ kind: "photo", id: p.id }));
    if (l.letter.length) s.push({ kind: "words" });
    s.push({ kind: "finale" });
    return s;
  }, [l.memories, l.reasons, l.photos, l.letter]);
  const step = steps[Math.min(i, steps.length - 1)];
  const last = i >= steps.length - 1;
  const open = (withMusic: boolean) => {
    if (withMusic) music.play();
    setBang(true);
    window.setTimeout(() => { setOpened(true); setEntered(true); }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900);
  };
  useEffect(() => { if (opened && step.kind === "finale") { setBang(false); const id = window.setTimeout(() => setBang(true), 50); return () => window.clearTimeout(id); } }, [opened, step.kind]);
  const finalPhotos = l.photos.slice(0, 6);
  return (
    <div className="lsu" data-opened={opened}>
      <Confetti fire={bang} />
      {!opened ? (
        <section className="lsu-start" aria-label={l.title}>
          <p className="lv-eyebrow">{l.fromLine}</p>
          <button type="button" className="lsu-gift" data-open={bang} onClick={() => open(music.ready)} aria-label={l.t("openGiftHint")}>
            <span className="lsu-lid"><i className="lsu-bow" /></span><span className="lsu-box" /><span className="lsu-ribbon" />
          </button>
          <p className="lv-hint">{l.t("openGiftHint")}</p>
          <div className="lv-start-actions">
            <button type="button" className="inv-btn" onClick={() => open(music.ready)}>{l.t("openGift")}</button>
            {music.ready && <button type="button" className="lv-quiet" onClick={() => open(false)}>{l.t("begin")}</button>}
          </div>
        </section>
      ) : (
        <section className="lsu-stage">
          <p className="lsu-count" aria-live="polite">{l.t("step", { n: Math.min(i + 1, steps.length), total: steps.length })}</p>
          <div className="lsu-card" key={i} data-kind={step.kind}>
            {step.kind === "hello" && (<><h1 className="lv-display">{l.title}</h1>{l.secondary && <p className="lv-sub">{l.secondary}</p>}<p className="lsu-from">{l.fromLine}</p></>)}
            {step.kind === "memory" && (<>
              <p className="lv-eyebrow">{step.m.when || l.t("rememberThis")}</p>
              {step.m.photo && <Photo id={step.m.photo} ratio="aspect-[4/3]" className="lsu-photo" sizes="(max-width: 700px) 88vw, 480px" />}
              {step.m.title && <h2 className="lv-title">{step.m.title}</h2>}
              {step.m.body.map((p, k) => (<p key={k} className="lsu-p">{p}</p>))}
            </>)}
            {step.kind === "reasons" && (<>
              <h2 className="lv-title">{l.t("reasonsTitle")}</h2>
              <ol className="lsu-reasons">{l.reasons.map((r, k) => (<li key={k} style={{ animationDelay: `${k * 260}ms` }}><b>{k + 1}</b><span>{r}</span></li>))}</ol>
            </>)}
            {step.kind === "photo" && (<><p className="lv-eyebrow">{l.t("aPhoto")}</p><Photo id={step.id} ratio="aspect-[4/5]" className="lsu-photo lsu-photo-tall" sizes="(max-width: 700px) 80vw, 420px" /></>)}
            {step.kind === "words" && (<><h2 className="lv-title">{l.t("aFewWords")}</h2>{l.letter.map((p, k) => (<p key={k} className="lsu-p">{p}</p>))}</>)}
            {step.kind === "finale" && (<>
              <h2 className="lv-display lsu-big">{l.closing || l.t("always")}</h2>
              <p className="lsu-from">{l.signature}</p>
              {finalPhotos.length > 0 && <div className="lsu-collage">{finalPhotos.map((p, k) => (<Photo key={p.id} id={p.id} ratio="aspect-square" className="lsu-mini" sizes="30vw" seed={k} />))}</div>}
              <ReplyBlock l={l} />
            </>)}
          </div>
          <div className="lsu-nav">
            {!last ? (
              <>
                <button type="button" className="inv-btn lsu-next" onClick={() => setI((n) => Math.min(n + 1, steps.length - 1))}>{i === steps.length - 2 ? l.t("lastSurprise") : l.t("nextSurprise")}</button>
                <div className="lsu-sub-nav">
                  {i > 0 && <button type="button" className="lv-quiet" onClick={() => setI((n) => Math.max(0, n - 1))}>{l.t("back")}</button>}
                  <button type="button" className="lv-quiet" onClick={() => setI(steps.length - 1)}>{l.t("skip")}</button>
                </div>
              </>
            ) : (
              steps.length > 1 && <button type="button" className="lv-quiet" onClick={() => setI(Math.max(0, steps.length - 2))}>{l.t("back")}</button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ── 4. I'M SORRY, MY LOVE ───────────────────────────────────────────────────────────────────────────────
function Sorry({ l, auto }: { l: Love; auto?: boolean }) {
  const { setEntered } = useInvitation();
  const [mode, setMode] = useState<"ask" | "later" | "read">(auto ? "read" : "ask");
  useEffect(() => setEntered(true), [setEntered]);
  const a = l.apology;
  // Whatever the sender wrote lands somewhere: if they only filled in the letter, its paragraphs become the apology.
  const owning = a.owning.length ? a.owning : l.letter.slice(0, 1);
  const rest = a.owning.length ? l.letter : l.letter.slice(1);
  const memory = l.memories[0];
  const section = (label: string, paras: string[], i: number) => paras.length > 0 && (
    <Reveal key={label} delay={i * 40}><section className="lq-sec"><p className="lq-label">{label}</p>{paras.map((p, k) => (<p key={k} className="lq-p">{p}</p>))}</section></Reveal>
  );
  if (mode === "ask") {
    return (
      <div className="lq lq-ask">
        <p className="lq-fade" style={{ animationDelay: "0.4s" }}>{l.t("wroteThis", { name: l.signature })}</p>
        <p className="lq-fade lq-soft" style={{ animationDelay: "1.6s" }}>{l.t("noHurry")}</p>
        <div className="lq-actions lq-fade" style={{ animationDelay: "2.8s" }}>
          <button type="button" className="inv-btn" onClick={() => setMode("read")}>{l.t("readNow")}</button>
          <button type="button" className="lv-quiet" onClick={() => setMode("later")}>{l.t("notNow")}</button>
        </div>
      </div>
    );
  }
  if (mode === "later") {
    return (
      <div className="lq lq-ask">
        <p className="lq-fade">{l.t("allFine")}</p>
        <p className="lq-fade lq-soft" style={{ animationDelay: "1.2s" }}>{l.t("hereWhenReady")}</p>
        <button type="button" className="lv-quiet lq-fade" style={{ animationDelay: "2.2s" }} onClick={() => setMode("read")}>{l.t("readAfterAll")}</button>
      </div>
    );
  }
  return (
    <div className="lq lq-read">
      <header className="lq-head"><h1 className="lq-title">{l.title}</h1></header>
      {section(l.t("apologyOwn"), owning, 0)}
      {section(l.t("apologyFeel"), a.feelings, 1)}
      {memory && (
        <Reveal><section className="lq-sec"><p className="lq-label">{l.t("apologyMemory")}</p>
          {memory.photo && <Photo id={memory.photo} ratio="aspect-[4/3]" className="lq-photo" sizes="(max-width: 700px) 90vw, 560px" />}
          {memory.title && <p className="lq-p lq-em">{memory.title}</p>}
          {memory.body.map((p, k) => (<p key={k} className="lq-p">{p}</p>))}</section></Reveal>
      )}
      {section(l.t("apologyPromise"), a.promise, 3)}
      {rest.length > 0 && <Reveal><section className="lq-sec">{rest.map((p, k) => (<p key={k} className="lq-p">{p}</p>))}</section></Reveal>}
      <Reveal>
        <section className="lq-sec lq-end">
          <p className="lq-p lq-em">{l.closing || l.t("takeYourTime")}</p>
          <p className="lq-sign">{l.signature}</p>
          <ReplyBlock l={l} />
        </section>
      </Reveal>
    </div>
  );
}

// ── 5. OUR SPECIAL DAY ──────────────────────────────────────────────────────────────────────────────────
function Day({ l }: { l: Love; auto?: boolean }) {
  const { setEntered } = useInvitation();
  const when = useSpecialDate(l.love.date);
  const [boom, setBoom] = useState(false);
  const endRef = useRef<HTMLElement>(null);
  useEffect(() => setEntered(true), [setEntered]);
  useEffect(() => {
    const el = endRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setBoom(true); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const fan = l.photos.slice(0, 3);
  const showYears = !!when && l.love.occasion !== "birthday" && when.years > 0;
  const timeline = l.memories.length ? l.memories : l.photos.slice(0, 6).map((p, i) => ({ id: p.id, title: "", body: l.reasons[i] ? [l.reasons[i]] : [], when: "", photo: p.id }));
  return (
    <div className="ld">
      <Confetti fire={boom} count={36} />
      <header className="ld-hero">
        {fan.length > 0 && (<div className="ld-fan" aria-hidden>{fan.map((p, i) => (<Photo key={p.id} id={p.id} ratio="aspect-[3/4]" className="ld-fan-img" seed={i} sizes="(max-width: 700px) 40vw, 260px" priority={i === 0} />))}</div>)}
        <p className="lv-eyebrow">{l.fromLine}</p>
        <h1 className="lv-display ld-title">{l.title}</h1>
        {l.secondary && <p className="lv-sub">{l.secondary}</p>}
        {when && (
          <div className="ld-count" aria-live="off">
            {when.isToday || when.done ? (
              <p className="ld-today lv-script">{l.t("today")}</p>
            ) : (
              <>
                <p className="ld-days" aria-label={`${when.days} ${l.t("daysToGo")}`}><b>{when.days}</b><span>{when.days === 1 ? l.t("daysToGoOne") : l.t("daysToGo")}</span></p>
                <p className="ld-clock inv-num">{String(when.hours).padStart(2, "0")}:{String(when.minutes).padStart(2, "0")}:{String(when.seconds).padStart(2, "0")}</p>
              </>
            )}
            {showYears && <p className="ld-years"><b>{when.years}</b> {when.years === 1 ? l.t("yearTogether") : l.t("yearsTogether")}</p>}
            {l.dateLabel && <p className="lv-sub">{l.dateLabel}</p>}
          </div>
        )}
      </header>
      {timeline.length > 0 && (
        <section className="ld-time" aria-label={l.t("ourMemories")}>
          <h2 className="lv-title ld-time-title">{l.t("ourMemories")}</h2>
          <div className="ld-rail" tabIndex={0}>
            {timeline.map((m, i) => (
              <article key={m.id ?? i} className="ld-card">
                {m.photo && <Photo id={m.photo} ratio="aspect-[4/5]" className="ld-card-img" sizes="(max-width: 700px) 72vw, 300px" />}
                {m.when && <p className="ld-when">{m.when}</p>}
                {m.title && <h3 className="ld-card-t">{m.title}</h3>}
                {m.body.map((p, k) => (<p key={k} className="ld-card-p">{p}</p>))}
              </article>
            ))}
          </div>
        </section>
      )}
      {l.letter.length > 0 && (
        <section className="ld-words">{l.letter.map((p, i) => (<Reveal key={i}><p className="ld-words-p">{p}</p></Reveal>))}</section>
      )}
      <section className="ld-end" ref={endRef}>
        <Reveal><p className="lv-script ld-closing">{l.closing || l.t("always")}</p><p className="lv-sign">{l.signature}</p></Reveal>
        <ReplyBlock l={l} />
      </section>
    </div>
  );
}

// ── the root ────────────────────────────────────────────────────────────────────────────────────────────
export function LoveApp({ autoOpen }: { autoOpen?: boolean }) {
  const { view, locale, isPreview } = useInvitation();
  const l = useLove();
  const tk = view.tokens;
  const href = themeFontHref(tk, view.wedding.secondaryLocale);
  const experience = l.love.experience;
  const forever = experience === "forever";
  const Body = forever ? null : { story: Story, letter: Letter, surprise: Surprise, sorry: Sorry, day: Day }[experience];
  const showSignature = experience !== "sorry" && !forever; // an apology is not the place for an advertisement; a Forever Letter has its own ending
  // a Forever Letter has its own palette: the floating music control and everything outside the player should match it
  const p = forever ? view.letter?.palette : undefined;
  const own = p ? ({ "--c-bg": p.bg, "--c-surface": p.surface, "--c-text": p.ink, "--c-muted": p.muted, "--c-primary": p.accent, "--c-accent": p.accent, "--c-on-primary": p.onAccent, "--c-border": p.muted, "--c-inverse": p.ink, "--c-on-inverse": p.bg } as React.CSSProperties) : undefined;
  return (
    <div className="inv love" lang={l.ui} data-locale={locale} data-love={experience} data-mood={l.love.mood} data-dark={p ? p.dark : tk.dark} data-grain={tk.grain} data-button={tk.button} data-card={tk.card} data-flavor={view.flavor} style={{ ...themeStyle(tk, view.wedding.secondaryLocale), ...own }}>
      {href && <link rel="stylesheet" href={href} precedence="default" />}
      {Body ? <main id="main"><Body l={l} auto={autoOpen} /></main> : <ForeverApp autoOpen={autoOpen} />}
      <MusicPill />
      {showSignature && (
        <footer className="lv-foot">
          <p>{l.t("made")}</p>
          {!isPreview && <a href={platformLink(view.urls.canonical, "/for-my-love")}>{l.t("makeYours")} →</a>}
        </footer>
      )}
    </div>
  );
}
