import { existsSync, readFileSync } from "node:fs";
import { parseCsv, average, summarize } from "./lib/seed-user-analysis.mjs";

const path = process.argv[2] ?? "docs/research/seed_user_results_template.csv";

if (!existsSync(path)) {
  console.error(`Seed-user CSV not found: ${path}`);
  process.exit(1);
}

let rows;
try { rows = parseCsv(readFileSync(path, "utf8")); }
catch { console.error("Decision: INVALID_DATA; check CSV format without posting private rows."); process.exit(1); }

if (rows.length === 0) {
  console.log("Seed-user summary: no user rows yet.");
  console.log("Copy docs/research/seed_user_results_template.csv and add one anonymized row per user.");
  process.exit(0);
}

const { decision, complete, moreChoice, severeSafety, understandsBoundary, foundPrivacy,
  textConfusionStops, clinicalMisread, reuseYesOrMaybe, worstMethodSignals, missingSafety, duplicateIds } = summarize(rows);

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
console.log(`# StillMind Seed-User Summary`);
console.log(``);
console.log(`Input: ${path}`);
console.log(`Rows: ${rows.length}`);
console.log(`Decision: ${decision}`);
console.log(`Rows missing explicit safety review: ${missingSafety}`);
console.log(`Duplicate participant IDs: ${duplicateIds.length} (resolve before expanding)`);
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
