"use client";
import "./personal.css";
import { useEffect, useRef, useState } from "react";
import { Armchair, BedDouble, CalendarPlus, Heart, Plane, Play, RotateCcw, Ticket, Utensils } from "lucide-react";
import type { SectionConfig } from "@/domain/doc/schema";
import { sortEvents } from "@/domain/wedding/view";
import { groupNote, groupNoteKind, nudgeLine, relationKind } from "@/domain/guests/messages";
import type { ResolvedMedia } from "@/domain/media/service";
import { daysBetween, todayInZone } from "@/lib/time";
import { useInvitation } from "../engine/context";
import { useSubject } from "../engine/subject";
import { useSlot } from "../engine/images";
import { useGuestVars } from "../engine/personal";
import { buildIcsAll, downloadText, eventStart, fmtDate, fmtRange } from "../engine/format";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { SectionHead, Shell, useCopy } from "./shared";

/**
 * What only a guest with a personal link sees (Luxury): a page that knows their reply, their own days, their table, their
 * travel tip — and, from the couple, a short message for their group. Everything here comes from the server already
 * filtered for this guest (see personalFor in src/domain/wedding/view.ts), so nothing meant for another group is on the page.
 */

type Mine = { wishes: { id: string; body: string }[]; photos: ResolvedMedia[] };

export function ForYouSection({ section }: { section: SectionConfig }) {
  const { view, t, L, locale, get, slug, isPreview } = useInvitation();
  const vars = useGuestVars();
  const names = useSubject();
  const copy = useCopy(section, { eyebrow: "foryou.eyebrow" });
  const g = view.guest;
  const status = view.wedding.status;
  const after = status === "POST_EVENT" || status === "MEMORY" || status === "ANNIVERSARY";
  const today = status === "LIVE_EVENT";

  // The countdown depends on today's date, so it is worked out after hydration, never on the server.
  const mainDate = view.doc.events.find((e) => e.isMain)?.date || view.wedding.weddingDate || "";
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (mainDate) setDays(daysBetween(todayInZone(view.wedding.timezone), mainDate));
  }, [mainDate, view.wedding.timezone]);

  const [mine, setMine] = useState<Mine | null>(null);
  useEffect(() => {
    if (!after || !g || g.isPreview) return;
    let live = true;
    get<Mine>("/mine").then((m) => live && setMine(m)).catch(() => undefined);
    return () => { live = false; };
  }, [after, g, get]);

  if (!g || !vars) return null;
  const first = vars.first ?? "";
  const rsvp = g.rsvp;
  const events = sortEvents(view.doc.events.filter((e) => e.date));
  const has = (type: string) => view.sections.some((s) => s.type === type);
  const kind = relationKind(g.relationship, g.groupKey);

  let title: string;
  let sub: string;
  if (after) { title = t("foryou.title.after", { first }); sub = t("foryou.sub.after"); }
  else if (today) { title = t("foryou.title.today", { first }); sub = t("foryou.sub.today"); }
  else if (rsvp?.status === "YES") { title = t("foryou.title.yes", { first, date: fmtDate(mainDate, locale, "long") }); sub = rsvp.attendingCount > 1 ? t("foryou.sub.yes", { n: rsvp.attendingCount }) : t("foryou.sub.yes.one"); }
  else if (rsvp?.status === "NO") { title = t("foryou.title.no", { first }); sub = t("foryou.sub.no"); }
  else if (rsvp?.status === "MAYBE") { title = t("foryou.title.maybe", { first }); sub = t("foryou.sub.maybe"); }
  else { title = g.seats > 1 ? t("foryou.title.pending", { first, n: g.seats }) : t("foryou.title.pending.one", { first }); sub = nudgeLine(kind, locale, first); }

  const answered = !!rsvp && rsvp.status !== "MAYBE";
  const addDays = () => {
    const items = events.flatMap((e) => {
      const start = eventStart(e, view.wedding.timezone);
      if (!start) return [];
      const end = e.endTime ? eventStart({ date: e.date, startTime: e.endTime }, view.wedding.timezone) : null;
      const venue = view.doc.venues.find((v) => v.id === e.venueId);
      return [{ id: e.id, title: `${L(e.name)} — ${view.wedding.title}`, description: L(e.description), location: venue ? `${L(venue.name)}, ${L(venue.address)}` : "", start, end: end && end > start ? end : new Date(start.getTime() + 2 * 3600e3), url: window.location.href.split("#")[0] }];
    });
    if (items.length) downloadText(`${slug}-my-days.ics`, "text/calendar", buildIcsAll(items));
  };

  const tip = view.doc.personal.travel[0];
  const details: { icon: React.ReactNode; label: string; value: string }[] = [
    ...(g.tableLabel ? [{ icon: <Armchair className="size-4" />, label: t("foryou.table"), value: g.tableLabel }] : []),
    ...(g.roomLabel ? [{ icon: <BedDouble className="size-4" />, label: t("foryou.room"), value: g.roomLabel }] : []),
    ...(rsvp?.meal ? [{ icon: <Utensils className="size-4" />, label: t("foryou.meal"), value: rsvp.meal }] : []),
  ];

  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} />
      <Reveal>
        <div className="fy-card">
          <Heart className="fy-heart" aria-hidden />
          <h2 className="fy-title">{title}</h2>
          <p className="fy-sub">{sub}</p>
          {!after && !today && days !== null && days >= 0 && rsvp?.status === "YES" && <p className="fy-count">{days === 1 ? t("foryou.countdown.one") : t("foryou.countdown", { n: days })}</p>}
          <div className="fy-actions">
            {!answered && !after && has("rsvp") && <a href="#s-rsvp" className="inv-btn">{t("foryou.reply")}</a>}
            {rsvp?.status === "YES" && !after && has("qrpass") && <a href="#s-qrpass" className="inv-btn"><Ticket className="size-4" /> {t("foryou.pass")}</a>}
            {!after && events.length > 0 && <button type="button" className="inv-btn inv-btn-ghost" onClick={addDays}><CalendarPlus className="size-4" /> {t("foryou.calendar")}</button>}
          </div>
        </div>
      </Reveal>

      {details.length > 0 && (
        <Reveal delay={80}><ul className="fy-details">{details.map((d) => (<li key={d.label}><span className="fy-ic">{d.icon}</span><span><b>{d.label}</b>{d.value}</span></li>))}</ul></Reveal>
      )}

      {!after && events.length > 0 && (
        <Reveal delay={120}>
          <h3 className="fy-h">{t("foryou.days")}</h3>
          <ol className="fy-days">
            {events.map((e) => {
              const venue = view.doc.venues.find((v) => v.id === e.venueId);
              return (
                <li key={e.id}>
                  <span className="fy-date"><b>{fmtDate(e.date, locale, "day")}</b>{fmtDate(e.date, locale, "month")}</span>
                  <span className="fy-what"><b>{L(e.name)}</b><small>{[fmtRange(e, locale), venue ? L(venue.name) : ""].filter(Boolean).join(" · ")}</small></span>
                </li>
              );
            })}
          </ol>
        </Reveal>
      )}

      {tip && !after && (
        <Reveal delay={160}>
          <div className="fy-tip">
            <Plane className="size-5" aria-hidden />
            <div>
              <h3 className="fy-h !mt-0">{t("foryou.travel", { city: g.city })}</h3>
              <p>{L(tip.text)}</p>
              {/^https?:\/\//.test(tip.link) && <a className="inv-btn inv-btn-ghost inv-btn-sm mt-3" href={tip.link} target="_blank" rel="noopener noreferrer">{t("foryou.link")}</a>}
            </div>
          </div>
        </Reveal>
      )}

      {after && mine && (mine.wishes.length > 0 || mine.photos.length > 0) && (
        <Reveal delay={80}>
          <h3 className="fy-h">{t("foryou.moments")}</h3>
          {mine.wishes.map((w) => (<blockquote key={w.id} className="fy-wish"><small>{t("foryou.moments.wish")}</small>{w.body}<cite>— {names.joined}</cite></blockquote>))}
          {mine.photos.length > 0 && (<><p className="fy-h !mt-6 !text-[0.8rem]">{t("foryou.moments.photos")}</p><div className="fy-photos">{mine.photos.map((p) => (<Photo key={p.id} id={p.id} ratio="aspect-square" seed={3} sizes="(max-width: 768px) 33vw, 200px" />))}</div></>)}
        </Reveal>
      )}
      {isPreview && null}
    </Shell>
  );
}

// ── a message from the couple for the guest's group ─────────────────────────

/** The lines of a short written note play one by one over a photograph — the default when the couple has not recorded a clip. */
function Reel({ lines, signature, photo }: { lines: string[]; signature: string; photo: string | undefined }) {
  const { t, reducedMotion } = useInvitation();
  const [run, setRun] = useState(0); // 0 = not started; each press of the button starts a new run
  const frame = useRef<HTMLDivElement>(null);
  const step = 2.8; // seconds a line takes to appear
  const total = (lines.length + 1) * step;
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!run) return;
    setDone(false);
    const id = window.setTimeout(() => setDone(true), total * 1000);
    return () => window.clearTimeout(id);
  }, [run, total]);
  const playing = run > 0 && !reducedMotion;
  return (
    <div ref={frame} className="gm-reel" data-playing={playing ? "" : undefined} data-static={reducedMotion ? "" : undefined}>
      <div className="gm-bg" aria-hidden>{photo ? <Photo id={photo} ratio="h-full w-full" seed={5} sizes="(max-width: 768px) 100vw, 640px" /> : null}</div>
      <div className="gm-shade" aria-hidden />
      <div className="gm-lines" key={run} aria-live="polite">
        {lines.map((line, i) => (<p key={i} className="gm-line" style={{ animationDelay: `${i * step}s` }} data-show={run === 0 && !reducedMotion ? undefined : ""}>{line}</p>))}
        <p className="gm-sign" style={{ animationDelay: `${lines.length * step}s` }} data-show={run === 0 && !reducedMotion ? undefined : ""}>{signature}</p>
      </div>
      {run === 0 && !reducedMotion && (
        <button type="button" className="gm-play" onClick={() => setRun(1)}><Play className="size-5" aria-hidden /><span>{t("gm.play")}</span></button>
      )}
      {run > 0 && done && <button type="button" className="gm-replay" aria-label={t("gm.play")} onClick={() => setRun((r) => r + 1)}><RotateCcw className="size-4" aria-hidden /></button>}
    </div>
  );
}

export function GroupMessageSection({ section }: { section: SectionConfig }) {
  const { view, t, L, locale, media } = useInvitation();
  const names = useSubject();
  const couplePhoto = useSlot("couple");
  const copy = useCopy(section, { eyebrow: "gm.eyebrow" });
  const g = view.guest;
  if (!g) return null;
  const entry = view.doc.personal.groups[0];
  const clip = entry?.clip ? media(entry.clip) : undefined;
  const written = entry ? L(entry.text).split(/\n+/).map((s) => s.trim()).filter(Boolean) : [];
  const lines = written.length ? written : groupNote(groupNoteKind(g.groupKey), locale);
  const photos = (entry?.photos ?? []).map((id) => media(id)).filter((m): m is ResolvedMedia => !!m && m.kind === "IMAGE");
  const signature = `— ${L(view.doc.personal.signature) || names.joined}`;
  const title = (entry && L(entry.title)) || t("gm.title", { couple: names.joined });

  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || title} />
      <Reveal>
        {clip && clip.kind === "VIDEO" ? (
          <div className="gm-clip"><video src={clip.url} controls playsInline preload="metadata" aria-label={title} /></div>
        ) : clip && clip.kind === "AUDIO" ? (
          <div className="gm-voice"><Heart className="size-5" aria-hidden /><span>{t("gm.voice", { couple: names.joined })}</span><audio src={clip.url} controls preload="metadata" /></div>
        ) : (
          <Reel lines={lines} signature={signature} photo={couplePhoto} />
        )}
        {clip && written.length > 0 && <div className="gm-text">{written.map((l, i) => (<p key={i}>{l}</p>))}<p className="gm-sign-static">{signature}</p></div>}
      </Reveal>
      {photos.length > 0 && (
        <Reveal delay={100}>
          <p className="fy-h">{t("gm.past")}</p>
          <div className="fy-photos">{photos.map((p) => (<Photo key={p.id} id={p.id} ratio="aspect-square" seed={4} sizes="(max-width: 768px) 33vw, 200px" />))}</div>
        </Reveal>
      )}
    </Shell>
  );
}
