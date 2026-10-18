import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { requireAdminPage } from "@/lib/session";
import { searchGuestsAcrossWeddings, weddingChoices, type GuestReply } from "@/domain/platform/overview";
import { EmptyState, Ledger, PageHeader } from "@/components/ui/Bits";
import { Chip, RsvpChip } from "@/components/ui/Chip";

export const metadata: Metadata = { title: "Guests" };
export const dynamic = "force-dynamic";

const INVITE = { NOT_SENT: "Not sent", SENT: "Sent", OPENED: "Opened", RESPONDED: "Replied" } as const;
const REPLIES: { value: GuestReply; label: string }[] = [{ value: "YES", label: "Coming (Yes)" }, { value: "MAYBE", label: "Maybe" }, { value: "NO", label: "Not coming (No)" }, { value: "NONE", label: "Not replied yet" }];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GuestsOverview({ searchParams }: { searchParams: Promise<{ q?: string; wedding?: string; reply?: string }> }) {
  const admin = await requireAdminPage("/admin/guests");
  const { q = "", wedding = "", reply = "" } = await searchParams;
  const weddingId = UUID.test(wedding) ? wedding : undefined;
  const replyFilter = REPLIES.find((r) => r.value === reply)?.value;
  const [{ rows, total, matching, summary }, weddings] = await Promise.all([searchGuestsAcrossWeddings(admin, q, { weddingId, reply: replyFilter }), weddingChoices(admin)]);
  const filtered = !!(q || weddingId || replyFilter);
  const chosen = weddings.find((w) => w.id === weddingId);
  return (
    <>
      <PageHeader eyebrow="Insight" title="Guests" lede={`Find anyone across every wedding, or choose one wedding to see only its guests. ${total.toLocaleString("en-IN")} guests in total. To manage a guest list, open the wedding.`} />
      <form role="search" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.4fr_1fr_auto]">
        <div className="relative">
          <label className="sr-only" htmlFor="gq">Search guests</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input id="gq" name="q" defaultValue={q} placeholder="Name, phone or email…" className="field-input !pl-9" />
        </div>
        <div>
          <label className="sr-only" htmlFor="gw">Wedding</label>
          <select id="gw" name="wedding" defaultValue={weddingId ?? ""} className="field-input w-full"><option value="">All weddings</option>{weddings.map((w) => (<option key={w.id} value={w.id}>{w.title || w.slug}</option>))}</select>
        </div>
        <div>
          <label className="sr-only" htmlFor="gr">Reply</label>
          <select id="gr" name="reply" defaultValue={replyFilter ?? ""} className="field-input w-full"><option value="">Any reply</option>{REPLIES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}</select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">Filter</button>
          {filtered && <Link href="/admin/guests" className="btn btn-quiet">Clear</Link>}
        </div>
      </form>
      <Ledger className="mb-6" items={[
        { label: "Coming", value: summary.YES, note: `${summary.headcount} ${summary.headcount === 1 ? "person" : "people"}` },
        { label: "Maybe", value: summary.MAYBE },
        { label: "Not coming", value: summary.NO },
        { label: "Not replied", value: summary.NONE, note: chosen ? `for ${chosen.title || chosen.slug}` : "across the weddings shown" },
      ]} />
      {rows.length === 0 ? (
        <EmptyState title={filtered ? "Nobody matches" : "No guests yet"} body={filtered ? "Change the wedding, the reply or the search. Guests who reply through an open link appear here with their name." : "Guest lists are created inside each wedding."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead><tr><th>Guest</th><th>Wedding</th><th>Invitation</th><th>RSVP</th></tr></thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td><p className="font-medium">{g.name}</p><p className="text-[12.5px] text-muted">{[g.phone, g.email].filter(Boolean).join(" · ") || "No contact"}</p></td>
                  <td><Link className="underline-offset-4 hover:underline" href={`/admin/guests?wedding=${g.weddingId}`}>{g.weddingTitle || "Untitled"}</Link></td>
                  <td><Chip tone={g.invitationStatus === "NOT_SENT" ? "neutral" : "info"}>{INVITE[g.invitationStatus]}</Chip></td>
                  <td><RsvpChip status={g.rsvp} />{g.rsvp === "YES" && g.attending ? <span className="ml-2 text-[12.5px] text-muted">{g.attending} {g.attending === 1 ? "person" : "people"}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[13.5px] text-muted">{rows.length < matching ? `Showing the first ${rows.length} of ${matching.toLocaleString("en-IN")} — narrow the filter to see others.` : `${matching.toLocaleString("en-IN")} ${matching === 1 ? "guest" : "guests"}.`}</p>
        </div>
      )}
    </>
  );
}
