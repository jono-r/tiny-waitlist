/**
 * PUBLIC API of the example module. Routes and other modules import from here and nowhere else.
 * Export only what callers need. Everything not exported here is private to the module.
 */
import { createEmail } from "@/integrations/email";
import { db } from "@/platform/db/client";
import { createNoteRepo } from "./example.repo";
import { createNoteService } from "./example.service";

export { createNoteInputSchema, toNoteDto } from "./example.schema";

/** The service wired with its real dependencies. */
export const noteService = createNoteService({
  repo: createNoteRepo(db),
  email: createEmail(),
});
