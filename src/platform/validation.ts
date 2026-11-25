import type { z } from "zod";
import { type AppError, appError, err, ok, type Result } from "@/platform/errors";

function toValidationError(error: z.ZodError): AppError {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    details[key] = [...(details[key] ?? []), issue.message];
  }
  return appError("validation", "Invalid input", { details });
}

/** Validates untrusted data (webhook payload, vendor response, query params) against a Zod schema. */
export function validate<T>(schema: z.ZodType<T>, data: unknown): Result<T> {
  const parsed = schema.safeParse(data);
  return parsed.success ? ok(parsed.data) : err(toValidationError(parsed.error));
}

/** Reads and validates a JSON request body. Use at the top of every route that accepts one. */
export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<Result<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch (cause) {
    return err(appError("validation", "Request body must be valid JSON", { cause }));
  }
  return validate(schema, raw);
}
