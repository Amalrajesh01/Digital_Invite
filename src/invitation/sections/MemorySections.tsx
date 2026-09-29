"use client";
import { useState } from "react";
import type { SectionConfig } from "@/domain/doc/schema";
import { sortEvents } from "@/domain/wedding/view";
import type { ResolvedMedia } from "@/domain/media/service";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal, useCountdown } from "../engine/motion";
import { fmtDate, fmtTime } from "../engine/format";
import { useSharedPoll } from "../engine/poll";
import { Lightbox } from "./GallerySection";
import { Shell, SectionHead, useCopy } from "./shared";
import { zonedToUtc } from "@/lib/time";

type WallItem = ResolvedMedia & { by: string };

function Masonry({ items, onOpen }: { items: (ResolvedMedia & { by?: string })[]; onOpen: (i: number) => void }) {
  const { L } = useInvitation();
  return (
    <div className="columns-2 gap-3 md:columns-3 [&>*]:mb-3">
      {items.map((it, i) => (
        <Reveal key={it.id} delay={(i % 3) * 60} className="break-inside-avoid">
          <button type="button" onClick={() => onOpen(i)} className="group relative block w-full overflow-hidden" style={{ borderRadius: "var(--r)", aspectRatio: it.width && it.height ? `${it.width}/${it.height}` : "4/5", background: "var(--c-border)" }}>
            <img src={it.url} srcSet={it.srcSet} sizes="(max-width: 768px) 50vw, 33vw" alt={L(it.alt)} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          </button>
        </Reveal>
      ))}
    </div>
  );
}

export function MemorySection({ section }: { section: SectionConfig }) {
  const { view, L, t, locale, has, get, slug, token } = useInvitation();
  const copy = useCopy(section, { title: "memory.title" });
  const official = view.gallery.filter((a) => a.kind === "OFFICIAL" || a.kind === "MEMORY" || a.kind === "EVENT").flatMap((a) => a.items);
  const guestPhotos = useSharedPoll<{ items: WallItem[] }>(`memwall:${slug}:${token ?? ""}`, () => get("/wall?limit=60"), 120000, has("advanced_gallery") || has("post_event_gallery"));
  const [lb, setLb] = useState<{ list: (ResolvedMedia & { by?: string })[]; i: number } | null>(null);
  const events = sortEvents(view.doc.events);
  const book = view.initial.memoryBook;
  const wishes = view.initial.wishes.slice(0, 12);
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || t("invite.title.after")} intro={copy.intro || L(view.doc.thankYou.message).slice(0, 160)} />

      {official.length > 0 && (
        <div className="mb-24">
          <p className="inv-eyebrow mb-6 text-center">{t("memory.official")}</p>
          <Masonry items={official} onOpen={(i) => setLb({ list: official, i })} />
        </div>
      )}

      {guestPhotos && guestPhotos.items.length > 0 && (
        <div className="mb-24">
          <p className="inv-eyebrow mb-6 text-center">{t("memory.guests")}</p>
          <Masonry items={guestPhotos.items} onOpen={(i) => setLb({ list: guestPhotos.items, i })} />
        </div>
      )}

      {events.length > 0 && (
        <div className="mx-auto mb-24 max-w-2xl">
          <p className="inv-eyebrow mb-8 text-center">{t("memory.day")}</p>
          <ol className="relative space-y-7 border-l border-[var(--c-border)] pl-8">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span aria-hidden className="absolute -left-[2.45rem] top-2 size-3 rounded-full bg-[var(--c-accent)] ring-4 ring-[var(--c-bg)]" />
                <p className="inv-num text-[var(--c-accent)]">{fmtDate(e.date, locale, "monthDay")} · {fmtTime(e.startTime, locale)}</p>
                <p className="inv-h4">{L(e.name)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {book && (book.messages.length > 0 || book.photos.length > 0) && (
        <div className="inv-card mx-auto mb-24 max-w-4xl p-8 md:p-14">
          <p className="inv-eyebrow text-center">{t("memory.book")}</p>
          <h3 className="inv-h2 mt-3 text-center">{L(book.title)}</h3>
          {L(book.intro) && <p className="inv-lede mx-auto mt-4 text-center">{L(book.intro)}</p>}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">{book.photos.map((p) => (<Photo key={p.id} id={p.id} ratio="aspect-square" seed={2} sizes="(max-width: 768px) 100vw, 300px" />))}</div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">{book.messages.map((m) => (<blockquote key={m.id} className="border-l-2 border-[var(--c-accent)] pl-4 italic leading-[1.8]">“{m.body}”<footer className="inv-eyebrow mt-2 not-italic !text-[0.66rem]">{m.authorName}</footer></blockquote>))}</div>
        </div>
      )}

      {wishes.length > 0 && (
        <div>
          <p className="inv-eyebrow mb-6 text-center">{t("memory.wishes")}</p>
          <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
            {wishes.map((w) => (<li key={w.id} className="inv-card break-inside-avoid p-5"><p className="whitespace-pre-line text-[0.98rem] leading-[1.75]">“{w.body}”</p><p className="inv-eyebrow mt-3 !text-[0.64rem]">{w.authorName}</p></li>))}
          </ul>
        </div>
      )}
      <Lightbox items={lb?.list ?? []} index={lb?.i ?? null} onClose={() => setLb(null)} onIndex={(i) => setLb((s) => (s ? { ...s, i } : s))} />
    </Shell>
  );
}

export function AnniversarySection({ section }: { section: SectionConfig }) {
  const { view, L, t, locale } = useInvitation();
  const customTitle = L((section.content as { title?: Parameters<typeof L>[0] }).title);
  const years = Math.max(1, view.wedding.yearsTogether);
  const next = view.wedding.nextAnniversary;
  const target = next ? zonedToUtc(next, "00:00", view.wedding.timezone) : null;
  const c = useCountdown(target);
  const photos = view.gallery.flatMap((a) => a.items).slice(0, 5);
  const entries = view.initial.anniversary;
  return (
    <Shell section={section}>
      <div className="text-center">
        <Reveal variant="fade"><p className="inv-eyebrow">{years === 1 ? t("anniv.year") : t("anniv.years", { n: years })}</p></Reveal>
        <Reveal delay={100}><h2 className="inv-display mt-4 !text-[clamp(2.6rem,11vw,6rem)]">{customTitle || (years === 1 ? t("anniv.title") : t("anniv.titleN", { n: years }))}</h2></Reveal>
        {L(view.doc.anniversary.message) && <Reveal delay={200}><p className="inv-lede mx-auto mt-6">{L(view.doc.anniversary.message)}</p></Reveal>}
      </div>
      {photos.length > 0 && (
        <div className="-mx-5 mt-14 flex snap-x gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:justify-center" tabIndex={0} aria-label={t("memory.title")}>
          {photos.map((p, i) => (<div key={p.id} className="w-[64vw] shrink-0 snap-center md:w-52" style={{ transform: `rotate(${(i - 2) * 1.8}deg) translateY(${Math.abs(i - 2) * 6}px)` }}><Photo id={p.id} ratio="aspect-[3/4]" seed={i} sizes="(max-width: 768px) 64vw, 208px" /></div>))}
        </div>
      )}
      {entries.length > 0 && (
        <div className="mx-auto mt-16 max-w-2xl space-y-10">
          {entries.map((e) => (<Reveal key={e.id}><p className="inv-num text-[var(--c-accent)]">{e.year}</p><h3 className="inv-h3 mt-1">{L(e.title)}</h3><p className="mt-3 whitespace-pre-line leading-[1.85] opacity-90">{L(e.body)}</p></Reveal>))}
        </div>
      )}
      {next && (
        <div className="mt-20 text-center">
          <p className="inv-eyebrow">{t("anniv.countdown")}</p>
          <p className="inv-num mt-3 text-[clamp(2.4rem,9vw,4.2rem)]">{c ? `${c.days}` : "—"} <span className="inv-eyebrow !text-current opacity-70">{t("countdown.days")}</span></p>
          <p className="inv-muted mt-1 text-[0.92rem]">{fmtDate(next, locale, "long")}</p>
        </div>
      )}
    </Shell>
  );
}
