"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ExternalLink, Redo2, Undo2, Rocket, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Segmented, SelectField, TextField } from "@/components/ui/Field";
import { ConfirmProvider, useConfirm } from "@/components/ui/Confirm";
import { DevicePreview, type Device, type DevicePreviewHandle } from "@/components/admin/DevicePreview";
import { DraftProvider, SaveIndicator, useDraft, type WeddingSettings } from "@/components/admin/draft";
import { FormCard, LText } from "@/components/admin/forms";
import { MediaField } from "@/components/admin/MediaField";
import { ThemeStep, type TemplateCard, type ThemeCard } from "@/components/admin/steps/DesignSteps";
import { mergeTokens } from "@/domain/design/tokens";
import type { InvitationDoc } from "@/domain/doc/schema";
import type { FeatureKey } from "@/domain/packages/features";
import type { ResolvedMedia } from "@/domain/media/service";
import type { MediaRow } from "@/app/actions/media";
import { checkpointAction, publishAction, regenerateSectionsAction } from "@/app/actions/wedding";
import { SectionList } from "./SectionList";
import { SectionPanel } from "./SectionPanel";
import type { PreviewPatch } from "@/invitation/PreviewFrame";

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
}

const toResolved = (m: MediaRow): ResolvedMedia => ({ id: m.id, kind: m.kind, mime: "", url: m.url, srcSet: m.srcSet, width: m.width, height: m.height, blur: m.blur, alt: m.alt, caption: m.caption, focal: m.focal });

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
          <option value="envelope">Envelope</option><option value="seal">Wax seal</option><option value="cinematic">Cinematic title sequence</option><option value="swipe">Swipe up</option><option value="curtain">Curtains</option><option value="none">No opening</option>
        </SelectField>
        <div className="mt-4 grid gap-4"><TextField label="Seal letters" maxLength={4} value={doc.opening.sealText} onChange={(e) => update((d) => void (d.opening.sealText = e.target.value.toUpperCase()))} hint="Shown on the wax seal / envelope." />
          <LText label="Line above the names" value={doc.opening.invitedLine} onChange={(v) => update((d) => void (d.opening.invitedLine = v))} placeholder="You are invited to the wedding of" /></div>
      </div>
      <div><h2 className="display mb-3 text-[28px]">Theme</h2><ThemeStep themes={themes} hidePreview /></div>
      <FormCard title="Sharing preview" description="How the link looks in WhatsApp and search results.">
        <LText label="Title" value={doc.seo.title} onChange={(v) => update((d) => void (d.seo.title = v))} placeholder="Meenakshi & Aravind — Wedding Invitation" />
        <LText label="Description" multiline value={doc.seo.description} onChange={(v) => update((d) => void (d.seo.description = v))} />
        <MediaField label="Preview image" value={doc.seo.ogImage} category="COUPLE" onChange={(id) => update((d) => void (d.seo.ogImage = id))} aspect="aspect-[1200/630]" />
      </FormCard>
    </div>
  );
}

function Editor({ title, slug, published, templates, themes }: Pick<EditorProps, "title" | "slug" | "published" | "templates" | "themes">) {
  const { weddingId, doc, settings, media, undo, redo, canUndo, canRedo, flush, saveState } = useDraft();
  const ask = useConfirm();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(doc.sections.find((s) => s.type === "hero")?.id ?? doc.sections[0]?.id ?? null);
  const [tab, setTab] = useState<"section" | "content" | "design">("section");
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

  // Push every edit into the live preview (debounced).
  useEffect(() => {
    const id = setTimeout(() => {
      const patch: PreviewPatch = { type: "aoire:patch", doc, tokens, flavor, media: mediaMap, status: state as never, title: settings.title, secondaryLocale: settings.secondaryLocale };
      frame.current?.post(patch);
    }, 120);
    return () => clearTimeout(id);
  }, [doc, tokens, flavor, mediaMap, state, settings.title, settings.secondaryLocale, ready]);

  const onMessage = useCallback((m: { type: string; sectionId?: unknown }) => {
    if (m.type === "aoire:ready") setReady((n) => n + 1);
    if (m.type === "aoire:select" && typeof m.sectionId === "string") {
      setSelected(m.sectionId);
      setTab("section");
      setPane("edit");
    }
  }, []);

  const select = (id: string) => {
    setSelected(id);
    setTab((t) => (t === "design" ? "section" : t));
    frame.current?.post({ type: "aoire:focus", sectionId: id });
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
    if (!(await ask({ title: published ? "Publish your changes?" : "Publish this invitation?", message: `Guests will see this version at /invite/${slug}. You can roll back from Versions at any time.`, confirmLabel: "Publish" }))) return;
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
          <a className="btn btn-quiet btn-sm hidden 2xl:inline-flex" href={`/preview/${weddingId}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />Full preview</a>
          <Button size="sm" variant="quiet" icon={<Save className="size-4" />} onClick={() => start(async () => { await flush(); const r = await checkpointAction(weddingId, "Editor checkpoint"); if (r.ok) toast.success("Checkpoint saved"); else toast.error(r.error.message); })}>Checkpoint</Button>
          <Button size="sm" variant="accent" loading={pending} icon={<Rocket className="size-4" />} onClick={() => void publish()}>{published ? "Publish changes" : "Publish"}</Button>
        </div>
      </header>

      <div className="flex border-b border-rule bg-paper-2/50 lg:hidden" role="tablist">{(["sections", "preview", "edit"] as const).map((p) => (<button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={cn("min-h-11 flex-1 text-[14px] font-medium capitalize", pane === p ? "border-b-2 border-accent text-ink" : "text-muted")}>{p === "edit" ? "Edit" : p}</button>))}</div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_24rem] xl:grid-cols-[18rem_minmax(0,1fr)_26rem]">
        <aside className={cn("min-h-0 border-r border-rule bg-paper-2/40 lg:block", pane === "sections" ? "block" : "hidden")}>
          <SectionList selected={selected} onSelect={select} />
        </aside>
        <main className={cn("min-h-0 bg-[color-mix(in_srgb,var(--paper-2)_70%,var(--paper))] p-3 lg:block lg:p-5", pane === "preview" ? "block" : "hidden")}>
          <DevicePreview ref={frame} src={src} device={device} onMessage={onMessage} />
        </main>
        <aside className={cn("flex min-h-0 flex-col border-l border-rule bg-paper lg:flex", pane === "edit" ? "flex" : "hidden")}>
          <div role="tablist" className="flex border-b border-rule px-2">{(["section", "content", "design"] as const).map((t) => (<button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("relative min-h-11 flex-1 text-[14px] capitalize", tab === t ? "font-medium text-ink" : "text-muted hover:text-ink")}>{t === "design" ? "Design & page" : t === "section" ? "This section" : "Content"}{tab === t && <span aria-hidden className="absolute inset-x-2 -bottom-px h-[2px] bg-accent" />}</button>))}</div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "design" ? <DesignPanel templates={templates} themes={themes} /> : section ? <SectionPanel key={section.id + tab} section={section} tab={tab} weddingId={weddingId} /> : <p className="py-10 text-center text-muted">Choose a section on the left, or click one in the preview.</p>}
          </div>
          {saveState === "error" && <p role="alert" className="border-t border-bad bg-bad-soft px-4 py-2 text-[13px] text-bad">Your latest change is not saved yet — check your connection. We will keep trying.</p>}
        </aside>
      </div>
    </div>
  );
}

export function EditorClient(p: EditorProps) {
  return (
    <ConfirmProvider>
      <DraftProvider weddingId={p.weddingId} role="admin" initialDoc={p.doc} initialSettings={p.settings} features={p.features} groups={p.groups} initialMedia={p.media}>
        <Editor title={p.title} slug={p.slug} published={p.published} templates={p.templates} themes={p.themes} />
      </DraftProvider>
    </ConfirmProvider>
  );
}
