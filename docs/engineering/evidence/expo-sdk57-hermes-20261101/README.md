# Expo SDK 57 / Hermes release-gate evidence

- Baseline: `b4cf885eae5105cb1266d82c040f8ecab7e168b9`
- Fully verified code commit: `c6fdc447e1c2668e9dab8a681e8721647f2985ec`
- Local environment: Node `v24.21.0`, npm `11.12.1`, Windows Git Bash
- Final versions: Expo `57.0.31`, React Native `0.86.3`, Hermes V1 `250829098.0.17`

## Results

- `initial-doctor.log`: FAIL — Hermes V1 regression and 11 Expo package mismatches on the baseline.
- `final-npm-ci.log`: PASS — clean installation from the final lockfile.
- `clean-doctor.log`: PASS — 21/21 Expo Doctor checks after clean dependency reconstruction.
- `verify-release.log`: PASS at the verified code commit — 59 tests, all TypeScript checks, lint, public-claim guard, Next.js build, release-readiness guards, Expo Doctor 21/21, and iOS/Web Expo bundle exports.
- `dependency-versions.log`: records the installed Expo, React Native, Hermes compiler, and Hermes V1 versions.

The full release verification used the required Windows shell configuration:

```sh
PATH="/c/Program Files/nodejs:$PATH" npm_config_script_shell="C:\Program Files\Git\bin\bash.exe" npm run verify:release
```

Intermediate logs retain the failed duplicate-dependency and lockfile-reconstruction attempts. The final lockfile was regenerated from the stated baseline after removing redundant root-level Expo development dependencies; no dependency exclusions, Doctor bypasses, test removals, or forced audit fixes were used.

## Scope

Only Expo/React Native dependency alignment, the Expo-managed `expo-font` and `expo-status-bar` config plugins, the lockfile, and these evidence files changed. No business or UI source files changed.

The final `npm ci` reported 39 npm audit findings (2 low, 23 moderate, 12 high, 2 critical). They were not force-fixed in this dependency branch and require separate triage.

## NOT VERIFIED

No physical-device QA, signed EAS build, TestFlight validation, deployment, or production acceptance was performed. GitHub Actions results are not asserted by this local evidence.
