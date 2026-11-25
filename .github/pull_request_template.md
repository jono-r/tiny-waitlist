## Spec

<!-- Link the spec this implements: docs/specs/NNN-slug.md. No spec, no PR (docs-only and dependency PRs excepted). -->

## What changed

<!-- What and why, in a few lines. A reviewer with no context should be able to follow it. -->

## Tests

<!-- Which acceptance criteria are covered by which tests. Anything not covered, and why. -->

| Acceptance criterion | Test |
| -------------------- | ---- |
|                      |      |

## Checklist

- [ ] `pnpm check` passes locally
- [ ] `pnpm build` passes locally
- [ ] Every acceptance criterion in the spec has a test
- [ ] No guardrail files changed (or: this PR is a guardrail change and explains why below)
- [ ] No new dependency (or: listed below with the reason)
- [ ] Database changes have a migration in this PR (`pnpm db:generate`)
- [ ] New env vars are in `src/platform/env.ts` and `.env.example`
- [ ] No secrets, no personal data in logs
- [ ] Docs updated where behaviour or conventions changed

## New dependencies / guardrail changes

<!-- Name each one and say why it is needed. Delete this section if none. -->

## Open questions and suggested ratchets

<!-- Anything a human needs to decide. Any rule that seemed wrong. Any mistake made twice that should become a lint rule, test or doc line. -->
