import { NextResponse } from "next/server";
import { consumeMagic } from "@/app/actions/auth";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/** One-time sign-in link for clients. Consumed on first use, then redirects into the dashboard. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const base = new URL(req.url);
  try {
    if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) throw new AppError("EXPIRED", "invalid");
    const s = await consumeMagic(token);
    return NextResponse.redirect(new URL(s.role === "SUPER_ADMIN" ? "/admin" : "/client", base.origin));
  } catch {
    return NextResponse.redirect(new URL("/login?expired=1", base.origin));
  }
}
