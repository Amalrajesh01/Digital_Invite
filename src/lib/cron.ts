import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/** Scheduled jobs are called with `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends it itself; on a server, curl does). */
export function cronAuthorised(req: Request): boolean {
  const secret = env.cronSecret;
  if (!secret) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
