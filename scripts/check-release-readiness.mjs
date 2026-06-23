import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const checks = [];
const warnings = [];

check("root package.json exists", () => fileExists("package.json"));
const pkg = readJson("package.json");
const app = readJson("mobile/app.json")?.expo;

check("verify:release script exists", () => scriptIncludes(pkg, "verify:release", "verify"));
check("verify script runs public-claim guard", () => scriptIncludes(pkg, "verify", "check:claims"));
check("verify:release exports iOS bundle", () => scriptIncludes(pkg, "verify:release", "build:mobile:ios"));
check("verify:release exports mobile web bundle", () => scriptIncludes(pkg, "verify:release", "build:mobile:web"));
check("GitHub CI runs verify:release", () => fileContains(".github/workflows/ci.yml", "npm run verify:release"));
check("CI pins Node 22.14.0", () => fileContains(".github/workflows/ci.yml", "22.14.0"));

check("support page route exists", () => fileExists("src/app/support/page.tsx"));
check("privacy page route exists", () => fileExists("src/app/privacy/page.tsx"));
check("terms page route exists", () => fileExists("src/app/terms/page.tsx"));
check("support page links to issue template chooser", () => fileContains("src/app/support/page.tsx", "issues/new/choose"));
check("support page warns GitHub issues are public", () => fileContains("src/app/support/page.tsx", "GitHub issue 是公开的"));

check("SUPPORT.md exists", () => fileExists("SUPPORT.md"));
check("blank GitHub issues are disabled", () => fileContains(".github/ISSUE_TEMPLATE/config.yml", "blank_issues_enabled: false"));
check("bug issue template exists", () => fileExists(".github/ISSUE_TEMPLATE/bug_report.yml"));
check("experience issue template exists", () => fileExists(".github/ISSUE_TEMPLATE/experience_feedback.yml"));
check("safety issue template exists", () => fileExists(".github/ISSUE_TEMPLATE/safety_boundary_feedback.yml"));
check("issue templates include privacy checkbox", () => fileContains(".github/ISSUE_TEMPLATE/bug_report.yml", "Privacy check") && fileContains(".github/ISSUE_TEMPLATE/safety_boundary_feedback.yml", "Privacy and crisis check"));

check("App Store submission package exists", () => fileExists("docs/app-store/SUBMISSION_PACKAGE.md"));
check("submission package includes review notes", () => fileContains("docs/app-store/SUBMISSION_PACKAGE.md", "App Review Notes"));
check("submission package includes privacy nutrition draft", () => fileContains("docs/app-store/SUBMISSION_PACKAGE.md", "Privacy Nutrition Label Draft"));
check("submission package includes screenshot story", () => fileContains("docs/app-store/SUBMISSION_PACKAGE.md", "Screenshot Set"));
check("human gates document exists", () => fileExists("docs/HUMAN_GATES.md"));
check("seed-user protocol exists", () => fileExists("docs/research/SEED_USER_PROTOCOL.md"));
check("GTM links seed-user protocol", () => fileContains("docs/business/GTM_AND_BUSINESS.md", "SEED_USER_PROTOCOL.md"));
check("measurement plan links seed-user protocol", () => fileContains("docs/analytics/MEASUREMENT_PLAN.md", "SEED_USER_PROTOCOL.md"));

check("Expo app config exists", () => Boolean(app));
check("Expo app name is StillMind", () => app?.name === "StillMind");
check("Expo bundle identifier is set", () => app?.ios?.bundleIdentifier === "com.stillmind.innercinema");
check("Expo URL scheme is set", () => app?.scheme === "stillmind");
check("Expo iOS tablet support is disabled", () => app?.ios?.supportsTablet === false);
check("Expo API base URL points at production web app", () => app?.extra?.apiBaseUrl === "https://stillmind-inner-cinema.vercel.app");
check("Expo notification usage string is present", () => typeof app?.ios?.infoPlist?.NSUserNotificationsUsageDescription === "string" && app.ios.infoPlist.NSUserNotificationsUsageDescription.length > 10);
check("Expo SQLite plugin is configured", () => arrayIncludes(app?.plugins, "expo-sqlite"));
check("Expo sharing plugin is configured", () => arrayIncludes(app?.plugins, "expo-sharing"));
check("Expo notifications plugin is configured", () => arrayIncludes(app?.plugins, "expo-notifications"));

check("iOS app icon exists", () => fileExists("mobile/assets/images/stillmind-icon.png"));
check("iOS app icon is 1024x1024 PNG", () => pngSize("mobile/assets/images/stillmind-icon.png", 1024, 1024));
check("mobile Profile links support URL", () => fileContains("mobile/src/app/(tabs)/profile.tsx", "https://stillmind-inner-cinema.vercel.app/support"));
check("mobile Profile links privacy URL", () => fileContains("mobile/src/app/(tabs)/profile.tsx", "https://stillmind-inner-cinema.vercel.app/privacy"));
check("mobile Profile links terms URL", () => fileContains("mobile/src/app/(tabs)/profile.tsx", "https://stillmind-inner-cinema.vercel.app/terms"));
check("mobile Profile exposes export", () => fileContains("mobile/src/app/(tabs)/profile.tsx", "导出本机数据"));
check("mobile Profile exposes delete all", () => fileContains("mobile/src/app/(tabs)/profile.tsx", "清除所有本机数据"));

check("Web API has high-risk boundary", () => fileContains("src/app/api/cinema/route.ts", "containsHighRiskLanguage"));
check("Web support boundary exists", () => fileContains("src/app/page.tsx", "SupportPanel"));
check("public claim guard exists", () => fileExists("scripts/check-public-claims.mjs"));

warnIfMissing("EAS login is external", "Run `npx eas-cli whoami` from mobile/ after Expo credentials are available.");
warnIfMissing("Apple Developer is external", "Confirm paid Apple Developer membership and App Store Connect app record manually.");
warnIfMissing("Real-device QA is external", "Install an EAS preview/TestFlight build on a real iPhone and run the matrix in docs/app-store/APP_STORE_SUBMISSION.md.");
warnIfMissing("Legal review is external", "Have privacy, consumer, subscription, wellness, and optional-AI disclosures reviewed before broad launch.");
warnIfMissing("Seed-user results are external", "Run docs/research/SEED_USER_PROTOCOL.md with 15 users and summarize the go/no-go result.");

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.label}`);
}

if (warnings.length > 0) {
  console.log("\nHuman/external gates still open:");
  for (const warning of warnings) console.log(`WARN ${warning.label}: ${warning.detail}`);
}

if (failed.length > 0) {
  console.error(`\nRelease readiness failed: ${failed.length} engineering gate(s) missing.`);
  process.exit(1);
}

console.log("\nRelease readiness engineering gates passed. External gates remain human-owned.");

function check(label, fn) {
  let ok = false;
  try {
    ok = Boolean(fn());
  } catch {
    ok = false;
  }
  checks.push({ label, ok });
}

function warnIfMissing(label, detail) {
  warnings.push({ label, detail });
}

function fileExists(path) {
  return existsSync(join(process.cwd(), path));
}

function fileContains(path, needle) {
  if (!fileExists(path)) return false;
  return readFileSync(join(process.cwd(), path), "utf8").includes(needle);
}

function readJson(path) {
  if (!fileExists(path)) return null;
  return JSON.parse(readFileSync(join(process.cwd(), path), "utf8"));
}

function scriptIncludes(packageJson, name, fragment) {
  return typeof packageJson?.scripts?.[name] === "string" && packageJson.scripts[name].includes(fragment);
}

function arrayIncludes(items, value) {
  return Array.isArray(items) && items.some((item) => item === value || (Array.isArray(item) && item[0] === value));
}

function pngSize(path, expectedWidth, expectedHeight) {
  if (!fileExists(path)) return false;
  const fullPath = join(process.cwd(), path);
  if (statSync(fullPath).size < 1024) return false;
  const buffer = readFileSync(fullPath);
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return false;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return width === expectedWidth && height === expectedHeight;
}
