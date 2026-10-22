import { open, stat } from "node:fs/promises";
import path from "node:path";
import { libraryTrack } from "@/domain/music/library";

/**
 * A library track for the picker's preview: only the files the catalogue names, with byte ranges (iOS Safari will not play
 * audio without them). Immutable and public: these are the product's own bundled files, not anyone's upload.
 */
const DIR = path.join(process.cwd(), "assets", "music");
const HEADERS = { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000, immutable" };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = libraryTrack(id);
  if (!track) return new Response("Not found", { status: 404 });
  const file = path.join(DIR, track.file);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  let start = 0, end = size - 1, status = 200;
  if (m && (m[1] || m[2])) {
    start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    status = 206;
  }
  const fh = await open(file, "r");
  try {
    const buf = Buffer.alloc(end - start + 1);
    await fh.read(buf, 0, buf.length, start);
    return new Response(new Uint8Array(buf), { status, headers: { ...HEADERS, "Content-Length": String(buf.length), ...(status === 206 ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}) } });
  } finally {
    await fh.close();
  }
}
