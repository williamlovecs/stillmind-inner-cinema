# V3 Zod High-Advisory Repair

Follow-up to `POST_AUDIT_REPAIR_2026-11-01.md`. Scope: remove the two high package entries without downgrading Expo, preserving existing pause/consent/privacy behavior. No merge, push or deployment.

## Revisions And Root Cause

- Starting local/remote HEAD: `51c1d338700a7a2b7947697ac137f0cff8ff8dc1`, branch `fix/v3-regression-recovery-20261101`, Draft PR #10.
- Red-test commit: `8698ef9`. New installed-version and early-size-gate assertions fail; the existing decoder/UUID contracts and three actual Expo schema compatibility tests pass (7 pass,2 fail).
- Final tested code/lock: **`1bf8fc7ceb3919bbaedc2550f33f34030edc72b6`**. Subsequent commits only add documentation/evidence.

The two high entries were one root issue: Zod3.25.76 plus its transitive severity effect on @expo/cli. The [official advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) lists4.6.6 as patched. The [upstream fix](https://github.com/colinhacks/zod/commit/a0ebf970f2d752e5f58527cd2942ff48be4f46bd) rejects leading upper-size violations before walking elements; [4.6.7](https://github.com/colinhacks/zod/releases/tag/v4.6.7) is the pinned reviewed release. This does not make unbounded attacker-controlled input inherently safe.

## Minimal Change And Compatibility

Add only `overrides["@expo/cli"].zod = "4.6.7"`. The lockfile changes only Zod's version, tarball URL and integrity. Expo remains57.0.31, CLI57.0.32, React Native0.86.3. No SDK migration, Expo downgrade, audit suppression, force fix, application UI or data change.

SDK57 CLI currently declares Zod^3.25.76. This is an explicit dependency-major override with narrow consumer tests, not a claim that Expo upstream endorses Zod4 for every optional CLI integration. Revisit it when upstream changes its range; do not remove the guard without checking the advisory.

After clean `npm ci --ignore-scripts`, the existing reviewed decoder postinstall is applied. All9 dependency tests pass. `npm ls` also exits0 with no invalid dependency/peer tree. Tests exercise real installed Expo modules rather than a copied imitation:

- Resolve the CLI's actual Zod and require4.6.7.
- A bounded2000-item fixture exceeds `.max(2)`: before the patch it executes2000 element refinements; after the patch it executes0 and returns one `too_big` issue. No huge/OOM input is used.
- Plugin schema: valid parsing, unknown-property stripping, readonly arrays, invalid-field issue paths.
- Output schema: valid text/audio/image and invalid URL/level rejection.
- MCP schema builder: strict keys, command enum, text/number/boolean types, optional arguments and no-command error.
- Existing decoder UTF-8/array/malformed-input and xcode UUID checks remain unchanged.

## Verification

All checks bind the tested code SHA above. Default **`npm run verify:release` exits0**, including158 unit tests, all types/lint/claim/material guards, default Next Turbopack build, Expo Doctor21/21, iOS and Expo Web exports. No fallback build or skipped check is substituted for that receipt.

Final receipts are in `evidence/zod-high-20261101/checks.json`:

| Command | Final Result |
|---|---|
| `npm run verify:release` | exit0; full default command,158 unit tests |
| `npm run smoke:web` | exit0;18 main +10 adversarial groups |
| `npm run smoke:native` | exit0;15 Expo Web groups |
| `npm run smoke:states:web` / `smoke:states:native` | exit0;12 method contracts each, all A-D batches |
| `npm run smoke:product:web` / `smoke:product:native` | exit0;4 product paths each |
| `npm audit --audit-level=high --json` | exit0;0 critical/0 high |
| `npm audit --json` | exit1;27 moderate/2 low,29 total entries |

All browser summaries are complete, failure-free and bind the same code SHA. Current Web practice and native gaze320 screenshots were viewed, not only generated. Full validation runner exit1 deliberately preserves the all-severity audit failure; it is not an undisclosed browser/build failure or an all-green claim.

Package counts are not independent exploit counts. Zod's entry disappears and @expo/cli becomes moderate due to its separate existing tooling dependencies, so total entries fall30->29, not30->28. Ordinary all-severity audit remains exit1; do not present this as audit0 or full security clearance. The unchanged CI high-threshold gate passes locally; no new hosted CI was triggered.

## Delivery And Limits

Local commits only. Existing PR #10 remains Draft/unmerged on remote HEAD51c1d33. No push was made because the existing GitHub/Vercel integration automatically produces Preview deployment statuses on pushes. No merge, deploy, paid AI call, source-book/private-chat upload or V4/V1/V2/canonical change.

Logs use synthetic fixtures and local Chromium servers. Expo Web is not physical iOS/Android, Safari/WeChat, real OS suspension/crash, VoiceOver, notification delivery, signing or TestFlight. Content permission, real-user benefit and public-release acceptance remain separate gates. Optional live MCP/tunnel services were not started; tests cover the actual local schema builder only.

Raw evidence stays in `D:\AI-Validation\StillMind\post-audit-repair-20261101\security-high-followup`. Portable copies trim whitespace-only transcript tails for Git checks; original logs are retained unchanged. Old evidence is not overwritten. Windows-byte and canonical-LF hashes are distinguished in the portable manifest.
