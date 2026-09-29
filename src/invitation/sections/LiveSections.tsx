"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig, WeddingEvent } from "@/domain/doc/schema";
import { sortEvents } from "@/domain/wedding/view";
import { computeLiveState } from "@/domain/live/state";
import { ApiError, useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal, useCountdown } from "../engine/motion";
import { eventStart, fmtDate, fmtRange, fmtTime } from "../engine/format";
import { useLive, useSharedPoll } from "../engine/poll";
import { Qr, useQrDataUrl } from "../engine/qr";
import type { ResolvedMedia } from "@/domain/media/service";
import { Shell, SectionHead, useCopy, InlineNotice } from "./shared";

// ── what's happening now ────────────────────────────────────────────────────
function NextCountdown({ e }: { e: WeddingEvent }) {
  const { view, t } = useInvitation();
  const c = useCountdown(eventStart(e, view.wedding.timezone));
  if (!c || c.done) return null;
  const txt = c.days ? `${c.days}d ${c.hours}h` : c.hours ? `${c.hours}h ${c.minutes}m` : `${c.minutes}m ${c.seconds}s`;
  return <span className="inv-num text-[var(--c-accent)]">{t("live.startsIn", { t: txt })}</span>;
}

export function LiveScheduleSection({ section }: { section: SectionConfig }) {
  const { view, L, t, locale } = useInvitation();
  const copy = useCopy(section, { title: "live.title" });
  const live = useLive(true);
  const events = useMemo(() => sortEvents(view.doc.events).filter((e) => e.date), [view.doc.events]);
  // The server payload (manual override by the family) wins; otherwise compute from the clock locally.
  const local = useMemo(() => computeLiveState(events, view.wedding.timezone, null, null), [events, view.wedding.timezone]);
  const nowId = live ? live.now?.id ?? null : local.current?.id ?? null;
  const nextId = live ? live.next?.id ?? null : local.next?.id ?? null;
  const current = events.find((e) => e.id === nowId) ?? null;
  const next = events.find((e) => e.id === nextId) ?? null;
  const later = events.filter((e) => e.id !== nowId && e.id !== nextId);
  const venueName = (e: WeddingEvent) => L(view.doc.venues.find((v) => v.id === e.venueId)?.name);
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} />
      <div className="mx-auto max-w-3xl">
        {current ? (
          <Reveal className="inv-card relative overflow-hidden p-8 text-center md:p-12">
            <span className="mx-auto mb-5 inline-flex items-center gap-2.5 text-[0.74rem] font-medium uppercase tracking-[0.26em] text-[var(--c-accent)]"><span className="size-2.5 animate-[inv-pulse_1.6s_infinite] rounded-full bg-[var(--c-accent)]" />{t("live.now")}</span>
            <h3 className="inv-h2">{L(current.name)}</h3>
            <p className="inv-num mt-3 text-xl">{fmtRange(current, locale)}</p>
            {venueName(current) && <p className="mt-1 opacity-80">{venueName(current)}</p>}
            {live?.note && <p className="mt-5 border-t border-current/15 pt-4 italic opacity-90">{live.note}</p>}
          </Reveal>
        ) : (
          <p className="text-center text-lg opacity-80">{t("live.none")}</p>
        )}
        {next && (
          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 border-y border-current/15 py-5">
            <div><p className="inv-eyebrow">{t("live.next")}</p><p className="inv-h3 mt-1">{L(next.name)}</p></div>
            <div className="text-right"><p className="inv-num text-lg">{fmtTime(next.startTime, locale)}</p><NextCountdown e={next} /></div>
          </div>
        )}
        {later.length > 0 && (
          <ul className="mt-6 divide-y divide-current/10 text-[0.98rem]">
            {later.map((e) => (
              <li key={e.id} className="flex justify-between gap-4 py-3 opacity-75"><span>{L(e.name)}</span><span className="inv-num">{fmtDate(e.date, locale, "monthDay")} · {fmtTime(e.startTime, locale)}</span></li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}

// ── live updates feed ───────────────────────────────────────────────────────
function ago(iso: string, locale: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale === "ml" ? "ml" : "en", { numeric: "auto" });
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}

export function LiveUpdatesSection({ section }: { section: SectionConfig }) {
  const { view, L, t, locale } = useInvitation();
  const copy = useCopy(section, { title: "live.updates" });
  const live = useLive(true);
  const updates = live?.updates ?? view.initial.updates.map((u) => ({ ...u, createdAt: new Date(u.createdAt).toISOString() }));
  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} className="!mb-8" />
      {updates.length === 0 ? (
        <p className="text-center inv-muted italic">{t("live.none")}</p>
      ) : (
        <ol className="space-y-4" aria-live="polite">
          {updates.map((u) => (
            <li key={u.id} className={cn("inv-card p-5", u.pinned && "!border-[var(--c-accent)]")}>
              <div className="flex items-baseline justify-between gap-4"><p className="inv-h4">{L(u.title)}</p><time className="inv-muted shrink-0 text-[0.8rem]" dateTime={u.createdAt}>{ago(u.createdAt, locale)}</time></div>
              {L(u.body) && <p className="inv-muted mt-1.5 text-[0.98rem] leading-[1.7]">{L(u.body)}</p>}
            </li>
          ))}
        </ol>
      )}
    </Shell>
  );
}

// ── live photo wall ─────────────────────────────────────────────────────────
type WallItem = ResolvedMedia & { by: string; approvedAt: string };

export function PhotoWallSection({ section }: { section: SectionConfig }) {
  const { get, t, slug, token, isPreview } = useInvitation();
  const copy = useCopy(section, { title: "wall.title" });
  const items = useSharedPoll<{ items: WallItem[] }>(`wall:${slug}:${token ?? ""}`, () => get("/wall"), 6000, true);
  const seen = useRef<Set<string>>(new Set());
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const list = useMemo(() => items?.items ?? [], [items]);
  useEffect(() => {
    if (!list.length) return;
    const isFirst = seen.current.size === 0;
    const added = list.filter((i) => !seen.current.has(i.id)).map((i) => i.id);
    list.forEach((i) => seen.current.add(i.id));
    if (!isFirst && added.length) {
      setFresh(new Set(added));
      const id = setTimeout(() => setFresh(new Set()), 4000);
      return () => clearTimeout(id);
    }
  }, [list]);
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} />
      <div className="mb-8 text-center"><a href="#s-guestupload" className="inv-btn inv-btn-ghost inv-btn-sm"><Camera className="size-3.5" /> {t("wall.add")}</a></div>
      {list.length === 0 ? (
        <p className="text-center opacity-75 italic">{t("wall.empty")}</p>
      ) : (
        <ul className="columns-2 gap-3 md:columns-4 [&>li]:mb-3" aria-live="polite">
          {list.map((p) => (
            <li key={p.id} className={cn("relative break-inside-avoid overflow-hidden", fresh.has(p.id) && "[animation:inv-rise_.8s_var(--ease)] ring-2 ring-[var(--c-accent)]")} style={{ borderRadius: "var(--r)", aspectRatio: p.width && p.height ? `${p.width}/${p.height}` : "4/5" }}>
              <img src={p.url} srcSet={p.srcSet} sizes="(max-width: 768px) 50vw, 25vw" alt={`${p.by}`} loading="lazy" className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2.5 pb-1.5 pt-6 text-[0.72rem] text-white">{p.by}</span>
            </li>
          ))}
        </ul>
      )}
      {isPreview && null}
      <Photo id={undefined} className="hidden" />
    </Shell>
  );
}

// ── guest pass & check-in ───────────────────────────────────────────────────
interface PassData { code: string; payload: string; seats: number; name: string; checkedIn: { eventId: string; at: string }[] }

function usePass() {
  const { get, slug, token, view } = useInvitation();
  const enabled = !!token && !view.guest?.isPreview;
  return useSharedPoll<PassData>(`pass:${slug}:${token ?? ""}`, () => get<PassData>("/pass"), 15000, enabled);
}

export function QrPassSection({ section }: { section: SectionConfig }) {
  const { view, L, t, locale } = useInvitation();
  const copy = useCopy(section, { title: "pass.title" });
  const real = usePass();
  const g = view.guest;
  // Preview shows a realistic sample pass so Super Admin can design around it.
  const pass: PassData | null = real ?? (g?.isPreview ? { code: "PREVIEW2027", payload: "AOIRE1:PREVIEW2027", seats: g.seats, name: g.name, checkedIn: [] } : null);
  const qr = useQrDataUrl(pass?.payload, { width: 480, dark: "#141210" });
  const events = sortEvents(view.doc.events);
  const main = events.find((e) => e.isMain) ?? events[0];
  const save = async () => {
    if (!pass || !qr) return;
    const c = document.createElement("canvas");
    c.width = 900; c.height = 1300;
    const x = c.getContext("2d")!;
    x.fillStyle = "#faf6ee"; x.fillRect(0, 0, 900, 1300);
    x.strokeStyle = "#a07b2a"; x.lineWidth = 4; x.strokeRect(30, 30, 840, 1240);
    x.fillStyle = "#1c1a17"; x.textAlign = "center";
    x.font = "600 34px system-ui"; x.fillText(view.wedding.title.toUpperCase(), 450, 130);
    x.font = "italic 60px Georgia"; x.fillText(pass.name, 450, 260);
    x.font = "34px system-ui"; x.fillText(pass.seats === 1 ? t("pass.seat") : t("pass.seats", { n: pass.seats }), 450, 320);
    const img = new Image(); img.src = qr; await img.decode();
    x.drawImage(img, 170, 380, 560, 560);
    x.font = "600 44px monospace"; x.fillText(pass.code, 450, 1030);
    x.font = "28px system-ui"; x.fillText(main ? `${L(main.name)} · ${fmtDate(main.date, locale, "long")}` : "", 450, 1110);
    const a = document.createElement("a"); a.download = "guest-pass.png"; a.href = c.toDataURL("image/png"); a.click();
  };
  if (!pass) return null;
  const inAll = pass.checkedIn.length > 0;
  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={t("pass.show")} className="!mb-8" />
      <Reveal className="mx-auto w-full max-w-sm">
        <div className="inv-card relative overflow-hidden text-center">
          <div className="bg-[var(--c-primary)] px-6 py-6 text-[var(--c-on-primary)]">
            <p className="inv-eyebrow !text-[var(--c-on-primary)] opacity-80">{view.wedding.title}</p>
            <p className="inv-h2 mt-2 !text-[2.2rem] !text-[var(--c-on-primary)]">{pass.name}</p>
            <p className="mt-1 text-[0.95rem] opacity-90">{pass.seats === 1 ? t("pass.seat") : t("pass.seats", { n: pass.seats })}</p>
          </div>
          <div className="relative px-6 py-8">
            <span aria-hidden className="absolute -left-3 -top-3 size-6 rounded-full bg-[var(--c-bg)]" /><span aria-hidden className="absolute -right-3 -top-3 size-6 rounded-full bg-[var(--c-bg)]" />
            <div className="mx-auto w-fit rounded-md bg-white p-3 shadow-sm">{qr ? <img src={qr} alt={`${t("pass.title")}: ${pass.code}`} width={208} height={208} /> : <div className="size-52" />}</div>
            <p className="mt-4 font-mono text-lg tracking-[0.25em]">{pass.code}</p>
            {main && <p className="inv-muted mt-4 text-[0.92rem]">{L(main.name)} · {fmtDate(main.date, locale, "long")}</p>}
            <p className={cn("mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.8rem] font-medium", inAll ? "bg-[#3f8a52]/15 text-[#2f6b3f]" : "bg-[var(--c-border)]/60")}>{inAll && <Check className="size-3.5" />}{inAll ? t("pass.checkedIn") : t("pass.notYet")}</p>
          </div>
        </div>
        <div className="mt-6 text-center"><button type="button" className="inv-btn inv-btn-ghost inv-btn-sm" onClick={save}><Download className="size-3.5" /> {t("pass.save")}</button></div>
      </Reveal>
      {false && <Qr text="" />}
    </Shell>
  );
}

export function CheckinSection({ section }: { section: SectionConfig }) {
  const { view, L, t, locale } = useInvitation();
  const pass = usePass();
  const copy = useCopy(section, { title: "checkin.title" });
  if (!view.guest) return null;
  const done = pass?.checkedIn ?? [];
  const events = sortEvents(view.doc.events);
  return (
    <Shell section={section} wide={false} className="!py-16">
      <SectionHead eyebrow={copy.eyebrow} intro={t("checkin.lede")} className="!mb-6" />
      <ul className="mx-auto max-w-md divide-y divide-[var(--c-border)] border-y border-[var(--c-border)]">
        {events.map((e) => {
          const c = done.find((d) => d.eventId === e.id);
          return (
            <li key={e.id} className="flex items-center justify-between gap-4 py-3.5">
              <span>{L(e.name)}<span className="inv-muted block text-[0.82rem]">{fmtDate(e.date, locale, "monthDay")} · {fmtTime(e.startTime, locale)}</span></span>
              {c ? <span className="inline-flex items-center gap-1.5 text-[0.85rem] text-[#2f6b3f]"><Check className="size-4" />{fmtTime(new Date(c.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: view.wedding.timezone }), locale)}</span> : <span className="inv-muted text-[0.85rem]">—</span>}
            </li>
          );
        })}
      </ul>
      {!pass && <InlineNotice>{t("common.loading")}</InlineNotice>}
      {false && ApiError}
    </Shell>
  );
}
