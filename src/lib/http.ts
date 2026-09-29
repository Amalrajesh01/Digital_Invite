import { NextResponse } from "next/server";
import { AppError, toUserError } from "@/lib/errors";
import { logError } from "@/domain/platform/logging";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });
}

export function fail(e: unknown, ctx: { area: string; weddingId?: string } = { area: "api" }) {
  const user = toUserError(e);
  if (user.code === "INTERNAL" && !(e instanceof AppError)) void logError(ctx.area, e, { weddingId: ctx.weddingId });
  const status = e instanceof AppError ? e.status : user.code === "FEATURE_UNAVAILABLE" ? 403 : user.code === "VALIDATION" ? 422 : 500;
  return NextResponse.json({ ok: false, error: user }, { status, headers: { "Cache-Control": "no-store" } });
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip")) || "local";
}

/** CSRF defence for cookie-authenticated mutations: the Origin must match the Host. */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (curl, cron) — cookies are not attached cross-site without an Origin anyway
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let ok = false;
  try {
    ok = new URL(origin).host === host;
  } catch {
    ok = false;
  }
  if (!ok) throw new AppError("FORBIDDEN", "Cross-site request blocked.");
}

export const MAX_UPLOAD_BYTES = 210 * 1024 * 1024;

export function assertUploadSize(req: Request) {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len && len > MAX_UPLOAD_BYTES) throw new AppError("UPLOAD_REJECTED", "That file is too large.");
}
