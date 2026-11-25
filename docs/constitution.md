# Constitution

The rules that do not change from feature to feature. If a spec, a prompt or a deadline conflicts with this file, this file wins. To change it, write an ADR in `docs/decisions/` and open a PR with the `guardrail-change` label.

## Product

<Filled in when a product is created from this template: what it is, who it is for, the one core flow, what it will deliberately never do.>

## The one rule

**If it matters, a tool enforces it.** Sentences in this repo are hints; `pnpm check` and CI are the law. When you find something that matters and is only a sentence, turn it into a lint rule, an architecture rule or a test.

## Fixed stack

One golden path. An agent never chooses a framework, a library for something already covered, or an alternative to anything in this table.

| Concern                         | Choice                                                                        | Decision |
| ------------------------------- | ----------------------------------------------------------------------------- | -------- |
| Language                        | TypeScript, strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |          |
| Runtime, package manager        | Node 24 LTS, pnpm (version pinned in `package.json`)                          |          |
| App                             | Next.js App Router, one app, one deployable                                   | ADR 0001 |
| Database                        | Postgres + Drizzle ORM, migrations by drizzle-kit                             | ADR 0002 |
| Auth                            | Better Auth, email + password, confined to `src/platform/auth`                | ADR 0003 |
| Deploy                          | Vercel, preview per PR, production promoted by a human                        | ADR 0004 |
| Structure                       | Modular monolith, vendors behind ports and adapters                           | ADR 0005 |
| Local and test database         | PGlite (Postgres in-process), no Docker                                       | ADR 0006 |
| Validation                      | Zod at every boundary                                                         |          |
| Config                          | `@t3-oss/env-nextjs`, read only in `src/platform/env.ts`                      |          |
| Email                           | Resend, behind `EmailPort`                                                    |          |
| UI                              | Tailwind CSS. Add shadcn/ui components one at a time when needed              |          |
| Logging                         | pino, through `src/platform/logger.ts`                                        |          |
| Lint and format                 | Biome                                                                         |          |
| Architecture                    | dependency-cruiser                                                            |          |
| Dead code, unused deps          | knip                                                                          |          |
| Tests                           | Vitest (unit, integration, contract), Playwright (e2e smoke)                  |          |
| Hooks, commits                  | lefthook, Conventional Commits via commitlint                                 |          |
| CI, dependency updates, secrets | GitHub Actions, Renovate, gitleaks                                            |          |

Not in the template, added per product behind a port when a spec needs them: payments (Stripe), error tracking (Sentry), anything else third-party. See `docs/integrations.md`.

## Principles

1. **Spec before code.** Every feature starts as a spec in `docs/specs/` with acceptance criteria a test can check.
2. **Boring over clever.** Copy the shape of `src/modules/example`. A new pattern needs an ADR.
3. **Dependencies point inward.** `app -> modules -> service -> domain`. Domain code is pure.
4. **Untrusted data stops at the edge.** Nothing from outside reaches a service without passing a Zod schema.
5. **Failures are values.** Expected failures are `Result<T, AppError>`. Exceptions mean a bug or an outage.
6. **Small and reversible.** Small PRs, one concern each. Every schema change is a migration.
7. **The builder does not grade its own work.** CI and a separate reviewer decide whether a change is good.

## Never

- Weaken a guardrail to get green: loosen `tsconfig.json`, disable or downgrade a lint rule, edit an architecture rule, add a knip ignore, delete or skip a test, change a `package.json` script, edit CI.
- Push to `main`, merge your own PR, or deploy to production.
- Commit a secret, log personal data, or send real email from a test.
- Add a paid service, or a dependency outside the fixed stack, without a human saying yes.
- Put business logic in a route, a repo or a React component.
- Import a vendor SDK outside its `*.adapter.ts`.
- Edit a migration that has already been applied anywhere.

## Changing the rules

Rules get stricter, not looser (the ratchet). A repeated mistake becomes, in order of preference: a lint rule, an architecture rule, a test, a line in `docs/conventions.md#gotchas`. Loosening a rule needs an ADR that says what was learned.
