# 0004: Deploy on Vercel, previews automatic, production by hand

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

Products are built by agents and approved by one person. That person needs to click a link and see the change before merging, and needs production to change only when they say so.

## Decision

- Each product repo is linked to a Vercel project.
- Every PR gets a preview deployment. The preview URL goes in the PR.
- Production is promoted by a human. Agents never deploy to production.
- Environment variables are set in Vercel per environment and validated at boot by `src/platform/env.ts` (via `src/instrumentation.ts`). A missing or malformed variable fails the deployment instead of the first request.
- Database migrations are not run by the build. They are applied deliberately (`pnpm db:migrate` against the target database) before promoting a release that needs them.

## Alternatives considered

- **Fly.io, Railway, a VPS:** more control, more to operate. Not worth it for a micro-SaaS.
- **Cloudflare:** attractive pricing, but the Node APIs this stack uses (`pg`, pino) need care on Workers.
- **Migrate on build:** convenient until a preview build migrates a shared database.

## Consequences

- Zero infrastructure work per product, and a URL per PR for review.
- Serverless limits apply: short request lifetimes, no background workers, pooled database connections (use the provider's pooled URL).
- The code has no Vercel-specific imports. When connection pooling under Fluid compute matters, add `attachDatabasePool` from `@vercel/functions` in `src/platform/db/client.ts` and record it here.

## How to reverse it

`pnpm build && pnpm start` runs anywhere Node 24 runs. Moving hosts is a deployment change, not a code change.
