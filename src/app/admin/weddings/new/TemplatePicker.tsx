"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";
import { SelectField, TextField } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { formatPriceRange } from "@/domain/packages/catalog";
import type { PackageKey } from "@/domain/packages/features";
import { createFromTemplateAction } from "@/app/actions/wedding";

export interface PickTemplate { id: string; slug: string; name: string; blurb: string; category: string; subject: "couple" | "person" | "occasion" | "memorial"; thumb: string | null; hasSample: boolean }
export interface PickPackage { key: PackageKey; name: string; tagline: string; priceMin: number; priceMax: number }

const ASK: Record<PickTemplate["subject"], { a?: string; b?: string; title: string }> = {
  couple: { a: "Bride’s name", b: "Groom’s name", title: "Anjali & Sidharth" },
  person: { a: "Who is it for?", title: "Meera turns twenty-five" },
  occasion: { title: "Leadership Conclave 2027" },
  memorial: { a: "In memory of", title: "Thomas Mathew — in loving memory" },
};

export function TemplatePicker({ templates, packages }: { templates: PickTemplate[]; packages: PickPackage[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [pick, setPick] = useState<PickTemplate | null>(null);
  const [pkg, setPkg] = useState<PackageKey>(packages.find((p) => p.key === "SIGNATURE")?.key ?? packages[0]?.key ?? "ESSENTIAL");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [date, setDate] = useState("");
  const [pending, start] = useTransition();

  const cats = useMemo(() => ["All", ...Array.from(new Set(templates.map((t) => t.category)))], [templates]);
  const shown = templates.filter((t) => (cat === "All" || t.category === cat) && (!q.trim() || `${t.name} ${t.blurb} ${t.category}`.toLowerCase().includes(q.trim().toLowerCase())));

  const choose = (t: PickTemplate) => { setPick(t); setA(""); setB(""); setTitle(""); setTitleEdited(false); };
  const ask = pick ? ASK[pick.subject] : null;
  // the invitation's name follows the names until the person types their own
  const suggested = pick?.subject === "couple" ? [a.trim(), b.trim()].filter(Boolean).join(" & ") : pick?.subject === "memorial" ? a.trim() : "";
  const shownTitle = titleEdited ? title : suggested;
  const ready = !!pick && !!date && !!shownTitle.trim() && (pick.subject !== "couple" || (!!a.trim() && !!b.trim()));

  const create = () => pick && start(async () => {
    const r = await createFromTemplateAction({ templateId: pick.id, packageKey: pkg, title: shownTitle, nameA: a, nameB: b, date });
    if (r.ok) { toast.success("Created. Now replace the sample words and photographs."); router.push(`/editor/${r.data.id}?new=1`); } else toast.error(r.error.message);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="field-input w-full !pl-9" placeholder="Search designs — royal, garden, birthday…" aria-label="Search designs" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Occasion">
          {cats.map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={cn("min-h-9 rounded-full border px-3.5 text-[13.5px] font-medium", cat === c ? "border-ink bg-ink text-white" : "border-rule-strong bg-white text-ink-2 hover:border-ink-2")}>{c}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? <EmptyState title="No design matches" body="Clear the search, or choose another occasion." /> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => choose(t)} className="group block w-full overflow-hidden rounded-xl border border-rule-strong bg-white text-left transition hover:-translate-y-0.5 hover:border-ink-2 hover:shadow-[var(--shadow-2)]">
                <span className="relative block aspect-[9/16] bg-paper-2">
                  {t.thumb ? <img src={t.thumb} alt="" loading="lazy" className="absolute inset-0 size-full object-cover object-top" /> : <span className="absolute inset-0 grid place-items-center p-4 text-center font-serif text-xl text-muted">{t.name}</span>}
                </span>
                <span className="block p-3.5">
                  <span className="block text-[15.5px] font-semibold text-ink">{t.name}</span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">{t.category}{t.hasSample ? "" : " · starts empty"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!pick} onClose={() => setPick(null)} title={pick ? `Start with ${pick.name}` : ""} description="You get this design with its sample words and photographs already in place. Next you only replace them — and add, remove, hide or move anything you like."
        footer={<><Button variant="quiet" onClick={() => setPick(null)}>Cancel</Button><Button loading={pending} disabled={!ready} onClick={create}>Create and start editing</Button></>}>
        {pick && ask && (
          <div className="grid gap-4">
            {ask.a && <TextField label={ask.a} value={a} onChange={(e) => setA(e.target.value)} required={pick.subject === "couple"} autoComplete="off" />}
            {ask.b && <TextField label={ask.b} value={b} onChange={(e) => setB(e.target.value)} required autoComplete="off" />}
            <TextField label="Name of the invitation" value={shownTitle} placeholder={ask.title} onChange={(e) => { setTitle(e.target.value); setTitleEdited(true); }} hint="Only you see this; it is how the invitation appears in your list." required />
            <TextField label={pick.subject === "couple" ? "Wedding date" : "Date"} type="date" value={date} onChange={(e) => setDate(e.target.value)} required hint="Every date in the sample moves to match." />
            <SelectField label="Package" value={pkg} onChange={(e) => setPkg(e.target.value as PackageKey)} hint="You can change it later.">
              {packages.map((p) => (<option key={p.key} value={p.key}>{p.name} — {formatPriceRange(p.priceMin, p.priceMax)}</option>))}
            </SelectField>
            <p className="flex items-start gap-2 text-[13px] text-muted"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />Takes a few seconds: the sample’s photographs are copied into this invitation.</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
