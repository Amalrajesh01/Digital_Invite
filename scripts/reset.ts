/**
 * Wipes the LOCAL embedded database and uploaded media so you can re-run `npm run setup` from scratch.
 * It refuses to run against a hosted PostgreSQL (DATABASE_URL) — resetting production is never a script.
 * Stop `npm run dev` first: the embedded database is locked while the app is running.
 */
import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

function main() {
  if (process.env.DATABASE_URL) {
    console.error("✖ DATABASE_URL is set. Refusing to reset a hosted database.");
    process.exit(1);
  }
  const data = path.resolve(".data");
  const media = path.resolve(process.env.STORAGE_LOCAL_DIR || "storage");
  if (existsSync(data)) {
    rmSync(data, { recursive: true, force: true });
    console.log("✔ cleared .data");
  }
  if (existsSync(media)) {
    for (const f of readdirSync(media)) if (f !== ".gitkeep") rmSync(path.join(media, f), { recursive: true, force: true });
    console.log("✔ cleared", path.relative(process.cwd(), media));
  }
  console.log("Now run: npm run setup");
}
main();
