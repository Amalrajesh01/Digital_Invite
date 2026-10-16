import { z } from "zod";
import { assertSameOrigin, fail, ok } from "@/lib/http";
import { submitGift } from "@/domain/gifts/service";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** The maker sends the gift to us to publish, and tells us where to reach them. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    const body = z.object({ name: z.string().max(80), phone: z.string().max(24) }).parse(await req.json());
    return ok(await submitGift((await params).id, req.headers.get("x-gift-token") ?? "", body));
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}
