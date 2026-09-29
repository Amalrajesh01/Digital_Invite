import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { requireAdminPage } from "@/lib/session";
import { searchGuestsAcrossWeddings } from "@/domain/platform/overview";
import { EmptyState, PageHeader } from "@/components/ui/Bits";
import { Chip, RsvpChip } from "@/components/ui/Chip";

export const metadata: Metadata = { title: "Guests" };
export const dynamic = "force-dynamic";

const INVITE = { NOT_SENT: "Not sent", SENT: "Sent", OPENED: "Opened", RESPONDED: "Replied" } as const;

export default async function GuestsOverview({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdminPage("/admin/guests");
  const { q = "" } = await searchParams;
  const { rows, total } = await searchGuestsAcrossWeddings(admin, q);
  return (
    <>
      <PageHeader eyebrow="Insight" title="Guests" lede={`Find anyone across every wedding — ${total.toLocaleString("en-IN")} guests in total. To manage a guest list, open the wedding.`} />
      <form role="search" className="relative mb-5 max-w-md">
        <label className="sr-only" htmlFor="gq">Search guests</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input id="gq" name="q" defaultValue={q} placeholder="Name, phone or email…" className="field-input !pl-9" />
      </form>
      {rows.length === 0 ? (
        <EmptyState title={q ? "Nobody found" : "No guests yet"} body={q ? "Try a shorter name or part of the phone number." : "Guest lists are created inside each wedding."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead><tr><th>Guest</th><th>Wedding</th><th>Invitation</th><th>RSVP</th></tr></thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td><p className="font-medium">{g.name}</p><p className="text-[12.5px] text-muted">{[g.phone, g.email].filter(Boolean).join(" · ") || "No contact"}</p></td>
                  <td><Link className="underline-offset-4 hover:underline" href={`/admin/weddings/${g.weddingId}/guests`}>{g.weddingTitle || "Untitled"}</Link></td>
                  <td><Chip tone={g.invitationStatus === "NOT_SENT" ? "neutral" : "info"}>{INVITE[g.invitationStatus]}</Chip></td>
                  <td><RsvpChip status={g.rsvp} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length >= 100 && <p className="mt-4 text-[13.5px] text-muted">Showing the first 100 matches — narrow the search to see others.</p>}
        </div>
      )}
    </>
  );
}
