import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/session";
import { listPackages } from "@/domain/packages/service";
import { listTemplates } from "@/domain/design/service";
import { TemplateConfig } from "@/domain/design/templates";
import { EVENT_TYPE_INFO } from "@/domain/doc/event-types";
import { CATEGORIES } from "@/domain/catalogue/categories";
import { PageHeader } from "@/components/ui/Bits";
import { NewWeddingForm } from "./NewWeddingForm";
import { TemplatePicker, type PickTemplate } from "./TemplatePicker";

export const metadata: Metadata = { title: "New invitation" };
export const dynamic = "force-dynamic";

export default async function NewWedding({ searchParams }: { searchParams: Promise<{ advanced?: string }> }) {
  await requireAdminPage("/admin/weddings/new");
  const [packages, q] = [await listPackages(), await searchParams];
  const active = packages.filter((p) => p.active);

  if (q.advanced === "1") {
    return (
      <>
        <PageHeader eyebrow="Full setup" title="Begin a new wedding" lede="The long way: package first, then every step of the setup wizard. Most invitations are quicker from a template." actions={<Link className="btn btn-quiet" href="/admin/weddings/new">Start from a template instead</Link>} />
        <NewWeddingForm packages={active.map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, blurb: p.blurb, priceMin: p.priceMin, priceMax: p.priceMax, hasClientDashboard: p.hasClientDashboard }))} />
      </>
    );
  }

  const templates: PickTemplate[] = (await listTemplates())
    .filter((t) => t.status === "PUBLISHED")
    .flatMap((t) => {
      const c = TemplateConfig.safeParse(t.config);
      if (!c.success || c.data.experience) return []; // love gifts have their own builder
      const info = EVENT_TYPE_INFO[c.data.eventType ?? "wedding"];
      const thumb = existsSync(path.join(process.cwd(), "public", "templates", `${t.slug}.webp`)) ? `/templates/${t.slug}.webp` : null;
      if (!c.data.demo && !thumb) return []; // old built-ins with no sample and no picture would be blank cards; they are still in the full setup
      return [{ id: t.id, slug: t.slug, name: t.name, blurb: t.description, category: CATEGORIES.find((x) => x.slug === info.category)?.name ?? info.label, subject: info.subject, thumb, hasSample: !!c.data.demo }];
    });

  return (
    <>
      <PageHeader eyebrow="New invitation" title="Choose a design" lede="Pick the one that suits the family. You get it complete, with sample words and photographs already in place, so all that is left is replacing them." actions={<Link className="btn btn-ghost" href="/admin/weddings/new?advanced=1">Full setup instead</Link>} />
      <TemplatePicker templates={templates} packages={active.map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, priceMin: p.priceMin, priceMax: p.priceMax }))} />
    </>
  );
}
