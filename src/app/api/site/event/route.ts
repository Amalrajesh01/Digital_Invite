import { z } from "zod";
import { assertSameOrigin, fail, ok } from "@/lib/http";
import { recordEvent } from "@/domain/growth/service";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|headless|lighthouse|preview|facebookexternalhit|slurp|curl|wget|python|node-fetch|axios/i;
const Body = z.object({ visitorId: z.string(), type: z.string(), path: z.string().optional(), ref: z.string().optional(), device: z.string().optional(), source: z.string().optional() });

/** One anonymous event from the public site (see `recordEvent`). Never fails loudly: analytics must not get in a visitor's way. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (BOT.test(req.headers.get("user-agent") ?? "")) return ok({ skipped: true });
    await recordEvent(Body.parse(await req.json()));
    return ok({ recorded: true });
  } catch (e) {
    return fail(e, { area: "site-event" });
  }
}
