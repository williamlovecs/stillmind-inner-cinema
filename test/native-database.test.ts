import assert from "node:assert/strict";
import test from "node:test";
import { createDatabaseOpener } from "../mobile/src/storage/database-opener";

type FakeDb = { id: number };

test("a transient open failure is retried on the next call, not cached forever", async () => {
  let attempts = 0;
  const opener = createDatabaseOpener<FakeDb>(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("transient open failure");
    return { id: attempts };
  });
  await assert.rejects(opener(), /transient open failure/);
  const db = await opener();
  assert.equal(attempts, 2, "second call must reopen the database");
  assert.equal(db.id, 2);
  const again = await opener();
  assert.equal(again.id, 2, "the successful open stays cached");
});

test("concurrent callers share one successful open", async () => {
  let attempts = 0;
  const opener = createDatabaseOpener<FakeDb>(async () => {
    attempts += 1;
    return { id: attempts };
  });
  const [first, second] = await Promise.all([opener(), opener()]);
  assert.equal(attempts, 1);
  assert.equal(first, second);
});
