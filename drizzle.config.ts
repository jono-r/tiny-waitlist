import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next, so it does not load .env.local by itself.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  dialect: "postgresql",
  // Each module owns its tables in <module>.table.ts. Add nothing here when adding a module.
  schema: ["./src/modules/*/*.table.ts", "./src/platform/auth/auth.table.ts"],
  out: "./src/platform/db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
