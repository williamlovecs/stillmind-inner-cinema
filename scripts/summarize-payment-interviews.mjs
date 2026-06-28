import { existsSync, readFileSync } from "node:fs";

const path = process.argv[2] ?? "docs/research/payment_interview_results_template.csv";

if (!existsSync(path)) {
  console.error(`Payment interview CSV not found: ${path}`);
  process.exit(1);
}

const rows = parseCsv(readFileSync(path, "utf8")).filter((row) => row.interview_id);

if (rows.length === 0) {
  console.log("Payment interview summary: no interview rows yet.");
  console.log("Copy docs/research/payment_interview_results_template.csv and add one anonymized row per qualified interview.");
  process.exit(0);
}

const qualified = rows.filter((row) => Number(row.prior_use_count) >= 1 && truthy(row.completed_reset));
const highIntent = qualified.filter((row) => Number(row.purchase_intent_score) >= 4);
const wouldAttempt = qualified.filter((row) => truthy(row.would_attempt_purchase));
const therapyExpectation = rows.filter((row) => truthy(row.expects_therapy_or_crisis_help));
const privacyConcern = rows.filter((row) => truthy(row.privacy_concern));
const needsCoach = rows.filter((row) => truthy(row.needs_human_coach));
const selectedPrices = qualified.map((row) => Number(row.selected_price_cny)).filter((value) => Number.isFinite(value) && value > 0);
const preferredOffers = topValues(rows.map((row) => row.preferred_offer).filter(Boolean));
const objections = topValues(rows.map((row) => row.main_objection).filter(Boolean));
const values = topValues(rows.map((row) => row.main_value_reason).filter(Boolean));

const hasEnoughData = qualified.length >= 5;
const hasSafetyTrustIssue = therapyExpectation.length > 0 || privacyConcern.length >= 2;
const hasPaidSignal = highIntent.length >= 3 && wouldAttempt.length >= 2;

let decision = "INSUFFICIENT_PAYMENT_DATA";
if (hasEnoughData && hasSafetyTrustIssue) decision = "NO_GO_FIX_SAFETY_OR_TRUST";
else if (hasEnoughData && hasPaidSignal) decision = "GO_TEST_PAID_OFFER";
else if (hasEnoughData) decision = "NO_GO_FIX_OFFER_OR_POSITIONING";

console.log("# StillMind Payment Interview Summary");
console.log("");
console.log(`Input: ${path}`);
console.log(`Rows: ${rows.length}`);
console.log(`Decision: ${decision}`);
console.log("");
console.log("## Paid-offer gates");
metric("Qualified interviews", qualified.length, ">= 5");
metric("Purchase intent score 4-5", highIntent.length, ">= 3");
metric("Would attempt purchase today", wouldAttempt.length, ">= 2");
metric("Therapy/crisis expectation", therapyExpectation.length, "== 0");
metric("Privacy/trust concerns", privacyConcern.length, "< 2");
metric("Needs human coach instead", needsCoach.length, "watch");
console.log("");
console.log("## Price signal");
metric("Median selected price CNY", median(selectedPrices), "watch");
metric("Average selected price CNY", average(selectedPrices), "watch");
console.log("");
printList("Preferred offers", preferredOffers);
printList("Main value reasons", values);
printList("Main objections", objections);
console.log("Reminder: do not store names, contact details, raw trigger text, medical details, crisis details, or payment information in this CSV.");

function metric(label, value, target) {
  console.log(`- ${label}: ${formatValue(value)} (${target})`);
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

function average(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function formatValue(value) {
  if (value === null) return "n/a";
  if (typeof value === "number" && !Number.isInteger(value)) return value.toFixed(2);
  return String(value);
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
    console.log("- n/a");
    console.log("");
    return;
  }
  for (const value of values) console.log(`- ${value}`);
  console.log("");
}
