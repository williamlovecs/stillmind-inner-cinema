/** Browser regression without adding a package: Node 22 WebSocket + Chrome DevTools Protocol.
 * Runs against a local production build only. Never call a public deployment or a real model.
 * All inputs and captured event envelopes in this script are synthetic test data.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const port = Number(process.env.SMOKE_PORT || 3100);
const debugPort = Number(process.env.SMOKE_CHROME_PORT || 9223);
const origin = `http://127.0.0.1:${port}`;
const profile = mkdtempSync(join(tmpdir(), "stillmind-chrome-"));
const artifacts = "artifacts/web-smoke";
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
  const navigation = await cdp("Page.navigate", { url: origin + path });
  if (navigation.errorText) throw Error(`Navigation failed for ${path}: ${navigation.errorText}`);
  await waitFor(() => evaluate(`location.href === ${JSON.stringify(origin + path)} && document.readyState === "complete"`), path);
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
  // Fail rather than accidentally testing an unrelated service on a shared port.
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "-p", String(port)], {
    env: { ...process.env, STEPFUN_API_KEY: "", POSTHOG_PROJECT_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", b => logs.push(b.toString())); server.stderr.on("data", b => logs.push(b.toString()));
  await waitFor(async () => server.exitCode === null && logs.some(line => /Ready in/.test(line)) && (await fetch(origin)).ok, "owned local production server", 40000);
  const securityResponse = await fetch(origin);
  assert.equal(securityResponse.headers.get("x-frame-options"), "DENY");
  assert.equal(securityResponse.headers.get("x-content-type-options"), "nosniff");
  assert.equal(securityResponse.headers.get("referrer-policy"), "no-referrer");
  assert.match(securityResponse.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  for (const path of ["/api/cinema", "/api/events"]) {
    const denied = await fetch(origin + path, { method: "POST", headers: { origin: "https://hostile.test", "content-type": "application/json" }, body: "{}" });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get("access-control-allow-origin"), null);
  }
  pass("production security headers and cross-origin API rejection are active");
  const binary = [process.env.CHROME_BIN, "google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
    .filter(Boolean).find(name => existsSync(name) || spawnSync(name, ["--version"], { stdio: "ignore", timeout: 5000 }).status === 0);
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
  await navigate("/reset?mode=looping&activation=2&direct=1");
  await waitFor(() => evaluate(`!!document.querySelector('[role="dialog"]')`), "first-use disclaimer");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 320, height: 568, deviceScaleFactor: 1, mobile: true });
  await evaluate("document.documentElement.style.fontSize='24px'");
  assert.equal(await evaluate(`(()=>{const r=document.querySelector('[role="dialog"] > div').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()`),true);
  await screenshot("first-use-large-text-320");
  await evaluate("document.documentElement.style.fontSize=''");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await hasButton("暂停"), false, "a practice must not start behind the disclaimer");
  // Keyboard-only users must stay captured in the boundary dialog: initial focus plus a full Tab cycle.
  assert.equal(await evaluate(`document.querySelector('[role="dialog"]').contains(document.activeElement)`), true, "initial focus inside dialog");
  for (let tab = 0; tab < 6; tab += 1) {
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await sleep(60);
    assert.equal(await evaluate(`document.querySelector('[role="dialog"]').contains(document.activeElement)`), true, `tab ${tab} stays inside the dialog`);
  }
  await evaluate(`document.querySelector('[role="dialog"] input[type=checkbox]').click()`);
  await click("进入体验"); await waitFor(() => hasButton("暂停"), "practice after consent");
  await click("停止"); await click("跳过反馈，结束");
  pass("direct entry waits for acknowledged boundary; stop can skip feedback");
  await resetData(); await navigate("/");
  assert.equal(await evaluate(`document.querySelectorAll('[role="group"] button[aria-pressed="true"]').length`), 0);
  await screenshot("home-mobile");
  await click("开始 1 分钟 Reset"); await waitFor(() => hasButton("暂停"), "unrated practice");
  await screenshot("practice-mobile");
  await click("暂停");
  const pausedText = await evaluate(`document.querySelector('p.tabular-nums').textContent`);
  await sleep(2200);
  assert.equal(await evaluate(`document.querySelector('p.tabular-nums').textContent`), pausedText);
  assert.equal(await evaluate(`document.querySelector('[data-practice-paused="true"]').disabled`), true);
  await click("继续"); await sleep(8100); await click("停止"); await click("跳过反馈，结束");
  let row = (await records())[0];
  assert.equal(row.status, "stopped"); assert.equal(row.plannedDurationSeconds, 60);
  assert.ok(row.durationSeconds >= 8 && row.durationSeconds < 13, `actual=${row.durationSeconds}`);
  assert.equal(row.activationBefore, undefined); assert.equal(row.activationAfter, undefined);
  assert.equal(row.groundedActionId, undefined); assert.equal(row.reuseIntent, undefined);
  assert.equal(await evaluate(`document.body.innerText.includes('你没有消灭念头')`), false);
  await screenshot("stopped-unrated-mobile");
  pass("missing scores stay missing; pause excludes time; eight-second stop stays eight seconds");
  await resetData(); await navigate("/reset?method=inner-cinema&mode=impulsive&activation=5&direct=1");
  await waitFor(() => evaluate(`document.body.innerText.includes('当前方法不符合')`), "manual eligibility gate");
  assert.equal(await hasButton("暂停"), false); assert.equal((await records()).length, 0);
  await resetData(); await navigate("/reset?method=paced-breath&mode=tense&activation=5&direct=1&breath=0");
  await waitFor(() => evaluate(`document.body.innerText.includes('当前方法不符合')`), "breath opt-out");
  assert.equal(await hasButton("暂停"), false);
  pass("URL/manual start cannot bypass high-activation or breath opt-out rules");
  await resetData(); await navigate("/reset?mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "complete practice");
  assert.equal(await evaluate(`/入戏度|稳定度/.test(document.body.innerText)`), false);
  await waitFor(() => hasButton("保存反馈并结束"), "natural sixty-second completion", 70000);
  row = (await records())[0]; assert.equal(row.status, "completed"); assert.equal(row.result, undefined);
  await evaluate(`document.querySelector('[aria-label="现在被带走的程度（可不填） 4"]').click()`);
  await click("保存反馈并结束");
  await waitFor(() => evaluate(`document.body.innerText.includes('这次感觉更不舒服。')`), "worse ending");
  assert.equal(await hasButton("另开一次练习"), false);
  row = (await records())[0]; assert.equal(row.result, "worse"); assert.equal(row.activationAfter, 4);
  assert.equal((await records()).length, 1);
  await screenshot("worse-mobile");
  pass("completion precedes feedback; worse ending is neutral and does not promote repeating");
  assert.equal(analyticsRequests.length, 0, "default use must not send analytics");
  pass("default start, stop and feedback send no analytics requests");


  // Presentation semantics: the same subject moves; no click is required for completion.
  await resetData(); await navigate("/reset?method=inner-cinema&mode=looping&activation=2");
  await waitFor(() => hasButton("开始 1 分钟练习"), "observer entry");
  await screenshot("inner-cinema-entry-390");
  await navigate("/reset?method=inner-cinema&mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "observer practice");
  assert.match(await evaluate("document.body.innerText"), /看见刚才那一幕/, "the authored first-step guidance must be on screen");
  const screen = `document.querySelector('[data-testid="observer-screen"]')`;
  const subject = await evaluate(`${screen}.textContent`);
  assert.equal(subject.trim(), "有一个念头");
  const nearWidth = await evaluate(`${screen}.getBoundingClientRect().width`);
  await screenshot("observer-near-390");
  await click("退远一点"); await sleep(500);
  assert.equal(await evaluate(`${screen}.textContent`), subject);
  assert.ok(await evaluate(`${screen}.getBoundingClientRect().width`) < nearWidth * 0.9);
  await screenshot("observer-audience-390");
  await click("近一点"); await sleep(500);
  assert.ok(Math.abs(await evaluate(`${screen}.getBoundingClientRect().width`) - nearWidth) < 1);
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='近一点').focus()`);
  for (const [key, code, windowsVirtualKeyCode, expectedLens, expectedFocus] of [
    ["End", "End", 35, "witness", "再远一点"],
    ["Home", "Home", 36, "role", "近一点"],
    ["ArrowRight", "ArrowRight", 39, "audience", "退远一点"],
    ["ArrowLeft", "ArrowLeft", 37, "role", "近一点"],
  ]) {
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode });
    await sleep(350);
    assert.equal(await evaluate("document.querySelector('.observer-cinema').dataset.lens"), expectedLens, `${key} selects ${expectedLens}`);
    assert.equal(await evaluate("document.activeElement.textContent"), expectedFocus, `${key} moves focus with the lens`);
    assert.equal(await evaluate(`${screen}.textContent`), subject, `${key} preserves the original sentence`);
  }
  await cdp("Emulation.setDeviceMetricsOverride", { width: 320, height: 740, deviceScaleFactor: 1, mobile: true });
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await click("再远一点");
  assert.ok(await evaluate(`getComputedStyle(${screen}).transitionDuration.split(',').every(value => parseFloat(value) <= 0.00001)`), "reduced motion must be immediate (global CSS uses a near-zero duration)");
  assert.equal(await evaluate("document.documentElement.scrollWidth > innerWidth"), false);
  await screenshot("observer-reduced-motion-320");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await screenshot("observer-wide-1440");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await click("暂停");
  const lens = await evaluate("document.querySelector('[data-lens]').dataset.lens");
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='近一点').click()`);
  assert.equal(await evaluate("document.querySelector('[data-lens]').dataset.lens"), lens);
  await click("停止"); await click("跳过反馈，结束");
  await waitFor(() => evaluate(`!!document.querySelector('.inner-cinema-completion-scene [data-lens="witness"]')`), "observer ending scene");
  assert.equal(await evaluate(`document.querySelectorAll('[data-testid="observer-screen"]').length`), 0, "decorative ending must not duplicate the original sentence");
  await screenshot("inner-cinema-ended-390");
  pass("observer lens changes the same central object reversibly; keyboard, reduced motion, small width, pause and ending work");
  await resetData(); await navigate("/reset?method=paced-breath&mode=tense&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "natural breathing");
  await sleep(6200);
  assert.equal(await evaluate("document.querySelector('.natural-breath button').textContent"), "自然呼吸");
  assert.equal(await evaluate("/引导节拍|吸 气|呼 气/.test(document.body.innerText)"), false);
  await evaluate("document.querySelector('.natural-breath button').click()");
  assert.equal(await evaluate("document.querySelector('.natural-breath button').textContent"), "轻点 1");
  await screenshot("natural-breath-390");
  await click("停止"); await click("跳过反馈，结束");
  pass("natural counting has no timed inhale/exhale or estimated breath count");
  await resetData(); await navigate("/reset?method=person-shift&mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "person framing");
  const original = "我们在做自我观察。他说：我不想回应。";
  assert.equal(await evaluate("document.querySelector('input[aria-label=用于人称替代的名字]').value"), "");
  await evaluate(`(()=>{const el=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(original)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await waitFor(() => evaluate("!!document.querySelector('[data-testid=observer-frame]')"), "framed sentence");
  assert.ok((await evaluate("document.querySelector('[data-testid=observer-frame]').textContent")).includes(original));
  await screenshot("person-framing-390");
  await click("停止"); await click("跳过反馈，结束");
  pass("framing keeps quoted speakers and compounds without a default name");
  await resetData(); await navigate("/reset?method=logout-pause&mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂时收起这句话"), "logout subject");
  await click("暂时收起这句话");
  assert.equal(await evaluate("document.querySelector('[data-testid=logout-subject]').textContent"), "先看看周围，不用继续读这句话。");
  await click("重新显示这句话");
  assert.equal(await evaluate("document.querySelector('[data-testid=logout-subject]').textContent"), "有一个念头");
  await click("停止"); await click("跳过反馈，结束");
  await resetData(); await navigate("/reset?method=thought-watching&mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("注意到了"), "noticing");
  await click("注意到了"); await click("撤销标记");
  assert.equal(await evaluate("/我必须回应|是不是我不够好|他们不理解我|我不能输/.test(document.body.innerText)"), false);
  await click("停止"); await click("跳过反馈，结束");
  pass("logout hides/restores content; noticing is an optional reversible mark with neutral empty intake");

  // Real tab activation, not a synthetic visibilitychange event or document.hidden override.
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await resetData(); await navigate("/reset?method=wide-gaze&mode=tense&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "candle animation");
  const backgroundTab = await cdp("Target.createTarget", { url: "about:blank", background: false });
  await cdp("Target.activateTarget", { targetId: backgroundTab.targetId });
  await waitFor(() => evaluate("document.hidden === true"), "actual hidden document");
  await waitFor(() => hasButton("继续"), "background auto-pause");
  const backgroundText = await evaluate(`document.querySelector('p.tabular-nums').textContent`);
  await sleep(2200);
  assert.equal(await evaluate(`document.querySelector('p.tabular-nums').textContent`), backgroundText);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.wide-flame')).animationPlayState`), "paused");
  await cdp("Target.activateTarget", { targetId: target.id });
  await waitFor(() => evaluate("document.hidden === false"), "foreground document");
  assert.equal(await hasButton("继续"), true, "returning must not auto-resume");
  await screenshot("background-paused-mobile");
  await cdp("Target.closeTarget", { targetId: backgroundTab.targetId });
  await click("继续"); await waitFor(() => hasButton("暂停"), "explicit resume");
  await click("停止"); await click("跳过反馈，结束");
  pass("actual tab background pauses timer and CSS animation; returning requires explicit resume");

  await resetData(); await navigate("/");
  const startOffset = analyticsRequests.length;
  await clickConsent("自愿匿名分享本次开始");
  await click("开始 1 分钟 Reset"); await waitFor(() => hasButton("暂停"), "opted-in start");
  await waitFor(() => analyticsRequests.length === startOffset + 3, "three actual start events");
  await evaluate(`document.querySelector('header a[href="/"]').click()`);
  await waitFor(() => evaluate(`location.pathname === '/'`), "client-side route exit");
  await waitFor(() => analyticsRequests.length === startOffset + 4, "one abandonment event");
  const startEvents = analyticsRequests.slice(startOffset);
  assert.deepEqual(startEvents.map(e => e.name), ["reset_entry_submitted", "reset_started", "practice_started", "practice_ended"]);
  assert.equal(startEvents[3].payload.status, "abandoned");
  assert.equal(new Set(startEvents.map(e => e.payload.session_id)).size, 1);
  row = (await records())[0]; assert.equal(row.status, "abandoned");
  assert.equal((await records()).length, 1);
  pass("opt-in start and client-side navigation emit one joinable abandoned attempt");

  await resetData(); await navigate("/");
  const lateOffset = analyticsRequests.length;
  await click("开始 1 分钟 Reset"); await waitFor(() => hasButton("暂停"), "late-consent attempt");
  await click("停止");
  assert.equal(analyticsRequests.length, lateOffset);
  await clickConsent("自愿匿名分享已填写的变化");
  await click("保存反馈并结束");
  await waitFor(() => analyticsRequests.length === lateOffset + 1, "late-consent feedback only");
  const lateEvent = analyticsRequests[lateOffset];
  assert.equal(lateEvent.name, "after_check_saved");
  assert.equal(lateEvent.payload.result, "stopped");
  assert.equal(lateEvent.payload.activation_change_bucket, "unreported");
  assert.equal(lateEvent.payload.grounded_action_id, "");
  assert.equal(lateEvent.payload.reuse_intent, "unreported");
  assert.doesNotMatch(JSON.stringify(analyticsRequests), /rawTrigger|privateNote|feedbackNote/);
  pass("late consent sends feedback only; missing answers and action remain unreported");

  await resetData(); await navigate("/reset?method=trigger-journal&mode=curious&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "static observation");
  const steady = `document.querySelector('[data-testid="steady-object"]')`;
  const initialObject = await evaluate(`${steady}.innerHTML`);
  await sleep(1500);
  assert.equal(await evaluate(`${steady}.innerHTML`), initialObject);
  assert.equal(await evaluate(`document.querySelectorAll('[role="progressbar"]').length`), 1);
  assert.doesNotMatch(await evaluate("document.body.innerText"), /按住|正在稳定画面/);
  await click("改看身边的物品");
  assert.match(await evaluate(`${steady}.textContent`), /身边静止/);
  await click("回到屏幕对象");
  assert.equal(await evaluate(`${steady}.innerHTML`), initialObject);
  await screenshot("steady-mobile");
  await click("停止"); await click("跳过反馈，结束");
  pass("stability is a static observation with a reversible external alternative, not press-driven progress");

  for (const method of ["open-awareness", "release"]) {
    await resetData(); await navigate(`/reset?method=${method}&mode=curious&activation=2&eyes=0&direct=1`);
    await waitFor(() => hasButton("暂停"), method);
    if (method === "open-awareness") {
      assert.equal(await evaluate(`document.querySelectorAll('[aria-label="可选的觉察标记"] [aria-pressed="true"]').length`), 0);
      await click("声音"); assert.match(await evaluate("document.body.innerText"), /主动标记：声音/);
      await click("声音"); assert.match(await evaluate("document.body.innerText"), /主动标记：暂无/);
    } else {
      const guidance = `document.querySelector('[data-testid="boundary-guidance"]').textContent`;
      assert.match(await evaluate(guidance), /先不回想/);
      await click("愿意继续观察反应"); assert.doesNotMatch(await evaluate(guidance), /先不回想/);
      await click("暂不接触这件事"); assert.match(await evaluate(guidance), /先不回想/);
    }
    await screenshot(`${method}-mobile`);
    await click("停止"); await click("跳过反馈，结束");
  }
  pass("awareness has no invented selections and contact choice actually changes the guidance");

  await cdp("Emulation.setDeviceMetricsOverride", { width: 320, height: 740, deviceScaleFactor: 1, mobile: true });
  for (const method of ["inner-cinema", "paced-breath", "wide-gaze", "thought-watching", "body-scan", "person-shift", "logout-pause", "release", "open-awareness", "grounded-action", "trigger-journal", "anchors"]) {
    await resetData(); await navigate(`/reset?method=${method}&mode=curious&activation=2&eyes=0&direct=1`);
    await waitFor(() => hasButton("暂停"), `all methods: ${method}`);
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), true, method);
    await screenshot(`method-${method}-320`);
    await click("停止"); await click("跳过反馈，结束");
    assert.equal((await records())[0].methodId, method);
  }
  pass("all twelve methods start their selected method and can stop at 320px without horizontal overflow");

  await resetData(); await navigate("/methods");
  assert.equal(await evaluate(`new Set([...document.querySelectorAll('a[href^="/methods/"]')].map(a=>a.pathname)).size`), 12);
  for (const width of [390, 1440]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    await navigate("/");
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), true);
    await screenshot(`home-${width}`);
    await navigate("/reset");
    assert.equal(await hasButton("暂停"), false, "browsing without direct=1 must not start");
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), true);
    await screenshot(`choose-${width}`);
  }
  pass("twelve method links remain; 390/1440 layouts have no root overflow or accidental auto-start");

  await resetData();
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const injected = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: `Storage.prototype.setItem=function(){throw new Error('synthetic quota failure')}` });
  await navigate("/reset?mode=looping&activation=2&direct=1");
  await waitFor(() => hasButton("暂停"), "storage failure practice");
  await click("停止"); await click("跳过反馈，结束");
  assert.equal(await evaluate(`document.body.innerText.includes('本次记录未能完整保存在浏览器中')`), true);
  await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: injected.identifier });
  await screenshot("storage-failure-mobile");
  pass("storage write failure does not trap exit or claim a successful save");
  assert.deepEqual(failures, [], "uncaught browser exceptions");
  complete = true;
  console.log("Web smoke PASS (Chromium production automation; not development StrictMode, physical iOS/WeChat QA or efficacy testing).");
} catch (error) {
  console.error(error);
  try { writeFileSync(join(artifacts, "failure-dom.txt"), await evaluate("JSON.stringify({url:location.href,ready:document.readyState,text:document.body.innerText})")); } catch { /* A crashed renderer may not respond. */ }
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
