import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

const testSchema = z.object({
  FAMILYSEARCH_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  FAMILYSEARCH_CLIENT_ID: z.string().min(1),
  APP_URL: z.string().url(),
});

test("Environment validation passes with valid input", () => {
  const result = testSchema.safeParse({
    FAMILYSEARCH_ENV: "sandbox",
    FAMILYSEARCH_CLIENT_ID: "test-client-id",
    APP_URL: "http://localhost:3000",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.FAMILYSEARCH_ENV, "sandbox");
    assert.equal(result.data.FAMILYSEARCH_CLIENT_ID, "test-client-id");
  }
});

test("Environment validation fails when required keys are missing", () => {
  const result = testSchema.safeParse({
    FAMILYSEARCH_ENV: "invalid-env",
    APP_URL: "not-a-url",
  });

  assert.equal(result.success, false);
});
