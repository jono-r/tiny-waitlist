import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

// Smoke tests: prove the deployed shape works end to end (browser -> Next -> auth -> module -> Postgres).
// Keep this file small. Business rules are tested in unit and integration tests, not here.

test("home page renders in a real browser", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

test("notes API rejects anonymous callers, then works for a signed-up user", async ({
  request,
}) => {
  expect((await request.get("/api/notes")).status()).toBe(401);

  const signUp = await request.post("/api/auth/sign-up/email", {
    data: {
      name: "Smoke Test",
      email: `smoke-${randomUUID()}@example.com`,
      password: randomUUID(),
    },
  });
  expect(signUp.status()).toBe(200);

  const invalid = await request.post("/api/notes", { data: { title: "   " } });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toMatchObject({ error: { code: "validation" } });

  const created = await request.post("/api/notes", {
    data: { title: "  First   note ", body: "Hello" },
  });
  expect(created.status()).toBe(201);
  expect(await created.json()).toMatchObject({ note: { title: "First note", body: "Hello" } });

  const listed = await request.get("/api/notes");
  expect(listed.status()).toBe(200);
  expect((await listed.json()).notes).toHaveLength(1);
});
