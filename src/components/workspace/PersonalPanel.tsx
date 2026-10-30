"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, RefreshCw, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Switch, SelectField, TextField } from "@/components/ui/Field";
import { useConfirm } from "@/components/ui/Confirm";
import { FormCard, Hint, ListEditor, LText } from "@/components/admin/forms";
import { MediaField } from "@/components/admin/MediaField";
import { useDraft } from "@/components/admin/draft";
import { composeMessage, groupNote, groupNoteKind, relationKind, variantCount } from "@/domain/guests/messages";
import { newId } from "@/lib/id";
import { draftMessagesAction } from "@/app/actions/guests";
import { publishAction } from "@/app/actions/wedding";

/** Relationships offered in the sample, written the way the Guests screen asks for them. */
const SAMPLES = ["Grandparent", "Aunt / Uncle", "Sibling", "Cousin", "College friend", "Friend", "Colleague", "Neighbour", "Teacher / Mentor", "Family friend", ""];

type Entry = ReturnType<typeof useDraft>["doc"]["personal"]["groups"][number];

/**
 * The client's own control room for the personal touches (Luxury): what is written to each guest, what is said to each group
 * of guests, and the travel tips by city. Changes save as a draft like the rest of the invitation; "Publish" shows them to guests.
 */
export function PersonalPanel({ weddingId, guestCount, couple, defaultLocale, base }: { weddingId: string; guestCount: number; couple: Record<string, { a: string; b: string }>; defaultLocale: string; base: string }) {
  const { doc, update, groups: guestGroups } = useDraft();
  const ask = useConfirm();
  const [pending, start] = useTransition();
  const p = doc.personal;
  const [sample, setSample] = useState("College friend");
  const [variant, setVariant] = useState(0);
  const locale = defaultLocale === "ml" ? "ml" : "en";
  const names = couple[locale] ?? couple.en;
  const kind = relationKind(sample);
  const preview = composeMessage({ kind, locale, a: names.a, b: names.b, first: locale === "ml" ? "പ്രിയ" : "Priya", seed: "sample", variant });

  // one entry per guest group, plus one for everybody else; created the moment the couple writes in it
  const slots: { key: string; name: string }[] = [...guestGroups.map((g) => ({ key: g.key, name: g.name })), { key: "", name: "Everyone else" }];
  const entryOf = (key: string): Entry | undefined => p.groups.find((g) => g.groupKey === key);
  const edit = (key: string, fn: (e: Entry) => void) =>
    update((d) => {
      let e = d.personal.groups.find((g) => g.groupKey === key);
      if (!e) { e = { id: newId(), groupKey: key, title: {}, text: {}, clip: undefined, photos: [] }; d.personal.groups.push(e); }
      fn(e);
    });

  const writeAll = (overwrite: boolean) =>
    start(async () => {
      if (overwrite && !(await ask({ title: "Rewrite every guest’s message?", message: "This replaces the messages you have written or edited for individual guests with freshly written ones.", confirmLabel: "Rewrite all", tone: "danger" }))) return;
      const r = await draftMessagesAction(weddingId, overwrite);
      if (r.ok) toast.success(r.data.written ? `Wrote ${r.data.written} message${r.data.written === 1 ? "" : "s"}${r.data.kept ? ` — kept the ${r.data.kept} you had already written` : ""}.` : "Every guest already has a message.");
      else toast.error(r.error.message);
    });

  const publish = () =>
    start(async () => {
      const r = await publishAction(weddingId, "Personal touches");
      if (r.ok) toast.success(`Published — guests with a personal link now see it (version ${r.data.version}).`);
      else toast.error(r.error.message);
    });

  return (
    <div className="space-y-6">
      <FormCard title="What guests see" description="Guests with a personal link get their name and a heartfelt message in the envelope, then a “Just for you” page and a message for their group. Visitors without a personal link see none of this."
        actions={<div className="flex flex-wrap gap-2"><Link className="btn btn-quiet btn-sm" href={`/preview/${weddingId}?guest=1`} target="_blank"><Eye className="size-4" />Preview as a guest</Link><Button size="sm" loading={pending} icon={<Send className="size-4" />} onClick={publish}>Publish</Button></div>}>
        <div className="space-y-3">
          <Switch label="Show “Just for you” and the message for their group" checked={p.enabled} onChange={(v) => update((d) => void (d.personal.enabled = v))} hint="Their reply, their own days, table, room and a travel tip — right after the opening picture." />
          <Switch label="Write a heartfelt message for every guest who has none" checked={p.autoMessages} onChange={(v) => update((d) => void (d.personal.autoMessages = v))} hint="Chosen from the guest’s relationship (aunt, college friend, colleague…). A message you write for a guest always comes first." />
        </div>
        <LText label="Sign-off under each message" value={p.signature} onChange={(v) => update((d) => void (d.personal.signature = v))} placeholder={`${names.a} & ${names.b}`} hint="Leave empty to sign with your names." />
      </FormCard>

      <FormCard title="The message in the envelope" description="Every guest’s message is written for their relationship, in your voice. Read how it sounds, then write them all in one go and edit any you like on the Guests screen.">
        <div className="grid gap-4 sm:grid-cols-[14rem_1fr] sm:items-start">
          <SelectField label="Sample guest" value={sample} onChange={(e) => { setSample(e.target.value); setVariant(0); }}>{SAMPLES.map((s) => (<option key={s} value={s}>{s || "No relationship"}</option>))}</SelectField>
          <figure className="rounded-md border border-rule bg-paper-2/60 p-4">
            <figcaption className="eyebrow mb-2">Dear {locale === "ml" ? "പ്രിയ" : "Priya"},</figcaption>
            <blockquote className="text-[15.5px] italic leading-relaxed">{preview}</blockquote>
            <Button size="sm" variant="ghost" className="mt-3" icon={<RefreshCw className="size-4" />} onClick={() => setVariant((v) => (v + 1) % variantCount(kind, locale))}>Another way to say it</Button>
          </figure>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button loading={pending} icon={<Sparkles className="size-4" />} disabled={guestCount === 0} onClick={() => writeAll(false)}>Write messages for all {guestCount} guest{guestCount === 1 ? "" : "s"}</Button>
          <Button variant="quiet" loading={pending} disabled={guestCount === 0} onClick={() => writeAll(true)}>Rewrite every message</Button>
          <Link className="text-[14px] underline underline-offset-4" href={`${base}/guests`}>Edit one guest’s message</Link>
        </div>
        {guestCount === 0 && <Hint>Add your guests first — then this writes a message for each of them.</Hint>}
      </FormCard>

      <FormCard title="A message for each group" description="Guests see the message for their own group — a short video or voice note you record, or the lines you write. Leave a group empty and a short note is written for it, played over your photograph.">
        <div className="space-y-4">
          {slots.map(({ key, name }) => {
            const e = entryOf(key);
            const note = groupNote(groupNoteKind(key || null), locale);
            return (
              <details key={key || "else"} className="rounded-md border border-rule bg-surface" open={!!e?.clip || !!(e?.text.en ?? "").trim()}>
                <summary className="cursor-pointer px-4 py-3 text-[15px] font-medium">{name}{e && (e.clip || (e.text.en ?? "").trim()) ? <span className="ml-2 text-[12.5px] font-normal text-ok">● written</span> : <span className="ml-2 text-[12.5px] font-normal text-muted">automatic note</span>}</summary>
                <div className="space-y-4 border-t border-rule p-4">
                  <LText label="Heading" value={e?.title ?? {}} onChange={(v) => edit(key, (x) => void (x.title = v))} placeholder={`A message from ${names.a} & ${names.b}`} />
                  <LText label="What you say" multiline rows={4} value={e?.text ?? {}} onChange={(v) => edit(key, (x) => void (x.text = v))} hint="One line per row. The first line is shown in script, like “To our friends,”." placeholder={note.join("\n")} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MediaField label="Video or voice message" kinds={["VIDEO", "AUDIO"]} category="VIDEO" value={e?.clip} onChange={(id) => edit(key, (x) => void (x.clip = id))} hint="A short clip of you speaking to this group. It plays on their invitation when they tap play." aspect="aspect-video" />
                    <div className="space-y-2">
                      <p className="text-[13.5px] font-medium text-ink-2">Photographs “from our past with you”</p>
                      <div className="flex flex-wrap gap-2">
                        {(e?.photos ?? []).map((id, i) => (<MediaField key={id + i} label={`Photo ${i + 1}`} compact value={id} onChange={(v) => edit(key, (x) => void (v ? (x.photos[i] = v) : x.photos.splice(i, 1)))} aspect="aspect-square" className="w-24" />))}
                        {(e?.photos.length ?? 0) < 6 && <MediaField label="Add a photo" compact value={undefined} onChange={(v) => v && edit(key, (x) => void x.photos.push(v))} aspect="aspect-square" className="w-24" />}
                      </div>
                      <p className="text-[13px] text-muted">Up to six. Only guests of this group see them.</p>
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </FormCard>

      <FormCard title="Travel tips by city" description="A guest whose “Coming from” city contains the word you write here sees this tip on their page — flight advice, the best train, where to land.">
        <ListEditor
          items={p.travel}
          onChange={(items) => update((d) => void (d.personal.travel = items))}
          keyOf={(t) => t.id}
          title={(t) => t.match || "New tip"}
          addLabel="Add a travel tip"
          empty="No tips yet. Add one for the city most of your travelling guests come from."
          max={40}
          make={() => ({ id: newId(), match: "", text: {}, link: "" })}
          render={(t, _i, up) => (
            <>
              <TextField label="City or place" value={t.match} onChange={(e) => up({ match: e.target.value })} placeholder="Dubai" hint="Matches any guest whose city includes this word." />
              <LText label="Your tip" multiline value={t.text} onChange={(v) => up({ text: v })} placeholder="Fly into Kochi (COK) — we will have a car waiting. Land by 9 am on Friday." />
              <TextField label="A link (optional)" value={t.link} onChange={(e) => up({ link: e.target.value })} placeholder="https://…" />
            </>
          )}
        />
      </FormCard>
    </div>
  );
}
