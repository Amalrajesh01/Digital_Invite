import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/cron";
import { googleConfigured } from "@/domain/sheets/google";
import { syncAllSheets } from "@/domain/sheets/service";
import { logError } from "@/domain/platform/logging";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** 6 pm India time = 12:30 UTC. Rewrites every enabled daily Google Sheet. See docs/GOOGLE-SHEETS.md. */
export async function GET(req: Request) {
  if (!cronAuthorised(req)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!googleConfigured()) return NextResponse.json({ ok: false, error: "GOOGLE_SERVICE_ACCOUNT_JSON is not set" }, { status: 200 });
  try {
    return NextResponse.json({ ok: true, ...(await syncAllSheets()) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    void logError("cron", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
