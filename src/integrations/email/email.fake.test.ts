import { describe, expect, it } from "vitest";
import { emailContract } from "./email.contract";
import { createFakeEmail } from "./email.fake";

describe("fake email: port contract", () => {
  emailContract(createFakeEmail);
});

describe("fake email: test helpers", () => {
  it("records accepted messages in order", async () => {
    const email = createFakeEmail();

    await email.send({ to: "a@example.com", subject: "First", text: "1" });
    await email.send({ to: "b@example.com", subject: "Second", text: "2" });

    expect(email.sent.map((message) => message.subject)).toEqual(["First", "Second"]);
  });

  it("fails exactly once after failNext()", async () => {
    const email = createFakeEmail();
    const message = { to: "a@example.com", subject: "Hi", text: "1" };

    email.failNext();

    expect((await email.send(message)).ok).toBe(false);
    expect((await email.send(message)).ok).toBe(true);
    expect(email.sent).toHaveLength(1);
  });
});
