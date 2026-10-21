/**
 * End-to-end check against the REAL Cloudinary account, using a throwaway in-memory database (your data is not touched):
 * upload → delivery at every size → gallery → replace → unauthorised upload refused → delete → nothing left on Cloudinary.
 *
 *   npm run cloudinary:e2e
 *
 * Uses a handful of uploads and transformations (a fraction of one credit) and removes everything it created.
 */
try { process.loadEnvFile(".env.local"); } catch { /* the variables may come from the real environment */ }
process.env.DATABASE_URL = "memory://";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { env } from "../src/lib/env";
import { imageExists, probeImage } from "../src/lib/cloudinary";
import { bootstrap, firstTemplateAndTheme, pngBuffer } from "../tests/helpers";
import { createWedding, purgeWedding } from "../src/domain/wedding/service";
import { addToAlbum, deleteMedia, loadPublicGallery, replaceImage, saveAlbum, toResolved, uploadAsUser } from "../src/domain/media/service";
import { closeDb } from "../src/db/client";

process.env.STORAGE_LOCAL_DIR = path.join(os.tmpdir(), `sbl-cloudinary-e2e-${Date.now()}`);

let failures = 0;
const check = (ok: boolean, what: string, extra = "") => {
  console.log(`${ok ? "✔" : "✖"} ${what}${extra ? `  (${extra})` : ""}`);
  if (!ok) failures++;
};
const fetchOk = async (url: string) => {
  const r = await fetch(url, { headers: { Accept: "image/avif,image/webp,*/*" } });
  const b = Buffer.from(await r.arrayBuffer());
  const m = r.ok ? await sharp(b).metadata().catch(() => null) : null;
  return { ok: r.ok && !!m, status: r.status, type: r.headers.get("content-type") ?? "", width: m?.width ?? 0, bytes: b.length };
};

async function main() {
  if (!env.cloudinary.configured) throw new Error("Cloudinary is not configured. Run `npm run cloudinary:check` first.");
  const admin = await bootstrap();
  const { templateId, themeId } = await firstTemplateAndTheme();
  const w = await createWedding(admin, { title: "E2E check", packageKey: "SIGNATURE", templateId, themeId });
  check(w.mediaStorage === "cloudinary", "a new invitation stores its photographs on Cloudinary", `media_storage=${w.mediaStorage}`);
  const created: string[] = [];
  try {
    const up = (buf: Buffer, category: "COUPLE" | "GALLERY" = "GALLERY") => uploadAsUser(admin, w.id, { buffer: buf, filename: "e2e.png" }, { category });

    // 1 · a customer photograph
    const hero = await up(await pngBuffer(2400, 1600, { r: 190, g: 90, b: 60 }), "COUPLE");
    created.push(hero.storageKey);
    check(hero.provider === "cloudinary" && hero.storageKey.startsWith(`${env.cloudinary.folder}/projects/${w.id}/`), "upload lands on Cloudinary under the invitation's own folder", hero.storageKey);
    const r = toResolved(hero);
    check(r.url.startsWith(`https://res.cloudinary.com/${env.cloudinary.cloudName}/`), "the app hands out Cloudinary delivery URLs");
    for (const part of (r.srcSet ?? "").split(/,\s+/)) {
      const [url, w1] = part.split(" ");
      const got = await fetchOk(url);
      const want = parseInt(w1, 10);
      check(got.ok && got.width <= want && got.width > 0, `delivery at ${w1}`, `${got.status} ${got.type} ${got.width}px ${got.bytes} bytes`);
    }

    // 2 · a gallery, as a guest's phone would load it
    const album = await saveAlbum(admin, w.id, { title: { en: "Gallery" } });
    const shots = [];
    for (const c of [{ r: 20, g: 120, b: 80 }, { r: 40, g: 60, b: 160 }, { r: 150, g: 40, b: 120 }]) {
      const s = await up(await pngBuffer(1800, 1200, c));
      created.push(s.storageKey);
      shots.push(s);
    }
    await addToAlbum(admin, w.id, album.id, shots.map((s) => s.id));
    const gallery = await loadPublicGallery(w.id);
    const items = gallery.flatMap((a) => a.items);
    check(items.length === 3 && items.every((i) => i.url.includes("res.cloudinary.com")), "a gallery of 3 photographs is served from Cloudinary", `${items.length} items`);

    // 3 · replace one: a new image is stored first, the row moves to it, the old one is released
    const oldKey = shots[0].storageKey;
    const swapped = await replaceImage(admin, w.id, shots[0].id, await pngBuffer(1500, 1000, { r: 250, g: 250, b: 10 }));
    created.push(swapped.storageKey);
    check(swapped.storageKey === `${oldKey}-r1`, "replacing uploads to a new id", swapped.storageKey);
    check((await probeImage(swapped.storageKey)).ok, "the replacement is served");
    check(!(await imageExists(oldKey)), "the old image was released (nothing else used it)");
    check((await probeImage(shots[1].storageKey)).ok && (await probeImage(hero.storageKey)).ok, "every other photograph is untouched");

    // 4 · who may upload
    await uploadAsUser(null, w.id, { buffer: await pngBuffer(), filename: "x.png" }, { category: "GALLERY" }).then(
      () => check(false, "a signed-out upload is refused"),
      () => check(true, "a signed-out upload is refused"),
    );
    await up(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>".padEnd(40))).then(
      () => check(false, "an SVG is refused"),
      () => check(true, "an SVG is refused before it leaves the server"),
    );

    // 5 · delete
    await deleteMedia(admin, w.id, hero.id);
    check(!(await imageExists(hero.storageKey)), "deleting a photograph removes it from Cloudinary");
  } finally {
    // removing the invitation removes every image it still owns
    await purgeWedding(w.id).catch((e) => console.error("cleanup:", e.message));
    let left = 0;
    for (const k of created) if (await imageExists(k).catch(() => true)) left++;
    check(left === 0, "after deleting the invitation nothing it uploaded is left on Cloudinary", left ? `${left} left in ${env.cloudinary.folder}/projects/${w.id}` : "");
  }
}

main()
  .catch((e) => {
    console.error("✖", e instanceof Error ? e.message : e);
    failures++;
  })
  .finally(async () => {
    await closeDb();
    console.log(failures ? `\n✖ ${failures} check(s) failed` : "\n✔ all checks passed");
    process.exit(failures ? 1 : 0);
  });
