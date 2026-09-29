import { describe, expect, it } from "vitest";
import { getDb, schema } from "@/db/client";
import { sql } from "drizzle-orm";

describe("database", () => {
  it("connects to embedded Postgres and applies migrations", async () => {
    const db = await getDb();
    const res = await db.execute(sql`select count(*)::int as n from ${schema.weddings}`);
    expect((res as any).rows[0].n).toBe(0);
  });
});
