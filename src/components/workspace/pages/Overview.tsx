import Link from "next/link";
import { ArrowRight, CircleCheck, Circle } from "lucide-react";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { WsCtx } from "@/lib/ws-context";
import { rsvpSummary } from "@/domain/guests/rsvp";
import { canUse } from "@/domain/packages/entitlements";
import { getReadiness } from "@/domain/wedding/service";
import { effectiveStatus, LIFECYCLE_HEADLINE } from "@/domain/wedding/lifecycle";
import { daysBetween, formatDateLong, todayInZone } from "@/lib/time";
import { weddingAnalytics } from "@/domain/analytics/service";
import { Ledger, Section } from "@/components/ui/Bits";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { CopyButton } from "@/components/workspace/CopyButton";

const HEAD: Record<string, string> = { "invite.title.before": "Getting ready", "invite.title.live": "It’s the wedding day", "invite.title.after": "Thank you season", "invite.title.anniversary": "Anniversary time" };

export async function OverviewPage({ ctx }: { ctx: WsCtx }) {
  const { actor, weddingId, wedding, ent, base, role, appUrl } = ctx;
  const db = await getDb();
  const eff = effectiveStatus(wedding);
  const today = todayInZone(wedding.timezone);
  const days = wedding.weddingDate ? daysBetween(today, wedding.weddingDate) : null;
  const summary = canUse(ent, "rsvp_dashboard") ? await rsvpSummary(actor, weddingId).catch(() => null) : null;
  const analytics = await weddingAnalytics(actor, weddingId, 30).catch(() => null);
  const readiness = wedding.publishedVersionId ? [] : await getReadiness(actor, weddingId).catch(() => []);
  const [{ photos, wishes }] = await db
    .select({
      photos: sql<number>`(select count(*)::int from ${schema.mediaAssets} m where m.wedding_id = ${weddingId} and m.category = 'GUEST_UPLOAD' and m.moderation = 'PENDING')`,
      wishes: sql<number>`(select count(*)::int from ${schema.guestMessages} g where g.wedding_id = ${weddingId} and g.moderation = 'PENDING' and g.kind <> 'PRIVATE')`,
    })
    .from(schema.weddings)
    .where(eq(schema.weddings.id, weddingId));
  const activity = role === "admin" ? await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.weddingId, weddingId)).orderBy(desc(schema.auditLogs.createdAt)).limit(8) : [];
  const [{ pendingStay }] = await db.select({ pendingStay: sql<number>`(select count(*)::int from ${schema.accommodationRequests} a where a.wedding_id = ${weddingId} and a.status = 'REQUESTED') + (select count(*)::int from ${schema.transportRequests} t where t.wedding_id = ${weddingId} and t.status = 'REQUESTED')` }).from(schema.weddings).where(and(eq(schema.weddings.id, weddingId)));
  const url = `${appUrl}/invite/${wedding.slug}`;
  const isLive = !!wedding.publishedVersionId && !["DRAFT", "PREVIEW"].includes(wedding.status);

  const todo: { title: string; detail: string; href: string; done?: boolean }[] = [];
  if (!isLive && role === "admin") {
    for (const i of readiness.filter((x) => x.level === "error").slice(0, 4)) todo.push({ title: i.message, detail: "Needed before publishing", href: `${base}/setup/${i.step ?? "couple"}` });
    if (!readiness.some((x) => x.level === "error")) todo.push({ title: "Everything needed is in place — publish the invitation", detail: "One last look, then it goes live", href: `${base}/setup/publish` });
  }
  if (photos) todo.push({ title: `${photos} guest photo${photos === 1 ? "" : "s"} waiting for approval`, detail: "Guests are eager to see them", href: `${base}/photos` });
  if (wishes) todo.push({ title: `${wishes} wish${wishes === 1 ? "" : "es"} waiting for approval`, detail: "Read and approve", href: `${base}/wishes` });
  if (pendingStay) todo.push({ title: `${pendingStay} stay / travel request${pendingStay === 1 ? "" : "s"} to confirm`, detail: "Guests are waiting to hear", href: `${base}/${canUse(ent, "accommodation") ? "accommodation" : "transport"}` });
  if (summary && summary.pending > 0 && canUse(ent, "rsvp_reminders") && eff === "PUBLISHED") todo.push({ title: `${summary.pending} guest${summary.pending === 1 ? " hasn’t" : "s haven’t"} replied yet`, detail: "Send a gentle reminder", href: `${base}/rsvp` });

  return (
    <div className="space-y-10">
      <section className="grid gap-8 border-b border-rule pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow">{HEAD[LIFECYCLE_HEADLINE[eff]] ?? "Overview"}</p>
          <p className="display mt-2 text-[clamp(28px,3.4vw,40px)]">{wedding.weddingDate ? formatDateLong(wedding.weddingDate) : "Wedding date not set yet"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3"><StatusChip status={eff} />{isLive ? <span className="flex items-center gap-2 text-[14px]"><code className="rounded bg-paper-2 px-2 py-1 text-[13px]">{url.replace(/^https?:\/\//, "")}</code><CopyButton text={url} label="Copy link" /></span> : <span className="text-[14px] text-muted">Not live yet</span>}</div>
        </div>
        {days != null && (
          <div className="text-left md:text-right"><p className="display tnum text-[64px] leading-none">{days < 0 ? Math.abs(days) : days}</p><p className="eyebrow mt-1">{days === 0 ? "today" : days < 0 ? `day${days === -1 ? "" : "s"} since the wedding` : `day${days === 1 ? "" : "s"} to go`}</p></div>
        )}
      </section>

      {(summary || analytics) && (
        <Ledger
          items={[
            ...(summary ? [
              { label: "Guests invited", value: summary.invited, note: `${summary.seatsReserved} seats`, href: `${base}/guests` },
              { label: "Attending", value: summary.headcount, note: `${summary.yes} replies`, href: `${base}/rsvp` },
              { label: "Not replied", value: summary.pending, note: `${summary.maybe} maybe · ${summary.no} declined`, href: `${base}/rsvp` },
            ] : []),
            ...(analytics ? [{ label: "Invitation views", value: analytics.views.toLocaleString("en-IN"), note: `${analytics.visitors.toLocaleString("en-IN")} visitors · 30 days` }] : []),
            ...(summary ? [{ label: "Opened", value: summary.opened, note: `of ${summary.invited} personal links` }] : []),
          ]}
        />
      )}

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <Section title="What needs you" className="!mt-0">
          {todo.length === 0 ? (
            <p className="flex items-center gap-2 py-6 text-[15px] text-ok"><CircleCheck className="size-5" />You’re all caught up.</p>
          ) : (
            <ul className="divide-y divide-rule">
              {todo.map((t, i) => (
                <li key={i}><Link href={t.href} className="group flex items-center gap-4 py-3.5 transition-colors hover:bg-paper-2/60 sm:-mx-3 sm:px-3"><Circle className="size-3.5 shrink-0 fill-warn text-warn" aria-hidden /><span className="min-w-0 flex-1"><span className="block text-[15px] font-medium">{t.title}</span><span className="block text-[13.5px] text-muted">{t.detail}</span></span><ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden /></Link></li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Quick actions" className="!mt-0">
          <div className="grid gap-2.5">
            <LinkButton href={role === "admin" ? `${base}/edit` : `${base}/setup/events`} variant="primary">{role === "admin" ? "Edit the invitation" : "Update event details"}</LinkButton>
            <LinkButton href={`/preview/${weddingId}`} variant="quiet">Preview the draft</LinkButton>
            {canUse(ent, "guest_management") && <LinkButton href={`${base}/guests`} variant="quiet">Manage guests</LinkButton>}
            {canUse(ent, "whatsapp_share") && <LinkButton href={`${base}/share`} variant="quiet">Share the invitation</LinkButton>}
            {role === "admin" && <LinkButton href={`${base}/setup/publish`} variant="quiet">Publish & versions</LinkButton>}
          </div>
        </Section>
      </div>

      {role === "admin" && activity.length > 0 && (
        <Section title="Recent activity">
          <ul className="divide-y divide-rule text-[14px]">
            {activity.map((l) => (<li key={l.id} className="flex items-baseline justify-between gap-4 py-2.5"><span className="truncate"><span className="text-ink-2">{l.actorLabel}</span> · {l.action.replace(/[._]/g, " ")}</span><time className="shrink-0 text-[12.5px] text-muted tnum">{l.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</time></li>))}
          </ul>
        </Section>
      )}
    </div>
  );
}
