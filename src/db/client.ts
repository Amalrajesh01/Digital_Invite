import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { env } from "@/lib/env";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export { schema };

interface Holder {
  promise?: Promise<Db>;
  close?: () => Promise<void>;
}
const g = globalThis as unknown as { __sblDb?: Holder };
const holder: Holder = (g.__sblDb ??= {});

async function connect(): Promise<Db> {
  const url = env.databaseUrl;

  // Real PostgreSQL (Supabase, Neon, RDS …)
  if (url && url !== "memory://" && /^postgres(ql)?:\/\//.test(url)) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, { max: env.isProd ? 5 : 3, prepare: false, idle_timeout: 20 });
    holder.close = async () => {
      await client.end({ timeout: 2 });
    };
    const db = drizzle({ client, schema }) as unknown as Db;
    if (process.env.AUTO_MIGRATE === "true") await runMigrations(db, "postgres");
    return db;
  }

  // Embedded Postgres (PGlite): zero-setup development, demos and the test-suite.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const inMemory = url === "memory://";
  // PGLITE_DIR lets a second copy of the app (a QA server, a one-off script) use its own embedded database
  const dir = inMemory ? undefined : path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.PGLITE_DIR || path.join(".data", "pg"));
  if (dir) {
    const fs = await import("node:fs");
    fs.mkdirSync(path.dirname(dir), { recursive: true });
  }
  const client = dir ? new PGlite(dir) : new PGlite();
  await client.waitReady;
  holder.close = async () => {
    await client.close();
  };
  const db = drizzle({ client, schema }) as unknown as Db;
  await runMigrations(db, "pglite");
  return db;
}

async function runMigrations(db: Db, kind: "pglite" | "postgres") {
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  if (kind === "pglite") {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as never, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(db as never, { migrationsFolder });
  }
}

/** Lazily connects (and migrates the embedded database) once per process. */
export function getDb(): Promise<Db> {
  holder.promise ??= connect().catch((err) => {
    holder.promise = undefined;
    throw err;
  });
  return holder.promise;
}

export async function closeDb(): Promise<void> {
  if (holder.promise) {
    await holder.promise.catch(() => undefined);
    await holder.close?.();
    holder.promise = undefined;
  }
}

export async function migrateDatabase(): Promise<void> {
  await getDb();
}
