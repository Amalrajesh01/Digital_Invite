import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { platformAnalytics } from "@/domain/analytics/service";
import { analyticsByWedding, platformViewsPerDay } from "@/domain/platform/overview";
import { Ledger, PageHeader, Section } from "@/components/ui/Bits";
import { StatusChip } from "@/components/ui/Chip";
import { DayBars, HBars } from "@/components/workspace/Charts";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const admin = await requireAdminPage("/admin/analytics");
  const [stats, perDay, byWedding] = await Promise.all([platformAnalytics(admin), platformViewsPerDay(admin), analyticsByWedding(admin)]);
  const pkgTotal = stats.byPackage.reduce((n, p) => n + p.n, 0);
  return (
    <>
      <PageHeader eyebrow="Insight" title="Analytics" lede="Across every wedding, last 30 days. Visitors are counted by a random per-browser id — no IP addresses, no tracking across sites." />
      <Ledger items={[
        { label: "Views", value: stats.views30.toLocaleString("en-IN"), note: `${stats.visitors30.toLocaleString("en-IN")} visitors` },
        { label: "RSVP replies", value: stats.rsvpReplies.toLocaleString("en-IN"), note: `of ${stats.guests.toLocaleString("en-IN")} guests` },
        { label: "Wishes", value: stats.guestbook.toLocaleString("en-IN") },
        { label: "Guest photos", value: stats.guestUploads.toLocaleString("en-IN") },
        { label: "Check-ins", value: stats.checkins.toLocaleString("en-IN") },
      ]} />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <Section title="Views per day" className="!mt-0"><DayBars data={perDay} label="Invitation views per day across all weddings" /></Section>
        <Section title="Weddings by package" className="!mt-0"><HBars rows={stats.byPackage.map((p) => ({ label: p.pkg.charAt(0) + p.pkg.slice(1).toLowerCase(), value: p.n, note: pkgTotal ? `${Math.round((p.n / pkgTotal) * 100)}%` : undefined }))} /></Section>
      </div>
      <Section title="Each wedding">
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead><tr><th>Wedding</th><th>Status</th><th className="text-right">Views</th><th className="text-right">Visitors</th><th /></tr></thead>
            <tbody>
              {byWedding.map((w) => (
                <tr key={w.weddingId}>
                  <td className="font-medium">{w.title || w.slug}</td>
                  <td><StatusChip status={w.status} /></td>
                  <td className="text-right tnum">{w.views.toLocaleString("en-IN")}</td>
                  <td className="text-right tnum">{w.visitors.toLocaleString("en-IN")}</td>
                  <td className="text-right"><Link className="btn btn-quiet btn-sm" href={`/admin/weddings/${w.weddingId}/analytics`}>Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
