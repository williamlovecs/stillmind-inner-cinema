import assert from "node:assert/strict";
import test from "node:test";
import { OPTIONS, POST } from "../src/app/api/events/route";

const safeEnvelope = {
  schemaVersion: 1,
  name: "reset_entry_submitted",
  anonymousId: "anon_12345678",
  platform: "web",
  payload: {
    mode: "looping",
    activation_bucket: 3,
    input_method: "typed",
    text_provided: true,
  },
};

test("events endpoint is CORS-ready and never caches", () => {
  const response = OPTIONS();
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("valid events are safely accepted when analytics is not configured", async () => {
  const previous = process.env.POSTHOG_PROJECT_API_KEY;
  delete process.env.POSTHOG_PROJECT_API_KEY;
  try {
    const response = await POST(request(safeEnvelope, "valid-event"));
    assert.equal(response.status, 202);
    assert.deepEqual(await response.json(), { accepted: false, reason: "not-configured" });
  } finally {
    if (previous === undefined) delete process.env.POSTHOG_PROJECT_API_KEY;
    else process.env.POSTHOG_PROJECT_API_KEY = previous;
  }
});

test("raw user text and unknown fields are rejected", async () => {
  const response = await POST(request({ ...safeEnvelope, trigger: "private words" }, "unsafe-event"));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { accepted: false, reason: "invalid-event" });
});

test("malformed JSON is rejected without throwing", async () => {
  const response = await POST(new Request("http://localhost/api/events", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "invalid-json" },
    body: "{not-json",
  }));
  assert.equal(response.status, 400);
});

function request(body: unknown, ip: string) {
  return new Request("http://localhost/api/events", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}
