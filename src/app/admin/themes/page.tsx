import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/session";
import { listThemes } from "@/domain/design/service";
import { ThemeTokens } from "@/domain/design/tokens";
import { PageHeader } from "@/components/ui/Bits";
import { Library } from "../Library";

export const metadata: Metadata = { title: "Themes" };
export const dynamic = "force-dynamic";

export default async function ThemesPage() {
  await requireAdminPage("/admin/themes");
  const themes = await listThemes();
  return (
    <>
      <PageHeader eyebrow="Design library" title="Themes" lede="Colours and typography. Duplicate a theme to experiment, preview it on the demo couple, and only publish it when you are happy." />
      <Library
        kind="theme"
        items={themes.flatMap((t) => {
          const tokens = ThemeTokens.safeParse(t.tokens);
          if (!tokens.success) return [];
          return [{ id: t.id, name: t.name, description: t.description, status: t.status, version: t.version, meta: `${tokens.data.fonts.heading} + ${tokens.data.fonts.body}`, previewHref: `/preview/template?theme=${t.id}`, tokens: tokens.data }];
        })}
      />
    </>
  );
}
