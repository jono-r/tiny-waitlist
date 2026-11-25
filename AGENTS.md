# AGENTS.md

This file is a map. It tells you where things are and which rules are hard. Details live in `docs/`.

## What this is

Visitors join the tiny-waitlist launch list by leaving their email address. The owner signs in to see who joined; visitors cannot browse the list.

The template ships one example module (`src/modules/example`, a notes feature) and one example integration (`src/integrations/email`). Copy their shape. Delete them once the product has real modules.

## Commands

- Install: `pnpm install`
- Local database (no Docker): `pnpm db:local` in one terminal, then `pnpm db:migrate`
- Dev server: `pnpm dev`
- **Before saying you're done: `pnpm check` must pass.** Fix failures. Never suppress them.
- Auto-fix lint and formatting: `pnpm fix`
- Build: `pnpm build`
- E2E smoke (starts its own database and server): `pnpm e2e`
- After changing a `*.table.ts` file: `pnpm db:generate`, commit the migration

`pnpm check` runs, in order: `typecheck` (tsc), `lint` (Biome), `arch` (dependency-cruiser), `deadcode` (knip), `test` (Vitest). Run one alone while iterating, e.g. `pnpm arch`.

## How to work

1. Read the spec for your task in `docs/specs/`. No spec: stop and ask for one (template: `docs/specs/_template.md`).
2. Read `docs/architecture.md` and `docs/conventions.md` before writing code.
3. Work on a branch. Small commits. Conventional Commit messages (`feat:`, `fix:`, `docs:`, ...).
4. Write or update tests alongside the code. See `docs/testing.md` for which kind goes where.
5. Run `pnpm check` until green, then `pnpm build`.
6. Open a PR using the template. Link the spec. Never push to `main`, never merge your own PR.

When a check fails, read the message: every architecture rule explains what to do instead.

## Architecture (summary; details in `docs/architecture.md`)

```
src/app            routes and pages only. Thin: authenticate, validate, call a module, map the result.
src/modules/<name> business features. Public API is index.ts. Nothing else is importable from outside.
  domain/          pure types and rules. Imports nothing except its own folder and platform/errors.
  <name>.service.ts  use-cases. Orchestrates domain, repo and ports. Returns Result<T, AppError>.
  <name>.repo.ts     the only DB access for this module.
  <name>.table.ts    Drizzle tables owned by this module.
  <name>.schema.ts   Zod schemas for input, DTO types for output.
src/integrations/<vendor>  third parties behind a port: <vendor>.port.ts, .adapter.ts, .fake.ts, index.ts.
src/platform       env, logger, errors, validation, db client, auth. Imports no module or integration.
tests/e2e          Playwright smoke tests.
```

- Dependencies point inward: `app -> modules (index.ts) -> service -> domain`.
- Vendor SDKs are imported only in `*.adapter.ts`. To add a vendor, follow `docs/integrations.md`.
- Expected failures are values: `Result<T, AppError>` from `src/platform/errors.ts`. Nothing throws them.

## Hard rules

These are enforced by tools. You cannot talk your way past them, so don't spend time trying.

- Never edit a guardrail file to make a check pass: `biome.json`, `tools/biome/`, `tsconfig.json`, `.dependency-cruiser.cjs`, `knip.json`, `vitest.config.ts`, `playwright.config.ts`, `lefthook.yml`, `commitlint.config.ts`, `pnpm-workspace.yaml`, the `scripts` in `package.json`, anything in `.github/`. If a rule seems wrong, say so in the PR description and leave the rule alone. CI fails any PR that touches these without the human-applied `guardrail-change` label.
- Never delete or skip a test to get green. No `.skip`, no `.only`.
- Never suppress a lint rule without a reason: `// biome-ignore lint/<group>/<rule>: <why this case is safe>`. Biome rejects suppressions with no explanation. No `@ts-ignore`.
- No `any`. No non-null `!` (use `invariant()`). No default exports (Next.js special files excepted). No barrel files except a module's or integration's `index.ts`. No `../` imports (use `./` or `@/`).
- No `process.env` outside `src/platform/env.ts`. New variable: add it to `env.ts` and `.env.example`.
- No `throw new Error(...)`. Expected failure: `return err(appError(...))`. Impossible state: `invariant(...)`.
- No `console.*`. Use `logger` from `src/platform/logger.ts`. Log ids, never personal data.
- Validate every external input with Zod before it reaches a service: request bodies, query params, webhooks, vendor responses, env.
- Authenticate first in every route that reads or changes user data: `requireUser(request.headers)`.
- No new dependency without saying why in the PR. Prefer what is installed. A new vendor SDK needs a port and adapter.
- Database change = edit `<name>.table.ts` + `pnpm db:generate` + commit the migration, all in the same PR. Never edit an applied migration.
- Never commit secrets. Local values go in `.env.local` (gitignored).

## Where to look

| You need                                                | Read                          |
| ------------------------------------------------------- | ----------------------------- |
| Non-negotiables and the fixed stack                     | `docs/constitution.md`        |
| Layers, boundaries, how to add a module                 | `docs/architecture.md`        |
| Patterns with code: errors, logging, naming, validation | `docs/conventions.md`         |
| Things that have bitten agents before                   | `docs/conventions.md#gotchas` |
| Adding or wrapping a third-party service                | `docs/integrations.md`        |
| What to test and where                                  | `docs/testing.md`             |
| Why a decision was made                                 | `docs/decisions/`             |
| What to build                                           | `docs/specs/`                 |
| A complete module to copy                               | `src/modules/example/`        |
| A complete integration to copy                          | `src/integrations/email/`     |

## When you get something wrong twice

Propose a ratchet in your PR description: a lint rule, an architecture rule, a test, or one line in `docs/conventions.md#gotchas`, in that order of preference. The factory gets stricter over time, never looser.
