import pino from "pino";
import { env } from "@/platform/env";

/**
 * Structured logger. Log events, not sentences: `logger.info({ noteId }, "note.created")`.
 * Pass ids, never personal data. The redact list is a safety net, not permission to log PII.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "email",
      "*.email",
      "password",
      "*.password",
      "token",
      "*.token",
      "secret",
      "*.secret",
      "authorization",
      "*.authorization",
      "cookie",
      "*.cookie",
    ],
    censor: "[redacted]",
  },
});
