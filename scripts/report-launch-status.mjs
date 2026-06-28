import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const jsonMode = process.argv.includes("--json");
const liveMode = process.argv.includes("--live");
const npxCommand = process.platform === "win32" ? "cmd.exe" : "npx";
const npxPrefix = process.platform === "win32" ? ["/c", "npx"] : [];

const pkg = readJson("package.json");
const app = readJson("mobile/app.json")?.expo;

const sections = [
  section("Web / Vercel MVP", [
    file("Home route", "src/app/page.tsx"),
    file("Cinema API", "src/app/api/cinema/route.ts"),
    file("Privacy page", "src/app/privacy/page.tsx"),
    file("Terms page", "src/app/terms/page.tsx"),
    file("Support page", "src/app/support/page.tsx"),
    file("Seed tester handoff", "src/app/support/seed-test/page.tsx"),
    script("Production build", "build"),
    script("Public claim guard", "check:claims"),
    script("Release verification chain", "verify:release"),
  ]),
  section("iOS / App Store Engineering", [
    file("Expo app config", "mobile/app.json"),
    file("EAS config", "mobile/eas.json"),
    value("Bundle identifier", app?.ios?.bundleIdentifier === "com.stillmind.innercinema"),
    value("Production API URL", app?.extra?.apiBaseUrl === "https://stillmind-inner-cinema.vercel.app"),
    value("Tablet disabled", app?.ios?.supportsTablet === false),
    file("1024 icon", "mobile/assets/images/stillmind-icon.png"),
    script("EAS config guard", "check:eas"),
    script("App Store metadata guard", "check:app-store"),
    script("iOS export script", "build:mobile:ios"),
    file("App Store runbook", "docs/app-store/APP_STORE_SUBMISSION.md"),
    file("Submission package", "docs/app-store/SUBMISSION_PACKAGE.md"),
  ], [
    "Expo/EAS login",
    "EAS project link",
    "Apple Developer membership",
    "Signed preview build",
    "Real-device QA",
    "TestFlight review",
    "App Store review",
  ]),
  section("Ideal Method System", [
    file("Method catalog", "packages/domain/src/catalog.ts"),
    file("Routing engine", "packages/domain/src/routing.ts"),
    file("Practice paths", "packages/domain/src/paths.ts"),
    file("Original practice scripts", "packages/content/src/practice-catalog.ts"),
    file("Native Today flow", "mobile/src/app/(tabs)/index.tsx"),
    file("Native Reset flow", "mobile/src/app/reset.tsx"),
    file("Native Practices library", "mobile/src/app/(tabs)/practices.tsx"),
    file("Native Reflection weekly review", "mobile/src/app/(tabs)/reflection.tsx"),
    file("Local storage layer", "mobile/src/storage/database.ts"),
    file("Method system spec", "docs/product/METHOD_SYSTEM.md"),
    script("Domain/content tests", "test"),
  ], [
    "Qualified safety review for all launch methods",
    "Real repeated-use evidence",
    "Post-launch personalization tuning",
  ]),
  section("Source Material / Knowledge Core", [
    file("Source boundary", "docs/research/SOURCE_MATERIAL_BOUNDARY.md"),
    file("Source corpus index", "docs/research/source_corpus_index.json"),
    script("Source boundary guard", "check:source-boundary"),
    file("Evidence and positioning", "docs/research/EVIDENCE_AND_POSITIONING.md"),
    file("Product spec source boundary", "docs/product/PRODUCT_SPEC.md"),
  ], [
    "Rights-reviewed passage index before retrieval",
    "Seed demand before source-grounded RAG",
    "Human review of source-derived public claims",
  ]),
  section("GTM / Seed Validation", [
    file("Seed protocol", "docs/research/SEED_USER_PROTOCOL.md"),
    file("Seed results template", "docs/research/seed_user_results_template.csv"),
    file("Seed analyzer", "scripts/summarize-seed-users.mjs"),
    script("Seed analyzer command", "analyze:seed-users"),
    script("GTM guard", "check:gtm"),
    file("GTM plan", "docs/business/GTM_AND_BUSINESS.md"),
    file("Measurement plan", "docs/analytics/MEASUREMENT_PLAN.md"),
    file("Invitation copy", "INVITATIONS.md"),
    file("Tester handoff page", "src/app/support/seed-test/page.tsx"),
  ], [
    "15 anonymized seed-user rows",
    "48-72 hour follow-up evidence",
    "Go/no-go decision from real users",
    "Payment interviews before paid launch",
  ]),
  section("Privacy / Safety / Legal", [
    file("Privacy policy", "src/app/privacy/page.tsx"),
    file("Terms page", "src/app/terms/page.tsx"),
    file("Privacy and risk doc", "docs/security/PRIVACY_AND_RISK.md"),
    file("Human gates", "docs/HUMAN_GATES.md"),
    script("Public claim guard", "check:claims"),
    file("Support boundary", "src/app/support/page.tsx"),
    file("High-risk API boundary", "src/app/api/cinema/route.ts"),
  ], [
    "Legal review",
    "Monitored private support mailbox",
    "App Store privacy labels confirmed against final binary",
  ]),
];

const liveChecks = liveMode ? await collectLiveChecks() : [];

const report = {
  generatedAt: new Date().toISOString(),
  repo: process.cwd(),
  liveMode,
  sections: sections.map((item) => ({
    name: item.name,
    passed: item.passed,
    total: item.total,
    percent: item.percent,
    externalGates: item.externalGates,
    missingEngineering: item.checks.filter((check) => !check.ok).map((check) => check.label),
  })),
  liveChecks,
};

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("StillMind launch status\n");
  for (const item of sections) {
    console.log(`${item.name}: ${item.percent}% (${item.passed}/${item.total} engineering gates)`);
    const missing = item.checks.filter((check) => !check.ok);
    if (missing.length > 0) {
      for (const check of missing) console.log(`  MISSING ${check.label}`);
    }
    if (item.externalGates.length > 0) {
      console.log("  External gates:");
      for (const gate of item.externalGates) console.log(`  - ${gate}`);
    }
    console.log("");
  }
  if (liveMode) {
    console.log("Live external probes:");
    for (const check of liveChecks) {
      const detail = check.detail ? ` - ${check.detail}` : "";
      console.log(`  ${check.ok ? "OK" : "PENDING"} ${check.label}${detail}`);
    }
    console.log("");
  } else {
    console.log("Run `npm run status:launch -- --live` to probe EAS login/project and production URLs.");
  }
  console.log("Use `npm run status:launch -- --json` for machine-readable output.");
}

function section(name, checks, externalGates = []) {
  const passed = checks.filter((check) => check.ok).length;
  const total = checks.length;
  return {
    name,
    checks,
    externalGates,
    passed,
    total,
    percent: total === 0 ? 0 : Math.round((passed / total) * 100),
  };
}

function file(label, path) {
  return { label, ok: existsSync(join(process.cwd(), path)) };
}

function script(label, name) {
  return { label, ok: typeof pkg?.scripts?.[name] === "string" && pkg.scripts[name].length > 0 };
}

function value(label, ok) {
  return { label, ok: Boolean(ok) };
}

function readJson(path) {
  const fullPath = join(process.cwd(), path);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

async function collectLiveChecks() {
  const productionUrl = "https://stillmind-inner-cinema.vercel.app/support/seed-test";
  return [
    localCommandCheck("Git working tree clean", "git", ["status", "-sb"], {
      okWhen: (output) => output.trim() === "## main...origin/main",
      detail: (output) => output.trim().split(/\r?\n/).slice(0, 3).join(" | "),
    }),
    localCommandCheck("Expo/EAS logged in", npxCommand, [...npxPrefix, "eas-cli", "whoami"], {
      cwd: join(process.cwd(), "mobile"),
      okWhen: (output) => !/not logged in/i.test(output) && output.trim().length > 0,
      detail: (output) => output.trim().split(/\s+/)[0] ?? "",
    }),
    localCommandCheck("EAS project linked", npxCommand, [...npxPrefix, "eas-cli", "project:info"], {
      cwd: join(process.cwd(), "mobile"),
      okWhen: (output) => /Project ID|projectId|ID/i.test(output),
      detail: (output) => firstUsefulLine(output),
    }),
    await urlCheck("Production seed-test URL", productionUrl),
  ];
}

function localCommandCheck(label, command, args, options = {}) {
  try {
    const output = execFileSync(command, args, {
      cwd: options.cwd ?? process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 20_000,
    });
    const ok = options.okWhen ? Boolean(options.okWhen(output)) : true;
    return { label, ok, detail: options.detail ? options.detail(output) : firstUsefulLine(output) };
  } catch (error) {
    const output = `${error.stdout?.toString?.() ?? ""}${error.stderr?.toString?.() ?? ""}`.trim();
    return { label, ok: false, detail: firstUsefulLine(output) || error.message };
  }
}

async function urlCheck(label, url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    return { label, ok: response.ok, detail: `${response.status} ${url}` };
  } catch (error) {
    return { label, ok: false, detail: `${error.name}: ${url}` };
  } finally {
    clearTimeout(timeout);
  }
}

function firstUsefulLine(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? "";
}
