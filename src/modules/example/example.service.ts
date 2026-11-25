import type { EmailPort } from "@/integrations/email";
import { ok, type Result } from "@/platform/errors";
import { logger } from "@/platform/logger";
import { checkCanAddNote, type Note, type NoteOwner } from "./domain/note";
import type { NoteRepo } from "./example.repo";
import type { CreateNoteInput } from "./example.schema";

export type NoteService = {
  createNote(owner: NoteOwner, input: CreateNoteInput): Promise<Result<Note>>;
  listNotes(ownerId: string): Promise<Note[]>;
};

/**
 * Use-cases. Orchestrates domain rules, the repo and ports. Dependencies are passed in, so
 * unit tests hand it fakes and index.ts hands it the real things.
 */
export function createNoteService(deps: { repo: NoteRepo; email: EmailPort }): NoteService {
  const { repo, email } = deps;

  return {
    async createNote(owner, input) {
      // Soft limit: two concurrent requests can both pass this check. Fine for a courtesy cap;
      // enforce in the database when a limit must be exact.
      const allowed = checkCanAddNote(await repo.countByOwner(owner.id));
      if (!allowed.ok) {
        return allowed;
      }

      const note = await repo.insert({ ownerId: owner.id, title: input.title, body: input.body });
      logger.info({ noteId: note.id, ownerId: owner.id }, "note.created");

      // The confirmation email is best-effort: the note is saved either way, so a vendor outage
      // is logged, not returned as a failure.
      const sent = await email.send({
        to: owner.email,
        subject: `Note saved: ${note.title}`,
        text: `Your note "${note.title}" was saved.`,
      });
      if (!sent.ok) {
        logger.warn({ noteId: note.id, err: sent.error.cause }, "note.confirmation_email_failed");
      }

      return ok(note);
    },

    listNotes(ownerId) {
      return repo.listByOwner(ownerId);
    },
  };
}
