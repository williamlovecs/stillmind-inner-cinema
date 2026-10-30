/** End-to-end local product-path QA for Web and the actual Expo Web export. Synthetic data only. */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer as createHttpServer } from "node:http";
import { createServer as createPortProbe } from "node:net";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const platform = process.argv.includes("--native") || process.env.V2_PLATFORM === "native" ? "native" : "web";
const port = Number(process.env.SMOKE_PORT || (platform === "web" ? 3183 : 3184));
const debugPort = Number(process.env.SMOKE_CHROME_PORT || (platform === "web" ? 9333 : 9334));
const origin = `http://127.0.0.1:${port}`;
const artifacts = `artifacts/experience-v2/${platform}/product-paths`;
mkdirSync(artifacts, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), `stillmind-path-${platform}-`));
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
async function click(label) { await waitFor(() => has(label), "button " + label); await evaluate(`(()=>{const b=${buttons}.find(b=>b.textContent.trim().endsWith(${JSON.stringify(label)})||b.getAttribute('aria-label')===${JSON.stringify(label)});b.scrollIntoView();b.click();})()`); await sleep(180); }
async function bodyIncludes(value) { return evaluate(`document.body.innerText.includes(${JSON.stringify(value)})`); }
async function navigate(path) { await cdp("Page.navigate", { url: origin + path }); await waitFor(() => evaluate(`location.pathname===${JSON.stringify(path.split("?")[0])}&&document.readyState==="complete"`), path); await sleep(650); }
async function seed() { await evaluate(`localStorage.clear();sessionStorage.clear();${platform === "web" ? `localStorage.setItem('stillmind-disclaimer-ack-v1','1')` : `localStorage.setItem('stillmind.preferences.v1',${JSON.stringify(JSON.stringify({ schemaVersion: 2, onboardingComplete: true, historyEnabled: true, aiEnabled: false, anonymousAnalyticsEnabled: false, eyesOpenPreferred: false, bodyFocusAllowed: true, breathChangeAllowed: true, hapticsEnabled: false, reminderEnabled: false, reminderHour: 21, favoriteMethodIds: [], hiddenMethodIds: [] }))})`}`); }
async function screenshot(name) { await evaluate("window.scrollTo(0,0)"); const data = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); writeFileSync(join(artifacts, name + ".png"), Buffer.from(data.data, "base64")); }
function pass(label) { passed.push(label); console.log(`PASS ${platform}: ${label}`); }
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
  await navigate("/"); await seed(); await navigate("/"); await screenshot("empty-home-390");
  assert.equal(await bodyIncludes("接着上一次"), false, "empty data must not fabricate shortcuts");
  const libraryPath = platform === "web" ? "/methods" : "/practices";
  await navigate(libraryPath); await screenshot("library-390");
  if (platform === "web") assert.equal(await evaluate(`new Set([...document.querySelectorAll('a[href^="/methods/"]')].map(a=>a.getAttribute('href'))).size`), 12);
  else assert.equal(await bodyIncludes("12 种方法"), true);
  if (platform === "web") await click("收藏观电影法");
  else await evaluate(`(()=>{const card=${buttons}.find(b=>b.textContent.includes('观电影法')&&b.querySelector('[aria-label="收藏"]'));if(!card)throw Error('native cinema card missing');card.querySelector('[aria-label="收藏"]').click()})()`);
  await waitFor(async () => platform === "web" ? await has("取消收藏观电影法") : await evaluate(`JSON.parse(localStorage.getItem('stillmind.preferences.v1')||'{}').favoriteMethodIds?.includes('inner-cinema')`), "favorite persistence");
  await navigate(libraryPath);
  if (platform === "web") assert.equal(await has("取消收藏观电影法"), true);
  await click("只看收藏");
  if (platform === "web") assert.equal(await evaluate(`document.querySelectorAll('.sm-method-card').length`), 1);
  else assert.equal(await bodyIncludes("1 种方法"), true);
  await click("10 分钟"); assert.equal(await bodyIncludes("观电影法"), true);
  await click("全部时长"); await click("只看收藏");
  await screenshot("favorite-library-390"); pass("favorite survives reload and combines with real duration/filter results");

  await navigate("/"); assert.equal(await bodyIncludes("接着上一次"), true); assert.equal(await bodyIncludes("观电影法"), true);
  const practicePath = platform === "web" ? "/reset?method=inner-cinema&mode=curious&activation=2&direct=1" : "/reset?methodId=inner-cinema&duration=1&mode=curious&activation=2&ratingProvided=1&direct=1";
  await navigate(practicePath); await waitFor(() => has("暂停"), "actual practice"); await sleep(8100); await click("停止"); await click("跳过反馈，结束");
  if (platform === "web") await waitFor(async () => (await evaluate(`JSON.parse(localStorage.getItem('stillmind.web.sessions.v1')||'[]')`)).length === 1, "web stopped session");
  else await waitFor(async () => (await evaluate(`JSON.parse(localStorage.getItem('stillmind.sessions.v1')||'[]')`)).length === 1, "native stopped session");
  await navigate("/"); assert.equal(await bodyIncludes("最近练习"), true); await screenshot("recent-home-390");
  await navigate("/reflection"); assert.equal(await bodyIncludes("最近记录"), true); assert.equal(await bodyIncludes("观电影法"), true); assert.equal(await bodyIncludes("已停止"), true); await screenshot("reflection-390");
  pass("an actual timed practice appears in home shortcuts and local reflection");

  const settingsPath = platform === "web" ? "/settings" : "/profile";
  await navigate(settingsPath); assert.equal(await bodyIncludes(platform === "web" ? "1 条练习记录" : "导出本机数据"), true);
  await evaluate(`window.__exportText='';window.__originalObjectURL=URL.createObjectURL;URL.createObjectURL=function(blob){blob.text().then(t=>window.__exportText=t);return window.__originalObjectURL.call(URL,blob)}`);
  await click(platform === "web" ? "导出 JSON 数据" : "导出本机数据");
  await waitFor(() => evaluate(`window.__exportText.includes('inner-cinema')`), "JSON export payload");
  assert.equal(await evaluate(`JSON.parse(window.__exportText).sessions.length`), 1);
  await screenshot("data-settings-390"); pass("JSON export contains the real local session, not demo content");

  if (platform === "web") {
    await evaluate(`window.__originalRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k==='stillmind.web.sessions.v1')throw Error('synthetic denied');return window.__originalRemove.call(this,k)}`);
    await click("准备清除本机数据"); await click("确认永久清除"); assert.equal(await bodyIncludes("清除未完整完成"), true);
    await evaluate(`Storage.prototype.removeItem=window.__originalRemove`); await click("确认永久清除"); assert.equal(await bodyIncludes("本机数据已清除"), true);
    assert.equal(await evaluate(`localStorage.getItem('stillmind.web.sessions.v1')`), null);
    await navigate("/reflection"); assert.equal(await bodyIncludes("这一周还没有记录"), true); await screenshot("empty-reflection-390");
    pass("deletion failure stays honest and successful deletion clears reflection");
  }
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await navigate(libraryPath); await screenshot("library-1440");
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 320, height: 740, deviceScaleFactor: 1, mobile: true }); await navigate(libraryPath); await evaluate("document.documentElement.style.fontSize='20px'"); await sleep(200);
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth+1"), true, "320px large text overflow"); await screenshot("library-large-text-320");
  await evaluate("document.documentElement.style.fontSize=''");
  assert.deepEqual(failures, []); assert.deepEqual(externalRequests, []); complete = true;
} catch (error) { console.error(error); failures.push(String(error)); process.exitCode = 1; try { if (socket?.readyState === 1) await screenshot("failure"); } catch {} }
finally {
  writeFileSync(join(artifacts, "summary.json"), JSON.stringify({ complete, platform, passed, failures, externalRequests, testedGitSha: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout?.trim(), scope: platform === "web" ? "Local Next production browser automation" : "Local Expo Web export; not a physical device" }, null, 2));
  writeFileSync(join(artifacts, "server.log"), serverLogs.join("")); socket?.close(); chrome?.kill("SIGTERM"); nextServer?.kill("SIGTERM"); nativeServer.close(); await sleep(250); try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
