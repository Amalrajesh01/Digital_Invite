"use client";
import { SelectField, Switch, TextField } from "@/components/ui/Field";
import { newId } from "@/lib/id";
import { EVENT_KINDS, type AgendaItem, type Highlight, type OccasionPerson, type Speaker, type Sponsor } from "@/domain/doc/schema";
import { subjectKind, type SubjectKind } from "@/domain/doc/event-types";
import { FormCard, Grid, Hint, LText, ListEditor } from "../forms";
import { MediaField } from "../MediaField";
import { useDraft } from "../draft";

/**
 * The studio's editor for every occasion that is not a couple: the headline, the person, what it is about,
 * the people on stage, the programme, the partners, a message, the people left behind, a prayer.
 * Which cards appear follows the kind of occasion; everything lands in `doc.occasion`.
 */
const KIND_LABEL: Record<(typeof EVENT_KINDS)[number], string> = { session: "Session", keynote: "Keynote", panel: "Panel", workshop: "Workshop", break: "Break", networking: "Networking", ceremony: "Ceremony" };

function HeadlineCard({ kind }: { kind: SubjectKind }) {
  const { doc, update } = useDraft();
  const o = doc.occasion;
  const memorial = kind === "memorial";
  return (
    <FormCard title="The headline" description="The big words on the opening screen and at the top of the invitation.">
      <LText label={memorial ? "Name" : kind === "person" ? "Name of the guest of honour" : "Title of the occasion"} required value={o.title} onChange={(v) => update((d) => void (d.occasion.title = v))} placeholder={memorial ? "Thomas Mathew" : kind === "person" ? "Meera" : "Leadership Conclave 2026"} hint="Falls back to the invitation title if left empty." />
      <Grid>
        <LText label="The line under it" value={o.subtitle} onChange={(v) => update((d) => void (d.occasion.subtitle = v))} placeholder={memorial ? "A life of faith, kindness and quiet strength" : kind === "person" ? "turns thirty" : "Where leaders shape what comes next"} />
        <LText label="The line above it" value={o.invitation} onChange={(v) => update((d) => void (d.occasion.invitation = v))} placeholder={memorial ? "In loving memory of" : "You are invited to"} />
      </Grid>
      <Grid>
        <LText label="Hosted by (optional)" value={o.hosts} onChange={(v) => update((d) => void (d.occasion.hosts = v))} placeholder="The Nair family" />
        <LText label="Date as it should read (optional)" value={o.dateLabel} onChange={(v) => update((d) => void (d.occasion.dateLabel = v))} placeholder="12 – 13 November 2026" hint="For an occasion that lasts more than a day. Otherwise the main event’s date is used." />
      </Grid>
      <TextField label="Seal letters (optional)" maxLength={4} value={o.monogram} onChange={(e) => update((d) => void (d.occasion.monogram = e.target.value.toUpperCase()))} hint="Shown on the wax seal. Leave empty to use the initials of the title." />
    </FormCard>
  );
}

function HonoreeCard({ kind }: { kind: SubjectKind }) {
  const { doc, update } = useDraft();
  const h = doc.occasion.honoree;
  const memorial = kind === "memorial";
  return (
    <FormCard title={memorial ? "The person being remembered" : "The guest of honour"} description={memorial ? "A portrait and the dates of a life. Shown with care, never with effects." : "Their photograph is the opening picture of the invitation."}>
      <Grid>
        <LText label="Name" value={h.name} onChange={(v) => update((d) => void (d.occasion.honoree.name = v))} />
        <LText label="Full name" value={h.fullName} onChange={(v) => update((d) => void (d.occasion.honoree.fullName = v))} />
      </Grid>
      <LText label={memorial ? "Who they were to us" : "Role (optional)"} value={h.role} onChange={(v) => update((d) => void (d.occasion.honoree.role = v))} placeholder={memorial ? "Beloved husband, father, grandfather and teacher" : "Our birthday girl"} />
      <Grid cols={3}>
        {memorial && <TextField label="Born" type="date" value={h.born} onChange={(e) => update((d) => void (d.occasion.honoree.born = e.target.value))} />}
        {memorial && <TextField label="Passed away" type="date" value={h.passed} onChange={(e) => update((d) => void (d.occasion.honoree.passed = e.target.value))} />}
        {!memorial && <TextField label="Age or milestone" value={h.age} maxLength={40} onChange={(e) => update((d) => void (d.occasion.honoree.age = e.target.value))} placeholder="30" />}
      </Grid>
      <LText label="A line to remember them by" value={h.epitaph} onChange={(v) => update((d) => void (d.occasion.honoree.epitaph = v))} placeholder="Forever in our hearts" />
      <MediaField label="Portrait" value={h.photo} category="PEOPLE" aspect="aspect-[4/5]" onChange={(id) => update((d) => void (d.occasion.honoree.photo = id))} hint="A portrait works best; you can set a focal point in the Media library." />
      <Hint>The opening picture of the invitation is the “main photograph” you choose in the Media step.</Hint>
    </FormCard>
  );
}

function AboutCard({ kind }: { kind: SubjectKind }) {
  const { doc, update } = useDraft();
  const a = doc.occasion.about;
  const memorial = kind === "memorial";
  return (
    <FormCard title={memorial ? "Their story" : "What it is about"} description={memorial ? "A few paragraphs about their life. Leave a blank line between paragraphs." : "The words and the facts at a glance. Leave a blank line between paragraphs."}>
      <Grid>
        <LText label="Small heading above (optional)" value={a.eyebrow} onChange={(v) => update((d) => void (d.occasion.about.eyebrow = v))} placeholder="At a glance" />
        <LText label="Heading" value={a.title} onChange={(v) => update((d) => void (d.occasion.about.title = v))} placeholder={memorial ? "A life remembered" : "About the occasion"} />
      </Grid>
      <LText label="Text" multiline rows={6} value={a.body} onChange={(v) => update((d) => void (d.occasion.about.body = v))} />
      <p className="text-[13.5px] font-medium text-ink-2">Facts at a glance</p>
      <ListEditor<Highlight>
        items={a.highlights}
        onChange={(items) => update((d) => void (d.occasion.about.highlights = items))}
        keyOf={(i) => i.id}
        title={(i) => `${i.value.en ?? ""} ${i.label.en ?? ""}`.trim() || "New fact"}
        make={() => ({ id: newId(), label: {}, value: {}, note: {} })}
        addLabel="Add a fact"
        max={6}
        empty="For example “2 days”, “12 speakers”, “Free entry”."
        render={(i, _n, up) => (
          <Grid cols={3}>
            <LText label="Big number or word" value={i.value} onChange={(v) => up({ value: v })} placeholder="2 days" />
            <LText label="Label" value={i.label} onChange={(v) => up({ label: v })} placeholder="In Kochi" />
            <LText label="A line under it (optional)" value={i.note} onChange={(v) => up({ note: v })} />
          </Grid>
        )}
      />
      <Grid>
        <LText label="A quote (optional)" multiline value={a.quote.text} onChange={(v) => update((d) => void (d.occasion.about.quote.text = v))} />
        <LText label="Quote by" value={a.quote.author} onChange={(v) => update((d) => void (d.occasion.about.quote.author = v))} />
      </Grid>
    </FormCard>
  );
}

function SpeakersCard() {
  const { doc, update } = useDraft();
  return (
    <FormCard title="Speakers & guests of honour" description="The people on stage. Without a photograph a person is shown with their initials.">
      <ListEditor<Speaker>
        items={doc.occasion.speakers}
        onChange={(items) => update((d) => void (d.occasion.speakers = items))}
        keyOf={(i) => i.id}
        title={(i) => i.name.en || "New speaker"}
        make={() => ({ id: newId(), name: {}, role: {}, org: {}, topic: {}, bio: {}, photo: undefined, featured: false })}
        addLabel="Add a speaker"
        max={40}
        empty="No speakers yet — the section stays hidden until you add one."
        render={(i, _n, up) => (
          <>
            <Grid>
              <LText label="Name" required value={i.name} onChange={(v) => up({ name: v })} />
              <LText label="Role" value={i.role} onChange={(v) => up({ role: v })} placeholder="Chief Executive Officer" />
            </Grid>
            <Grid>
              <LText label="Organisation" value={i.org} onChange={(v) => up({ org: v })} />
              <LText label="Speaking on" value={i.topic} onChange={(v) => up({ topic: v })} />
            </Grid>
            <LText label="Short biography (optional)" multiline rows={3} value={i.bio} onChange={(v) => up({ bio: v })} />
            <Switch label="Feature this person (the keynote layout puts them first)" checked={i.featured} onChange={(v) => up({ featured: v })} />
            <MediaField label="Photograph" value={i.photo} category="PEOPLE" aspect="aspect-[4/5]" onChange={(id) => up({ photo: id })} />
          </>
        )}
      />
    </FormCard>
  );
}

function AgendaCard() {
  const { doc, update } = useDraft();
  const o = doc.occasion;
  return (
    <FormCard title="Programme" description="Session by session, with times, speakers and rooms. Sessions are grouped by day automatically.">
      <ListEditor<AgendaItem>
        items={o.agenda}
        onChange={(items) => update((d) => void (d.occasion.agenda = items))}
        keyOf={(i) => i.id}
        title={(i) => `${i.day ? i.day + " " : ""}${i.start ? i.start + " — " : ""}${i.title.en || "New session"}`}
        make={() => ({ id: newId(), day: "", start: "", end: "", title: {}, speaker: {}, track: {}, room: {}, kind: "session", description: {} })}
        addLabel="Add a session"
        max={80}
        empty="No sessions yet — the programme stays hidden until you add one."
        render={(i, _n, up) => (
          <>
            <LText label="Title" required value={i.title} onChange={(v) => up({ title: v })} />
            <Grid cols={3}>
              <TextField label="Day" type="date" value={i.day} onChange={(e) => up({ day: e.target.value })} />
              <TextField label="Starts" type="time" value={i.start} onChange={(e) => up({ start: e.target.value })} />
              <TextField label="Ends" type="time" value={i.end} onChange={(e) => up({ end: e.target.value })} />
            </Grid>
            <Grid>
              <SelectField label="Kind" value={i.kind} onChange={(e) => up({ kind: e.target.value as AgendaItem["kind"] })}>
                {EVENT_KINDS.map((k) => (<option key={k} value={k}>{KIND_LABEL[k]}</option>))}
              </SelectField>
              <LText label="Speaker(s)" value={i.speaker} onChange={(v) => up({ speaker: v })} />
            </Grid>
            <Grid>
              <LText label="Track (optional)" value={i.track} onChange={(v) => up({ track: v })} />
              <LText label="Room (optional)" value={i.room} onChange={(v) => up({ room: v })} />
            </Grid>
            <LText label="Description (optional)" multiline rows={2} value={i.description} onChange={(v) => up({ description: v })} />
          </>
        )}
      />
      <Grid>
        <LText label="Registration note (optional)" value={o.registration.note} onChange={(v) => update((d) => void (d.occasion.registration.note = v))} placeholder="Seats are limited — please register early." />
        <LText label="Registration button label" value={o.registration.label} onChange={(v) => update((d) => void (d.occasion.registration.label = v))} placeholder="Register" />
      </Grid>
      <TextField label="Registration link (optional)" value={o.registration.url} maxLength={400} onChange={(e) => update((d) => void (d.occasion.registration.url = e.target.value))} placeholder="https://" hint="Leave empty to use the RSVP form on the invitation." />
    </FormCard>
  );
}

function SponsorsCard() {
  const { doc, update } = useDraft();
  return (
    <FormCard title="Partners & sponsors" description="Grouped by tier. A logo is optional; without one the name is set as a wordmark.">
      <ListEditor<Sponsor>
        items={doc.occasion.sponsors}
        onChange={(items) => update((d) => void (d.occasion.sponsors = items))}
        keyOf={(i) => i.id}
        title={(i) => i.name.en || "New partner"}
        make={() => ({ id: newId(), name: {}, tier: {}, url: "", logo: undefined, blurb: {} })}
        addLabel="Add a partner"
        max={40}
        empty="No partners yet — the section stays hidden until you add one."
        render={(i, _n, up) => (
          <>
            <Grid>
              <LText label="Name" required value={i.name} onChange={(v) => up({ name: v })} />
              <LText label="Tier" value={i.tier} onChange={(v) => up({ tier: v })} placeholder="Principal partner" hint="Partners with the same tier are shown together, in the order you add them." />
            </Grid>
            <TextField label="Website (optional)" value={i.url} maxLength={300} onChange={(e) => up({ url: e.target.value })} placeholder="https://" />
            <MediaField label="Logo (optional)" value={i.logo} category="PEOPLE" aspect="aspect-[3/1]" onChange={(id) => up({ logo: id })} />
          </>
        )}
      />
    </FormCard>
  );
}

function MessageCard({ kind }: { kind: SubjectKind }) {
  const { doc, update } = useDraft();
  const m = doc.occasion.message;
  return (
    <FormCard title={kind === "memorial" ? "A message from the family" : "A message"} description="A short letter: the host’s welcome, the organiser’s note, the family’s words. Leave a blank line between paragraphs.">
      <LText label="Heading (optional)" value={m.title} onChange={(v) => update((d) => void (d.occasion.message.title = v))} />
      <LText label="Message" multiline rows={7} value={m.body} onChange={(v) => update((d) => void (d.occasion.message.body = v))} />
      <Grid>
        <LText label="From" value={m.from} onChange={(v) => update((d) => void (d.occasion.message.from = v))} placeholder="Mary, Joseph & Susan" />
        <LText label="Their role (optional)" value={m.role} onChange={(v) => update((d) => void (d.occasion.message.role = v))} placeholder="On behalf of the family" />
      </Grid>
      <MediaField label="Photograph (optional)" value={m.photo} category="PEOPLE" aspect="aspect-square" className="max-w-xs" onChange={(id) => update((d) => void (d.occasion.message.photo = id))} />
    </FormCard>
  );
}

function PeopleCard({ kind }: { kind: SubjectKind }) {
  const { doc, update } = useDraft();
  const memorial = kind === "memorial";
  return (
    <FormCard title={memorial ? "Survived by" : "The people"} description={memorial ? "The family left behind, in groups such as “Beloved wife”, “Children”, “Grandchildren”." : "Hosts, organisers or guests of honour, grouped under headings you choose."}>
      <ListEditor<OccasionPerson>
        items={doc.occasion.people}
        onChange={(items) => update((d) => void (d.occasion.people = items))}
        keyOf={(i) => i.id}
        title={(i) => `${i.name.en || "New person"}${i.group.en ? " · " + i.group.en : ""}`}
        make={() => ({ id: newId(), group: {}, name: {}, relation: {}, note: {}, photo: undefined })}
        addLabel="Add a person"
        max={60}
        empty="Nobody added — the section stays hidden."
        render={(i, _n, up) => (
          <>
            <Grid>
              <LText label="Name" required value={i.name} onChange={(v) => up({ name: v })} />
              <LText label="Group heading" value={i.group} onChange={(v) => up({ group: v })} placeholder={memorial ? "Children" : "Organising committee"} hint="People with the same heading are listed together." />
            </Grid>
            <Grid>
              <LText label="Relation or role" value={i.relation} onChange={(v) => up({ relation: v })} />
              <LText label="A line (optional)" value={i.note} onChange={(v) => up({ note: v })} />
            </Grid>
            <MediaField label="Photograph (optional)" value={i.photo} category="PEOPLE" aspect="aspect-square" className="max-w-xs" onChange={(id) => up({ photo: id })} />
          </>
        )}
      />
    </FormCard>
  );
}

function PrayerCard() {
  const { doc, update } = useDraft();
  const p = doc.occasion.prayer;
  return (
    <FormCard title="A prayer or reading" description="Optional. A verse, a prayer or a reading. Press Enter for a new line.">
      <LText label="Heading (optional)" value={p.title} onChange={(v) => update((d) => void (d.occasion.prayer.title = v))} placeholder="A prayer" />
      <LText label="Text" multiline rows={5} value={p.text} onChange={(v) => update((d) => void (d.occasion.prayer.text = v))} />
      <LText label="Source (optional)" value={p.source} onChange={(v) => update((d) => void (d.occasion.prayer.source = v))} placeholder="Psalm 23" />
    </FormCard>
  );
}

export function OccasionEditor() {
  const { doc } = useDraft();
  const kind = subjectKind(doc);
  if (kind === "couple") return null;
  return (
    <>
      <HeadlineCard kind={kind} />
      {(kind === "person" || kind === "memorial") && <HonoreeCard kind={kind} />}
      <AboutCard kind={kind} />
      {kind === "occasion" && (
        <>
          <SpeakersCard />
          <AgendaCard />
          <SponsorsCard />
        </>
      )}
      <MessageCard kind={kind} />
      <PeopleCard kind={kind} />
      {(kind === "occasion" || kind === "memorial") && <PrayerCard />}
    </>
  );
}
