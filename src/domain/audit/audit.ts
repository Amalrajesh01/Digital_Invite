import { getDb, schema } from "@/db/client";
import type { Actor } from "@/domain/auth/access";

/** Append-only audit trail. Every admin/client mutation that matters writes one row. */
export async function audit(
  actor: Actor | { kind: "guest"; guestId: string; name: string } | null,
  action: string,
  opts: { weddingId?: string | null; entityType?: string; entityId?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(schema.auditLogs).values({
      weddingId: opts.weddingId ?? null,
      actorUserId: actor && (actor.kind === "admin" || actor.kind === "client") ? actor.userId : null,
      actorLabel: !actor ? "system" : actor.kind === "guest" ? `guest:${actor.name}` : actor.kind === "system" ? "system" : actor.name || actor.email,
      action,
      entityType: opts.entityType ?? "",
      entityId: opts.entityId ?? "",
      metadata: opts.metadata ?? {},
    });
  } catch (err) {
    console.error("[audit failed]", err);
  }
}
