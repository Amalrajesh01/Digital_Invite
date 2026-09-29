import { NextResponse } from "next/server";
import { domainForHost } from "@/domain/platform/admin";

export const dynamic = "force-dynamic";

/** Used by proxy.ts: which wedding does this verified custom domain belong to? (Slugs are public anyway.) */
export async function GET(req: Request) {
  const host = new URL(req.url).searchParams.get("h")?.toLowerCase().slice(0, 253) ?? "";
  const slug = /^[a-z0-9.-]+$/.test(host) ? await domainForHost(host) : null;
  return NextResponse.json({ slug }, { headers: { "Cache-Control": "no-store" } });
}
