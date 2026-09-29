import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    pool: "forks",
    env: { DATABASE_URL: "memory://", APP_SECRET: "test-secret-test-secret-test-secret-123", STORAGE_DRIVER: "local", APP_URL: "http://localhost:3000" },
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
});
