import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { Shell, type NavGroup, type PaletteEntry } from "@/components/shell/Shell";
import { requireClientPage } from "@/lib/session";
import { loadWsCtx } from "@/lib/ws-context";
import { hrefFor, itemsFor } from "@/lib/workspace";
import { getDb, schema } from "@/db/client";
import { unreadCount } from "@/domain/notify/service";
import { FeatureNotAvailableError } from "@/domain/packages/entitlements";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Dashboard" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ClientLayout({ children, params }: { children: React.ReactNode; params: Promise<{ weddingId: string }> }) {
  const { weddingId } = await params;
  const actor = await requireClientPage(weddingId);
  if (actor.kind === "admin") redirect(`/admin/weddings/${weddingId}`);
  const ctx = await loadWsCtx(actor, weddingId).catch((e) => {
    // Essential weddings have no client dashboard — send them back to sign-in with a clear message.
    if (e instanceof FeatureNotAvailableError) redirect("/login");
    throw e;
  });
  if (!ctx) notFound();
  const items = itemsFor("client", ctx.ent).filter((i) => !i.locked);
  const db = await getDb();
  const [{ pending, stay }] = await db
    .select({
      pending: sql<number>`(select count(*)::int from ${schema.mediaAssets} m where m.wedding_id = ${weddingId} and m.category = 'GUEST_UPLOAD' and m.moderation = 'PENDING') + (select count(*)::int from ${schema.guestMessages} g where g.wedding_id = ${weddingId} and g.moderation = 'PENDING' and g.kind <> 'PRIVATE')`,
      stay: sql<number>`(select count(*)::int from ${schema.accommodationRequests} a where a.wedding_id = ${weddingId} and a.status = 'REQUESTED') + (select count(*)::int from ${schema.transportRequests} t where t.wedding_id = ${weddingId} and t.status = 'REQUESTED')`,
    })
    .from(schema.weddings)
    .where(and(eq(schema.weddings.id, weddingId)));
  const nav = (slug: string) => items.find((i) => i.slug === slug);
  const mk = (slugs: string[]) => slugs.map((s) => nav(s)).filter(Boolean).map((i) => ({ href: hrefFor(ctx.base, i!.slug, "client"), label: i!.label, icon: i!.icon, exact: i!.slug === "", badge: i!.slug === "wishes" ? pending || undefined : i!.slug === "accommodation" || i!.slug === "transport" ? stay || undefined : undefined }));
  const groups: NavGroup[] = [
    { items: mk(["", "invitation"]) },
    { label: "Guests", items: mk(["guests", "rsvp", "events", "accommodation", "transport", "share"]) },
    { label: "Memories & wishes", items: mk(["gallery", "guestbook", "wishes", "photos", "video-wishes", "voice-wishes"]) },
    { label: "On the day", items: mk(["checkin", "live", "games"]) },
    { label: "Keepsakes", items: mk(["time-capsule", "memory", "anniversary"]) },
    { label: "Account", items: mk(["analytics", "settings"]) },
  ].filter((g) => g.items.length);
  const palette: PaletteEntry[] = items.map((i) => ({ label: i.label, href: hrefFor(ctx.base, i.slug, "client"), group: "Go to", hint: i.desc }));
  const unread = await unreadCount(actor.userId);
  return (
    <Shell homeHref={ctx.base} groups={groups} palette={palette} user={{ name: actor.name, email: actor.email, role: "Client" }} context={{ title: ctx.wedding.title || ctx.slug, sub: ctx.wedding.packageKey.charAt(0) + ctx.wedding.packageKey.slice(1).toLowerCase(), href: ctx.base }} bell={{ href: `${ctx.base}/notifications`, count: unread }}>
      {children}
    </Shell>
  );
}
