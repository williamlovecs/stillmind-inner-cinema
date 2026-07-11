import assert from "node:assert/strict";
import test from "node:test";
import { resolveResetIntensity } from "../src/lib/reset-routing";

test("stored reset intensity wins and survives route hydration", () => {
  assert.deepEqual(resolveResetIntensity("7", "4", 8), {
    value: 7,
    supplied: true,
  });
});

test("query intensity preserves the entry score when session storage is unavailable", () => {
  assert.deepEqual(resolveResetIntensity(null, "7", 8), {
    value: 7,
    supplied: true,
  });
});

test("invalid values use the recommendation fallback and valid values are clamped", () => {
  assert.deepEqual(resolveResetIntensity("", "nope", 8), {
    value: 8,
    supplied: false,
  });
  assert.deepEqual(resolveResetIntensity("14", null, 8), {
    value: 10,
    supplied: true,
  });
});
