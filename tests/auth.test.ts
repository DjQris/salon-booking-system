import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../lib/auth-crypto";

test("admin passwords use independent salts and reject incorrect credentials", () => {
  const password = "test-only-password-for-verification";
  const first = hashPassword(password);
  const second = hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(verifyPassword(password, first), true);
  assert.equal(verifyPassword("incorrect", first), false);
  assert.equal(verifyPassword(password, "invalid"), false);
});
