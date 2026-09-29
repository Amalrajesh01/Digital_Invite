"use client";
import type { SectionConfig } from "@/domain/doc/schema";
import { sortEvents } from "@/domain/wedding/view";
import { useInvitation } from "../engine/context";
import { Reveal, useCountdown } from "../engine/motion";
import { eventStart, fmtDate } from "../engine/format";
import { Shell, SectionHead, useCopy } from "./shared";

function Ring({ value, max, label, size = 112 }: { value: number; max: number; label: string; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, Math.max(0, value / max));
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".16" strokeWidth="1.5" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <span className="inv-num absolute inset-0 grid place-items-center text-[2.1rem] leading-none">{String(value).padStart(2, "0")}</span>
      </div>
      <span className="inv-eyebrow !text-current !text-[0.6rem] !tracking-[0.16em] opacity-70">{label}</span>
    </div>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="inv-num text-[clamp(2.8rem,13vw,6.4rem)] leading-none">{String(value).padStart(2, "0")}</div>
      <div className="inv-eyebrow mt-3 !text-current !text-[0.62rem] !tracking-[0.18em] opacity-70">{label}</div>
    </div>
  );
}

function Main({ section }: { section: SectionConfig }) {
  const { view, t, locale } = useInvitation();
  const main = view.doc.events.find((e) => e.isMain) ?? view.doc.events[0];
  const target = main ? eventStart(main, view.wedding.timezone) : null;
  const c = useCountdown(target);
  const copy = useCopy(section, { eyebrow: "invite.saveTheDate", title: "countdown.title" });
  const ring = section.variant === "ring";
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} />
      <Reveal>
        <div className="mx-auto grid max-w-3xl grid-cols-4 gap-2 md:gap-8" aria-live="off" role="timer" aria-label={t("countdown.title")}>
          {c?.done ? (
            <p className="col-span-4 text-center inv-h2">{t("countdown.today")}</p>
          ) : ring ? (
            <>
              <Ring value={c?.days ?? 0} max={100} label={t("countdown.days")} size={92} />
              <Ring value={c?.hours ?? 0} max={24} label={t("countdown.hours")} size={92} />
              <Ring value={c?.minutes ?? 0} max={60} label={t("countdown.minutes")} size={92} />
              <Ring value={c?.seconds ?? 0} max={60} label={t("countdown.seconds")} size={92} />
            </>
          ) : (
            <>
              <Unit value={c?.days ?? 0} label={t("countdown.days")} />
              <Unit value={c?.hours ?? 0} label={t("countdown.hours")} />
              <Unit value={c?.minutes ?? 0} label={t("countdown.minutes")} />
              <Unit value={c?.seconds ?? 0} label={t("countdown.seconds")} />
            </>
          )}
        </div>
        {main && <p className="mt-10 text-center inv-muted">{fmtDate(main.date, locale, "long")}</p>}
      </Reveal>
    </Shell>
  );
}

function EachEvent({ section }: { section: SectionConfig }) {
  const { view, L, t, locale } = useInvitation();
  const copy = useCopy(section, { eyebrow: "invite.saveTheDate", title: "countdown.title" });
  const events = sortEvents(view.doc.events).filter((e) => e.date);
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} />
      <ul className="mx-auto max-w-3xl divide-y divide-current/15">
        {events.map((e, i) => (
          <Reveal as="li" key={e.id} delay={i * 60} className="py-5">
            <EventRow e={e} name={L(e.name)} when={fmtDate(e.date, locale, "monthDay")} tz={view.wedding.timezone} untilLabel={(n) => t("countdown.until", { event: n })} />
          </Reveal>
        ))}
      </ul>
    </Shell>
  );
}

function EventRow({ e, name, when, tz }: { e: { date: string; startTime: string }; name: string; when: string; tz: string; untilLabel: (n: string) => string }) {
  const { t } = useInvitation();
  const c = useCountdown(eventStart(e, tz));
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <div>
        <p className="inv-h3">{name}</p>
        <p className="inv-muted text-[0.95rem]">{when}</p>
      </div>
      <p className="inv-num text-xl text-[var(--c-accent)]">{!c ? "" : c.done ? t("countdown.today") : `${c.days} ${t("countdown.days")} ${c.hours} ${t("countdown.hours")}`}</p>
    </div>
  );
}

export default function CountdownSection({ section }: { section: SectionConfig }) {
  return section.variant === "events" ? <EachEvent section={section} /> : <Main section={section} />;
}
