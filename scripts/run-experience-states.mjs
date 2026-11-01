import { spawnSync } from "node:child_process";
const platform = process.argv.includes("--native") ? "native" : "web";
let failed = false;
for (const batch of ["A", "B", "C", "D"]) {
  const result = spawnSync(process.execPath, ["scripts/smoke-experience-v2-states.mjs"], {
    stdio: "inherit",
    env: { ...process.env, V2_PLATFORM: platform, V2_BATCH: batch },
    timeout: 120_000,
  });
  if (result.status !== 0 || result.error) {
    console.error(`Strict ${platform} batch ${batch} failed`, result.error ?? result.status);
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
