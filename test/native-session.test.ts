import assert from "node:assert/strict";
import test from "node:test";
import { isAnalyticsEnvelope, isPracticeSession, pausePracticeClock, resumePracticeClock, type PracticeSession } from "@stillmind/domain";
import { beginNativeAttempt, endNativeAttempt, saveNativeFeedback, nativeReportedRating, nativeFeedbackResult, createRequestLifetime, type NativeSessionSeed } from "../mobile/src/lib/practice-session";
import { cinemaToPractice, isCinemaPayload, type CinemaResult } from "../mobile/src/lib/cinema-payload";
import { createSerialTaskQueue } from "../mobile/src/lib/serial-tasks";

function fixture(extra: Partial<NativeSessionSeed> = {}, saver?: (record: PracticeSession) => Promise<void>) {
  let time = 0;
  const writes: PracticeSession[] = [];
  const events: unknown[] = [];
  const seed: NativeSessionSeed = { id: "native-synthetic-attempt", mode: "looping", methodId: "inner-cinema", minutes: 1,
    plannedDurationSeconds: 60, contentVersion: "1.1.0", inputMethod: "state-only", textProvided: false,
    consentAtStart: false, source: "offline", ...extra };
  const attempt = beginNativeAttempt(seed, { now: () => time, isoNow: () => new Date(1700000000000 + time).toISOString(),
    save: async record => { if (saver) await saver(record); writes.push(record); },
    emit: (name, payload) => { events.push({schemaVersion:1,name,payload,anonymousId:"synthetic-person-123",platform:"ios"}); } });
  return { attempt, writes, events, time: (value: number) => { time = value; } };
}
test("native query hints are not ratings until explicitly confirmed", () => {
  for (const [value, confirmed] of [["3",undefined],["3","0"],["3.2","1"],["0","1"],["6","1"],[undefined,"1"],["NaN","1"]]) assert.equal(nativeReportedRating(value,confirmed),undefined);
  assert.equal(nativeReportedRating("4","1"),4);
});
test("native stop has actual active time and missing scores remain missing", async () => {
  const f=fixture();f.time(3000);f.attempt.clock=pausePracticeClock(f.attempt.clock,3000);
  f.time(10000);f.attempt.clock=resumePracticeClock(f.attempt.clock,10000);f.time(15000);
  const record=endNativeAttempt(f.attempt,"stopped");await f.attempt.writes;
  assert.equal(record.durationSeconds,8);assert.equal(record.plannedDurationSeconds,60);
  assert.equal(record.activationBefore,undefined);assert.equal(record.activationAfter,undefined);
  assert.equal(record.groundedActionId,undefined);assert.equal(record.result,"stopped");
  assert.equal(isPracticeSession(record),true);assert.equal(f.events.length,0);
});
test("native records completion before optional feedback",async()=>{
  const f=fixture();f.time(60000);endNativeAttempt(f.attempt,"completed");await f.attempt.writes;
  assert.equal(f.writes.at(-1)?.status,"completed");assert.equal(f.writes.at(-1)?.result,undefined);
  assert.equal(f.writes.at(-1)?.activationAfter,undefined);
});
test("native start, end and feedback writes are ordered even when the first write is slow",async()=>{
  let unblock!:()=>void;const held=new Promise<void>(resolve=>{unblock=resolve;});
  let calls=0;const f=fixture({activationBefore:2},async()=>{if(++calls===1)await held;});
  f.time(60000);endNativeAttempt(f.attempt,"completed");saveNativeFeedback(f.attempt,{activationAfter:4,shareAnonymous:false});
  await Promise.resolve();assert.equal(f.writes.length,0);unblock();await f.attempt.writes;
  assert.deepEqual(f.writes.map(x=>x.status),["abandoned","completed","completed"]);
  assert.equal(f.writes.at(-1)?.result,"worse");assert.equal(new Set(f.writes.map(x=>x.id)).size,1);
});
test("native failed storage cannot block stop or poison later feedback saves",async()=>{
  let calls=0;const f=fixture({},async()=>{if(++calls<=2)throw Error("synthetic storage failure");});
  f.time(1000);endNativeAttempt(f.attempt,"stopped");await f.attempt.writes;
  assert.equal(f.attempt.ended,true);assert.equal(f.attempt.saveFailed,true);
  saveNativeFeedback(f.attempt,{shareAnonymous:false});await f.attempt.writes;assert.equal(f.attempt.saveFailed,false);
});
test("native late consent sends only feedback and never manufactures a past start",async()=>{
  const f=fixture();f.time(60000);endNativeAttempt(f.attempt,"completed");
  saveNativeFeedback(f.attempt,{shareAnonymous:true});saveNativeFeedback(f.attempt,{shareAnonymous:true});
  assert.equal(f.events.length,1);assert.equal(isAnalyticsEnvelope(f.events[0]),true);
  const event=f.events[0] as {name:string;payload:Record<string,unknown>};
  assert.equal(event.name,"after_check_saved");assert.equal(event.payload.activation_change_bucket,"unreported");
  assert.equal(event.payload.result,"unreported");assert.equal(event.payload.grounded_action_id,"");
  await f.attempt.writes;
});
test("native actual lifecycle is opt-in, joinable and abandonment idempotent",async()=>{
  const f=fixture({consentAtStart:true});f.time(4000);endNativeAttempt(f.attempt,"abandoned");endNativeAttempt(f.attempt,"completed");
  assert.equal(f.events.length,4);assert.equal(f.attempt.record.status,"abandoned");
  for(const event of f.events){assert.equal(isAnalyticsEnvelope(event),true);assert.doesNotMatch(JSON.stringify(event),/privateNote|rawTrigger/);}
  await f.attempt.writes;
});
test("subjective feedback is retained separately when numeric change disagrees",async()=>{
  const f=fixture({activationBefore:2});f.time(60000);endNativeAttempt(f.attempt,"completed");
  const record=saveNativeFeedback(f.attempt,{activationAfter:4,reportedResult:"better",shareAnonymous:false});
  assert.equal(record.reportedResult,"better");assert.equal(record.result,"worse");assert.equal(record.activationAfter,4);
  assert.equal(isPracticeSession(record),true);await f.attempt.writes;
});
test("native stop status cannot be turned into completion by a positive answer",async()=>{
  const f=fixture({activationBefore:5});f.time(8000);endNativeAttempt(f.attempt,"stopped");
  const record=saveNativeFeedback(f.attempt,{activationAfter:1,reportedResult:"better",shareAnonymous:false});
  assert.equal(record.status,"stopped");assert.equal(record.result,"stopped");assert.equal(record.reportedResult,"better");await f.attempt.writes;
});
test("a feeling can be recorded without inventing a numerical score",()=>{
  assert.equal(nativeFeedbackResult(undefined,undefined,"same"),"same");
  assert.equal(nativeFeedbackResult(undefined,undefined),undefined);
  assert.equal(nativeFeedbackResult(4,1,"worse"),"worse");
});
test("leaving or replacing generation invalidates late responses",()=>{
  const lifetime=createRequestLifetime();const first=lifetime.begin();const second=lifetime.begin();
  assert.equal(first.signal.aborted,true);assert.equal(first.isCurrent(),false);assert.equal(second.isCurrent(),true);
  lifetime.cancel();assert.equal(second.signal.aborted,true);assert.equal(second.isCurrent(),false);
});
test("serial storage queue preserves delete order and recovers after failure",async()=>{
  const q=createSerialTaskQueue();const order:string[]=[];
  const first=q.run(async()=>{order.push("start");throw Error("quota");});
  const deletion=q.run(async()=>{order.push("delete");});
  await assert.rejects(first);await deletion;
  await q.run(async()=>{order.push("new");});assert.deepEqual(order,["start","delete","new"]);
});
const cinema: CinemaResult={source:"stepfun",cinema:{title:"测试场景",innerNoise:[],scenes:[{label:"一",line:"先看见这一幕。"},{label:"二",line:"也可以到此为止。"}],roleView:"角色",audienceView:"观众",witnessView:"结束"}};
test("generated native practice honors selected duration with two or three scenes",()=>{
  for(const minutes of [1,3,5,10] as const)for(const count of [2,3]){
    const c=structuredClone(cinema);if(count===3)c.cinema.scenes.push({label:"三",line:"回到现实。"});
    const practice=cinemaToPractice(c,minutes);assert.equal(practice.minutes,minutes);
    assert.equal(practice.steps.reduce((sum,s)=>sum+s.seconds,0),minutes*60);
    assert.ok(practice.steps.every(s=>Number.isInteger(s.seconds)&&s.seconds>0));
  }
});
test("malformed or oversized generated scene lists are rejected",()=>{
  for(const c of [{...cinema.cinema,title:""},{...cinema.cinema,scenes:[]},{...cinema.cinema,scenes:Array(99).fill({label:"a",line:"b"})}]){
    assert.equal(isCinemaPayload(c),false);assert.throws(()=>cinemaToPractice({...cinema,cinema:c}));
  }
});
