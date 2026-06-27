import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const checks = [];
const warnings = [];

const seedProtocol = readText("docs/research/SEED_USER_PROTOCOL.md");
const seedTemplate = readText("docs/research/seed_user_results_template.csv");
const gtm = readText("docs/business/GTM_AND_BUSINESS.md");
const measurement = readText("docs/analytics/MEASUREMENT_PLAN.md");
const humanGates = readText("docs/HUMAN_GATES.md");
const release = readText("scripts/check-release-readiness.mjs");
const pkg = readJson("package.json");

const expectedSeedHeaders = [
  "session_id",
  "surface",
  "recruit_segment",
  "scenario_category",
  "completed_reset",
  "needed_help",
  "after_check_result",
  "found_privacy_delete_export",
  "would_use_again_week",
  "understands_nonclinical",
  "severe_safety_concern",
  "stopped_text_confusion",
  "interpreted_as_diagnosis_advice_therapy",
  "method_id",
  "duration",
  "comprehension_score",
  "completion_score",
  "felt_agency_score",
  "safety_comfort_score",
  "return_intent_score",
  "trust_privacy_score",
  "first_confusion_point",
  "non_sensitive_quote",
  "followup_used_again",
  "followup_recommend",
];

check("seed-user protocol exists", () => Boolean(seedProtocol));
check("seed-user CSV template exists", () => Boolean(seedTemplate));
check("seed-user analyzer exists", () => fileExists("scripts/summarize-seed-users.mjs"));
check("seed-user analyzer npm script exists", () => scriptIncludes("analyze:seed-users", "summarize-seed-users"));
check("seed-user analyzer tests are in npm test", () => scriptIncludes("test", "test:seed-users"));
check("seed-user template has exact expected headers", () => firstCsvLine(seedTemplate).join(",") === expectedSeedHeaders.join(","));
check("seed-user analyzer handles the blank template", () => analyzerOutput("docs/research/seed_user_results_template.csv").includes("no user rows yet"));

check("seed protocol targets 15 first-time users", () => hasAll(seedProtocol, ["Target sample: 15", "15 first-time users"]));
check("seed protocol protects raw trigger privacy", () => hasAll(seedProtocol, ["Do not collect raw trigger text", "Not allowed:", "medical history or diagnoses"]));
check("seed protocol defines live core task", () => hasAll(seedProtocol, ["Open StillMind", "Start the practice", "Open Reflection", "Open Profile"]));
check("seed protocol defines score rubric", () => hasAll(seedProtocol, ["Comprehension", "Completion", "Felt agency", "Safety comfort", "Return intent", "Trust/privacy"]));
check("seed protocol defines GO thresholds", () => hasAll(seedProtocol, ["at least 8 of 15 complete one reset", "at least 5 of 15 report more choice", "at least 10 of 15 understand", "at least 8 of 15 can find privacy"]));
check("seed protocol defines pause triggers", () => hasAll(seedProtocol, ["4 or more users stop", "3 or more users interpret it as diagnosis", "2 or more users report feeling worse", "any severe safety concern"]));
check("seed protocol includes 48-72 hour follow-up", () => hasAll(seedProtocol, ["48-72 hours", "Did you use StillMind again?"]));
check("seed protocol links analyzer command", () => seedProtocol.includes("npm run analyze:seed-users"));

check("GTM plan defines six-week validation loop", () => hasAll(gtm, ["Six-Week Validation Loop", "Weeks 1-2: 15 guided users", "Weeks 3-4: 50 unguided users", "Weeks 5-6: willingness to pay"]));
check("GTM plan keeps first release free unless StoreKit is ready", () => hasAll(gtm, ["The first App Store release should be free", "StoreKit", "restore purchase"]));
check("GTM plan includes channel order", () => hasAll(gtm, ["Channel Order", "Founder-led community", "No paid acquisition before second-use retention"]));
check("GTM plan includes moat development", () => hasAll(gtm, ["Moat Development", "Learning", "Retention", "Distribution"]));
check("GTM plan references seed-user protocol", () => gtm.includes("SEED_USER_PROTOCOL.md"));

check("measurement plan defines useful resets North Star", () => hasAll(measurement, ["Useful resets", "more choice before acting"]));
check("measurement plan defines initial funnel and safety targets", () => hasAll(measurement, ["First reset completion: >=40%", "First useful reset: >=25%", "Seven-day second useful reset: >=20%", "Worse + stopped: <=15%"]));
check("measurement plan forbids raw/private analytics", () => hasAll(measurement, ["Never send:", "Raw trigger text", "Private notes", "Generated cinema scenes"]));
check("measurement plan includes privacy-safe event allowlist", () => hasAll(measurement, ["Privacy-Safe Event Allowlist", "reset_started", "practice_ended", "after_check_saved"]));
check("measurement plan links seed-user protocol", () => measurement.includes("SEED_USER_PROTOCOL.md"));

check("human gates require 15 seed users before public App Store", () => hasAll(humanGates, ["Observe at least 15 first-time users", "Run the 15-user protocol", "before broad TestFlight or App Store launch"]));
check("release readiness checks seed-user assets", () => hasAll(release, ["seed-user protocol exists", "seed-user result template exists", "seed-user analyzer exists"]));

if (!fileExists("docs/research/seed_user_results.csv")) {
  warnings.push({
    label: "no real seed-user result file",
    detail: "Expected before broad TestFlight/App Store: copy seed_user_results_template.csv to a private results file and collect 15 anonymized rows.",
  });
}

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.label}`);
}

if (warnings.length > 0) {
  console.log("\nGTM validation warnings:");
  for (const warning of warnings) console.log(`WARN ${warning.label}: ${warning.detail}`);
}

if (failed.length > 0) {
  console.error(`\nGTM readiness check failed: ${failed.length} gate(s) missing.`);
  process.exit(1);
}

console.log("\nGTM readiness guard passed. Real seed-user sessions and market evidence remain human/external gates.");

function check(label, fn) {
  let ok = false;
  try {
    ok = Boolean(fn());
  } catch {
    ok = false;
  }
  checks.push({ label, ok });
}

function readText(path) {
  const fullPath = join(process.cwd(), path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(path) {
  const text = readText(path);
  return text ? JSON.parse(text) : null;
}

function fileExists(path) {
  return existsSync(join(process.cwd(), path));
}

function scriptIncludes(name, fragment) {
  return typeof pkg?.scripts?.[name] === "string" && pkg.scripts[name].includes(fragment);
}

function firstCsvLine(source) {
  const firstLine = source.replace(/^\uFEFF/, "").split(/\r?\n/)[0] ?? "";
  return firstLine.split(",").map((value) => value.trim());
}

function analyzerOutput(path) {
  return execFileSync(process.execPath, ["scripts/summarize-seed-users.mjs", path], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

function hasAll(text, needles) {
  return needles.every((needle) => typeof needle === "string" && needle.length > 0 && text.includes(needle));
}
