import { z } from "zod";
import { MAX_TITLE_LENGTH, type Note, normaliseTitle } from "./domain/note";

/** Input accepted from the outside world. Routes parse with this before calling the service. */
export const createNoteInputSchema = z.object({
  title: z
    .string()
    .transform(normaliseTitle)
    .pipe(z.string().min(1, "Title is required").max(MAX_TITLE_LENGTH)),
  body: z.string().max(10_000).default(""),
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

/** What leaves the module over HTTP. Never return a domain object or a table row directly. */
export type NoteDto = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
};

export function toNoteDto(note: Note): NoteDto {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
  };
}
