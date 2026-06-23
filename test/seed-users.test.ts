import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const header =
  "session_id,surface,recruit_segment,scenario_category,completed_reset,needed_help,after_check_result,found_privacy_delete_export,would_use_again_week,understands_nonclinical,severe_safety_concern,stopped_text_confusion,interpreted_as_diagnosis_advice_therapy,method_id,duration,comprehension_score,completion_score,felt_agency_score,safety_comfort_score,return_intent_score,trust_privacy_score,first_confusion_point,non_sensitive_quote,followup_used_again,followup_recommend";
const fields = header.split(",");

test("seed-user analyzer handles an empty template", () => {
  const output = runAnalyzer([]);
  assert.match(output, /Seed-user summary: no user rows yet/);
});

test("seed-user analyzer returns GO when 15 users meet broader TestFlight thresholds", () => {
  const rows = rowsFor(15, (index) => ({
    completed_reset: index < 10 ? "yes" : "no",
    after_check_result: index < 6 ? "more_choice" : "same",
    found_privacy_delete_export: index < 10 ? "yes" : "no",
    understands_nonclinical: index < 12 ? "yes" : "no",
  }));

  const output = runAnalyzer(rows);
  assert.match(output, /Rows: 15/);
  assert.match(output, /Decision: GO_BROADER_TESTFLIGHT/);
});

test("seed-user analyzer pauses launch when a severe safety concern appears", () => {
  const rows = rowsFor(15, (index) => ({
    completed_reset: index < 10 ? "yes" : "no",
    after_check_result: index < 6 ? "more_choice" : "same",
    found_privacy_delete_export: index < 10 ? "yes" : "no",
    understands_nonclinical: index < 12 ? "yes" : "no",
    severe_safety_concern: index === 0 ? "yes" : "no",
  }));

  const output = runAnalyzer(rows);
  assert.match(output, /Decision: NO_GO_FIX_PRODUCT/);
  assert.match(output, /Severe safety concerns: 1/);
});

test("seed-user analyzer asks for iteration when go thresholds are not met", () => {
  const rows = rowsFor(15, (index) => ({
    completed_reset: index < 6 ? "yes" : "no",
    after_check_result: index < 3 ? "more_choice" : "same",
    found_privacy_delete_export: index < 7 ? "yes" : "no",
    understands_nonclinical: index < 9 ? "yes" : "no",
  }));

  const output = runAnalyzer(rows);
  assert.match(output, /Decision: NO_GO_MORE_ITERATION/);
});

test("seed-user analyzer pauses when one method has two worse reports", () => {
  const rows = rowsFor(15, (index) => ({
    completed_reset: index < 10 ? "yes" : "no",
    after_check_result: index < 2 ? "worse" : index < 8 ? "more_choice" : "same",
    found_privacy_delete_export: index < 10 ? "yes" : "no",
    understands_nonclinical: index < 12 ? "yes" : "no",
    method_id: index < 2 ? "breath-orb" : "inner-cinema",
  }));

  const output = runAnalyzer(rows);
  assert.match(output, /Decision: NO_GO_FIX_PRODUCT/);
  assert.match(output, /breath-orb: 2/);
});

function rowsFor(count: number, overrides: (index: number) => Partial<Record<string, string>>) {
  return Array.from({ length: count }, (_, index) => row({ session_id: `s${index + 1}`, ...overrides(index) }));
}

function row(overrides: Partial<Record<string, string>> = {}) {
  return {
    session_id: "s1",
    surface: "ios",
    recruit_segment: "friend",
    scenario_category: "conflict",
    completed_reset: "yes",
    needed_help: "no",
    after_check_result: "more_choice",
    found_privacy_delete_export: "yes",
    would_use_again_week: "yes",
    understands_nonclinical: "yes",
    severe_safety_concern: "no",
    stopped_text_confusion: "no",
    interpreted_as_diagnosis_advice_therapy: "no",
    method_id: "inner-cinema",
    duration: "180",
    comprehension_score: "4",
    completion_score: "4",
    felt_agency_score: "4",
    safety_comfort_score: "4",
    return_intent_score: "4",
    trust_privacy_score: "4",
    first_confusion_point: "",
    non_sensitive_quote: "",
    followup_used_again: "maybe",
    followup_recommend: "maybe",
    ...overrides,
  };
}

function runAnalyzer(rows: Array<Record<string, string>>) {
  const dir = mkdtempSync(join(tmpdir(), "stillmind-seed-users-"));
  const file = join(dir, "seed-users.csv");
  writeFileSync(file, [header, ...rows.map(formatRow)].join("\n"), "utf8");

  try {
    return execFileSync(process.execPath, ["scripts/summarize-seed-users.mjs", file], {
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
