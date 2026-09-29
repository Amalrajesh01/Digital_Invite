import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processDue } from "@/domain/notify/service";
import { processMemoryNotifications } from "@/domain/memory/service";
import { logError } from "@/domain/platform/logging";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(req: Request): boolean {
  const secret = env.cronSecret;
  if (!secret) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Scheduled jobs: send queued messages and tell couples when a time capsule has opened. */
export async function GET(req: Request) {
  if (!authorised(req)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const queued = await processDue(100);
    const capsules = await processMemoryNotifications();
    return NextResponse.json({ ok: true, queued, capsules }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    void logError("cron", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
