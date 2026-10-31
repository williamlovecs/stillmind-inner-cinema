import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const workspace = String.raw`C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\02-42-11-0872a2fc`;
const product = join(workspace, "stillmind-inner-cinema-2");
const site = join(workspace, "stillmind-experience-site");
const productSha = "c32d423c4eaa5e3f263d1679bb78eee0fd181fbd";
const siteSha = "0b91f3fb0a9d67f16be097f824954b2e793e395e";
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const logs = join(product, "artifacts", "experience-v2", "logs");
const summaries = [];
for (const platform of ["web", "native"]) {
  for (const batch of ["A", "B", "C", "D"]) summaries.push(join(product, "artifacts", "experience-v2", platform, `batch-${batch}`, "summary.json"));
  summaries.push(join(product, "artifacts", "experience-v2", platform, "product-paths", "summary.json"));
}
summaries.push(join(product, "artifacts", "web-smoke", "result.json"));
summaries.push(join(product, "artifacts", "web-smoke", "round2", "result.json"));
summaries.push(join(product, "artifacts", "native-web-smoke", "summary.json"));
for (const path of summaries) {
  const result = read(path);
  assert.equal(result.complete, true, path);
  assert.equal(result.testedGitSha, productSha, path);
  for (const field of ["failures", "externalRequests", "blockedExternalRequests", "browserErrors"]) assert.deepEqual(result[field] ?? [], [], `${path}: ${field}`);
}
const testLog = readFileSync(join(logs, "final-test.log"), "utf8");
const testCount = [...testLog.matchAll(/^# pass (\d+)$/gm)].reduce((sum, match) => sum + Number(match[1]), 0);
assert.equal(testCount, 148);
assert.equal(/^# fail [1-9]/m.test(testLog), false);
assert.match(readFileSync(join(logs, "final-doctor.log"), "utf8"), /21\/21 checks passed/);
const audit = read(join(logs, "final-audit.json"));
assert.deepEqual(audit.metadata.vulnerabilities, { info: 0, low: 5, moderate: 0, high: 6, critical: 0, total: 11 });
const siteSummary = read(join(site, "artifacts", "site", "summary.json"));
assert.equal(siteSummary.complete, true);
assert.equal(siteSummary.testedGitSha, siteSha);
assert.deepEqual(siteSummary.failures, []);
assert.deepEqual(siteSummary.externalRequests, []);
assert.equal(siteSummary.passed.length, 5);
const siteAudit = read(join(site, "artifacts", "site-audit-final.json"));
assert.equal(siteAudit.metadata.vulnerabilities.total, 0);
const report = {
  complete: true,
  productSha,
  siteSha,
  productTests: testCount,
  verifiedProductBrowserSummaries: summaries.length,
  productBrowserFailures: 0,
  productExternalRequests: 0,
  expoDoctor: "21/21",
  productAudit: audit.metadata.vulnerabilities,
  siteBrowserGroups: siteSummary.passed.length,
  siteAudit: siteAudit.metadata.vulnerabilities,
  scope: "Local production builds and headless Chrome with synthetic inputs; no physical-device, public-network, efficacy, signing or release approval"
};
writeFileSync(join(logs, "final-evidence-verification.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
