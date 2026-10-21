/**
 * Is Cloudinary connected? Checks the credentials against the account and prints plan and usage. Never prints the secret.
 *
 *   npm run cloudinary:check            # connectivity + usage
 *   npm run cloudinary:check -- --smoke # also uploads a tiny test image, serves it, replaces nothing, and deletes it
 *
 * Reads .env.local (or the environment). Exit code 1 when anything is wrong.
 */
try { process.loadEnvFile(".env.local"); } catch { /* the variables may come from the real environment */ }
import sharp from "sharp";
import { env } from "../src/lib/env";
import { deliveryUrl, destroyImage, fetchOriginal, ping, probeImage, uploadImage, usage } from "../src/lib/cloudinary";

const mb = (n: number | null) => (n == null ? "?" : `${(n / 1024 / 1024).toFixed(1)} MB`);
const c = env.cloudinary;

async function main() {
  if (!c.configured) {
    console.error("✖ Not configured. Missing:", [!c.cloudName && "CLOUDINARY_CLOUD_NAME", !c.apiKey && "CLOUDINARY_API_KEY", !c.apiSecret && "CLOUDINARY_API_SECRET"].filter(Boolean).join(", "));
    console.error("  Cloudinary dashboard → Settings → API Keys (or the \"Product Environment Credentials\" panel). Put them in .env.local.");
    process.exit(1);
  }
  console.log(`cloud name : ${c.cloudName}`);
  console.log(`api key    : …${c.apiKey.slice(-4)}`);
  console.log(`folder     : ${c.folder}/`);
  await ping();
  console.log("✔ credentials accepted (api.ping)");
  const u = await usage();
  console.log(`plan       : ${u.plan}`);
  console.log(`credits    : ${u.creditsUsed ?? "?"} of ${u.creditsLimit ?? "?"} used (${u.creditsUsedPercent ?? "?"}%)`);
  console.log(`storage    : ${mb(u.storageBytes)}   bandwidth: ${mb(u.bandwidthBytes)}   transformations: ${u.transformations ?? "?"}   assets: ${u.resources ?? "?"}`);
  if (u.creditsUsedPercent != null && u.creditsUsedPercent >= 80) console.warn("⚠ the account is above 80% of its monthly credits — a bulk migration may not fit");

  if (!process.argv.includes("--smoke")) return;
  const id = `${c.folder}/_smoke/${Date.now().toString(36)}`;
  const png = await sharp({ create: { width: 320, height: 200, channels: 3, background: { r: 48, g: 86, b: 211 } } }).webp().toBuffer();
  try {
    const up = await uploadImage(id, png, { tags: [`${c.folder}-smoke`] });
    console.log(`✔ uploaded ${up.publicId} (${up.width}x${up.height}, ${up.bytes} bytes, version ${up.version})`);
    const again = await uploadImage(id, png);
    console.log(again.existing ? "✔ repeating the upload did not create a duplicate" : "✖ repeated upload overwrote or duplicated");
    const probe = await probeImage(id);
    console.log(probe.ok ? `✔ delivers as ${probe.contentType}` : `✖ delivery failed (${probe.status})`);
    const sized = await fetch(deliveryUrl(id, { width: 160, version: up.version }));
    const got = Buffer.from(await sized.arrayBuffer());
    const meta = await sharp(got).metadata();
    console.log(sized.ok && (meta.width ?? 0) <= 160 ? `✔ transformed delivery works (${sized.headers.get("content-type")}, ${meta.width}px wide)` : `✖ transformed delivery failed (${sized.status})`);
    const orig = await fetchOriginal(id);
    console.log(orig && orig.data.equals(png) ? "✔ original bytes read back identical" : "✖ original differs from what was uploaded");
  } finally {
    const removed = await destroyImage(id).catch((e) => (console.error("cleanup failed:", e.message), false));
    console.log(removed ? "✔ test image deleted" : "⚠ test image was not deleted — remove folder _smoke in the Media Library");
  }
}

main().catch((e) => {
  console.error("✖", e instanceof Error ? e.message : e);
  process.exit(1);
});
