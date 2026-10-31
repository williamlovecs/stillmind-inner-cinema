import assert from "node:assert/strict";
import test from "node:test";
import { METHOD_CATALOG } from "@stillmind/domain";
import { getPracticeVariant, PRACTICES_BY_METHOD, PRACTICE_VARIANTS } from "../src/index";

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

test("scaled durations disclose the same guidance and use the revised content version", () => {
  const scaled = getPracticeVariant("inner-cinema", 3);
  assert.ok(scaled);
  assert.match(scaled.subtitle, /同一引导/);
  assert.equal(scaled.contentVersion, "1.1.0");
  const open = getPracticeVariant("open-awareness", 5);
  assert.ok(open);
  assert.doesNotMatch(open.steps.map(step => step.instruction).join(""), /已经|曾经触到/);
});

test("scaled variants keep the authored step order, ids, kinds and guidance text", () => {
  for (const method of METHOD_CATALOG) {
    const base = getPracticeVariant(method.id, method.durations[0]);
    assert.ok(base, method.id);
    for (const minutes of method.durations) {
      const scaled = getPracticeVariant(method.id, minutes);
      assert.ok(scaled, `${method.id}/${minutes}`);
      assert.equal(scaled.steps.length, base.steps.length, `${method.id}/${minutes}`);
      assert.deepEqual(scaled.steps.map(step => step.id), base.steps.map(step => step.id), method.id);
      assert.deepEqual(scaled.steps.map(step => step.kind), base.steps.map(step => step.kind), method.id);
      assert.deepEqual(scaled.steps.map(step => step.instruction), base.steps.map(step => step.instruction), method.id);
      assert.deepEqual(scaled.steps.map(step => step.alternative), base.steps.map(step => step.alternative), method.id);
    }
  }
});

test("the method index matches the variant list and unknown ids resolve to undefined", () => {
  for (const variant of PRACTICE_VARIANTS) {
    assert.deepEqual(PRACTICES_BY_METHOD.get(variant.methodId)?.some(item => item.id === variant.id), true, variant.id);
  }
  const indexed = [...PRACTICES_BY_METHOD.values()].flat().length;
  assert.equal(indexed, PRACTICE_VARIANTS.length);
  assert.equal(getPracticeVariant("no-such-method" as never, 1), undefined);
  assert.equal(PRACTICES_BY_METHOD.get("no-such-method" as never), undefined);
});
