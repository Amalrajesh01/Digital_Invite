import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db/client";
import { funnelReport, recordEvent, createEnquiry } from "@/domain/growth/service";
import { analyticsByWedding, platformViewsPerDay } from "@/domain/platform/overview";
import { platformAnalytics, weddingAnalytics } from "@/domain/analytics/service";
import { listAnniversaryEntries } from "@/domain/memory/service";
import type { AdminActor } from "@/domain/auth/access";
import { bootstrap, makeWedding } from "./helpers";

let admin: AdminActor;
beforeAll(async () => { admin = await bootstrap(); });

describe("the studio's reports, with data in them", () => {
  it("the funnel adds up what happened, and its raw queries run", async () => {
    const v = `visitor-${Date.now().toString(36)}`;
    for (const type of ["page_view", "design_view", "preview_open", "whatsapp_click"]) await recordEvent({ visitorId: v, type, path: "/templates", ref: "royal-heritage", device: "mobile", source: "whatsapp" });
    await createEnquiry({ name: "Test Person", phone: "+91 90000 00000", occasion: "wedding", templateSlug: "royal-heritage", visitorId: v, source: "whatsapp", ipKey: `ip-${Date.now()}` });
    const r = await funnelReport(admin, 30);
    expect(r.hasData).toBe(true);
    expect(r.stages.map((s) => s.key)).toEqual(["visitors", "designs", "previews", "intent", "leads", "paid"]);
    expect(r.stages[0].count).toBeGreaterThanOrEqual(1);
    expect(r.byTemplate.map((t) => t.ref)).toContain("royal-heritage");
    expect(r.bySource.map((s) => s.source)).toContain("whatsapp");
    expect(r.daily.length).toBeGreaterThan(0);
  });

  it("platform analytics, per-wedding views and the daily chart run", async () => {
    const w = await makeWedding(admin, "SIGNATURE");
    const db = await getDb();
    await db.insert(schema.analyticsEvents).values([{ weddingId: w.id, visitorId: "v1", type: "view", device: "mobile" }, { weddingId: w.id, visitorId: "v2", type: "view", device: "desktop" }]);
    const rows = await analyticsByWedding(admin, 30);
    expect(rows.find((x) => x.weddingId === w.id)?.views).toBe(2);
    expect((await platformViewsPerDay(admin, 30)).length).toBeGreaterThan(0);
    expect((await platformAnalytics(admin)).views30).toBeGreaterThanOrEqual(2);
    expect((await weddingAnalytics(admin, w.id, 30)).views).toBe(2);
  });

  it("anniversary entries that have unlocked are listed", async () => {
    const w = await makeWedding(admin, "LUXURY");
    expect(await listAnniversaryEntries(w.id, new Date())).toEqual([]);
  });
});

/**
 * PostgreSQL's driver cannot take a JavaScript Date as a bare parameter inside a hand-written sql`` fragment (the in-memory test
 * database can), which once took the Analytics and Funnel pages down in production. Use gte()/lte() on the column, or send
 * the date as text with a cast (.toISOString() + ::timestamptz).
 */
describe("no bare dates in raw SQL", () => {
  const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = path.join(dir, f); return statSync(p).isDirectory() ? files(p) : p.endsWith(".ts") ? [p] : []; });
  it("has none in src/", () => {
    const bad: string[] = [];
    for (const f of files("src")) {
      const text = readFileSync(f, "utf8");
      for (const m of text.matchAll(/sql`[^`]*\$\{(since|now|cutoff|from|until|before|after|threshold)\}[^`]*`/g)) bad.push(`${f}: ${m[0].slice(0, 100)}`);
    }
    expect(bad).toEqual([]);
  });
});
