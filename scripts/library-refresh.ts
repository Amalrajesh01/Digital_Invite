/**
 * Brings the built-in templates and themes of an EXISTING database up to date with the code
 * (see refreshBuiltInLibrary). Safe to re-run; rows edited in the studio are never touched.
 *   npm run library:refresh
 */
import { eq } from "drizzle-orm";
import { closeDb, getDb, schema } from "../src/db/client";
import { loadActorForUser } from "../src/domain/auth/access";
import { refreshBuiltInLibrary } from "../src/domain/design/service";

async function main() {
  const db = await getDb();
  const [owner] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "SUPER_ADMIN")).limit(1);
  const actor = owner ? await loadActorForUser(owner.id) : null;
  const r = await refreshBuiltInLibrary(actor);
  console.log(`updated (${r.updated.length}):         ${r.updated.join(", ") || "—"}`);
  console.log(`already current (${r.unchanged.length}): ${r.unchanged.join(", ") || "—"}`);
  console.log(`edited in studio, left alone (${r.skippedEdited.length}): ${r.skippedEdited.join(", ") || "—"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
