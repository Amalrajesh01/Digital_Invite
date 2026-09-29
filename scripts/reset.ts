/**
 * Wipes the LOCAL embedded database and uploaded media so you can re-run `npm run setup` from scratch.
 * It refuses to run against a hosted PostgreSQL (DATABASE_URL) — resetting production is never a script.
 * Stop `npm run dev` first: the embedded database is locked while the app is running.
 */
import { rmSync, existsSync } from "node:fs";
import path from "node:path";

if (process.env.DATABASE_URL) {
  console.error("✖ DATABASE_URL is set. Refusing to reset a hosted database.");
  process.exit(1);
}
for (const dir of [path.resolve(".data"), path.resolve(process.env.STORAGE_LOCAL_DIR || "storage")]) {
  if (!existsSync(dir)) continue;
  if (path.basename(dir) === "storage") {
    // keep the .gitkeep placeholder
    const { readdirSync } = await import("node:fs");
    for (const f of readdirSync(dir)) if (f !== ".gitkeep") rmSync(path.join(dir, f), { recursive: true, force: true });
  } else rmSync(dir, { recursive: true, force: true });
  console.log("✔ cleared", path.relative(process.cwd(), dir));
}
console.log("Now run: npm run setup");
