import { assertSameOrigin, assertUploadSize, fail, ok } from "@/lib/http";
import { invalid } from "@/lib/errors";
import { setGiftMusic } from "@/domain/gifts/service";
import { MUSIC_ID } from "@/domain/music/library";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Ctx = { params: Promise<{ id: string }> };
const token = (req: Request) => req.headers.get("x-gift-token") ?? "";

/** One song, supplied by the maker (who must have the right to share it). Nothing ever plays by itself. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    // a song from the licensed library is chosen by name; anything else is the maker's own file
    if ((req.headers.get("content-type") ?? "").includes("application/json")) {
      const { library } = (await req.json()) as { library?: string };
      if (typeof library !== "string" || !MUSIC_ID.test(library)) throw invalid("Please choose a song from the list.");
      return ok({ music: await setGiftMusic((await params).id, token(req), { library }) });
    }
    assertUploadSize(req);
    const file = (await req.formData()).get("file");
    if (!(file instanceof File) || file.size === 0) throw invalid("Please choose an audio file.");
    return ok({ music: await setGiftMusic((await params).id, token(req), { buffer: Buffer.from(await file.arrayBuffer()), filename: file.name }) });
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    assertSameOrigin(req);
    await setGiftMusic((await params).id, token(req), null);
    return ok({ music: null });
  } catch (e) {
    return fail(e, { area: "gift" });
  }
}
