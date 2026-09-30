"use client";
import { Pause, Phone, Play, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { embedUrl, whatsappHref } from "../engine/format";
import { readableOn } from "../engine/theme";
import { Divider } from "../engine/Ornament";
import { Shell, SectionHead, useCopy } from "./shared";

export function DressCodeSection({ section }: { section: SectionConfig }) {
  const { view, L, t } = useInvitation();
  const copy = useCopy(section, { title: "dress.title" });
  const guide = view.doc.dressGuide;
  const palette = view.doc.palette;
  if (!guide.looks.length && !palette.colors.length) return null;
  const label = { women: t("dress.women"), men: t("dress.men"), everyone: t("dress.everyone") };
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-12" />
      {palette.colors.length > 0 && (
        <Reveal className="mx-auto mb-16 max-w-3xl">
          <p className="inv-eyebrow mb-5 text-center">{t("dress.palette")}</p>
          <ul className="flex overflow-hidden" style={{ borderRadius: "var(--r)" }}>
            {palette.colors.map((c) => (
              <li key={c.id} className="group relative flex-1 basis-0 pb-[42%] md:pb-[22%]" style={{ background: c.hex }}>
                <span className="absolute inset-x-0 bottom-0 p-2 text-center text-[0.7rem] font-medium uppercase tracking-[0.12em] md:text-[0.76rem]" style={{ color: readableOn(c.hex) }}>{L(c.name)}</span>
              </li>
            ))}
          </ul>
          {L(palette.note) && <p className="inv-muted mt-4 text-center text-[0.98rem]">{L(palette.note)}</p>}
        </Reveal>
      )}
      {section.variant !== "palette" && guide.looks.length > 0 && (
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {guide.looks.map((l, i) => (
            <Reveal key={l.id} delay={i * 90} className="inv-card overflow-hidden">
              {l.photo && <Photo id={l.photo} ratio="aspect-[4/5]" seed={i + 5} sizes="(max-width: 768px) 100vw, 340px" />}
              <div className="p-6">
                <p className="inv-eyebrow">{label[l.forWhom]}</p>
                <h3 className="inv-h3 mt-2">{L(l.title)}</h3>
                <p className="inv-muted mt-2 text-[0.98rem] leading-[1.75]">{L(l.description)}</p>
                {l.colors.length > 0 && <div className="mt-4 flex gap-2" aria-hidden>{l.colors.map((c) => (<span key={c} className="size-6 rounded-full border border-black/10" style={{ background: c }} />))}</div>}
              </div>
            </Reveal>
          ))}
        </div>
      )}
      {L(guide.avoid) && <p className="inv-muted mx-auto mt-10 max-w-xl text-center text-[0.98rem]"><span className="inv-eyebrow mr-2">{t("dress.avoid")}</span>{L(guide.avoid)}</p>}
    </Shell>
  );
}

export function MenuSection({ section }: { section: SectionConfig }) {
  const { view, L, t } = useInvitation();
  const copy = useCopy(section, { title: "menu.title" });
  const menu = view.doc.menu;
  if (!menu.courses.length) return null;
  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-10" />
      <Reveal className="inv-card px-7 py-12 text-center md:px-14">
        {menu.courses.map((c, ci) => (
          <div key={c.id} className={cn(ci > 0 && "mt-12")}>
            <h3 className="inv-h3 text-[var(--c-primary)]">{L(c.title)}</h3>
            <Divider kind="line" className="!my-3" />
            <ul className="space-y-3.5">
              {c.items.map((it) => (
                <li key={it.id}>
                  <span className="text-[1.08rem]">{L(it.name)}</span>
                  <span className={cn("ml-2 inline-block size-2 rounded-full align-middle", it.veg ? "bg-[#3f8a52]" : "bg-[#b3372f]")} title={it.veg ? t("menu.veg") : t("menu.nonveg")} />
                  {L(it.note) && <span className="inv-muted block text-[0.88rem]">{L(it.note)}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {L(menu.note) && <p className="inv-muted mt-12 border-t border-[var(--c-border)] pt-6 text-[0.92rem]">{L(menu.note)}</p>}
      </Reveal>
    </Shell>
  );
}

export function ContactSection({ section }: { section: SectionConfig }) {
  const { view, L, t } = useInvitation();
  const copy = useCopy(section, { title: "contact.title" });
  const list = view.doc.contacts;
  if (!list.length) return null;
  return (
    <Shell section={section} wide={false} className="!py-16 md:!py-24">
      <SectionHead eyebrow={copy.eyebrow} className="!mb-8" />
      <ul className="divide-y divide-[var(--c-border)] border-y border-[var(--c-border)]">
        {list.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div><p className="inv-h4">{L(c.name)}</p><p className="inv-muted text-[0.9rem]">{L(c.role)}</p></div>
            {c.phone && (
              <div className="flex gap-2">
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="inv-btn inv-btn-ghost inv-btn-sm"><Phone className="size-3.5" /> {t("contact.call")}</a>
                <a href={whatsappHref(c.phone, "")} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-ghost inv-btn-sm"><MessageCircle className="size-3.5" /> {t("contact.whatsapp")}</a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function ThankYouSection({ section }: { section: SectionConfig }) {
  const { view, L, t } = useInvitation();
  const copy = useCopy(section, { title: "thanks.title" });
  const ty = view.doc.thankYou;
  if (!L(ty.message)) return null;
  return (
    <Shell section={section} wide={false}>
      <div className="text-center">
        <Reveal variant="fade"><p className="inv-eyebrow">{copy.eyebrow}</p></Reveal>
        {ty.photo && <Reveal className="mx-auto mt-8 w-[min(70vw,16rem)]"><Photo id={ty.photo} ratio="aspect-[4/5]" className="inv-arch-soft" seed={3} sizes="256px" /></Reveal>}
        <Reveal delay={120}><p className="mt-10 whitespace-pre-line text-[clamp(1.2rem,4.2vw,1.55rem)] leading-[1.85]" style={{ fontFamily: "var(--f-heading)" }}>{L(ty.message)}</p></Reveal>
        {L(ty.signature) && <Reveal delay={200}><p className="inv-script mt-8 text-[clamp(2rem,8vw,3rem)] text-[var(--c-accent)]">{L(ty.signature)}</p></Reveal>}
      </div>
      {t("thanks.title") && null}
    </Shell>
  );
}

/** "Our playlist" — the couple's songs, each playable (uses the shared audio element). */
export function MusicSection({ section }: { section: SectionConfig }) {
  const { music, t } = useInvitation();
  const copy = useCopy(section, { title: "music.now" });
  const list = music.tracks.filter((x) => x.inPlaylist || music.tracks.length > 1);
  if (list.length < 1) return null;
  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} className="!mb-8" />
      <ul className="divide-y divide-[var(--c-border)] border-y border-[var(--c-border)]">
        {list.map((tr) => {
          const i = music.tracks.findIndex((x) => x.id === tr.id);
          const on = music.trackIndex === i && music.playing;
          return (
            <li key={tr.id} className="flex items-center gap-4 py-4">
              <div className="size-14 shrink-0 overflow-hidden" style={{ borderRadius: "var(--r)" }}>
                <Photo id={undefined} className="size-full" seed={i + 1} />
              </div>
              <div className="min-w-0 flex-1"><p className="inv-h4 truncate">{tr.title}</p><p className="inv-muted truncate text-[0.9rem]">{tr.artist}</p></div>
              <button type="button" className="inv-btn inv-btn-ghost !min-h-11 !rounded-full !px-4" onClick={() => (on ? music.pause() : music.play(i))} aria-label={on ? t("music.pause") : t("music.play")}>{on ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

export function LivestreamSection({ section }: { section: SectionConfig }) {
  const { view, L, t } = useInvitation();
  const url = embedUrl(view.doc.live.streamUrl);
  if (!url) return null;
  return (
    <Shell section={section} wide={false}>
      <SectionHead eyebrow={t("live.stream")} title={L(view.doc.live.streamLabel) || undefined} className="!mb-8" />
      <div className="relative aspect-video w-full overflow-hidden" style={{ borderRadius: "var(--r)" }}>
        <iframe src={url} title={t("live.stream")} className="absolute inset-0 h-full w-full border-0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
      </div>
    </Shell>
  );
}
