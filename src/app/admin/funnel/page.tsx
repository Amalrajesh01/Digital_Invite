import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/session";
import { funnelReport } from "@/domain/growth/service";
import { EmptyState, Ledger, PageHeader } from "@/components/ui/Bits";

export const metadata: Metadata = { title: "Funnel" };
export const dynamic = "force-dynamic";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const pct = (n: number | null) => (n == null ? "—" : `${n}%`);

/** Where visitors to the public site drop out, and what it earns. Counts only — see docs/CONVERSION.md for how to read it. */
export default async function FunnelPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const admin = await requireAdminPage("/admin/funnel");
  const q = await searchParams;
  const days = [7, 30, 90].includes(Number(q.days)) ? Number(q.days) : 30;
  const r = await funnelReport(admin, days);
  const max = Math.max(1, ...r.daily.map((d) => d.visitors));
  const top = r.stages[0]?.count || 1;
  return (
    <>
      <PageHeader eyebrow="Insight" title="Funnel" lede={`How visitors to the public site move towards an order, over the last ${days} days. Counts only — nothing here is estimated.`}
        actions={<div className="flex gap-2">{[7, 30, 90].map((d) => (<Link key={d} href={`/admin/funnel?days=${d}`} className={`btn btn-sm ${d === days ? "btn-primary" : "btn-quiet"}`}>{d} days</Link>))}</div>} />
      {!r.hasData ? (
        <EmptyState title="No visits recorded yet" body="Once people use the public site, their journey appears here. Counting is anonymous: a random id, the page and what was tapped — never a name, number or address." />
      ) : (
        <>
          <Ledger className="mb-8" items={[
            { label: "Visitors", value: r.stages[0].count },
            { label: "Enquiries & gifts", value: r.stages[4].count, note: `${pct(r.stages[4].ofVisitors)} of visitors` },
            { label: "Paid orders", value: r.paid, note: `${pct(r.stages[5].ofVisitors)} of visitors` },
            { label: "Received", value: inr(r.revenueInr) },
          ]} />
          <section aria-labelledby="stages" className="mb-10">
            <h2 id="stages" className="display mb-4 text-[24px]">The journey</h2>
            <ol className="grid gap-2">
              {r.stages.map((s) => (
                <li key={s.key} className="grid items-center gap-3 sm:grid-cols-[14rem_1fr_9rem]">
                  <span className="text-[14.5px] font-medium">{s.label}</span>
                  <span className="h-6 overflow-hidden rounded bg-paper-2" aria-hidden><span className="block h-full rounded bg-accent/80" style={{ width: `${Math.max(2, (s.count / top) * 100)}%` }} /></span>
                  <span className="tnum text-[14px]"><b>{s.count}</b> <span className="text-muted">· {pct(s.ofPrevious)} of the step before</span></span>
                </li>
              ))}
            </ol>
          </section>
          <div className="grid gap-10 lg:grid-cols-2">
            <section aria-labelledby="designs">
              <h2 id="designs" className="display mb-3 text-[24px]">Which designs draw interest</h2>
              {r.byTemplate.length ? (
                <table className="ledger"><thead><tr><th>Design / occasion</th><th className="text-right">Looked</th><th className="text-right">Opened</th><th className="text-right">Enquiries</th></tr></thead>
                  <tbody>{r.byTemplate.map((t) => (<tr key={t.ref}><td className="font-medium">{t.ref}</td><td className="text-right tnum">{t.views}</td><td className="text-right tnum">{t.previews}</td><td className="text-right tnum">{t.enquiries}</td></tr>))}</tbody></table>
              ) : <p className="text-muted">Nothing yet.</p>}
            </section>
            <section aria-labelledby="sources">
              <h2 id="sources" className="display mb-3 text-[24px]">Where visitors come from</h2>
              {r.bySource.length ? (
                <table className="ledger"><thead><tr><th>Source</th><th className="text-right">Visitors</th><th className="text-right">Enquiries</th></tr></thead>
                  <tbody>{r.bySource.map((t) => (<tr key={t.source}><td className="font-medium">{t.source}</td><td className="text-right tnum">{t.visitors}</td><td className="text-right tnum">{t.enquiries}</td></tr>))}</tbody></table>
              ) : <p className="text-muted">Nothing yet.</p>}
            </section>
          </div>
          <section aria-labelledby="daily" className="mt-10">
            <h2 id="daily" className="display mb-3 text-[24px]">Day by day</h2>
            <div className="flex h-32 items-end gap-1" role="img" aria-label={`Visitors per day over ${days} days`}>
              {r.daily.map((d) => (<div key={d.day} title={`${d.day}: ${d.visitors} visitors, ${d.enquiries} enquiries`} className="flex-1 rounded-t bg-accent/70" style={{ height: `${Math.max(3, (d.visitors / max) * 100)}%` }} />))}
            </div>
            <p className="mt-2 text-[13px] text-muted">Each bar is one day in India (visitors). {r.daily.reduce((n, d) => n + d.enquiries, 0)} enquiries in this period.</p>
          </section>
        </>
      )}
      <p className="mt-10 max-w-3xl text-[13.5px] text-muted">How to read this, how to set a baseline and what to try next: <code>docs/CONVERSION.md</code>. “Paid” counts orders marked paid in Orders, so keep that ledger up to date.</p>
    </>
  );
}
