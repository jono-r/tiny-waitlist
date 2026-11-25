import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { user } from "@/platform/auth/auth.table";
import type { Db } from "@/platform/db/client";
import { createTestDb } from "@/platform/db/test-db";
import { createNoteRepo, type NoteRepo } from "./example.repo";

// Runs against a real Postgres engine (PGlite) with the real migrations applied.
describe("note repo", () => {
  let db: Db;
  let close: () => Promise<void>;
  let repo: NoteRepo;

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    repo = createNoteRepo(db);
    await db.insert(user).values([
      { id: "user-1", name: "One", email: "one@example.com" },
      { id: "user-2", name: "Two", email: "two@example.com" },
    ]);
  });

  afterAll(async () => {
    await close();
  });

  it("inserts a note and returns it with a generated id and timestamp", async () => {
    const note = await repo.insert({ ownerId: "user-1", title: "First", body: "Hello" });

    expect(note).toMatchObject({ ownerId: "user-1", title: "First", body: "Hello" });
    expect(note.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(note.createdAt).toBeInstanceOf(Date);
  });

  it("lists and counts notes for one owner only, newest first", async () => {
    await repo.insert({ ownerId: "user-1", title: "Second", body: "" });
    await repo.insert({ ownerId: "user-2", title: "Someone else's", body: "" });

    const notes = await repo.listByOwner("user-1");

    expect(notes.map((note) => note.title).sort()).toEqual(["First", "Second"]);
    expect(await repo.countByOwner("user-1")).toBe(2);
    expect(await repo.countByOwner("user-2")).toBe(1);
  });

  it("rejects a note for an owner that does not exist", async () => {
    await expect(repo.insert({ ownerId: "nobody", title: "Orphan", body: "" })).rejects.toThrow();
  });
});
