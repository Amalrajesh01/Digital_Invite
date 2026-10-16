import { z } from "zod";
import { assertSameOrigin, fail, ok } from "@/lib/http";
import { setGiftLive } from "@/domain/gifts/service";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Pause the link (it stops working at once), switch it back on, or publish the latest changes. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    const { action } = z.object({ action: z.enum(["pause", "resume", "update"]) }).parse(await req.json());
    await setGiftLive((await params).id, req.headers.get("x-gift-token") ?? "", action);
    return ok({ done: true });
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}
