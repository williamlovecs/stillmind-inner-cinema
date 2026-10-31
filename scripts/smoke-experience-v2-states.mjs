/** Focused V2 state and keyboard QA. Expo Web is not a physical-device or screen-reader test. */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer as createHttpServer } from "node:http";
import { createServer as createPortProbe } from "node:net";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const platform = process.env.V2_PLATFORM === "native" ? "native" : "web";
const batch = (process.env.V2_BATCH || "A").toUpperCase();
const port = Number(process.env.SMOKE_PORT || 3250);
const debugPort = Number(process.env.SMOKE_CHROME_PORT || 9250);
const origin = `http://127.0.0.1:${port}`;
const artifacts = process.env.V2_STATE_ARTIFACTS || `artifacts/experience-v2-states/${platform}/batch-${batch}`;
mkdirSync(artifacts, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), `stillmind-v2-states-${platform}-`));
const nativeRoot = resolve(".expo-ci/web");
const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const nativeServer = createHttpServer((req, res) => {
  try {
    const raw = decodeURIComponent(new URL(req.url, origin).pathname);
    let file = resolve(nativeRoot, "." + raw);
    if (file !== nativeRoot && !file.startsWith(nativeRoot + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file) && existsSync(file + ".html")) file += ".html";
    if (!existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" }).end(readFileSync(file));
  } catch { res.writeHead(400).end(); }
});
let complete = false, chrome, socket, nextServer, nextId = 0;
const passed = [], failures = [], externalRequests = [], pending = new Map();
function cdp(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(Error("CDP timeout " + method)); }, 20000);
    pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(fn, label, timeout = 20000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) { try { if (await fn()) return; } catch {} await sleep(120); }
  throw Error("Timeout " + label);
}
const buttons = `[...document.querySelectorAll('[role="button"],button')].filter(b=>b.getBoundingClientRect().width&&b.getAttribute('aria-disabled')!=='true'&&!b.disabled)`;
async function has(label) { return evaluate(`${buttons}.some(b=>b.textContent.trim().endsWith(${JSON.stringify(label)})||b.getAttribute('aria-label')===${JSON.stringify(label)})`); }
async function click(label) {
  await waitFor(() => has(label), "button " + label);
  await evaluate(`(()=>{const b=${buttons}.find(b=>b.textContent.trim().endsWith(${JSON.stringify(label)})||b.getAttribute('aria-label')===${JSON.stringify(label)});b.scrollIntoView({block:'center'});b.click();})()`);
  await sleep(180);
}
async function key(key, code, windowsVirtualKeyCode) {
  const text = key === "Enter" ? "\r" : key.length === 1 ? key : undefined;
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode, text });
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode });
  await sleep(100);
}
async function realClick(label) {
  const point = await evaluate(`(()=>{const b=[...document.querySelectorAll('[role="button"],button')].find(b=>b.getBoundingClientRect().width&&(b.textContent.trim().endsWith(${JSON.stringify(label)})||b.getAttribute('aria-label')===${JSON.stringify(label)}));if(!b)throw Error('probe missing '+${JSON.stringify(label)});b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  await sleep(180);
}
async function fill(label, value) {
  await evaluate(`(()=>{const el=document.querySelector('[aria-label=${JSON.stringify(label)}]');if(!el)throw Error('input missing');Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await sleep(100);
}
async function bodyIncludes(value) { return evaluate(`document.body.innerText.includes(${JSON.stringify(value)})`); }
async function navigate(path) {
  await cdp("Page.navigate", { url: origin + path });
  await waitFor(() => evaluate(`location.pathname===${JSON.stringify(path.split("?")[0])}&&document.readyState==='complete'`), path);
  await sleep(500);
}
async function seed() {
  await evaluate(`localStorage.clear();sessionStorage.clear();${platform === "web" ? `localStorage.setItem('stillmind-disclaimer-ack-v1','1')` : `localStorage.setItem('stillmind.preferences.v1',${JSON.stringify(JSON.stringify({ schemaVersion: 2, onboardingComplete: true, historyEnabled: true, aiEnabled: false, anonymousAnalyticsEnabled: false, eyesOpenPreferred: false, bodyFocusAllowed: true, breathChangeAllowed: true, hapticsEnabled: false, reminderEnabled: false, reminderHour: 21, favoriteMethodIds: [], hiddenMethodIds: [] }))})`}`);
}
async function screenshot(name) {
  await evaluate("window.scrollTo(0,0)");
  const data = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(join(artifacts, name + ".png"), Buffer.from(data.data, "base64"));
}
function pass(label) { passed.push(label); console.log(`PASS ${platform} ${batch}: ${label}`); }
const groups = {
  A: ["inner-cinema", "paced-breath", "thought-watching"],
  B: ["wide-gaze", "body-scan", "person-shift"],
  C: ["logout-pause", "release", "open-awareness"],
  D: ["grounded-action", "trigger-journal", "anchors"],
};
const methods = groups[batch];
if (!methods) throw Error("V2_BATCH must be A, B, C or D");
const freshCopy = {
  "inner-cinema": "角色视角", "paced-breath": "自然呼吸", "thought-watching": "不必寻找或制造一个念头",
  "wide-gaze": "轻松地看烛光的中心", "body-scan": "注意脚底与地面的接触", "person-shift": "原句保留不变",
  "logout-pause": "稍后再看；喝一杯水", release: "先不回想", "open-awareness": "主动标记：暂无",
  "grounded-action": "先看纸面与周围", "trigger-journal": "画面本来就是静止的", anchors: "看见此刻的房间",
};
const pauseProbes = {
  "inner-cinema": { label: "退远一点" }, "paced-breath": { label: "纯文字" },
  "thought-watching": { label: "暂时隐藏念头" }, "wide-gaze": { label: "周围空间" },
  "body-scan": { label: "选择接触点" }, "person-shift": { input: "用于人称替代的名字" },
  "logout-pause": { label: "稍后再看" }, release: { label: "保持距离" },
  "open-awareness": { label: "显示静态场景" }, "grounded-action": { label: "观察屏幕纸面" },
  "trigger-journal": { label: "使用纯文字" }, anchors: { label: "更大的空间" },
};
async function interact(method) {
  if (method === "inner-cinema") { await click("退远一点"); assert.equal(await bodyIncludes("观众视角"), true); }
  else if (method === "paced-breath") { await click("轻点记一次数"); assert.equal(await bodyIncludes("轻点 1"), true); }
  else if (method === "thought-watching") { await fill("此刻的一句念头", "合成测试念头"); await click("暂时隐藏念头"); assert.equal(await bodyIncludes("它没有消失"), true); await click("再次查看念头"); }
  else if (method === "wide-gaze") { await click("物体边缘"); assert.equal(await bodyIncludes("明暗交界"), true); }
  else if (method === "body-scan") { await click("改看周围环境"); assert.equal(await bodyIncludes("三种颜色"), true); }
  else if (method === "person-shift") { await fill("需要转换为旁观语言的念头", "合成原句"); await fill("我亲眼看到或听到的事实", "合成事实"); assert.equal(await bodyIncludes("合成事实"), true); }
  else if (method === "logout-pause") { await click("走完一小段路后"); assert.equal(await bodyIncludes("走完一小段路后；喝一杯水"), true); }
  else if (method === "release") { await click("愿意继续观察反应"); await click("暂不接触这件事"); assert.equal(await bodyIncludes("先不回想"), true); }
  else if (method === "open-awareness") { await click("切换纯文字"); assert.equal(await bodyIncludes("也可以什么都不标记"), true); }
  else if (method === "grounded-action") { await click("观察现实物品"); assert.equal(await bodyIncludes("不需要拍照"), true); }
  else if (method === "trigger-journal") { await click("改看身边的物品"); await click("回到屏幕对象"); assert.equal(await evaluate(`!!document.querySelector('[aria-label="静止的观察方框"]')`), true); }
  else if (method === "anchors") { await click("更大的空间"); await click("返回当前房间"); assert.equal(await bodyIncludes("看见此刻的房间"), true); }
}
async function assertTargets(width) {
  const small = await evaluate(`[...document.querySelectorAll('[role="button"],button,a[href]')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height}).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim(),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})).filter(r=>r.width<44||r.height<44)`);
  assert.deepEqual(small, [], `${width}px undersized targets (CSS bounds, not physical touch)`);
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, `${width}px root overflow`);
}
try {
  const probe = createPortProbe();
  await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(port, "127.0.0.1", () => probe.close(resolve)); });
  if (platform === "web") {
    nextServer = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "-p", String(port)], { env: { ...process.env, STEPFUN_API_KEY: "", POSTHOG_PROJECT_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
    await waitFor(async () => nextServer.exitCode === null && (await fetch(origin)).ok, "owned web server", 40000);
  } else {
    if (!existsSync(join(nativeRoot, "index.html"))) throw Error("Expo Web export missing");
    await new Promise((resolve, reject) => { nativeServer.once("error", reject); nativeServer.listen(port, "127.0.0.1", resolve); });
  }
  const binary = [process.env.CHROME_BIN, "google-chrome", "google-chrome-stable", "chromium"].filter(Boolean).find((item) => existsSync(item) || spawnSync(item, ["--version"], { stdio: "ignore", timeout: 5000 }).status === 0);
  if (!binary) throw Error("Chrome unavailable; QA did not run");
  chrome = spawn(binary, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", `--remote-debugging-port=${debugPort}`, "--remote-debugging-address=127.0.0.1", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  await waitFor(async () => (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).ok, "Chrome");
  const target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.id) { const item = pending.get(data.id); if (item) { pending.delete(data.id); data.error ? item.reject(Error(JSON.stringify(data.error))) : item.resolve(data.result); } }
    else if (data.method === "Runtime.exceptionThrown") failures.push(data.params.exceptionDetails.exception?.description ?? data.params.exceptionDetails.text);
    else if (data.method === "Fetch.requestPaused") {
      const url = data.params.request.url;
      if (/^https?:/.test(url) && !url.startsWith(origin + "/")) { externalRequests.push(url); void cdp("Fetch.failRequest", { requestId: data.params.requestId, errorReason: "BlockedByClient" }); }
      else void cdp("Fetch.continueRequest", { requestId: data.params.requestId });
    }
  });
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await navigate("/"); await seed();
  for (const method of methods) {
    const nativeDuration = { "thought-watching": 3, "body-scan": 5, release: 5, "open-awareness": 5, "trigger-journal": 3 }[method] || 1;
    const path = platform === "web" ? `/reset?method=${method}&mode=curious&activation=2&eyes=0&direct=1` : `/reset?methodId=${method}&duration=${nativeDuration}&mode=curious&activation=2&ratingProvided=1&direct=1`;
    await navigate(path); await waitFor(() => has("暂停"), method);
    assert.equal(await bodyIncludes(freshCopy[method]), true, `${method} initial content`);
    await assertTargets(390);
    await key("Tab", "Tab", 9);
    const focus = await evaluate(`(()=>{const el=document.activeElement;const s=getComputedStyle(el);const r=el.getBoundingClientRect();return{tag:el.tagName,outline:s.outlineStyle,width:parseFloat(s.outlineWidth),visible:r.width>0&&r.height>0}})()`);
    assert.equal(focus.visible, true, `${method} keyboard focus visible`);
    assert.ok(focus.outline !== "none" && focus.width >= 1, `${method} focus indicator`);
    await interact(method);
    await evaluate(`[...document.querySelectorAll('[role="button"],button')].find(b=>b.textContent.trim().endsWith('暂停')).focus()`);
    await key("Enter", "Enter", 13);
    assert.equal(await has("继续"), true, `${method} keyboard pause`);
    const timerSelector = platform === "web" ? "p.tabular-nums" : '[data-testid="native-session-timer"]';
    const timer = await evaluate(`document.querySelector(${JSON.stringify(timerSelector)}).textContent`);
    const pausedText = await evaluate("document.body.innerText");
    await sleep(1200);
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(timerSelector)}).textContent`), timer, `${method} frozen clock`);
    const action = pauseProbes[method];
    if (action.input) {
      await evaluate(`document.querySelector('[aria-label=${JSON.stringify(action.input)}]').focus()`);
      await key("a", "KeyA", 65);
      assert.equal(await evaluate(`document.querySelector('[aria-label=${JSON.stringify(action.input)}]').value`), "", `${method} paused input`);
    } else await realClick(action.label);
    assert.equal(await evaluate("document.body.innerText"), pausedText, `${method} paused controls must not mutate content`);
    await click("继续"); assert.equal(await has("暂停"), true);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 320, height: 740, deviceScaleFactor: 1, mobile: true });
    await assertTargets(320); await screenshot(`${method}-320`);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await click("停止"); await waitFor(() => has("跳过反馈，结束"), `${method} after-check`);
    assert.equal(await has("暂停"), false, `${method} no practice behind after-check`);
    await screenshot(`${method}-after-check`);
    await click("跳过反馈，结束");
    const storageKey = platform === "web" ? "stillmind.web.sessions.v1" : "stillmind.sessions.v1";
    await waitFor(async () => {
      const rows = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||'[]')`);
      return rows.some((row) => row.methodId === method && row.status === "stopped");
    }, `${method} stopped record persistence`);
    const saved = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||'[]').find(row=>row.methodId===${JSON.stringify(method)})`);
    assert.equal(saved.methodId, method); assert.equal(saved.status, "stopped");
    await navigate(path); await waitFor(() => has("暂停"), `${method} re-entry`);
    assert.equal(await bodyIncludes(freshCopy[method]), true, `${method} clean re-entry`);
    await click("停止"); await click("跳过反馈，结束");
    pass(`${method} real interaction, keyboard, frozen pause, locked controls, after-check and clean re-entry`);
  }
  assert.deepEqual(failures, []); assert.deepEqual(externalRequests, []); complete = true;
} catch (error) {
  console.error(error); failures.push(String(error)); process.exitCode = 1;
  try { if (socket?.readyState === 1) await screenshot("failure"); } catch {}
} finally {
  writeFileSync(join(artifacts, "summary.json"), JSON.stringify({ complete, platform, batch, passed, failures, externalRequests, testedGitSha: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout?.trim(), scope: platform === "web" ? "Local Next production browser automation" : "Local Expo Web export; CSS bounds only, not physical touch or a screen reader" }, null, 2));
  socket?.close(); chrome?.kill("SIGTERM"); nextServer?.kill("SIGTERM"); nativeServer.close();
  await sleep(300); try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
