import { env } from "@/platform/env";
import { logger } from "@/platform/logger";
import { createResendEmail } from "./email.adapter";
import { createFakeEmail } from "./email.fake";
import type { EmailPort } from "./email.port";

export { createFakeEmail } from "./email.fake";
export type { EmailPort } from "./email.port";

/** The configured email sender. Called once, by a module's index.ts when it wires its service. */
export function createEmail(): EmailPort {
  if (env.RESEND_API_KEY) {
    return createResendEmail({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM });
  }
  logger.warn("email.not_configured");
  return createFakeEmail();
}
