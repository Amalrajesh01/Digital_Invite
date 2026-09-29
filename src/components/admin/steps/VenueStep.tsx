"use client";
import { useRef } from "react";
import { TextField } from "@/components/ui/Field";
import { newId } from "@/lib/id";
import type { Venue } from "@/domain/doc/schema";
import { FormCard, Grid, Hint, LText, ListEditor } from "../forms";
import { MediaField } from "../MediaField";
import { useDraft } from "../draft";

const blank = (): Venue =>
  ({ id: newId(), name: {}, address: {}, city: {}, mapUrl: "", parking: { info: {}, mapUrl: "" }, directions: { airport: {}, railway: {}, road: {} }, landmarkMap: { pins: [] }, hotels: [], nearby: [], shuttle: { info: {}, schedule: [] }, guide: [] }) as Venue;

function PinBoard({ v, up }: { v: Venue; up: (p: Partial<Venue>) => void }) {
  const { media } = useDraft();
  const ref = useRef<HTMLDivElement>(null);
  const img = v.landmarkMap.image ? media[v.landmarkMap.image] : undefined;
  return (
    <div className="space-y-4">
      <MediaField label="Map image" value={v.landmarkMap.image} category="VENUE" onChange={(id) => up({ landmarkMap: { ...v.landmarkMap, image: id } })} aspect="aspect-[4/3]" hint="An illustrated sketch or an annotated satellite screenshot of the venue grounds." />
      {img && (
        <div>
          <p className="mb-1.5 text-[13.5px] font-medium text-ink-2">Click the map to drop a pin</p>
          <div ref={ref} className="relative cursor-crosshair overflow-hidden rounded-md border border-rule" onClick={(e) => { const r = ref.current!.getBoundingClientRect(); up({ landmarkMap: { ...v.landmarkMap, pins: [...v.landmarkMap.pins, { id: newId(), label: {}, x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) }] } }); }}>
            <img src={img.url} alt="" className="w-full" />
            {v.landmarkMap.pins.map((p, i) => (<span key={p.id} className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white shadow ring-2 ring-white" style={{ left: `${p.x}%`, top: `${p.y}%` }}>{i + 1}</span>))}
          </div>
          <div className="mt-3 space-y-2">
            {v.landmarkMap.pins.map((p, i) => (
              <div key={p.id} className="flex items-start gap-2"><span className="mt-2.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white">{i + 1}</span><div className="flex-1"><LText label={`Pin ${i + 1} label`} value={p.label} onChange={(l) => up({ landmarkMap: { ...v.landmarkMap, pins: v.landmarkMap.pins.map((x) => (x.id === p.id ? { ...x, label: l } : x)) } })} /></div><button type="button" className="btn btn-ghost btn-sm mt-7 text-bad" onClick={() => up({ landmarkMap: { ...v.landmarkMap, pins: v.landmarkMap.pins.filter((x) => x.id !== p.id) } })}>Remove</button></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function VenueStep() {
  const { doc, update, has } = useDraft();
  return (
    <div className="space-y-6">
      <FormCard title="Venues" description="Where each celebration happens. Guests get an Open-in-Google-Maps button, parking and directions — the map itself loads only when a guest asks for it.">
        <ListEditor
          items={doc.venues}
          onChange={(items) => update((d) => void (d.venues = items))}
          keyOf={(v) => v.id}
          title={(v) => [v.name.en, v.city.en].filter(Boolean).join(", ")}
          make={blank}
          addLabel="Add a venue"
          defaultOpen
          empty="Add the main venue to begin."
          render={(v, _i, up) => (
            <>
              <LText label="Venue name" required value={v.name} onChange={(x) => up({ name: x })} />
              <LText label="Address" multiline value={v.address} onChange={(x) => up({ address: x })} />
              <Grid><LText label="Town / city" value={v.city} onChange={(x) => up({ city: x })} /><TextField label="Google Maps link" value={v.mapUrl} onChange={(e) => up({ mapUrl: e.target.value })} placeholder="https://maps.app.goo.gl/…" hint="Paste the ‘Share’ link from Google Maps." /></Grid>
              <Grid>
                <TextField label="Latitude (optional)" inputMode="decimal" value={v.lat ?? ""} onChange={(e) => up({ lat: e.target.value === "" ? undefined : Number(e.target.value) })} hint="Enables the embedded map and ‘how far you are’ on the opening screen." />
                <TextField label="Longitude (optional)" inputMode="decimal" value={v.lng ?? ""} onChange={(e) => up({ lng: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </Grid>
              <MediaField label="Venue photo" value={v.photo} category="VENUE" onChange={(id) => up({ photo: id })} />
              <fieldset className="space-y-4 rounded-md border border-rule bg-surface p-4"><legend className="px-1 text-[13.5px] font-medium text-ink-2">Parking</legend><LText label="Parking guide" multiline value={v.parking.info} onChange={(x) => up({ parking: { ...v.parking, info: x } })} /><TextField label="Parking map link" value={v.parking.mapUrl} onChange={(e) => up({ parking: { ...v.parking, mapUrl: e.target.value } })} hint={has("parking_qr") ? "Guests also get a QR code for this link." : undefined} /></fieldset>
              <fieldset className="space-y-4 rounded-md border border-rule bg-surface p-4"><legend className="px-1 text-[13.5px] font-medium text-ink-2">Getting there</legend>
                <LText label="From the airport" multiline value={v.directions.airport} onChange={(x) => up({ directions: { ...v.directions, airport: x } })} hint="One step per line becomes a numbered route." />
                <LText label="From the railway station" multiline value={v.directions.railway} onChange={(x) => up({ directions: { ...v.directions, railway: x } })} />
                <LText label="By road" multiline value={v.directions.road} onChange={(x) => up({ directions: { ...v.directions, road: x } })} />
              </fieldset>
              {has("travel_info") ? (
                <fieldset className="space-y-3 rounded-md border border-rule bg-surface p-4"><legend className="px-1 text-[13.5px] font-medium text-ink-2">Hotels & stay</legend>
                  <ListEditor items={v.hotels} onChange={(items) => up({ hotels: items })} keyOf={(h) => h.id} title={(h) => h.name.en || "Hotel"} make={() => ({ id: newId(), name: {}, area: {}, priceHint: "", phone: "", url: "", note: {} }) as never} addLabel="Add a hotel"
                    render={(h, _j, hu) => (<><LText label="Hotel name" value={h.name} onChange={(x) => hu({ name: x })} /><Grid><LText label="Area" value={h.area} onChange={(x) => hu({ area: x })} /><TextField label="Distance (km)" inputMode="decimal" value={h.distanceKm ?? ""} onChange={(e) => hu({ distanceKm: e.target.value === "" ? undefined : Number(e.target.value) })} /></Grid><Grid><TextField label="Price hint" value={h.priceHint} onChange={(e) => hu({ priceHint: e.target.value })} placeholder="₹4,500 / night" /><TextField label="Phone" value={h.phone} onChange={(e) => hu({ phone: e.target.value })} /></Grid><TextField label="Booking link" value={h.url} onChange={(e) => hu({ url: e.target.value })} /><LText label="Note" value={h.note} onChange={(x) => hu({ note: x })} /><MediaField label="Photo" value={h.photo} category="VENUE" onChange={(id) => hu({ photo: id })} /></>)} />
                </fieldset>
              ) : (
                <Hint>Hotel recommendations and travel directions are part of the Signature package.</Hint>
              )}
              {has("nearby_guide") && (
                <>
                  <fieldset className="space-y-3 rounded-md border border-rule bg-surface p-4"><legend className="px-1 text-[13.5px] font-medium text-ink-2">Things to do nearby</legend>
                    <ListEditor items={v.nearby} onChange={(items) => up({ nearby: items })} keyOf={(n) => n.id} title={(n) => n.name.en || "Place"} make={() => ({ id: newId(), name: {}, kind: "", note: {}, mapUrl: "" }) as never} addLabel="Add a place"
                      render={(n, _j, nu) => (<><Grid><LText label="Name" value={n.name} onChange={(x) => nu({ name: x })} /><TextField label="Kind" value={n.kind} onChange={(e) => nu({ kind: e.target.value })} placeholder="Nature, Food, Culture" /></Grid><LText label="Why go" multiline value={n.note} onChange={(x) => nu({ note: x })} /><TextField label="Map link" value={n.mapUrl} onChange={(e) => nu({ mapUrl: e.target.value })} /></>)} />
                  </fieldset>
                  <fieldset className="space-y-3 rounded-md border border-rule bg-surface p-4"><legend className="px-1 text-[13.5px] font-medium text-ink-2">Destination guide</legend>
                    <ListEditor items={v.guide} onChange={(items) => up({ guide: items })} keyOf={(g) => g.id} title={(g) => g.title.en || "Section"} make={() => ({ id: newId(), title: {}, body: {} }) as never} addLabel="Add a guide section"
                      render={(g, _j, gu) => (<><LText label="Heading" value={g.title} onChange={(x) => gu({ title: x })} placeholder="Weather in January" /><LText label="Text" multiline rows={4} value={g.body} onChange={(x) => gu({ body: x })} /></>)} />
                  </fieldset>
                </>
              )}
              {has("travel_planner") && (
                <fieldset className="space-y-3 rounded-md border border-rule bg-surface p-4"><legend className="px-1 text-[13.5px] font-medium text-ink-2">Shuttle</legend>
                  <LText label="Shuttle information" multiline value={v.shuttle.info} onChange={(x) => up({ shuttle: { ...v.shuttle, info: x } })} />
                  <ListEditor items={v.shuttle.schedule} onChange={(items) => up({ shuttle: { ...v.shuttle, schedule: items } })} keyOf={(s) => s.id} title={(s) => `${s.time || "--:--"} ${s.from.en ?? ""} → ${s.to.en ?? ""}`} make={() => ({ id: newId(), time: "", from: {}, to: {} }) as never} addLabel="Add a departure"
                    render={(s, _j, su) => (<Grid cols={3}><TextField label="Time" type="time" value={s.time} onChange={(e) => su({ time: e.target.value })} /><LText label="From" value={s.from} onChange={(x) => su({ from: x })} /><LText label="To" value={s.to} onChange={(x) => su({ to: x })} /></Grid>)} />
                </fieldset>
              )}
              {has("custom_venue_map") && <fieldset className="rounded-md border border-rule bg-surface p-4"><legend className="px-1 text-[13.5px] font-medium text-ink-2">Illustrated venue map</legend><PinBoard v={v} up={up} /></fieldset>}
            </>
          )}
        />
      </FormCard>
    </div>
  );
}
