import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listNotifications } from "@/domain/notify/service";
import { EmptyState, Ledger, PageHeader } from "@/components/ui/Bits";
import { Chip, type Tone } from "@/components/ui/Chip";
import { env } from "@/lib/env";
import { QueueButton } from "./QueueButton";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const TONE: Record<string, Tone> = { QUEUED: "info", SENT: "ok", FAILED: "bad", SKIPPED: "neutral", READ: "neutral" };

export default async function NotificationsPage() {
  await requireAdminPage("/admin/notifications");
  const rows = (await listNotifications(null, 200)).filter((n) => n.channel !== "INAPP");
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  return (
    <>
      <PageHeader eyebrow="System" title="Notifications" lede="Every email and WhatsApp message the platform has prepared. WhatsApp messages open in your own WhatsApp — the app never sends from a number you did not choose." actions={<QueueButton queued={count("QUEUED")} />} />
      {!env.resendKey && <p role="status" className="mb-6 rounded-md bg-brass-soft px-4 py-3 text-[14px] text-[#6b5313]">No email provider is connected (RESEND_API_KEY is empty), so emails are recorded here as skipped instead of being delivered. Add the key and they will send.</p>}
      <Ledger items={[{ label: "Sent", value: count("SENT") }, { label: "Waiting", value: count("QUEUED") }, { label: "Failed", value: count("FAILED") }, { label: "Skipped", value: count("SKIPPED") }]} className="mb-8" />
      {rows.length === 0 ? <EmptyState title="Nothing sent yet" body="Invitation emails, reminders and client access links will appear here." /> : (
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead><tr><th>When</th><th>To</th><th>What</th><th>Channel</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id}>
                  <td className="whitespace-nowrap text-[13.5px] tnum">{n.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</td>
                  <td className="text-[13.5px]">{n.toAddress || "—"}</td>
                  <td><p className="text-[14px]">{n.subject || n.template.replace(/_/g, " ")}</p>{n.error && <p className="text-[12.5px] text-bad">{n.error}</p>}</td>
                  <td className="text-[13.5px]">{n.channel === "EMAIL" ? "Email" : "WhatsApp"}</td>
                  <td><Chip tone={TONE[n.status] ?? "neutral"}>{n.status.charAt(0) + n.status.slice(1).toLowerCase()}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
