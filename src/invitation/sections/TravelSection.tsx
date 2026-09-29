"use client";
import { useMemo, useState } from "react";
import { Bus, Phone, Plane, TrainFront, Car } from "lucide-react";
import type { Hotel, SectionConfig } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { mapsUrl, safeExternal } from "../engine/format";
import { Shell, SectionHead, useCopy } from "./shared";

type TabKey = "hotels" | "getting" | "nearby" | "shuttle" | "guide";

function Steps({ text }: { text: string }) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return <p className="text-[1rem] leading-[1.8]">{text}</p>;
  return (
    <ol className="space-y-3">
      {lines.map((l, i) => (
        <li key={i} className="flex gap-4"><span className="inv-num mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-[var(--c-accent)] text-[0.85rem] text-[var(--c-accent)]">{i + 1}</span><span className="leading-[1.75]">{l}</span></li>
      ))}
    </ol>
  );
}

function HotelCard({ h }: { h: Hotel }) {
  const { L, t } = useInvitation();
  const url = safeExternal(h.url);
  return (
    <Reveal className="inv-card overflow-hidden">
      {h.photo && <Photo id={h.photo} ratio="aspect-[16/10]" seed={4} sizes="(max-width: 768px) 100vw, 380px" />}
      <div className="p-6">
        <h4 className="inv-h3">{L(h.name)}</h4>
        <p className="inv-muted mt-1 text-[0.92rem]">{[L(h.area), h.distanceKm != null ? t("travel.away", { km: h.distanceKm }) : "", h.priceHint].filter(Boolean).join(" · ")}</p>
        {L(h.note) && <p className="mt-3 text-[0.98rem] leading-[1.75]">{L(h.note)}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {h.phone && <a href={`tel:${h.phone.replace(/[^\d+]/g, "")}`} className="inv-btn inv-btn-ghost inv-btn-sm"><Phone className="size-3.5" /> {t("travel.call")}</a>}
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-ghost inv-btn-sm">{t("travel.book")}</a>}
        </div>
      </div>
    </Reveal>
  );
}

export default function TravelSection({ section }: { section: SectionConfig }) {
  const { view, L, t, has } = useInvitation();
  const copy = useCopy(section, { title: "travel.title" });
  const venues = view.doc.venues;
  const main = venues[0];
  const planner = section.variant === "planner" && has("travel_planner");
  const nearbyOk = has("nearby_guide");
  const tabs = useMemo(() => {
    const out: { key: TabKey; label: string }[] = [];
    if (venues.some((v) => v.hotels.length)) out.push({ key: "hotels", label: t("travel.hotels") });
    if (main && (L(main.directions.airport) || L(main.directions.railway) || L(main.directions.road))) out.push({ key: "getting", label: t("travel.getting") });
    if (nearbyOk && venues.some((v) => v.nearby.length)) out.push({ key: "nearby", label: t("travel.nearby") });
    if (planner && venues.some((v) => v.shuttle.schedule.length || L(v.shuttle.info))) out.push({ key: "shuttle", label: t("travel.shuttle") });
    if (nearbyOk && venues.some((v) => v.guide.length)) out.push({ key: "guide", label: t("travel.guide") });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, nearbyOk, planner, t]);
  const [tab, setTab] = useState<TabKey | null>(null);
  if (!tabs.length) return null;
  const active = tabs.find((x) => x.key === tab)?.key ?? tabs[0].key;

  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-8" />
      <div className="inv-tabs mb-10" role="tablist" aria-label={copy.eyebrow}>
        {tabs.map((x) => (<button key={x.key} role="tab" aria-selected={active === x.key} className="inv-tab" onClick={() => setTab(x.key)}>{x.label}</button>))}
      </div>

      {active === "hotels" && (
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {venues.flatMap((v) => v.hotels).map((h) => (<HotelCard key={h.id} h={h} />))}
        </div>
      )}

      {active === "getting" && main && (
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
          {([["air", Plane, main.directions.airport], ["rail", TrainFront, main.directions.railway], ["road", Car, main.directions.road]] as const).map(([k, Icon, text]) =>
            L(text) ? (
              <Reveal key={k} className="inv-card p-7">
                <Icon className="size-6 text-[var(--c-accent)]" aria-hidden />
                <h4 className="inv-h3 mt-4">{t(`travel.${k}` as "travel.air")}</h4>
                <div className="mt-4"><Steps text={L(text)} /></div>
              </Reveal>
            ) : null,
          )}
        </div>
      )}

      {active === "nearby" && (
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {venues.flatMap((v) => v.nearby).map((n) => (
            <Reveal key={n.id} className="inv-card flex gap-5 p-5">
              {n.photo && <Photo id={n.photo} className="size-24 shrink-0" seed={6} sizes="96px" />}
              <div>
                <h4 className="inv-h4">{L(n.name)}</h4>
                {n.kind && <p className="inv-eyebrow mt-1 !text-[0.64rem]">{n.kind}</p>}
                <p className="inv-muted mt-2 text-[0.95rem] leading-[1.7]">{L(n.note)}</p>
                {n.mapUrl && safeExternal(n.mapUrl) && <a className="mt-2 inline-block text-[0.88rem] text-[var(--c-primary)] underline underline-offset-4" href={mapsUrl({ mapUrl: n.mapUrl })} target="_blank" rel="noopener noreferrer">{t("events.directions")}</a>}
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {active === "shuttle" && (
        <div className="mx-auto max-w-2xl">
          {venues.map((v) => (
            <div key={v.id}>
              {L(v.shuttle.info) && <p className="mb-6 flex gap-3 text-[1.02rem] leading-[1.8]"><Bus className="mt-1 size-5 shrink-0 text-[var(--c-accent)]" />{L(v.shuttle.info)}</p>}
              <ul className="divide-y divide-[var(--c-border)] border-y border-[var(--c-border)]">
                {v.shuttle.schedule.map((s) => (
                  <li key={s.id} className="grid grid-cols-[5.5rem_1fr] gap-4 py-4"><span className="inv-num text-xl text-[var(--c-primary)]">{s.time}</span><span>{L(s.from)} <span className="text-[var(--c-accent)]">→</span> {L(s.to)}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {active === "guide" && (
        <div className="mx-auto max-w-3xl space-y-12">
          {venues.flatMap((v) => v.guide).map((g) => (
            <Reveal key={g.id}>
              <h4 className="inv-h3">{L(g.title)}</h4>
              <p className="inv-muted mt-3 whitespace-pre-line text-[1.02rem] leading-[1.9]">{L(g.body)}</p>
            </Reveal>
          ))}
        </div>
      )}
    </Shell>
  );
}
