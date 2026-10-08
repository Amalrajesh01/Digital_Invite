import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentActor, requestMeta } from "@/lib/session";
import { PreviewShield } from "@/invitation/PreviewShield";
import { loadTemplatePreview } from "@/domain/wedding/public";
import { WEDDING_STATUSES } from "@/domain/doc/constants";
import { PACKAGE_KEYS } from "@/domain/packages/features";
import { PreviewFrame } from "@/invitation/PreviewFrame";

export const metadata: Metadata = { title: "Template preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Template / theme picker preview: real demo content, not a grey wireframe. */
export default async function TemplatePreview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  // Anyone with the link may look; only signed-in users get the picker's live overrides.
  const actor = await getCurrentActor();
  const q = await searchParams;
  let overrides: unknown;
  if (actor && q.o) {
    try {
      overrides = JSON.parse(Buffer.from(q.o, "base64url").toString("utf8"));
    } catch {
      overrides = undefined;
    }
  }
  const pkg = (actor && PACKAGE_KEYS.find((p) => p === q.pkg)) || "LUXURY";
  const view = await loadTemplatePreview({ templateId: q.template, themeId: q.theme, overrides, packageKey: pkg, state: actor ? WEDDING_STATUSES.find((s) => s === q.state) : undefined });
  if (!view) notFound();
  if (actor) return <PreviewFrame view={view} initialLocale={q.lang || "en"} />;
  const { ip } = await requestMeta();
  const stamp = Buffer.from(ip).toString("base64url").slice(0, 14);
  return (
    <>
      <PreviewShield mark={`StackBridge Invites · proprietary preview · ${stamp}`} />
      <PreviewFrame view={view} initialLocale={q.lang || "en"} />
    </>
  );
}
