"use client";
import type { CSSProperties } from "react";
import { CalendarPlus, MapPin } from "lucide-react";
import type { SectionConfig, WeddingEvent } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { useSlot } from "../engine/images";
import { Photo } from "../engine/Photo";
import { Reveal, RevealWords } from "../engine/motion";
import { useSubject } from "../engine/subject";
import { Shell, useCopy } from "./shared";
import { useEventParts } from "./EventsSection";

/**
 * The grand finale: the last scene of the invitation. The child’s portrait arrives in a soft glow with a few motes of gold, then the name,
 * a closing blessing and the essentials of the day — when, where, add it to a calendar, find the way, reply. Everything on it is the
 * invitation’s own (the portrait is the opening photograph, the day is the main event); the blessing is the section’s “Introduction”,
 * editable like any other wording. Hide it, move it or change its look (Heavenly / Royal / Floral / Minimal) from the editor.
 */
const KINDS = ["heavenly", "royal", "floral", "minimal"] as const;

function Day({ e, reply }: { e: WeddingEvent; reply: boolean }) {
  const p = useEventParts(e);
  return (
    <>
      <p className="fin-details">
        <strong className="inv-num">{p.long}</strong>
        {(p.time || p.venueName) && <span>{[p.time, p.venueName].filter(Boolean).join(" · ")}</span>}
      </p>
      <Reveal delay={260} className="fin-actions">
        {e.date && <button type="button" className="inv-btn inv-btn-ghost inv-btn-sm" onClick={p.addToCalendar}><CalendarPlus className="size-3.5" /> {p.t("events.calendar")}</button>}
        {p.directions && <a className="inv-btn inv-btn-ghost inv-btn-sm" href={p.directions} target="_blank" rel="noopener noreferrer"><MapPin className="size-3.5" /> {p.t("events.maps")}</a>}
        {reply && <a className="inv-btn inv-btn-sm" href="#s-rsvp">{p.t("finale.reply")}</a>}
      </Reveal>
    </>
  );
}

export default function FinaleSection({ section }: { section: SectionConfig }) {
  const { view, t } = useInvitation();
  const names = useSubject();
  const photo = useSlot("couple");
  const copy = useCopy(section, { eyebrow: "finale.eyebrow" });
  const kind = (KINDS as readonly string[]).includes(section.variant) ? section.variant : "heavenly";
  const main = view.doc.events.find((e) => e.isMain) ?? view.doc.events[0];
  const reply = view.doc.sections.some((s) => s.type === "rsvp" && s.enabled);
  const blessing = copy.intro || t("finale.blessing", { name: names.a });
  const len = names.a.length <= 13 ? undefined : names.a.length <= 26 ? "medium" : "long";
  return (
    <Shell section={section} wide={false}>
      <div data-fin={kind}>
        <Reveal variant="fade" className="fin">
          {copy.eyebrow && <p className="inv-eyebrow fin-eyebrow">{copy.eyebrow}</p>}
          <Reveal variant="mask" className="fin-portrait">
            <div className="fin-frame"><Photo id={photo} priority={false} className="absolute inset-0 h-full w-full" seed={5} sizes="(max-width: 768px) 70vw, 280px" alt={names.a} /></div>
          </Reveal>
          <h2 className="fin-name" data-len={len}><RevealWords as="span" text={names.a} delay={300} /></h2>
          <Reveal delay={420}><p className="fin-blessing">{blessing}</p></Reveal>
          {main && <Day e={main} reply={reply} />}
          <span className="fin-motes" aria-hidden>
            {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ "--x": `${(i * 43 + 8) % 100}%`, "--s": `${0.6 + ((i * 7) % 8) / 10}`, "--d": `${7 + ((i * 3) % 6)}s`, "--l": `${-((i * 1.9) % 9).toFixed(1)}s` } as CSSProperties} />)}
          </span>
        </Reveal>
      </div>
    </Shell>
  );
}
