import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { linkableWeddings, listPortfolioAdmin } from "@/domain/portfolio/service";
import { SITE_TEMPLATES } from "@/domain/catalogue/templates";
import { CATEGORIES } from "@/domain/catalogue/categories";
import { Ledger, PageHeader } from "@/components/ui/Bits";
import { PortfolioManager } from "./PortfolioManager";

export const metadata: Metadata = { title: "Portfolio" };
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const admin = await requireAdminPage("/admin/portfolio");
  const [items, weddings] = await Promise.all([listPortfolioAdmin(admin), linkableWeddings(admin)]);
  const shown = items.filter((i) => i.status === "PUBLISHED").length;
  return (
    <>
      <PageHeader eyebrow="Studio" title="Portfolio" lede="The finished work shown on the public site. Nothing appears by itself: an item is hidden until you publish it, and one that stands for a customer’s real invitation needs their consent recorded first. The public site shows only what is written here and the approved cover — never names, dates or guests." />
      <Ledger className="mb-8" items={[{ label: "On the public site", value: shown }, { label: "Hidden", value: items.length - shown }, { label: "Awaiting consent", value: items.filter((i) => i.wedding && !i.wedding.isDemo && !i.consent).length }]} />
      <PortfolioManager
        items={items.map((i) => ({ id: i.id, slug: i.slug, title: i.title, description: i.description, category: i.category, templateSlug: i.templateSlug, city: i.city, weddingId: i.weddingId, coverAssetId: i.coverAssetId, showLive: i.showLive, consent: i.consent, consentNote: i.consentNote, status: i.status, wedding: i.wedding ? { title: i.wedding.title, isDemo: i.wedding.isDemo } : null }))}
        weddings={weddings.map((w) => ({ id: w.id, label: `${w.title}${w.isDemo ? " (sample)" : ""}`, isDemo: w.isDemo }))}
        templates={SITE_TEMPLATES.filter((t) => !t.love).map((t) => ({ slug: t.slug, name: t.name, category: t.category, thumb: t.thumb }))}
        categories={CATEGORIES.filter((c) => !c.family && c.slug !== "for-my-love").map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </>
  );
}
