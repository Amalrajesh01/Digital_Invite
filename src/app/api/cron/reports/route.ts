import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/cron";
import { mailReady } from "@/domain/mail/transport";
import { sendAllReports } from "@/domain/reports/service";
import { logError } from "@/domain/platform/logging";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** 6 pm India time = 12:30 UTC. Emails every enabled daily report. See docs/EMAIL-REPORTS.md. */
export async function GET(req: Request) {
  if (!cronAuthorised(req)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await mailReady())) return NextResponse.json({ ok: false, error: "Email is not set up. Add the mail account in Settings → Email." }, { status: 200 });
  try {
    return NextResponse.json({ ok: true, ...(await sendAllReports()) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    void logError("cron", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
