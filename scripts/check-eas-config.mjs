import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const checks = [];
const warnings = [];

const eas = readJson("mobile/eas.json");
const app = readJson("mobile/app.json")?.expo;
const mobilePkg = readJson("mobile/package.json");
const runbook = readText("docs/app-store/APP_STORE_SUBMISSION.md");
const humanGates = readText("docs/HUMAN_GATES.md");

check("mobile/eas.json exists", () => Boolean(eas));
check("EAS CLI version floor is pinned", () => typeof eas?.cli?.version === "string" && eas.cli.version.includes("16.0.0"));
check("EAS app version source is remote", () => eas?.cli?.appVersionSource === "remote");

check("development profile exists", () => Boolean(eas?.build?.development));
check("development profile uses dev client", () => eas?.build?.development?.developmentClient === true);
check("development profile is internal", () => eas?.build?.development?.distribution === "internal");
check("development profile pins Node 22.14.0", () => eas?.build?.development?.node === "22.14.0");

check("preview profile exists", () => Boolean(eas?.build?.preview));
check("preview profile is internal distribution", () => eas?.build?.preview?.distribution === "internal");
check("preview profile pins Node 22.14.0", () => eas?.build?.preview?.node === "22.14.0");

check("production profile exists", () => Boolean(eas?.build?.production));
check("production profile auto-increments", () => eas?.build?.production?.autoIncrement === true);
check("production profile pins Node 22.14.0", () => eas?.build?.production?.node === "22.14.0");
check("production profile is not an internal/dev-client build", () => eas?.build?.production?.distribution !== "internal" && eas?.build?.production?.developmentClient !== true);

check("production submit profile exists", () => Boolean(eas?.submit?.production));
check("Expo app name exists", () => app?.name === "StillMind");
check("iOS bundle identifier is configured", () => app?.ios?.bundleIdentifier === "com.stillmind.innercinema");
check("iOS URL scheme is configured", () => app?.scheme === "stillmind");
check("mobile app is Expo Router based", () => mobilePkg?.main === "expo-router/entry" && hasDependency(mobilePkg, "expo-router"));
check("mobile project includes Expo dev client", () => hasDependency(mobilePkg, "expo-dev-client"));
check("runbook documents local EAS config guard", () => runbook.includes("npm run check:eas"));
check("runbook documents EAS login/init/build/submit", () => hasAll(runbook, ["eas-cli login", "eas-cli project:init", "eas-cli build --platform ios --profile preview", "eas-cli submit --platform ios --profile production"]));
check("human gates track EAS login and signed build", () => hasAll(humanGates, ["Expo/EAS login and project link", "Signing and preview build", "TestFlight review"]));

if (!app?.extra?.eas?.projectId) {
  warnings.push({
    label: "EAS project not linked",
    detail: "Run `npx eas-cli project:init` after Expo login; this should add expo.extra.eas.projectId or link the project remotely.",
  });
}

if (!eas?.submit?.production?.ios?.appleId && Object.keys(eas?.submit?.production ?? {}).length === 0) {
  warnings.push({
    label: "submit profile has no Apple account details",
    detail: "Keep this empty until App Store Connect credentials are available; EAS will prompt or use credentials configured in the Expo account.",
  });
}

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.label}`);
}

if (warnings.length > 0) {
  console.log("\nEAS distribution warnings:");
  for (const warning of warnings) console.log(`WARN ${warning.label}: ${warning.detail}`);
}

if (failed.length > 0) {
  console.error(`\nEAS config check failed: ${failed.length} gate(s) missing.`);
  process.exit(1);
}

console.log("\nEAS config guard passed. Login, signing, TestFlight, and App Store review remain external gates.");

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

function hasDependency(packageJson, name) {
  return Boolean(packageJson?.dependencies?.[name] ?? packageJson?.devDependencies?.[name]);
}

function hasAll(text, needles) {
  return needles.every((needle) => typeof needle === "string" && needle.length > 0 && text.includes(needle));
}
