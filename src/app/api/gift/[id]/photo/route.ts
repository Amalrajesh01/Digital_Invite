import { assertSameOrigin, assertUploadSize, fail, ok } from "@/lib/http";
import { invalid } from "@/lib/errors";
import { addGiftPhoto, removeGiftPhoto } from "@/domain/gifts/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Ctx = { params: Promise<{ id: string }> };
const token = (req: Request) => req.headers.get("x-gift-token") ?? "";

export async function POST(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    assertUploadSize(req);
    const file = (await req.formData()).get("file");
    if (!(file instanceof File) || file.size === 0) throw invalid("Please choose a photograph.");
    return ok({ media: await addGiftPhoto((await params).id, token(req), { buffer: Buffer.from(await file.arrayBuffer()), filename: file.name }) });
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    const asset = new URL(req.url).searchParams.get("asset") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(asset)) throw invalid("Choose a photograph to remove.");
    return ok({ love: await removeGiftPhoto((await params).id, token(req), asset) });
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}
