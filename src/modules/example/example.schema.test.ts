import { describe, expect, it } from "vitest";
import { createNoteInputSchema } from "./example.schema";

describe("createNoteInputSchema", () => {
  it("normalises the title and defaults the body", () => {
    expect(createNoteInputSchema.parse({ title: "  Hello   world " })).toEqual({
      title: "Hello world",
      body: "",
    });
  });

  it("rejects a title that is empty after normalising", () => {
    expect(createNoteInputSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("rejects a title over the limit", () => {
    expect(createNoteInputSchema.safeParse({ title: "x".repeat(121) }).success).toBe(false);
  });
});
