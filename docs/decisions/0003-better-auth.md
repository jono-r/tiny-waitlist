# 0003: Better Auth, self-hosted, email and password only

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

Every product needs sign-up, sign-in and a session check. The guide allowed Better Auth (self-hosted) or Clerk (hosted) and asked for one to be locked in. The template should cost nothing to run and keep user data in the product's own database.

## Decision

- Better Auth with its Drizzle adapter. Users and sessions live in the product's Postgres.
- Minimal by default: email + password, cookie sessions. No social login, no email verification, no 2FA until a spec asks.
- All of it lives in `src/platform/auth`: `auth.ts` (configuration), `auth.table.ts` (generated tables), `handler.ts` (the `/api/auth/*` route handlers), `session.ts` (`requireUser`).
- Application code depends only on `requireUser(headers)` and the `SessionUser` type (`id`, `email`). `better-auth` may not be imported anywhere else (`auth-library-stays-in-platform-auth`).

## Alternatives considered

- **Clerk:** fastest to a polished sign-in UI and handles email for you, but it is a paid service past the free tier, holds the user table, and adds a vendor to every product.
- **Auth.js:** mature, but its database session and credentials story is more work to keep minimal.
- **Rolling our own:** no.

## Consequences

- No per-user cost and no third party in the sign-in path.
- We own the security configuration: secret rotation, rate limiting and email verification are ours to switch on per product.
- Auth tables use Better Auth's names (`user`, `session`, `account`, `verification`), which are singular unlike application tables.
- Upgrading Better Auth may change the tables: regenerate `auth.table.ts`, then `pnpm db:generate`.

## How to reverse it

Replace the four files in `src/platform/auth`, keeping `requireUser` and `SessionUser` the same. Modules and routes do not change. Migrating existing users' password hashes is the real cost, and depends on the target provider.
