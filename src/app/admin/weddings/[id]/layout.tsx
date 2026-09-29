import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireAdminPage } from "@/lib/session";
import { getWedding } from "@/domain/wedding/service";
import { getEntitlements } from "@/domain/packages/service";
import { effectiveStatus } from "@/domain/wedding/lifecycle";
import { PackageChip, StatusChip } from "@/components/ui/Chip";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import { ADMIN_EXTRA, hrefFor, itemsFor } from "@/lib/workspace";
import { getDb, schema } from "@/db/client";
import { and, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function WeddingLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdminPage(`/admin/weddings/${id}`);
  const w = await getWedding(admin, id).catch(() => null);
  if (!w) notFound();
  const ent = await getEntitlements(id);
  const db = await getDb();
  const [{ pending }] = await db
    .select({ pending: sql<number>`(select count(*)::int from ${schema.mediaAssets} m where m.wedding_id = ${id} and m.category = 'GUEST_UPLOAD' and m.moderation = 'PENDING') + (select count(*)::int from ${schema.guestMessages} g where g.wedding_id = ${id} and g.moderation = 'PENDING' and g.kind <> 'PRIVATE')` })
    .from(schema.weddings)
    .where(and(eq(schema.weddings.id, id)));
  const base = `/admin/weddings/${id}`;
  const items = [
    { href: base, label: "Overview" },
    { href: `${base}/setup/couple`, label: "Setup" },
    { href: `${base}/edit`, label: "Visual editor" },
    ...itemsFor("admin", ent).filter((i) => !["", "invitation", "events"].includes(i.slug)).map((i) => ({ href: hrefFor(base, i.slug, "admin"), label: i.label, locked: i.locked, badge: i.slug === "wishes" ? pending || undefined : undefined })),
    ...ADMIN_EXTRA.map((i) => ({ href: `${base}/${i.slug}`, label: i.label })),
  ];
  const eff = effectiveStatus(w);
  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="eyebrow"><Link href="/admin/weddings" className="hover:underline">Weddings</Link> / {w.slug}</p>
          <h1 className="display mt-1.5 text-[clamp(30px,4.2vw,46px)]">{w.title || "Untitled wedding"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2"><StatusChip status={eff} /><PackageChip pkg={w.packageKey} />{w.customerClass === "FREE_PORTFOLIO" && <span className="chip chip-brass">Free portfolio</span>}{w.archivedAt && <span className="chip chip-neutral">Archived</span>}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/preview/${id}`} target="_blank" className="btn btn-quiet btn-sm">Preview draft</Link>
          {w.publishedVersionId && !["DRAFT", "PREVIEW"].includes(w.status) && <Link href={`/invite/${w.slug}`} target="_blank" className="btn btn-quiet btn-sm"><ExternalLink className="size-4" />Live invitation</Link>}
          <Link href={`${base}/edit`} className="btn btn-primary btn-sm">Edit invitation</Link>
        </div>
      </div>
      <WorkspaceTabs items={items} base={base} />
      {children}
    </>
  );
}
