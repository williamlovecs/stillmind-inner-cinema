import assert from "node:assert/strict";
import test from "node:test";
import { allowedOrigin, corsHeaders, requestPolicyError } from "../src/lib/request-policy";
import { POST as cinema, OPTIONS } from "../src/app/api/cinema/route";
import { POST as events } from "../src/app/api/events/route";

function request(headers: Record<string, string> = {}, trigger = "收到一条消息") {
  return new Request("https://stillmind.test/api/cinema", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify({ trigger }) });
}
test("origins are exact; native clients need no Origin; hostile browsers cannot preflight", () => {
  const previous = process.env.STILLMIND_ALLOWED_ORIGINS;
  process.env.STILLMIND_ALLOWED_ORIGINS = "https://mobile.test";
  try {
    for (const origin of ["null", "https://stillmind.test.evil.test", "https://mobile.test/path", "https://evil.test"]) {
      const req = request({ origin });
      assert.equal(allowedOrigin(req), false);
      assert.equal(OPTIONS(req).status, 403);
      assert.equal(corsHeaders(req)["Access-Control-Allow-Origin"], undefined);
    }
    for (const origin of ["https://stillmind.test", "https://mobile.test"]) {
      assert.equal(allowedOrigin(request({ origin })), true);
      assert.equal(corsHeaders(request({ origin }))["Access-Control-Allow-Origin"], origin);
    }
    assert.equal(allowedOrigin(request()), true);
    assert.equal(allowedOrigin(request({ "sec-fetch-site": "cross-site" })), false);
    assert.equal(requestPolicyError(request({ "content-type": "text/plain" }))?.status, 415);
  } finally {
    if (previous === undefined) delete process.env.STILLMIND_ALLOWED_ORIGINS;
    else process.env.STILLMIND_ALLOWED_ORIGINS = previous;
  }
});
test("malformed, non-http and allowlisted origins follow the exact-match policy", () => {
  const previous = process.env.STILLMIND_ALLOWED_ORIGINS;
  process.env.STILLMIND_ALLOWED_ORIGINS = "https://a.test, https://b.test";
  try {
    for (const origin of ["chrome-extension://abcdef", "http://[::1", "ftp://stillmind.test", "https://stillmind.test:443", " about:blank //"]) {
      assert.equal(allowedOrigin(request({ origin })), false, origin);
      assert.equal(corsHeaders(request({ origin }))["Access-Control-Allow-Origin"], undefined, origin);
    }
    for (const origin of ["https://a.test", "https://b.test"]) {
      assert.equal(allowedOrigin(request({ origin })), true, origin);
      assert.equal(corsHeaders(request({ origin }))["Access-Control-Allow-Origin"], origin, origin);
    }
    const headers = corsHeaders(request({ origin: "https://a.test" }));
    assert.equal(headers.Vary, "Origin");
    assert.equal(headers["Cache-Control"], "no-store");
  } finally {
    if (previous === undefined) delete process.env.STILLMIND_ALLOWED_ORIGINS;
    else process.env.STILLMIND_ALLOWED_ORIGINS = previous;
  }
});
test("both APIs reject hostile origins and simple form bodies before any upstream I/O", async () => {
  const oldFetch = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw Error("no upstream"); };
  try {
    for (const route of [cinema, events]) {
      assert.equal((await route(request({ origin: "https://evil.test" }))).status, 403);
      assert.equal((await route(request({ "content-type": "text/plain" }))).status, 415);
    }
    assert.equal(calls, 0);
  } finally { globalThis.fetch = oldFetch; }
});
test("long input cannot truncate away the safety boundary or silently change the submitted event", async () => {
  assert.equal((await cinema(request({}, "a".repeat(501)))).status, 400);
  assert.equal((await cinema(request({}, "a".repeat(501) + "我现在无法保证自己安全"))).status, 422);
});

test("rotating forwarded addresses cannot bypass the per-instance provider budget", async () => {
  const oldFetch = globalThis.fetch, oldKey = process.env.STEPFUN_API_KEY;
  let calls = 0;
  process.env.STEPFUN_API_KEY = "synthetic-never-sent";
  globalThis.fetch = async () => { calls++; return Response.json({ choices: [] }); };
  try {
    for (let i = 0; i < 40; i++) {
      const result = await cinema(request({ "x-forwarded-for": `rotated-${i}` }));
      assert.equal(result.status, 200);
      assert.equal((await result.json()).source, "preset");
    }
    assert.ok(calls > 0 && calls <= 30, `paid calls: ${calls}`);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.STEPFUN_API_KEY; else process.env.STEPFUN_API_KEY = oldKey;
  }
});
