"use client";
import { useEffect, useMemo, useState } from "react";
import type { Beat as B } from "@/domain/letters/types";
import { lines, paragraphs } from "@/domain/letters/values";
import { streamLink } from "@/domain/live/stream";
import { useFL, useSequence, useTyped } from "./runtime";
import { Beat, Btn, Dots, Eyebrow, Head, Heart, Pic, Para, Quiet } from "./parts";

type Of<T extends B["type"]> = Extract<B, { type: T }>;
const rowsOf = (text: string) => (/\n\s*\n/.test(text) ? paragraphs(text) : lines(text));

// ── progressive lines ──────────────────────────────────────────────────────────────────────────────────
export function Lines({ b }: { b: Of<"lines"> }) {
  const fl = useFL();
  const rows = useMemo(() => rowsOf(fl.txt(b.src)), [fl, b.src]);
  const mode = b.mode ?? "fade";
  const cta = b.cta ?? fl.s("continue");
  return (
    <Beat className={`fl-lines fl-lines-${mode}`} kind="lines">
      {b.photo && <Pic id={fl.txt(b.photo)} className="fl-lines-photo" />}
      <Eyebrow>{fl.txt(b.eyebrow)}</Eyebrow>
      <Head>{fl.txt(b.title)}</Head>
      {mode === "chat" ? <Chat rows={rows} cta={cta} /> : mode === "film" ? <Film rows={rows} cta={cta} /> : mode === "stack" ? <Stack rows={rows} cta={cta} /> : mode === "type" ? <Typed rows={rows} cta={cta} /> : <Fade rows={rows} cta={cta} />}
    </Beat>
  );
}

function Fade({ rows, cta }: { rows: string[]; cta: string }) {
  const fl = useFL();
  const total = Math.min(5.5, 0.6 + rows.length * 0.85);
  return (
    <>
      <div className="fl-rows">{rows.map((r, i) => <p key={i} className="fl-line fl-rise" style={{ animationDelay: `${0.25 + i * 0.85}s` }}>{r}</p>)}</div>
      <div className="fl-after fl-rise" style={{ animationDelay: `${total}s` }}><Btn onClick={fl.next}>{cta}</Btn></div>
    </>
  );
}

function Typed({ rows, cta }: { rows: string[]; cta: string }) {
  const fl = useFL();
  const [first, done] = useTyped(rows[0] ?? "", 28);
  return (
    <>
      <div className="fl-rows">
        <p className="fl-line fl-typed" aria-label={rows[0]}>{first}<i className="fl-caret" data-done={done} /></p>
        {done && rows.slice(1).map((r, i) => <p key={i} className="fl-line fl-rise" style={{ animationDelay: `${i * 0.7}s` }}>{r}</p>)}
      </div>
      <div className="fl-after"><Btn onClick={fl.next}>{cta}</Btn></div>
    </>
  );
}

function Stack({ rows, cta }: { rows: string[]; cta: string }) {
  const fl = useFL();
  const [shown, setShown] = useState(1);
  const all = shown >= rows.length;
  return (
    <>
      <div className="fl-rows" aria-live="polite">{rows.slice(0, shown).map((r, i) => <p key={i} className="fl-line fl-rise">{r}</p>)}</div>
      <div className="fl-after">{all ? <Btn onClick={fl.next}>{cta}</Btn> : <Btn ghost onClick={() => setShown((n) => n + 1)}>{fl.s("nextLine")}</Btn>}</div>
    </>
  );
}

/** Messages that arrive one at a time, as if typed — the sender's words, never a real conversation. */
function Chat({ rows, cta }: { rows: string[]; cta: string }) {
  const fl = useFL();
  const [shown, , n] = useSequence(rows.length, { every: 1300, start: 700 });
  return (
    <>
      <div className="fl-chat" aria-live="polite">
        {rows.slice(0, shown).map((r, i) => <p key={i} className="fl-bubble fl-rise">{r}</p>)}
        {shown < n && <p className="fl-bubble fl-typing" aria-label={fl.s("typing")}><i /><i /><i /></p>}
      </div>
      <div className="fl-after">{shown >= n && <Btn onClick={fl.next}>{cta}</Btn>}</div>
    </>
  );
}

/** Big captions, one after another, like the title cards of a film. A tap moves on faster; the button is always there. */
function Film({ rows, cta }: { rows: string[]; cta: string }) {
  const fl = useFL();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (fl.reduced || i >= rows.length - 1) return;
    const id = window.setTimeout(() => setI((n) => n + 1), 3400);
    return () => window.clearTimeout(id);
  }, [i, rows.length, fl.reduced]);
  const last = i >= rows.length - 1;
  return (
    <>
      <div className="fl-cards" aria-live="polite"><p key={i} className="fl-card fl-rise">{rows[i]}</p></div>
      <Dots n={rows.length} at={i} />
      <div className="fl-after">{last ? <Btn onClick={fl.next}>{cta}</Btn> : <Btn ghost onClick={() => setI((n) => n + 1)}>{fl.s("nextLine")}</Btn>}</div>
    </>
  );
}

// ── labelled sections (an apology, the things left unsaid) ─────────────────────────────────────────────
export function Sections({ b }: { b: Of<"sections"> }) {
  const fl = useFL();
  const parts = b.parts.map((p) => ({ label: fl.txt(p.label), rows: rowsOf(fl.txt(p.src)) })).filter((p) => p.rows.length);
  const [step, setStep] = useState(1);
  const last = step >= parts.length;
  return (
    <Beat className="fl-sections" kind="sections">
      <Head>{fl.txt(b.title)}</Head>
      <div className="fl-parts" aria-live="polite">
        {parts.slice(0, step).map((p, i) => (
          <section key={i} className="fl-part fl-rise">
            <h3 className="fl-label">{p.label}</h3>
            {p.rows.map((r, k) => <p key={k} className="fl-p">{r}</p>)}
          </section>
        ))}
      </div>
      <div className="fl-after">{last ? <Btn onClick={fl.next}>{b.cta ?? fl.s("continue")}</Btn> : <Btn ghost onClick={() => setStep((n) => n + 1)}>{fl.s("continue")}</Btn>}</div>
    </Beat>
  );
}

// ── the letter ─────────────────────────────────────────────────────────────────────────────────────────
export function Letter({ b }: { b: Of<"letter"> }) {
  const fl = useFL();
  const ps = useMemo(() => paragraphs(fl.txt(b.src)), [fl, b.src]);
  const per = b.per ?? 2;
  const pages = Math.max(1, Math.ceil(ps.length / per));
  const [page, setPage] = useState(0);
  const last = page >= pages - 1;
  const voice = !!b.voice && fl.txt(b.voice) === "1" && fl.audio?.ready;
  return (
    <Beat className="fl-letter" kind="letter">
      <Eyebrow>{pages > 1 ? fl.s("round", { n: page + 1, total: pages }) : ""}</Eyebrow>
      <Head>{fl.txt(b.title) || fl.s("dear", { name: fl.names.to })}</Head>
      <div className="fl-paper" key={page}>
        {ps.slice(page * per, page * per + per).map((p, i) => <p key={i} className="fl-p fl-rise" style={{ animationDelay: `${0.2 + i * 1.1}s` }}>{p}</p>)}
        {last && <p className="fl-sign fl-rise" style={{ animationDelay: `${0.4 + per * 1.1}s` }}>{fl.names.anonymous ? fl.s("signedAnon") : fl.s("signed", { name: fl.names.sign })}</p>}
      </div>
      {voice && fl.audio && (
        <div className="fl-voice"><Btn ghost onClick={fl.audio.toggle}>{fl.audio.playing ? fl.s("pauseVoice") : fl.s("playVoice")}</Btn><p>{fl.s("voiceNote")}</p></div>
      )}
      {pages > 1 && <Dots n={pages} at={page} />}
      <div className="fl-after">{last ? <Btn onClick={fl.next}>{b.cta ?? fl.s("continue")}</Btn> : <Btn ghost onClick={() => setPage((n) => n + 1)}>{fl.s("continue")}</Btn>}</div>
    </Beat>
  );
}

// ── things, one at a time ──────────────────────────────────────────────────────────────────────────────
export function Reasons({ b }: { b: Of<"reasons"> }) {
  const fl = useFL();
  const items = fl.list(b.list);
  const [i, setI] = useState(0);
  const title = fl.txt(b.title).replace(/\{n\}/g, String(items.length));
  const it = items[Math.min(i, items.length - 1)];
  const style = b.style ?? "big";
  const last = i >= items.length - 1;
  return (
    <Beat className={`fl-reasons fl-reasons-${style}`} kind="reasons">
      <Head>{title}</Head>
      <p className="fl-count" aria-live="polite">{fl.s("round", { n: i + 1, total: items.length })}</p>
      <article className="fl-reason fl-pop" key={i}>
        <span className="fl-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
        {it.photo && <Pic id={it.photo} className="fl-reason-photo" />}
        <p className="fl-reason-text">{it.text}</p>
      </article>
      <div className="fl-after">
        {last ? <Btn onClick={fl.next}>{fl.s("continue")}</Btn> : <Btn ghost onClick={() => setI((n) => n + 1)}>{fl.s("next")}</Btn>}
        {!last && items.length > 6 && <Quiet onClick={() => setI(items.length - 1)}>{fl.s("skipEnd")}</Quiet>}
      </div>
    </Beat>
  );
}

// ── a real date, counted down ──────────────────────────────────────────────────────────────────────────
export function Countdown({ b }: { b: Of<"countdown"> }) {
  const fl = useFL();
  const date = fl.txt(b.date);
  const target = useMemo(() => new Date(`${date}T00:00:00+05:30`).getTime(), [date]);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  const ms = now === null ? 0 : Math.max(0, target - now);
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return (
    <Beat className="fl-countdown" kind="countdown">
      <Head>{fl.txt(b.title)}</Head>
      {ms === 0 && now !== null ? <p className="fl-big">{fl.s("today")}</p> : (
        <div className="fl-clock" role="timer" aria-label={`${d} ${d === 1 ? fl.s("dayToGo") : fl.s("daysToGo")}`}>
          <p className="fl-days"><b>{d}</b><span>{d === 1 ? fl.s("dayToGo") : fl.s("daysToGo")}</span></p>
          <p className="fl-hms" aria-hidden>{[h, m, s].map((x) => String(x).padStart(2, "0")).join(" : ")}</p>
        </div>
      )}
      <div className="fl-after"><Btn onClick={fl.next}>{fl.s("continue")}</Btn></div>
    </Beat>
  );
}

// ── a song, and the story behind it ────────────────────────────────────────────────────────────────────
const MUSIC_HOSTS = ["open.spotify.com", "music.apple.com", "music.youtube.com", "youtube.com", "m.youtube.com", "youtu.be", "jiosaavn.com", "gaana.com", "soundcloud.com", "wynk.in", "hungama.com"];
/** Only a plain https link to a known music service is ever offered; the platform never plays or hosts a recording. */
export function musicLink(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    return u.protocol === "https:" && !u.username && MUSIC_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ? u.toString() : null;
  } catch { return null; }
}

export function Song({ b }: { b: Of<"song"> }) {
  const fl = useFL();
  const link = musicLink(fl.txt(b.link));
  const own = fl.audio?.ready;
  return (
    <Beat className="fl-song" kind="song">
      <div className="fl-disc" data-spin={!!fl.audio?.playing} aria-hidden><i /></div>
      <Eyebrow>{fl.txt(b.artist)}</Eyebrow>
      <Head>{fl.txt(b.title)}</Head>
      <Para>{fl.txt(b.story)}</Para>
      {fl.txt(b.memory) && <Para className="fl-quote">{fl.txt(b.memory)}</Para>}
      <div className="fl-after">
        {own && fl.audio && <Btn ghost onClick={fl.audio.toggle}>{fl.audio.playing ? fl.s("pauseVoice") : fl.s("playSong")}</Btn>}
        {link && <a className="fl-btn fl-btn-ghost" href={link} target="_blank" rel="noopener noreferrer">{fl.s("playSong")}</a>}
        <Btn onClick={fl.next}>{fl.s("continue")}</Btn>
      </div>
    </Beat>
  );
}

// ── a video, a photograph, a few words ─────────────────────────────────────────────────────────────────
export function Media({ b }: { b: Of<"media"> }) {
  const fl = useFL();
  const link = fl.txt(b.video) ? streamLink(fl.txt(b.video)) : null;
  const [play, setPlay] = useState(false);
  return (
    <Beat className="fl-media" kind="media">
      <Head>{fl.txt(b.title)}</Head>
      {b.photo && fl.txt(b.photo) && <Pic id={fl.txt(b.photo)} className="fl-media-photo" />}
      {link?.embed && (play
        ? <div className="fl-video"><iframe src={link.embed} title={fl.s("videoPlay")} allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" /></div>
        : <div className="fl-after"><Btn ghost onClick={() => setPlay(true)}>{fl.s("videoPlay")}</Btn><p className="fl-note">{fl.s("videoNote")}</p></div>)}
      {link && !link.embed && <a className="fl-btn fl-btn-ghost" href={link.href} target="_blank" rel="noopener noreferrer">{fl.s("videoPlay")}</a>}
      <Para>{fl.txt(b.text)}</Para>
      <div className="fl-after"><Btn onClick={fl.next}>{fl.s("continue")}</Btn></div>
    </Beat>
  );
}

// ── the invitation itself ──────────────────────────────────────────────────────────────────────────────
export function Invite({ b }: { b: Of<"invite"> }) {
  const fl = useFL();
  const ideaKey = fl.txt(b.idea);
  const idea = ideaKey === "custom" ? fl.txt(b.custom) : ideaKey;
  const where = fl.txt(b.where);
  const hidden = !!b.hideWhere && fl.txt(b.hideWhere) !== "1";
  const IDEA: Record<string, string> = { coffee: "Coffee", dinner: "Dinner", walk: "A walk", movie: "A movie" };
  return (
    <Beat className="fl-invite" kind="invite">
      <Eyebrow>{fl.s("invitation")}</Eyebrow>
      <Head>{fl.txt(b.title)}</Head>
      <div className="fl-ticket fl-pop">
        {idea && <p className="fl-chip">{IDEA[idea] ?? idea}</p>}
        {fl.txt(b.when) && <p className="fl-ticket-row"><span>{fl.s("when")}</span><b>{fl.txt(b.when)}</b></p>}
        {(where || hidden) && <p className="fl-ticket-row"><span>{fl.s("where")}</span><b>{hidden || !where ? fl.s("placeSecret") : where}</b></p>}
        <Heart className="fl-ticket-heart" />
      </div>
      <Para>{fl.txt(b.note)}</Para>
      <div className="fl-after"><Btn onClick={fl.next}>{b.cta ?? fl.s("continue")}</Btn></div>
    </Beat>
  );
}

// ── the end ────────────────────────────────────────────────────────────────────────────────────────────
export function Closing({ b }: { b: Of<"closing"> }) {
  const fl = useFL();
  useEffect(() => { if (b.scene === "petals" || b.scene === "light") fl.fire(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = rowsOf(fl.txt(b.src));
  return (
    <Beat className={`fl-closing fl-closing-${b.scene ?? "dusk"}`} kind="closing">
      <Head>{rows[0]}</Head>
      <div className="fl-rows">{rows.slice(1).map((r, i) => <p key={i} className="fl-line fl-rise" style={{ animationDelay: `${0.6 + i * 0.9}s` }}>{r}</p>)}</div>
      {fl.txt(b.quote) && <blockquote className="fl-quote fl-rise" style={{ animationDelay: `${0.8 + rows.length * 0.9}s` }}>{fl.txt(b.quote)}</blockquote>}
      <p className="fl-sign fl-rise" style={{ animationDelay: `${1.2 + rows.length * 0.9}s` }}>{fl.names.anonymous ? fl.s("signedAnon") : fl.s("signed", { name: fl.names.sign })}</p>
    </Beat>
  );
}
