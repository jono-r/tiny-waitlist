# Conventions

Show, don't tell. Every pattern here has a real, tested example in the repo. When this file and the code disagree, the code wins and this file gets fixed in the same PR.

## The canonical module

`src/modules/example` is the shape of every module. Read it top to bottom before writing a new one.

| File                                                                       | Shows                                                                  |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `domain/note.ts`                                                           | Pure rules and types. A rule that can fail returns `Result`.           |
| `example.schema.ts`                                                        | Zod input schema, DTO type, `toNoteDto` mapper                         |
| `example.table.ts`                                                         | Drizzle table, foreign key, index                                      |
| `example.repo.ts`                                                          | Repo type + implementation taking a `Db`                               |
| `example.service.ts`                                                       | Use-case with injected repo and port, logging, best-effort side effect |
| `index.ts`                                                                 | Public API and wiring                                                  |
| `domain/note.test.ts`, `example.schema.test.ts`, `example.service.test.ts` | Unit tests                                                             |
| `example.repo.integration.test.ts`                                         | Integration test on PGlite                                             |
| `src/app/api/notes/route.ts`                                               | The thin route that calls it                                           |

## Errors

Expected failures are values. Nothing throws them, nothing catches them.

```ts
// domain or service: return the failure
if (currentCount >= MAX_NOTES_PER_OWNER) {
  return err(appError("conflict", `You can keep at most ${MAX_NOTES_PER_OWNER} notes`));
}
return ok(undefined);

// caller: check, then use
const result = await noteService.createNote(user.value, input.value);
if (!result.ok) {
  return errorResponse(result.error);
}
```

- `AppError` codes and their HTTP status: `validation` 400, `unauthorized` 401, `forbidden` 403, `not_found` 404, `conflict` 409, `integration` 502. Adding a code means adding it to `AppErrorCode` and `HTTP_STATUS` in `src/platform/errors.ts`; the compiler then points at every place that needs it.
- `message` is shown to the caller. Keep internals and personal data out of it. Put the underlying error in `cause`; it is logged, never sent.
- A state that cannot happen if the code is correct: `invariant(row, "insert returned no row")`. This replaces both `!` and `throw new Error`.
- Infrastructure failures (database down) are exceptions. Let them propagate; Next returns a 500. Do not catch what you cannot handle, and never catch and ignore.
- Routes turn an `AppError` into a response only through `errorResponse`.

## Validation

Every external input passes a Zod schema before it reaches a service.

```ts
const input = await parseJsonBody(request, createNoteInputSchema); // request body
const payload = validate(webhookSchema, rawPayload); // webhook, query, vendor response
```

Both return `Result`. Schemas live in `<name>.schema.ts`. Services receive already-parsed types (`CreateNoteInput`), never `unknown` and never a `Request`.

## Logging

```ts
logger.info({ noteId: note.id, ownerId: owner.id }, "note.created");
logger.warn({ noteId: note.id, err: sent.error.cause }, "note.confirmation_email_failed");
```

- Message is an event name: `<thing>.<what_happened>`, lowercase, past tense. Not a sentence.
- Context is ids. Never names, emails, addresses, tokens or request bodies. The logger redacts common keys as a safety net; do not rely on it.
- `info` for things that happened, `warn` for handled failures, `error` for things a human must look at.
- No `console.*` (lint error).

## Routes

A route does four things in this order and nothing else: authenticate, validate, call one module function, map the result. See `src/app/api/notes/route.ts`. If a route needs an `if` about business state, that `if` belongs in the service.

## Naming

| Thing                | Convention                                                           | Example                                    |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| Files and folders    | `kebab-case`, role as a suffix                                       | `billing.service.ts`, `test-db.ts`         |
| Types                | `PascalCase`, no `I` prefix                                          | `NoteRepo`                                 |
| Functions, variables | `camelCase`                                                          | `createNoteService`                        |
| Constants            | `SCREAMING_SNAKE_CASE`                                               | `MAX_NOTES_PER_OWNER`                      |
| Factories            | `create<Thing>`                                                      | `createNoteRepo(db)`                       |
| Zod schemas          | `<name>Schema`, type via `z.infer`                                   | `createNoteInputSchema`, `CreateNoteInput` |
| DB tables            | `snake_case`, plural                                                 | `notes`                                    |
| DB columns           | `snake_case` in SQL, `camelCase` in TypeScript                       | `owner_id` / `ownerId`                     |
| Log events           | `thing.what_happened`                                                | `note.created`                             |
| Env vars             | `SCREAMING_SNAKE_CASE`                                               | `RESEND_API_KEY`                           |
| Tests                | next to the code: `*.test.ts` unit, `*.integration.test.ts` database |                                            |
| Branches             | `feat/<spec-id>-<slug>`, `fix/<slug>`                                | `feat/003-invite-links`                    |
| Commits              | Conventional Commits                                                 | `feat(billing): add invoice export`        |

## Imports

- Same folder: `./thing`. Everything else: `@/...`. Never `../` (lint error).
- Another module: `@/modules/<name>` only. An integration: `@/integrations/<vendor>` only.
- Named exports only. Default exports exist only where Next.js requires them.
- `import type` for types (Biome fixes this for you with `pnpm fix`).

## Types

- Prefer `type` aliases with `readonly` fields for data.
- No `any`. Unknown input is `unknown` until a Zod schema narrows it.
- No `as` casts to silence the compiler. If you need one, the types upstream are wrong.
- `exactOptionalPropertyTypes` is on: `{ a?: string }` does not accept `{ a: undefined }`. Omit the key instead.
- `noUncheckedIndexedAccess` is on: `rows[0]` is `T | undefined`. Destructure and check, or use `invariant`.

## UI

Tailwind is installed. shadcn/ui is not pre-installed: add components one at a time with its CLI when a spec needs them, into `src/components/ui`, and say so in the PR. Components hold no business logic; they call routes or server actions that call modules.

## Gotchas

Things that have already cost time. The ratchet adds to this list; nothing is removed without a reason.

- **`pnpm check` needs no env file.** `pnpm build` and `pnpm dev` do: copy `.env.example` to `.env.local`. Tests get placeholder values from `vitest.config.ts`.
- **Local Postgres is PGlite.** `pnpm db:local` starts it on port 5433 with data in `.pglite/`. It does not support SSL, so local URLs end in `?sslmode=disable`. `pnpm e2e` starts its own in-memory instance on another port; do not point it at yours.
- **dependency-cruiser sees pnpm's real paths** (`node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/`). A rule pattern anchored with `^node_modules/` never matches. Use the `pkg()` helper in `.dependency-cruiser.cjs`.
- **TypeScript is pinned to 6.x.** dependency-cruiser 18 cannot read TypeScript 7.0. Do not bump TypeScript to 7 until dependency-cruiser supports the installed version (`pnpm exec depcruise --info` shows a tick next to `typescript`).
- **Next rewrites `tsconfig.json`** when it thinks a required option is missing, and its formatting fails Biome. Run `pnpm fix` and commit; do not remove the options it added.
- **Route `params` are Promises in Next 16**: `const { id } = await params`. `middleware.ts` is now `proxy.ts`.
- **Biome fails only on errors.** Every rule that matters is set to `"error"`; do not add rules at `"warn"`.
- **Zod is v4.** `z.email()`, `z.url()`, `z.uuid()` are top-level; `z.string().email()` is deprecated.
- **pnpm blocks dependency install scripts** unless the package is listed under `allowBuilds` in `pnpm-workspace.yaml` (a guardrail file).
- **Auth tables are singular** (`user`, `session`) because Better Auth generates them. Application tables are plural.
- **A module's `index.ts` wires real dependencies at import time.** Unit tests import the service file directly, never `index.ts`.
- **Email without `RESEND_API_KEY` is not sent.** It is kept in memory and a warning is logged at startup. Fine for dev, e2e and previews; set the key in production.
- **The `secrets` CI job fails on the first push of a brand-new repo.** gitleaks diffs against the parent of the first commit, which does not exist. It is not a leak; the next push passes. Create the repo, push once more, then turn on branch protection.
