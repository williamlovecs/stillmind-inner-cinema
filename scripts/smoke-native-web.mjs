/** Exercise the actual Expo web export. This is not a signed iOS/device test.
 * Local synthetic data only; every non-local HTTP request is blocked.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,existsSync,statSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const root=resolve('.expo-ci/web'), artifacts='artifacts/native-web-smoke';mkdirSync(artifacts,{recursive:true});
const port=3200,debugPort=9224,origin=`http://127.0.0.1:${port}`;
const profile=mkdtempSync(join(tmpdir(),'stillmind-native-'));
const failures=[],passed=[],network=[];let complete=false,chrome,socket,nextId=0;
const pending=new Map();
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.wasm':'application/wasm'};
const server=createServer((req,res)=>{
  try{
    const raw=decodeURIComponent(new URL(req.url,origin).pathname);let p=resolve(root,'.'+raw);
    if(p!==root&&!p.startsWith(root+sep)){res.writeHead(403).end();return;}
    if(existsSync(p)&&statSync(p).isDirectory())p=join(p,'index.html');
    if(!existsSync(p)&&existsSync(p+'.html'))p+='.html';
    if(!existsSync(p)){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':mime[extname(p)]??'application/octet-stream','Cache-Control':'no-store'}).end(readFileSync(p));
  }catch{res.writeHead(400).end();}
});
function cdp(method,params={}){const id=++nextId;return new Promise((resolve,reject)=>{const t=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},15000);pending.set(id,{resolve:v=>{clearTimeout(t);resolve(v)},reject:e=>{clearTimeout(t);reject(e)}});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;}
async function waitFor(fn,label,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await fn())return;}catch{}await sleep(120);}throw Error('Timeout '+label);}
const buttons=`[...document.querySelectorAll('[role="button"],button')].filter(b=>b.getBoundingClientRect().width&&b.getAttribute('aria-disabled')!=='true'&&!b.disabled)`;
async function has(label){return evaluate(`${buttons}.some(b=>b.textContent.trim().endsWith(${JSON.stringify(label)})||b.getAttribute('aria-label')===${JSON.stringify(label)})`);}
async function click(label){await waitFor(()=>has(label),'button '+label);await evaluate(`(()=>{const b=${buttons}.find(b=>b.textContent.trim().endsWith(${JSON.stringify(label)})||b.getAttribute('aria-label')===${JSON.stringify(label)});b.scrollIntoView();b.click();})()`);await sleep(150);}
async function navigate(path){await cdp('Page.navigate',{url:origin+path});await waitFor(()=>evaluate(`location.pathname===${JSON.stringify(path.split('?')[0])}&&document.readyState==='complete'`),path);await sleep(500);}
async function seed(extra={}){await evaluate(`localStorage.clear();sessionStorage.clear();localStorage.setItem('stillmind.preferences.v1',${JSON.stringify(JSON.stringify({schemaVersion:2,onboardingComplete:true,historyEnabled:true,aiEnabled:false,anonymousAnalyticsEnabled:false,eyesOpenPreferred:true,bodyFocusAllowed:true,breathChangeAllowed:true,hapticsEnabled:false,reminderEnabled:false,reminderHour:21,favoriteMethodIds:[],hiddenMethodIds:[],...extra}))});`);}
async function records(){return evaluate(`JSON.parse(localStorage.getItem('stillmind.sessions.v1')||'[]')`);}
async function screenshot(name){const d=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync(join(artifacts,name+'.png'),Buffer.from(d.data,'base64'));}
function pass(label){passed.push(label);console.log('PASS '+label);}
try{
  if(!existsSync(join(root,'index.html')))throw Error('Build the Expo web export first');
  await new Promise(r=>server.listen(port,'127.0.0.1',r));
  const binary=[process.env.CHROME_BIN,'google-chrome','google-chrome-stable','chromium'].filter(Boolean).find(b=>spawnSync(b,['--version'],{stdio:'ignore'}).status===0);
  if(!binary)throw Error('Chrome not available; tests did not run');
  chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
  await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).ok,'Chrome');
  const target=await(await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
  socket.addEventListener('message',event=>{const d=JSON.parse(event.data);if(d.id){const q=pending.get(d.id);if(q){pending.delete(d.id);d.error?q.reject(Error(JSON.stringify(d.error))):q.resolve(d.result);}}
    else if(d.method==='Runtime.exceptionThrown')failures.push(d.params.exceptionDetails.exception?.description??d.params.exceptionDetails.text);
    else if(d.method==='Fetch.requestPaused'){
      const r=d.params.request;
      if(/^https?:/.test(r.url)&&!r.url.startsWith(origin+'/')){network.push(r.url);void cdp('Fetch.failRequest',{requestId:d.params.requestId,errorReason:'BlockedByClient'});}
      else void cdp('Fetch.continueRequest',{requestId:d.params.requestId});
    }
  });
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await navigate('/reset?mode=looping&methodId=inner-cinema&activation=2&ratingProvided=1&direct=1');
  await waitFor(()=>has('继续'),'onboarding');assert.equal(await has('暂停'),false);
  await click('继续');await click('继续');await click('进入 StillMind');
  await waitFor(()=>has('暂停'),'post-onboarding start');await click('停止');await click('跳过反馈，结束');
  pass('native direct entry waits for onboarding and allows skipping feedback');
  await seed();await navigate('/');await screenshot('native-home');
  await click('开始 1 分钟 Reset');await waitFor(()=>has('暂停'),'unrated practice');
  await click('暂停');const frozen=await evaluate(`document.querySelector('[data-testid="native-session-timer"]').textContent`);
  await sleep(2000);assert.equal(await evaluate(`document.querySelector('[data-testid="native-session-timer"]').textContent`),frozen);
  await click('继续');await sleep(8100);await click('停止');await click('跳过反馈，结束');
  await waitFor(async()=> (await records())[0]?.status==='stopped','stored stopped');
  let r=(await records())[0];assert.ok(r.durationSeconds>=8&&r.durationSeconds<13);assert.equal(r.plannedDurationSeconds,60);
  assert.equal(r.activationBefore,undefined);assert.equal(r.activationAfter,undefined);assert.equal(r.groundedActionId,undefined);assert.equal(r.result,'stopped');
  await screenshot('native-stopped');pass('native missing scores, active clock, pause and eight-second stop are honest');
  await seed();await navigate('/reset?mode=impulsive&methodId=inner-cinema&activation=5&ratingProvided=1&direct=1');
  await waitFor(()=>evaluate(`document.body.innerText.includes('不符合')`),'native high-activation gate');assert.equal(await has('暂停'),false);assert.equal((await records()).length,0);
  await seed({breathChangeAllowed:false});await navigate('/reset?mode=tense&methodId=paced-breath&activation=2&ratingProvided=1&direct=1');
  await waitFor(()=>evaluate(`document.body.innerText.includes('不符合')`),'native breath preference');assert.equal(await has('暂停'),false);
  pass('native manual deep links cannot bypass method eligibility or breath preferences');
  await seed();await navigate('/reset?mode=looping&methodId=inner-cinema&activation=2&ratingProvided=1&direct=1');await waitFor(()=>has('暂停'),'native complete');
  await screenshot('native-practice');assert.equal(await evaluate(`/入戏度|稳定度/.test(document.body.innerText)`),false);
  await waitFor(()=>has('保存本次反馈'),'native sixty-second completion',70000);
  await waitFor(async()=> (await records())[0]?.status==='completed','saved before feedback');
  assert.equal((await records())[0].result,undefined);
  await click('4');await click('保存本次反馈');await waitFor(()=>evaluate(`document.body.innerText.includes('这次感觉更不舒服。')`),'native worse ending');
  await waitFor(async()=> (await records())[0]?.result==='worse','native stored worse');
  r=(await records())[0];assert.equal(r.activationBefore,2);assert.equal(r.activationAfter,4);assert.equal((await records()).length,1);assert.equal(r.groundedActionId,undefined);
  await screenshot('native-worse');pass('native completion precedes feedback and discomfort never becomes success');
  await seed();const injected=await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='stillmind.sessions.v1')throw Error('synthetic quota');return original.call(this,k,v)}`});
  await navigate('/reset?mode=looping&methodId=inner-cinema&activation=2&ratingProvided=1&direct=1');await waitFor(()=>has('暂停'),'native failed storage');await click('停止');await click('跳过反馈，结束');
  await waitFor(()=>evaluate(`document.body.innerText.includes('未能完整保存')`),'native storage warning');assert.equal(await has('结束并返回'),true);
  await screenshot('native-storage-failure');await cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier});
  pass('native storage failure preserves the exit and reports unsaved data');
  assert.equal(network.filter(u=>u.includes('/api/')).length,0,'default native flow must not send model or analytics requests');
  assert.deepEqual(failures,[]);complete=true;
  console.log('Native Expo Web regression PASS; physical iOS and signing are not tested.');
}catch(error){console.error(error);try{if(socket?.readyState===1){await screenshot('failure');writeFileSync(join(artifacts,'failure-dom.txt'),await evaluate('document.body.innerText'));}}catch{}process.exitCode=1;}
finally{writeFileSync(join(artifacts,'summary.json'),JSON.stringify({complete,passed,failures,blockedExternalRequests:network},null,2));socket?.close();chrome?.kill('SIGTERM');server.close();await sleep(300);try{rmSync(profile,{recursive:true,force:true});}catch{}}
