/**
 * Copies every file in the local media folder to the configured S3 bucket under the same keys,
 * so you can switch STORAGE_DRIVER from "local" to "s3" without losing existing photos.
 *
 *   STORAGE_DRIVER=s3 S3_BUCKET=… S3_REGION=… S3_ACCESS_KEY_ID=… S3_SECRET_ACCESS_KEY=… npm run storage:sync
 *
 * Safe to re-run: existing objects are overwritten with identical bytes. Nothing is deleted locally.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { env } from "../src/lib/env";
import { storage } from "../src/lib/storage";

if (env.storageDriver !== "s3") {
  console.error("✖ Set STORAGE_DRIVER=s3 and the S3_* variables first.");
  process.exit(1);
}
const root = path.resolve(process.env.STORAGE_LOCAL_DIR || "storage");
const MIME: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".ogg": "audio/ogg" };

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (name !== ".gitkeep") yield full;
  }
}

let n = 0;
for (const file of walk(root)) {
  const key = path.relative(root, file).split(path.sep).join("/");
  await storage().put(key, readFileSync(file), MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream");
  if (++n % 25 === 0) console.log(`  …${n} files`);
}
console.log(`✔ uploaded ${n} files to s3://${env.s3.bucket}`);
