import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const roots = ["src/app", "src/components", "mobile/src", "packages/content/src", "packages/domain/src", "docs/app-store"];
const extensions = new Set([".md", ".tsx", ".ts", ".json"]);
const rules = [
  { label: "clinical-cure-zh", reason: "Do not claim to cure, treat, or heal clinical conditions.", pattern: /(治愈|治疗|疗愈).{0,12}(抑郁|焦虑|创伤|人格障碍|心理疾病|精神疾病)|(抑郁|焦虑|创伤|人格障碍|心理疾病|精神疾病).{0,12}(治愈|治疗|疗愈)/ },
  { label: "diagnosis-zh", reason: "Do not claim to diagnose the user.", pattern: /(诊断出|诊断为|帮你诊断|AI\s*诊断|识别出你有|判断你有).{0,20}(抑郁|焦虑|创伤|人格|疾病|障碍)?/ },
  { label: "guaranteed-outcome-zh", reason: "Do not promise guaranteed emotional, awakening, or healing outcomes.", pattern: /(保证|确保|一定|永久|彻底|100%|百分百).{0,16}(平静|觉醒|清醒|治愈|消除|摆脱|疗愈|改变)/ },
  { label: "metaphysical-ranking-zh", reason: "Keep source philosophy out of public product claims.", pattern: /(意识等级|灵魂等级|意识强度分数|意识强度排名|能量频率|量子疗愈|量子意识)/ },
  { label: "identity-label-zh", reason: "Do not label the user as a fixed type.", pattern: /(你是|你属于).{0,12}(羞耻型|受害者型|控制型|人格类型|人格)/ },
  { label: "replacement-care-zh", reason: "Do not claim the product can replace medical, therapy, or crisis support.", pattern: /(可以|能够|能).{0,6}(替代|代替).{0,8}(医疗|心理咨询|心理治疗|急救|危机)/ },
  { label: "clinical-cure-en", reason: "Do not claim to diagnose, treat, or cure clinical conditions.", pattern: /(diagnose|treat|cure|heal).{0,24}(anxiety|depression|trauma|mental illness|personality disorder)/i },
  { label: "guaranteed-outcome-en", reason: "Do not promise guaranteed emotional, awakening, or healing outcomes.", pattern: /(guarantee|guaranteed|permanently|100%).{0,30}(calm|healing|awakening|cure|eliminate)/i },
  { label: "metaphysical-ranking-en", reason: "Avoid public ranking or pseudo-scientific metaphysical claims.", pattern: /(consciousness score|consciousness ranking|soul level|energy frequency|quantum healing)/i },
];

/** Lexical guard, not a scientific, safety or rights review. A disclaimer elsewhere grants no exemption. */
export function analyzeClaimText(text) {
  const findings = [];
  const clauses = text.split(/[。！？;；\n]|(?=但是|但我们|然而|可是|\bbut\b|\bhowever\b)/i);
  for (const clause of clauses) {
    for (const rule of rules) {
      for (const match of clause.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags + "g"))) {
        const prefix = clause.slice(0, match.index);
        const locallyNegated = /(不将|不提供|不做|不替代|不能|不可|不要声称|不得声称|不宣称|不承诺|禁止|没有|Do not claim|Do not promise|does not|do not|not provide|not replace|no diagnosis|no treatment|no |avoid |never ).{0,40}$/i.test(prefix);
        if (!locallyNegated) findings.push({ rule: rule.label, reason: rule.reason, text: clause.trim() });
      }
    }
  }
  return findings;
}
/** Read TS/TSX text, not source-code lines: adjacent JSX elements must not exempt one another. */
export function textFragments(source, file) {
  if (!/\.tsx?$/.test(file)) return source.split(/\r?\n/).map((text, i) => ({ text, line: i + 1 }));
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const fragments = [];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)
      || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      fragments.push({ text: node.text, line: parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1 });
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed); return fragments;
}
function run() {
  const findings = [];
  function walk(path) {
    const stats = statSync(path, { throwIfNoEntry: false });
    if (!stats) return;
    if (stats.isDirectory()) {
      for (const entry of readdirSync(path)) {
        if (["node_modules", ".next", ".expo"].includes(entry)) continue;
        walk(join(path, entry));
      }
    } else if (stats.isFile() && extensions.has(extname(path))) {
      const file = relative(process.cwd(), path).replaceAll("\\", "/");
      for (const fragment of textFragments(readFileSync(path, "utf8"), file)) {
        for (const finding of analyzeClaimText(fragment.text)) findings.push({ ...finding, file, line: fragment.line });
      }
    }
  }
  roots.forEach(walk);
  if (findings.length) {
    console.error("Public-claim guard failed. Human review required:");
    for (const finding of findings) console.error(`${finding.file}:${finding.line}: [${finding.rule}] ${finding.reason}\n  ${finding.text}`);
    process.exitCode = 1;
  } else console.log(`Public-claim guard passed across ${roots.join(", ")}. This is a lexical check, not safety/rights certification.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
