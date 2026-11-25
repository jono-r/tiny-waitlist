import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/platform/auth/auth";

/** Route handlers for /api/auth/*. Re-exported by src/app/api/auth/[...all]/route.ts. */
export const authHandler = toNextJsHandler(auth);
