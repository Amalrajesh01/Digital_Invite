"use client";
import { SelectField, Switch, TextField } from "@/components/ui/Field";
import { newId } from "@/lib/id";
import { EVENT_TYPES, EVENT_TYPE_INFO, type EventType } from "@/domain/doc/event-types";
import { CEREMONY_GLYPHS, type Ceremony } from "@/domain/doc/schema";
import { IMAGE_SLOT_KEYS, IMAGE_SLOTS, assignSlot, ownSlotValue } from "@/domain/imagery/slots";
import { filmSourceFromUrl } from "@/invitation/engine/format";
import { Glyph } from "@/invitation/engine/Glyphs";
import { FormCard, Grid, Hint, LText, ListEditor } from "../forms";
import { MediaField } from "../MediaField";
import { useDraft } from "../draft";

/** The occasion, what happens when the invitation opens, and the little walking couple. */
export function CelebrationCard() {
  const { doc, update } = useDraft();
  const info = EVENT_TYPE_INFO[doc.eventType];
  const auto = info.celebration === "petals" ? "falling petals" : "confetti from both sides";
  return (
    <FormCard title="The occasion" description="What kind of celebration this is decides the opening animation, the line under the names and the two small illustrated figures.">
      <Grid>
        <SelectField label="Occasion" value={doc.eventType} onChange={(e) => update((d) => void (d.eventType = e.target.value as EventType))}>
          {EVENT_TYPES.map((k) => (<option key={k} value={k}>{EVENT_TYPE_INFO[k].label}</option>))}
        </SelectField>
        <SelectField label="When the invitation opens" value={doc.opening.celebration} onChange={(e) => update((d) => void (d.opening.celebration = e.target.value as never))} hint="Plays once, for a few seconds, and never for guests who prefer reduced motion.">
          <option value="auto">Automatic — {auto}</option>
          <option value="petals">Falling petals (marigold, rose, jasmine)</option>
          <option value="confetti">Gold confetti from both sides</option>
          <option value="off">Nothing</option>
        </SelectField>
      </Grid>
      {info.couple ? (
        <>
          <Switch label="Show the walking bride and groom" hint="Two small illustrated figures start in the bottom corners and walk towards each other as the guest scrolls — hand in hand by the last section." checked={doc.journey.enabled} onChange={(v) => update((d) => void (d.journey.enabled = v))} />
          {doc.journey.enabled && (
            <Grid>
              <TextField label="Bride’s face zoom" type="number" step="0.05" min="0.4" max="6" value={String(doc.journey.headZoom.bride)} onChange={(e) => update((d) => void (d.journey.headZoom.bride = Math.min(6, Math.max(0.4, Number(e.target.value) || 1))))} hint="The figures wear the bride’s and groom’s real faces (from their portraits). Raise to zoom in on a wide photo, lower for a tight close-up. Set the face position as each photo’s focal point in the Media library." />
              <TextField label="Groom’s face zoom" type="number" step="0.05" min="0.4" max="6" value={String(doc.journey.headZoom.groom)} onChange={(e) => update((d) => void (d.journey.headZoom.groom = Math.min(6, Math.max(0.4, Number(e.target.value) || 1))))} />
            </Grid>
          )}
          {doc.journey.enabled && (
            <SelectField label="Their outfits" value={doc.journey.style} onChange={(e) => update((d) => void (d.journey.style = e.target.value as never))}>
              <option value="auto">Automatic for this occasion</option>
              <option value="classic">Lehenga & sherwani</option>
              <option value="kerala">Kasavu saree & mundu</option>
              <option value="western">Gown & suit</option>
            </SelectField>
          )}
        </>
      ) : (
        <Hint>The walking couple is for occasions with two people — it is hidden for a birthday.</Hint>
      )}
    </FormCard>
  );
}

/** "Chat with us on WhatsApp" */
export function ChatCard() {
  const { doc, update } = useDraft();
  return (
    <FormCard title="WhatsApp" description="Guests see a quiet ‘Chat with us on WhatsApp’ button under the RSVP, in the contacts and at the very end. Leave the number empty to hide it.">
      <Grid>
        <TextField label="WhatsApp number" inputMode="tel" value={doc.whatsapp.number} onChange={(e) => update((d) => void (d.whatsapp.number = e.target.value.replace(/[^\d]/g, "").slice(0, 15)))} placeholder="919846000000" hint="Country code first, digits only — for India, 91 then the ten-digit number." />
        <LText label="Pre-filled message" value={doc.whatsapp.message} onChange={(v) => update((d) => void (d.whatsapp.message = v))} placeholder="Hello! I’m writing about {title}." hint="{title} becomes the invitation title." />
      </Grid>
    </FormCard>
  );
}

/** Every named photograph slot in one place. Choosing a photo here changes it everywhere it appears. */
export function KeyPhotos() {
  const { doc, update } = useDraft();
  return (
    <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
      {IMAGE_SLOT_KEYS.map((slot) => {
        const def = IMAGE_SLOTS[slot];
        const noVenue = slot === "venue" && doc.venues.length === 0;
        return (
          <MediaField
            key={slot}
            label={def.label}
            value={ownSlotValue(doc, slot)}
            category={def.category}
            aspect={def.aspect}
            hint={noVenue ? "Add a venue first (Venue step), then choose its photograph." : `${def.usedFor}. ${def.ratio}. If empty: ${def.fallback}.`}
            onChange={(id) => update((d) => assignSlot(d, slot, id))}
          />
        );
      })}
    </div>
  );
}

/** The wedding film: a link or an upload. Empty = the section is not shown. */
export function FilmEditor() {
  const { doc, update } = useDraft();
  const f = doc.film;
  const url = f.url.trim();
  const status = !url ? null : filmSourceFromUrl(url) ? "ok" : "bad";
  return (
    <FormCard title="Wedding film" description="Optional. Paste a YouTube or Vimeo link, or upload a video. With neither, the film section does not appear at all.">
      <TextField label="YouTube or Vimeo link" value={f.url} onChange={(e) => update((d) => void (d.film.url = e.target.value))} placeholder="https://www.youtube.com/watch?v=…" hint={status === "bad" ? "That does not look like a YouTube or Vimeo link, or a direct https .mp4 / .webm link." : status === "ok" ? "Recognised. Nothing is loaded from the video site until a guest presses play." : "Only YouTube, Vimeo and direct https video files can play."} error={status === "bad" ? "Not a supported video link" : undefined} />
      <MediaField label="…or upload a film" kinds={["VIDEO"]} category="VIDEO" aspect="aspect-video" className="max-w-md" value={f.video} onChange={(id) => update((d) => void (d.film.video = id))} hint="Up to 200 MB, three minutes. An uploaded film takes priority over the link." />
      <MediaField label="Cover photograph (optional)" value={f.poster} category="COUPLE" aspect="aspect-video" className="max-w-md" onChange={(id) => update((d) => void (d.film.poster = id))} hint="Shown before the film plays. Empty = the couple photograph." />
      <Grid>
        <LText label="Title" value={f.title} onChange={(v) => update((d) => void (d.film.title = v))} placeholder="Our wedding film" />
        <LText label="A line under the film" value={f.caption} onChange={(v) => update((d) => void (d.film.caption = v))} />
      </Grid>
    </FormCard>
  );
}

const GLYPH_LABEL: Record<(typeof CEREMONY_GLYPHS)[number], string> = { lamp: "Oil lamp", kalash: "Kalash", flame: "Sacred fire", rings: "Rings", drum: "Dhol", flower: "Marigold", bowl: "Turmeric bowl", knot: "Knot of hearts", none: "None" };

/** The rituals of the wedding — entirely the family's own list. */
export function CeremoniesEditor() {
  const { doc, update } = useDraft();
  const c = doc.ceremonies;
  return (
    <FormCard title="Ceremonies" description="Explain the rituals your families observe — Ganesh Puja, Haldi, Baraat, Kanyadaan, Mangal Phera, or something entirely your own. Nothing is assumed: guests see exactly this list.">
      <LText label="A line to introduce them (optional)" multiline value={c.intro} onChange={(v) => update((d) => void (d.ceremonies.intro = v))} />
      <ListEditor
        items={c.items}
        onChange={(items) => update((d) => void (d.ceremonies.items = items))}
        keyOf={(i) => i.id}
        title={(i) => i.name.en || "New ceremony"}
        make={() => ({ id: newId(), name: {}, when: {}, description: {}, photo: undefined, glyph: "lamp" }) as Ceremony}
        addLabel="Add a ceremony"
        max={12}
        empty="No ceremonies yet — the section stays hidden until you add one."
        render={(i, _n, up) => (
          <>
            <LText label="Name" required value={i.name} onChange={(v) => up({ name: v })} placeholder="Mangal Phera" />
            <LText label="When" value={i.when} onChange={(v) => up({ when: v })} placeholder="12 December, 11:30 am" />
            <LText label="What it means" multiline rows={3} value={i.description} onChange={(v) => up({ description: v })} />
            <Grid>
              <MediaField label="Photograph (optional)" value={i.photo} category="EVENT" aspect="aspect-[3/4]" onChange={(id) => up({ photo: id })} />
              <div className="space-y-2">
                <SelectField label="Illustration (when there is no photograph)" value={i.glyph} onChange={(e) => up({ glyph: e.target.value as Ceremony["glyph"] })}>
                  {CEREMONY_GLYPHS.map((g) => (<option key={g} value={g}>{GLYPH_LABEL[g]}</option>))}
                </SelectField>
                {i.glyph !== "none" && <span className="block size-14 text-accent"><Glyph name={i.glyph} /></span>}
              </div>
            </Grid>
          </>
        )}
      />
    </FormCard>
  );
}

/** "Our story" opening lines + the photograph beside them. */
export function StoryPrologue() {
  const { doc, update } = useDraft();
  const s = doc.story;
  return (
    <FormCard title="The opening lines" description="Four short lines read best — one thought per line. They appear large, beside a photograph of the two of you.">
      <LText label="Lines" multiline rows={5} value={s.intro} onChange={(v) => update((d) => void (d.story.intro = v))} placeholder={"Two paths.\nOne unexpected meeting.\nA thousand memories.\nAnd now, forever."} hint="Press Enter between lines. The last line is set in the accent colour." />
      <MediaField label="Photograph" value={s.introPhoto ?? doc.images.story} category="COUPLE" aspect="aspect-[4/5]" onChange={(id) => update((d) => { d.story.introPhoto = id; d.images.story = id; })} hint="Portrait works best." />
    </FormCard>
  );
}

/** "The beginning": four or five dated milestones. */
export function MilestonesEditor() {
  const { doc, update } = useDraft();
  return (
    <FormCard title="The beginning — milestones" description="Four or five dated moments, from the first meeting to the wedding. They appear as large outlined years down the page.">
      <ListEditor
        items={doc.story.milestones}
        onChange={(items) => update((d) => void (d.story.milestones = items))}
        keyOf={(m) => m.id}
        title={(m) => `${m.year ? m.year + " — " : ""}${m.title.en || "New milestone"}`}
        make={() => ({ id: newId(), year: "", title: {}, caption: {}, photo: undefined }) as never}
        addLabel="Add a milestone"
        max={8}
        empty="Add the first one — usually the day you met."
        render={(m, _i, up) => (
          <>
            <Grid>
              <TextField label="Year" value={m.year} maxLength={24} onChange={(e) => up({ year: e.target.value })} placeholder="2019" />
              <LText label="Title" value={m.title} onChange={(v) => up({ title: v })} placeholder="First meeting" />
            </Grid>
            <LText label="A line or two" multiline rows={3} value={m.caption} onChange={(v) => up({ caption: v })} />
            <MediaField label="Photograph (optional)" value={m.photo} category="COUPLE" aspect="aspect-[4/5]" onChange={(id) => up({ photo: id })} />
          </>
        )}
      />
      {doc.story.milestones.length === 0 && doc.story.chapters.length > 0 && <Hint>With no milestones, this section shows the chapters below instead.</Hint>}
    </FormCard>
  );
}
