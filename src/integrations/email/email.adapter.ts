import { Resend } from "resend";
import { z } from "zod";
import { appError, err, ok } from "@/platform/errors";
import { validate } from "@/platform/validation";
import type { EmailPort } from "./email.port";

// Vendor responses are untrusted input too: validate before use.
const sendResponseSchema = z.object({ id: z.string().min(1) });

/** Resend implementation of `EmailPort`. The only file that imports the `resend` SDK. */
export function createResendEmail(config: { apiKey: string; from: string }): EmailPort {
  const client = new Resend(config.apiKey);

  return {
    async send(message) {
      try {
        const { data, error } = await client.emails.send({
          from: config.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
        });
        if (error) {
          return err(appError("integration", "Email could not be sent", { cause: error }));
        }
        const parsed = validate(sendResponseSchema, data);
        if (!parsed.ok) {
          return err(
            appError("integration", "Email provider returned an unexpected response", {
              cause: parsed.error,
            }),
          );
        }
        return ok({ id: parsed.value.id });
      } catch (cause) {
        return err(appError("integration", "Email could not be sent", { cause }));
      }
    },
  };
}
