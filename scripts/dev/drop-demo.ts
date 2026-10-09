/**
 * Deletes one sample invitation (and everything that belongs to it) so that `SEED_ONLY=<slug> npm run db:seed` can
 * create it again — for when a sample's configuration has changed.   npm run demo:drop -- <slug> [<slug> …]
 * Only invitations marked as demonstrations can be dropped this way; a customer's invitation never can.
 */
import { and, eq, inArray } from "drizzle-orm";
import { closeDb, getDb, schema } from "../../src/db/client";

async function main() {
  const slugs = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  if (!slugs.length) throw new Error("Usage: npm run demo:drop -- <slug> [<slug> …]");
  const db = await getDb();
  const rows = await db.select({ id: schema.weddings.id, slug: schema.weddings.slug }).from(schema.weddings).where(and(inArray(schema.weddings.slug, slugs), eq(schema.weddings.isDemo, true)));
  for (const slug of slugs) {
    const hit = rows.find((r) => r.slug === slug);
    if (!hit) {
      console.log(`  • ${slug}: no demonstration invitation with that slug — left alone`);
      continue;
    }
    await db.delete(schema.weddings).where(eq(schema.weddings.id, hit.id));
    console.log(`  ✔ ${slug}: dropped`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
