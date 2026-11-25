import { expect, it } from "vitest";
import type { EmailPort } from "./email.port";

/**
 * The behaviour every `EmailPort` implementation must have. Run it against the fake on every
 * `pnpm check` (email.fake.test.ts). When you add or change an adapter, also run it once against
 * the real vendor with a sandbox key, so the fake and the adapter cannot drift apart.
 */
export function emailContract(createPort: () => EmailPort): void {
  it("accepts a valid message and returns the provider's id", async () => {
    const result = await createPort().send({
      to: "delivered@resend.dev",
      subject: "Contract test",
      text: "Hello",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).not.toBe("");
    }
  });

  it("returns an integration error instead of throwing when the send fails", async () => {
    const result = await createPort().send({
      to: "not-an-address",
      subject: "Contract test",
      text: "Hello",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "integration" } });
  });
}
