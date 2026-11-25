import { count, desc, eq } from "drizzle-orm";
import type { Db } from "@/platform/db/client";
import { invariant } from "@/platform/errors";
import type { Note } from "./domain/note";
import { notes } from "./example.table";

/** Persistence the service needs. The service depends on this type, so unit tests can fake it. */
export type NoteRepo = {
  insert(note: Pick<Note, "ownerId" | "title" | "body">): Promise<Note>;
  countByOwner(ownerId: string): Promise<number>;
  listByOwner(ownerId: string): Promise<Note[]>;
};

/** The only code in this module that talks to the database. No business rules in here. */
export function createNoteRepo(db: Db): NoteRepo {
  return {
    async insert(note) {
      const [row] = await db.insert(notes).values(note).returning();
      invariant(row, "insert into notes returned no row");
      return row;
    },

    async countByOwner(ownerId) {
      const [row] = await db
        .select({ value: count() })
        .from(notes)
        .where(eq(notes.ownerId, ownerId));
      return row?.value ?? 0;
    },

    async listByOwner(ownerId) {
      return db
        .select()
        .from(notes)
        .where(eq(notes.ownerId, ownerId))
        .orderBy(desc(notes.createdAt), desc(notes.id));
    },
  };
}
