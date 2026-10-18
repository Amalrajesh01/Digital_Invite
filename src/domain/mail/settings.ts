import type { Transporter } from "nodemailer";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db/client";
import { type Actor, requireAdmin } from "@/domain/auth/access";
import { audit } from "@/domain/audit/audit";
import { brand } from "@/lib/brand";
import { env } from "@/lib/env";
import { invalid } from "@/lib/errors";
import { seal, unseal } from "@/lib/secret-box";
import { MailError, sendMail } from "./transport";

/** Settings → Email: the one mail account the platform sends from. Owner-only; the password never leaves the server. */
export interface EmailSettingsView {
  saved: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  hasPassword: boolean;
  fromName: string;
  fromEmail: string;
  lastTestAt: Date | null;
  lastTestStatus: "OK" | "ERROR" | null;
  lastTestMessage: string;
  /** No account saved, but RESEND_API_KEY is set, so email still goes out through Resend. */
  usingResend: boolean;
}

export async function getEmailSettings(actor: Actor | null): Promise<EmailSettingsView> {
  requireAdmin(actor);
  const db = await getDb();
  const [r] = await db.select().from(schema.emailSettings).where(eq(schema.emailSettings.id, "main"));
  return {
    saved: !!r, host: r?.host ?? "", port: r?.port ?? 465, secure: r?.secure ?? true, username: r?.username ?? "", hasPassword: !!r && !!unseal(r.passwordEnc),
    fromName: r?.fromName ?? "", fromEmail: r?.fromEmail ?? "", lastTestAt: r?.lastTestAt ?? null, lastTestStatus: r?.lastTestStatus ?? null, lastTestMessage: r?.lastTestMessage ?? "",
    usingResend: !r && !!env.resendKey,
  };
}

const Input = z.object({
  host: z.string().trim().min(1, "Type the mail server, for example smtp.gmail.com").max(253).regex(/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i, "That does not look like a server name. Use only the name, for example smtp.gmail.com"),
  port: z.number().int().min(1, "Port is a number such as 465 or 587").max(65535, "Port is a number such as 465 or 587"),
  secure: z.boolean(),
  username: z.string().trim().min(1, "Type the account's email address").max(254),
  password: z.string().max(200).optional(),
  fromName: z.string().trim().max(80),
  fromEmail: z.string().trim().email("Type a valid email address to send from"),
});
export type EmailSettingsInput = z.input<typeof Input>;

export async function saveEmailSettings(actor: Actor | null, input: EmailSettingsInput) {
  const admin = requireAdmin(actor);
  const p = Input.safeParse(input);
  if (!p.success) { const i = p.error.issues[0]; throw invalid(i.message, { [String(i.path[0] ?? "form")]: i.message }); }
  const v = p.data;
  const db = await getDb();
  const [old] = await db.select().from(schema.emailSettings).where(eq(schema.emailSettings.id, "main"));
  const typed = (v.password ?? "").replace(/\s+/g, ""); // Google shows app passwords in groups of four; the spaces are not part of it
  const keep = !typed && old && unseal(old.passwordEnc) ? old.passwordEnc : null;
  if (!typed && !keep) throw invalid("Type the account's password. For Gmail this is an App password.", { password: "Required" });
  const row = { host: v.host.toLowerCase(), port: v.port, secure: v.secure, username: v.username, passwordEnc: typed ? seal(typed) : keep!, fromName: v.fromName, fromEmail: v.fromEmail, lastTestAt: null, lastTestStatus: null, lastTestMessage: "", updatedAt: new Date() };
  await db.insert(schema.emailSettings).values({ id: "main", ...row }).onConflictDoUpdate({ target: schema.emailSettings.id, set: row });
  await audit(admin, "email.settings_saved", { entityType: "email_settings", entityId: "main", metadata: { host: row.host, port: row.port, passwordChanged: !!typed } });
}

const ADDRESS = z.string().trim().email();

/** Sends a short message to prove the saved account works, and remembers how it went. Never throws for a mail problem: the outcome is the return value. */
export async function sendTestEmail(actor: Actor | null, to: string, o: { transport?: Transporter } = {}): Promise<{ ok: boolean; message: string }> {
  const admin = requireAdmin(actor);
  const a = ADDRESS.safeParse(to);
  if (!a.success) throw invalid("Type the email address to send the test to.", { to: "Not a valid email address" });
  let out: { ok: boolean; message: string };
  try {
    await sendMail({ to: [a.data], subject: `Test email from ${brand.name}`, text: `This is a test from ${brand.name}.\n\nIf you can read it, email is set up correctly: invitation reports and sign-in links will arrive like this one.` }, o);
    out = { ok: true, message: `A test email was sent to ${a.data}. Check that inbox (and the spam folder).` };
  } catch (e) {
    out = { ok: false, message: e instanceof MailError ? e.message : "Something went wrong while sending the test email." };
  }
  const db = await getDb();
  await db.update(schema.emailSettings).set({ lastTestAt: new Date(), lastTestStatus: out.ok ? "OK" : "ERROR", lastTestMessage: out.message }).where(eq(schema.emailSettings.id, "main"));
  await audit(admin, "email.test", { entityType: "email_settings", entityId: "main", metadata: { ok: out.ok } });
  return out;
}
