"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";
import { Chip } from "@/components/ui/Chip";
import { SelectField, Switch, TextArea, TextField } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { FallbackImg } from "@/components/site/FallbackImg";
import { coverChoicesAction, deletePortfolioAction, movePortfolioAction, savePortfolioAction, setPortfolioStatusAction } from "@/app/actions/portfolio";

interface Item { id: string; slug: string; title: string; description: string; category: string; templateSlug: string; city: string; weddingId: string | null; coverAssetId: string | null; showLive: boolean; consent: boolean; consentNote: string; status: "DRAFT" | "PUBLISHED"; wedding: { title: string; isDemo: boolean } | null }
interface Props { items: Item[]; weddings: { id: string; label: string; isDemo: boolean }[]; templates: { slug: string; name: string; category: string; thumb: string }[]; categories: { slug: string; name: string }[] }
type Form = Omit<Item, "id" | "slug" | "wedding"> & { id?: string };
const BLANK: Form = { title: "", description: "", category: "wedding", templateSlug: "", city: "", weddingId: null, coverAssetId: null, showLive: false, consent: false, consentNote: "", status: "DRAFT" };

export function PortfolioManager({ items, weddings, templates, categories }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<Form | null>(null);
  const [covers, setCovers] = useState<{ id: string; url: string; alt: string }[]>([]);
  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const tpl = (slug: string) => templates.find((t) => t.slug === slug);
  const wedding = (id: string | null) => weddings.find((w) => w.id === id);

  const loadCovers = async (id: string) => {
    const r = await coverChoicesAction(id);
    setCovers(r.ok ? (r.data as typeof covers) : []);
  };
  const open = (f: Form) => {
    setForm(f);
    setCovers([]);
    if (f.weddingId) void loadCovers(f.weddingId);
  };
  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, done?: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (done) toast.success(done);
        router.refresh();
      } else toast.error(r.error?.message ?? "That did not work.");
    });
  const save = () =>
    form &&
    start(async () => {
      const r = await savePortfolioAction(form);
      if (r.ok) {
        toast.success("Saved");
        setForm(null);
        router.refresh();
      } else toast.error(r.error.message);
    });

  const w = wedding(form?.weddingId ?? null);
  const needsConsent = !!w && !w.isDemo;
  const previewCover = form ? (form.coverAssetId ? covers.find((x) => x.id === form.coverAssetId)?.url : tpl(form.templateSlug)?.thumb) : undefined;

  return (
    <>
      <div className="mb-6 flex justify-end"><Button icon={<Plus className="size-4" />} onClick={() => open(BLANK)}>Add a project</Button></div>
      {items.length === 0 ? (
        <EmptyState title="Nothing here yet" body="Add a finished invitation, or a template you want to show off. It stays hidden until you publish it." action={<Button variant="quiet" onClick={() => open(BLANK)}>Add a project</Button>} />
      ) : (
        <ul className="grid gap-4">
          {items.map((i, n) => (
            <li key={i.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-rule p-4">
              <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-md bg-paper-2">{tpl(i.templateSlug) && <FallbackImg src={tpl(i.templateSlug)!.thumb} alt="" width={540} height={1140} className="absolute inset-0 size-full object-cover object-top" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{i.title}</p>
                <p className="truncate text-[13px] text-muted">{[tpl(i.templateSlug)?.name, categories.find((c) => c.slug === i.category)?.name, i.city].filter(Boolean).join(" · ")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip tone={i.status === "PUBLISHED" ? "ok" : "neutral"}>{i.status === "PUBLISHED" ? "On the public site" : "Hidden"}</Chip>
                  {i.wedding && <Chip tone={i.wedding.isDemo ? "info" : i.consent ? "ok" : "warn"}>{i.wedding.isDemo ? "Sample invitation" : i.consent ? "Customer consent recorded" : "Needs consent"}</Chip>}
                  {i.showLive && <Chip tone="brass">Live preview on</Chip>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button size="sm" variant="ghost" aria-label="Move up" disabled={pending || n === 0} icon={<ArrowUp className="size-4" />} onClick={() => run(() => movePortfolioAction(i.id, "up"))} />
                <Button size="sm" variant="ghost" aria-label="Move down" disabled={pending || n === items.length - 1} icon={<ArrowDown className="size-4" />} onClick={() => run(() => movePortfolioAction(i.id, "down"))} />
                <Button size="sm" variant="quiet" disabled={pending} icon={i.status === "PUBLISHED" ? <EyeOff className="size-4" /> : <Eye className="size-4" />} onClick={() => run(() => setPortfolioStatusAction(i.id, i.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"), i.status === "PUBLISHED" ? "Hidden from the public site" : "Published")}>{i.status === "PUBLISHED" ? "Hide" : "Publish"}</Button>
                <Button size="sm" variant="quiet" icon={<Pencil className="size-4" />} onClick={() => open({ id: i.id, title: i.title, description: i.description, category: i.category, templateSlug: i.templateSlug, city: i.city, weddingId: i.weddingId, coverAssetId: i.coverAssetId, showLive: i.showLive, consent: i.consent, consentNote: i.consentNote, status: i.status })}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-bad" aria-label={`Delete ${i.title}`} icon={<Trash2 className="size-4" />} onClick={() => { if (confirm(`Delete “${i.title}” from the portfolio? The invitation itself is not touched.`)) run(() => deletePortfolioAction(i.id), "Deleted"); }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit project" : "Add a project"} description="Only what you write here is shown to visitors." wide
        footer={<><Button variant="quiet" onClick={() => setForm(null)}>Cancel</Button><Button loading={pending} onClick={save}>Save</Button></>}>
        {form && (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="grid content-start gap-4">
              <TextField label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} hint="What visitors read. Use a description like “A garden wedding in Kerala” unless the family has agreed to be named." />
              <TextArea label="Short description" rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Occasion" value={form.category} onChange={(e) => set({ category: e.target.value })}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</SelectField>
                <TextField label="Place (optional)" value={form.city} onChange={(e) => set({ city: e.target.value })} />
              </div>
              <SelectField label="Template" value={form.templateSlug} onChange={(e) => set({ templateSlug: e.target.value })} hint="Its own picture is the cover unless you choose an approved photograph below.">
                <option value="">None</option>{templates.map((t) => <option key={t.slug} value={t.slug}>{t.name} — {categories.find((c) => c.slug === t.category)?.name ?? t.category}</option>)}
              </SelectField>
              <SelectField label="Linked invitation (optional)" value={form.weddingId ?? ""} onChange={(e) => { const id = e.target.value || null; set({ weddingId: id, coverAssetId: null, consent: false, consentNote: "", showLive: false }); setCovers([]); if (id) void loadCovers(id); }}>
                <option value="">Not linked</option>{weddings.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </SelectField>
              {form.weddingId && covers.length > 0 && (
                <fieldset>
                  <legend className="mb-2 text-[13.5px] font-medium text-ink-2">Cover photograph</legend>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" aria-pressed={!form.coverAssetId} onClick={() => set({ coverAssetId: null })} className={`h-16 rounded-md border px-3 text-[13px] ${!form.coverAssetId ? "border-accent bg-accent-soft/40" : "border-rule-strong"}`}>Template picture</button>
                    {covers.map((c) => (
                      <button key={c.id} type="button" aria-pressed={form.coverAssetId === c.id} onClick={() => set({ coverAssetId: c.id })} className={`relative h-16 w-16 overflow-hidden rounded-md border-2 ${form.coverAssetId === c.id ? "border-accent" : "border-transparent"}`}><FallbackImg src={c.url} alt={c.alt} width={64} height={64} className="size-full object-cover" /></button>
                    ))}
                  </div>
                </fieldset>
              )}
              {needsConsent && (
                <div className="grid gap-3 rounded-md border border-warn/40 bg-warn/5 p-4">
                  <Switch label="This customer has agreed to be shown" checked={form.consent} onChange={(v) => set({ consent: v })} />
                  <TextField label="How and when they agreed" value={form.consentNote} onChange={(e) => set({ consentNote: e.target.value })} placeholder="Agreed by WhatsApp, 12 October" disabled={!form.consent} />
                  <p className="text-[13px] text-muted">A customer’s invitation cannot be published or previewed publicly without this.</p>
                </div>
              )}
              <Switch label="Offer the live invitation to visitors" checked={form.showLive} onChange={(v) => set({ showLive: v })} />
              <Switch label="Show this on the public site" checked={form.status === "PUBLISHED"} onChange={(v) => set({ status: v ? "PUBLISHED" : "DRAFT" })} />
            </div>
            <aside aria-label="How the card will look" className="lg:sticky lg:top-0">
              <p className="mb-2 text-[13px] font-medium text-ink-2">How it will look</p>
              <div className="overflow-hidden rounded-xl border border-rule">
                <div className="relative aspect-[4/5] bg-paper-2">{previewCover ? <FallbackImg src={previewCover} alt="" width={540} height={675} className="absolute inset-0 size-full object-cover object-top" /> : null}</div>
                <div className="p-4"><p className="font-serif text-[20px] leading-tight">{form.title || "Title"}</p><p className="mt-1 text-[13px] text-muted">{[tpl(form.templateSlug)?.name, form.city].filter(Boolean).join(" · ")}</p><p className="mt-2 text-[14px] text-ink-2">{form.description}</p></div>
              </div>
            </aside>
          </div>
        )}
      </Sheet>
    </>
  );
}
