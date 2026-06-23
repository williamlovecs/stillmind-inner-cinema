import { existsSync, readFileSync } from "node:fs";

const path = process.argv[2] ?? "docs/research/seed_user_results_template.csv";

if (!existsSync(path)) {
  console.error(`Seed-user CSV not found: ${path}`);
  process.exit(1);
}

const rows = parseCsv(readFileSync(path, "utf8")).filter((row) => row.session_id);

if (rows.length === 0) {
  console.log("Seed-user summary: no user rows yet.");
  console.log("Copy docs/research/seed_user_results_template.csv and add one anonymized row per user.");
  process.exit(0);
}

const complete = count(rows, (row) => norm(row.completed_reset) === "yes");
const moreChoice = count(rows, (row) => ["more_choice", "more choice"].includes(norm(row.after_check_result)));
const severeSafety = count(rows, (row) => truthy(row.severe_safety_concern));
const understandsBoundary = count(rows, (row) => truthy(row.understands_nonclinical));
const foundPrivacy = count(rows, (row) => ["yes", "partly"].includes(norm(row.found_privacy_delete_export)));
const textConfusionStops = count(rows, (row) => truthy(row.stopped_text_confusion));
const clinicalMisread = count(rows, (row) => truthy(row.interpreted_as_diagnosis_advice_therapy));
const reuseYesOrMaybe = count(rows, (row) => ["yes", "maybe"].includes(norm(row.would_use_again_week)));

const worseByMethod = new Map();
for (const row of rows) {
  if (norm(row.after_check_result) === "worse") {
    const method = row.method_id || "unknown";
    worseByMethod.set(method, (worseByMethod.get(method) ?? 0) + 1);
  }
}

const averageScores = [
  "comprehension_score",
  "completion_score",
  "felt_agency_score",
  "safety_comfort_score",
  "return_intent_score",
  "trust_privacy_score",
].map((field) => [field, average(rows, field)]);

const topConfusions = topValues(rows.map((row) => row.first_confusion_point).filter(Boolean));
const topScenarios = topValues(rows.map((row) => row.scenario_category).filter(Boolean));
const worstMethodSignals = [...worseByMethod.entries()].filter(([, value]) => value >= 2);

const hasEnoughData = rows.length >= 15;
const passGoThresholds =
  complete >= 8 &&
  moreChoice >= 5 &&
  severeSafety === 0 &&
  understandsBoundary >= 10 &&
  foundPrivacy >= 8;
const mustPause =
  textConfusionStops >= 4 ||
  clinicalMisread >= 3 ||
  severeSafety > 0 ||
  worstMethodSignals.length > 0;

let decision = "INSUFFICIENT_DATA";
if (hasEnoughData && mustPause) decision = "NO_GO_FIX_PRODUCT";
else if (hasEnoughData && passGoThresholds) decision = "GO_BROADER_TESTFLIGHT";
else if (hasEnoughData) decision = "NO_GO_MORE_ITERATION";

console.log(`# StillMind Seed-User Summary`);
console.log(``);
console.log(`Input: ${path}`);
console.log(`Rows: ${rows.length}`);
console.log(`Decision: ${decision}`);
console.log(``);
console.log(`## Go thresholds`);
metric("Completed reset", complete, ">= 8");
metric("More choice before acting", moreChoice, ">= 5");
metric("Severe safety concerns", severeSafety, "== 0");
metric("Understands non-clinical boundary", understandsBoundary, ">= 10");
metric("Found privacy/support/delete/export", foundPrivacy, ">= 8");
console.log(``);
console.log(`## Pause triggers`);
metric("Stopped because text/confusion", textConfusionStops, "< 4");
metric("Interpreted as diagnosis/advice/therapy", clinicalMisread, "< 3");
metric("Methods with >=2 worse reports", worstMethodSignals.length, "== 0");
console.log(``);
console.log(`## Reuse signal`);
metric("Would use again this week: yes/maybe", reuseYesOrMaybe, "watch");
console.log(``);
console.log(`## Average scores`);
for (const [field, value] of averageScores) {
  console.log(`- ${field}: ${value === null ? "n/a" : value.toFixed(2)}`);
}
console.log(``);
printList("Top scenario categories", topScenarios);
printList("Top confusion points", topConfusions);
if (worstMethodSignals.length > 0) printList("Worse signals by method", worstMethodSignals.map(([method, value]) => `${method}: ${value}`));
console.log(``);
console.log(`Reminder: do not store raw trigger text, medical details, contact info, or crisis details in this CSV.`);

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
  return String(value ?? "").trim().toLowerCase().replaceAll("-", "_");
}

function truthy(value) {
  return ["yes", "true", "1", "y"].includes(norm(value));
}

function count(items, predicate) {
  return items.filter(predicate).length;
}

function average(items, field) {
  const values = items.map((item) => Number(item[field])).filter((value) => Number.isFinite(value));
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([value, countValue]) => `${value}: ${countValue}`);
}

function printList(title, values) {
  console.log(`## ${title}`);
  if (values.length === 0) {
    console.log(`- n/a`);
    return;
  }
  for (const value of values) console.log(`- ${value}`);
  console.log(``);
}
