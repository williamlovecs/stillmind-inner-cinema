/** Browser regression without adding a package: Node 22 WebSocket + Chrome DevTools Protocol.
 * Runs against a local production build only. Never call a public deployment or a real model.
 * All inputs and captured event envelopes in this script are synthetic test data.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const port = Number(process.env.SMOKE_PORT || 3103);
const debugPort = Number(process.env.SMOKE_CHROME_PORT || 9226);
const origin = `http://127.0.0.1:${port}`;
const profile = mkdtempSync(join(tmpdir(), "stillmind-chrome-"));
const artifacts = "artifacts/web-smoke/round2";
mkdirSync(artifacts, { recursive: true });
let server, chrome, socket;
const logs = [];
const failures = [];
const passed = [];
const analyticsRequests = [];
const pending = new Map();
let nextId = 0;
let complete = false;
async function waitFor(fn, label, timeout = 15000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    try { if (await fn()) return; } catch { /* Server/DOM may not yet be ready. */ }
    await sleep(150);
  }
  throw Error(`Timeout: ${label}`);
}
function cdp(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 20000);
    pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (err) => { clearTimeout(timer); reject(err); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const data = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (data.exceptionDetails) throw Error(data.exceptionDetails.exception?.description || data.exceptionDetails.text);
  return data.result.value;
}
async function navigate(path) {
  await cdp("Page.navigate", { url: origin + path });
  await waitFor(() => evaluate(`location.pathname === ${JSON.stringify(path.split("?")[0])} && document.readyState === "complete"`), path);
  await sleep(350);
}
async function hasButton(label) {
  return evaluate(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === ${JSON.stringify(label)} && !b.disabled)`);
}
async function click(label) {
  await waitFor(() => hasButton(label), `button ${label}`);
  await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled);b.scrollIntoView();b.click();return true})()`);
  await sleep(120);
}
async function clickConsent(text) {
  await evaluate(`(()=>{const l=[...document.querySelectorAll('label')].find(l=>l.textContent.includes(${JSON.stringify(text)}));if(!l)throw Error('consent label missing');l.closest('details')?.setAttribute('open','');l.querySelector('input[type=checkbox]').click();})()`);
  await sleep(120);
}
async function screenshot(name) {
  await evaluate("window.scrollTo(0,0)");
  await sleep(100);
  const data = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(join(artifacts, name + ".png"), Buffer.from(data.data, "base64"));
}
async function resetData() {
  await evaluate(`localStorage.clear();sessionStorage.clear();localStorage.setItem('stillmind-disclaimer-ack-v1','1');`);
}
async function records() { return evaluate(`JSON.parse(localStorage.getItem('stillmind.web.sessions.v1')||'[]')`); }
function pass(label) { passed.push(label); console.log(`PASS ${label}`); }
try {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    env: { ...process.env, STEPFUN_API_KEY: "", POSTHOG_PROJECT_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", b => logs.push(b.toString())); server.stderr.on("data", b => logs.push(b.toString()));
  await waitFor(async () => (await fetch(origin)).ok, "local production server", 40000);
  const binary = [process.env.CHROME_BIN, "google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
    .filter(Boolean).find(name => spawnSync(name, ["--version"], { stdio: "ignore" }).status === 0);
  if (!binary) throw Error("Chrome/Chromium not installed; browser QA did not run.");
  chrome = spawn(binary, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`, "--remote-debugging-address=127.0.0.1", `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  chrome.stderr.on("data", b => logs.push(b.toString()));
  await waitFor(async () => (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).ok, "Chrome");
  const target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", event => {
    const data = JSON.parse(event.data);
    if (data.id) { const item = pending.get(data.id); if (item) { pending.delete(data.id); data.error ? item.reject(Error(JSON.stringify(data.error))) : item.resolve(data.result); } }
    else if (data.method === "Runtime.exceptionThrown") failures.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text);
    else if (data.method === "Network.requestWillBeSent" && data.params.request.url === origin + "/api/events" && data.params.request.method === "POST") {
      try { analyticsRequests.push(JSON.parse(data.params.request.postData)); }
      catch { failures.push("Unparseable analytics request during synthetic browser test"); }
    }
  });
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate("/");
  await resetData();
  await navigate("/reset?mode=looping&activation=999&direct=1");
  await waitFor(() => hasButton("暂停"), "invalid-rating practice");
  assert.equal((await records())[0]?.activationBefore, undefined);
  await click("停止"); await click("跳过反馈，结束");
  pass("out-of-range URL rating never becomes a fabricated answer");

  await resetData(); await navigate("/");
  await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='开始 1 分钟 Reset');button.click();button.click();button.click();})()`);
  await waitFor(() => hasButton("暂停"), "repeated start");
  assert.equal((await records()).length, 1);
  await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='停止');button.click();button.click();})()`);
  await click("跳过反馈，结束");
  assert.equal((await records()).length, 1);
  pass("rapid duplicate start/stop clicks produce one attempt");

  await resetData();
  const malicious = '<img src=x onerror="window.__injected=1"> synthetic trigger';
  await evaluate(`sessionStorage.setItem('stillmind.pendingTrigger.v1',${JSON.stringify(malicious)})`);
  await navigate("/reset?mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "literal markup input");
  assert.equal(await evaluate(`window.__injected === 1 || Boolean(document.querySelector('img[onerror]'))`), false);
  assert.equal(await evaluate(`document.body.innerText.includes('<img')`), true);
  await click("停止"); await click("跳过反馈，结束");
  assert.equal(JSON.stringify(await records()).includes(malicious), false);
  pass("markup remains literal text and is absent from persisted sessions");

  await resetData(); await navigate("/reset?mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "offline practice");
  await cdp("Network.emulateNetworkConditions", {offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await click("暂停"); await sleep(350); await click("继续"); await click("停止"); await click("跳过反馈，结束");
  assert.equal((await records())[0]?.status,"stopped");
  await screenshot("offline-exit");
  await cdp("Network.emulateNetworkConditions", {offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  pass("loaded offline practice still pauses, stops and saves locally");

  await resetData(); await navigate("/reset?mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "refresh attempt");
  const previous=(await records())[0].id;
  await navigate("/reset?mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "fresh attempt after reload");
  assert.equal((await records()).find(row=>row.id===previous)?.status,"abandoned");
  assert.equal((await records()).length,2);
  await click("停止"); await click("跳过反馈，结束");
  pass("reload does not overwrite the previous attempt as a successful completion");

  await resetData();
  await cdp("Emulation.setDeviceMetricsOverride", {width:320,height:568,deviceScaleFactor:1,mobile:true});
  await cdp("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await navigate("/reset?mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "small-screen reduced-motion practice");
  await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='停止');b.scrollIntoView({block:'center'});})()`);
  const rect=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='停止');const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  assert.ok(rect.x>0&&rect.x<320&&rect.y>0&&rect.y<568);
  await cdp("Input.dispatchMouseEvent",{type:"mousePressed",x:rect.x,y:rect.y,button:"left",clickCount:1});
  await cdp("Input.dispatchMouseEvent",{type:"mouseReleased",x:rect.x,y:rect.y,button:"left",clickCount:1});
  await waitFor(() => hasButton("跳过反馈，结束"), "actual clickable small-screen stop");
  await click("跳过反馈，结束"); await screenshot("small-reduced-motion-exit");
  pass("320px reduced-motion interface retains a physically clickable stop control");

  for(const endpoint of ["cinema","events"]) {
    const response=await fetch(`${origin}/api/${endpoint}`,{method:"POST",headers:{"Content-Type":"application/json","x-forwarded-for":`round2-browser-${endpoint}`},body:JSON.stringify({trigger:"中".repeat(4000)})});
    assert.equal(response.status,413); assert.equal(response.headers.get("cache-control"),"no-store");
  }
  pass("production HTTP handlers reject oversized actual bodies");
  assert.equal(analyticsRequests.length,0,"no consent means no analytics network events");
  assert.deepEqual(failures,[],"uncaught browser exceptions");
  complete=true;
  console.log("Round2 adversarial browser PASS; synthetic data and local production build only.");
} catch (error) {
  console.error(error);
  try { if (socket?.readyState === 1) await screenshot("failure"); } catch { /* Preserve original failure. */ }
  process.exitCode = 1;
} finally {
  writeFileSync(join(artifacts, "result.json"), JSON.stringify({ complete, passed,
    testedGitSha: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout?.trim() || null,
    browserErrors: failures, eventCount: analyticsRequests.length,
    scope: "Synthetic local Chromium production test; not physical-device or efficacy validation" }, null, 2));
  writeFileSync(join(artifacts, "synthetic-events.json"), JSON.stringify(analyticsRequests, null, 2));
  writeFileSync(join(artifacts, "runtime-errors.json"), JSON.stringify(failures, null, 2));
  writeFileSync(join(artifacts, "server-browser.log"), logs.join(""));
  socket?.close(); server?.kill("SIGTERM"); chrome?.kill("SIGTERM");
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* Browser may still be shutting down. */ }
}
