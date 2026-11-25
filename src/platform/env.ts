import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * The only place `process.env` is read. Everything else imports `env`.
 * Adding a variable: declare it here, add it to `.env.example`, and (if tests need it) to `vitest.config.ts`.
 */
export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32, "Generate one with: openssl rand -base64 32"),
    BETTER_AUTH_URL: z.url(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(3).default("App <onboarding@resend.dev>"),
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "silent"]).default("info"),
  },
  client: {},
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
});
