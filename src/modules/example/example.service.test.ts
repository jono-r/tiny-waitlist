import { describe, expect, it } from "vitest";
import { createFakeEmail } from "@/integrations/email";
import { MAX_NOTES_PER_OWNER, type Note } from "./domain/note";
import type { NoteRepo } from "./example.repo";
import { createNoteService } from "./example.service";

const owner = { id: "user-1", email: "owner@example.com" };

function createFakeRepo(seed: Note[] = []): NoteRepo & { readonly rows: Note[] } {
  const rows = [...seed];
  return {
    rows,
    async insert(note) {
      const row = { ...note, id: `note-${rows.length + 1}`, createdAt: new Date(0) };
      rows.push(row);
      return row;
    },
    async countByOwner(ownerId) {
      return rows.filter((row) => row.ownerId === ownerId).length;
    },
    async listByOwner(ownerId) {
      return rows.filter((row) => row.ownerId === ownerId);
    },
  };
}

function setup(seed: Note[] = []) {
  const repo = createFakeRepo(seed);
  const email = createFakeEmail();
  return { repo, email, service: createNoteService({ repo, email }) };
}

describe("createNote", () => {
  it("saves the note for its owner and emails a confirmation", async () => {
    const { repo, email, service } = setup();

    const result = await service.createNote(owner, { title: "Groceries", body: "Milk" });

    expect(result).toMatchObject({ ok: true, value: { ownerId: "user-1", title: "Groceries" } });
    expect(repo.rows).toHaveLength(1);
    expect(email.sent).toEqual([
      expect.objectContaining({ to: "owner@example.com", subject: "Note saved: Groceries" }),
    ]);
  });

  it("returns a conflict and saves nothing when the owner is at the limit", async () => {
    const full = Array.from({ length: MAX_NOTES_PER_OWNER }, (_, i) => ({
      id: `seed-${i}`,
      ownerId: owner.id,
      title: "Seed",
      body: "",
      createdAt: new Date(0),
    }));
    const { repo, email, service } = setup(full);

    const result = await service.createNote(owner, { title: "One too many", body: "" });

    expect(result).toMatchObject({ ok: false, error: { code: "conflict" } });
    expect(repo.rows).toHaveLength(MAX_NOTES_PER_OWNER);
    expect(email.sent).toHaveLength(0);
  });

  it("still succeeds when the confirmation email fails", async () => {
    const { repo, email, service } = setup();
    email.failNext();

    const result = await service.createNote(owner, { title: "Groceries", body: "" });

    expect(result.ok).toBe(true);
    expect(repo.rows).toHaveLength(1);
  });
});

describe("listNotes", () => {
  it("returns only the owner's notes", async () => {
    const { service } = setup();
    await service.createNote(owner, { title: "Mine", body: "" });
    await service.createNote(
      { id: "user-2", email: "other@example.com" },
      { title: "Theirs", body: "" },
    );

    const notes = await service.listNotes(owner.id);

    expect(notes.map((note) => note.title)).toEqual(["Mine"]);
  });
});
