import assert from "node:assert/strict";
import test from "node:test";
import { METHOD_CATALOG, type PracticeSession } from "@stillmind/domain";
import { clearStillMindBrowserData, filterMethods, loadWebFavorites, loadWebSessions, saveWebFavorites, WEB_FAVORITES_KEY, WEB_SESSIONS_KEY } from "../src/lib/web-library";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  };
}
const session: PracticeSession = {
  id: "synthetic-web-session", schemaVersion: 1, startedAt: "2026-10-31T01:00:00.000Z", completedAt: "2026-10-31T01:01:00.000Z",
  status: "completed", mode: "curious", methodId: "inner-cinema", durationSeconds: 60, plannedDurationSeconds: 60,
  durationSource: "active-clock", activationBefore: 3, activationAfter: 2, result: "better", contentVersion: "synthetic",
};

test("web library loads only valid sessions and known method favorites", () => {
  const storage = memoryStorage();
  storage.setItem(WEB_SESSIONS_KEY, JSON.stringify([session, { id: "invalid" }]));
  storage.setItem(WEB_FAVORITES_KEY, JSON.stringify(["inner-cinema", "not-a-method", 3]));
  assert.deepEqual(loadWebSessions(storage).map((item) => item.id), [session.id]);
  assert.deepEqual(loadWebFavorites(storage), ["inner-cinema"]);
});

test("web library favorites persist and a failed write is not reported as saved", () => {
  const storage = memoryStorage();
  assert.equal(saveWebFavorites(["inner-cinema", "inner-cinema", "anchors"], storage), true);
  assert.deepEqual(loadWebFavorites(storage), ["inner-cinema", "anchors"]);
  assert.equal(saveWebFavorites(["release"], { setItem() { throw Error("synthetic denied"); } }), false);
  assert.deepEqual(loadWebFavorites(storage), ["inner-cinema", "anchors"]);
});

test("web library combines real family, duration and favorite filters", () => {
  assert.equal(filterMethods(METHOD_CATALOG, { family: "all", duration: "all", favoritesOnly: false }, []).length, 12);
  const favorites = filterMethods(METHOD_CATALOG, { family: "all", duration: "all", favoritesOnly: true }, ["anchors"]);
  assert.deepEqual(favorites.map((method) => method.id), ["anchors"]);
  const combined = filterMethods(METHOD_CATALOG, { family: "reflect", duration: 3, favoritesOnly: true }, ["anchors"]);
  assert.ok(combined.every((method) => method.family === "reflect" && method.durations.includes(3) && method.id === "anchors"));
});

test("web deletion touches only explicit StillMind keys and reports every failure", () => {
  const local = memoryStorage(); const sessionStorage = memoryStorage();
  local.setItem("unrelated-owner-data", "keep"); local.setItem(WEB_SESSIONS_KEY, JSON.stringify([session]));
  sessionStorage.setItem("stillmind.pendingTrigger.v1", "synthetic");
  assert.deepEqual(clearStillMindBrowserData(local, sessionStorage), { ok: true, failedKeys: [] });
  assert.equal(local.getItem("unrelated-owner-data"), "keep");
  assert.equal(local.getItem(WEB_SESSIONS_KEY), null);
  assert.equal(sessionStorage.getItem("stillmind.pendingTrigger.v1"), null);
  const denied = { removeItem(key: string) { if (key === WEB_SESSIONS_KEY) throw Error("synthetic denied"); } };
  const result = clearStillMindBrowserData(denied, memoryStorage());
  assert.equal(result.ok, false); assert.deepEqual(result.failedKeys, [WEB_SESSIONS_KEY]);
});
