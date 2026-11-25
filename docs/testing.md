# Testing

Tests are how an agent knows it is done and how a reviewer knows it is right. `pnpm check` runs every unit, integration and contract test in a couple of seconds with no Docker, no network and no env file. Keep it that way.

## Which test goes where

| Kind        | File                                                     | Runs against                                       | Use it for                                  |
| ----------- | -------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------- |
| Unit        | `*.test.ts` next to the code                             | Nothing external. Fakes for repos and ports.       | Domain rules, schemas, services             |
| Integration | `*.integration.test.ts` next to the repo                 | Real Postgres engine (PGlite) with real migrations | Repos: queries, constraints, ordering       |
| Contract    | `<vendor>.contract.ts`, run from `<vendor>.fake.test.ts` | The fake (and, once by hand, the real adapter)     | What every implementation of a port must do |
| E2E smoke   | `tests/e2e/*.spec.ts`                                    | Built app + in-memory Postgres + real browser      | One happy path per critical flow            |

Commands: `pnpm test` (unit + integration), `pnpm exec vitest run --project unit`, `pnpm exec vitest --project unit` (watch), `pnpm e2e`.

## What must have tests

- **Every domain function:** each rule, each boundary value.
- **Every service function:** the success path, each `AppError` it can return, each side effect (what was saved, what was sent), and what happens when a port fails.
- **Every repo function:** against PGlite. Include owner isolation: a query for user A never returns user B's rows.
- **Every Zod input schema:** one accepted input showing normalisation and defaults, and the rejections that matter.
- **Every acceptance criterion in the spec** maps to at least one test. Name the test after the criterion.
- **Every bug fix** starts with a test that fails for the bug.
- **Routes** get no unit tests. They are thin by rule; the e2e smoke covers the wiring.

## How to write them

```ts
it("returns a conflict and saves nothing when the owner is at the limit", async () => {
  const { repo, email, service } = setup(full); // arrange

  const result = await service.createNote(owner, { title: "One too many", body: "" }); // act

  expect(result).toMatchObject({ ok: false, error: { code: "conflict" } }); // assert
  expect(repo.rows).toHaveLength(MAX_NOTES_PER_OWNER);
  expect(email.sent).toHaveLength(0);
});
```

- Test names are sentences about behaviour: "returns a conflict and saves nothing when…".
- Arrange, act, assert, separated by blank lines.
- **Fakes, not mocks.** Pass a fake repo or `createFakeEmail()` to the service factory. No `vi.mock` of our own modules: if something is hard to fake, its dependencies are not injected.
- Assert on results and on state (`repo.rows`, `email.sent`), not on which functions were called.
- Import the unit under test directly (`./example.service`), never the module's `index.ts`, which wires real dependencies.
- Integration tests: `createTestDb()` in `beforeAll`, `close()` in `afterAll`, one database per file. See `example.repo.integration.test.ts`.
- No network, no real email, no `setTimeout` sleeps, no dependence on test order or the current date.
- No snapshot tests for logic. A snapshot proves nothing changed, not that it was right.

## Rules the tools enforce

- `.only` and `.skip` are lint errors.
- A test run with zero test files fails (`passWithNoTests: false`).
- Test helpers imported by production code fail `no-test-code-in-production-code`.
- An unused fake or helper fails knip.

Deleting or weakening a test to get green is a guardrail violation. If a test is wrong, say why in the PR and fix the test in its own commit.

## E2E

`pnpm e2e` starts an in-memory PGlite server, applies migrations, builds the app, starts it and runs Playwright against it. First run needs `pnpm exec playwright install chromium`.

Keep smoke tests few: one per flow that would be embarrassing to break (sign up, the core action, payment). They check that the pieces are connected, not that the rules are right.
