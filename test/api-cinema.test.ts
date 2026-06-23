import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../src/app/api/cinema/route";

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/cinema", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `test-${Math.random()}`, ...headers },
    body: JSON.stringify(body),
  });
}

test("cinema API rejects missing and oversized input", async () => {
  const missing = await POST(request({}));
  assert.equal(missing.status, 400);
  assert.deepEqual(await missing.json(), { error: "missing-trigger" });

  const oversized = await POST(request({ trigger: "hello" }, { "content-length": "5000" }));
  assert.equal(oversized.status, 413);
  assert.deepEqual(await oversized.json(), { error: "payload-too-large" });
});

test("cinema API routes high-risk language to the safety boundary", async () => {
  const response = await POST(request({ trigger: "我现在无法保证自己安全" }));
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: "safety-boundary" });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("cinema API always returns a complete safe preset without a provider key", async () => {
  const prior = process.env.STEPFUN_API_KEY;
  delete process.env.STEPFUN_API_KEY;
  try {
    const response = await POST(request({ trigger: "我被同事批评后想立刻反击" }));
    const body = await response.json() as { cinema?: { title?: string; scenes?: unknown[] }; source?: string; detail?: unknown };
    assert.equal(response.status, 200);
    assert.equal(body.source, "preset");
    assert.equal(body.cinema?.title, "冲突之后的回声");
    assert.equal(body.cinema?.scenes?.length, 3);
    assert.equal("detail" in body, false);
  } finally {
    if (prior) process.env.STEPFUN_API_KEY = prior;
  }
});
