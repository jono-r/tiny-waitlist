# 0005: Modular monolith with ports and adapters, enforced by tools

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

Agent-written code degrades in a predictable way: logic leaks into routes, modules reach into each other, vendor SDK calls spread everywhere, and each shortcut makes the next one easier. Written rules slow this down; they do not stop it.

## Decision

- Business features are modules under `src/modules/<name>` with one public entry, `index.ts`.
- Inside a module: `domain/` is pure; the service orchestrates and takes its dependencies as arguments; the repo is the only database access.
- Third parties live under `src/integrations/<vendor>` behind a port type. Only `*.adapter.ts` imports an SDK. Every port has an in-memory fake and a contract test.
- Dependencies point inward: `app -> modules -> service -> domain`. `src/platform` is below everything and imports none of it.
- Every one of these rules is a dependency-cruiser rule that fails `pnpm check` and CI, with a message saying what to do instead. The vendor rule is an allowlist, so a new SDK is caught without anyone updating a denylist.
- Wiring is manual: a module's `index.ts` builds its service once. No DI container.

## Alternatives considered

- **Layered folders (`services/`, `repositories/`, `models/`):** groups code by kind, so every feature touches every folder and nothing stops cross-feature coupling.
- **Microservices or a package-per-module monorepo:** real isolation, at a cost in tooling and deploys that a micro-SaaS cannot justify.
- **Convention only:** what this ADR exists to avoid.
- **A DI container:** more indirection than `createService({ repo, email })` needs.

## Consequences

- A feature is one folder. Deleting a feature is deleting a folder and its route.
- Services are unit-testable with fakes, with no database and no network.
- More files per feature than a route-with-everything-in-it. That is the price, and the example module shows the whole set is small.
- Cross-module workflows go through public APIs. If two modules need each other, the cycle rule forces the shared part to be extracted.
- "Validate at the edge" is still a review convention, not a tool rule. It is the next ratchet candidate.

## How to reverse it

Nothing to reverse: loosening is always possible and always a mistake you can see in a `guardrail-change` PR. A module that outgrows the monolith can be extracted because it already has one entry point and injected dependencies.
