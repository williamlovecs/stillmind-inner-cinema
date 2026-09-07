import assert from "node:assert/strict";
import test from "node:test";
import { analyzeClaimText, textFragments } from "../scripts/check-public-claims.mjs";

test("a disclaimer cannot exempt a guaranteed claim in another sentence", () => {
  assert.equal(analyzeClaimText("不是医疗工具。保证永久平静。").some(x => x.rule === "guaranteed-outcome-zh"), true);
});
test("neighboring JSX on one source line has independent claims", () => {
  const source = 'const component = <div><p>不做诊断。</p><p>保证永久平静。</p></div>;';
  const findings = textFragments(source, "example.tsx").flatMap(x => analyzeClaimText(x.text));
  assert.equal(findings.some(x => x.rule === "guaranteed-outcome-zh"), true);
});
test("content-package string literals are parsed as user-facing candidates", () => {
  const source = 'export const message = { instruction: "保证彻底消除焦虑" };';
  assert.equal(textFragments(source, "packages/content/src/practice.ts").flatMap(x => analyzeClaimText(x.text)).length > 0, true);
});
test("local explicit prohibitions remain allowed", () => {
  for (const text of ["不提供治疗焦虑的服务。", "Do not claim to cure depression.", "不要声称保证永久平静。", "不做意识等级排名。"]) assert.deepEqual(analyzeClaimText(text), [], text);
});
test("ordinary instructions are not outcome evidence or prohibited claims", () => {
  assert.deepEqual(analyzeClaimText("按实际感受填写。可以停止，也可以没有变化。"), []);
});
