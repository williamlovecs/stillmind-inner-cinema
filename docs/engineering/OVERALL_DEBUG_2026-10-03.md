# StillMind overall debug and safety QA - 2026-10-03

## Scope and revision

- Branch: `review/overall-debug-20261003`.
- Starting documentation HEAD: `ec218f33e0b32d430b00747dc3eaed418673d7cd`.
- Runtime repair SHA: `260dd3b7e7f095738f17cff6e0fd801fc90cf7ae` (initial repairs `bc40d21`, library failure follow-up `cb73bc1`, selector-only test correction `2343e66`, visible-warning follow-up `260dd3b`).
- Reused the existing `stillmind-codex-review-20260919` worktree; no new dependency/build clone on C.
- Preserved canonical E-drive main at `b4cf885eae5105cb1266d82c040f8ecab7e168b9` and GLM worktree at `31fe39af8a74b00a76b29d8bc8b47ba5790fb20b`.
- No push, merge, deployment, paid provider request, private-source upload, signing or participant outreach.
- This is a reliability/security repair, not a simultaneous redesign of twelve methods or delivery of B/C.

## Confirmed behavior repairs

| Problem | Repair | Evidence |
| --- | --- | --- |
| A failed native history read discarded separately readable preferences, potentially losing privacy and comfort opt-outs | Read settings/history independently; on unknown settings, disable persistence, AI, analytics and optional body/breath/haptic features | `native-storage-lifecycle.test.ts`; actual Expo Web failed-history scenario |
| Preference writes could fail behind react-native-web's ineffective Alert, library favorite failures became unhandled promises, and the first notice implementation scrolled out of view | Provider-level dismissible storage notice outside scrolling content, including onboarding, library and method detail; catch rejected library updates; current-session choice still honored | Actual Expo Web failed-favorite persistence scenario with viewport bounds and hit-test visibility assertions |
| Delete-all aborted at the first failed resource, reset onboarding before success, and did not cancel scheduled reminders | Attempt independent cleanup; show partial failure; only reset UI after successful cleanup; cancel OS reminders | Deletion unit tests; actual Expo Web partial-deletion and successful-deletion scenarios |
| Late OS permission/reminder callbacks could schedule after deletion, or a queued time change could use stale preferences | Serialize reminder updates with current preferences; reject new tasks during deletion and drain previous tasks before cancellation | Reminder queue regression; real notification delivery still needs a device |
| Native export left private JSON in the app cache after sharing | Clean the temporary file after share completion/failure; report cleanup failure; do not pretend unsupported sharing completed | Code/type/build review; real iOS share-sheet verification remains open |
| External support/privacy/terms link failures could become unhandled rejections | Catch open failures and show an inline message; preserve configurable destination URLs | Type/build review; release route guards remain enabled |
| Onboarding content could overflow a 320px screen; detail duration controls could exceed a row | Scroll onboarding content with an independent footer; wrap duration controls | Actual Expo Web 320px onboarding scenario and screenshots |
| Multi-key Web draft writes could partially succeed and reuse previous input, score or analytics consent | One atomic session draft with fresh navigation ID; consume once; failed new draft never falls back to old legacy values | `reset-draft.test.ts`; production Web failed-write scenario |
| Late dictation results could overwrite a manual correction or example selection | Stop recognition before either action and ignore callbacks from old recognition instances | Synthetic browser recognition regression; no microphone or cloud used |
| Body-focus targets lacked button/selected/disabled semantics | Add matching accessibility semantics without adding controls | Type/build review and twelve-method regression |

All existing eligibility, crisis-boundary, consent, neutral-outcome, timing, pause/stop, missing-score and deletion-tombstone behavior is retained. This does not prove therapeutic efficacy, full accessibility, or lexical safety completeness.

## Dependency security

The old zero-advisory result from September is historical, not current evidence.

- `next` and `eslint-config-next`: `16.3.3` to `16.3.8`, same minor line. Addresses [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j). No `next/og`/`ImageResponse` usage was found in app source; the dependency was upgraded regardless.
- Scoped `brace-expansion` overrides: minimatch 3 uses `1.1.21`, minimatch 10.2.6 uses `5.0.12`. Addresses [quadratic expansion](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) and related recursion advisories without mixing CommonJS and ESM major versions.
- Expo SDK remains 57 / React Native 0.86.3. Six SDK patch mismatches reported by current Expo Doctor were aligned; root/mobile router and metro-runtime ranges now agree. No SDK migration.
- Installation used `--ignore-scripts`, then explicitly ran the existing reviewed decoder bridge. No `audit fix --force`, no security exclusion or weakened CI.
- Initial audit: 79 affected package entries, including one critical. An intermediate post-upgrade scan reported 63 high entries. The final repeated `npm audit --json` and explicit `--include=dev` scan both report **22 high affected entries, zero critical, from two root advisories**. The intermediate and final reports are retained; the count change is not claimed as an additional code fix or proof of reduced exploitability. These are dependency propagation entries, not independently observed product exploits.
- Remaining roots: [braces stack-exhaustion DoS](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv). At check time, npm latest was `braces 3.0.3` and `node-forge 1.4.0`; official advisory `first_patched_version` was null for both. No released compatible fix was available.
- App source does not directly parse user-provided glob patterns or verify certificates with these packages. Their observed paths are lint/Metro/Expo tooling. This is an exposure assessment, not an exemption or proof of non-exploitability.
- `npm audit` remains exit 1. The existing CI high-severity gate remains blocking. **Do not call this a security-cleared public release.** Recheck official patches before signed/public distribution or introducing untrusted build inputs.

Raw initial/intermediate/final reports are retained under ignored `artifacts/dependency-audit/2026-10-03-{before,after,final}.json`. Both official root advisories were queried again after the final scan and still list no patched version; neither was withdrawn. npm's suggested major downgrades of Expo/React Native are not compatible fixes for this SDK and were not applied.

## Verification ledger

| Check | Result |
| --- | --- |
| Initial baseline test suite | 132 tests, exit 0 |
| Final `npm run verify:release` | Exit 0 on runtime SHA above; 144 tests, typecheck, lint, claim/release/source guards, Next build, Expo Doctor 21/21, iOS + Expo Web exports |
| `npm run smoke:web` | Exit 0; 18 main + 10 adversarial groups; both result files bind to the runtime SHA; zero uncaught browser exceptions |
| `npm run smoke:native` | Exit 0; 15 actual Expo Web export groups, zero uncaught exceptions and zero blocked external requests; summary binds to the runtime SHA |
| Final `npm audit --json` and explicit `--include=dev` | Both exit 1; two unpatched root advisories, 22 affected high entries, zero critical |
| Same-version screenshot inspection | Actual pixels checked for Web home/practice/manual preparation/large text and native practice/long text/onboarding/storage-failure notices |
| `git diff --check` | Exit 0; only normal Windows CRLF warnings |

The first release check failed because URL strings moved into a helper; explicit destination construction was restored at the call sites without removing checks. An interrupted release run was not counted as successful; the complete run was repeated with a retained log. Default Web port 3100 was occupied; the owned-server guard stopped rather than testing or terminating the unrelated service. The retry uses port 3173. The first native fault run stopped at a directly opened dynamic route unsupported by the small static smoke server; the scenario now enters detail through the actual library client navigation, retaining fault injection and persistence assertions. A second run exposed an ambiguous selector matching the path card instead of the method card; the selector was made precise. The following 15-group pass on `2343e66` was not treated as visual acceptance: inspecting its screenshots showed warnings outside the viewport after scrolling. The notice was moved out of the scroller and true bounds/hit-test assertions were added; final results below replace that earlier DOM-only evidence.

Logs: final release `artifacts/qa-logs/overall-release-20261003-final-r2.log`; earlier release/failure logs and Web/native logs remain in the same directory. Browser scenarios use local synthetic data. A twelve-method loop is one reported scenario, not twelve independent user validations.

Final browser logs: `overall-web-20261003-final.log` and `overall-native-20261003-final-r3.log`. Audit logs: `overall-audit-20261003-final.log` and `overall-audit-20261003-final-full.log`. `artifacts/overall-debug-20261003-evidence.json` binds the runtime revision and selected evidence hashes.

Actual inspected screenshots: Web `home-390`, `practice-mobile`, `choose-1440`, `first-use-large-text-320`; native `native-practice`, `native-long-text-320`, `native-onboarding-320`, `native-history-read-failure`, `native-settings-write-failure`, `native-partial-delete-failure`. The large-text Web artifact is a full-page capture with an internally scrolling boundary modal, not evidence that the entire form fits in one viewport. Failed-run artifacts/logs are historical evidence, not final acceptance screenshots.

## Remaining external gates

- The two upstream security patches above; existing fail-closed CI remains intact.
- Physical iPhone/Safari/WeChat/Android, large text, screen reader, OS permission/reminder and real share-sheet QA.
- EAS/Apple project binding, credentials, signed builds and actual TestFlight/App Store distribution.
- Content authorization/legal review, real seed-user outcomes, reuse and payment evidence.
- Public paid provider still requires trustworthy proxy identity, distributed abuse limits and actual budget controls; local in-memory limits are not those controls.
- Long variants still reuse authored guidance with changed dwell times and disclose that. This round did not fabricate deep new courses or claim twelve-method final quality.

## Storage and retention

Process-scoped npm/compile/download caches use the existing D-drive external-cache wrapper. Existing validation worktree and ignored build/screenshots remain in place for reproducibility; no new standalone copy or large archive was created. Disposable browser profiles are owned by the smoke scripts and removed at exit; only test-owned server/browser processes are stopped. Canonical, GLM and unrelated running services remain untouched.
