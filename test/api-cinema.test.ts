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

function streamRequest(stream: ReadableStream<Uint8Array>) {
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `test-${Math.random()}` },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" };
  return new Request("http://localhost/api/cinema", init);
}

function jsonAtByteLength(bytes: number): string {
  const envelope = JSON.stringify({ trigger: "hello", padding: "" });
  const paddingBytes = bytes - Buffer.byteLength(envelope);
  assert.ok(paddingBytes >= 0);
  const body = JSON.stringify({ trigger: "hello", padding: "x".repeat(paddingBytes) });
  assert.equal(Buffer.byteLength(body), bytes);
  return body;
}

async function withoutProviderKey(run: () => Promise<void>): Promise<void> {
  const prior = process.env.STEPFUN_API_KEY;
  delete process.env.STEPFUN_API_KEY;
  try {
    await run();
  } finally {
    if (prior === undefined) delete process.env.STEPFUN_API_KEY;
    else process.env.STEPFUN_API_KEY = prior;
  }
}

test("cinema API rejects missing and oversized input", async () => {
  const missing = await POST(request({}));
  assert.equal(missing.status, 400);
  assert.deepEqual(await missing.json(), { error: "missing-trigger" });

  const oversized = await POST(request({ trigger: "hello" }, { "content-length": "5000" }));
  assert.equal(oversized.status, 413);
  assert.deepEqual(await oversized.json(), { error: "payload-too-large" });
});

test("cinema API enforces its byte limit without a content-length header", async () => {
  const prior = process.env.STEPFUN_API_KEY;
  delete process.env.STEPFUN_API_KEY;
  try {
    const attack = request({ trigger: "hello", padding: "🧠".repeat(1_100) });
    assert.equal(attack.headers.has("content-length"), false);
    const response = await POST(attack);
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: "payload-too-large" });
  } finally {
    if (prior === undefined) delete process.env.STEPFUN_API_KEY;
    else process.env.STEPFUN_API_KEY = prior;
  }
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

test("cinema API does not let abnormal content-length headers bypass the byte limit", () => withoutProviderKey(async () => {
  for (const contentLength of ["not-a-number", "-1", "Infinity", "4096.5", ""]) {
    const attack = request(
      { trigger: "hello", padding: "x".repeat(4_097) },
      { "content-length": contentLength },
    );
    assert.equal(attack.headers.get("content-length"), contentLength);
    const response = await POST(attack);
    assert.equal(response.status, 413, `content-length: ${JSON.stringify(contentLength)}`);
    assert.deepEqual(await response.json(), { error: "payload-too-large" });
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
}));

test("cinema API accepts a valid body at exactly 4096 bytes", () => withoutProviderKey(async () => {
  const exact = new Request("http://localhost/api/cinema", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `test-${Math.random()}` },
    body: jsonAtByteLength(4_096),
  });
  assert.equal(exact.headers.has("content-length"), false);
  const response = await POST(exact);
  assert.equal(response.status, 200);
  const body = await response.json() as { source?: string };
  assert.equal(body.source, "preset");
}));

test("cinema API rejects a valid body one byte above the limit", () => withoutProviderKey(async () => {
  const attack = new Request("http://localhost/api/cinema", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `test-${Math.random()}` },
    body: jsonAtByteLength(4_097),
  });
  assert.equal(attack.headers.has("content-length"), false);
  const response = await POST(attack);
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "payload-too-large" });
}));

test("cinema API decodes multibyte UTF-8 split across single-byte chunks", () => withoutProviderKey(async () => {
  const encoded = new TextEncoder().encode(JSON.stringify({ trigger: "批评🧠" }));
  let offset = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset === encoded.byteLength) {
        controller.close();
        return;
      }
      controller.enqueue(encoded.slice(offset, offset + 1));
      offset += 1;
    },
  });
  const response = await POST(streamRequest(stream));
  assert.equal(response.status, 200);
  const body = await response.json() as { cinema?: { title?: string }; source?: string };
  assert.equal(body.source, "preset");
  assert.equal(body.cinema?.title, "冲突之后的回声");
}));

test("cinema API safely handles stream read failure and releases the reader lock", async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"trigger":"hello"'));
    },
    pull(controller) {
      controller.error(new Error("sensitive-stream-detail"));
    },
  });
  const response = await POST(streamRequest(stream));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "missing-trigger" });
  assert.equal(response.headers.get("cache-control"), "no-store");
  const reader = stream.getReader();
  reader.releaseLock();
});

test("cinema API contains cancel rejection and releases the lock after rejecting oversized input", async () => {
  let cancelCalls = 0;
  let readFailureTimer: ReturnType<typeof setTimeout> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(jsonAtByteLength(4_097)));
    },
    pull(controller) {
      readFailureTimer = setTimeout(() => {
        controller.error(new Error("old-implementation-read-failure"));
      }, 25);
    },
    cancel() {
      if (readFailureTimer) clearTimeout(readFailureTimer);
      cancelCalls += 1;
      return Promise.reject(new Error("sensitive-cancel-detail"));
    },
  });
  const response = await POST(streamRequest(stream));
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "payload-too-large" });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(cancelCalls, 1);
  const reader = stream.getReader();
  reader.releaseLock();
});
