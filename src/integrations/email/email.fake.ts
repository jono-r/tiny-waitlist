import { appError, err, ok } from "@/platform/errors";
import type { EmailMessage, EmailPort } from "./email.port";

export type FakeEmail = EmailPort & {
  /** Every message accepted so far, oldest first. Assert on this in tests. */
  readonly sent: readonly EmailMessage[];
  /** Makes the next `send` fail the way a vendor outage would. */
  failNext(): void;
};

/** In-memory `EmailPort`. Used by tests, and at runtime when no provider key is configured. */
export function createFakeEmail(): FakeEmail {
  const sent: EmailMessage[] = [];
  let shouldFail = false;

  return {
    sent,
    failNext() {
      shouldFail = true;
    },
    async send(message) {
      if (shouldFail) {
        shouldFail = false;
        return err(appError("integration", "Email could not be sent"));
      }
      if (!message.to.includes("@")) {
        return err(appError("integration", "Email could not be sent"));
      }
      sent.push(message);
      return ok({ id: `fake-${sent.length}` });
    },
  };
}
