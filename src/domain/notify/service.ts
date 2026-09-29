import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { env } from "@/lib/env";
import { brand } from "@/lib/brand";
import { logEvent } from "@/domain/platform/logging";

/**
 * Notifications are modular: business code enqueues a *template key* with variables;
 * copy lives here, delivery lives in `deliver()`. WhatsApp is a channel like any other —
 * today it produces a click-to-send link; a WhatsApp Business API provider can be plugged in later.
 */
export type NotificationTemplate =
  | "client_invitation"
  | "magic_link"
  | "guest_invitation"
  | "rsvp_confirmation"
  | "rsvp_reminder"
  | "rsvp_received"
  | "accommodation_request"
  | "transport_request"
  | "new_wish"
  | "new_guest_upload"
  | "event_update"
  | "checkin_update"
  | "memory_unlocked"
  | "anniversary";

type Vars = Record<string, string | number | undefined>;
const v = (x: string | number | undefined) => String(x ?? "");

const COPY: Record<NotificationTemplate, (x: Vars) => { subject: string; body: string }> = {
  client_invitation: (x) => ({
    subject: `Your invitation dashboard is ready — ${v(x.title)}`,
    body: `Hello ${v(x.name)},\n\nYour ${brand.name} dashboard for ${v(x.title)} is ready. Use the secure link below to sign in and manage your guests and RSVPs.\n\n${v(x.link)}\n\nWarm wishes,\n${brand.name}`,
  }),
  magic_link: (x) => ({
    subject: `Your sign-in link for ${brand.name}`,
    body: `Hello ${v(x.name)},\n\nUse this link to sign in. It works once and expires in 30 minutes.\n\n${v(x.link)}\n\nIf you did not ask for this, you can ignore this message.`,
  }),
  guest_invitation: (x) => ({
    subject: `${v(x.couple)} invite you to their wedding`,
    body: `Dear ${v(x.name)},\n\n${v(x.couple)} would love to celebrate their wedding with you. Open your personal invitation here:\n\n${v(x.link)}\n\nWith love,\n${v(x.couple)}`,
  }),
  rsvp_confirmation: (x) => ({
    subject: `Thank you for your reply — ${v(x.couple)}`,
    body: `Dear ${v(x.name)},\n\nThank you. We have noted your reply (${v(x.status)}). You can update it any time from your invitation:\n\n${v(x.link)}\n\nWith love,\n${v(x.couple)}`,
  }),
  rsvp_reminder: (x) => ({
    subject: `A gentle reminder from ${v(x.couple)}`,
    body: `Dear ${v(x.name)},\n\nWe have not heard back from you yet and would love to know if you can join us${x.deadline ? ` (please reply by ${v(x.deadline)})` : ""}.\n\n${v(x.link)}\n\nWith love,\n${v(x.couple)}`,
  }),
  rsvp_received: (x) => ({
    subject: `${v(x.name)} replied: ${v(x.status)}`,
    body: `${v(x.name)} responded ${v(x.status)}${x.count ? ` for ${v(x.count)} guest(s)` : ""}.`,
  }),
  accommodation_request: (x) => ({ subject: `Stay request from ${v(x.name)}`, body: `${v(x.name)} asked for accommodation (${v(x.rooms)} room(s)).` }),
  transport_request: (x) => ({ subject: `Travel help requested by ${v(x.name)}`, body: `${v(x.name)} asked for transport from ${v(x.pickup)}.` }),
  new_wish: (x) => ({ subject: `A new wish from ${v(x.name)}`, body: `${v(x.name)} left a wish and it is waiting for your approval.` }),
  new_guest_upload: (x) => ({ subject: `New photo from ${v(x.name)}`, body: `${v(x.name)} shared a ${v(x.kind)}. Review it in your dashboard.` }),
  event_update: (x) => ({ subject: `Update: ${v(x.title)}`, body: v(x.body) }),
  checkin_update: (x) => ({ subject: `${v(x.name)} has arrived`, body: `${v(x.name)} checked in (${v(x.seats)} seat(s)).` }),
  memory_unlocked: (x) => ({ subject: `Your time capsule is open — ${v(x.couple)}`, body: `The time capsule is open. Come back and relive the memories:\n\n${v(x.link)}` }),
  anniversary: (x) => ({ subject: `Happy anniversary, ${v(x.couple)}`, body: `One beautiful year together. Relive the memories:\n\n${v(x.link)}` }),
};

export interface EnqueueInput {
  template: NotificationTemplate;
  channel: "EMAIL" | "WHATSAPP" | "INAPP";
  weddingId?: string | null;
  guestId?: string | null;
  userId?: string | null;
  to?: string;
  vars?: Vars;
  link?: string;
  scheduledFor?: Date | null;
  /** Deliver immediately (default). Set false to leave queued for a cron/worker. */
  sendNow?: boolean;
}

export async function enqueue(input: EnqueueInput) {
  const db = await getDb();
  const copy = COPY[input.template](input.vars ?? {});
  const [row] = await db
    .insert(schema.notifications)
    .values({
      weddingId: input.weddingId ?? null,
      guestId: input.guestId ?? null,
      userId: input.userId ?? null,
      channel: input.channel,
      template: input.template,
      toAddress: input.to ?? "",
      subject: copy.subject,
      body: copy.body,
      link: input.link ?? "",
      status: input.channel === "INAPP" ? "SENT" : "QUEUED",
      sentAt: input.channel === "INAPP" ? new Date() : null,
      scheduledFor: input.scheduledFor ?? null,
    })
    .returning();
  if (input.sendNow !== false && input.channel !== "INAPP" && !input.scheduledFor) await deliver(row.id);
  return row;
}

/** WhatsApp click-to-send link (works without any API). */
export function whatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export async function deliver(notificationId: string): Promise<void> {
  const db = await getDb();
  const [n] = await db.select().from(schema.notifications).where(eq(schema.notifications.id, notificationId));
  if (!n || n.status !== "QUEUED") return;
  try {
    if (n.channel === "EMAIL") {
      if (!n.toAddress) {
        await db.update(schema.notifications).set({ status: "SKIPPED", error: "No email address" }).where(eq(schema.notifications.id, n.id));
        return;
      }
      if (!env.resendKey) {
        // No provider configured (development / free-tier validation): keep it in the outbox.
        await db.update(schema.notifications).set({ status: "SKIPPED", error: "No email provider configured — see Notifications outbox" }).where(eq(schema.notifications.id, n.id));
        return;
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.emailFrom, to: [n.toAddress], subject: n.subject, text: n.body }),
      });
      if (!res.ok) throw new Error(`Email provider responded ${res.status}`);
      await db.update(schema.notifications).set({ status: "SENT", sentAt: new Date(), error: null }).where(eq(schema.notifications.id, n.id));
    } else if (n.channel === "WHATSAPP") {
      // Click-to-send: nothing to deliver server-side; the dashboard shows the link.
      await db.update(schema.notifications).set({ status: "SKIPPED", error: "Awaiting manual send (WhatsApp link)" }).where(eq(schema.notifications.id, n.id));
    }
  } catch (e) {
    await db.update(schema.notifications).set({ status: "FAILED", error: e instanceof Error ? e.message : "Delivery failed" }).where(eq(schema.notifications.id, n.id));
    await logEvent("WARN", "email", `Notification ${n.template} failed`, { weddingId: n.weddingId, metadata: { notificationId: n.id } });
  }
}

/** Retry queued notifications whose schedule has passed (call from a cron endpoint). */
export async function processDue(limit = 50) {
  const db = await getDb();
  const due = await db
    .select({ id: schema.notifications.id, scheduledFor: schema.notifications.scheduledFor })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.status, "QUEUED")))
    .limit(limit);
  let sent = 0;
  for (const d of due) {
    if (d.scheduledFor && d.scheduledFor.getTime() > Date.now()) continue;
    await deliver(d.id);
    sent++;
  }
  return sent;
}

export async function listNotifications(weddingId: string | null, limit = 100) {
  const db = await getDb();
  const q = db.select().from(schema.notifications);
  const rows = weddingId ? await q.where(eq(schema.notifications.weddingId, weddingId)).orderBy(desc(schema.notifications.createdAt)).limit(limit) : await q.orderBy(desc(schema.notifications.createdAt)).limit(limit);
  return rows;
}

export async function listInAppFor(userId: string, limit = 30) {
  const db = await getDb();
  return db
    .select()
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.channel, "INAPP")))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit);
}

export async function unreadCount(userId: string) {
  const db = await getDb();
  const rows = await db
    .select({ id: schema.notifications.id })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.channel, "INAPP"), eq(schema.notifications.status, "SENT"), isNull(schema.notifications.scheduledFor)));
  return rows.length;
}

export async function markAllRead(userId: string) {
  const db = await getDb();
  await db.update(schema.notifications).set({ status: "READ" }).where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.channel, "INAPP"), eq(schema.notifications.status, "SENT")));
}

/** Tell every client user of a wedding (in-app). */
export async function notifyClients(weddingId: string, template: NotificationTemplate, vars: Vars, link = "") {
  const db = await getDb();
  const members = await db.select({ userId: schema.weddingUsers.userId }).from(schema.weddingUsers).where(eq(schema.weddingUsers.weddingId, weddingId));
  for (const m of members) await enqueue({ template, channel: "INAPP", weddingId, userId: m.userId, vars, link });
}
