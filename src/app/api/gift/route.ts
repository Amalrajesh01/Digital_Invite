import { createHash } from "node:crypto";
import { z } from "zod";
import { assertSameOrigin, clientIp, fail, ok } from "@/lib/http";
import { createGift } from "@/domain/gifts/service";
import { LOVE_OCCASIONS } from "@/domain/love/constants";

export const dynamic = "force-dynamic";

/** Starts a gift. Returns its id and the maker's secret — the only time the secret is ever shown by the server. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const { occasion, scenario } = z.object({ occasion: z.enum(LOVE_OCCASIONS).optional(), scenario: z.string().max(60).optional() }).refine((b) => !!b.occasion || !!b.scenario, "Choose what it is for.").parse(await req.json());
    const ipKey = createHash("sha256").update(clientIp(req)).digest("hex").slice(0, 16);
    return ok(await createGift({ occasion, scenario, ipKey }));
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}
