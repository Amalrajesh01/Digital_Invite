import { getDb, schema } from "@/db/client";

/** Application/system log — surfaced to Super Admin so an issue can be traced to a specific wedding. */
export async function logEvent(
  level: "INFO" | "WARN" | "ERROR",
  area: string,
  message: string,
  opts: { weddingId?: string | null; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(schema.systemEvents).values({
      level,
      area,
      message: message.slice(0, 500),
      weddingId: opts.weddingId ?? null,
      metadata: opts.metadata ?? {},
    });
  } catch (err) {
    // Logging must never break the request.
    console.error("[logEvent failed]", err);
  }
  if (level === "ERROR") console.error(`[${area}] ${message}`, opts.metadata ?? "");
}

export const logError = (area: string, err: unknown, opts: { weddingId?: string | null; metadata?: Record<string, unknown> } = {}) =>
  logEvent("ERROR", area, err instanceof Error ? err.message : String(err), opts);
