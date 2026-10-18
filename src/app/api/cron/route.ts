import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/cron";
import { processDue } from "@/domain/notify/service";
import { processMemoryNotifications } from "@/domain/memory/service";
import { expireGifts } from "@/domain/gifts/service";
import { logError } from "@/domain/platform/logging";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Scheduled jobs: send queued messages, tell couples when a time capsule has opened, delete gifts nobody sent. */
export async function GET(req: Request) {
  if (!cronAuthorised(req)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const queued = await processDue(100);
    const capsules = await processMemoryNotifications();
    const gifts = await expireGifts();
    return NextResponse.json({ ok: true, queued, capsules, gifts }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    void logError("cron", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
