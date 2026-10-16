import { createHash } from "node:crypto";
import { z } from "zod";
import { assertSameOrigin, clientIp, fail, ok } from "@/lib/http";
import { createEnquiry } from "@/domain/growth/service";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().max(80), phone: z.string().max(24), occasion: z.string().max(40).optional(), templateSlug: z.string().max(60).optional(), eventDate: z.string().max(10).optional(),
  message: z.string().max(600).optional(), visitorId: z.string().max(40).optional(), source: z.string().max(60).optional(), website: z.string().max(200).optional(),
});

/** “Make this for me”: a short request that lands in the studio’s Enquiries list. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = Body.parse(await req.json());
    // a hidden field only scripts fill in
    if (body.website) return ok({ id: "", ref: "" });
    const ipKey = createHash("sha256").update(clientIp(req)).digest("hex").slice(0, 16);
    return ok(await createEnquiry({ ...body, ipKey }));
  } catch (e) {
    return fail(e, { area: "enquiry" });
  }
}
