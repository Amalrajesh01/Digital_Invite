"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { FEATURES, FEATURE_KEYS, type PackageKey } from "@/domain/packages/features";
import { formatPriceRange } from "@/domain/packages/catalog";
import { createWeddingAction } from "@/app/actions/wedding";

interface Pkg { key: PackageKey; name: string; tagline: string; blurb: string; priceMin: number; priceMax: number; hasClientDashboard: boolean }

export function NewWeddingForm({ packages }: { packages: Pkg[] }) {
  const router = useRouter();
  const [pick, setPick] = useState<PackageKey>("SIGNATURE");
  const [free, setFree] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-3" role="radiogroup" aria-label="Package">
        {packages.map((p) => {
          const own = FEATURE_KEYS.filter((k) => FEATURES[k].tier === p.key);
          const on = pick === p.key;
          return (
            <button key={p.key} type="button" role="radio" aria-checked={on} onClick={() => setPick(p.key)} className={cn("relative flex flex-col rounded-lg border p-6 text-left transition-colors", on ? "border-accent bg-surface ring-1 ring-accent" : "border-rule-strong bg-surface hover:border-ink-2")}>
              {on && <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-accent text-white"><Check className="size-4" /></span>}
              <span className="eyebrow">{p.tagline}</span>
              <span className="display mt-2 text-[36px]">{p.name}</span>
              <span className="display tnum text-[26px] text-accent">{formatPriceRange(p.priceMin, p.priceMax)}</span>
              <span className="mt-3 text-[14px] leading-relaxed text-muted">{p.blurb}</span>
              <ul className="mt-5 space-y-1.5 border-t border-rule pt-4 text-[13.5px]">
                {p.key !== "ESSENTIAL" && <li className="font-medium text-ink-2">Everything in {p.key === "SIGNATURE" ? "Essential" : "Signature"}, plus:</li>}
                {own.slice(0, 8).map((k) => (<li key={k} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden />{FEATURES[k].label}</li>))}
                {own.length > 8 && <li className="pl-5 text-muted">…and {own.length - 8} more</li>}
              </ul>
            </button>
          );
        })}
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-[15px]"><input type="checkbox" className="mt-1 size-[18px] accent-[var(--accent)]" checked={free} onChange={(e) => setFree(e.target.checked)} /><span><span className="font-medium">Free portfolio customer</span><span className="block text-[13.5px] text-muted">One of the first five weddings offered free for portfolio, testimonials and referrals. It gets the full quality of the package.</span></span></label>
      <Button size="lg" variant="accent" loading={pending} onClick={() => start(async () => { const r = await createWeddingAction({ packageKey: pick, customerClass: free ? "FREE_PORTFOLIO" : `PAID_${pick}` }); if (r.ok) router.push(`/admin/weddings/${r.data.id}/setup/couple`); else toast.error(r.error.message); })}>Start with the couple’s details</Button>
    </div>
  );
}
