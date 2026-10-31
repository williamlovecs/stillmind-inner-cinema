import assert from "node:assert/strict";
import test from "node:test";
import { consumeResetDraft, PENDING_RESET_DRAFT_KEY, storeResetDraft, type ResetDraft } from "../src/lib/reset-draft";

const draft: ResetDraft = { id: "fresh-id", trigger: "刚才发生了一件事", mode: "looping", activation: 3,
  inputMethod: "typed", options: { eyesOpenPreferred: true, bodyFocusAllowed: false, breathChangeAllowed: false, shareAnonymous: false } };

function memoryStorage() {
  const values = new Map<string, string>();
  return { values, setItem: (key: string, value: string) => { values.set(key, value); },
    getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => { values.delete(key); } };
}

test("input, score and optional consent are transferred atomically and consumed only once", () => {
  const storage = memoryStorage();
  assert.equal(storeResetDraft(storage, draft), true);
  assert.equal(storage.values.size, 1);
  assert.deepEqual(consumeResetDraft(storage, draft.id), draft);
  assert.equal(consumeResetDraft(storage, draft.id), undefined);
});

test("failed writes never let a fresh navigation consume stale private text or consent", () => {
  const storage = memoryStorage();
  storeResetDraft(storage, { ...draft, id: "old-id", trigger: "旧原话", options: { ...draft.options, shareAnonymous: true } });
  assert.equal(storeResetDraft({ setItem: () => { throw new Error("quota"); } }, draft), false);
  assert.equal(consumeResetDraft(storage, draft.id), undefined);
  assert.equal(storage.values.size, 0);
});

test("unavailable storage or failed removal cannot replay a draft", () => {
  assert.equal(storeResetDraft(undefined, draft), false);
  assert.equal(consumeResetDraft(undefined, draft.id), undefined);
  assert.equal(consumeResetDraft({ getItem: () => JSON.stringify(draft), removeItem: () => { throw new Error("denied"); } }, draft.id), undefined);
});

test("malformed, oversized or unsupported drafts are discarded", () => {
  for (const raw of ["{bad", "null", JSON.stringify({ ...draft, trigger: "x".repeat(501) }),
    JSON.stringify({ ...draft, mode: "unknown" }), JSON.stringify({ ...draft, inputMethod: "unknown" })]) {
    const storage = memoryStorage();
    storage.setItem(PENDING_RESET_DRAFT_KEY, raw);
    assert.equal(consumeResetDraft(storage, draft.id), undefined, raw.slice(0, 60));
    assert.equal(storage.values.size, 0);
  }
});

test("invalid scores remain missing and anonymous consent requires an explicit boolean", () => {
  const storage = memoryStorage();
  storage.setItem(PENDING_RESET_DRAFT_KEY, JSON.stringify({ ...draft, activation: "3", options: { shareAnonymous: "true" } }));
  const result = consumeResetDraft(storage, draft.id);
  assert.equal(result?.activation, undefined);
  assert.equal(result?.options.shareAnonymous, false);
});
