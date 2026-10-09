"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import type { InvitationDoc } from "@/domain/doc/schema";
import type { FeatureKey, FeatureGroup } from "@/domain/packages/features";
import { DraftProvider, SaveIndicator, useDraft, type WeddingSettings } from "../draft";
import { STEPS, stepCopy, stepIndex, type StepKey } from "./steps";
import { subjectKind } from "@/domain/doc/event-types";
import { CoupleStep } from "../steps/CoupleStep";
import { EventsStep } from "../steps/EventsStep";
import { FamilyStep } from "../steps/FamilyStep";
import { StoryStep } from "../steps/StoryStep";
import { VenueStep } from "../steps/VenueStep";
import { MediaStep } from "../steps/MediaStep";
import { MusicStep } from "../steps/MusicStep";
import { TemplateStep, ThemeStep, type TemplateCard, type ThemeCard } from "../steps/DesignSteps";
import { EditStep, FeaturesStep, GenerateStep, PackageStep, PreviewStep, PublishStep, RsvpSetupStep, type PackageCard } from "../steps/SetupSteps";

export interface WizardProps {
  weddingId: string;
  step: StepKey;
  role: "admin" | "client";
  title: string;
  slug: string;
  appUrl: string;
  initialDoc: InvitationDoc;
  initialSettings: WeddingSettings;
  features: FeatureKey[];
  groups: { key: string; name: string }[];
  packages: PackageCard[];
  templates: TemplateCard[];
  themes: ThemeCard[];
  overrides: Record<string, boolean>;
  groupsOrder: FeatureGroup[];
  guestCount: number;
  published: boolean;
  publishedVersion: number | null;
  status: string;
  clients: { id: string; name: string; email: string }[];
}

function useDone() {
  const { doc, settings } = useDraft();
  return useMemo<Record<StepKey, "done" | "todo" | "optional">>(
    () => ({
      package: "done",
      couple: (subjectKind(doc) === "couple" ? doc.couple.bride.name.en && doc.couple.groom.name.en : doc.occasion.title.en || doc.occasion.honoree.name.en) && settings.weddingDate && !settings.slug.startsWith("draft-") ? "done" : "todo",
      events: doc.events.length > 0 ? "done" : "todo",
      family: doc.family.members.length > 0 ? "done" : "optional",
      story: doc.story.chapters.length > 0 ? "done" : "optional",
      venue: doc.venues.length > 0 ? "done" : "todo",
      media: doc.couple.bride.photo || doc.couple.groom.photo || doc.images.couple || doc.occasion.honoree.photo ? "done" : "optional",
      music: "optional",
      template: settings.templateId ? "done" : "todo",
      theme: settings.themeId ? "done" : "todo",
      features: "optional",
      guests: doc.rsvp.deadline ? "done" : "optional",
      generate: "optional",
      edit: "optional",
      preview: "optional",
      publish: "optional",
    }),
    [doc, settings],
  );
}

function Inner(p: WizardProps) {
  const router = useRouter();
  const { flush, role, doc } = useDraft();
  const subject = subjectKind(doc);
  const [pending, start] = useTransition();
  const done = useDone();
  const idx = stepIndex(p.step);
  const cur = stepCopy(p.step, subject);
  const base = role === "admin" ? `/admin/weddings/${p.weddingId}` : `/client/${p.weddingId}`;
  const go = (k: StepKey) =>
    start(async () => {
      const ok = await flush();
      if (ok) router.push(`${base}/setup/${k}`);
    });
  const base0 = role === "client" ? STEPS.filter((s) => ["events", "family", "story", "venue", "media", "music", "guests", "preview", "publish"].includes(s.key)) : STEPS;
  // "Family" is the two families of a wedding; for any other occasion the people live in the Occasion step
  const steps = base0.filter((s) => subject === "couple" || s.key !== "family").map((s) => stepCopy(s.key, subject));
  const pos = steps.findIndex((s) => s.key === p.step);
  const prev = steps[pos - 1];
  const next = steps[pos + 1];

  const body = (() => {
    switch (p.step) {
      case "package": return <PackageStep packages={p.packages} />;
      case "couple": return <CoupleStep />;
      case "events": return <EventsStep />;
      case "family": return <FamilyStep />;
      case "story": return <StoryStep />;
      case "venue": return <VenueStep />;
      case "media": return <MediaStep />;
      case "music": return <MusicStep />;
      case "template": return <TemplateStep templates={p.templates} themes={p.themes} />;
      case "theme": return <ThemeStep themes={p.themes} />;
      case "features": return <FeaturesStep overrides={p.overrides} groupsOrder={p.groupsOrder} />;
      case "guests": return <RsvpSetupStep guestCount={p.guestCount} />;
      case "generate": return <GenerateStep />;
      case "edit": return <EditStep />;
      case "preview": return <PreviewStep />;
      case "publish": return <PublishStep slug={p.slug} appUrl={p.appUrl} published={p.published} publishedVersion={p.publishedVersion} status={p.status} clients={p.clients} />;
    }
  })();

  return (
    <div className="grid gap-8 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
      <nav aria-label="Invitation setup steps" className="lg:sticky lg:top-20 lg:self-start">
        <ol className="hidden space-y-0.5 lg:block">
          {steps.map((s) => {
            const active = s.key === p.step;
            const st = done[s.key];
            return (
              <li key={s.key}>
                <button type="button" onClick={() => go(s.key)} aria-current={active ? "step" : undefined} className={cn("group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-[14px] transition-colors", active ? "bg-surface font-medium shadow-[var(--shadow-1)]" : "text-ink-2 hover:bg-paper-2")}>
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-[11.5px] font-semibold tnum", st === "done" && !active ? "border-ok bg-ok text-white" : active ? "border-accent bg-accent text-white" : "border-rule-strong text-muted")}>{st === "done" && !active ? <Check className="size-3.5" /> : STEPS.findIndex((x) => x.key === s.key) + 1}</span>
                  <span className="truncate">{s.title}</span>
                  {st === "todo" && !active && <span aria-label="Needs attention" className="ml-auto size-1.5 rounded-full bg-warn" />}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="flex items-center gap-3 lg:hidden">
          <label className="sr-only" htmlFor="step-select">Step</label>
          <select id="step-select" value={p.step} onChange={(e) => go(e.target.value as StepKey)} className="field-input">{steps.map((s) => (<option key={s.key} value={s.key}>{STEPS.findIndex((x) => x.key === s.key) + 1}. {s.title}</option>))}</select>
        </div>
      </nav>

      <div className="min-w-0">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Step {idx + 1} of {STEPS.length}</p>
            <h1 className="display mt-1 text-[clamp(30px,4vw,44px)]">{cur.title}</h1>
            <p className="lede mt-1.5">{cur.blurb}</p>
          </div>
          <SaveIndicator />
        </header>
        {body}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-6">
          {prev ? <Button variant="quiet" icon={<ArrowLeft className="size-4" />} loading={pending} onClick={() => go(prev.key)}>{prev.title}</Button> : <span />}
          <div className="flex items-center gap-3">
            <Link href={`${base}`} className="btn btn-ghost">Save & exit</Link>
            {next && <Button variant="primary" loading={pending} onClick={() => go(next.key)}>Continue to {next.title}<ArrowRight className="size-4" /></Button>}
          </div>
        </footer>
      </div>
    </div>
  );
}

export function WizardClient(p: WizardProps) {
  return (
    <DraftProvider weddingId={p.weddingId} role={p.role} initialDoc={p.initialDoc} initialSettings={p.initialSettings} features={p.features} groups={p.groups}>
      <Inner {...p} />
    </DraftProvider>
  );
}
