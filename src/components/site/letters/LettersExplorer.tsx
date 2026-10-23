"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reel } from "@/components/site/Reel";
import type { LetterCard } from "@/domain/letters";

type Tag = { key: string; label: string };
const href = (c: LetterCard) => `/for-my-love/letters/${c.slug}`;

/** Three colour dots: the page, the accent and the highlight of an experience — its colour identity, shown and nothing more. */
const Dots = ({ colors }: { colors: string[] }) => (
  <span className="flex items-center gap-1.5" aria-hidden>{colors.map((hex, i) => <span key={i} className="size-3.5 rounded-full border border-white/30" style={{ background: hex }} />)}</span>
);

// ── the moving strip ──────────────────────────────────────────────────────────────────────────────────
/**
 * A slow, readable strip of covers. It drifts only while it is on screen and the page is in view, and it stops for the pointer,
 * for keyboard focus, for a finger on it, while the visitor scrolls it themselves, with the pause button, and for reduced motion.
 * Without JavaScript it is an ordinary row you can scroll sideways.
 */
function Strip({ cards, onPreview }: { cards: LetterCard[]; onPreview: (c: LetterCard) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const state = useRef({ pos: 0, hold: 0, visible: false, hovered: false, focused: false, user: false });
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || reduced) return;
    const s = state.current;
    s.pos = el.scrollLeft;
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; });
    io.observe(el);
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      const hold = s.hold > t;
      if (s.visible && !document.hidden && !pausedRef.current && !s.hovered && !s.focused && !hold) {
        const half = el.scrollWidth / 2;
        s.pos += dt * 26; // 26 px a second: slow enough to read every title
        if (half > 0 && s.pos >= half) s.pos -= half;
        el.scrollLeft = s.pos;
      } else if (!pausedRef.current) s.pos = el.scrollLeft;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [reduced]);

  const hold = (ms = 3000) => { state.current.hold = performance.now() + ms; };
  const by = (dir: 1 | -1) => { hold(4000); const el = box.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" }); };
  const wrapped = [...cards, ...cards];

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label="Forever Letters, a moving preview">
      <div
        ref={box} tabIndex={0}
        className="flex gap-4 overflow-x-auto px-5 pb-3 pt-1 [scrollbar-width:none] sm:gap-5 sm:px-8 [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]"
        onPointerEnter={(e) => { if (e.pointerType === "mouse") state.current.hovered = true; }} onPointerLeave={() => { state.current.hovered = false; }}
        onFocus={() => { state.current.focused = true; }} onBlur={() => { state.current.focused = false; }}
        onTouchStart={() => hold(6000)} onTouchEnd={() => hold(2500)} onWheel={() => hold(3000)}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); by(1); } if (e.key === "ArrowLeft") { e.preventDefault(); by(-1); } }}
      >
        {wrapped.map((c, i) => {
          const dup = i >= cards.length;
          return (
            <div key={`${c.slug}-${i}`} className="group relative w-[8.4rem] shrink-0 sm:w-[10.5rem]" aria-hidden={dup || undefined}>
              <Link href={href(c)} tabIndex={dup ? -1 : 0} className="block rounded-xl focus-visible:outline-offset-4" onClick={() => hold(5000)}>
                <span className="relative block aspect-[9/17] overflow-hidden rounded-[1.1rem] border-[3px] border-white/25 bg-white/5 transition duration-500 group-hover:-translate-y-1" style={{ boxShadow: `0 24px 36px -24px ${c.colors[1]}` }}>
                  {/* eager: a lazy image inside a sideways-scrolling row is not reliably fetched, and each cover is a ~25 KB picture */}
                  <img src={c.cover} alt="" width={540} height={1020} loading="eager" fetchPriority={i < 8 ? "high" : "low"} decoding="async" className="absolute inset-0 size-full object-cover object-top" />
                </span>
                <span className="mt-2.5 block font-serif text-[15.5px] leading-tight text-white">{c.title}</span>
              </Link>
              <button type="button" tabIndex={dup ? -1 : 0} onClick={() => onPreview(c)} className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white opacity-0 backdrop-blur transition focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100" aria-label={`Preview: ${c.title}`}>Try</button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <button type="button" onClick={() => by(-1)} className="grid size-11 place-items-center rounded-full border border-white/25 text-white hover:bg-white/10" aria-label="Previous experiences"><ChevronLeft className="size-5" /></button>
        {!reduced && <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} className="grid size-11 place-items-center rounded-full border border-white/25 text-white hover:bg-white/10" aria-label={paused ? "Play the moving preview" : "Pause the moving preview"}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>}
        <button type="button" onClick={() => by(1)} className="grid size-11 place-items-center rounded-full border border-white/25 text-white hover:bg-white/10" aria-label="Next experiences"><ChevronRight className="size-5" /></button>
      </div>
    </div>
  );
}

// ── an interactive preview ─────────────────────────────────────────────────────────────────────────────
/** The real experience, played on a phone: example words, nothing sent anywhere, and a label that says so. */
function PreviewDialog({ card, onClose }: { card: LetterCard | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (card && !d.open) d.showModal();
    if (!card && d.open) d.close();
  }, [card]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-label={card ? `Preview of ${card.title}` : "Preview"} className="m-auto w-[min(26rem,94vw)] rounded-3xl border-0 bg-transparent p-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm">
      {card && (
        <div className="rounded-3xl bg-[#17101a] p-3 text-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
            <p className="min-w-0 truncate font-serif text-[20px] leading-tight">{card.title}</p>
            <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close preview"><X className="size-5" /></button>
          </div>
          <div className="overflow-hidden rounded-[1.9rem] border-[7px] border-black bg-black">
            <iframe src={`/for-my-love/letter-demo/${card.slug}`} title={`${card.title}, a demonstration`} loading="lazy" className="block h-[min(38rem,72dvh)] w-full border-0 bg-white" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-3">
            <Link href={href(card)} className="text-[14px] text-white/80 underline underline-offset-4 hover:text-white">About this one</Link>
            <Link href={`/for-my-love/make?letter=${card.slug}`} className="btn btn-sm bg-white text-ink hover:bg-white/90" data-track="cta_click" data-ref={`letter-preview-make-${card.slug}`}>Make this letter <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </div>
      )}
    </dialog>
  );
}

// ── the whole thing ────────────────────────────────────────────────────────────────────────────────────
export function LettersExplorer({ cards, tags, strip = true }: { cards: LetterCard[]; tags: Tag[]; strip?: boolean }) {
  const [tag, setTag] = useState("");
  const [open, setOpen] = useState<LetterCard | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const shown = tag ? cards.filter((c) => c.tags.includes(tag as never)) : cards;
  const count = (k: string) => cards.filter((c) => c.tags.includes(k as never)).length;
  return (
    <div>
      {strip && cards.length > 3 && <div className="-mx-5 sm:-mx-8"><Strip cards={cards} onPreview={setOpen} /></div>}

      <div className="mt-12" id="all-letters">
        <div role="group" aria-label="Filter the experiences" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={tag === ""} onClick={() => setTag("")} className={cn("min-h-11 rounded-full border px-4 text-[14.5px] font-medium transition", tag === "" ? "border-white bg-white text-[#1a0f1c]" : "border-white/25 text-white/85 hover:border-white/60")}>All <span className="opacity-60">{cards.length}</span></button>
          {tags.map((t) => (
            <button key={t.key} type="button" aria-pressed={tag === t.key} onClick={() => setTag(t.key)} className={cn("min-h-11 rounded-full border px-4 text-[14.5px] font-medium transition", tag === t.key ? "border-white bg-white text-[#1a0f1c]" : "border-white/25 text-white/85 hover:border-white/60")}>{t.label} <span className="opacity-60">{count(t.key)}</span></button>
          ))}
        </div>
        <p className="sr-only" role="status" aria-live="polite">{shown.length} experiences shown</p>

        <ul className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
          {shown.map((c, i) => (
            <li key={c.slug} className="reel-card group relative">
              <Link href={href(c)} className="block rounded-2xl focus-visible:outline-offset-4" aria-label={c.title}>
                <span className="relative mx-auto block aspect-[9/17] w-full overflow-hidden rounded-[1.5rem] border-[4px] border-white/20 bg-white/5 transition duration-500 group-hover:-translate-y-1.5" style={{ boxShadow: `0 30px 50px -30px ${c.colors[1]}` }}>
                  <Reel slug={c.slug} src={c.tall} thumb={c.cover} alt={`${c.title}, a Forever Letter`} eager={i < 4} className="absolute inset-0" />
                </span>
                <span className="mt-3.5 flex items-start justify-between gap-3">
                  <span className="font-serif text-[20px] font-medium leading-[1.15] text-white group-hover:text-[#f6c1cd] sm:text-[22px]">{c.title}</span>
                </span>
              </Link>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Dots colors={c.colors} />
                <button type="button" onClick={() => setOpen(c)} className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/75 hover:text-white" aria-label={`Preview: ${c.title}`}>Try it <ArrowRight className="size-3.5" aria-hidden /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <PreviewDialog card={open} onClose={close} />
    </div>
  );
}
