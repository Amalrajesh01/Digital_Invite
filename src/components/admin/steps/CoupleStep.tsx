"use client";
import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { TextField, SelectField, TextArea } from "@/components/ui/Field";
import { LOCALES } from "@/domain/doc/constants";
import { normalizeSlugClient } from "@/lib/slug";
import { newId } from "@/lib/id";
import { checkSlugAction } from "@/app/actions/wedding";
import { FormCard, Grid, Hint, LText, ListEditor } from "../forms";
import { MediaField } from "../MediaField";
import { useDraft } from "../draft";
import { CelebrationCard, ChatCard } from "./ExperienceSteps";
import type { Person } from "@/domain/doc/schema";

function PersonForm({ who }: { who: "bride" | "groom" }) {
  const { doc, update } = useDraft();
  const p = doc.couple[who];
  const set = <K extends keyof Person>(k: K, v: Person[K]) => update((d) => void (d.couple[who][k] = v));
  const label = who === "bride" ? "The bride" : "The groom";
  return (
    <FormCard title={label}>
      <Grid>
        <LText label="Name shown on the invitation" required value={p.name} onChange={(v) => set("name", v)} hint="Usually the first name — e.g. Meenakshi" />
        <LText label="Full name" value={p.fullName} onChange={(v) => set("fullName", v)} />
      </Grid>
      <LText label="Parents" value={p.parents} onChange={(v) => set("parents", v)} placeholder={`${who === "bride" ? "Daughter" : "Son"} of Mr. … & Mrs. …`} />
      <LText label="A few words about them" multiline rows={4} value={p.bio} onChange={(v) => set("bio", v)} />
      <MediaField label="Portrait" value={p.photo} category={who === "bride" ? "BRIDE" : "GROOM"} onChange={(id) => set("photo", id)} aspect="aspect-[4/5]" hint="A vertical photograph works best. You can crop it after choosing." />
    </FormCard>
  );
}

export function CoupleStep() {
  const { doc, update, settings, updateSettings, has, role, weddingId } = useDraft();
  const [slugState, setSlugState] = useState<{ ok: boolean; msg: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestion = normalizeSlugClient(`${doc.couple.bride.name.en ?? ""} and ${doc.couple.groom.name.en ?? ""}`);
  const admin = role === "admin";

  useEffect(() => {
    if (!admin) return;
    if (timer.current) clearTimeout(timer.current);
    if (!settings.slug || settings.slug.startsWith("draft-")) return setSlugState(null);
    timer.current = setTimeout(async () => {
      const r = await checkSlugAction(weddingId, settings.slug);
      if (r.ok) setSlugState({ ok: r.data.ok, msg: r.data.ok ? "This link is available" : r.data.problem ?? "Not available" });
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [settings.slug, weddingId, admin]);

  const names = () => {
    const a = doc.couple.bride.name.en?.trim();
    const b = doc.couple.groom.name.en?.trim();
    return a && b ? `${a} & ${b}` : "";
  };

  return (
    <div className="space-y-6">
      <FormCard title="The wedding" description="The basics every guest will see first.">
        <Grid>
          <TextField label="Invitation title" value={settings.title} onChange={(e) => updateSettings({ title: e.target.value })} onFocus={() => !settings.title && names() && updateSettings({ title: names() })} placeholder="Meenakshi & Aravind" hint="Used in the browser tab, WhatsApp previews and emails." />
          <TextField label="Wedding date" type="date" value={settings.weddingDate ?? ""} onChange={(e) => updateSettings({ weddingDate: e.target.value || null })} hint="The main day. Countdowns and the ‘live day’ follow this date." />
        </Grid>
        <div>
          <label className="mb-1.5 block text-[13.5px] font-medium text-ink-2" htmlFor="slug">Wedding link</label>
          <div className="flex items-stretch overflow-hidden rounded-md border border-rule-strong bg-surface focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(122,36,50,.14)]">
            <span className="grid place-items-center border-r border-rule bg-paper-2 px-3 text-[14px] text-muted">/invite/</span>
            <input id="slug" disabled={!admin} value={settings.slug.startsWith("draft-") ? "" : settings.slug} onChange={(e) => updateSettings({ slug: normalizeSlugClient(e.target.value, true) })} placeholder={suggestion || "anjali-and-sidharth"} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[15px] outline-none disabled:opacity-60" aria-describedby="slug-hint" />
            {slugState && <span className={`grid place-items-center px-3 ${slugState.ok ? "text-ok" : "text-bad"}`} aria-hidden>{slugState.ok ? <Check className="size-4" /> : <X className="size-4" />}</span>}
          </div>
          <p id="slug-hint" className={`mt-1.5 text-[13px] ${slugState && !slugState.ok ? "text-bad" : "text-muted"}`} role={slugState && !slugState.ok ? "alert" : undefined}>
            {slugState?.msg ?? "Short and memorable — lowercase letters, numbers and hyphens."}
            {admin && suggestion && settings.slug.startsWith("draft-") && (<> <button type="button" className="underline underline-offset-2" onClick={() => updateSettings({ slug: suggestion })}>Use “{suggestion}”</button></>)}
          </p>
        </div>
        <Grid>
          <SelectField label="Local language (optional)" value={settings.secondaryLocale ?? ""} disabled={!admin} onChange={(e) => updateSettings({ secondaryLocale: e.target.value || null })} hint="Guests get an English ⇄ local-language switch. You then write each text in both languages below.">
            <option value="">English only</option>
            {LOCALES.map((l) => (<option key={l.code} value={l.code}>{l.label} — {l.native}</option>))}
          </SelectField>
          <SelectField label="Who can open the invitation?" value={settings.accessMode} disabled={!admin} onChange={(e) => updateSettings({ accessMode: e.target.value as never })} hint="Private invitations need each guest’s personal link.">
            <option value="PUBLIC">Anyone with the link</option>
            <option value="PERSONALIZED_ONLY" disabled={!has("personalized_urls")}>Only guests with a personal link{!has("personalized_urls") ? " (Signature+)" : ""}</option>
          </SelectField>
        </Grid>
        {settings.secondaryLocale && <Hint>Every text box below now has an English side and a {LOCALES.find((l) => l.code === settings.secondaryLocale)?.label} side. Fill both; anything left empty falls back to English.</Hint>}
      </FormCard>

      <CelebrationCard />

      <div className="grid gap-6 lg:grid-cols-2"><PersonForm who="bride" /><PersonForm who="groom" /></div>

      <FormCard title="Words on the invitation">
        <LText label="Opening line" value={doc.couple.invitation} onChange={(v) => update((d) => void (d.couple.invitation = v))} placeholder="Together with their families" />
        <LText label="Tagline" value={doc.couple.tagline} onChange={(v) => update((d) => void (d.couple.tagline = v))} placeholder="Two hearts, one lamp, a lifetime of light." />
        <Grid>
          <LText label="A favourite quote (optional)" multiline value={doc.couple.quote.text} onChange={(v) => update((d) => void (d.couple.quote.text = v))} />
          <LText label="Quote by" value={doc.couple.quote.author} onChange={(v) => update((d) => void (d.couple.quote.author = v))} />
        </Grid>
        <Grid cols={3}>
          <TextField label="Hashtag" value={doc.couple.hashtag} onChange={(e) => update((d) => void (d.couple.hashtag = e.target.value.replace(/[^\p{L}\p{N}_]/gu, "")))} placeholder="MeenuWedsAravind" />
          <TextField label="Monogram / seal letters" maxLength={4} value={doc.couple.monogram} onChange={(e) => update((d) => void (d.couple.monogram = e.target.value.toUpperCase()))} hint="Shown on the wax seal. e.g. M or MA" />
          <SelectField label="Who is named first?" value={doc.couple.order} onChange={(e) => update((d) => void (d.couple.order = e.target.value as never))}><option value="bride-first">Bride first</option><option value="groom-first">Groom first</option></SelectField>
        </Grid>
      </FormCard>

      <ChatCard />

      <FormCard title="How each guest is greeted" description="Personal links open with “Dear {name}, …”. Use {name} where the guest’s name should appear.">
        <LText label="Default greeting" multiline value={doc.guestGreetings.default} onChange={(v) => update((d) => void (d.guestGreetings.default = v))} placeholder="Dear {name}, we would love to celebrate this special day with you." />
        {has("advanced_greetings") ? (
          <div>
            <p className="mb-2 text-[13.5px] font-medium text-ink-2">Different message by relationship</p>
            <ListEditor
              items={doc.guestGreetings.byRelationship}
              onChange={(items) => update((d) => void (d.guestGreetings.byRelationship = items))}
              keyOf={(i) => i.id}
              title={(i) => (i.match ? `If relationship contains “${i.match}”` : "New message")}
              make={() => ({ id: newId(), match: "", text: {} }) as never}
              addLabel="Add a relationship message"
              empty="For example ‘uncle’, ‘college friend’, ‘colleague’ — each can get a different heartfelt message."
              render={(item, _i, up) => (<><TextField label="When the guest’s relationship contains" value={item.match} onChange={(e) => up({ match: e.target.value })} placeholder="uncle" hint="Not case-sensitive. Set each guest’s relationship in the guest list." /><LText label="Message" multiline value={item.text} onChange={(v) => up({ text: v })} /></>)}
            />
          </div>
        ) : (
          <Hint>Relationship-specific greetings (uncle, friend, colleague…) are part of the Luxury package.</Hint>
        )}
        <TextArea label="Notes for the designer (private)" rows={2} placeholder="Nothing here is shown to guests." disabled />
      </FormCard>
    </div>
  );
}
