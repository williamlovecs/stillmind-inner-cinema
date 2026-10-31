import assert from "node:assert/strict";
import test from "node:test";
import { readBoundedJson, WindowRateLimit } from "../src/lib/server-limits";
import { POST as cinema } from "../src/app/api/cinema/route";
import { POST as events } from "../src/app/api/events/route";
import { resolveResetActivation } from "../src/lib/reset-routing";
import { buildWeeklyReview, METHOD_BY_ID, type PracticeSession } from "@stillmind/domain";

function request(body: string, id: string, extra: Record<string,string> = {}) {
  return new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": id, ...extra }, body });
}
test("bounded JSON rejects actual UTF-8 bytes with absent or forged Content-Length", async () => {
  for (const extra of [{}, {"content-length":"1"}] as Record<string, string>[]) {
    const result = await readBoundedJson(request(JSON.stringify({ text: "中".repeat(200) }), "body-test", extra), 100);
    assert.equal(result.ok, false); if (!result.ok) assert.equal(result.status, 413);
  }
});
test("bounded JSON decodes UTF-8 split across arbitrary stream chunks", async () => {
  const bytes = new TextEncoder().encode('{"text":"中🙂"}');
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>({start(c) { for (const byte of bytes) c.enqueue(new Uint8Array([byte])); c.close(); }});
  assert.deepEqual(await readBoundedJson({headers:new Headers(),body}, 100), {ok:true,value:{text:"中🙂"}});
});
test("bounded JSON rejects invalid encoding, malformed JSON and an idle stream", async () => {
  for (const body of [new Response("{broken"), new Response(new Uint8Array([255]))]) {
    const result = await readBoundedJson(body, 100); assert.equal(result.ok, false);
  }
  let cancelled = false;
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>({cancel() { cancelled = true; }});
  const result = await readBoundedJson({headers:new Headers(),body}, 100, 10);
  assert.equal(result.ok, false); if (!result.ok) assert.equal(result.status, 408);
  assert.equal(cancelled, true);
});
test("rate map rejects new identifiers at capacity without evicting active limits", () => {
  const rate = new WindowRateLimit(2, 100, 2);
  assert.equal(rate.allow("a",0),true);assert.equal(rate.allow("a",0),true);assert.equal(rate.allow("a",0),false);
  assert.equal(rate.allow("b",0),true);assert.equal(rate.allow("c",0),false);assert.equal(rate.size,2);
  assert.equal(rate.allow("a",0),false);assert.equal(rate.allow("c",101),true);assert.ok(rate.size<=2);
  assert.equal(rate.allow("x".repeat(129),101),false);
});
test("both API routes reject oversized requests before provider or sink calls", async () => {
  const oldFetch=globalThis.fetch; let calls=0;
  globalThis.fetch=async()=>{calls++;throw Error("must not call external services");};
  try {
    for (const [route,id] of [[cinema,"r2-cinema"],[events,"r2-events"]] as const) {
      const response=await route(request(JSON.stringify({trigger:"中".repeat(4000)}),id,{"content-length":"1"}));
      assert.equal(response.status,413);assert.equal(response.headers.get("cache-control"),"no-store");
    }
    assert.equal(calls,0);
  } finally {globalThis.fetch=oldFetch;}
});
const payload={title:"一幕",innerNoise:["想回应"],scenes:[{label:"镜头 01",line:"刚才有不同意见。"},{label:"镜头 02",line:"先暂停一下。"}],roleView:"一个人想回应。",audienceView:"看见这一幕。",witnessView:"可以先停一下。"};
test("provider labels and blank essential views cannot bypass output validation", async () => {
  const previousFetch=globalThis.fetch, previousKey=process.env.STEPFUN_API_KEY;
  process.env.STEPFUN_API_KEY="synthetic-only";
  try {
    for (const [index,value] of [
      {...payload,scenes:[{label:"你就是控制型人格",line:"一句话。"},payload.scenes[1]]},
      {...payload,audienceView:"   "}, {...payload,witnessView:""},
    ].entries()) {
      globalThis.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify(value)}}]});
      const response=await cinema(request('{"trigger":"测试：收到不同意见。"}',`r2-provider-${index}`));
      assert.equal((await response.json()).source,"preset");
    }
  } finally {globalThis.fetch=previousFetch;if(previousKey===undefined)delete process.env.STEPFUN_API_KEY;else process.env.STEPFUN_API_KEY=previousKey;}
});
test("out-of-range current and migrated scores are not fabricated self-reports", () => {
  for(const value of ["0","6","999","-1","2.5","NaN","Infinity"]) {
    assert.deepEqual(resolveResetActivation(value,null,null,null,3),{value:3,supplied:false});
  }
  assert.deepEqual(resolveResetActivation("99","2",null,null,3),{value:2,supplied:true});
  assert.deepEqual(resolveResetActivation(null,null,"99",null,3),{value:3,supplied:false});
  assert.deepEqual(resolveResetActivation(null,null,"7",null,3),{value:4,supplied:true});
});
function row(id: string, methodId: PracticeSession["methodId"], result: PracticeSession["result"]): PracticeSession {
  return {id,schemaVersion:1,startedAt:"2026-09-01T12:00:00Z",status:"completed",mode:"curious",methodId,durationSeconds:60,contentVersion:"1.1.0",result};
}
test("weekly positives are attributed to the method that actually received them", () => {
  const records=[row("a","inner-cinema","same"),row("b","inner-cinema","same"),row("c","inner-cinema","same"),row("d","wide-gaze","better"),row("e","wide-gaze","better")];
  const review=buildWeeklyReview(records,new Date("2026-09-01T00:00:00Z"));
  assert.equal(review.nextStep.methodId,"wide-gaze");assert.match(review.nextStep.body,/2 次/);
});
test("weekly recommendation never promises a duration absent from the method catalog", () => {
  for(const records of [[row("a","open-awareness","better"),row("b","open-awareness","better")],[row("a","open-awareness","same"),row("b","open-awareness","same")]]) {
    const next=buildWeeklyReview(records,new Date("2026-09-01T00:00:00Z")).nextStep;
    assert.equal(METHOD_BY_ID.get(next.methodId)?.durations.includes(next.duration),true);
  }
});

// Native analytics dispatch is platform-independent; provider I/O honors this consent signal.
import { configureAnalytics, track } from "../mobile/src/lib/analytics";
test("withdrawing native consent aborts queued event scopes and blocks subsequent dispatch", async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let dispatched = 0;
  let signal: AbortSignal | undefined;
  configureAnalytics(async (_event, scope) => { signal = scope; await gate; if (!scope?.aborted) dispatched++; });
  track("data_exported", { format: "json" });
  assert.equal(signal?.aborted, false);
  configureAnalytics(undefined);
  assert.equal(signal?.aborted, true);
  track("data_exported", { format: "json" });
  release(); await gate; await Promise.resolve();
  assert.equal(dispatched, 0);
});
test("fresh consent does not revive events queued under an earlier consent scope", () => {
  let previous: AbortSignal | undefined; let current: AbortSignal | undefined;
  configureAnalytics((_event, scope) => { previous = scope; });
  track("data_exported", { format: "json" });
  configureAnalytics((_event, scope) => { current = scope; });
  track("data_exported", { format: "json" });
  assert.equal(previous?.aborted, true); assert.equal(current?.aborted, false);
  configureAnalytics(undefined);
});
