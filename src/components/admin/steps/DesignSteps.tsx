"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { SelectField, Segmented } from "@/components/ui/Field";
import { FONT_CHOICES, type ThemeTokens } from "@/domain/design/tokens";
import { FormCard, Hint } from "../forms";
import { DevicePreview, type Device } from "../DevicePreview";
import { useDraft } from "../draft";

export interface TemplateCard { id: string; slug: string; name: string; description: string; flavor: string; opening: string; suggestedTheme?: string }
export interface ThemeCard { id: string; slug: string; name: string; description: string; tokens: ThemeTokens }

const b64 = (o: unknown) => (typeof window === "undefined" ? "" : btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function PreviewPane({ templateId, themeId, overrides, pkg, className }: { templateId: string | null; themeId: string | null; overrides?: unknown; pkg: string; className?: string }) {
  const [device, setDevice] = useState<Device>("mobile");
  const [state, setState] = useState("PUBLISHED");
  const [lang, setLang] = useState("en");
  const { settings } = useDraft();
  const params = useDebounced(`template=${templateId ?? ""}&theme=${themeId ?? ""}&pkg=${pkg}&state=${state}&lang=${lang}${overrides && Object.keys(overrides as object).length ? `&o=${b64(overrides)}` : ""}`);
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented<Device> label="Device" value={device} onChange={setDevice} options={[{ value: "mobile", label: "Phone" }, { value: "tablet", label: "Tablet" }, { value: "desktop", label: "Desktop" }]} />
        <select aria-label="Show the invitation as it looks…" value={state} onChange={(e) => setState(e.target.value)} className="field-input !w-auto !py-1.5 text-[13.5px]">
          <option value="PUBLISHED">Before the wedding</option><option value="LIVE_EVENT">On the wedding day</option><option value="POST_EVENT">After — thank you</option><option value="ANNIVERSARY">One year later</option>
        </select>
        {settings.secondaryLocale && <Segmented label="Language" value={lang} onChange={setLang} options={[{ value: "en", label: "EN" }, { value: settings.secondaryLocale, label: settings.secondaryLocale.toUpperCase() }]} />}
      </div>
      <div className="min-h-[36rem] flex-1 rounded-lg bg-paper-2/70 p-3"><DevicePreview src={`/preview/template?${params}`} device={device} /></div>
      <p className="mt-2 text-[12.5px] text-muted">Previewing a finished sample wedding so you can judge the look — your own content replaces it in the invitation.</p>
    </div>
  );
}

export function TemplateStep({ templates, themes }: { templates: TemplateCard[]; themes: ThemeCard[] }) {
  const { settings, updateSettings } = useDraft();
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="space-y-4">
        <FormCard title="Choose a template" description="A template decides the structure: how the invitation opens, how the hero, story and events are laid out. Colours and fonts come from the theme — you can mix any template with any theme.">
          <ul className="grid gap-3">
            {templates.map((t) => {
              const on = t.id === settings.templateId;
              return (
                <li key={t.id}>
                  <button type="button" aria-pressed={on} onClick={() => { updateSettings({ templateId: t.id }); const th = themes.find((x) => x.slug === t.suggestedTheme); if (!settings.themeId && th) updateSettings({ themeId: th.id }); }} className={cn("relative w-full rounded-lg border p-5 text-left transition-colors", on ? "border-accent bg-accent-soft/40 ring-1 ring-accent" : "border-rule-strong bg-surface hover:border-ink-2")}>
                    <span className="flex items-start justify-between gap-3"><span className="display text-[26px]">{t.name}</span>{on && <span className="grid size-6 place-items-center rounded-full bg-accent text-white"><Check className="size-4" /></span>}</span>
                    <span className="mt-1 block text-[14px] text-muted">{t.description}</span>
                    <span className="mt-3 flex flex-wrap gap-2 text-[12px] text-ink-2"><span className="chip chip-neutral">Opens with {t.opening === "none" ? "no animation" : t.opening}</span><span className="chip chip-neutral">{t.flavor} style</span></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </FormCard>
        <Hint>Changing the template later never deletes your content. On the Generate step you can rebuild the section layout from the chosen template.</Hint>
      </div>
      <PreviewPane templateId={settings.templateId} themeId={settings.themeId} overrides={settings.themeOverrides} pkg={settings.packageKey} className="xl:sticky xl:top-20 xl:self-start" />
    </div>
  );
}

const COLOR_LABELS: [keyof ThemeTokens["colors"], string][] = [
  ["primary", "Main colour"], ["secondary", "Second colour"], ["accent", "Accent (gold)"], ["background", "Page background"], ["surface", "Cards"], ["text", "Text"], ["muted", "Soft text"], ["border", "Lines"], ["inverse", "Night sections"], ["onInverse", "Text on night"],
];

export function ThemeStep({ themes, hidePreview }: { themes: ThemeCard[]; hidePreview?: boolean }) {
  const { settings, updateSettings } = useDraft();
  const base = themes.find((t) => t.id === settings.themeId)?.tokens;
  const ov = settings.themeOverrides as Partial<ThemeTokens> & { colors?: Partial<ThemeTokens["colors"]>; fonts?: Partial<ThemeTokens["fonts"]> };
  const merged = useMemo(() => (base ? { ...base, ...ov, colors: { ...base.colors, ...(ov.colors ?? {}) }, fonts: { ...base.fonts, ...(ov.fonts ?? {}) } } : null), [base, ov]);
  const set = (patch: Record<string, unknown>) => updateSettings({ themeOverrides: { ...settings.themeOverrides, ...patch } });
  const setColor = (k: string, v: string) => set({ colors: { ...(ov.colors ?? {}), [k]: v } });
  const setFont = (k: string, v: string) => set({ fonts: { ...(ov.fonts ?? {}), [k]: v } });
  const customised = Object.keys(settings.themeOverrides).length > 0;

  return (
    <div className={hidePreview ? "" : "grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"}>
      <div className="space-y-6">
        <FormCard title="Choose a theme" description="Themes carry the colours, typefaces and feel — royal gold, emerald ivory, rose gold, kasavu and more.">
          <ul className="grid gap-3 sm:grid-cols-2">
            {themes.map((t) => {
              const on = t.id === settings.themeId;
              return (
                <li key={t.id}>
                  <button type="button" aria-pressed={on} onClick={() => updateSettings({ themeId: t.id, themeOverrides: {} })} className={cn("w-full overflow-hidden rounded-lg border text-left transition-colors", on ? "border-accent ring-1 ring-accent" : "border-rule-strong hover:border-ink-2")}>
                    <span className="flex h-14" aria-hidden>{[t.tokens.colors.background, t.tokens.colors.primary, t.tokens.colors.secondary, t.tokens.colors.accent, t.tokens.colors.inverse].map((c, i) => (<span key={i} className="flex-1" style={{ background: c }} />))}</span>
                    <span className="block bg-surface p-4"><span className="flex items-center justify-between gap-2"><span className="display text-[22px]">{t.name}</span>{on && <Check className="size-4 text-accent" />}</span><span className="mt-0.5 block text-[13px] leading-snug text-muted">{t.description}</span></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </FormCard>

        {merged && (
          <FormCard title="Fine-tune" description="Optional. Adjust the theme for this wedding only — the shared theme stays untouched." actions={customised ? <Button variant="ghost" size="sm" icon={<RotateCcw className="size-4" />} onClick={() => updateSettings({ themeOverrides: {} })}>Reset</Button> : undefined}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {COLOR_LABELS.map(([k, label]) => (
                <label key={k} className="flex items-center gap-3"><input type="color" value={merged.colors[k]} onChange={(e) => setColor(k, e.target.value)} className="size-10 shrink-0 cursor-pointer rounded-md border border-rule-strong bg-transparent p-0.5" /><span className="text-[13.5px] text-ink-2">{label}</span></label>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="Headings font" value={merged.fonts.heading} onChange={(e) => setFont("heading", e.target.value)}>{FONT_CHOICES.heading.map((f) => (<option key={f}>{f}</option>))}</SelectField>
              <SelectField label="Body font" value={merged.fonts.body} onChange={(e) => setFont("body", e.target.value)}>{FONT_CHOICES.body.map((f) => (<option key={f}>{f}</option>))}</SelectField>
              <SelectField label="Script font (names, accents)" value={merged.fonts.script} onChange={(e) => setFont("script", e.target.value)}>{FONT_CHOICES.script.map((f) => (<option key={f}>{f}</option>))}</SelectField>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="Corners" value={merged.radius} onChange={(e) => set({ radius: e.target.value })}><option value="none">Square</option><option value="soft">Soft</option><option value="round">Rounded</option><option value="pill">Pill</option></SelectField>
              <SelectField label="Buttons" value={merged.button} onChange={(e) => set({ button: e.target.value })}><option value="solid">Solid</option><option value="outline">Outline</option><option value="underline">Underlined text</option><option value="pill">Pill</option></SelectField>
              <SelectField label="Cards" value={merged.card} onChange={(e) => set({ card: e.target.value })}><option value="flat">Flat</option><option value="outlined">Outlined</option><option value="raised">Raised</option><option value="paper">Paper card</option></SelectField>
              <SelectField label="Dividers" value={merged.divider} onChange={(e) => set({ divider: e.target.value })}><option value="ornament">Ornament</option><option value="line">Hairline</option><option value="dots">Dots</option><option value="none">None</option></SelectField>
              <SelectField label="Decoration" value={merged.decor} onChange={(e) => set({ decor: e.target.value })}><option value="minimal">Minimal</option><option value="geometric">Geometric</option><option value="kasavu">Kasavu border</option><option value="floral">Floral wash</option><option value="none">None</option></SelectField>
              <SelectField label="Animation" value={merged.motion} onChange={(e) => set({ motion: e.target.value })}><option value="calm">Calm</option><option value="standard">Standard</option><option value="rich">Rich</option></SelectField>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-[14.5px]"><input type="checkbox" className="size-[18px] accent-[var(--accent)]" checked={merged.grain} onChange={(e) => set({ grain: e.target.checked })} />Soft paper texture</label>
          </FormCard>
        )}
      </div>
      {!hidePreview && <PreviewPane templateId={settings.templateId} themeId={settings.themeId} overrides={settings.themeOverrides} pkg={settings.packageKey} className="xl:sticky xl:top-20 xl:self-start" />}
    </div>
  );
}
