import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const header =
  "interview_id,surface,recruit_segment,prior_use_count,completed_reset,recent_usefulness,paid_offer_shown,preferred_offer,selected_price_cny,price_reaction,purchase_intent_score,would_attempt_purchase,main_value_reason,main_objection,expects_therapy_or_crisis_help,privacy_concern,needs_human_coach,non_sensitive_quote,followup_permission";
const fields = header.split(",");

test("payment interview analyzer handles an empty template", () => {
  const output = runAnalyzer([]);
  assert.match(output, /Payment interview summary: no interview rows yet/);
});

test("payment interview analyzer returns GO for enough high-intent interviews", () => {
  const rows = rowsFor(5, (index) => ({
    purchase_intent_score: index < 3 ? "4" : "3",
    would_attempt_purchase: index < 2 ? "yes" : "maybe",
    selected_price_cny: index < 3 ? "198" : "99",
  }));

  const output = runAnalyzer(rows);
  assert.match(output, /Rows: 5/);
  assert.match(output, /Decision: GO_TEST_PAID_OFFER/);
});

test("payment interview analyzer blocks therapy or trust-risk demand", () => {
  const rows = rowsFor(5, (index) => ({
    purchase_intent_score: index < 4 ? "5" : "4",
    would_attempt_purchase: index < 3 ? "yes" : "maybe",
    expects_therapy_or_crisis_help: index === 0 ? "yes" : "no",
  }));

  const output = runAnalyzer(rows);
  assert.match(output, /Decision: NO_GO_FIX_SAFETY_OR_TRUST/);
  assert.match(output, /Therapy\/crisis expectation: 1/);
});

test("payment interview analyzer asks for offer iteration when intent is weak", () => {
  const rows = rowsFor(5, () => ({
    purchase_intent_score: "2",
    would_attempt_purchase: "no",
    main_objection: "unclear value",
  }));

  const output = runAnalyzer(rows);
  assert.match(output, /Decision: NO_GO_FIX_OFFER_OR_POSITIONING/);
});

test("payment interview analyzer ignores unqualified high-intent rows for paid signal", () => {
  const qualifiedLowIntent = rowsFor(5, (index) => ({
    interview_id: `q${index + 1}`,
    purchase_intent_score: "2",
    would_attempt_purchase: "no",
  }));
  const unqualifiedHighIntent = rowsFor(3, (index) => ({
    interview_id: `u${index + 1}`,
    prior_use_count: "0",
    completed_reset: "no",
    purchase_intent_score: "5",
    would_attempt_purchase: "yes",
  }));

  const output = runAnalyzer([...qualifiedLowIntent, ...unqualifiedHighIntent]);
  assert.match(output, /Decision: NO_GO_FIX_OFFER_OR_POSITIONING/);
  assert.match(output, /Purchase intent score 4-5: 0/);
});
test("payment interview analyzer requires five qualified interviews", () => {
  const rows = rowsFor(4, () => ({
    purchase_intent_score: "5",
    would_attempt_purchase: "yes",
  }));

  const output = runAnalyzer(rows);
  assert.match(output, /Decision: INSUFFICIENT_PAYMENT_DATA/);
});

function rowsFor(count: number, overrides: (index: number) => Partial<Record<string, string>>) {
  return Array.from({ length: count }, (_, index) => row({ interview_id: `p${index + 1}`, ...overrides(index) }));
}

function row(overrides: Partial<Record<string, string>> = {}) {
  return {
    interview_id: "p1",
    surface: "ios",
    recruit_segment: "seed_user",
    prior_use_count: "2",
    completed_reset: "yes",
    recent_usefulness: "more_choice",
    paid_offer_shown: "plus,path,cohort",
    preferred_offer: "21-day reset path",
    selected_price_cny: "99",
    price_reaction: "fair",
    purchase_intent_score: "4",
    would_attempt_purchase: "yes",
    main_value_reason: "helps before replying",
    main_objection: "none",
    expects_therapy_or_crisis_help: "no",
    privacy_concern: "no",
    needs_human_coach: "no",
    non_sensitive_quote: "it gave me a pause",
    followup_permission: "yes",
    ...overrides,
  };
}

function runAnalyzer(rows: Array<Record<string, string>>) {
  const dir = mkdtempSync(join(tmpdir(), "stillmind-payment-interviews-"));
  const file = join(dir, "payment-interviews.csv");
  writeFileSync(file, [header, ...rows.map(formatRow)].join("\n"), "utf8");

  try {
    return execFileSync(process.execPath, ["scripts/summarize-payment-interviews.mjs", file], {
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
