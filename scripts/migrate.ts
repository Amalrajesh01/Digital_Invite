import { getDb, closeDb } from "../src/db/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (url && /^postgres/.test(url)) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url, { max: 1, prepare: false });
    await migrate(drizzle({ client }), { migrationsFolder: "drizzle" });
    await client.end();
    console.log("✔ migrated PostgreSQL");
    return;
  }
  await getDb(); // embedded database migrates on connect
  await closeDb();
  console.log("✔ migrated embedded database (.data/pg)");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
