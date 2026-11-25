# Integrations

Every third-party service sits behind a port: a small TypeScript type that says what the application needs, in the application's words. The vendor SDK is imported in exactly one file. Swapping Resend for Postmark is one new adapter; nothing else changes.

`src/integrations/email` is the canonical example. Copy it.

## Files

| File                    | Role                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<vendor>.port.ts`      | The type the application depends on. No vendor names, no vendor types. Methods return `Result` and never throw.                                              |
| `<vendor>.adapter.ts`   | The real implementation. **The only file allowed to import the SDK.** Validates vendor responses with Zod. Converts every failure to an `integration` error. |
| `<vendor>.fake.ts`      | In-memory implementation with helpers for tests (`sent`, `failNext()`).                                                                                      |
| `<vendor>.contract.ts`  | Tests every implementation of the port must pass.                                                                                                            |
| `<vendor>.fake.test.ts` | Runs the contract against the fake on every `pnpm check`.                                                                                                    |
| `index.ts`              | Exports the port type, the fake, and one `create<Thing>()` that returns the configured implementation.                                                       |

Name the folder after the capability when you can (`email`, `payments`), not the vendor. The adapter carries the vendor name in its factory: `createResendEmail`.

## Adding one

1. **Spec and approval.** A new vendor is a new dependency and usually a new cost. It needs a human yes.
2. **Port first.** Write the smallest type that covers what the spec needs today. Do not mirror the vendor's API.
3. **Fake and contract.** Write the fake and the contract tests. Now services can be built and unit-tested before the adapter exists.
4. **Adapter.** `pnpm add <sdk>`. Import it only in `<vendor>.adapter.ts`. Wrap calls in `try/catch` and return `err(appError("integration", ...))` with the original error as `cause`. Validate what comes back with `validate(schema, data)`.
5. **Config.** Add keys to `src/platform/env.ts` and `.env.example`. The adapter takes config as an argument; only `index.ts` reads `env`.
6. **Verify against the real thing once.** Run the contract against the adapter with a sandbox key and note the result in the PR. Do not commit a test that calls the network.
7. **Use it.** A service takes the port as a dependency (`deps: { email: EmailPort }`). The module's `index.ts` passes `create<Thing>()`.

## What the tools enforce

- An SDK imported outside an adapter fails `vendor-sdks-only-in-adapters`. This is an allowlist: every package not listed in `APPROVED_PACKAGES` in `.dependency-cruiser.cjs` counts as a vendor.
- An adapter outside `src/integrations` fails `adapters-live-in-integrations`.
- Importing `email.adapter.ts` or `email.port.ts` directly from a module fails `integrations-via-public-api`. Import from `@/integrations/email`.
- An integration importing a module fails `integrations-are-independent`.
- An SDK that is installed but unused, or used but not installed, fails knip.

## Inbound: webhooks

A webhook is untrusted input arriving at a route.

1. Verify the signature in the adapter (it needs the SDK), exposed through the port: `verifyWebhook(rawBody, signature): Result<VendorEvent>`.
2. Validate the payload with Zod and map it to an application type in the adapter. The module never sees the vendor's event shape.
3. The route reads the raw body, calls the port through the module, and returns quickly. Make handlers idempotent: vendors retry.

## Not in the template

Added per product, each behind a port, each with an ADR if it changes how the app is built:

- **Payments (Stripe):** `src/integrations/payments`. Checkout and subscription state changes arrive by webhook; treat the webhook as the source of truth.
- **Error tracking (Sentry):** wire it in `src/instrumentation.ts`. It instruments the framework rather than being called by services, so it needs an `APPROVED_PACKAGES` entry instead of a port.
- **Anything with an API key:** same shape as email.
