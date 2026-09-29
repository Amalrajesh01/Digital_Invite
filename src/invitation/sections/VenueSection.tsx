"use client";
import { useState } from "react";
import { Car, Copy, ExternalLink, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { SectionConfig, Venue } from "@/domain/doc/schema";
import { useInvitation } from "../engine/context";
import { Photo } from "../engine/Photo";
import { Reveal } from "../engine/motion";
import { mapsUrl } from "../engine/format";
import { Qr } from "../engine/qr";
import { Shell, SectionHead, useCopy } from "./shared";

function MapFacade({ venue }: { venue: Venue }) {
  const { t, L } = useInvitation();
  const [show, setShow] = useState(false);
  const q = venue.lat != null && venue.lng != null ? `${venue.lat},${venue.lng}` : encodeURIComponent(`${L(venue.name)} ${L(venue.address)} ${L(venue.city)}`);
  // The Google map only loads when asked — keeps the invitation fast and private by default.
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--r)] bg-[color-mix(in_srgb,var(--c-primary)_8%,var(--c-bg))]">
      {show ? (
        <iframe title={L(venue.name)} src={`https://maps.google.com/maps?q=${q}&z=15&output=embed`} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <button type="button" onClick={() => setShow(true)} className="group absolute inset-0 grid place-items-center">
          <span className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(var(--c-border) 1px, transparent 1px), linear-gradient(90deg, var(--c-border) 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
          <span className="relative flex flex-col items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full bg-[var(--c-primary)] text-[var(--c-on-primary)] transition-transform group-hover:scale-105"><MapPin className="size-6" /></span>
            <span className="inv-btn inv-btn-ghost inv-btn-sm !bg-[var(--c-surface)]">{t("venue.showMap")}</span>
          </span>
        </button>
      )}
    </div>
  );
}

function IllustratedMap({ venue }: { venue: Venue }) {
  const { L, media, t } = useInvitation();
  const m = venue.landmarkMap;
  if (!media(m.image)) return null;
  return (
    <div className="mt-8">
      <p className="inv-eyebrow mb-3">{t("venue.landmarks")}</p>
      <div className="relative overflow-hidden rounded-[var(--r)]">
        <Photo id={m.image} ratio="aspect-[4/3]" className="w-full" sizes="(max-width: 768px) 100vw, 900px" />
        {m.pins.map((p, i) => (
          <span key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className="grid size-7 place-items-center rounded-full bg-[var(--c-primary)] text-xs font-semibold text-[var(--c-on-primary)] shadow-lg ring-2 ring-white/80">{i + 1}</span>
          </span>
        ))}
      </div>
      <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {m.pins.map((p, i) => (<li key={p.id} className="flex gap-3"><span className="inv-num text-[var(--c-accent)]">{i + 1}.</span>{L(p.label)}</li>))}
      </ol>
    </div>
  );
}

function VenueBlock({ venue, index, illustrated }: { venue: Venue; index: number; illustrated: boolean }) {
  const { L, t, has } = useInvitation();
  const url = mapsUrl({ mapUrl: venue.mapUrl, lat: venue.lat, lng: venue.lng, query: `${L(venue.name)} ${L(venue.address)}` });
  const address = [L(venue.address), L(venue.city)].filter(Boolean).join(", ");
  const parkingUrl = venue.parking.mapUrl && /^https?:/.test(venue.parking.mapUrl) ? venue.parking.mapUrl : null;
  return (
    <Reveal className="mx-auto grid max-w-6xl items-start gap-10 md:grid-cols-2 md:gap-16">
      <div className={index % 2 ? "md:order-2" : ""}>
        {venue.photo ? <Photo id={venue.photo} ratio="aspect-[4/3]" className="mb-6 w-full" seed={index + 13} sizes="(max-width: 768px) 100vw, 560px" /> : null}
        <MapFacade venue={venue} />
      </div>
      <div>
        <h3 className="inv-h2 !text-[clamp(1.9rem,6vw,3rem)]">{L(venue.name)}</h3>
        <p className="mt-4 whitespace-pre-line text-[1.05rem] leading-[1.8]">{address}</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <a href={url} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-sm"><ExternalLink className="size-3.5" /> {t("venue.openMaps")}</a>
          <button type="button" className="inv-btn inv-btn-ghost inv-btn-sm" onClick={() => { void navigator.clipboard?.writeText(address); toast.success(t("venue.copied")); }}><Copy className="size-3.5" /> {t("venue.copyAddress")}</button>
        </div>
        {(L(venue.parking.info) || parkingUrl) && (
          <div className="mt-8 border-t border-[var(--c-border)] pt-6">
            <p className="inv-eyebrow flex items-center gap-2"><Car className="size-3.5" /> {t("venue.parking")}</p>
            {L(venue.parking.info) && <p className="inv-muted mt-2 text-[1rem] leading-[1.8]">{L(venue.parking.info)}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {parkingUrl && <a href={parkingUrl} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-ghost inv-btn-sm">{t("venue.parkingMap")}</a>}
              {parkingUrl && has("parking_qr") && (
                <figure className="flex items-center gap-3">
                  <Qr text={parkingUrl} size={84} className="rounded bg-white p-1" label={t("venue.scanParking")} />
                  <figcaption className="max-w-[9rem] text-[0.8rem] inv-muted">{t("venue.scanParking")}</figcaption>
                </figure>
              )}
            </div>
          </div>
        )}
        {illustrated && <IllustratedMap venue={venue} />}
      </div>
    </Reveal>
  );
}

export default function VenueSection({ section }: { section: SectionConfig }) {
  const { view, has } = useInvitation();
  const copy = useCopy(section, { title: "venue.title" });
  const venues = view.doc.venues;
  if (!venues.length) return null;
  const illustrated = section.variant === "map" && has("custom_venue_map");
  return (
    <Shell section={section}>
      <SectionHead eyebrow={copy.eyebrow} title={copy.title || undefined} intro={copy.intro} className="!mb-14" />
      <div className="space-y-24">
        {venues.map((v, i) => (<VenueBlock key={v.id} venue={v} index={i} illustrated={illustrated} />))}
      </div>
    </Shell>
  );
}
