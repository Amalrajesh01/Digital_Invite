"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Switch, TextField } from "@/components/ui/Field";
import { saveReportAction, sendReportNowAction } from "@/app/actions/reports";

export interface ReportView {
  eligible: boolean;
  mailReady: boolean;
  recipients: string;
  saved: boolean;
  enabled: boolean;
  lastSentAt: string | null;
  lastStatus: "OK" | "ERROR" | null;
  lastMessage: string;
}

const when = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(iso));

/** The Studio's "Daily report" tab: an invitation without a client dashboard (Essential) emails its owner a PDF at 6 pm India time. */
export function ReportPanel({ weddingId, view }: { weddingId: string; view: ReportView }) {
  const router = useRouter();
  const [recipients, setRecipients] = useState(view.recipients);
  const [enabled, setEnabled] = useState(view.enabled);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [sending, send] = useTransition();

  const save = () => start(async () => {
    setError("");
    const r = await saveReportAction(weddingId, { recipients, enabled });
    if (r.ok) { toast.success("Saved"); router.refresh(); } else { setError(r.error.fields?.recipients ?? r.error.message); toast.error(r.error.message); }
  });
  const now = () => send(async () => {
    setError("");
    const r = await sendReportNowAction(weddingId, { recipients, enabled });
    if (r.ok && r.data.ok) toast.success(r.data.message);
    else { if (!r.ok) setError(r.error.fields?.recipients ?? ""); toast.error(r.ok ? r.data.message : r.error.message); }
    router.refresh();
  });

  if (!view.eligible) return <p className="max-w-2xl rounded-lg border border-rule bg-surface p-5 text-[15px] text-ink-2">This invitation has the client dashboard, so it does not use the daily report. The report is for invitations without a dashboard.</p>;

  return (
    <div className="grid max-w-3xl gap-8">
      {!view.mailReady && (
        <div role="alert" className="rounded-lg border border-warn bg-warn-soft p-5 text-[14.5px]">
          <p className="font-semibold">Email is not set up yet.</p>
          <p className="mt-1">Add your mail account once in <Link className="underline" href="/admin/settings#email">Settings → Email</Link>. Then come back here and send the report.</p>
        </div>
      )}

      <p className="text-[15px] text-ink-2">The owner gets an email with a PDF report every day at <strong className="text-ink">6 pm India time</strong>: who replied in the last 24 hours, how many are coming, views of the invitation, and every guest with their reply.</p>

      <div className="grid gap-4">
        <TextField label="Send the report to" type="text" value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="owner@example.com" error={error} hint="The owner's email address. To send to more than one person, separate them with commas (up to 5)." />
        <Switch label="Email it every day at 6 pm (India time)" hint="Switch off to stop the daily email. You can still send it yourself with the button." checked={enabled} onChange={setEnabled} />
        <div className="flex flex-wrap items-center gap-3">
          <Button loading={pending} disabled={!recipients.trim()} onClick={save}>Save</Button>
          <Button variant="quiet" loading={sending} disabled={!view.mailReady || !recipients.trim()} onClick={now}>Send now</Button>
          <a className="btn btn-quiet" href={`/api/reports/${weddingId}`}>Download PDF</a>
        </div>
      </div>

      {view.lastSentAt && (
        <div className="rounded-lg border border-rule bg-surface p-4 text-[14.5px]">
          <p className="flex items-center gap-2"><Chip tone={view.lastStatus === "OK" ? "ok" : "bad"}>{view.lastStatus === "OK" ? "Sent" : "Did not send"}</Chip><span className="text-muted">{when(view.lastSentAt)}</span></p>
          <p className="mt-2 text-ink-2">{view.lastMessage}</p>
        </div>
      )}

      <p className="text-[13.5px] text-muted">Guests&apos; phone numbers and email addresses are not in the report. Anyone who receives the email can forward the PDF, so send it only to the owner. <strong>Send now</strong> saves what is on this page first.</p>
    </div>
  );
}
