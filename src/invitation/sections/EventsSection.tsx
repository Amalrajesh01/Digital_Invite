"use client";
import { CalendarPlus, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig, Venue, WeddingEvent } from "@/domain/doc/schema";
import { sortEvents } from "@/domain/wedding/view";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { buildIcs, downloadText, eventStart, fmtDate, fmtRange, mapsUrl } from "../engine/format";
import { Shell, SectionHead, useCopy } from "./shared";

function useEventParts(e: WeddingEvent) {
  const { view, L, locale, t } = useInvitation();
  const venue: Venue | undefined = view.doc.venues.find((v) => v.id === e.venueId);
  const tz = view.wedding.timezone;
  const where = venue ? [L(venue.name), L(venue.city)].filter(Boolean).join(", ") : "";
  const directions = venue ? mapsUrl({ mapUrl: e.mapUrl || venue.mapUrl, lat: venue.lat, lng: venue.lng, query: `${L(venue.name)} ${L(venue.address)}` }) : e.mapUrl || "";
  const addToCalendar = () => {
    const start = eventStart(e, tz);
    if (!start) return;
    const end = e.endTime ? (eventStart({ date: e.date, startTime: e.endTime }, tz) as Date) : new Date(start.getTime() + 2 * 3600e3);
    downloadText(`${L(e.name).replace(/[^\p{L}\p{N}]+/gu, "-")}.ics`, "text/calendar", buildIcs({ id: e.id, title: `${L(e.name)} — ${view.wedding.title}`, description: L(e.description), location: venue ? `${L(venue.name)}, ${L(venue.address)}` : "", start, end: end.getTime() > start.getTime() ? end : new Date(start.getTime() + 2 * 3600e3), url: `${location.origin}/invite/${view.wedding.slug}` }));
  };
  return { venue, where, directions, addToCalendar, time: fmtRange(e, locale), day: fmtDate(e.date, locale, "day"), month: fmtDate(e.date, locale, "month"), weekday: fmtDate(e.date, locale, "weekday"), long: fmtDate(e.date, locale, "long"), t, L };
}

function Actions({ e }: { e: WeddingEvent }) {
  const p = useEventParts(e);
  return (
    <div className="mt-5 flex flex-wrap gap-2.5">
      {e.date && <button type="button" className="inv-btn inv-btn-ghost inv-btn-sm" onClick={p.addToCalendar}><CalendarPlus className="size-3.5" /> {p.t("events.calendar")}</button>}
      {p.directions && <a className="inv-btn inv-btn-ghost inv-btn-sm" href={p.directions} target="_blank" rel="noopener noreferrer"><Navigation className="size-3.5" /> {p.t("events.directions")}</a>}
    </div>
  );
}

function Details({ e }: { e: WeddingEvent }) {
  const { L, t } = useInvitation();
  return (
    <>
      {L(e.description) && <p className="inv-muted mt-4 text-[1rem] leading-[1.8]">{L(e.description)}</p>}
      {(L(e.dressCode) || e.dressColors.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.94rem]">
          <span className="inv-eyebrow !text-[0.66rem] opacity-80">{t("events.dressCode")}</span>
          <span>{L(e.dressCode)}</span>
          <span className="flex gap-1.5" aria-hidden>{e.dressColors.map((c) => (<span key={c} className="size-4 rounded-full border border-black/15" style={{ background: c }} />))}</span>
        </div>
      )}
      {L(e.notes) && <p className="mt-3 border-l-2 border-[var(--c-accent)] pl-3 text-[0.92rem] inv-muted">{L(e.notes)}</p>}
      {(L(e.ritual.title) || L(e.ritual.body)) && (
        <details className="mt-4 group">
          <summary className="cursor-pointer list-none text-[0.88rem] font-medium text-[var(--c-primary)] underline-offset-4 hover:underline">
            {t("events.ritual")}: {L(e.ritual.title)}
          </summary>
          <p className="mt-2 text-[0.96rem] leading-[1.8]">{L(e.ritual.body)}</p>
        </details>
      )}
    </>
  );
}

function Ticket({ e, i }: { e: WeddingEvent; i: number }) {
  const p = useEventParts(e);
  return (
    <Reveal delay={(i % 2) * 120} className="ticket inv-card overflow-hidden">
      <div className="flex">
        <div className="ticket-stub flex w-[5.6rem] shrink-0 flex-col items-center justify-start bg-[var(--c-primary)] px-2 pb-6 pt-8 text-center text-[var(--c-on-primary)] md:w-28">
          <span className="inv-eyebrow !text-[0.6rem] !text-current opacity-80">{p.weekday.slice(0, 3)}</span>
          <span className="inv-num text-[2.9rem] leading-none md:text-[3.4rem]">{p.day}</span>
          <span className="inv-eyebrow !text-[0.62rem] !text-current">{p.month.slice(0, 3)}</span>
        </div>
        <div className="min-w-0 flex-1 p-6 md:p-7">
          {e.isMain && <p className="inv-eyebrow mb-2 !text-[var(--c-accent)]">{p.t("events.main")}</p>}
          <h3 className="inv-h3">{p.L(e.name)}</h3>
          <p className="inv-num mt-1 text-[1.15rem] text-[var(--c-primary)]">{p.time}</p>
          {p.where && <p className="mt-2 flex items-start gap-1.5 text-[0.96rem]"><MapPin className="mt-1 size-3.5 shrink-0 text-[var(--c-accent)]" /> {p.where}</p>}
          <Details e={e} />
          <Actions e={e} />
        </div>
      </div>
    </Reveal>
  );
}

function DayTimeline({ events }: { events: WeddingEvent[] }) {
  const { locale } = useInvitation();
  const days = [...new Set(events.map((e) => e.date))];
  return (
    <div className="mx-auto max-w-4xl space-y-16">
      {days.map((d) => (
        <div key={d} className="grid gap-6 md:grid-cols-[11rem_1fr] md:gap-12">
          <div className="md:sticky md:top-8 md:self-start">
            <p className="inv-num text-[3.6rem] leading-none text-[var(--c-accent)]">{fmtDate(d, locale, "day")}</p>
            <p className="inv-eyebrow mt-2">{fmtDate(d, locale, "month")}</p>
            <p className="inv-muted text-[0.9rem]">{fmtDate(d, locale, "weekday")}</p>
          </div>
          <ol className="relative space-y-10 border-l border-current/20 pl-8">
            {events.filter((e) => e.date === d).map((e, i) => (<TimelineItem key={e.id} e={e} i={i} />))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function TimelineItem({ e, i }: { e: WeddingEvent; i: number }) {
  const p = useEventParts(e);
  return (
    <Reveal as="li" delay={i * 80} className="relative">
      <span aria-hidden className="absolute -left-[2.45rem] top-2 size-3 rounded-full bg-[var(--c-accent)] ring-4 ring-[var(--c-bg)]" />
      <p className="inv-num text-lg text-[var(--c-accent)]">{p.time}</p>
      <h3 className="inv-h3 mt-1">{p.L(e.name)}</h3>
      {p.where && <p className="mt-1 text-[0.96rem] opacity-80">{p.where}</p>}
      <Details e={e} />
      <Actions e={e} />
    </Reveal>
  );
}

function EditorialRow({ e, i }: { e: WeddingEvent; i: number }) {
  const p = useEventParts(e);
  return (
    <Reveal className="grid gap-5 border-t border-[var(--c-border)] py-9 md:grid-cols-[6rem_1.2fr_1fr] md:gap-10">
      <span className="inv-num text-[2.6rem] leading-none text-[var(--c-accent)]">{String(i + 1).padStart(2, "0")}</span>
      <div>
        <h3 className="inv-h2 !text-[clamp(1.8rem,6vw,3rem)]">{p.L(e.name)}</h3>
        <Details e={e} />
      </div>
      <div className="md:pt-2">
        <p className="inv-num text-xl">{p.long}</p>
        <p className="inv-num text-[var(--c-primary)]">{p.time}</p>
        {p.where && <p className="mt-2 inv-muted">{p.where}</p>}
        {e.photo && <Photo id={e.photo} ratio="aspect-[4/3]" className="mt-4 w-full" seed={i} sizes="(max-width: 768px) 100vw, 360px" />}
        <Actions e={e} />
      </div>
    </Reveal>
  );
}

export default function EventsSection({ section }: { section: SectionConfig }) {
  const { view } = useInvitation();
  const copy = useCopy(section, { title: "events.title" });
  const events = sortEvents(view.doc.events);
  if (!events.length) return null;
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-12" />
      {section.variant === "timeline" ? (
        <DayTimeline events={events} />
      ) : section.variant === "editorial" ? (
        <div className="mx-auto max-w-5xl border-b border-[var(--c-border)]">{events.map((e, i) => (<EditorialRow key={e.id} e={e} i={i} />))}</div>
      ) : (
        <div className={cn("mx-auto grid gap-6", events.length > 1 ? "max-w-6xl lg:grid-cols-2" : "max-w-2xl")}>{events.map((e, i) => (<Ticket key={e.id} e={e} i={i} />))}</div>
      )}
    </Shell>
  );
}
