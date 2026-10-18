"use client";
import Link from "next/link";
import { OPENINGS, OPENING_LABELS } from "@/domain/doc/constants";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Eye, EyeOff, Redo2, Undo2, Rocket, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Segmented, SelectField, TextField } from "@/components/ui/Field";
import { ConfirmProvider, useConfirm } from "@/components/ui/Confirm";
import { DevicePreview, type Device, type DevicePreviewHandle } from "@/components/admin/DevicePreview";
import { DraftProvider, SaveIndicator, useDraft, type WeddingSettings } from "@/components/admin/draft";
import { LText } from "@/components/admin/forms";
import { ThemeStep, type TemplateCard, type ThemeCard } from "@/components/admin/steps/DesignSteps";
import { mergeTokens } from "@/domain/design/tokens";
import type { InvitationDoc } from "@/domain/doc/schema";
import type { FeatureKey } from "@/domain/packages/features";
import type { ResolvedMedia } from "@/domain/media/service";
import type { MediaRow } from "@/app/actions/media";
import { checkpointAction, publishAction, regenerateSectionsAction } from "@/app/actions/wedding";
import { SectionList } from "./SectionList";
import { HAS_CONTENT, SectionPanel } from "./SectionPanel";
import { sampleHits, samplePhotosUsed } from "./sample-check";
import { LinkPreviewPanel } from "./LinkPreviewPanel";
import { Sheet } from "@/components/ui/Sheet";
import { SECTION_META } from "@/domain/doc/sections";
import type { PreviewPatch } from "@/invitation/PreviewFrame";

/** The fixed entry under the sections: how the link looks in a chat. Not a section of the invitation itself. */
const SHARE = "__share";

export interface EditorProps {
  weddingId: string;
  slug: string;
  title: string;
  published: boolean;
  doc: InvitationDoc;
  settings: WeddingSettings;
  features: FeatureKey[];
  groups: { key: string; name: string }[];
  templates: TemplateCard[];
  themes: ThemeCard[];
  media: MediaRow[];
  /** True right after “Create and start editing”: shows a short guide above the editor. */
  welcome?: boolean;
  /** What is still the template's sample (null when the invitation did not start from one). */
  sample?: { template: string; tokens: string[]; photos: string[] } | null;
}

const toResolved = (m: MediaRow): ResolvedMedia => ({ id: m.id, kind: m.kind, mime: "", url: m.url, srcSet: m.srcSet, width: m.width, height: m.height, blur: m.blur, alt: m.alt, caption: m.caption, focal: m.focal, face: m.face });

function DesignPanel({ templates, themes }: { templates: TemplateCard[]; themes: ThemeCard[] }) {
  const { weddingId, settings, doc, update, flush } = useDraft();
  const ask = useConfirm();
  const router = useRouter();
  const [busy, start] = useTransition();
  const apply = async (id: string) => {
    if (id === settings.templateId) return;
    if (!(await ask({ title: "Switch template?", message: "Your content stays. The section order, layouts and opening style are rebuilt from the new template.", confirmLabel: "Switch template" }))) return;
    start(async () => { await flush(); const r = await regenerateSectionsAction(weddingId, id); if (r.ok) { toast.success("Template applied"); router.refresh(); } else toast.error(r.error.message); });
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="display text-[28px]">Template</h2>
        <ul className="mt-3 space-y-2">{templates.map((t) => (<li key={t.id}><button type="button" aria-pressed={t.id === settings.templateId} disabled={busy} onClick={() => void apply(t.id)} className={cn("w-full rounded-md border px-3.5 py-3 text-left transition-colors", t.id === settings.templateId ? "border-accent bg-accent-soft/40" : "border-rule-strong hover:border-ink-2")}><span className="display text-[20px]">{t.name}</span><span className="block text-[12.5px] text-muted">{t.flavor} style · opens with {t.opening}</span></button></li>))}</ul>
      </div>
      <div>
        <h2 className="display mb-3 text-[28px]">Opening</h2>
        <SelectField label="How the invitation opens" value={doc.opening.variant} onChange={(e) => update((d) => void (d.opening.variant = e.target.value as never))}>
          {OPENINGS.map((o) => <option key={o} value={o}>{OPENING_LABELS[o]}</option>)}
        </SelectField>
        <div className="mt-4 grid gap-4"><TextField label="Seal letters" maxLength={4} value={doc.opening.sealText} onChange={(e) => update((d) => void (d.opening.sealText = e.target.value.toUpperCase()))} hint="Shown on the wax seal / envelope." />
          <LText label="Line above the names" value={doc.opening.invitedLine} onChange={(v) => update((d) => void (d.opening.invitedLine = v))} placeholder="You are invited to the wedding of" /></div>
      </div>
      <div><h2 className="display mb-3 text-[28px]">Theme</h2><ThemeStep themes={themes} hidePreview /></div>
    </div>
  );
}

function Editor({ title, slug, published, templates, themes, welcome, sample }: Pick<EditorProps, "title" | "slug" | "published" | "templates" | "themes" | "welcome" | "sample">) {
  const { weddingId, doc, settings, media, undo, redo, canUndo, canRedo, flush, saveState, update, has } = useDraft();
  const ask = useConfirm();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(doc.sections.find((s) => s.type === "hero")?.id ?? doc.sections[0]?.id ?? null);
  const [tab, setTab] = useState<"section" | "content" | "design">("content");
  const [guide, setGuide] = useState(!!welcome);
  const [checking, setChecking] = useState(false);
  const [device, setDevice] = useState<Device>("mobile");
  const [state, setState] = useState("PUBLISHED");
  const [guest, setGuest] = useState(false);
  const [lang, setLang] = useState(settings.defaultLocale);
  const [pane, setPane] = useState<"sections" | "preview" | "edit">("preview");
  const [pending, start] = useTransition();
  const frame = useRef<DevicePreviewHandle>(null);
  const [ready, setReady] = useState(0);

  const tokens = useMemo(() => {
    const base = themes.find((t) => t.id === settings.themeId)?.tokens ?? themes[0]?.tokens;
    return base ? mergeTokens(base, settings.themeOverrides) : undefined;
  }, [themes, settings.themeId, settings.themeOverrides]);
  const flavor = templates.find((t) => t.id === settings.templateId)?.flavor;
  const mediaMap = useMemo(() => Object.fromEntries(Object.values(media).map((m) => [m.id, toResolved(m)])), [media]);
  const section = doc.sections.find((s) => s.id === selected) ?? null;
  // a section with nothing to fill in opens on its layout instead of an empty “Words & photos”
  const effTab = tab === "content" && section && !HAS_CONTENT.has(section.type) ? "section" : tab;

  // what is still the sample, live as the person replaces it
  const hits = useMemo(() => sampleHits(doc, sample?.tokens ?? []), [doc, sample]);
  const photosLeft = useMemo(() => samplePhotosUsed(doc, sample?.photos ?? []), [doc, sample]);
  const left = hits.length + photosLeft.length;

  // walk the invitation one section at a time
  const sorted = useMemo(() => [...doc.sections].sort((a, b) => a.order - b.order), [doc.sections]);
  const walkable = (s: (typeof sorted)[number]) => s.enabled && !(SECTION_META[s.type].feature && !has(SECTION_META[s.type].feature!));
  const at = sorted.findIndex((s) => s.id === selected);
  const nextId = sorted.slice(at + 1).find(walkable)?.id;
  const prevId = sorted.slice(0, Math.max(at, 0)).reverse().find(walkable)?.id;
  const toggleHidden = () => section && update((d) => { const x = d.sections.find((y) => y.id === section.id); if (x) x.enabled = !x.enabled; });

  // Push every edit into the live preview (debounced).
  useEffect(() => {
    const id = setTimeout(() => {
      const patch: PreviewPatch = { type: "sbl:patch", doc, tokens, flavor, media: mediaMap, status: state as never, title: settings.title, secondaryLocale: settings.secondaryLocale };
      frame.current?.post(patch);
    }, 120);
    return () => clearTimeout(id);
  }, [doc, tokens, flavor, mediaMap, state, settings.title, settings.secondaryLocale, ready]);

  const onMessage = useCallback((m: { type: string; sectionId?: unknown }) => {
    if (m.type === "sbl:ready") setReady((n) => n + 1);
    if (m.type === "sbl:select" && typeof m.sectionId === "string") {
      setSelected(m.sectionId);
      setTab((t) => (t === "design" ? "content" : t));
      setPane("edit");
    }
  }, []);

  const select = (id: string) => {
    setSelected(id);
    setTab((t) => (t === "design" ? "content" : t));
    if (id !== SHARE) frame.current?.post({ type: "sbl:focus", sectionId: id });
    setPane("edit");
  };

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !(e.target as HTMLElement)?.matches?.("input,textarea")) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [undo, redo]);

  const src = `/preview/${weddingId}?edit=1&as=${state}${guest ? "&guest=1" : ""}&lang=${lang}`;

  const publish = async () => {
    if (!(await flush())) return toast.error("Fix the save problem first.");
    const leftover = left ? ` Heads up: ${left} thing${left === 1 ? " is" : "s are"} still the template’s sample — open “Still the sample” to check.` : "";
    if (!(await ask({ title: published ? "Publish your changes?" : "Publish this invitation?", message: `Guests will see this version at /invite/${slug}. You can roll back from Versions at any time.${leftover}`, confirmLabel: "Publish" }))) return;
    start(async () => { const r = await publishAction(weddingId); if (r.ok) { toast.success(`Published — version ${r.data.version}`); router.refresh(); } else toast.error(r.error.message); });
  };

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule bg-paper px-3 py-2 lg:px-4">
        <Link href={`/admin/weddings/${weddingId}`} className="btn btn-ghost btn-sm !px-2" aria-label="Back to the wedding"><ArrowLeft className="size-4" /></Link>
        <div className="min-w-0"><p className="display truncate text-[22px] leading-none">{title || "Untitled wedding"}</p><p className="mt-0.5 text-[11.5px] text-muted">Visual editor</p></div>
        <div className="ml-2 hidden sm:block"><SaveIndicator /></div>
        <div className="flex items-center gap-1">
          <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={undo} disabled={!canUndo} aria-label="Undo (Ctrl+Z)"><Undo2 className="size-4" /></button>
          <button type="button" className="btn btn-ghost btn-sm !px-2" onClick={redo} disabled={!canRedo} aria-label="Redo (Ctrl+Shift+Z)"><Redo2 className="size-4" /></button>
        </div>
        <div className="mx-auto hidden xl:block"><Segmented<Device> label="Preview device" value={device} onChange={setDevice} options={[{ value: "mobile", label: "Phone" }, { value: "tablet", label: "Tablet" }, { value: "desktop", label: "Desktop" }]} /></div>
        <select aria-label="Show the invitation as it looks" value={state} onChange={(e) => setState(e.target.value)} className="field-input !w-auto !py-1.5 text-[13.5px]"><option value="PUBLISHED">Before the wedding</option><option value="LIVE_EVENT">Wedding day</option><option value="POST_EVENT">Thank-you</option><option value="MEMORY">Memories</option><option value="ANNIVERSARY">Anniversary</option></select>
        <label className="hidden cursor-pointer items-center gap-2 text-[13.5px] 2xl:flex"><input type="checkbox" className="size-4 accent-[var(--accent)]" checked={guest} onChange={(e) => setGuest(e.target.checked)} />As a personal guest</label>
        {settings.secondaryLocale && <Segmented label="Language" value={lang} onChange={setLang} options={[{ value: settings.defaultLocale, label: settings.defaultLocale.toUpperCase() }, { value: settings.secondaryLocale, label: settings.secondaryLocale.toUpperCase() }]} />}
        <div className="ml-auto flex items-center gap-2">
          {sample && <button type="button" onClick={() => setChecking(true)} className={cn("btn btn-sm", left ? "btn-quiet" : "btn-ghost")} title="What is still the template’s sample"><Sparkles className="size-4" aria-hidden />{left ? `Still the sample: ${left}` : "Sample replaced"}</button>}
          <a className="btn btn-quiet btn-sm hidden 2xl:inline-flex" href={`/preview/${weddingId}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />Full preview</a>
          <Button size="sm" variant="quiet" icon={<Save className="size-4" />} onClick={() => start(async () => { await flush(); const r = await checkpointAction(weddingId, "Editor checkpoint"); if (r.ok) toast.success("Checkpoint saved"); else toast.error(r.error.message); })}>Checkpoint</Button>
          <Button size="sm" variant="accent" loading={pending} icon={<Rocket className="size-4" />} onClick={() => void publish()}>{published ? "Publish changes" : "Publish"}</Button>
        </div>
      </header>

      {guide && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-accent/30 bg-accent-soft px-4 py-2.5 text-[13.5px]" role="status">
          <p className="min-w-0 flex-1"><strong className="font-semibold">Make it theirs.</strong> This is the template’s sample. Go through the sections one by one: change the words, replace the photographs, add or remove list items. Hide or move any section on the left.</p>
          {sample && <button type="button" className="btn btn-quiet btn-sm" onClick={() => setChecking(true)}>See what is left</button>}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setGuide(false)}>Got it</button>
        </div>
      )}

      <div className="flex border-b border-rule bg-paper-2/50 lg:hidden" role="tablist">{(["sections", "preview", "edit"] as const).map((p) => (<button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={cn("min-h-11 flex-1 text-[14px] font-medium capitalize", pane === p ? "border-b-2 border-accent text-ink" : "text-muted")}>{p === "edit" ? "Edit" : p}</button>))}</div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_24rem] xl:grid-cols-[18rem_minmax(0,1fr)_26rem]">
        <aside className={cn("min-h-0 border-r border-rule bg-paper-2/40 lg:block", pane === "sections" ? "block" : "hidden")}>
          <SectionList selected={selected} onSelect={select} extra={{ id: SHARE, label: "Link preview & message", hint: "How the link looks in WhatsApp" }} />
        </aside>
        <main className={cn("min-h-0 bg-[color-mix(in_srgb,var(--paper-2)_70%,var(--paper))] p-3 lg:block lg:p-5", pane === "preview" ? "block" : "hidden")}>
          <DevicePreview ref={frame} src={src} device={device} onMessage={onMessage} />
        </main>
        <aside className={cn("flex min-h-0 flex-col border-l border-rule bg-paper lg:flex", pane === "edit" ? "flex" : "hidden")}>
          {selected !== SHARE && <div role="tablist" className="flex border-b border-rule px-2">{(["section", "content", "design"] as const).map((t) => (<button key={t} role="tab" aria-selected={effTab === t} onClick={() => setTab(t)} className={cn("relative min-h-11 flex-1 text-[14px] capitalize", tab === t ? "font-medium text-ink" : "text-muted hover:text-ink")}>{t === "design" ? "Design & page" : t === "section" ? "Layout & wording" : "Words & photos"}{tab === t && <span aria-hidden className="absolute inset-x-2 -bottom-px h-[2px] bg-accent" />}</button>))}</div>}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {selected === SHARE ? <LinkPreviewPanel /> : effTab === "design" ? <DesignPanel templates={templates} themes={themes} /> : section ? <SectionPanel key={section.id + effTab} section={section} tab={effTab} weddingId={weddingId} /> : <p className="py-10 text-center text-muted">Choose a section on the left, or click one in the preview.</p>}
          </div>
          {selected !== SHARE && section && effTab !== "design" && (
            <div className="flex items-center gap-2 border-t border-rule bg-paper-2/50 px-3 py-2.5">
              <Button size="sm" variant="quiet" disabled={!prevId} onClick={() => prevId && select(prevId)}><ArrowLeft className="size-4" aria-hidden />Previous</Button>
              <button type="button" onClick={toggleHidden} aria-pressed={!section.enabled} className="btn btn-ghost btn-sm mx-auto" title={section.enabled ? "Guests will not see this section" : "Guests will see this section again"}>{section.enabled ? <><EyeOff className="size-4" aria-hidden />Hide this section</> : <><Eye className="size-4" aria-hidden />Show this section</>}</button>
              <Button size="sm" variant="accent" disabled={!nextId} onClick={() => nextId && select(nextId)}>Next<ArrowRight className="size-4" aria-hidden /></Button>
            </div>
          )}
          {saveState === "error" && <p role="alert" className="border-t border-bad bg-bad-soft px-4 py-2 text-[13px] text-bad">Your latest change is not saved yet — check your connection. We will keep trying.</p>}
        </aside>
      </div>
      <Sheet open={checking} onClose={() => setChecking(false)} title="Still the sample" description={sample ? `Words and photographs that still come from the “${sample.template}” sample. Replace them before you publish.` : ""}>
        {left === 0 ? <p className="text-[15px] text-muted">Everything from the sample has been replaced. Photographs added to the gallery are checked in the Media library.</p> : (
          <div className="space-y-6">
            {hits.length > 0 && (
              <div>
                <h3 className="eyebrow mb-2">Words ({hits.length})</h3>
                <ul className="divide-y divide-rule rounded-lg border border-rule-strong">
                  {hits.map((h) => (
                    <li key={h.token} className="px-3.5 py-3">
                      <p className="text-[14.5px] font-medium text-ink">“{h.token.length > 70 ? `${h.token.slice(0, 70)}…` : h.token}”</p>
                      <p className="mt-1 flex flex-wrap gap-1.5 text-[12.5px]">
                        {h.areas.map((a) => {
                          const target = a.sectionType ? doc.sections.find((s) => s.type === a.sectionType) : undefined;
                          if (a.share) return <button key={a.label} type="button" className="rounded-full border border-rule-strong px-2.5 py-0.5 text-accent hover:border-accent" onClick={() => { setChecking(false); select(SHARE); }}>{a.label}</button>;
                          return target
                            ? <button key={a.label} type="button" className="rounded-full border border-rule-strong px-2.5 py-0.5 text-accent hover:border-accent" onClick={() => { setChecking(false); select(target.id); setTab("content"); }}>{a.label}</button>
                            : <span key={a.label} className="rounded-full border border-rule px-2.5 py-0.5 text-muted">{a.label}</span>;
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {photosLeft.length > 0 && (
              <div>
                <h3 className="eyebrow mb-2">Photographs ({photosLeft.length})</h3>
                <p className="text-[14px] text-ink-2">{photosLeft.length} photograph{photosLeft.length === 1 ? " is" : "s are"} still the sample’s. Open the section it is in and use “Replace” on the photograph. Gallery photographs are replaced in the Media library.</p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

export function EditorClient(p: EditorProps) {
  return (
    <ConfirmProvider>
      <DraftProvider weddingId={p.weddingId} role="admin" initialDoc={p.doc} initialSettings={p.settings} features={p.features} groups={p.groups} initialMedia={p.media}>
        <Editor title={p.title} slug={p.slug} published={p.published} templates={p.templates} themes={p.themes} welcome={p.welcome} sample={p.sample} />
      </DraftProvider>
    </ConfirmProvider>
  );
}
