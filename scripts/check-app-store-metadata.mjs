import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const checks = [];
const warnings = [];

const metadataPath = "docs/app-store/METADATA_ZH.md";
const packagePath = "docs/app-store/SUBMISSION_PACKAGE.md";
const runbookPath = "docs/app-store/APP_STORE_SUBMISSION.md";
const appConfigPath = "mobile/app.json";

const metadata = readText(metadataPath);
const submissionPackage = readText(packagePath);
const runbook = readText(runbookPath);
const app = readJson(appConfigPath)?.expo;

check("App Store metadata draft exists", () => Boolean(metadata));
check("App Store submission package exists", () => Boolean(submissionPackage));
check("App Store runbook exists", () => Boolean(runbook));
check("Expo app config exists", () => Boolean(app));

const name = section(metadata, "Name");
const subtitle = section(metadata, "Subtitle");
const promotionalText = section(metadata, "Promotional Text");
const description = section(metadata, "Description");
const keywords = section(metadata, "Keywords");
const category = section(metadata, "Category");
const screenshotStory = section(metadata, "Screenshot Story");
const whatsNew = section(metadata, "What's New (First Release)");

check("metadata has app name", () => name === app?.name);
check("metadata name fits App Store limit", () => charCount(name) > 0 && charCount(name) <= 30);
check("metadata subtitle is present and under 30 chars", () => charCount(subtitle) > 0 && charCount(subtitle) <= 30);
check("metadata promotional text is present and under 170 chars", () => charCount(promotionalText) > 0 && charCount(promotionalText) <= 170);
check("metadata description is substantive", () => charCount(description) >= 300 && charCount(description) <= 4000);
check("metadata keywords are present and under 100 chars", () => charCount(keywords) > 0 && charCount(keywords) <= 100);
check("metadata category hypothesis exists", () => /Health & Fitness/.test(category) && /Lifestyle/.test(category));
check("metadata screenshot story has at least 5 moments", () => countNumberedItems(screenshotStory) >= 5);
check("metadata what's-new text is present", () => charCount(whatsNew) > 0 && charCount(whatsNew) <= 4000);

const baseUrl = app?.extra?.apiBaseUrl;
const supportUrl = `${baseUrl}/support`;
const privacyUrl = `${baseUrl}/privacy`;
const termsUrl = `${baseUrl}/terms`;

check("bundle identifier is documented", () => hasAll(submissionPackage, [app?.ios?.bundleIdentifier]));
check("support URL matches mobile production URL", () => hasAll(submissionPackage + runbook, [supportUrl]));
check("privacy URL matches mobile production URL", () => hasAll(submissionPackage + runbook, [privacyUrl]));
check("terms URL is documented in runbook", () => hasAll(runbook, [termsUrl]));
check("review notes mention no account/payment/microphone/AI dependency", () => hasAll(submissionPackage, ["No account", "microphone", "payment", "AI"]));
check("privacy nutrition draft exists", () => hasAll(submissionPackage, ["Privacy Nutrition Label Draft", "Tracking", "Data Linked to the User", "Data Not Linked to the User"]));
check("screenshot set requires real shipping UI", () => hasAll(submissionPackage, ["Screenshot Set", "real shipping UI"]));
check("pre-submit checklist includes claim guard", () => hasAll(submissionPackage, ["npm run check:claims", "diagnosis", "treatment"]));
check("runbook includes EAS build and submit commands", () => hasAll(runbook, ["eas-cli build --platform ios", "eas-cli submit --platform ios"]));
check("runbook lists real-device test matrix", () => hasAll(runbook, ["Real-Device Test Matrix", "Privacy and terms links", "Public support link"]));

check("iOS icon path is configured", () => typeof app?.ios?.icon === "string" && fileExists(join("mobile", app.ios.icon.replace(/^\.\//, ""))));
check("iOS icon is a 1024 PNG", () => pngSize(join("mobile", app?.ios?.icon?.replace(/^\.\//, "") ?? ""), 1024, 1024));
check("tablet support is disabled in app config", () => app?.ios?.supportsTablet === false);
check("notification usage string is present", () => typeof app?.ios?.infoPlist?.NSUserNotificationsUsageDescription === "string" && app.ios.infoPlist.NSUserNotificationsUsageDescription.length > 10);
check("production API base URL is configured", () => baseUrl === "https://stillmind-inner-cinema.vercel.app");

if (/hello@stillmind\.app/.test(submissionPackage + runbook + metadata)) {
  warnings.push({
    label: "support mailbox placeholder",
    detail: "Replace hello@stillmind.app or keep support limited to the public support URL before broad App Store launch.",
  });
}

if (!/Private support mailbox is monitored/.test(submissionPackage)) {
  warnings.push({
    label: "support process",
    detail: "Submission package should keep the private support mailbox as a human gate until it is monitored.",
  });
}

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.label}`);
}

if (warnings.length > 0) {
  console.log("\nApp Store metadata warnings:");
  for (const warning of warnings) console.log(`WARN ${warning.label}: ${warning.detail}`);
}

if (failed.length > 0) {
  console.error(`\nApp Store metadata check failed: ${failed.length} gate(s) missing.`);
  process.exit(1);
}

console.log("\nApp Store metadata guard passed. Human App Store Connect and legal gates still remain.");

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
  if (!fileExists(path)) return "";
  return readFileSync(join(process.cwd(), path), "utf8");
}

function readJson(path) {
  if (!fileExists(path)) return null;
  return JSON.parse(readText(path));
}

function fileExists(path) {
  return existsSync(join(process.cwd(), path));
}

function section(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return "";

  const collected = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s+/.test(line)) break;
    collected.push(line);
  }
  return collected.join("\n").trim();
}

function charCount(text) {
  return Array.from(text.trim()).length;
}

function countNumberedItems(text) {
  return text.split(/\r?\n/).filter((line) => /^\d+\.\s+/.test(line)).length;
}

function hasAll(text, needles) {
  return needles.every((needle) => typeof needle === "string" && needle.length > 0 && text.includes(needle));
}

function pngSize(path, expectedWidth, expectedHeight) {
  if (!path || !fileExists(path)) return false;
  const fullPath = join(process.cwd(), path);
  if (statSync(fullPath).size < 1024) return false;
  const buffer = readFileSync(fullPath);
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return false;
  return buffer.readUInt32BE(16) === expectedWidth && buffer.readUInt32BE(20) === expectedHeight;
}
