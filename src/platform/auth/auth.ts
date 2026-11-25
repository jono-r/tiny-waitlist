import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { account, session, user, verification } from "@/platform/auth/auth.table";
import { db } from "@/platform/db/client";
import { env } from "@/platform/env";

/**
 * Better Auth, kept minimal: email + password, sessions in Postgres. See ADR 0003.
 * This folder is the only place `better-auth` is imported, so the provider can be swapped.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
  // nextCookies must stay last: it lets server actions set the session cookie.
  plugins: [nextCookies()],
});
