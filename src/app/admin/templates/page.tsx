import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listTemplates } from "@/domain/design/service";
import { TemplateConfig } from "@/domain/design/templates";
import { PageHeader } from "@/components/ui/Bits";
import { Library } from "../Library";

export const metadata: Metadata = { title: "Templates" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requireAdminPage("/admin/templates");
  const templates = await listTemplates();
  return (
    <>
      <PageHeader eyebrow="Design library" title="Templates" lede="A template decides the structure: which sections appear, in what order, with which layouts and opening. Colour and type come from the theme, so any template can wear any theme." />
      <Library
        kind="template"
        items={templates.map((t) => {
          const c = TemplateConfig.safeParse(t.config);
          const meta = c.success ? `${c.data.flavor} · opens with ${c.data.opening} · ${c.data.sections.filter((s) => s.enabled).length} sections` : "Configuration needs repair";
          return { id: t.id, name: t.name, description: t.description, status: t.status, version: t.version, meta, previewHref: `/preview/template?template=${t.id}` };
        })}
      />
    </>
  );
}
