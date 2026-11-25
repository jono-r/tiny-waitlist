import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    passWithNoTests: false,
    // Placeholder config so src/platform/env.ts validates under test. Never real values.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgres://test:test@127.0.0.1:1/test",
      BETTER_AUTH_SECRET: "test-only-secret-test-only-secret-0000",
      BETTER_AUTH_URL: "http://localhost:3000",
      LOG_LEVEL: "silent",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.integration.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.ts"],
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
