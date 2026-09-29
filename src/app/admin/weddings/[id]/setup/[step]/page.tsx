import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { loadWizardProps } from "@/lib/wizard-data";
import { WizardClient } from "@/components/admin/wizard/WizardClient";
import { isStepKey } from "@/components/admin/wizard/steps";

export const dynamic = "force-dynamic";

export default async function SetupStep({ params }: { params: Promise<{ id: string; step: string }> }) {
  const { id, step } = await params;
  const actor = await requireAdminPage(`/admin/weddings/${id}/setup/${step}`);
  if (!isStepKey(step)) notFound();
  const props = await loadWizardProps(actor, id, step);
  // remount per step so each step starts from the freshly saved data
  return <WizardClient key={`${id}-${step}`} {...props} />;
}
