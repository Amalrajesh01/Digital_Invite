"use client";
import { newId } from "@/lib/id";
import { FormCard, Grid, Hint, LText, ListEditor } from "../forms";
import { MediaField } from "../MediaField";
import { useDraft } from "../draft";

export function StoryStep() {
  const { doc, update, has } = useDraft();
  const s = doc.story;
  const extras = has("couple_extras");
  return (
    <div className="space-y-6">
      <FormCard title="How we met" description="A short, warm paragraph. This is often the most-read part of the invitation.">
        <LText label="Title" value={s.howWeMet.title} onChange={(v) => update((d) => void (d.story.howWeMet.title = v))} placeholder="A yellow umbrella" />
        <LText label="The story" multiline rows={5} value={s.howWeMet.body} onChange={(v) => update((d) => void (d.story.howWeMet.body = v))} />
        <MediaField label="Photo" value={s.howWeMet.photo} category="COUPLE" onChange={(id) => update((d) => void (d.story.howWeMet.photo = id))} aspect="aspect-[5/4]" />
      </FormCard>

      <FormCard title="Our journey — timeline chapters" description="Three to five chapters read best: the first meeting, a turning point, the proposal.">
        <ListEditor
          items={s.chapters}
          onChange={(items) => update((d) => void (d.story.chapters = items))}
          keyOf={(c) => c.id}
          title={(c) => `${c.when.en ? c.when.en + " — " : ""}${c.title.en || "New chapter"}`}
          make={() => ({ id: newId(), when: {}, title: {}, body: {}, photo: undefined }) as never}
          addLabel="Add a chapter"
          empty="Add your first chapter — where and when it began."
          render={(c, _i, up) => (
            <>
              <Grid><LText label="When" value={c.when} onChange={(v) => up({ when: v })} placeholder="Monsoon 2018" /><LText label="Title" value={c.title} onChange={(v) => up({ title: v })} /></Grid>
              <LText label="What happened" multiline rows={4} value={c.body} onChange={(v) => up({ body: v })} />
              <MediaField label="Photo" value={c.photo} category="COUPLE" onChange={(id) => up({ photo: id })} />
            </>
          )}
        />
      </FormCard>

      {extras ? (
        <>
          <FormCard title="Then & now" description="Two photos of the same place or pose, years apart. Guests drag a slider to compare.">
            <ListEditor
              items={s.thenNow}
              onChange={(items) => update((d) => void (d.story.thenNow = items))}
              keyOf={(c) => c.id}
              title={(c) => c.label.en || "Then & now"}
              make={() => ({ id: newId(), label: {}, then: undefined, now: undefined }) as never}
              addLabel="Add a then & now"
              render={(c, _i, up) => (<><LText label="Caption" value={c.label} onChange={(v) => up({ label: v })} /><Grid><MediaField label="Then" value={c.then} category="COUPLE" onChange={(id) => up({ then: id })} aspect="aspect-[4/5]" /><MediaField label="Now" value={c.now} category="COUPLE" onChange={(id) => up({ now: id })} aspect="aspect-[4/5]" /></Grid></>)}
            />
          </FormCard>

          <FormCard title="Memory cards" description="Small keepsakes — a napkin sketch, a train ticket, a first gift.">
            <ListEditor
              items={s.memoryCards}
              onChange={(items) => update((d) => void (d.story.memoryCards = items))}
              keyOf={(c) => c.id}
              title={(c) => c.title.en || "Memory"}
              make={() => ({ id: newId(), title: {}, body: {}, photo: undefined }) as never}
              addLabel="Add a memory card"
              render={(c, _i, up) => (<><LText label="Title" value={c.title} onChange={(v) => up({ title: v })} /><LText label="A line" value={c.body} onChange={(v) => up({ body: v })} /><MediaField label="Photo" value={c.photo} category="COUPLE" aspect="aspect-square" onChange={(id) => up({ photo: id })} /></>)}
            />
          </FormCard>

          <FormCard title="Getting to know us" description="Fun facts guests can flip through — loves, can’t-live-withouts, secret talents.">
            {(["bride", "groom"] as const).map((who) => (
              <div key={who}>
                <p className="mb-2 text-[13.5px] font-medium text-ink-2">{who === "bride" ? "The bride" : "The groom"}</p>
                <ListEditor
                  items={s.personality[who]}
                  onChange={(items) => update((d) => void (d.story.personality[who] = items))}
                  keyOf={(c) => c.id}
                  title={(c) => `${c.label.en || "Label"}: ${c.value.en || "…"}`}
                  make={() => ({ id: newId(), label: {}, value: {} }) as never}
                  addLabel="Add a fact"
                  render={(c, _i, up) => (<Grid><LText label="Label" value={c.label} onChange={(v) => up({ label: v })} placeholder="Loves" /><LText label="Answer" value={c.value} onChange={(v) => up({ value: v })} /></Grid>)}
                />
              </div>
            ))}
          </FormCard>

          <FormCard title="Voice story (optional)" description="Record a short message in your own voice.">
            <MediaField label="Audio" kinds={["AUDIO"]} category="MUSIC" value={s.voiceStory.audio} onChange={(id) => update((d) => void (d.story.voiceStory.audio = id))} />
            <LText label="Transcript" multiline value={s.voiceStory.transcript} onChange={(v) => update((d) => void (d.story.voiceStory.transcript = v))} hint="Shown beneath the player — good for accessibility and for guests who prefer to read." />
          </FormCard>
        </>
      ) : (
        <Hint>Then & now, memory cards, personality cards and the voice story are part of the Signature package.</Hint>
      )}
    </div>
  );
}
