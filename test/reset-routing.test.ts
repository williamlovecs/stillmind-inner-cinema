import assert from "node:assert/strict";
import test from "node:test";
import { resolveResetActivation, resolveResetIntensity } from "../src/lib/reset-routing";

test("the shared five-point activation wins over legacy values", () => {
  assert.deepEqual(resolveResetActivation("4", "2", "9", "8", 3), { value: 4, supplied: true });
  assert.deepEqual(resolveResetActivation(null, "5", "2", "3", 3), { value: 5, supplied: true });
});

test("legacy ten-point scores migrate only when no five-point value is present", () => {
  assert.deepEqual(resolveResetActivation(null, null, "7", null, 3), { value: 4, supplied: true });
  assert.deepEqual(resolveResetActivation(null, null, null, "2", 3), { value: 2, supplied: true });
  assert.deepEqual(resolveResetActivation("nope", "", "", "", 3), { value: 3, supplied: false });
});

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
