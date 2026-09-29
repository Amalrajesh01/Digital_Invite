"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FormCard } from "@/components/admin/forms";
import { changePasswordAction } from "@/app/actions/account";

export function PasswordForm() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <FormCard title="Password" description="Changing your password signs you out everywhere else. Use at least 10 characters with letters and numbers.">
      <form className="grid max-w-xl gap-4" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => { const r = await changePasswordAction(cur || null, next); if (r.ok) { toast.success("Password changed — please sign in again"); window.location.href = "/login"; } else setErr(r.error.message); }); }}>
        <TextField label="Current password (leave blank if you signed in by email link)" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
        <TextField label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={err} />
        <div><Button type="submit" loading={pending} disabled={next.length < 10}>Change password</Button></div>
      </form>
    </FormCard>
  );
}
