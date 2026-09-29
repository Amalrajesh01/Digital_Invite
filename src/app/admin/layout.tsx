import type { Metadata } from "next";
import { and, eq, gte, sql } from "drizzle-orm";
import { Shell, type NavGroup, type PaletteEntry } from "@/components/shell/Shell";
import { requireAdminPage } from "@/lib/session";
import { listWeddings } from "@/domain/wedding/service";
import { getDb, schema } from "@/db/client";

export const metadata: Metadata = { title: { default: "Studio", template: "%s · Studio" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const GROUPS: NavGroup[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", exact: true }] },
  {
    label: "Studio",
    items: [
      { href: "/admin/weddings", label: "Weddings", icon: "weddings" },
      { href: "/admin/clients", label: "Clients", icon: "clients" },
      { href: "/admin/orders", label: "Orders", icon: "orders" },
    ],
  },
  {
    label: "Design library",
    items: [
      { href: "/admin/templates", label: "Templates", icon: "templates" },
      { href: "/admin/themes", label: "Themes", icon: "themes" },
      { href: "/admin/media", label: "Media library", icon: "media" },
      { href: "/admin/packages", label: "Packages", icon: "packages" },
    ],
  },
  {
    label: "Insight",
    items: [
      { href: "/admin/guests", label: "Guests", icon: "guests" },
      { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
      { href: "/admin/domains", label: "Domains", icon: "domains" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: "notifications" },
      { href: "/admin/audit", label: "Audit logs", icon: "audit" },
      { href: "/admin/settings", label: "Settings", icon: "settings" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const weddings = await listWeddings(admin);
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.status, "FAILED"), gte(schema.notifications.createdAt, new Date(Date.now() - 7 * 86400000))));

  const palette: PaletteEntry[] = [
    ...GROUPS.flatMap((g) => g.items.map((i) => ({ label: i.label, href: i.href, group: "Go to" }))),
    { label: "Create a new wedding", href: "/admin/weddings/new", group: "Action", hint: "Start the 16-step wizard" },
    ...weddings.flatMap((w) => [
      { label: w.title || w.slug, href: `/admin/weddings/${w.id}`, group: "Wedding", hint: `${w.packageKey.toLowerCase()} · /invite/${w.slug}` },
      { label: `Edit invitation — ${w.title || w.slug}`, href: `/admin/weddings/${w.id}/edit`, group: "Action" },
      { label: `Guests — ${w.title || w.slug}`, href: `/admin/weddings/${w.id}/guests`, group: "Wedding" },
    ]),
  ];

  return (
    <Shell homeHref="/admin" groups={GROUPS} palette={palette} user={{ name: admin.name, email: admin.email, role: "Platform owner" }} bell={{ href: "/admin/notifications", count: n }}>
      {children}
    </Shell>
  );
}
