# V3 Targeted Regression Recovery

Scope: recover the V2 Final pause contract and decoder patch without replacing the Still Room design. No V1/V2 modification, architecture migration, paid provider, merge or deployment.

## Revisions And Root Cause

- V3 baseline: `790a591cf34618e77f1f0b396f1823bf9a852b70`, branch `design/stillmind-rea-ui-v3-20261101`.
- V2 Final reference: `d7fc33858d79a0a75ac281b834ba3d5c8f010bee`.
- Red-test commit: `704d85b2413dcf60ffdb48bb995d4d053d10d8de`; runtime still matches the V3 baseline. The actual installed decoder version assertion fails, and each strict Expo Web batch A-D fails when a paused interaction changes state.
- Final tested runtime: **`08c105dbb7f4950809d12db70a6b3834025e126f`**. Later commits add only evidence and documentation.

V3 and V2 Final are sibling candidates, not successive releases. During the V3 presentation changes, Chip call sites lost their pause guards and the shared Chip no longer applied the disabled presentation/accessibility state. Other guards in V3 were already present and were not blindly re-imported.

## Minimal Repairs

1. Restore `disabled={paused}` on every Chip in native method batches A-D, including equivalent controls beyond the first reproduced failure. The shared Chip forwards the real disabled property and exposes `accessibilityState.disabled`, with the existing disabled opacity. No palette, layout or method content changes.
2. Keep the current V3 input, gaze target and press guards; verify them with the same strict behavior assertions as V2 Final rather than transplanting old UI.
3. Patch the scoped `decode-uri-component` override from 0.5.0 to 0.5.1. Lockfile changes are limited to that package's version, URL and integrity. Existing narrow query-string CommonJS compatibility patch remains; the actual Expo query-string consumer is checked for patched version, UTF-8, arrays and malformed input behavior. No Expo SDK migration or `audit fix --force`.
4. Add an AST guard for the four native batches and a serial A-D runner. The strict state script is byte-identical to V2 Final (`SHA256 1576aabc901054ee974923e92b39c2db7c80a33c5d3e2bef70ac6cbce461c142`). It is not weakened to match V3.
5. CI invokes both Web and Expo Web strict state suites after their builds. Existing audit/release checks remain enabled. Existing PR #8/#9-equivalent API/SDK repairs are not duplicated.

## Before / After

| Batch | Before On Expo Web | After On Both Web And Expo Web |
|---|---|---|
| A | paced-breath paused interaction mutates | inner-cinema, paced-breath, thought-watching pass |
| B | wide-gaze paused interaction mutates | wide-gaze, body-scan, person-shift pass |
| C | logout-pause paused interaction mutates | logout-pause, release, open-awareness pass |
| D | grounded-action paused interaction mutates | grounded-action, trigger-journal, anchors pass |

Each method assertion includes actual interaction, keyboard use, frozen paused clock, locked controls, after-check and clean re-entry. Four retained red summaries contain failures; eight green summaries contain no failures/external requests and bind the tested runtime SHA.

## Actual Local Verification

| Check | Result At 08c105d |
|---|---|
| `npm test` |153 tests pass |
| `npm run typecheck`, `npm run lint`, `npm run check:claims` | pass |
| `npm run build -- --webpack` | pass |
| `npm run check:release-readiness` | pass; material/engineering guard only |
| `npm run doctor:mobile` |21/21 |
| `npm run build:mobile:ios`, `npm run build:mobile:web` | exports pass |
| `npm run smoke:web` |18 main +10 adversarial groups pass |
| `npm run smoke:native` |15 Expo Web groups pass |
| `npm run smoke:states:web`, `npm run smoke:states:native` |12 method contracts each pass |
| `npm run smoke:product:web`, `npm run smoke:product:native` |4 product paths each pass |
| `npm audit --json` | **FAIL:30 package entries,0 critical,2 high,26 moderate,2 low** |

Verification used isolated D-drive installs, Node24.18.0 and installed Windows Chrome against owned local servers. The full `verify:release` command is NOT claimed green: checks were executed separately, with Webpack selected for the Windows Next build. CI's own unmodified build mode and hosted runner must be reported separately.

The decoder advisory is removed, not the entire dependency risk. Remaining high entries are `zod` and its transitive `@expo/cli` effect (`GHSA-mrhx-c7xc-m3w5`). npm suggests a semver-major Expo downgrade, which was not applied. The raw audit report is preserved and no audit gate is disabled. Package-entry counts are not counts of independent exploitable findings, and this run does not establish production reachability or safety.

## Evidence And Boundaries

Sanitized summaries, failing/passing transcripts, audit and screenshot hashes are in `evidence/post-audit-20261101/`. Two whitespace-only transcript lines were trimmed for Git whitespace checks; original logs remain unchanged. Full logs and original screenshots remain under `D:\AI-Validation\StillMind\post-audit-repair-20261101`; no private source corpus, user records or keys are included. The current native gaze320 and Web practice screenshots were actually viewed; V3 presentation remains intact. A few old `failure.png` files remain in ignored working artifacts from the red run and are not presented as green screenshots.

These are synthetic Chromium checks, not physical iPhone/Android, Safari, WeChat, touch, VoiceOver, actual OS suspension/crash or real-user benefit tests. Export success is not signing/TestFlight/App Store approval. Content authorization, informed testing participation, appropriate device preflight and unresolved dependency risk must be addressed before public rollout. Controlled researcher-operated usability testing is narrower than public distribution and cannot establish efficacy.
