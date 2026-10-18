import { defineConfig } from "vitest/config";
import path from "node:path";
import os from "node:os";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    pool: "forks",
    // TEST_DATABASE_URL runs the whole suite on a real PostgreSQL (the production driver) instead of the in-memory PGlite: the two accept slightly different SQL
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "memory://", APP_SECRET: "test-secret-test-secret-test-secret-123", STORAGE_DRIVER: "local", STORAGE_LOCAL_DIR: path.join(os.tmpdir(), "sbl-test-storage"), APP_URL: "http://localhost:3000" },
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
});
