import { existsSync, readFileSync } from "node:fs";

const path = process.argv[2] ?? "docs/app-store/real_device_qa_template.csv";

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

if (!existsSync(path)) {
  console.error(`Real-device QA CSV not found: ${path}`);
  process.exit(1);
}

const rows = parseCsv(readFileSync(path, "utf8")).filter((row) => row.test_id);
const completedRows = rows.filter((row) => norm(row.result));

if (completedRows.length === 0) {
  console.log("Real-device QA summary: no completed rows yet.");
  console.log("Copy docs/app-store/real_device_qa_template.csv and fill result/severity on a real iPhone preview/TestFlight build.");
  process.exit(0);
}

const completedIds = new Set(completedRows.map((row) => norm(row.test_id)));
const missingRequired = requiredIds.filter((id) => !completedIds.has(id));
const failures = completedRows.filter((row) => ["fail", "failed", "blocked"].includes(norm(row.result)));
const criticalFailures = failures.filter((row) => ["blocker", "critical"].includes(norm(row.severity)));
const passes = completedRows.filter((row) => norm(row.result) === "pass");
const blockers = completedRows.filter((row) => norm(row.result) === "blocked");
const offlinePasses = completedRows.filter((row) => truthy(row.offline_mode) && norm(row.result) === "pass");

let decision = "PASS_REAL_DEVICE_QA";
if (criticalFailures.length > 0) decision = "NO_GO_FIX_CRITICAL_DEVICE_ISSUES";
else if (failures.length > 0) decision = "NO_GO_FIX_DEVICE_ISSUES";
else if (missingRequired.length > 0) decision = "INSUFFICIENT_DEVICE_QA";

console.log("# StillMind Real-Device QA Summary");
console.log("");
console.log(`Input: ${path}`);
console.log(`Completed rows: ${completedRows.length}`);
console.log(`Decision: ${decision}`);
console.log("");
console.log("## Coverage");
metric("Required scenarios completed", requiredIds.length - missingRequired.length, `>= ${requiredIds.length}`);
metric("Pass rows", passes.length, "watch");
metric("Blocked rows", blockers.length, "== 0");
metric("Offline-mode passes", offlinePasses.length, ">= 1");
console.log("");
console.log("## Failure gates");
metric("Critical/blocker failures", criticalFailures.length, "== 0");
metric("Any failed/blocked rows", failures.length, "== 0");
console.log("");
printList("Missing required scenarios", missingRequired);
printList("Failures", failures.map((row) => `${row.test_id}: ${row.result}/${row.severity || "none"} ${row.notes || ""}`.trim()));
console.log("Reminder: do not paste private trigger text, screenshots with private content, Apple credentials, or tester contact details into this CSV.");

function metric(label, value, target) {
  console.log(`- ${label}: ${value} (${target})`);
}

function parseCsv(source) {
  const lines = source.replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
  if (lines.length === 0 || !lines[0]) return [];
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

function norm(value) {
  return String(value ?? "").trim().toLowerCase();
}

function truthy(value) {
  return ["yes", "true", "1", "y"].includes(norm(value));
}

function printList(title, values) {
  console.log(`## ${title}`);
  if (values.length === 0) {
    console.log("- none");
    console.log("");
    return;
  }
  for (const value of values) console.log(`- ${value}`);
  console.log("");
}
