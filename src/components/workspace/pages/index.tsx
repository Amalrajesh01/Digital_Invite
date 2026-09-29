import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { WsCtx } from "@/lib/ws-context";
import { WORKSPACE } from "@/lib/workspace";
import { canUse } from "@/domain/packages/entitlements";
import { FEATURES, type FeatureKey } from "@/domain/packages/features";
import { listGuests, listGroups } from "@/domain/guests/service";
import { listAccommodation, listTransport, rsvpSummary } from "@/domain/guests/rsvp";
import { weddingAnalytics } from "@/domain/analytics/service";
import { getMemoryBook } from "@/domain/memory/service";
import { listInAppFor, listNotifications, markAllRead } from "@/domain/notify/service";
import { leaderboard } from "@/domain/games/service";
import { InvitationDoc } from "@/domain/doc/schema";
import { EmptyState, Ledger, PageHeader, Section } from "@/components/ui/Bits";
import { LinkButton } from "@/components/ui/Button";
import { RsvpChip } from "@/components/ui/Chip";
import { GuestManager } from "@/components/workspace/GuestManager";
import { RemindersPanel, RequestsTable, SharePanel, CheckinConsole, LiveConsole } from "@/components/workspace/Panels";
import { InboxBoard, MediaWishesBoard, MessagesBoard, UploadsBoard } from "@/components/workspace/Boards";
import { GalleryManager } from "@/components/workspace/GalleryManager";
import { DocScope } from "@/components/workspace/DocScope";
import { GamesSetup } from "@/components/workspace/GamesSetup";
import { AnniversaryEditor, CapsulePanel, MemoryEditor, SettingsForm, VersionsPanel } from "@/components/workspace/Editors";
import { DayBars, HBars } from "@/components/workspace/Charts";
import { PasswordForm } from "@/components/workspace/PasswordForm";
import { OverviewPage } from "./Overview";
import { sortEvents } from "@/domain/wedding/view";
import { tx } from "@/domain/doc/schema";

function Locked({ feature, ctx }: { feature: FeatureKey; ctx: WsCtx }) {
  const f = FEATURES[feature];
  const tier = f.tier.charAt(0) + f.tier.slice(1).toLowerCase();
  return (
    <div className="mx-auto max-w-lg py-14 text-center">
      <Lock className="mx-auto size-8 text-brass" aria-hidden />
      <h2 className="display mt-4 text-[32px]">{f.label} is part of {tier}</h2>
      <p className="mt-2 text-muted">{f.description}</p>
      <p className="mt-6 text-[14.5px] text-ink-2">{ctx.role === "admin" ? "You can move this wedding to a higher package, or grant just this feature as a favour." : "Ask your invitation designer about upgrading to unlock it."}</p>
      {ctx.role === "admin" && <div className="mt-5 flex flex-wrap justify-center gap-3"><LinkButton href={`${ctx.base}/setup/package`} variant="quiet">Change package</LinkButton><LinkButton href={`${ctx.base}/setup/features`} variant="quiet">Grant this feature</LinkButton></div>}
    </div>
  );
}

function docScopeProps(ctx: WsCtx, doc: InvitationDoc, groups: { key: string; name: string }[]) {
  const w = ctx.wedding;
  return {
    weddingId: ctx.weddingId, role: ctx.role, doc, features: ctx.ent.features, groups,
    settings: { title: w.title, slug: w.slug, weddingDate: w.weddingDate, timezone: w.timezone, defaultLocale: w.defaultLocale, secondaryLocale: w.secondaryLocale, accessMode: w.accessMode, autoLifecycle: w.autoLifecycle, contactEmail: w.contactEmail, contactPhone: w.contactPhone, templateId: w.templateId, themeId: w.themeId, themeOverrides: w.themeOverrides, packageKey: w.packageKey, customerClass: w.customerClass },
  } as const;
}

async function groupList(weddingId: string) {
  const db = await getDb();
  return (await db.select().from(schema.guestGroups).where(eq(schema.guestGroups.weddingId, weddingId)).orderBy(asc(schema.guestGroups.sortOrder))).map((g) => ({ key: g.key, name: g.name }));
}

export async function renderWorkspace(section: string, ctx: WsCtx): Promise<React.ReactNode> {
  const item = WORKSPACE.find((i) => i.slug === section);
  const title = item?.label ?? (section === "versions" ? "Versions" : section === "notifications" ? "Notifications" : "");
  const desc = item?.desc ?? (section === "versions" ? "Publish history, checkpoints and rollback" : section === "notifications" ? "What happened on your invitation" : "");
  const gate = item?.feature && !canUse(ctx.ent, item.feature) ? item.feature : null;
  const head = <PageHeader eyebrow={ctx.wedding.title || ctx.slug} title={title} lede={desc} />;
  if (gate) return <>{head}<Locked feature={gate} ctx={ctx} /></>;
  const { actor, weddingId, ent, base } = ctx;
  const secondary = ctx.wedding.secondaryLocale;
  const db = await getDb();
  const doc = InvitationDoc.parse(ctx.wedding.draftDoc);

  switch (section) {
    case "": return <OverviewPage ctx={ctx} />;

    case "guests": {
      const [guests, groups] = await Promise.all([listGuests(actor, weddingId), listGroups(actor, weddingId)]);
      return (
        <>
          {head}
          <GuestManager weddingId={weddingId} slug={ctx.slug} base={ctx.appUrl} secondary={secondary} canRemind={canUse(ent, "rsvp_reminders")} canShare={canUse(ent, "personalized_urls")} groups={groups.map((g) => ({ id: g.id, name: g.name, key: g.key, count: g.count }))}
            initial={guests.map((g) => ({ id: g.id, name: g.name, phone: g.phone, email: g.email, seats: g.seats, relationship: g.relationship, notes: g.notes, invitationStatus: g.invitationStatus, preferredLocale: g.preferredLocale, customGreeting: g.customGreeting, groupId: g.group?.id ?? null, groupName: g.group?.name ?? null, token: g.token, checkedIn: g.checkedIn, accommodation: g.accommodation, transport: g.transport, rsvp: g.rsvp ? { status: g.rsvp.status, attendingCount: g.rsvp.attendingCount, meal: g.rsvp.meal, note: g.rsvp.note, respondedAt: g.rsvp.respondedAt.toISOString() } : null, lastOpenedAt: g.lastOpenedAt?.toISOString() ?? null, openCount: g.openCount, reminderCount: g.reminderCount }))} />
        </>
      );
    }

    case "rsvp": {
      const [s, guests] = await Promise.all([rsvpSummary(actor, weddingId), listGuests(actor, weddingId).catch(() => [])]);
      const replied = guests.filter((g) => g.rsvp).sort((a, b) => +b.rsvp!.respondedAt - +a.rsvp!.respondedAt);
      return (
        <>
          {head}
          <Ledger items={[{ label: "Attending", value: s.headcount, note: `${s.yes} repl${s.yes === 1 ? "y" : "ies"}` }, { label: "Maybe", value: s.maybe }, { label: "Declined", value: s.no }, { label: "Not replied", value: s.pending, note: `of ${s.invited} invited` }, { label: "Need a stay", value: s.needStay, note: `${s.needRide} need a ride` }]} />
          <div className="mt-8 flex flex-wrap items-center gap-3"><RemindersPanel weddingId={weddingId} pending={s.pending} secondary={secondary} /><a className="btn btn-quiet" href={`/api/export/rsvp?weddingId=${weddingId}`}>Download as spreadsheet</a>{s.deadline && <span className="text-[14px] text-muted">Reply-by date: {new Date(s.deadline + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "UTC" })}</span>}</div>
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <Section title="By group" className="!mt-0"><HBars rows={s.byGroup.filter((g) => g.invited).map((g) => ({ label: g.name, value: g.headcount, note: `${g.yes}/${g.invited} replied yes` }))} unit=" attending" /></Section>
            <Section title="Meal choices" className="!mt-0">{s.meals.length ? <HBars rows={s.meals.map((m) => ({ label: m.label, value: m.count }))} /> : <p className="py-4 text-muted">No meal choices yet.</p>}</Section>
          </div>
          <Section title="Replies" aside={`${replied.length} of ${guests.length}`}>
            {replied.length === 0 ? <EmptyState title="No replies yet" body="Replies appear here the moment guests send them." /> : (
              <div className="overflow-x-auto"><table className="ledger"><thead><tr><th>Guest</th><th>Reply</th><th className="text-center">Coming</th><th>Note</th><th>When</th></tr></thead><tbody>{replied.map((g) => (<tr key={g.id}><td className="font-medium">{g.name}<span className="block text-[12.5px] font-normal text-muted">{g.group?.name}</span></td><td><RsvpChip status={g.rsvp!.status} /></td><td className="text-center tnum">{g.rsvp!.attendingCount}/{g.seats}</td><td className="max-w-xs truncate text-[14px] text-muted">{g.rsvp!.note || "—"}</td><td className="whitespace-nowrap text-[13px] text-muted">{g.rsvp!.respondedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td></tr>))}</tbody></table></div>
            )}
          </Section>
        </>
      );
    }

    case "gallery": return <>{head}<GalleryManager weddingId={weddingId} advanced={canUse(ent, "advanced_gallery")} /></>;
    case "guestbook": return <>{head}<MessagesBoard weddingId={weddingId} canPrivate={canUse(ent, "private_messages")} /></>;
    case "wishes": return <>{head}<InboxBoard weddingId={weddingId} features={{ messages: canUse(ent, "guestbook"), uploads: canUse(ent, "guest_uploads"), video: canUse(ent, "video_wishes"), voice: canUse(ent, "voice_wishes") }} /></>;
    case "photos": return <>{head}<UploadsBoard weddingId={weddingId} wallHref={canUse(ent, "live_photo_wall") ? `/wall/${ctx.slug}` : undefined} /></>;
    case "video-wishes": return <>{head}<MediaWishesBoard weddingId={weddingId} kind="VIDEO" /></>;
    case "voice-wishes": return <>{head}<MediaWishesBoard weddingId={weddingId} kind="VOICE" /></>;

    case "accommodation": {
      const rows = await listAccommodation(actor, weddingId);
      return <>{head}<RequestsTable weddingId={weddingId} kind="stay" rows={rows.map((r) => ({ id: r.req.id, status: r.req.status, guest: r.guest, a: `${r.req.rooms} room${r.req.rooms === 1 ? "" : "s"}${r.req.arrival ? ` · ${r.req.arrival}` : ""}${r.req.departure ? ` → ${r.req.departure}` : ""}`, b: r.req.notes || "—", c: "", assignment: r.req.assignment }))} /></>;
    }
    case "transport": {
      const rows = await listTransport(actor, weddingId);
      return <>{head}<RequestsTable weddingId={weddingId} kind="ride" rows={rows.map((r) => ({ id: r.req.id, status: r.req.status, guest: r.guest, a: `${r.req.pickupLocation || "—"} · ${r.req.passengers} passenger${r.req.passengers === 1 ? "" : "s"}`, b: [r.req.arrivalAt, r.req.reference].filter(Boolean).join(" · ") || "—", c: "", assignment: r.req.vehicle }))} /></>;
    }
    case "share": return <>{head}<SharePanel weddingId={weddingId} url={`${ctx.appUrl}/invite/${ctx.slug}`} title={ctx.wedding.title || "our wedding"} canPersonal={canUse(ent, "personalized_urls")} /></>;

    case "checkin": {
      const events = sortEvents(doc.events).map((e) => ({ id: e.id, name: tx(e.name, "en") || "Event" }));
      if (!events.length) return <>{head}<EmptyState title="Add an event first" body="Check-in is per event — add the ceremony in the Events step." action={<LinkButton href={`${base}/setup/events`} variant="quiet">Go to Events</LinkButton>} /></>;
      const main = doc.events.find((e) => e.isMain) ?? doc.events[0];
      return <>{head}<CheckinConsole weddingId={weddingId} events={events} defaultEvent={main.id} /></>;
    }

    case "live": {
      const events = sortEvents(doc.events).map((e) => ({ id: e.id, name: tx(e.name, "en") || "Event" }));
      return <>{head}<LiveConsole weddingId={weddingId} events={events} secondary={secondary} canCheckin={canUse(ent, "qr_checkin")} base={base} /></>;
    }

    case "games": {
      const board = canUse(ent, "leaderboard") ? await leaderboard(weddingId, 15) : [];
      const plays = await db.select({ game: schema.gamePlays.game, n: sql<number>`count(*)::int`, avg: sql<number>`round(avg(${schema.gamePlays.score}))::int` }).from(schema.gamePlays).where(eq(schema.gamePlays.weddingId, weddingId)).groupBy(schema.gamePlays.game);
      const groups = await groupList(weddingId);
      return (
        <>
          {head}
          <div className="mb-10 grid gap-10 lg:grid-cols-2">
            <Section title="Plays" className="!mt-0">{plays.length ? <HBars rows={plays.map((p) => ({ label: p.game.replaceAll("_", " ").toLowerCase(), value: p.n, note: `avg ${p.avg} pts` }))} /> : <p className="py-4 text-muted">No one has played yet. Games open once the invitation is live.</p>}</Section>
            <Section title="Leaderboard" className="!mt-0">{board.length ? <ol className="divide-y divide-rule">{board.map((r) => (<li key={r.rank} className="flex items-center gap-4 py-2.5"><span className="display tnum w-8 text-[24px] text-accent">{r.rank}</span><span className="flex-1 truncate">{r.name}</span><span className="tnum font-medium">{r.total} pts</span></li>))}</ol> : <p className="py-4 text-muted">{canUse(ent, "leaderboard") ? "Scores appear here." : "The guest leaderboard is part of Luxury."}</p>}</Section>
          </div>
          <Section title="Set up the games" className="!mt-0"><DocScope {...docScopeProps(ctx, doc, groups)}><GamesSetup /></DocScope></Section>
        </>
      );
    }

    case "time-capsule": return <>{head}<DocScope {...docScopeProps(ctx, doc, await groupList(weddingId))}><CapsulePanel weddingId={weddingId} isAdmin={ctx.role === "admin"} /></DocScope></>;

    case "memory": {
      const book = await getMemoryBook(weddingId);
      return <>{head}<DocScope {...docScopeProps(ctx, doc, await groupList(weddingId))}><MemoryEditor weddingId={weddingId} canBook={canUse(ent, "memory_book")} bookInit={book ? { title: book.title, intro: book.intro, pinnedMessageIds: book.pinnedMessageIds, pinnedAssetIds: book.pinnedAssetIds, published: !!book.publishedAt } : null} /></DocScope></>;
    }

    case "anniversary": {
      const raw = await db.select().from(schema.anniversaryEntries).where(eq(schema.anniversaryEntries.weddingId, weddingId)).orderBy(sql`${schema.anniversaryEntries.year} desc`);
      return <>{head}<DocScope {...docScopeProps(ctx, doc, await groupList(weddingId))}><AnniversaryEditor weddingId={weddingId} entries={raw.map((e) => ({ id: e.id, year: e.year, title: e.title, body: e.body }))} /></DocScope></>;
    }

    case "analytics": {
      const a = await weddingAnalytics(actor, weddingId, 30);
      return (
        <>
          {head}
          <Ledger items={[{ label: "Views", value: a.views.toLocaleString("en-IN"), note: "last 30 days" }, { label: "Visitors", value: a.visitors.toLocaleString("en-IN") }, { label: "Reply rate", value: `${a.rsvpConversion}%`, note: `${a.responded} of ${a.guests} guests` }, { label: "Wishes", value: a.messages }, { label: "Guest photos", value: a.uploads }, ...(canUse(ent, "qr_checkin") ? [{ label: "Arrivals", value: a.checkins }] : [])]} />
          <Section title="Views per day"><DayBars data={a.perDay} label="Invitation views" /></Section>
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <Section title="From invite to reply" className="!mt-0"><HBars rows={[{ label: "Guests invited", value: a.guests }, { label: "Opened their invitation", value: a.opened }, { label: "Replied", value: a.responded }, { label: "Attending", value: a.rsvp.yes }]} /></Section>
            {a.advanced ? (
              <Section title="Most viewed sections" className="!mt-0">{a.sections.length ? <HBars rows={a.sections.map((s) => ({ label: s.section ?? "—", value: s.n }))} /> : <p className="py-4 text-muted">Not enough views yet.</p>}<h3 className="eyebrow mb-3 mt-8">Devices</h3><HBars rows={a.devices.map((d) => ({ label: d.device, value: d.n }))} /></Section>
            ) : <Section title="More insight" className="!mt-0"><p className="text-muted">Section-level views and device breakdown are part of the Luxury package.</p></Section>}
          </div>
          <p className="mt-10 text-[13px] text-muted">Analytics are anonymous: a random per-browser id, the section viewed and the device type — no IP addresses, no tracking cookies.</p>
        </>
      );
    }

    case "settings": {
      const w = ctx.wedding;
      return (
        <>
          {head}
          <SettingsForm weddingId={weddingId} isAdmin={ctx.role === "admin"} status={w.status} initial={{ contactEmail: w.contactEmail ?? "", contactPhone: w.contactPhone ?? "", accessMode: w.accessMode, autoLifecycle: w.autoLifecycle, timezone: w.timezone, secondaryLocale: w.secondaryLocale }} />
          <div className="mt-8"><PasswordForm /></div>
          {ctx.role === "admin" && <p className="mt-6 text-[14px] text-muted">Package, features, template and theme are managed in the <Link className="underline" href={`${base}/setup/package`}>setup steps</Link>.</p>}
        </>
      );
    }

    case "notifications": {
      const rows = ctx.role === "admin" ? await listNotifications(weddingId, 60) : await listInAppFor(actor.userId, 60);
      if (ctx.role === "client") await markAllRead(actor.userId);
      return (
        <>
          {head}
          {rows.length === 0 ? <EmptyState title="Nothing yet" body="Replies, wishes, photos and requests appear here as they happen." /> : (
            <ul className="divide-y divide-rule border-y border-rule">{rows.map((n) => (<li key={n.id} className="flex items-start gap-4 py-3.5"><div className="min-w-0 flex-1"><p className="text-[15px] font-medium">{n.subject}</p>{n.body && <p className="truncate text-[13.5px] text-muted">{n.body}</p>}</div><time className="shrink-0 text-[12.5px] text-muted tnum">{n.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>{n.link && n.link.startsWith("/") && <Link href={n.link} className="btn btn-quiet btn-sm">Open</Link>}</li>))}</ul>
          )}
        </>
      );
    }

    case "versions": {
      if (ctx.role !== "admin") notFound();
      return <>{head}<VersionsPanel weddingId={weddingId} /></>;
    }
    default: notFound();
  }
}

