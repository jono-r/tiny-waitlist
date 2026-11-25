# Architecture

A modular monolith: one Next.js app, business features as isolated modules, third parties behind ports. The boundaries below are checked on every `pnpm check` by dependency-cruiser (`pnpm arch`), so an illegal import fails locally and in CI.

## Layers

```
            ┌─────────────────────────────────────────────┐
  HTTP ───▶ │ src/app          routes, pages (thin)       │
            └───────────────┬─────────────────────────────┘
                            │ imports index.ts only
            ┌───────────────▼─────────────────────────────┐
            │ src/modules/<name>/index.ts   public API    │
            │   <name>.service.ts   use-cases             │──▶ src/integrations/<vendor>/index.ts
            │   <name>.repo.ts      database access       │       (port type; adapter stays private)
            │   domain/             pure rules            │
            └───────────────┬─────────────────────────────┘
                            │
            ┌───────────────▼─────────────────────────────┐
            │ src/platform     env, logger, errors,       │
            │                  validation, db, auth       │
            └─────────────────────────────────────────────┘
```

Arrows are the only legal import directions. Nothing points up.

## What goes where

| Folder                                 | Holds                                                                                              | Must not                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/app`                              | Route handlers, pages, layouts. Each route: authenticate, validate, call a module, map the result. | Contain business rules, import module internals, integrations or the database |
| `src/modules/<name>/domain`            | Types and pure functions that encode business rules                                                | Import anything except its own folder and `src/platform/errors.ts`            |
| `src/modules/<name>/<name>.service.ts` | Use-cases. Takes its dependencies (repo, ports) as arguments                                       | Import the db client, an adapter or a vendor SDK                              |
| `src/modules/<name>/<name>.repo.ts`    | Queries for this module's tables                                                                   | Hold business rules, touch another module's tables                            |
| `src/modules/<name>/<name>.table.ts`   | Drizzle table definitions owned by the module                                                      |                                                                               |
| `src/modules/<name>/<name>.schema.ts`  | Zod input schemas, DTO types and mappers                                                           |                                                                               |
| `src/modules/<name>/index.ts`          | The public API, and the one place the service is wired to its real dependencies                    | Export internals "just in case"                                               |
| `src/integrations/<vendor>`            | `<vendor>.port.ts`, `.adapter.ts`, `.fake.ts`, `.contract.ts`, `index.ts`                          | Import a module, a route or another integration                               |
| `src/platform`                         | Cross-cutting plumbing                                                                             | Import a module, an integration or a route                                    |

## Rules and what enforces them

| Rule                                                                                                | Enforced by              | Rule name                                                                                    |
| --------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| No circular imports                                                                                 | dependency-cruiser       | `no-circular`                                                                                |
| Domain is pure                                                                                      | dependency-cruiser       | `domain-is-pure`                                                                             |
| Modules talk only through `index.ts`                                                                | dependency-cruiser       | `modules-via-public-api`                                                                     |
| Routes use module public APIs, never internals, integrations or the db                              | dependency-cruiser       | `app-uses-modules-not-internals`                                                             |
| Integrations are used through `index.ts`                                                            | dependency-cruiser       | `integrations-via-public-api`                                                                |
| Integrations do not depend on modules, routes or each other                                         | dependency-cruiser       | `integrations-are-independent`                                                               |
| Modules do not import routes                                                                        | dependency-cruiser       | `modules-do-not-import-app`                                                                  |
| Platform imports nothing above it                                                                   | dependency-cruiser       | `platform-is-a-leaf`                                                                         |
| Vendor SDKs only in `*.adapter.ts` (allowlist of approved packages)                                 | dependency-cruiser       | `vendor-sdks-only-in-adapters`                                                               |
| Adapters live in `src/integrations`                                                                 | dependency-cruiser       | `adapters-live-in-integrations`                                                              |
| Database access only in repos, tables, module `index.ts`, platform                                  | dependency-cruiser       | `db-access-only-in-repos`                                                                    |
| One logger, one auth entry point, one env reader                                                    | dependency-cruiser       | `logger-is-the-only-pino`, `auth-library-stays-in-platform-auth`, `env-library-stays-in-env` |
| No devDependencies or test code in production code                                                  | dependency-cruiser       | `no-dev-deps-in-production-code`, `no-test-code-in-production-code`                          |
| No `any`, `!`, default exports, barrel files, `../` imports, `console`, `@ts-ignore`, skipped tests | Biome                    | see `biome.json`                                                                             |
| No `process.env` outside `env.ts`                                                                   | Biome                    | `noProcessEnv`                                                                               |
| No `throw new Error(...)`                                                                           | Biome plugin             | `tools/biome/no-bare-error.grit`                                                             |
| No unused files, exports or dependencies                                                            | knip                     |                                                                                              |
| Strict types                                                                                        | TypeScript               | `tsconfig.json`                                                                              |
| Validate at the edge                                                                                | Review + test convention | not yet tool-enforced                                                                        |

`import type` counts as an import. A type-only import across a boundary fails the same rule.

The vendor rule is an allowlist: any npm package not listed in `APPROVED_PACKAGES` in `.dependency-cruiser.cjs` can only be imported from an adapter. A general-purpose library (not a vendor) is added to that list in a `guardrail-change` PR.

## Life of a request

`POST /api/notes` in `src/app/api/notes/route.ts`:

1. `requireUser(request.headers)` checks the session. No session: `401`.
2. `parseJsonBody(request, createNoteInputSchema)` validates the body. Invalid: `400` with field details.
3. `noteService.createNote(user, input)` runs the use-case: domain rule, repo insert, log event, confirmation email through `EmailPort`.
4. The route maps the `Result`: `errorResponse(error)` or `201` with a DTO from `toNoteDto`.

## Wiring

There is no DI container. A service is a function that takes its dependencies:

```ts
export function createNoteService(deps: { repo: NoteRepo; email: EmailPort }): NoteService;
```

The module's `index.ts` calls it once with the real repo and the real port. Unit tests call it with fakes. That is the whole mechanism.

## Database

- Each module owns its tables in `<name>.table.ts`. A module never queries another module's tables; it calls that module's public API.
- `drizzle.config.ts` picks up every `src/modules/*/*.table.ts` by glob. Adding a module needs no config change.
- Migrations live in `src/platform/db/migrations`, generated by `pnpm db:generate`, applied by `pnpm db:migrate`.
- Repos take a `Db` handle (`src/platform/db/client.ts`). The same repo runs on node-postgres in production and on PGlite in integration tests.
- Auth tables (`src/platform/auth/auth.table.ts`) are generated by Better Auth. Regenerate with `pnpm dlx auth@<installed better-auth version> generate`; do not hand-edit.

## Adding a module

1. Have a spec in `docs/specs/`.
2. Copy `src/modules/example` to `src/modules/<name>` and rename the files to `<name>.*.ts`.
3. Write the domain rules and their unit tests first.
4. Write the Zod schema, the table, then `pnpm db:generate`.
5. Write the repo and its integration test, then the service and its unit test with fakes.
6. Export the minimum from `index.ts`. Add a thin route in `src/app`.
7. `pnpm check`, `pnpm build`, `pnpm e2e`.
