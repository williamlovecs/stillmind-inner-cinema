import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const checks = [];

const sourceBoundary = readText("docs/research/SOURCE_MATERIAL_BOUNDARY.md");
const corpusIndex = readJson("docs/research/source_corpus_index.json");
const evidence = readText("docs/research/EVIDENCE_AND_POSITIONING.md");
const methodSystem = readText("docs/product/METHOD_SYSTEM.md");
const productSpec = readText("docs/product/PRODUCT_SPEC.md");
const publicClaims = readText("scripts/check-public-claims.mjs");
const appStorePackage = readText("docs/app-store/SUBMISSION_PACKAGE.md");
const humanGates = readText("docs/HUMAN_GATES.md");

check("source material boundary document exists", () => Boolean(sourceBoundary));
check("source boundary documents the local 906-page corpus", () => hasAll(sourceBoundary, ["502 pages", "404 pages", "906-page source corpus"]));
check("source boundary separates source from evidence", () => hasAll(sourceBoundary, ["not public scientific evidence", "not public claims"]));
check("source boundary defines allowed product translation", () => hasAll(sourceBoundary, ["Allowed Translation", "Temporary inner movie", "Create distance before acting", "Explicit current-state routing"]));
check("source boundary excludes consciousness ranking", () => hasAll(sourceBoundary, ["consciousness scores", "consciousness levels", "spiritual rank"]));
check("source boundary excludes fixed ego labels", () => hasAll(sourceBoundary, ["fixed ego/personality labels", "羞耻型", "控制型", "受害者型"]));
check("source boundary excludes diagnosis and treatment claims", () => hasAll(sourceBoundary, ["diagnosis", "treatment", "medical/clinical claims"]));
check("source boundary constrains future RAG core", () => hasAll(sourceBoundary, ["Future Knowledge-Grounded Core", "Grounded, not authoritative", "No hidden diagnosis", "Bounded output"]));
check("source boundary requires claim guard before shipping", () => hasAll(sourceBoundary, ["npm run check:claims", "npm run check:source-boundary"]));

check("source corpus index exists", () => Boolean(corpusIndex));
check("source corpus index is internal metadata only", () => corpusIndex?.visibility === "internal-non-public" && corpusIndex.globalRules?.publicTranslationRule?.includes("plain language"));
check("source corpus index records the 906-page local corpus", () => {
  const sources = Array.isArray(corpusIndex?.sources) ? corpusIndex.sources : [];
  const totalPages = sources
    .filter((source) => typeof source.pageCount === "number")
    .reduce((sum, source) => sum + source.pageCount, 0);
  return totalPages === 906;
});
check("source corpus index blocks public quotation and ranking", () => {
  const text = JSON.stringify(corpusIndex);
  return hasAll(text, ["no-public-quotes", "consciousness score", "spiritual rank", "diagnosis"]);
});
check("source corpus index keeps RAG as later gated work", () => {
  const gates = Array.isArray(corpusIndex?.futureRagGates) ? corpusIndex.futureRagGates.join(" ") : "";
  return hasAll(gates, ["seed-user demand", "rights review", "public-claim and source-boundary guards"]);
});

check("evidence brief labels source teaching separately", () => hasAll(evidence, ["source teaching", "established evidence", "product interpretation", "validation hypothesis"]));
check("evidence brief excludes numeric/metaphysical source claims", () => hasAll(evidence, ["Numeric consciousness levels", "soul/energy mechanisms", "guaranteed outcomes are excluded"]));
check("evidence brief maps source ideas to product interpretations", () => hasAll(evidence, ["Source-to-Product Translation", "Product interpretation", "Claim boundary"]));

check("method system forbids spiritual ranking", () => hasAll(methodSystem, ["Progression Without Spiritual Ranking", "not levels of human worth", "consciousness score"]));
check("method system forbids ego-type recommendations", () => hasAll(methodSystem, ["No recommendation may cite", "ego type", "consciousness score"]));
check("product spec keeps legal/App Store disclosures aligned", () => hasAll(productSpec, ["Legal and App Store disclosures match actual behavior", "real iOS build"]));

check("public claim guard blocks metaphysical ranking terms", () => hasAll(publicClaims, ["metaphysical-ranking-zh", "意识等级", "意识强度分数", "consciousness score"]));
check("App Store package forbids awakening/consciousness claims", () => hasAll(appStorePackage, ["awakening guarantees", "consciousness ranking", "trauma treatment"]));
check("human gates require App Store copy to avoid consciousness ranking", () => hasAll(humanGates, ["App Store metadata", "awakening guarantee", "consciousness-ranking claim"]));

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.label}`);
}

if (failed.length > 0) {
  console.error(`\nSource-boundary check failed: ${failed.length} gate(s) missing.`);
  process.exit(1);
}

console.log("\nSource-boundary guard passed. Future source-grounded RAG remains a later, rights-reviewed v2 gate.");

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
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function hasAll(text, needles) {
  return needles.every((needle) => typeof needle === "string" && needle.length > 0 && text.includes(needle));
}
