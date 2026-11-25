import { describe, expect, it } from "vitest";
import { checkCanAddNote, MAX_NOTES_PER_OWNER, normaliseTitle } from "./note";

describe("normaliseTitle", () => {
  it("trims and collapses whitespace", () => {
    expect(normaliseTitle("  Buy \t milk\n today ")).toBe("Buy milk today");
  });

  it("turns a whitespace-only title into an empty string", () => {
    expect(normaliseTitle(" \n ")).toBe("");
  });
});

describe("checkCanAddNote", () => {
  it("allows a note below the limit", () => {
    expect(checkCanAddNote(MAX_NOTES_PER_OWNER - 1).ok).toBe(true);
  });

  it("rejects a note at the limit with a conflict error", () => {
    expect(checkCanAddNote(MAX_NOTES_PER_OWNER)).toMatchObject({
      ok: false,
      error: { code: "conflict" },
    });
  });
});
