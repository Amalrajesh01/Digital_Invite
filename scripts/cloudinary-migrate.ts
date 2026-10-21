/**
 * Moves existing photographs (templates' samples and customers' invitations) from the old store to Cloudinary. See docs/CLOUDINARY.md.
 *
 *   npm run cloudinary:migrate -- --exclusions                    # who is protected, and why (read-only)
 *   npm run cloudinary:migrate                                    # dry run: read + check every photograph, write nothing
 *   npm run cloudinary:migrate -- --apply --limit-weddings 1      # a first small sample
 *   npm run cloudinary:migrate -- --apply                         # everything eligible
 *   npm run cloudinary:migrate -- --verify                        # is every migrated photograph still served?
 *   npm run cloudinary:migrate -- --rollback --wedding <id|address>
 *
 * Options: --scope templates|projects|all   --wedding <id|address> (repeatable)   --concurrency N
 * Safety gates for --apply: --db-backup-confirmed (required for a hosted PostgreSQL), --allow-zero-exclusions (required if the protected
 * invitations are not found in this database), --ignore-usage (continue even if the account is above 90% of its monthly credits).
 * Nothing is ever deleted from the old store or from Cloudinary.
 */
try { process.loadEnvFile(".env.local"); } catch { /* the variables may come from the real environment */ }
import { appendFileSync, cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { eq, or } from "drizzle-orm";
import { closeDb, getDb, schema } from "../src/db/client";
import { env } from "../src/lib/env";
import { ping, usage } from "../src/lib/cloudinary";
import { findExcluded, migrate, rollbackWedding, verifyMigrated, type AssetResult } from "../src/domain/media/cloud-migrate";

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const values = (f: string) => args.flatMap((a, i) => (a === f && args[i + 1] ? [args[i + 1]] : []));
const one = (f: string) => values(f)[0];
const die = (m: string): never => (console.error(`✖ ${m}`), process.exit(1));
const hosted = /^postgres(ql)?:\/\//.test(env.databaseUrl);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.resolve(".data", "cloudinary-migration");
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

async function showExclusions() {
  const ex = await findExcluded(await getDb());
  console.log(`\nProtected invitations (never read for migration, never written): ${ex.length}`);
  for (const e of ex) console.log(`  • ${e.slug}  "${e.title}"  ${e.assets} files  [${e.reasons.join("; ")}]`);
  if (!ex.length) console.log("  (none found in this database)");
  return ex;
}

async function main() {
  console.log(`database: ${hosted ? "hosted PostgreSQL" : "embedded (.data/pg)"}`);

  if (has("--exclusions")) return void (await showExclusions());

  if (has("--rollback")) {
    const key = one("--wedding") ?? die("--rollback needs --wedding <id|address>");
    const db = await getDb();
    const isId = /^[0-9a-f-]{36}$/i.test(key);
    const [w] = await db.select({ id: schema.weddings.id, slug: schema.weddings.slug }).from(schema.weddings).where(isId ? or(eq(schema.weddings.id, key), eq(schema.weddings.slug, key)) : eq(schema.weddings.slug, key));
    if (!w) die(`no invitation "${key}"`);
    const r = await rollbackWedding(db, w.id);
    console.log(`✔ ${w.slug}: ${r.restored} photographs pointed back at the old store, ${r.keptOnCloudinary} left on Cloudinary (edited or added since). Nothing was deleted.`);
    return;
  }

  if (has("--verify")) {
    if (!env.cloudinary.cloudName) die("CLOUDINARY_CLOUD_NAME is not set.");
    const r = await verifyMigrated(await getDb(), (id, why) => console.log(`  ✖ ${id}: ${why}`));
    console.log(`${r.bad ? "✖" : "✔"} ${r.checked} migrated photographs checked, ${r.bad} not served`);
    if (r.bad) process.exitCode = 1;
    return;
  }

  const apply = has("--apply");
  const scope = (one("--scope") ?? "all") as "all" | "templates" | "projects";
  if (!["all", "templates", "projects"].includes(scope)) die("--scope must be templates, projects or all");
  if (apply && !env.cloudinary.configured) die("Cloudinary is not configured (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).");

  if (apply) {
    await ping();
    const u = await usage();
    console.log(`Cloudinary: ${u.plan} plan, ${u.creditsUsed ?? "?"} of ${u.creditsLimit ?? "?"} credits used (${u.creditsUsedPercent ?? "?"}%)`);
    if ((u.creditsUsedPercent ?? 0) >= 90 && !has("--ignore-usage")) die("The account is above 90% of its monthly credits. Free some space or pass --ignore-usage.");
    if (hosted && !has("--db-backup-confirmed")) die("This is a hosted database. Take a backup first (pg_dump, see docs/CLOUDINARY.md) and pass --db-backup-confirmed.");
    if (!hosted) {
      const src = path.resolve(process.env.PGLITE_DIR || path.join(".data", "pg"));
      if (existsSync(src)) {
        const dest = `${src}.backup-before-cloudinary-${stamp}`;
        cpSync(src, dest, { recursive: true });
        console.log(`✔ backed up the embedded database to ${path.relative(process.cwd(), dest)}`);
      }
    }
  }

  const ex = await showExclusions();
  if (apply && !ex.length && !has("--allow-zero-exclusions")) {
    die("No protected invitations were found in this database. If that is right (a copy without them), pass --allow-zero-exclusions; if not, you are probably pointed at the wrong database.");
  }

  mkdirSync(outDir, { recursive: true });
  const mapping = path.join(outDir, `${stamp}-mapping.jsonl`);
  if (apply) {
    // every photograph's reference as it is before anything changes (the rows also keep it in metadata.legacy)
    const db = await getDb();
    const rows = await db.select({ id: schema.mediaAssets.id, weddingId: schema.mediaAssets.weddingId, provider: schema.mediaAssets.provider, storageKey: schema.mediaAssets.storageKey, metadata: schema.mediaAssets.metadata }).from(schema.mediaAssets);
    writeFileSync(path.join(outDir, `${stamp}-before.json`), JSON.stringify(rows));
    console.log(`✔ saved ${rows.length} original references to .data/cloudinary-migration/${stamp}-before.json`);
  }

  let n = 0;
  const report = await migrate({
    apply,
    scope,
    only: values("--wedding"),
    limitWeddings: one("--limit-weddings") ? Number(one("--limit-weddings")) : undefined,
    concurrency: one("--concurrency") ? Number(one("--concurrency")) : 3,
    onAsset: (r: AssetResult) => {
      if (r.outcome === "migrated") appendFileSync(mapping, `${JSON.stringify({ assetId: r.assetId, weddingId: r.weddingId, from: r.from, to: r.to, sha256: r.sha256 })}\n`);
      if (++n % 25 === 0) console.log(`  …${n} photographs`);
    },
  });
  const reportFile = path.join(outDir, `${stamp}-report.json`);
  writeFileSync(reportFile, JSON.stringify(report, null, 2));

  const a = report.assets;
  console.log(`\n${apply ? "MIGRATION" : "DRY RUN"} (${scope})`);
  console.log(`invitations : ${report.weddings.total} total · ${report.weddings.excluded} protected · ${report.weddings.gifts} gifts · ${report.weddings.alreadyCloudinary} already on Cloudinary · ${report.weddings.eligible} eligible · ${report.weddings.processed} processed · ${report.weddings.completed} switched to Cloudinary`);
  console.log(`photographs : ${apply ? `${a.migrated} migrated` : `${a.would_migrate} would migrate (${mb(a.bytes)})`} · ${a.already_cloudinary} already there · ${a.skipped_private} private/guest kept · ${a.skipped_not_image} not images`);
  console.log(`problems    : ${a.missing_source} missing source · ${a.invalid_image} not an image · ${a.upload_failed} upload failed · ${a.verify_failed} verify failed · ${a.db_failed} db failed`);
  console.log(`duplicates  : ${a.duplicateGroups} identical pictures seen more than once (${a.duplicateExtraCopies} extra copies)`);
  console.log(`protected   : ${report.exclusions.length} invitations, ${a.rowsInExcludedWeddings} files — fingerprint before/after ${report.excludedFingerprint.unchanged ? "IDENTICAL (nothing written)" : "DIFFERENT — INVESTIGATE"}`);
  const bad = report.results.filter((r) => !["migrated", "would_migrate", "already_cloudinary", "skipped_not_image", "skipped_private"].includes(r.outcome));
  for (const r of bad.slice(0, 20)) console.log(`  ✖ ${r.outcome}  asset ${r.assetId}  ${r.from ?? ""}${r.error ? `  (${r.error})` : ""}`);
  if (bad.length > 20) console.log(`  … and ${bad.length - 20} more in the report`);
  console.log(`report: ${path.relative(process.cwd(), reportFile)}${apply ? `\nmapping old → new: ${path.relative(process.cwd(), mapping)}` : ""}`);
  if (!report.excludedFingerprint.unchanged) process.exitCode = 2;
  else if (bad.length) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("✖", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
