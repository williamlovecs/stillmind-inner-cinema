import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const roots = ["src/app", "src/components", "mobile/src", "docs/app-store"];
const extensions = new Set([".md", ".tsx", ".ts", ".json"]);

const rules = [
  {
    label: "clinical-cure-zh",
    reason: "Do not claim to cure, treat, or heal clinical conditions.",
    pattern: /(治愈|治疗|疗愈).{0,12}(抑郁|焦虑|创伤|人格障碍|心理疾病|精神疾病)|(抑郁|焦虑|创伤|人格障碍|心理疾病|精神疾病).{0,12}(治愈|治疗|疗愈)/,
  },
  {
    label: "diagnosis-zh",
    reason: "Do not claim to diagnose the user.",
    pattern: /(诊断出|诊断为|帮你诊断|AI\s*诊断|识别出你有|判断你有).{0,20}(抑郁|焦虑|创伤|人格|疾病|障碍)?/,
  },
  {
    label: "guaranteed-outcome-zh",
    reason: "Do not promise guaranteed emotional, awakening, or healing outcomes.",
    pattern: /(保证|确保|一定|永久|彻底|100%|百分百).{0,16}(平静|觉醒|清醒|治愈|消除|摆脱|疗愈|改变)/,
  },
  {
    label: "metaphysical-ranking-zh",
    reason: "Keep source philosophy out of public product claims.",
    pattern: /(意识等级|灵魂等级|意识强度分数|意识强度排名|能量频率|量子疗愈|量子意识)/,
  },
  {
    label: "identity-label-zh",
    reason: "Do not label the user as a fixed type.",
    pattern: /(你是|你属于).{0,12}(羞耻型|受害者型|控制型|人格类型|人格)/,
  },
  {
    label: "replacement-care-zh",
    reason: "Do not claim the product can replace medical, therapy, or crisis support.",
    pattern: /(可以|能够|能).{0,6}(替代|代替).{0,8}(医疗|心理咨询|心理治疗|急救|危机)/,
  },
  {
    label: "clinical-cure-en",
    reason: "Do not claim to diagnose, treat, or cure clinical conditions.",
    pattern: /(diagnose|treat|cure|heal).{0,24}(anxiety|depression|trauma|mental illness|personality disorder)/i,
  },
  {
    label: "guaranteed-outcome-en",
    reason: "Do not promise guaranteed emotional, awakening, or healing outcomes.",
    pattern: /(guarantee|guaranteed|permanently|100%).{0,30}(calm|healing|awakening|cure|eliminate)/i,
  },
  {
    label: "metaphysical-ranking-en",
    reason: "Avoid public ranking or pseudo-scientific metaphysical claims.",
    pattern: /(consciousness score|consciousness ranking|soul level|energy frequency|quantum healing)/i,
  },
];

const findings = [];

for (const root of roots) {
  walk(root);
}

if (findings.length > 0) {
  console.error("Public-claim guard failed. Review these lines before release:\n");
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line}: [${finding.rule}] ${finding.reason}`);
    console.error(`  ${finding.text.trim()}\n`);
  }
  process.exit(1);
}

console.log(`Public-claim guard passed across ${roots.join(", ")}.`);

function walk(path) {
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats) return;

  if (stats.isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (entry === "node_modules" || entry === ".next" || entry === ".expo") continue;
      walk(join(path, entry));
    }
    return;
  }

  if (!stats.isFile() || !extensions.has(extname(path))) return;

  const file = relative(process.cwd(), path).replaceAll("\\", "/");
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (isBoundaryOrProhibition(line)) continue;

    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        findings.push({
          file,
          line: index + 1,
          rule: rule.label,
          reason: rule.reason,
          text: line,
        });
      }
    }
  }
}

function isBoundaryOrProhibition(line) {
  return /(不提供|不做|不替代|不是|不能替代|不要声称|不得声称|禁止|Do not claim|Do not promise|does not provide|does not diagnose|does not treat|not provide|not replace|no diagnosis|no treatment)/i.test(line);
}
