"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Switch, TextField } from "@/components/ui/Field";
import { CopyButton } from "./CopyButton";
import { saveSheetAction, sendSheetNowAction } from "@/app/actions/sheets";

export interface SheetView {
  configuredOnServer: boolean;
  serviceEmail: string | null;
  eligible: boolean;
  spreadsheetId: string | null;
  enabled: boolean;
  lastSyncAt: string | null;
  lastStatus: "OK" | "ERROR" | null;
  lastMessage: string;
}

const when = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(iso));

/** The Studio's "Daily sheet" tab: give an Essential client a Google Sheet, refreshed at 6 pm India time, instead of a dashboard. */
export function SheetPanel({ weddingId, view }: { weddingId: string; view: SheetView }) {
  const router = useRouter();
  const [link, setLink] = useState(view.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${view.spreadsheetId}` : "");
  const [enabled, setEnabled] = useState(view.spreadsheetId ? view.enabled : true);
  const [pending, start] = useTransition();
  const [sending, send] = useTransition();
  const ready = view.configuredOnServer && view.eligible;

  const save = () => start(async () => {
    const r = await saveSheetAction(weddingId, { link, enabled });
    if (r.ok) { toast.success("Saved"); router.refresh(); } else toast.error(r.error.message);
  });
  const now = () => send(async () => {
    const r = await sendSheetNowAction(weddingId);
    if (r.ok && r.data.ok) toast.success("The sheet is updated. Open it to look.");
    else toast.error(r.ok ? r.data.message : r.error.message);
    router.refresh();
  });

  if (!view.eligible) return <p className="max-w-2xl rounded-lg border border-rule bg-surface p-5 text-[15px] text-ink-2">This invitation has the client dashboard, so it does not use the daily sheet. The sheet is for invitations without a dashboard.</p>;

  return (
    <div className="grid max-w-3xl gap-8">
      {!view.configuredOnServer && (
        <div role="alert" className="rounded-lg border border-warn bg-warn-soft p-5 text-[14.5px]">
          <p className="font-semibold">Google is not connected on this server yet.</p>
          <p className="mt-1">Do the one-time setup in <code>docs/GOOGLE-SHEETS.md</code> (about ten minutes). It ends with adding <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> to the server. After that, the box below shows the address to share each sheet with.</p>
        </div>
      )}

      <ol className="grid gap-3 text-[15px] text-ink-2">
        <li><strong className="text-ink">1.</strong> Create a Google Sheet for this client (sheets.google.com → Blank). Name it after the wedding.</li>
        <li>
          <strong className="text-ink">2.</strong> Click <strong>Share</strong> in the sheet and add this address as an <strong>Editor</strong>:
          {view.serviceEmail ? <span className="mt-2 flex items-center gap-2 rounded-md border border-rule-strong bg-surface px-3 py-2"><code className="min-w-0 flex-1 truncate text-[13.5px]">{view.serviceEmail}</code><CopyButton text={view.serviceEmail} label="Copy" /></span> : <span className="mt-1 block text-muted">(shown here once Google is connected on the server)</span>}
        </li>
        <li><strong className="text-ink">3.</strong> Also share the sheet with your client as <strong>Viewer</strong>, so they can open it but not change it.</li>
        <li><strong className="text-ink">4.</strong> Paste the sheet&apos;s address below, save, and click <strong>Send now</strong> to check it works.</li>
      </ol>

      <div className="grid gap-4">
        <TextField label="Google Sheet link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" hint="Copy it from your browser's address bar while the sheet is open." />
        <Switch label="Update it every day at 6 pm (India time)" hint="The sheet is rewritten with the latest guests, replies and views. You can also send it any time with the button." checked={enabled} onChange={setEnabled} />
        <div className="flex flex-wrap items-center gap-3">
          <Button loading={pending} disabled={!link.trim()} onClick={save}>Save</Button>
          <Button variant="quiet" loading={sending} disabled={!ready || !view.spreadsheetId} onClick={now}>Send now</Button>
          {!view.spreadsheetId && <span className="text-[13px] text-muted">Save the link first.</span>}
        </div>
      </div>

      {view.lastSyncAt && (
        <div className="rounded-lg border border-rule bg-surface p-4 text-[14.5px]">
          <p className="flex items-center gap-2"><Chip tone={view.lastStatus === "OK" ? "ok" : "bad"}>{view.lastStatus === "OK" ? "Updated" : "Did not update"}</Chip><span className="text-muted">{when(view.lastSyncAt)}</span></p>
          <p className="mt-2 text-ink-2">{view.lastMessage}</p>
        </div>
      )}

      <p className="text-[13.5px] text-muted">The sheet has three tabs: <strong>Summary</strong> (who is coming and how many people), <strong>Guests &amp; replies</strong> (every guest, their reply, meal and note) and <strong>Daily views</strong>. Anything typed into those tabs is replaced at the next update, so tell the client to copy data elsewhere before editing. A Google Sheet can be downloaded as Excel from File → Download.</p>
    </div>
  );
}
