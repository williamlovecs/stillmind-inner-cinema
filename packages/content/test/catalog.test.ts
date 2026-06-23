import assert from "node:assert/strict";
import test from "node:test";
import { METHOD_CATALOG } from "@stillmind/domain";
import { getPracticeVariant, PRACTICE_VARIANTS } from "../src/index";

test("every method has an original offline practice script", () => {
  for (const method of METHOD_CATALOG) {
    assert.equal(PRACTICE_VARIANTS.some((variant) => variant.methodId === method.id), true, method.id);
  }
});

test("every declared duration resolves to a complete exact-length variant", () => {
  for (const method of METHOD_CATALOG) {
    for (const minutes of method.durations) {
      const practice = getPracticeVariant(method.id, minutes);
      assert.ok(practice, `${method.id}/${minutes}`);
      assert.equal(practice.minutes, minutes, `${method.id}/${minutes}`);
      assert.equal(practice.steps.reduce((sum, step) => sum + step.seconds, 0), minutes * 60, `${method.id}/${minutes}`);
      assert.equal(practice.steps.every((step) => step.seconds > 0 && step.title.trim() && step.instruction.trim()), true, `${method.id}/${minutes}`);
    }
  }
});

test("an unsupported duration falls back without pretending to match it", () => {
  const practice = getPracticeVariant("inner-cinema", 10);
  assert.ok(practice);
  assert.notEqual(practice.minutes, 10);
});
