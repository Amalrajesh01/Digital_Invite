"use client";
import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { Shell, SectionHead, useCopy } from "./shared";

function HowWeMet() {
  const { view, L, t } = useInvitation();
  const h = view.doc.story.howWeMet;
  if (!L(h.body)) return null;
  return (
    <div className="mb-20 grid items-center gap-10 md:mb-32 md:grid-cols-2 md:gap-16">
      <Reveal variant="mask"><Photo id={h.photo} ratio="aspect-[5/4]" className="w-full" seed={9} sizes="(max-width: 768px) 100vw, 560px" /></Reveal>
      <Reveal delay={150}>
        <p className="inv-eyebrow">{t("story.howWeMet")}</p>
        <h3 className="inv-h2 mt-3 !text-[clamp(1.9rem,6vw,3rem)]">{L(h.title) || t("story.howWeMet")}</h3>
        <p className="mt-5 whitespace-pre-line text-[1.05rem] leading-[1.9]">{L(h.body)}</p>
      </Reveal>
    </div>
  );
}

function Chapters({ cards }: { cards?: boolean }) {
  const { view, L } = useInvitation();
  const list = view.doc.story.chapters;
  if (!list.length) return null;
  if (cards) {
    return (
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0" tabIndex={0} aria-label="Story">
        {list.map((c, i) => (
          <Reveal key={c.id} delay={i * 80} className="inv-card w-[78vw] max-w-[22rem] shrink-0 snap-center overflow-hidden md:w-auto md:max-w-none">
            <Photo id={c.photo} ratio="aspect-[4/3]" seed={i} sizes="(max-width: 768px) 78vw, 380px" />
            <div className="p-6">
              <p className="inv-eyebrow">{L(c.when)}</p>
              <h3 className="inv-h3 mt-2">{L(c.title)}</h3>
              <p className="inv-muted mt-3 text-[0.98rem] leading-[1.8]">{L(c.body)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    );
  }
  return (
    <ol className="relative mx-auto max-w-5xl">
      <span aria-hidden className="absolute bottom-0 left-[0.55rem] top-2 w-px bg-[var(--c-border)] md:left-1/2" />
      {list.map((c, i) => {
        const left = i % 2 === 0;
        return (
          <li key={c.id} className={cn("relative pb-16 pl-10 last:pb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0")}>
            <span aria-hidden className="absolute left-0 top-2 size-[1.15rem] rounded-full border border-[var(--c-accent)] bg-[var(--c-bg)] md:left-1/2 md:-translate-x-1/2"><span className="absolute inset-[4px] rounded-full bg-[var(--c-accent)]" /></span>
            <Reveal variant={left ? "left" : "right"} className={cn(left ? "md:text-right" : "md:col-start-2")}>
              <p className="inv-eyebrow">{L(c.when)}</p>
              <h3 className="inv-h3 mt-2">{L(c.title)}</h3>
              <p className="inv-muted mt-3 max-w-md text-[1rem] leading-[1.85] md:inline-block">{L(c.body)}</p>
            </Reveal>
            <Reveal variant="mask" delay={120} className={cn("mt-6 md:mt-0", left ? "md:col-start-2 md:row-start-1" : "md:col-start-1 md:row-start-1")}>
              <Photo id={c.photo} ratio="aspect-[4/3]" className="w-full" seed={i + 2} sizes="(max-width: 768px) 100vw, 480px" />
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}

function ThenNow() {
  const { view, L, t } = useInvitation();
  const list = view.doc.story.thenNow;
  const [pos, setPos] = useState<Record<string, number>>({});
  if (!list.length) return null;
  return (
    <div className="mt-24">
      <div className="mb-8 text-center">
        <p className="inv-eyebrow">{t("story.thenNow")}</p>
      </div>
      <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2">
        {list.map((p) => {
          const v = pos[p.id] ?? 50;
          return (
            <Reveal key={p.id}>
              <div className="relative aspect-[4/5] select-none overflow-hidden rounded-[var(--r)]">
                <Photo id={p.now} className="absolute inset-0" seed={1} />
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - v}% 0 0)` }}>
                  <Photo id={p.then} className="absolute inset-0" seed={2} />
                </div>
                <span aria-hidden className="absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,.15)]" style={{ left: `${v}%` }}>
                  <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[0.7rem] text-black shadow">↔</span>
                </span>
                <input
                  type="range" min={0} max={100} value={v}
                  onChange={(e) => setPos((s) => ({ ...s, [p.id]: Number(e.target.value) }))}
                  aria-label={`${t("story.thenNow")}: ${t("story.drag")}`}
                  className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                />
              </div>
              <p className="mt-3 text-center inv-muted text-[0.92rem]">{L(p.label)} · {t("story.drag")}</p>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

function MemoryDeck() {
  const { view, L, t } = useInvitation();
  const cards = view.doc.story.memoryCards;
  if (!cards.length) return null;
  return (
    <div className="mt-28">
      <p className="inv-eyebrow mb-8 text-center">{t("story.memories")}</p>
      <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[11vw] pb-6 md:mx-0 md:justify-center md:overflow-visible md:px-0" tabIndex={0} aria-label={t("story.memories")}>
        {cards.map((c, i) => (
          <article key={c.id} className="inv-card w-[78vw] max-w-[19rem] shrink-0 snap-center overflow-hidden md:w-64" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 1.6}deg)` }}>
            <Photo id={c.photo} ratio="aspect-square" seed={i + 3} sizes="(max-width: 768px) 78vw, 300px" />
            <div className="p-5">
              <h4 className="inv-h4">{L(c.title)}</h4>
              <p className="inv-muted mt-1 text-[0.94rem] leading-[1.7]">{L(c.body)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Personality() {
  const { view, L, t } = useInvitation();
  const p = view.doc.story.personality;
  if (!p.bride.length && !p.groom.length) return null;
  const col = (title: string, rows: typeof p.bride) => (
    <div className="inv-card p-7">
      <p className="inv-eyebrow">{title}</p>
      <dl className="mt-5 divide-y divide-[var(--c-border)]">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[7.5rem_1fr] gap-4 py-3.5">
            <dt className="inv-muted text-[0.86rem] uppercase tracking-[0.14em]">{L(r.label)}</dt>
            <dd className="inv-h4 !font-normal">{L(r.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
  return (
    <div className="mt-28">
      <p className="inv-eyebrow mb-8 text-center">{t("story.personality")}</p>
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <Reveal>{col(t("couple.bride"), p.bride)}</Reveal>
        <Reveal delay={120}>{col(t("couple.groom"), p.groom)}</Reveal>
      </div>
    </div>
  );
}

function VoiceStory() {
  const { view, media, L, t } = useInvitation();
  const v = view.doc.story.voiceStory;
  const m = media(v.audio);
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const { music } = useInvitation();
  if (!m || m.kind !== "AUDIO") return null;
  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      music.pause(); // don't compete with the background music
      void a.play();
    } else a.pause();
  };
  return (
    <Reveal className="mx-auto mt-28 max-w-xl text-center">
      <button type="button" onClick={toggle} className="inv-btn inv-btn-ghost mx-auto !rounded-full !px-6" aria-pressed={playing}>
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />} {t("story.listen")}
      </button>
      <audio ref={ref} src={m.url} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      {L(v.transcript) && <p className="inv-muted mt-6 whitespace-pre-line text-[0.98rem] leading-[1.8]">{L(v.transcript)}</p>}
    </Reveal>
  );
}

export default function StorySection({ section }: { section: SectionConfig }) {
  const { has, view } = useInvitation();
  const copy = useCopy(section, { title: "story.title" });
  const s = section.settings as Record<string, boolean | undefined>;
  const extras = has("couple_extras");
  const cards = section.variant === "cards";
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-12" />
      {s.showHowWeMet !== false && <HowWeMet />}
      <Chapters cards={cards} />
      {extras && s.showThenNow !== false && <ThenNow />}
      {extras && s.showMemoryCards !== false && <MemoryDeck />}
      {extras && s.showPersonality !== false && <Personality />}
      {s.showVoice !== false && <VoiceStory />}
      {view.doc.story.chapters.length === 0 && null}
    </Shell>
  );
}
