"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { PackageChip } from "@/components/ui/Chip";
import { Checkbox, Switch, TextArea, TextField } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { updatePackageAction } from "@/app/actions/wedding";

interface Feature { key: string; label: string; description: string; group: string; tier: string }
interface Pkg { key: string; name: string; tagline: string; blurb: string; priceMin: number; priceMax: number; features: string[]; active: boolean; hasClientDashboard: boolean }

function Card({ pkg, features }: { pkg: Pkg; features: Feature[] }) {
  const router = useRouter();
  const [v, setV] = useState({ name: pkg.name, tagline: pkg.tagline, blurb: pkg.blurb, priceMin: String(pkg.priceMin), priceMax: String(pkg.priceMax), active: pkg.active });
  const [on, setOn] = useState(() => new Set(pkg.features));
  const [pending, start] = useTransition();
  const groups = useMemo(() => {
    const m = new Map<string, Feature[]>();
    for (const f of features) m.set(f.group, [...(m.get(f.group) ?? []), f]);
    return [...m];
  }, [features]);
  const dirty = v.name !== pkg.name || v.tagline !== pkg.tagline || v.blurb !== pkg.blurb || Number(v.priceMin) !== pkg.priceMin || Number(v.priceMax) !== pkg.priceMax || v.active !== pkg.active || on.size !== pkg.features.length || pkg.features.some((f) => !on.has(f));
  const save = () =>
    start(async () => {
      const r = await updatePackageAction(pkg.key, { name: v.name, tagline: v.tagline, blurb: v.blurb, priceMin: Number(v.priceMin), priceMax: Number(v.priceMax), active: v.active, features: [...on] });
      if (r.ok) { toast.success(`${v.name} saved`); router.refresh(); } else toast.error(r.error.message);
    });
  return (
    <section className="flex flex-col rounded-lg border border-rule-strong bg-surface" aria-label={`${pkg.name} package`}>
      <header className="border-b border-rule p-5">
        <div className="flex items-center justify-between"><PackageChip pkg={pkg.key} /><span className="text-[12.5px] text-muted">{on.size} of {features.length} features</span></div>
        <div className="mt-4 grid gap-4">
          <TextField label="Name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          <TextField label="One-line pitch" value={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} />
          <TextArea label="Description" rows={3} value={v.blurb} onChange={(e) => setV({ ...v, blurb: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Price from (₹)" type="number" min={0} inputMode="numeric" value={v.priceMin} onChange={(e) => setV({ ...v, priceMin: e.target.value })} />
            <TextField label="Price up to (₹)" type="number" min={0} inputMode="numeric" value={v.priceMax} onChange={(e) => setV({ ...v, priceMax: e.target.value })} />
          </div>
          <Switch label="Offer this package" checked={v.active} onChange={(a) => setV({ ...v, active: a })} hint="Turn off to stop it appearing when creating new weddings." />
        </div>
      </header>
      <div className="max-h-[34rem] flex-1 overflow-y-auto p-5">
        {groups.map(([g, fs]) => (
          <fieldset key={g} className="mb-5 last:mb-0">
            <legend className="eyebrow mb-2">{g}</legend>
            <div className="grid gap-1.5">
              {fs.map((f) => (
                <div key={f.key} title={f.description} className={cn("flex items-center justify-between gap-2 rounded px-1")}>
                  <Checkbox label={f.label} checked={on.has(f.key)} onChange={(c) => setOn((s) => { const n = new Set(s); if (c) n.add(f.key); else n.delete(f.key); return n; })} />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-rule bg-surface p-4">
        <span className="text-[13px] text-muted">{dirty ? "Unsaved changes" : "Up to date"}</span>
        <Button loading={pending} disabled={!dirty} onClick={save}>Save {pkg.name}</Button>
      </footer>
    </section>
  );
}

export function PackagesEditor({ packages, features }: { packages: Pkg[]; features: Feature[] }) {
  return <div className="grid items-start gap-6 xl:grid-cols-3">{packages.map((p) => <Card key={p.key} pkg={p} features={features} />)}</div>;
}
