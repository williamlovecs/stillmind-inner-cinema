/** Native UI via Expo's Web export. This is not a signed iPhone build or physical-device QA. */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
const root = resolve('.expo-ci/web');
const artifacts = 'artifacts/native-web-smoke';
const origin = 'http://127.0.0.1:3102';
const debugPort = 9225;
const wait = ms => new Promise(r => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'stillmind-native-'));
mkdirSync(artifacts, {recursive:true});
const errors=[], passes=[], requests=[];
let chrome, socket, complete=false, id=0;
const pending=new Map();
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};
const server=createServer((req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,origin).pathname);
    let file=resolve(root,'.'+pathname);
    if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403).end();return;}
    if(pathname.endsWith('/'))file=join(file,'index.html');
    if(!existsSync(file)&&existsSync(file+'.html'))file+='.html';
    if(!existsSync(file)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',MIME[extname(file)]??'application/octet-stream');
    res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
    res.end(readFileSync(file));
  }catch{res.writeHead(500).end();}
});
function cdp(method,params={}){const n=++id;return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout '+method));},15000);
  pending.set(n,{resolve:v=>{clearTimeout(timeout);resolve(v);},reject:e=>{clearTimeout(timeout);reject(e);}});
  socket.send(JSON.stringify({id:n,method,params}));
});}
async function evaluate(expression){const v=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(v.exceptionDetails)throw Error(v.exceptionDetails.exception?.description??v.exceptionDetails.text);return v.result.value;}
async function until(fn,label,ms=15000){const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return;}catch{}await wait(150);}throw Error('Timeout: '+label);}
const buttonExpr=label=>`[...document.querySelectorAll('[role="button"],button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}&&b.getAttribute('aria-disabled')!=='true'&&!b.disabled)`;
const has=label=>evaluate(`Boolean(${buttonExpr(label)})`);
async function click(label){await until(()=>has(label),'button '+label);await evaluate(`(()=>{const b=${buttonExpr(label)};b.scrollIntoView();b.click();})()`);await wait(150);}
async function navigate(path){await cdp('Page.navigate',{url:origin+path});await until(()=>evaluate(`location.pathname===${JSON.stringify(path.split('?')[0])}&&document.readyState==='complete'`),path);await wait(500);}
async function screenshot(name){const data=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync(join(artifacts,name+'.png'),Buffer.from(data.data,'base64'));}
const records=()=>evaluate(`JSON.parse(localStorage.getItem('stillmind.sessions.v1')||'[]')`);
async function resetData(patch={}){await evaluate(`localStorage.clear();localStorage.setItem('stillmind.preferences.v1',JSON.stringify(${JSON.stringify({schemaVersion:2,onboardingComplete:true,historyEnabled:true,aiEnabled:false,anonymousAnalyticsEnabled:false,eyesOpenPreferred:true,bodyFocusAllowed:true,breathChangeAllowed:true,hapticsEnabled:false,reminderEnabled:false,reminderHour:21,favoriteMethodIds:[],hiddenMethodIds:[],...patch})}));`);}
const seconds=()=>evaluate(`document.body.innerText.match(/(\d+) 秒/)?.[1]`);
function pass(label){passes.push(label);console.log('PASS '+label);}
try{
  assert.ok(existsSync(join(root,'index.html'))),'Run the Expo Web export first');
  await new Promise(r=>server.listen(3102,'127.0.0.1',r));
  const binary=[process.env.CHROME_BIN,'google-chrome','google-chrome-stable','chromium','chromium-browser'].filter(Boolean).find(x=>spawnSync(x,['--version'],{stdio:'ignore'}).status===0);
  assert.ok(binary,'Chrome/Chromium required');
  chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
  await until(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).ok,'Chrome');
  const target=await(await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);else if(m.method==='Network.requestWillBeSent'&&/\/api\/(events|cinema)$/.test(m.params.request.url))requests.push(m.params.request.url);});
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await navigate('/reset?mode=looping&activation=2&direct=1');
  await until(()=>has('继续'),'onboarding');assert.equal(await has('暂停'),false);
  await click('继续');await click('继续');await click('进入 StillMind');
  await until(()=>has('暂停'),'practice after onboarding');await click('停止');await click('跳过反馈，结束');
  await until(()=>has('结束并返回'),'stopped ending');pass('onboarding precedes native direct start; stopped feedback can be skipped');
  await resetData();await navigate('/');
  await until(()=>has('开始 1 分钟 Reset'),'home');
  assert.equal(await evaluate(`document.querySelectorAll('[aria-selected="true"]').length`),0);
  await click('开始 1 分钟 Reset');await until(()=>has('暂停'),'unrated native practice');
  await screenshot('native-practice');await click('暂停');const before=await seconds();await wait(2100);assert.equal(await seconds(),before);
  await click('继续');await wait(8100);await click('停止');await click('跳过反馈，结束');
  await until(async()=> (await records())[0]?.status==='stopped','persisted stop');
  let row=(await records())[0];assert.ok(row.durationSeconds>=8&&row.durationSeconds<14);assert.equal(row.plannedDurationSeconds,60);
  assert.equal(row.activationBefore,undefined);assert.equal(row.activationAfter,undefined);assert.equal(row.groundedActionId,undefined);
  await screenshot('native-stopped');pass('missing ratings remain absent and pause/stop use actual native active time');
  await resetData();await navigate('/reset?methodId=inner-cinema&mode=looping&activation=2&duration=1&direct=1');
  await until(()=>has('暂停'),'native completed practice');
  await until(()=>has('下一步（可选行动）'),'natural completion',70000);
  await until(async()=> (await records())[0]?.status==='completed','completion record before optional answers');
  assert.equal((await records())[0].result,undefined);
  await click('4');await click('保存反馈并结束');
  await until(()=>evaluate(`document.body.innerText.includes('这次感觉更不舒服。')`),'worse native ending');
  await until(async()=> (await records())[0]?.result==='worse','worse persisted');
  assert.equal((await records()).length,1);await screenshot('native-worse');pass('native natural completion and worse feedback preserve one honest record');
  await resetData({breathChangeAllowed:false});await navigate('/reset?methodId=paced-breath&mode=tense&activation=2&duration=1&direct=1');
  await wait(1200);assert.equal(await has('暂停'),false);assert.equal((await records()).length,0);
  await resetData();await navigate('/reset?methodId=inner-cinema&mode=impulsive&activation=5&duration=1&direct=1');
  await wait(1200);assert.equal(await has('暂停'),false);assert.equal((await records()).length,0);pass('native manual/direct methods respect breath preference and high-activation restrictions');
  await resetData();const script=await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`Storage.prototype.setItem=function(){throw Error('synthetic storage error')}`});
  await navigate('/reset?mode=looping&activation=2&duration=1&direct=1');await until(()=>has('暂停'),'failed-storage native practice');
  await click('停止');await click('跳过反馈，结束');
  await until(()=>evaluate(`document.body.innerText.includes('本次记录未能完整保存')`),'native failed save notice');
  await screenshot('native-storage-failure');await cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});pass('native storage failure does not block ending');
  assert.deepEqual(requests,[],'default native flow sends neither raw inputs nor analytics');
  assert.deepEqual(errors,[],'uncaught native Web runtime errors');complete=true;
}catch(e){console.error(e);process.exitCode=1;try{if(socket?.readyState===1)await screenshot('failure');}catch{}}
finally{writeFileSync(join(artifacts,'result.json'),JSON.stringify({complete,passes,errors,requests,scope:'Expo React Native Web export in Chromium; not physical iOS/Android QA'},null,2));socket?.close();server.closeAllConnections();server.close();chrome?.kill('SIGTERM');await wait(200);try{rmSync(profile,{recursive:true,force:true});}catch{}}
