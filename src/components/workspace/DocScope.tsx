"use client";
import type { InvitationDoc } from "@/domain/doc/schema";
import type { FeatureKey } from "@/domain/packages/features";
import { DraftProvider, SaveIndicator, type WeddingSettings } from "@/components/admin/draft";

/** Wraps a page that edits the invitation document (games, capsule, memory…) with autosave. */
export function DocScope({ weddingId, role, doc, settings, features, groups, children, showSave = true }: { weddingId: string; role: "admin" | "client"; doc: InvitationDoc; settings: WeddingSettings; features: FeatureKey[]; groups: { key: string; name: string }[]; children: React.ReactNode; showSave?: boolean }) {
  return (
    <DraftProvider weddingId={weddingId} role={role} initialDoc={doc} initialSettings={settings} features={features} groups={groups}>
      {showSave && <div className="mb-4 flex justify-end"><SaveIndicator /></div>}
      {children}
    </DraftProvider>
  );
}
