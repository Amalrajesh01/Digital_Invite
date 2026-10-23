"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { setLetterEnabledAction } from "@/app/actions/growth";

interface Row { slug: string; n: number; title: string; category: string; tone: string; purpose: string; enabled: boolean; cover: string }

export function LettersManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const toggle = (r: Row) => start(async () => {
    const res = await setLetterEnabledAction(r.slug, !r.enabled);
    if (res.ok) { toast.success(r.enabled ? "Switched off — it is no longer in the public gallery." : "Switched on — it is in the public gallery."); router.refresh(); } else toast.error(res.error.message);
  });
  return (
    <div className="overflow-x-auto">
      <table className="ledger">
        <thead><tr><th>No.</th><th>Experience</th><th>Chapter</th><th>Look</th><th>Gallery</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slug} className="align-top">
              <td className="tnum font-medium">{String(r.n).padStart(2, "0")}</td>
              <td className="min-w-64"><p className="font-medium">{r.title}</p><p className="text-[12.5px] text-muted">{r.purpose}</p></td>
              <td className="text-[13.5px]">{r.category}</td>
              <td><Chip tone={r.tone === "dark" ? "neutral" : r.tone === "playful" ? "info" : "ok"}>{r.tone === "dark" ? "Dark (closure)" : r.tone}</Chip></td>
              <td><Chip tone={r.enabled ? "ok" : "neutral"}>{r.enabled ? "Shown" : "Hidden"}</Chip></td>
              <td className="min-w-56">
                <div className="flex flex-wrap gap-1.5">
                  <a className="btn btn-sm btn-quiet" href={`/for-my-love/letter-demo/${r.slug}`} target="_blank" rel="noopener noreferrer">Play demonstration</a>
                  <Button size="sm" variant={r.enabled ? "quiet" : "accent"} disabled={pending} onClick={() => toggle(r)}>{r.enabled ? "Switch off" : "Switch on"}</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
