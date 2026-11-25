/**
 * Runs once when the server starts. Importing env here makes the app refuse to boot with bad or
 * missing config, instead of failing on the first request that happens to need it.
 */
export async function register(): Promise<void> {
  await import("@/platform/env");
}
