import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { mediaByWedding } from "@/domain/platform/overview";
import { EmptyState, Ledger, PageHeader } from "@/components/ui/Bits";
import { Chip } from "@/components/ui/Chip";
import { storageLabel } from "@/lib/format-bytes";

export const metadata: Metadata = { title: "Media library" };
export const dynamic = "force-dynamic";

export default async function MediaOverview() {
  const admin = await requireAdminPage("/admin/media");
  const rows = await mediaByWedding(admin);
  const total = rows.reduce((n, r) => n + r.bytes, 0);
  const files = rows.reduce((n, r) => n + r.files, 0);
  const pending = rows.reduce((n, r) => n + r.pending, 0);
  return (
    <>
      <PageHeader eyebrow="Design library" title="Media library" lede="Every wedding keeps its own library. Open one to upload, crop, organise albums and review guest photos. This page shows where the storage is going." />
      <Ledger items={[
        { label: "Files", value: files.toLocaleString("en-IN") },
        { label: "Storage used", value: storageLabel(total) },
        { label: "Waiting for review", value: pending, note: pending ? "guest uploads" : "all reviewed" },
        { label: "Kept forever", value: rows.reduce((n, r) => n + r.permanent, 0), note: "memory archive" },
      ]} className="mb-8" />
      {rows.length === 0 ? <EmptyState title="No weddings yet" /> : (
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead><tr><th>Wedding</th><th className="text-right">Photos</th><th className="text-right">Videos</th><th className="text-right">Audio</th><th className="text-right">Guest uploads</th><th className="text-right">Storage</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.weddingId}>
                  <td><Link href={`/admin/weddings/${r.weddingId}/gallery`} className="font-medium hover:underline">{r.title || r.slug}</Link></td>
                  <td className="text-right tnum">{r.images}</td>
                  <td className="text-right tnum">{r.videos}</td>
                  <td className="text-right tnum">{r.audio}</td>
                  <td className="text-right tnum">{r.guestUploads}{r.pending > 0 && <Chip tone="warn" className="ml-2">{r.pending} waiting</Chip>}</td>
                  <td className="text-right tnum">{storageLabel(r.bytes)}</td>
                  <td className="text-right"><Link className="btn btn-quiet btn-sm" href={r.pending ? `/admin/weddings/${r.weddingId}/photos` : `/admin/weddings/${r.weddingId}/gallery`}>{r.pending ? "Review" : "Open"}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
