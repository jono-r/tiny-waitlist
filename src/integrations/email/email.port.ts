import type { Result } from "@/platform/errors";

export type EmailMessage = {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
};

/**
 * What the application needs from an email provider, and nothing more.
 * Services depend on this type. They never know which vendor is behind it.
 */
export type EmailPort = {
  /** Never throws. Vendor and network failures come back as an `integration` error. */
  send(message: EmailMessage): Promise<Result<{ readonly id: string }>>;
};
