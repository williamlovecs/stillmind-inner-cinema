import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const header = "test_id,area,scenario,required,build_profile,app_version,ios_device,ios_version,result,severity,offline_mode,notes,evidence";
const fields = header.split(",");
const requiredIds = [
  "fresh-install",
  "local-reset",
  "route-coverage",
  "practice-lifecycle",
  "airplane-mode",
  "ai-fallback",
  "notifications",
  "preference-exclusions",
  "accessibility",
  "privacy-controls",
  "legal-links",
  "support-link",
  "issue-templates",
  "restart-persistence",
  "reviewer-path",
];

test("device QA analyzer handles an empty template", () => {
  const output = runAnalyzer(requiredIds.map((id) => row({ test_id: id, result: "" })));
  assert.match(output, /Real-device QA summary: no completed rows yet/);
});

test("device QA analyzer passes complete all-pass coverage", () => {
  const output = runAnalyzer(requiredIds.map((id) => row({ test_id: id, result: "pass", offline_mode: id === "airplane-mode" ? "yes" : "no" })));
  assert.match(output, /Completed rows: 15/);
  assert.match(output, /Decision: PASS_REAL_DEVICE_QA/);
});

test("device QA analyzer blocks critical failures", () => {
  const rows = requiredIds.map((id) => row({ test_id: id, result: "pass" }));
  rows[0] = row({ test_id: "fresh-install", result: "fail", severity: "critical", notes: "crashes on launch" });
  const output = runAnalyzer(rows);
  assert.match(output, /Decision: NO_GO_FIX_CRITICAL_DEVICE_ISSUES/);
  assert.match(output, /fresh-install: fail\/critical/);
});

test("device QA analyzer reports insufficient coverage", () => {
  const output = runAnalyzer(requiredIds.slice(0, 10).map((id) => row({ test_id: id, result: "pass" })));
  assert.match(output, /Decision: INSUFFICIENT_DEVICE_QA/);
  assert.match(output, /Missing required scenarios/);
});

function row(overrides: Partial<Record<string, string>> = {}) {
  return {
    test_id: "fresh-install",
    area: "core",
    scenario: "scenario",
    required: "yes",
    build_profile: "preview",
    app_version: "0.1.0",
    ios_device: "iPhone",
    ios_version: "latest",
    result: "pass",
    severity: "none",
    offline_mode: "no",
    notes: "",
    evidence: "",
    ...overrides,
  };
}

function runAnalyzer(rows: Array<Record<string, string>>) {
  const dir = mkdtempSync(join(tmpdir(), "stillmind-device-qa-"));
  const file = join(dir, "device-qa.csv");
  writeFileSync(file, [header, ...rows.map(formatRow)].join("\n"), "utf8");

  try {
    return execFileSync(process.execPath, ["scripts/summarize-device-qa.mjs", file], {
      cwd: repoRoot,
      encoding: "utf8",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function formatRow(values: Record<string, string>) {
  return fields.map((field) => csvCell(values[field] ?? "")).join(",");
}

function csvCell(value: string) {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}
