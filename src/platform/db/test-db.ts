import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "@/platform/db/client";

/**
 * A fresh in-memory Postgres (PGlite) with every migration applied. Integration tests only.
 * Create one per test file in `beforeAll` and `close()` it in `afterAll`. No Docker, no network.
 */
export async function createTestDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle({ client });
  await migrate(db, { migrationsFolder: join(import.meta.dirname, "migrations") });
  return { db, close: () => client.close() };
}
