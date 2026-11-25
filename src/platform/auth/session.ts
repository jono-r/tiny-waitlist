import { auth } from "@/platform/auth/auth";
import { appError, err, ok, type Result } from "@/platform/errors";

/** The signed-in user, reduced to what application code is allowed to depend on. */
export type SessionUser = {
  readonly id: string;
  readonly email: string;
};

/**
 * Session check for routes: `const user = await requireUser(request.headers)`.
 * Call it first in every route that reads or changes user data.
 */
export async function requireUser(headers: Headers): Promise<Result<SessionUser>> {
  const session = await auth.api.getSession({ headers });
  if (!session) {
    return err(appError("unauthorized", "Sign in required"));
  }
  return ok({ id: session.user.id, email: session.user.email });
}
