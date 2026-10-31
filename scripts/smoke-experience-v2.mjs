/** Synthetic interaction QA for Experience V2. Web production or Expo Web export, never a physical device. */
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
const port = Number(process.env.SMOKE_PORT || (platform === "web" ? 3181 : 3182));
const debugPort = Number(process.env.SMOKE_CHROME_PORT || (platform === "web" ? 9331 : 9332));
const origin = `http://127.0.0.1:${port}`;
const artifacts = `artifacts/experience-v2/${platform}/batch-${batch}`;
mkdirSync(artifacts, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), `stillmind-v2-${platform}-`));
const passed = [], failures = [], externalRequests = [], serverLogs = [];
let complete = false, chrome, socket, nextId = 0, nextServer;
const pending = new Map();
const nativeRoot = resolve(".expo-ci/web");
const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ttf": "font/ttf", ".wasm": "application/wasm" };
const nativeServer = createHttpServer((req, res) => {
  try {
    const raw = decodeURIComponent(new URL(req.url, origin).pathname); let file = resolve(nativeRoot, "." + raw);
    if (file !== nativeRoot && !file.startsWith(nativeRoot + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file) && existsSync(file + ".html")) file += ".html";
    if (!existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" }).end(readFileSync(file));
  } catch { res.writeHead(400).end(); }
});
function cdp(method, params = {}) { const id = ++nextId; return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(id); reject(Error("CDP timeout " + method)); }, 20000); pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } }); socket.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text); return result.result.value; }
async function waitFor(fn, label, timeout = 20000) { const until = Date.now() + timeout; while (Date.now() < until) { try { if (await fn()) return; } catch {} await sleep(120); } throw Error("Timeout " + label); }
const buttons = `[...document.querySelectorAll('[role="button"],button')].filter(b=>b.getBoundingClientRect().width&&b.getAttribute('aria-disabled')!=='true'&&!b.disabled)`;
async function has(label) { return evaluate(`${buttons}.some(b=>b.textContent.trim().endsWith(${JSON.stringify(label)})||b.getAttribute('aria-label')===${JSON.stringify(label)})`); }
async function click(label) { await waitFor(() => has(label), "button " + label); await evaluate(`(()=>{const b=${buttons}.find(b=>b.textContent.trim().endsWith(${JSON.stringify(label)})||b.getAttribute('aria-label')===${JSON.stringify(label)});b.scrollIntoView();b.click();})()`); await sleep(140); }
async function fill(label, value) { await evaluate(`(()=>{const el=document.querySelector('[aria-label=${JSON.stringify(label)}]');if(!el)throw Error('input missing '+${JSON.stringify(label)});Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`); await sleep(100); }
async function bodyIncludes(value) { return evaluate(`document.body.innerText.includes(${JSON.stringify(value)})`); }
async function navigate(path) { await cdp("Page.navigate", { url: origin + path }); await waitFor(() => evaluate(`location.pathname===${JSON.stringify(path.split("?")[0])}&&document.readyState==="complete"`), path); await sleep(500); }
async function seed() { await evaluate(`localStorage.clear();sessionStorage.clear();${platform === "web" ? `localStorage.setItem('stillmind-disclaimer-ack-v1','1')` : `localStorage.setItem('stillmind.preferences.v1',${JSON.stringify(JSON.stringify({ schemaVersion: 2, onboardingComplete: true, historyEnabled: true, aiEnabled: false, anonymousAnalyticsEnabled: false, eyesOpenPreferred: false, bodyFocusAllowed: true, breathChangeAllowed: true, hapticsEnabled: false, reminderEnabled: false, reminderHour: 21, favoriteMethodIds: [], hiddenMethodIds: [] }))})`}`); }
async function screenshot(name) { await evaluate("window.scrollTo(0,0)"); const data = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); writeFileSync(join(artifacts, name + ".png"), Buffer.from(data.data, "base64")); }
function pass(label) { passed.push(label); console.log(`PASS ${platform} ${batch}: ${label}`); }
const groups = {
  A: ["paced-breath", "thought-watching", "wide-gaze"],
  B: ["body-scan", "person-shift", "logout-pause"],
  C: ["release", "open-awareness", "grounded-action"],
  D: ["trigger-journal", "anchors"],
};
const methods = groups[batch];
if (!methods) throw Error("V2_BATCH must be A, B, C or D");
const nativeDurations = { "thought-watching": 3, "body-scan": 5, release: 5, "open-awareness": 5, "trigger-journal": 3 };
try {
  const probe = createPortProbe(); await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(port, "127.0.0.1", () => probe.close(resolve)); });
  if (platform === "web") {
    nextServer = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "-p", String(port)], { env: { ...process.env, STEPFUN_API_KEY: "", POSTHOG_PROJECT_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
    nextServer.stdout.on("data", (data) => serverLogs.push(data.toString())); nextServer.stderr.on("data", (data) => serverLogs.push(data.toString()));
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
  socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", (event) => { const data = JSON.parse(event.data); if (data.id) { const item = pending.get(data.id); if (item) { pending.delete(data.id); data.error ? item.reject(Error(JSON.stringify(data.error))) : item.resolve(data.result); } } else if (data.method === "Runtime.exceptionThrown") failures.push(data.params.exceptionDetails.exception?.description ?? data.params.exceptionDetails.text); else if (data.method === "Fetch.requestPaused") { const url = data.params.request.url; if (/^https?:/.test(url) && !url.startsWith(origin + "/")) { externalRequests.push(url); void cdp("Fetch.failRequest", { requestId: data.params.requestId, errorReason: "BlockedByClient" }); } else void cdp("Fetch.continueRequest", { requestId: data.params.requestId }); } });
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await navigate("/"); await seed();
  if (batch === "A") {
    await navigate("/"); await screenshot("home-390");
    if (platform === "web") { await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await navigate("/"); await screenshot("home-1440"); await navigate("/methods"); await screenshot("library-1440"); await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await navigate("/methods"); await screenshot("library-390"); }
    pass("representative pages captured with reduced motion");
  }
  for (const method of methods) {
    await seed();
    const path = platform === "web" ? `/reset?method=${method}&mode=curious&activation=2&eyes=0&direct=1` : `/reset?methodId=${method}&duration=${nativeDurations[method] || 1}&mode=curious&activation=2&ratingProvided=1&direct=1`;
    await navigate(path); await waitFor(() => has("暂停"), method);
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, `${method} root overflow`);
    if (method === methods[0]) { await click("暂停"); assert.equal(await has("继续"), true); await click("继续"); }
    if (method === "paced-breath") {
      assert.equal(await evaluate("document.body.innerText.includes('不代表你的呼吸频率')"), true);
      await click("轻点记一次数"); assert.equal(await bodyIncludes("轻点 1"), true); await click("纯文字"); assert.equal(await bodyIncludes("按自己的节奏呼吸"), true); await click("静态水面");
    } else if (method === "thought-watching") {
      const thought = "我在等一条合成测试消息。"; await fill("此刻的一句念头", thought); await click("暂时隐藏念头"); assert.equal(await bodyIncludes("它没有消失"), true); await click("再次查看念头"); assert.equal(await bodyIncludes(thought), true); await click("注意到了"); await click("撤销标记");
    } else if (method === "wide-gaze") {
      await click("物体边缘"); assert.equal(await bodyIncludes("明暗交界"), true); await click("周围空间"); assert.equal(await bodyIncludes("周围的空间"), true); await click(platform === "web" ? "走神了，回到烛光" : "走神了，点一下回到烛光"); assert.equal(await bodyIncludes("回到中心 1 次"), true);
    } else if (method === "body-scan") {
      await click("标记手掌"); assert.equal(await bodyIncludes("手掌接触衣物"), true); await click("改看周围环境"); assert.equal(await bodyIncludes("三种颜色"), true);
    } else if (method === "person-shift") {
      const original = "我们在做自我观察。他说：我不想回应。"; await fill("需要转换为旁观语言的念头", original); await fill(platform === "web" ? "我亲眼看到或听到的事实" : "我亲眼看到或听到的事实", "合成测试：对方发来两个字。"); await fill(platform === "web" ? "一个可选择的回应" : "一个可选择的回应", "稍后再回复"); assert.equal(await bodyIncludes(original), true); assert.equal(await bodyIncludes("对方发来两个字"), true); assert.equal(await bodyIncludes("不表示已经做到"), true);
    } else if (method === "logout-pause") {
      await click("暂时收起这句话"); assert.equal(await bodyIncludes("不用继续读这句话"), true); await click("重新显示这句话"); await click("走完一小段路后"); await click("回到手边的小事"); assert.equal(await bodyIncludes("不代表你已经做到"), true);
    } else if (method === "release") {
      await click("保持距离"); assert.equal(await bodyIncludes("不需要联系"), true); await click("只停止本次重播"); assert.equal(await bodyIncludes("不代表必须改变"), true); await click("愿意继续观察反应"); await click("暂不接触这件事"); assert.equal(await bodyIncludes("先不回想"), true);
    } else if (method === "open-awareness") {
      await click("声音"); assert.equal(await bodyIncludes("主动标记：声音"), true); await click("声音"); assert.equal(await bodyIncludes("主动标记：暂无"), true); await click("切换纯文字"); assert.equal(await bodyIncludes("也可以什么都不标记"), true);
    } else if (method === "grounded-action") {
      await click("细节"); assert.equal(await bodyIncludes("画面只是放大"), true); await click("观察现实物品"); await fill("本次观察的真实物品", "合成纸杯"); assert.equal(await bodyIncludes("不需要拍照"), true); assert.equal(await bodyIncludes("合成纸杯"), true);
    } else if (method === "trigger-journal") {
      await click("使用纯文字"); assert.equal(await bodyIncludes("没有稳定度分数"), true); await click("回到低刺激视觉"); await click("改看身边的物品"); assert.equal(await bodyIncludes("身边静止"), true); await click("回到屏幕对象");
    } else if (method === "anchors") {
      await click("更大的空间"); assert.equal(await bodyIncludes("准备回到房间"), true); await click("返回当前房间"); assert.equal(await bodyIncludes("此刻的房间"), true);
    }
    await screenshot(`${method}-390`);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 320, height: 740, deviceScaleFactor: 1, mobile: true });
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, `${method} 320 overflow`); await screenshot(`${method}-320`);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await click("停止"); await click("跳过反馈，结束"); pass(`${method} meaningful interaction, pause, stop and small viewport`);
  }
  assert.deepEqual(failures, []); assert.deepEqual(externalRequests, []); complete = true;
} catch (error) { console.error(error); failures.push(String(error)); process.exitCode = 1; try { if (socket?.readyState === 1) await screenshot("failure"); } catch {} }
finally {
  writeFileSync(join(artifacts, "summary.json"), JSON.stringify({ complete, platform, batch, passed, failures, externalRequests, testedGitSha: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout?.trim(), scope: platform === "web" ? "Local Next production browser automation" : "Local Expo Web export; not a physical device" }, null, 2));
  writeFileSync(join(artifacts, "server.log"), serverLogs.join("")); socket?.close(); chrome?.kill("SIGTERM"); nextServer?.kill("SIGTERM"); nativeServer.close(); await sleep(250); try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
