import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listLettersForAdmin } from "@/domain/letters/service";
import { LETTER_CATEGORIES } from "@/domain/letters";
import { Ledger, PageHeader } from "@/components/ui/Bits";
import { LettersManager } from "./LettersManager";

export const metadata: Metadata = { title: "Forever Letters" };
export const dynamic = "force-dynamic";

/** The catalogue of Forever Letters, with the one control the studio needs: which of them the public site shows. */
export default async function LettersPage() {
  const admin = await requireAdminPage("/admin/letters");
  const rows = await listLettersForAdmin(admin);
  const on = rows.filter((r) => r.enabled).length;
  return (
    <>
      <PageHeader eyebrow="Design library" title="Forever Letters" lede="The experiences people can make from the For My Love page. Switch one off to take it out of the public gallery and the homepage — gifts already made from it keep working. Open any of them to play its demonstration." />
      <Ledger className="mb-8" items={[{ label: "In the gallery", value: on }, { label: "Switched off", value: rows.length - on }, { label: "Chapters", value: LETTER_CATEGORIES.length }]} />
      <LettersManager rows={rows.map((r) => ({ slug: r.slug, n: r.n, title: r.title, category: LETTER_CATEGORIES.find((c) => c.key === r.category)?.name ?? r.category, tone: r.tone, purpose: r.purpose, enabled: r.enabled, cover: r.cover }))} />
    </>
  );
}
