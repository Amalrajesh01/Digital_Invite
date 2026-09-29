"use client";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { TextField, Switch, Checkbox, SelectField } from "@/components/ui/Field";
import { newId } from "@/lib/id";
import type { WeddingEvent } from "@/domain/doc/schema";
import { FormCard, Grid, Hint, LText, ListEditor } from "../forms";
import { MediaField } from "../MediaField";
import { useDraft } from "../draft";
import { fmtDate } from "@/invitation/engine/format";

const blank = (order: number): WeddingEvent => ({
  id: newId(), name: {}, date: "", startTime: "", endTime: "", venueId: undefined, description: {}, dressCode: {}, dressColors: [], notes: {}, photo: undefined, mapUrl: "",
  visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: {}, body: {} }, isMain: false, order,
});

export function EventsStep() {
  const { doc, update, has, groups, settings, updateSettings } = useDraft();
  const venues = doc.venues;
  const setEvent = (id: string, patch: Partial<WeddingEvent>) => update((d) => { const e = d.events.find((x) => x.id === id); if (e) Object.assign(e, patch); });

  return (
    <div className="space-y-6">
      <FormCard title="Every celebration" description="Add each ceremony and celebration — mehendi, haldi, the wedding itself, the feast, the reception. Guests see them as ticket cards with time, place, dress code and a one-tap ‘Add to calendar’.">
        <ListEditor
          items={doc.events}
          onChange={(items) => update((d) => void (d.events = items.map((e, i) => ({ ...e, order: i }))))}
          keyOf={(e) => e.id}
          title={(e) => [e.name.en, e.date ? fmtDate(e.date, "en", "short") : ""].filter(Boolean).join(" · ")}
          make={() => blank(doc.events.length)}
          addLabel="Add an event"
          empty="No events yet. Start with the main ceremony — the countdown counts down to it."
          defaultOpen
          render={(e, _i, up) => (
            <>
              <LText label="Event name" required value={e.name} onChange={(v) => up({ name: v })} placeholder="Muhurtham" />
              <Grid cols={3}>
                <TextField label="Date" type="date" value={e.date} onChange={(ev) => up({ date: ev.target.value })} />
                <TextField label="Starts" type="time" value={e.startTime} onChange={(ev) => up({ startTime: ev.target.value })} />
                <TextField label="Ends" type="time" value={e.endTime} onChange={(ev) => up({ endTime: ev.target.value })} />
              </Grid>
              <Grid>
                <SelectField label="Venue" value={e.venueId ?? ""} onChange={(ev) => up({ venueId: ev.target.value || undefined })} hint={venues.length ? undefined : "Add venues in the Venue step first."}>
                  <option value="">Not decided yet</option>
                  {venues.map((v) => (<option key={v.id} value={v.id}>{v.name.en || "Unnamed venue"}</option>))}
                </SelectField>
                <div className="flex items-end pb-2"><Switch label="This is the main ceremony" hint="The countdown and calendar focus on this event." checked={e.isMain} onChange={(v) => update((d) => void d.events.forEach((x) => (x.isMain = x.id === e.id ? v : false)))} /></div>
              </Grid>
              <LText label="What happens" multiline value={e.description} onChange={(v) => up({ description: v })} />
              <Grid>
                <LText label="Dress code" value={e.dressCode} onChange={(v) => up({ dressCode: v })} placeholder="Kasavu — cream & gold" />
                <div>
                  <p className="mb-1.5 text-[13.5px] font-medium text-ink-2">Colour suggestions</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {e.dressColors.map((c, i) => (
                      <span key={c + i} className="relative"><input type="color" aria-label={`Colour ${i + 1}`} value={c} onChange={(ev) => up({ dressColors: e.dressColors.map((x, j) => (j === i ? ev.target.value : x)) })} className="size-9 cursor-pointer rounded-full border border-rule-strong bg-transparent p-0.5" /><button type="button" aria-label="Remove colour" onClick={() => up({ dressColors: e.dressColors.filter((_, j) => j !== i) })} className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-ink text-paper"><X className="size-2.5" /></button></span>
                    ))}
                    {e.dressColors.length < 5 && <button type="button" onClick={() => up({ dressColors: [...e.dressColors, "#c2a04c"] })} className="grid size-9 place-items-center rounded-full border border-dashed border-rule-strong text-muted hover:border-accent hover:text-accent" aria-label="Add a colour"><Plus className="size-4" /></button>}
                  </div>
                </div>
              </Grid>
              <LText label="Good to know (optional)" value={e.notes} onChange={(v) => up({ notes: v })} placeholder="Please be seated by 10:00." />
              <FormCardInner title="Ritual explainer (optional)">
                <LText label="Ritual name" value={e.ritual.title} onChange={(v) => up({ ritual: { ...e.ritual, title: v } })} placeholder="Thalikettu" />
                <LText label="What it means" multiline value={e.ritual.body} onChange={(v) => up({ ritual: { ...e.ritual, body: v } })} hint="A short, friendly explanation for guests who are new to the ritual." />
              </FormCardInner>
              <MediaField label="Photo (optional)" value={e.photo} category="EVENT" onChange={(id) => up({ photo: id })} />
              <TextField label="Custom map link (optional)" value={e.mapUrl} onChange={(ev) => up({ mapUrl: ev.target.value })} placeholder="https://maps.app.goo.gl/…" hint="Leave empty to use the venue’s map." />
              <div className="rounded-md border border-rule bg-paper-2/60 p-4">
                <p className="text-[13.5px] font-medium text-ink-2">Who can see this event?</p>
                {has("event_visibility") ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2" role="radiogroup" aria-label="Who can see this event">
                      {(["EVERYONE", "GROUPS"] as const).map((m) => (
                        <button key={m} type="button" role="radio" aria-checked={e.visibility.mode === m} onClick={() => up({ visibility: { ...e.visibility, mode: m } })} className={`btn btn-sm ${e.visibility.mode === m ? "btn-primary" : "btn-quiet"}`}>{m === "EVERYONE" ? "Everyone" : "Only some guest groups"}</button>
                      ))}
                    </div>
                    {e.visibility.mode === "GROUPS" && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {groups.map((g) => (<Checkbox key={g.key} label={g.name} checked={e.visibility.groups.includes(g.key)} onChange={(on) => up({ visibility: { ...e.visibility, groups: on ? [...e.visibility.groups, g.key] : e.visibility.groups.filter((x) => x !== g.key) } })} />))}
                        <p className="col-span-full text-[13px] text-muted">Hidden events — and their addresses — are never sent to other guests’ phones.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-[13.5px] text-muted">Everyone sees every event. Showing events only to certain groups (for example a family-only lunch) is a Luxury feature.</p>
                )}
              </div>
            </>
          )}
        />
        {venues.length === 0 && <Hint>Tip: add the venue(s) first (Venue step) so you can pick one for each event. <Link className="underline" href="venue">Go to Venue</Link></Hint>}
      </FormCard>
      {settings.weddingDate == null && doc.events.some((e) => e.isMain && e.date) && (
        <Hint>
          The wedding date is not set yet.{" "}
          <button type="button" className="underline" onClick={() => updateSettings({ weddingDate: doc.events.find((e) => e.isMain)!.date })}>Use the main ceremony’s date</button>
        </Hint>
      )}
    </div>
  );
}

function FormCardInner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-md border border-rule bg-surface p-4">
      <legend className="px-1 text-[13.5px] font-medium text-ink-2">{title}</legend>
      {children}
    </fieldset>
  );
}
