import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserPage } from "@/lib/session";
import { loadTemplatePreview } from "@/domain/wedding/public";
import { WEDDING_STATUSES } from "@/domain/doc/constants";
import { PACKAGE_KEYS } from "@/domain/packages/features";
import { PreviewFrame } from "@/invitation/PreviewFrame";

export const metadata: Metadata = { title: "Template preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Template / theme picker preview: real demo content, not a grey wireframe. */
export default async function TemplatePreview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUserPage("/admin");
  const q = await searchParams;
  let overrides: unknown;
  if (q.o) {
    try {
      overrides = JSON.parse(Buffer.from(q.o, "base64url").toString("utf8"));
    } catch {
      overrides = undefined;
    }
  }
  const pkg = PACKAGE_KEYS.find((p) => p === q.pkg) ?? "LUXURY";
  const view = await loadTemplatePreview({ templateId: q.template, themeId: q.theme, overrides, packageKey: pkg, state: WEDDING_STATUSES.find((s) => s === q.state) });
  if (!view) notFound();
  return <PreviewFrame view={view} initialLocale={q.lang || "en"} />;
}
