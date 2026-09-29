import { notFound } from "next/navigation";
import { requireClientPage } from "@/lib/session";
import { loadWizardProps } from "@/lib/wizard-data";
import { WizardClient } from "@/components/admin/wizard/WizardClient";
import { isStepKey } from "@/components/admin/wizard/steps";

export const dynamic = "force-dynamic";
const CLIENT_STEPS = ["events", "family", "story", "venue", "media", "music", "guests", "preview", "publish"];

export default async function ClientSetupStep({ params }: { params: Promise<{ weddingId: string; step: string }> }) {
  const { weddingId, step } = await params;
  const actor = await requireClientPage(weddingId, `/client/${weddingId}/setup/${step}`);
  if (!isStepKey(step) || !CLIENT_STEPS.includes(step)) notFound();
  const props = await loadWizardProps(actor, weddingId, step);
  return <WizardClient key={`${weddingId}-${step}`} {...props} />;
}
