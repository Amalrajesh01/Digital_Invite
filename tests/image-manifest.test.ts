import { describe, expect, it } from "vitest";
import { CASTING, manifestFor } from "@/domain/imagery/casting";
import { checkManifest } from "@/domain/imagery/check";
import { CINEMATIC_SPECS } from "@/domain/design/template-specs-cinematic";

describe("the image manifest of the cinematic wedding templates", () => {
  it("casts every template, and every template's sample is cast", () => {
    for (const s of CINEMATIC_SPECS) expect(CASTING[s.slug], s.slug).toBeTruthy();
    expect(Object.keys(CASTING).sort()).toEqual(CINEMATIC_SPECS.map((s) => s.slug).sort());
  });

  it("gives every template a hero of its own and describes every assignment", () => {
    const heroes = Object.values(CASTING).map((c) => c.hero);
    expect(new Set(heroes).size).toBe(heroes.length);
    for (const id of Object.keys(CASTING)) {
      const rows = manifestFor(id);
      expect(rows.length, id).toBeGreaterThan(12);
      for (const r of rows) { expect(r.alt, `${id} ${r.stock}`).not.toBe(""); expect(r.purpose, `${id} ${r.assetType}`).not.toBe(""); expect(r.usage).toBe("demo-template"); }
      expect(rows.find((r) => r.assetType === "hero")?.purpose.length, id).toBeGreaterThan(40);
    }
  });

  it("passes the quality gate: files present, large enough, licensed, described, no shared hero", async () => {
    const errors = (await checkManifest()).filter((f) => f.level === "error");
    expect(errors.map((f) => `${f.templateId} ${f.stock} ${f.message}`)).toEqual([]);
  }, 60_000);
});
