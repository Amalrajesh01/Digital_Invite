"use client";
import "./letters.css";
import "./gates.css";
import "./beats.css";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { googleFontsHref } from "@/domain/design/tokens";
import type { Beat as B } from "@/domain/letters/types";
import { beatHasContent } from "@/domain/letters/values";
import { staticPhoto } from "@/domain/letters/images";
import { cn } from "@/lib/cn";
import { FLProvider, buildAccessors, useReduced, type FL, type PhotoSrc, type PlayerProps, type ReplyPayload } from "./runtime";
import { flText } from "./strings";
import { Gate } from "./Gates";
import { Closing, Countdown, Invite, Letter, Lines, Media, Reasons, Sections, Song } from "./Text";
import { Choose, Clues, Deck, Envelopes, Flip, Match, Order, Quiz, Scratch, Suggest, Tiles } from "./Games";
import { Dreams, Gallery, Promises, Route, Timeline } from "./Story";
import { AskBeat } from "./Ask";
import { Quiet } from "./parts";

export { flText };
export type { PlayerProps, ReplyPayload };

function BeatView({ b }: { b: B }) {
  switch (b.type) {
    case "gate": return <Gate b={b} />;
    case "lines": return <Lines b={b} />;
    case "sections": return <Sections b={b} />;
    case "letter": return <Letter b={b} />;
    case "clues": return <Clues b={b} />;
    case "quiz": return <Quiz b={b} />;
    case "flip": return <Flip b={b} />;
    case "deck": return <Deck b={b} />;
    case "envelopes": return <Envelopes b={b} />;
    case "scratch": return <Scratch b={b} />;
    case "order": return <Order b={b} />;
    case "match": return <Match b={b} />;
    case "tiles": return <Tiles b={b} />;
    case "timeline": return <Timeline b={b} />;
    case "route": return <Route b={b} />;
    case "gallery": return <Gallery b={b} />;
    case "countdown": return <Countdown b={b} />;
    case "song": return <Song b={b} />;
    case "choose": return <Choose b={b} />;
    case "suggest": return <Suggest b={b} />;
    case "dreams": return <Dreams b={b} />;
    case "promises": return <Promises b={b} />;
    case "reasons": return <Reasons b={b} />;
    case "invite": return <Invite b={b} />;
    case "media": return <Media b={b} />;
    case "ask": return <AskBeat b={b} />;
    case "closing": return <Closing b={b} />;
  }
}

/** A few small, slow marks drifting in the background. Pure CSS; hidden for reduced motion; none at all for a plain stage. */
function Ambient({ kind }: { kind: string }) {
  if (kind === "none") return null;
  const n = kind === "stars" ? 26 : kind === "petals" ? 11 : kind === "bubbles" ? 10 : 13;
  return (
    <div className={`fl-ambient fl-amb-${kind}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => <i key={i} style={{ "--x": `${(i * 53) % 100}%`, "--y": `${(i * 37) % 100}%`, "--d": `${7 + ((i * 11) % 9)}s`, "--l": `${-((i * 17) % 13)}s`, "--s": `${0.5 + ((i * 7) % 10) / 10}` } as CSSProperties} />)}
    </div>
  );
}

function Burst({ n }: { n: number }) {
  if (!n) return null;
  return (
    <div className="fl-burst" key={n} aria-hidden>
      {Array.from({ length: 30 }, (_, i) => <i key={i} data-k={i % 5} style={{ "--a": `${(i / 30) * 360 + (i % 4) * 7}deg`, "--r": `${(i * 67) % 360}deg`, "--d": `${110 + ((i * 41) % 130)}px` } as CSSProperties} />)}
    </div>
  );
}

export function ForeverPlayer(props: PlayerProps) {
  const { spec, values, names, ui, mode } = props;
  const s = useMemo(() => flText(ui), [ui]);
  const reduced = useReduced();
  const { txt, list } = useMemo(() => buildAccessors(spec, values, names), [spec, values, names]);
  const beats = useMemo(() => spec.beats.filter((b) => b.type === "gate" || beatHasContent(spec, values, b)), [spec, values]);
  const [index, setIndex] = useState(() => Math.min(props.startAt ?? 0, Math.max(0, beats.length - 1)));
  const [burst, setBurst] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const answersRef = useRef<{ q: string; a: string }[]>([]);
  const focusRef = useRef<HTMLHeadingElement | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // when the sender edits in the builder the beat list can shrink under us
  useEffect(() => { setIndex((i) => Math.min(i, Math.max(0, beats.length - 1))); }, [beats.length]);
  // opened on a given screen (the builder's preview, the gallery's pictures): follow that only when it changes, not whenever the sender's edits add or remove a screen
  const startAt = props.startAt;
  const total = useRef(beats.length);
  useEffect(() => { total.current = beats.length; });
  useEffect(() => { if (startAt !== undefined) setIndex(Math.min(startAt, Math.max(0, total.current - 1))); }, [startAt]);

  const goto = useCallback((i: number) => setIndex(Math.max(0, Math.min(i, beats.length - 1))), [beats.length]);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, beats.length - 1)), [beats.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(1, i - 1)), []);

  // a new screen: back to the top, and focus on its heading
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const w = root.current?.ownerDocument.defaultView;
    w?.scrollTo({ top: 0 });
    // the screen's heading when it has one; otherwise the screen itself, so focus is never left behind on the page
    const id = window.setTimeout(() => {
      const t = focusRef.current ?? root.current?.querySelector<HTMLElement>(".fl-beat");
      if (!t) return;
      if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
      t.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(id);
  }, [index]);

  const fire = useCallback(() => { if (spec.tone === "romantic" || spec.tone === "playful") setBurst((n) => n + 1); }, [spec.tone]);

  const { resolvePhoto, onReply } = props;
  const photo = useCallback((id: string | undefined): PhotoSrc | undefined => {
    if (!id) return undefined;
    return staticPhoto(id) ?? resolvePhoto?.(id);
  }, [resolvePhoto]);
  const own = typeof values.cover === "string" ? values.cover : "";
  const backdrop = photo(own) ?? photo(spec.backdrop);

  const send = useCallback(async (p: ReplyPayload) => {
    if (mode !== "live" || !onReply) return "preview" as const;
    try { return await onReply(p); } catch { return "error" as const; }
  }, [mode, onReply]);

  const fl: FL = {
    spec, mode, ui, s, names, txt, list, photo, backdrop, next, prev, goto, index, total: beats.length, reduced, fire,
    answers: { record: (q, a) => { answersRef.current = [...answersRef.current.filter((x) => x.q !== q), { q, a }].slice(-12); }, all: () => answersRef.current, tags, addTag: (t) => setTags((x) => [...x, t]) },
    reply: { mode: props.replyMode, whatsapp: props.whatsapp ? props.whatsapp.replace(/\D/g, "") : null, send, playfulNo: props.playfulNo && spec.playfulNo === true, shareAnswers: props.shareAnswers },
    audio: props.audio ?? null, focusRef,
  };

  const b = beats[Math.min(index, beats.length - 1)];
  const p = spec.palette;
  const style = {
    "--fl-bg": p.bg, "--fl-surface": p.surface, "--fl-ink": p.ink, "--fl-muted": p.muted, "--fl-accent": p.accent, "--fl-accent2": p.accent2, "--fl-on": p.onAccent,
    "--f-display": `"${spec.fonts.display}", Georgia, serif`, "--f-body": `"${spec.fonts.body}", system-ui, sans-serif`, "--f-script": `"${spec.fonts.script ?? spec.fonts.display}", Georgia, serif`,
    "--fl-speed": props.intensity === "calm" ? 1.4 : props.intensity === "rich" ? 0.82 : 1,
  } as CSSProperties;
  const href = googleFontsHref([spec.fonts.display, spec.fonts.body, spec.fonts.script ?? "", ui === "ml" ? "Noto Sans Malayalam" : ""]);
  const isGate = b.type === "gate";
  const last = index >= beats.length - 1;
  const canSkip = !isGate && !last && (spec.tone === "playful" || spec.tone === "romantic") && beats.length > 4;

  return (
    <FLProvider value={fl}>
      <div ref={root} className={cn("fl", props.intensity === "calm" && "fl-calm")} lang={ui} style={style} data-slug={spec.slug} data-motion={spec.motion} data-layout={spec.layout} data-tone={spec.tone} data-dark={p.dark} data-treat={spec.treatment} data-gate={isGate} data-mode={mode} data-kind={b.type}>
        {href && <link rel="stylesheet" href={href} precedence="default" />}
        <div className="fl-bg" aria-hidden>
          {backdrop && <img src={backdrop.src} srcSet={backdrop.srcSet} alt="" fetchPriority="high" decoding="async" style={{ objectPosition: backdrop.focal ? `${backdrop.focal.x}% ${backdrop.focal.y}%` : undefined }} />}
          <div className="fl-scrim" />
        </div>
        <Ambient kind={spec.ambient} />
        <Burst n={burst} />
        {mode === "demo" && <p className="fl-demo" role="note"><b>{s("demo")}</b></p>}
        {!isGate && (
          <header className="fl-top">
            {index > 1 ? <button type="button" className="fl-back" onClick={prev} aria-label={s("back")}><svg viewBox="0 0 24 24" aria-hidden><path d="M15 5l-7 7 7 7" /></svg></button> : <span />}
            <div className="fl-progress" role="progressbar" aria-label={s("step", { n: index + 1, total: beats.length })} aria-valuemin={1} aria-valuemax={beats.length} aria-valuenow={index + 1}><i style={{ width: `${((index + 1) / beats.length) * 100}%` }} /></div>
            {canSkip ? <Quiet className="fl-skip" onClick={() => goto(beats.length - 1)}>{s("skipEnd")}</Quiet> : <span />}
          </header>
        )}
        <main className="fl-stage" id="main"><BeatView key={`${index}-${b.type}`} b={b} /></main>
        {last && (
          <footer className="fl-foot">
            <p>{s("made")}</p>
            {props.makeHref && mode === "live" && <a href={props.makeHref}>{s("makeYours")} →</a>}
            {props.footer}
          </footer>
        )}
      </div>
    </FLProvider>
  );
}
