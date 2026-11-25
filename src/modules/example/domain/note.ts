import { appError, err, ok, type Result } from "@/platform/errors";

/** Pure business rules for notes. No I/O, no framework, no vendor imports. */

export const MAX_NOTES_PER_OWNER = 100;
export const MAX_TITLE_LENGTH = 120;

export type Note = {
  readonly id: string;
  readonly ownerId: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: Date;
};

export type NoteOwner = {
  readonly id: string;
  readonly email: string;
};

/** Titles are stored with collapsed whitespace, so "a   b" and " a b " are the same title. */
export function normaliseTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function checkCanAddNote(currentCount: number): Result<void> {
  if (currentCount >= MAX_NOTES_PER_OWNER) {
    return err(appError("conflict", `You can keep at most ${MAX_NOTES_PER_OWNER} notes`));
  }
  return ok(undefined);
}
