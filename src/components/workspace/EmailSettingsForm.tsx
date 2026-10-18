"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Switch, TextField } from "@/components/ui/Field";
import { FormCard, Grid } from "@/components/admin/forms";
import { saveEmailSettingsAction, sendTestEmailAction } from "@/app/actions/mail";

export interface EmailView {
  saved: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  hasPassword: boolean;
  fromName: string;
  fromEmail: string;
  lastTestAt: string | null;
  lastTestStatus: "OK" | "ERROR" | null;
  lastTestMessage: string;
  usingResend: boolean;
}

const when = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(iso));

/** Settings → Email: the mail account the platform sends from, set once. The saved password is never shown again. */
export function EmailSettingsForm({ view, defaultTestTo }: { view: EmailView; defaultTestTo: string }) {
  const router = useRouter();
  const [host, setHost] = useState(view.host);
  const [port, setPort] = useState(String(view.port));
  const [secure, setSecure] = useState(view.secure);
  const [username, setUsername] = useState(view.username);
  const [password, setPassword] = useState("");
  const [fromName, setFromName] = useState(view.fromName);
  const [fromEmail, setFromEmail] = useState(view.fromEmail);
  const [testTo, setTestTo] = useState(defaultTestTo);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, save] = useTransition();
  const [testing, test] = useTransition();

  const gmail = () => { setHost("smtp.gmail.com"); setPort("465"); setSecure(true); };
  const onSave = () => save(async () => {
    setErrors({});
    const r = await saveEmailSettingsAction({ host, port: Number(port), secure, username, password, fromName, fromEmail: fromEmail || username });
    if (r.ok) { toast.success("Email settings saved. Now send a test email."); setPassword(""); router.refresh(); }
    else { setErrors(r.error.fields ?? {}); toast.error(r.error.message); }
  });
  const onTest = () => test(async () => {
    const r = await sendTestEmailAction(testTo);
    if (r.ok && r.data.ok) toast.success(r.data.message); else toast.error(r.ok ? r.data.message : r.error.message);
    router.refresh();
  });

  return (
    <div id="email" className="grid gap-6">
      <FormCard title="Email" description="The mail account that sends the daily reports and the sign-in emails. Set it once. A Gmail account works well.">
        {view.usingResend && <p role="status" className="rounded-md border border-rule bg-paper-2 p-3 text-[14px]">Email currently goes out through Resend (set on the server). Saving an account here replaces it.</p>}
        <details className="rounded-md border border-rule bg-paper-2 p-4 text-[14px]">
          <summary className="cursor-pointer font-medium">How to use a Gmail account</summary>
          <ol className="mt-3 grid gap-2 pl-5 text-ink-2 [list-style:decimal]">
            <li>Open your Google Account → <strong>Security</strong> and turn on <strong>2-Step Verification</strong> (Gmail only gives app passwords after this).</li>
            <li>Open <a className="underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">myaccount.google.com/apppasswords</a>, type a name such as <em>Invites</em>, click <strong>Create</strong>, and copy the 16 letters.</li>
            <li>Click <strong>Use Gmail</strong> below, type your Gmail address as the username and paste the 16 letters as the password.</li>
            <li>Click <strong>Save</strong>, then <strong>Send test email</strong>.</li>
          </ol>
          <p className="mt-3 text-[13px] text-muted">Gmail allows about 500 emails a day. Your normal Google password will not work here, only the app password.</p>
        </details>

        <div><Button variant="quiet" size="sm" onClick={gmail}>Use Gmail</Button></div>
        <Grid>
          <TextField label="Mail server" value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" autoComplete="off" error={errors.host} />
          <TextField label="Port" inputMode="numeric" value={port} onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))} placeholder="465" error={errors.port} hint="465 with SSL on, or 587 with SSL off." />
        </Grid>
        <Switch label="Use SSL" hint="On for port 465 (Gmail). Off for port 587, which switches to a secure connection by itself." checked={secure} onChange={setSecure} />
        <Grid>
          <TextField label="Username (the account's email address)" type="email" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="you@gmail.com" autoComplete="off" error={errors.username} />
          <TextField label={view.hasPassword ? "Password (saved, leave empty to keep it)" : "Password (for Gmail: the app password)"} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder={view.hasPassword ? "••••••••••••••••" : ""} error={errors.password} />
        </Grid>
        <Grid>
          <TextField label="Sender name" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Invites by Stack Bridge Labs" hint="What people see as the sender." error={errors.fromName} />
          <TextField label="Sender email" type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder={username || "you@gmail.com"} hint="Leave empty to use the username. Gmail always sends from the account itself." error={errors.fromEmail} />
        </Grid>
        <div><Button loading={saving} disabled={!host.trim() || !username.trim()} onClick={onSave}>Save</Button></div>
      </FormCard>

      <FormCard title="Send a test email" description="Checks that the saved account really sends. Use your own address first.">
        <div className="flex flex-wrap items-end gap-3">
          <TextField className="min-w-64 flex-1" label="Send the test to" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          <Button variant="quiet" loading={testing} disabled={!view.saved || !testTo.trim()} onClick={onTest}>Send test email</Button>
        </div>
        {!view.saved && <p className="text-[13px] text-muted">Save the account above first.</p>}
        {view.lastTestAt && (
          <div className="rounded-lg border border-rule bg-surface p-4 text-[14.5px]">
            <p className="flex items-center gap-2"><Chip tone={view.lastTestStatus === "OK" ? "ok" : "bad"}>{view.lastTestStatus === "OK" ? "Sent" : "Did not send"}</Chip><span className="text-muted">{when(view.lastTestAt)}</span></p>
            <p className="mt-2 text-ink-2">{view.lastTestMessage}</p>
          </div>
        )}
      </FormCard>
    </div>
  );
}
