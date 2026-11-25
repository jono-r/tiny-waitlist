# factory-template

The starting point for every TypeScript micro-SaaS in the factory. AI agents build products on top of it, so its job is to keep agent-written code consistent: the rules are enforced by tools, not by prose.

Next.js (App Router) · TypeScript strict · Postgres + Drizzle · Better Auth · Zod · Tailwind · Biome · dependency-cruiser · knip · Vitest · Playwright

## Start a product from it

```bash
gh repo create jono-r/<name> --template jono-r/factory-template --private --clone
cd <name>
pnpm install
cp .env.example .env.local   # then set BETTER_AUTH_SECRET: openssl rand -base64 32
```

Then fill in "What this is" in `AGENTS.md` and the Product section of `docs/constitution.md`, and write the first spec from `docs/specs/_template.md`.

## Run it

Needs Node 24 and pnpm. No Docker.

```bash
pnpm db:local     # terminal 1: local Postgres (PGlite) on port 5433
pnpm db:migrate   # terminal 2: apply migrations
pnpm dev          # http://localhost:3000
```

## Check it

```bash
pnpm check   # typecheck + lint + architecture + dead code + tests. Seconds. No env file needed.
pnpm build
pnpm e2e     # Playwright smoke test; starts its own database and server
```

First e2e run: `pnpm exec playwright install chromium`.

## Where things are

- `AGENTS.md` is the map every agent reads first. `CLAUDE.md` just points to it.
- `docs/` has the constitution, architecture, conventions, and guides for integrations and testing.
- `docs/decisions/` records why the big choices were made. `docs/specs/` holds feature specs.
- `src/modules/example` and `src/integrations/email` are the patterns to copy.

## Guardrails

CI runs `pnpm check`, the build, the e2e smoke test and a secret scan on every PR. A PR that touches a guardrail file (lint, TypeScript, architecture, dead-code or test config, `package.json` scripts, anything in `.github/`) fails until a human adds the `guardrail-change` label. `main` is protected: PRs only, checks must pass.

To make the factory stricter, open a `guardrail-change` PR here, then apply the same change to existing product repos.
