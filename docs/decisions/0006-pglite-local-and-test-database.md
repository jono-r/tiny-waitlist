# 0006: PGlite for the test and local database, no Docker

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

`pnpm check` is the inner loop an agent runs dozens of times per task, on whatever machine the factory runs on (a laptop, a small VPS, possibly a Raspberry Pi). It must be fast and need nothing installed beyond Node. Repo tests still need a real Postgres: constraints, foreign keys and SQL behaviour are exactly what a fake hides. Docker was not installed on the machine this template was built on.

## Decision

- **Integration tests** run against PGlite (Postgres compiled to WebAssembly, in-process). `createTestDb()` in `src/platform/db/test-db.ts` creates a fresh in-memory database and applies the real migrations. One per test file.
- **Local development** uses `pnpm db:local`, which runs `pglite-server` (from `@electric-sql/pglite-socket`): PGlite behind the Postgres wire protocol on port 5433, data in `.pglite/`.
- **E2E** starts its own in-memory `pglite-server`, migrates it, builds and starts the app against it. One command, `pnpm e2e`.
- The application has one database driver, `pg`. It cannot tell PGlite-over-a-socket from hosted Postgres. Repos accept a driver-agnostic `Db`, which is what lets integration tests hand them PGlite directly.

## Alternatives considered

- **`docker-compose.yml` with Postgres:** the most faithful, but needs Docker running, adds seconds of startup, and is awkward on small machines and in agent sandboxes.
- **A shared cloud dev database:** network in the inner loop, state shared between runs, and a secret needed to run tests.
- **Mocking the database:** fast and proves nothing about queries.
- **A PGlite driver switch inside the app:** would put test infrastructure in the production code path.

## Consequences

- `pnpm check` needs no Docker, no network and no env file. The whole suite runs in a couple of seconds.
- PGlite is real Postgres but single-process: `pglite-server` multiplexes connections, does not support SSL (local URLs use `?sslmode=disable`), and is not a place to test concurrency, locking or performance. Extensions must exist as PGlite builds.
- Two dev dependencies (`@electric-sql/pglite`, `@electric-sql/pglite-socket`).
- CI does not exercise the hosted database. Preview deployments do.

## How to reverse it

Add a `docker-compose.yml`, point `DATABASE_URL` at it, and change `createTestDb()` to connect to it. Tests and repos stay the same because they depend on `Db`, not on PGlite.
