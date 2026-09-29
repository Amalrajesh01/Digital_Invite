"use client";
import type { SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Reveal } from "../engine/motion";
import { Shell, SectionHead, useCopy } from "./shared";

/** Compact "our journey" strip: a horizontal, swipeable line of dated moments. */
export default function TimelineSection({ section }: { section: SectionConfig }) {
  const { view, L } = useInvitation();
  const copy = useCopy(section, { title: "story.timeline" });
  const chapters = view.doc.story.chapters;
  if (!chapters.length) return null;
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} className="!mb-10" />
      <div className="-mx-5 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0" tabIndex={0} aria-label={copy.eyebrow}>
        <ol className="relative flex min-w-max gap-10 pt-8 md:min-w-0 md:justify-between">
          <span aria-hidden className="absolute left-0 right-0 top-[0.45rem] h-px bg-[var(--c-border)]" />
          {chapters.map((c, i) => (
            <Reveal as="li" key={c.id} delay={i * 80} className="relative w-56 shrink-0 md:w-auto md:flex-1">
              <span aria-hidden className="absolute -top-8 left-0 size-3 rounded-full bg-[var(--c-accent)] ring-4 ring-[var(--c-bg)]" />
              <p className="inv-num text-[1.7rem] text-[var(--c-primary)]">{L(c.when)}</p>
              <p className="inv-h4 mt-1">{L(c.title)}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </Shell>
  );
}
