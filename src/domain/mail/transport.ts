import nodemailer, { type Transporter } from "nodemailer";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { env } from "@/lib/env";
import { unseal } from "@/lib/secret-box";

/**
 * The one door every outgoing email goes through. The mail account the owner saved in Settings (SMTP: Gmail, Zoho, any host)
 * wins; if none is saved but RESEND_API_KEY is set, Resend is used; otherwise nothing is sent and the caller is told why.
 * No authorisation here: callers decide who may send what.
 */
export interface Mail {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

export class MailError extends Error {
  constructor(message: string, readonly code: "NOT_CONFIGURED" | "FAILED") {
    super(message);
    this.name = "MailError";
  }
}

export interface SmtpConfig { host: string; port: number; secure: boolean; username: string; password: string; fromName: string; fromEmail: string }

/** The saved mail account with its password decrypted; null when none is saved, or its password can no longer be read (APP_SECRET changed). */
export async function loadSmtp(): Promise<SmtpConfig | null> {
  const db = await getDb();
  const [r] = await db.select().from(schema.emailSettings).where(eq(schema.emailSettings.id, "main"));
  const password = r ? unseal(r.passwordEnc) : null;
  return r && password ? { host: r.host, port: r.port, secure: r.secure, username: r.username, password, fromName: r.fromName, fromEmail: r.fromEmail } : null;
}

export const mailReady = async () => !!(await loadSmtp()) || !!env.resendKey;

const fromHeader = (name: string, email: string) => (name.trim() ? `"${name.replace(/["\\\r\n]/g, "")}" <${email}>` : email);

/** Turns what a mail server says into something the owner can act on. */
export function explainMailError(e: unknown, cfg: { host: string; port: number }): string {
  const err = e as { code?: string; message?: string };
  const gmail = /gmail|google/i.test(cfg.host);
  switch (err.code) {
    case "EAUTH":
      return `The mail server did not accept the username or password.${gmail ? " For Gmail, use a 16-letter App password (Google Account → Security → App passwords), not your normal password." : ""}`;
    case "ECONNECTION": case "ESOCKET": case "ETIMEDOUT": case "EDNS": case "ECONNREFUSED":
      return `Could not connect to ${cfg.host}:${cfg.port}. Check the server name and the port, and that SSL matches the port (465 = SSL on, 587 = SSL off).`;
    case "EENVELOPE":
      return "The mail server refused one of the email addresses.";
    default:
      return `The mail server could not send the message. ${String(err.message ?? "").slice(0, 160)}`.trim();
  }
}

export async function sendMail(m: Mail, o: { transport?: Transporter } = {}): Promise<{ via: "smtp" | "resend" }> {
  const smtp = await loadSmtp();
  if (smtp) {
    // port 465 = SSL from the first byte; anything else must upgrade with STARTTLS before the password is sent
    const t = o.transport ?? nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, requireTLS: !smtp.secure, auth: { user: smtp.username, pass: smtp.password }, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 60000 });
    try {
      await t.sendMail({ from: fromHeader(smtp.fromName, smtp.fromEmail), to: m.to, subject: m.subject, text: m.text, html: m.html, attachments: m.attachments });
    } catch (e) {
      throw new MailError(explainMailError(e, smtp), "FAILED");
    }
    return { via: "smtp" };
  }
  if (env.resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: m.to, subject: m.subject, text: m.text, html: m.html, attachments: m.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })) }),
    });
    if (!res.ok) throw new MailError(`The email service refused the message (${res.status}).`, "FAILED");
    return { via: "resend" };
  }
  throw new MailError("Email is not set up yet. Open Settings → Email and add your mail account.", "NOT_CONFIGURED");
}
