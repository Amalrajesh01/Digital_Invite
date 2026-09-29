import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { rateLimited } from "@/lib/errors";

/**
 * Fixed-window rate limiter stored in Postgres, so it holds across serverless instances.
 * Returns silently when allowed and throws RATE_LIMITED when the limit is exceeded.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<void> {
  const db = await getDb();
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / (windowSec * 1000)) * windowSec * 1000);
  const k = `${key}:${windowStart.getTime()}`;
  const [row] = await db
    .insert(schema.rateLimits)
    .values({ key: k, windowStart, count: 1 })
    .onConflictDoUpdate({ target: schema.rateLimits.key, set: { count: sql`${schema.rateLimits.count} + 1` } })
    .returning({ count: schema.rateLimits.count });
  if (row.count > limit) throw rateLimited();
  // Opportunistic cleanup keeps the table tiny.
  if (Math.random() < 0.01) {
    await db.delete(schema.rateLimits).where(sql`${schema.rateLimits.windowStart} < now() - interval '2 hours'`);
  }
}
