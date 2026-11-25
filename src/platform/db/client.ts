import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { env } from "@/platform/env";

/**
 * Driver-agnostic database handle. Repos take this type, so the same repo code runs on
 * node-postgres in production and on PGlite in integration tests (see test-db.ts).
 */
export type Db = PgDatabase<PgQueryResultHKT>;

// Next dev reloads modules on every change; keep one pool per process instead of one per reload.
const globalForDb = globalThis as typeof globalThis & { pgPool?: Pool };
const pool = globalForDb.pgPool ?? new Pool({ connectionString: env.DATABASE_URL, max: 5 });
if (env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db: Db = drizzle({ client: pool });
