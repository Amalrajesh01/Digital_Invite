import { assertSameOrigin, fail, ok } from "@/lib/http";
import { deleteGift, getGiftForOwner, saveGift } from "@/domain/gifts/service";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const token = (req: Request) => req.headers.get("x-gift-token") ?? "";

/** The gift as its maker sees it. A wrong secret gets the same answer as a gift that does not exist. */
export async function GET(req: Request, { params }: Ctx) {
  try {
    return ok(await getGiftForOwner((await params).id, token(req)));
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    return ok(await saveGift((await params).id, token(req), await req.json()));
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}

/** Deletes the gift and every photograph in it, immediately and for good. */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    await deleteGift((await params).id, token(req));
    return ok({ deleted: true });
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}
