# 0001: One Next.js app is the whole product

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

Each product is a micro-SaaS built mostly by agents and run by one person. It needs pages, an API, auth and a database, and it has to deploy with no infrastructure work. Agents produce more consistent code when there is one place for each kind of thing.

## Decision

Each product is a single Next.js App Router application: UI, route handlers and server logic in one repo and one deployable. `src/app` holds routes and pages only; all business logic lives in `src/modules`.

## Alternatives considered

- **Separate frontend and API services:** two deploys, two sets of types, a contract to keep in sync. No benefit at this size.
- **A monorepo with packages:** adds workspace tooling and a "which package?" decision to every change.
- **Remix, SvelteKit, Hono + SPA:** all workable. Next has the largest body of examples for agents to draw on and the shortest path to Vercel.

## Consequences

- One `pnpm check`, one build, one preview URL per PR.
- The framework must stay at the edge. Because `src/app` is thin and modules do not import `next`, most code would survive a framework change.
- Long-running jobs and websockets do not fit. A product that needs them adds a worker and records that in its own ADR.

## How to reverse it

Move `src/modules`, `src/integrations` and most of `src/platform` unchanged into the new shape and rewrite `src/app`. Days, not weeks, as long as the boundaries have held.
