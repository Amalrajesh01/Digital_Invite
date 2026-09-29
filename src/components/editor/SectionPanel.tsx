"use client";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { SelectField, Switch, Checkbox } from "@/components/ui/Field";
import { LText, Hint } from "@/components/admin/forms";
import { MediaField } from "@/components/admin/MediaField";
import { useDraft } from "@/components/admin/draft";
import { SECTION_META } from "@/domain/doc/sections";
import { WEDDING_STATUSES } from "@/domain/doc/constants";
import type { LocalizedText, SectionConfig } from "@/domain/doc/schema";
import { CoupleStep } from "@/components/admin/steps/CoupleStep";
import { EventsStep } from "@/components/admin/steps/EventsStep";
import { FamilyStep } from "@/components/admin/steps/FamilyStep";
import { StoryStep } from "@/components/admin/steps/StoryStep";
import { VenueStep } from "@/components/admin/steps/VenueStep";
import { RsvpSetupStep } from "@/components/admin/steps/SetupSteps";
import { GamesSetup } from "@/components/workspace/GamesSetup";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import Link from "next/link";

const TOGGLES: Partial<Record<SectionConfig["type"], { key: string; label: string; hint?: string; def: boolean }[]>> = {
  hero: [{ key: "showCountdown", label: "Show a small countdown", def: true }],
  story: [
    { key: "showHowWeMet", label: "Show ‘How we met’", def: true }, { key: "showThenNow", label: "Show ‘Then & now’ sliders", def: true }, { key: "showMemoryCards", label: "Show memory cards", def: true },
    { key: "showPersonality", label: "Show ‘Getting to know us’ cards", def: true }, { key: "showVoice", label: "Show the voice story", def: true },
  ],
};

const PHASES = WEDDING_STATUSES.filter((s) => s !== "DRAFT" && s !== "PREVIEW");
const PHASE_LABEL: Record<string, string> = { PUBLISHED: "Before the wedding", LIVE_EVENT: "On the wedding day", POST_EVENT: "Just after (thank-you)", MEMORY: "Memories", ANNIVERSARY: "Anniversary" };

export function SectionPanel({ section, tab, weddingId }: { section: SectionConfig; tab: "section" | "content"; weddingId: string }) {
  const { update, has, groups } = useDraft();
  const meta = SECTION_META[section.type];
  const locked = !!meta.feature && !has(meta.feature);
  const set = (fn: (s: SectionConfig) => void) => update((d) => { const s = d.sections.find((x) => x.id === section.id); if (s) fn(s); });
  const copy = (k: "eyebrow" | "title" | "intro") => (section.content as Record<string, LocalizedText | undefined>)[k];
  const setCopy = (k: string, v: LocalizedText) => set((s) => void (s.content = { ...s.content, [k]: v }));
  const toggles = TOGGLES[section.type] ?? [];
  const phases = section.visibility.phases;

  if (tab === "content") {
    switch (section.type) {
      case "hero": return <div className="space-y-5"><MediaField label="Hero background photo" value={section.content.background as string | undefined} category="COUPLE" onChange={(id) => set((s) => void (s.content = { ...s.content, background: id }))} aspect="aspect-[3/4]" />{section.variant === "fullbleed" && <MediaField label="Background video (optional)" kinds={["VIDEO"]} category="VIDEO" value={section.content.video as string | undefined} onChange={(id) => set((s) => void (s.content = { ...s.content, video: id }))} />}<Hint>Names, date and tagline come from the couple’s details.</Hint><CoupleStep /></div>;
      case "couple": return <CoupleStep />;
      case "story": case "timeline": return <StoryStep />;
      case "family": return <FamilyStep />;
      case "events": case "countdown": case "livesched": case "dresscode": case "menu": return <EventsStep />;
      case "venue": case "travel": return <VenueStep />;
      case "rsvp": return <RsvpSetupStep guestCount={0} />;
      case "gallery": case "photowall": case "memory": return <div className="space-y-4"><p className="text-[14px] text-muted">Organise photographs and albums in the media library.</p><MediaLibrary weddingId={weddingId} /></div>;
      case "games": case "quiz": case "scavenger": return <GamesSetup />;
      default: return <Hint>This section has no separate content to edit. Use the ‘Section’ tab for its wording and layout.<br /><Link className="underline" href={`/admin/weddings/${weddingId}/setup/couple`}>Open the full setup wizard</Link></Hint>;
    }
  }

  return (
    <div className="space-y-6">
      <div><p className="eyebrow">{meta.group}</p><h2 className="display text-[30px]">{meta.label}</h2><p className="mt-1 text-[13.5px] text-muted">{meta.description}</p></div>
      {locked && <p className="flex items-center gap-2 rounded-md bg-brass-soft px-3 py-2.5 text-[13.5px] text-[#6b5313]"><Lock className="size-4" />Not included in this wedding’s package, so guests won’t see it.</p>}
      <Switch label="Show this section" checked={section.enabled} onChange={(v) => set((s) => void (s.enabled = v))} />

      {meta.variants.length > 1 && (
        <div>
          <p className="mb-2 text-[13.5px] font-medium text-ink-2">Layout</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Layout">
            {meta.variants.map((v) => (
              <button key={v.key} type="button" role="radio" aria-checked={section.variant === v.key} onClick={() => set((s) => void (s.variant = v.key))} className={cn("rounded-md border px-3 py-2.5 text-left text-[13.5px] transition-colors", section.variant === v.key ? "border-accent bg-accent-soft/50 font-medium" : "border-rule-strong hover:border-ink-2")}>{v.label}</button>
            ))}
          </div>
        </div>
      )}

      <SelectField label="Background" value={(section.settings.tone as string) ?? "auto"} onChange={(e) => set((s) => void (s.settings = { ...s.settings, tone: e.target.value === "auto" ? undefined : e.target.value }))} hint="Alternate light and dark sections for rhythm.">
        <option value="auto">Automatic</option><option value="light">Light</option><option value="tint">Soft tint</option><option value="night">Night (dark)</option>
      </SelectField>

      {toggles.length > 0 && (
        <div className="space-y-4">{toggles.map((t) => (<Switch key={t.key} label={t.label} checked={(section.settings[t.key] as boolean | undefined) ?? t.def} onChange={(v) => set((s) => void (s.settings = { ...s.settings, [t.key]: v }))} />))}</div>
      )}

      <div className="space-y-4 border-t border-rule pt-5">
        <p className="text-[13.5px] font-medium text-ink-2">Wording</p>
        <LText label="Small heading above" value={copy("eyebrow")} onChange={(v) => setCopy("eyebrow", v)} hint="Leave empty for the default." />
        <LText label="Title" value={copy("title")} onChange={(v) => setCopy("title", v)} />
        <LText label="Introduction" multiline value={copy("intro")} onChange={(v) => setCopy("intro", v)} />
      </div>

      <details className="border-t border-rule pt-4">
        <summary className="cursor-pointer text-[13.5px] font-medium text-ink-2">When and to whom this appears</summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-[13px] text-muted">Shown during (empty = the section’s normal timing):</p>
            <div className="grid gap-1.5">{PHASES.map((p) => (<Checkbox key={p} label={PHASE_LABEL[p]} checked={phases.includes(p)} onChange={(on) => set((s) => void (s.visibility.phases = on ? [...s.visibility.phases, p] : s.visibility.phases.filter((x) => x !== p)))} />))}</div>
          </div>
          <Switch label="Only guests with a personal link" checked={section.visibility.guestsOnly} onChange={(v) => set((s) => void (s.visibility.guestsOnly = v))} />
          {has("event_visibility") && (
            <div>
              <p className="mb-2 text-[13px] text-muted">Only for these guest groups (empty = everyone):</p>
              <div className="grid gap-1.5">{groups.map((g) => (<Checkbox key={g.key} label={g.name} checked={section.visibility.groups.includes(g.key)} onChange={(on) => set((s) => void (s.visibility.groups = on ? [...s.visibility.groups, g.key] : s.visibility.groups.filter((x) => x !== g.key)))} />))}</div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
