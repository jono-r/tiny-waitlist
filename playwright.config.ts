import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 3100;
const DB_PORT = 54329;
const baseURL = `http://localhost:${APP_PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // One command, no Docker: start an in-memory Postgres (PGlite), then run `e2e:app`, which
    // applies the real migrations, builds, and starts the production server against it.
    command: `pnpm exec pglite-server --db=memory:// --port=${DB_PORT} --max-connections=10 --run "pnpm e2e:app"`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: `postgres://postgres:postgres@127.0.0.1:${DB_PORT}/postgres?sslmode=disable`,
      BETTER_AUTH_SECRET: "e2e-only-secret-e2e-only-secret-0000",
      BETTER_AUTH_URL: baseURL,
      PORT: String(APP_PORT),
      LOG_LEVEL: "warn",
    },
  },
});
