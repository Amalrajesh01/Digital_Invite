import { cn } from "@/lib/cn";

/**
 * Single-series, single-hue charts (no categorical palette needed). Thin marks, rounded data-ends
 * anchored to the baseline, recessive grid, direct labels, and a data table for anyone who prefers one.
 */
export function DayBars({ data, label }: { data: { day: string; views: number }[]; label: string }) {
  const days = 30;
  const map = new Map(data.map((d) => [d.day, d.views]));
  const series = Array.from({ length: days }, (_, i) => {
    const dt = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = dt.toISOString().slice(0, 10);
    return { key, label: dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), v: map.get(key) ?? 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.v));
  const W = 720, H = 180, pad = { l: 28, r: 8, t: 12, b: 24 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, bw = iw / days;
  const ticks = [...new Set([0, Math.ceil(max / 2), max])];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: bar chart of daily views over the last ${days} days. Peak ${max}.`} className="w-full">
        {ticks.map((t) => {
          const y = pad.t + ih - (t / max) * ih;
          return (<g key={t}><line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--rule)" strokeWidth="1" /><text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="10.5" fill="var(--muted)">{t}</text></g>);
        })}
        {series.map((s, i) => {
          const h = (s.v / max) * ih;
          return (
            <g key={s.key}>
              <title>{`${s.label}: ${s.v} view${s.v === 1 ? "" : "s"}`}</title>
              {/* generous invisible hit-target, thin visible mark */}
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={ih} fill="transparent" />
              {s.v > 0 && <rect x={pad.l + i * bw + bw * 0.2} y={pad.t + ih - h} width={bw * 0.6} height={h} rx={Math.min(3, bw * 0.3)} fill="var(--accent)" />}
            </g>
          );
        })}
        {[0, 14, 29].map((i) => (<text key={i} x={pad.l + i * bw + bw / 2} y={H - 6} textAnchor={i === 0 ? "start" : i === 29 ? "end" : "middle"} fontSize="10.5" fill="var(--muted)">{series[i].label}</text>))}
      </svg>
      <details className="mt-2 text-[13px] text-muted"><summary className="cursor-pointer underline-offset-4 hover:underline">View as a table</summary>
        <table className="mt-2 w-full max-w-sm"><tbody>{series.filter((s) => s.v > 0).map((s) => (<tr key={s.key} className="border-b border-rule"><td className="py-1">{s.label}</td><td className="text-right tnum">{s.v}</td></tr>))}</tbody></table>
      </details>
    </figure>
  );
}

export function HBars({ rows, unit = "", className }: { rows: { label: string; value: number; note?: string }[]; unit?: string; className?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className={cn("space-y-3", className)}>
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[14px]"><span className="truncate">{r.label}</span><span className="tnum font-medium">{r.value.toLocaleString("en-IN")}{unit}{r.note && <span className="ml-2 text-[12.5px] font-normal text-muted">{r.note}</span>}</span></div>
          <div className="h-2 rounded-full bg-paper-2" role="img" aria-label={`${r.label}: ${r.value}${unit}`}><div className="h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
