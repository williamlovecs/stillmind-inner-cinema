import assert from 'node:assert/strict';
import test from 'node:test';
import { average, parseCsv, summarize } from '../scripts/lib/seed-user-analysis.mjs';
const row = (id,extra={}) => ({session_id:id,completed_reset:'yes',after_check_result:'more_choice',understands_nonclinical:'yes',found_privacy_delete_export:'yes',severe_safety_concern:'no',stopped_text_confusion:'no',interpreted_as_diagnosis_advice_therapy:'no',method_id:'inner-cinema',...extra});
test('blank scores remain absent rather than numeric zero',()=>{
 assert.equal(average([{score:''},{score:' '},{score:'4'}],'score'),4);
 assert.equal(average([{score:''}],'score'),null);
 assert.equal(average([{score:'0'},{score:'7'},{score:'NaN'}],'score'),null);
});
test('a severe concern pauses at participant one, not only after fifteen',()=>{
 assert.equal(summarize([row('S01',{severe_safety_concern:'yes'})]).decision,'NO_GO_FIX_PRODUCT');
});
test('two worse reports pause the method without waiting for a full cohort',()=>{
 assert.equal(summarize([row('S01',{after_check_result:'worse'}),row('S02',{after_check_result:'worse'})]).decision,'NO_GO_FIX_PRODUCT');
});
test('duplicate participant rows cannot manufacture a fifteen-person cohort',()=>{
 assert.equal(summarize(Array.from({length:15},()=>row('S01'))).decision,'INVALID_DATA');
});
test('missing safety observations cannot be silently counted as zero incidents',()=>{
 assert.equal(summarize(Array.from({length:15},(_,i)=>row(`S${i}`,{severe_safety_concern:''}))).decision,'INSUFFICIENT_DATA');
});
test('original go thresholds remain available for fifteen complete, distinct observations',()=>{
 assert.equal(summarize(Array.from({length:15},(_,i)=>row(`S${i}`))).decision,'GO_BROADER_TESTFLIGHT');
});
test('quoted newlines and commas remain inside one participant row',()=>{
 const rows=parseCsv('\uFEFFsession_id,quote\r\nS01,"two, lines\nwith ""quotes"""\r\n');
 assert.deepEqual(rows,[{session_id:'S01',quote:'two, lines\nwith "quotes"'}]);
});
test('malformed quoting, duplicate headers and wrong field counts fail closed',()=>{
 for(const text of ['session_id,quote\nS01,"unfinished','session_id,session_id\nS01,S02','session_id,quote\nS01,a,extra'])assert.throws(()=>parseCsv(text));
});
