import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../src/app/api/cinema/route";

// Provider responses are synthetic. These tests never consume a real API key or provider credit.
const payload = {
  title: "一幕", innerNoise: ["想马上回应"],
  scenes: [{ label: "镜头 01", line: "刚才有人提出不同意见。" }, { label: "镜头 02", line: "先停一下，看见这一幕。" }],
  roleView: "一个人想要回应。", audienceView: "看见这一幕。", witnessView: "此刻可以先停一下。",
};
let ip = 10;
async function withProvider(reply: () => Promise<Response>, verify: (data: { source: string; cinema: typeof payload }) => void) {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.STEPFUN_API_KEY;
  process.env.STEPFUN_API_KEY = "synthetic-test-only";
  globalThis.fetch = reply;
  try {
    const request = new Request("http://localhost/api/cinema", { method: "POST", headers: {"Content-Type":"application/json", "x-forwarded-for":`192.0.2.${ip++}`}, body: JSON.stringify({ trigger: "测试场景：会议上出现不同意见。" }) });
    const response = await POST(request);
    assert.equal(response.status, 200); verify(await response.json());
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.STEPFUN_API_KEY;
    else process.env.STEPFUN_API_KEY = previousKey;
  }
}
function completion(content: unknown) { return Response.json({ choices: [{ message: { content } }] }); }
test("provider structured JSON is normalized and honestly marked stepfun", async () => {
  await withProvider(async () => completion(JSON.stringify(payload)), data => {
    assert.equal(data.source, "stepfun"); assert.equal(data.cinema.title, payload.title); assert.equal(data.cinema.scenes.length, 2);
  });
});
test("provider fenced JSON is accepted without pretending prose is JSON", async () => {
  await withProvider(async () => completion("```json\n" + JSON.stringify(payload) + "\n```"), data => assert.equal(data.source, "stepfun"));
});
test("truncated JSON and prose fallback never use a stepfun badge", async () => {
  for (const value of ['{"title":"unfinished', "这里是一段并非 JSON 的文字。", null]) {
    await withProvider(async () => completion(value), data => assert.equal(data.source, "preset"));
  }
});
test("invalid structures and prohibited identity claims are rejected", async () => {
  for (const value of [{ ...payload, scenes: [] }, { ...payload, witnessView: "你就是一个固定类型的人。" }, { ...payload, title: "" }]) {
    await withProvider(async () => completion(JSON.stringify(value)), data => assert.equal(data.source, "preset"));
  }
});
test("provider failure and aborted requests retain a usable preset", async () => {
  await withProvider(async () => new Response("unavailable", { status: 503 }), data => assert.equal(data.source, "preset"));
  await withProvider(async () => { throw new DOMException("synthetic timeout", "AbortError"); }, data => assert.equal(data.source, "preset"));
});
