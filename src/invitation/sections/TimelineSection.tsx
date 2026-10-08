"use client";
import { useEffect, useRef } from "react";
import type { SectionConfig, LocalizedText } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal, useInView } from "../engine/motion";
import { Shell, SectionHead, useCopy } from "./shared";

interface Milestone { id: string; when: LocalizedText; title: LocalizedText; body: LocalizedText; photo?: string }

/** Milestones come from the story's "beginning" list; older weddings simply show their chapters. */
function useMilestones(): Milestone[] {
  const { view } = useInvitation();
  const s = view.doc.story;
  if (s.milestones.length) return s.milestones.map((m) => ({ id: m.id, when: { en: m.year }, title: m.title, body: m.caption, photo: m.photo }));
  return s.chapters.map((c) => ({ id: c.id, when: c.when, title: c.title, body: c.body, photo: c.photo }));
}

function Mile({ m, i }: { m: Milestone; i: number }) {
  const { L } = useInvitation();
  const [ref, inView] = useInView<HTMLLIElement>({ threshold: 0.3 });
  return (
    <li ref={ref} className={`mile ${inView ? "in" : ""}`}>
      <div className="mile-main">
        <Reveal><p className="mile-year" aria-label={L(m.when)}>{L(m.when)}</p></Reveal>
        <Reveal delay={120} className="mile-body">
          <h3 className="mile-title">{L(m.title)}</h3>
          {L(m.body) && <p className="mile-text">{L(m.body)}</p>}
        </Reveal>
      </div>
      {m.photo && <Reveal variant="mask" delay={160} className="mile-photo"><Photo id={m.photo} ratio="aspect-[4/5]" className="w-full" seed={i + 2} sizes="(max-width: 900px) 80vw, 352px" /></Reveal>}
    </li>
  );
}

/** A line that draws itself down the page as the guest scrolls through the milestones. */
function useDrawLine() {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const mid = window.innerHeight * 0.62;
      el.style.setProperty("--draw", Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height))).toFixed(3));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return ref;
}

function Vertical({ items }: { items: Milestone[] }) {
  const ref = useDrawLine();
  return (
    <ol ref={ref} className="miles">
      <span aria-hidden className="miles-draw" />
      {items.map((m, i) => (<Mile key={m.id} m={m} i={i} />))}
    </ol>
  );
}

/** Compact "our journey" strip: a horizontal, swipeable line of dated moments. */
function Horizontal({ items, label }: { items: Milestone[]; label: string }) {
  const { L } = useInvitation();
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0" tabIndex={0} aria-label={label}>
      <ol className="relative flex min-w-max gap-10 pt-8 md:min-w-0 md:justify-between">
        <span aria-hidden className="absolute left-0 right-0 top-[0.45rem] h-px bg-[var(--c-border)]" />
        {items.map((m, i) => (
          <Reveal as="li" key={m.id} delay={i * 80} className="relative w-56 shrink-0 md:w-auto md:flex-1">
            <span aria-hidden className="absolute -top-8 left-0 size-3 rounded-full bg-[var(--c-accent)] ring-4 ring-[var(--c-bg)]" />
            <p className="inv-num text-[1.9rem] text-[var(--c-primary)]">{L(m.when)}</p>
            <p className="inv-h4 mt-1">{L(m.title)}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

export default function TimelineSection({ section }: { section: SectionConfig }) {
  const copy = useCopy(section, { eyebrow: "timeline.eyebrow", title: "timeline.title" });
  const items = useMilestones();
  if (!items.length) return null;
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-14" />
      {section.variant === "horizontal" ? <Horizontal items={items} label={copy.title} /> : <Vertical items={items} />}
    </Shell>
  );
}
