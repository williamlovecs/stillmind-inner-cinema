# Cinema request-body limit — Final Closeout D (P0)

**Conclusion: PR Ready for Draft PR review, based on the local gates below.**

The fixed implementation passed the standalone API suite and the complete `npm run verify` pipeline. New attack regressions were also run against the old implementation and produced the expected differentiating failures. This is not a claim of mobile-device, live-proxy, or production security testing.

## Scope and exact revisions

- Repository: `williamlovecs/stillmind-inner-cinema`
- Worktree: `C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\22-30-27-1531681d\closeout\d-stillmind`
- Branch: `verify/cinema-body-limit-20261101`
- Audit starting HEAD: `32d2cd1ee4dda5a46ae796759618649dcb605b89`
- Main baseline / old vulnerable implementation: `b4cf885eae5105cb1266d82c040f8ecab7e168b9`
- Initial worktree state: clean; branch and HEAD matched the requested audit start.
- Runtime: Windows, Node `v24.21.0`, npm `11.12.1`.

The complete main-to-audit name-status comparison is saved in `main-to-audit-files.txt`, and the complete patch is saved in `main-to-audit.diff`. It contains exactly these two files and no others:

```text
M	src/app/api/cinema/route.ts
M	test/api-cinema.test.ts
```

Closeout D left `src/app/api/cinema/route.ts` unchanged because the streamed implementation passed the expanded attack suite and review found no additional verified code gap. Closeout D expanded `test/api-cinema.test.ts` from 4 to 10 tests and added this evidence directory.

Repository `AGENTS.md` was read before changes. Before reviewing or editing application behavior, the local Route Handler guides from the exact locked Next.js `16.2.12` package were read:

- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`

## Final gate results

| Check | Actual result | Evidence |
| --- | --- | --- |
| Clean locked install: `npm ci --no-audit --no-fund` | **Passed** after disk space became available; 934 packages installed. | `npm-ci-retry.log` |
| Audit-start `npm run test:api` | **Passed**, 4/4. | `test-api-audit-start.log` |
| Expanded fixed `npm run test:api` | **Passed**, 10/10. | `test-api-fixed-attempt2.log` |
| Same expanded suite on old implementation | **Failed as intended**, 5 passed / 5 failed. | `test-api-old-baseline.log` |
| Complete `npm run verify` | **Passed**: all 66 tests, all four typecheck stages, Web and mobile lint, public-claim guard, and Next.js production build. | `npm-run-verify-final-attempt2.log` |

The successful verify used the existing Git Bash as npm's script shell to avoid a Windows nested-npm/cmd Ctrl+C propagation failure in `expo lint`:

```bash
PATH="/c/Program Files/nodejs:$PATH" \
npm_config_script_shell="C:\Program Files\Git\bin\bash.exe" \
npm run verify
```

No test, lint, typecheck, claims, or build step was removed or weakened. The default-cmd attempt and environment diagnosis are preserved below.

## Added regression coverage and old-versus-new proof

The expanded suite covers:

1. Missing `Content-Length` with an over-limit body.
2. Abnormal `Content-Length` values (`not-a-number`, negative, non-finite, fractional, and empty) with actually oversized bodies; none bypasses the independent byte count.
3. A valid JSON body of exactly 4096 bytes accepted.
4. A valid JSON body of 4097 bytes rejected with 413.
5. Multi-byte UTF-8 delivered one byte per chunk, including splits inside code points; correct decoding is proved by selecting the conflict preset.
6. Stream read failure returning generic 400 `missing-trigger`, `Cache-Control: no-store`, no sensitive error detail, and a released reader lock.
7. Oversized input with `reader.cancel()` rejection contained, one observed cancellation, safe 413 response, and a released reader lock.

The identical 10-test file was copied into a temporary detached worktree at old commit `b4cf885eae5105cb1266d82c040f8ecab7e168b9`. The old implementation produced 5 failures (`test-api-old-baseline.log`):

- Missing-length oversized input returned 200 instead of 413.
- Abnormal-length oversized input returned 200 instead of 413.
- The 4097-byte valid body returned 200 instead of 413.
- The read-failure case left the stream locked.
- The oversized cancellation case returned 400 instead of 413.

The fixed implementation passed all 10 tests. This proves that the new attack assertions distinguish the old implementation rather than merely restating behavior common to both versions. The temporary worktree and its dependency junction were removed after the run; no existing worktree or `main` was changed.

### Exact baseline reproduction

```bash
git worktree add --detach \
  "C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\22-30-27-1531681d\closeout\d-stillmind-old-baseline-20261101" \
  b4cf885eae5105cb1266d82c040f8ecab7e168b9

cp test/api-cinema.test.ts \
  "C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\22-30-27-1531681d\closeout\d-stillmind-old-baseline-20261101\test\api-cinema.test.ts"

MSYS_NO_PATHCONV=1 cmd.exe /c "mklink /J C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\22-30-27-1531681d\closeout\d-stillmind-old-baseline-20261101\node_modules C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\22-30-27-1531681d\closeout\d-stillmind\node_modules"

npm --prefix "C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\22-30-27-1531681d\closeout\d-stillmind-old-baseline-20261101" run test:api
```

Cleanup was performed by removing the junction first, then the detached worktree:

```bash
MSYS_NO_PATHCONV=1 cmd.exe /c "rmdir C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\22-30-27-1531681d\closeout\d-stillmind-old-baseline-20261101\node_modules"

git worktree remove --force \
  "C:\Users\willi\OneDrive\Documents\kimi\tasks\2026-10-31\22-30-27-1531681d\closeout\d-stillmind-old-baseline-20261101"
```

## Stream and response-safety review

At fixed audit start `32d2cd1ee4dda5a46ae796759618649dcb605b89`, supported by both source review and the executed regressions:

- The streaming reader counts `value.byteLength`, not JavaScript string length, and rejects above 4096 bytes.
- `TextDecoder` uses streaming mode and flushes at EOF; multibyte input split across chunks remained valid.
- The over-limit path awaits `reader.cancel()` and catches cancellation rejection. `reader.releaseLock()` is in `finally`, including after stream read failure.
- Read failure and malformed JSON do not expose internal errors; they fall through to generic 400 `missing-trigger`.
- The 413 body is `{ "error": "payload-too-large" }`; neither 400 nor 413 echoes request data or exception details.
- The shared JSON response helper sets `Cache-Control: no-store` on both 400 and 413 responses.
- `Content-Length` is only an early rejection hint. Abnormal values do not disable the independent streaming byte count. There is no explicit invalid-header 400 branch, so these tests intentionally assert the security invariant (an actually oversized body still receives 413), not a new small-body framing policy.
- No route implementation change was made because no additional gap survived the executed review.

These are direct Route Handler unit tests, not tests of proxy HTTP framing or a deployed Next.js server.

## Chronological environment failures and retained logs

Early attempts were blocked when the C: volume reached zero available space. Those logs are retained to make the execution history auditable; they are not the final gate results.

| Command / stage | Actual result | Log |
| --- | --- | --- |
| Initial `npm ci` | Exit 1, repeated `TAR_ENTRY_ERROR ENOSPC`; the log itself was truncated by ENOSPC. | `npm-ci.log` |
| `npm ci --install-strategy=linked --no-audit --no-fund` | Exit 1, npm `Digest method not supported`. | `npm-ci-linked.log` |
| NTFS-compressed `npm install --no-audit --no-fund` | Failed with ENOSPC. | `npm-install-compressed.log` |
| Offline `npm install --offline --no-audit --no-fund` | Did not complete; empty console log. | `npm-install-offline.log` |
| Tests before dependencies were available | `test:api` and `verify` could not find `tsx`; zero relevant tests ran. | `test-api.log`, `npm-run-verify.log` |
| Exact Next package retrieval | Succeeded; used only to read local locked-version guides. | `npm-pack-next.log` |
| First expanded fixed API run | 9/10; the test stream errored before its cancellation probe could fire. The probe was corrected, not the route or assertion target. | `test-api-fixed-attempt1.log` |
| First complete verify with default cmd shell | All tests, typechecks, and Web lint passed; nested `expo lint` exited with Windows Ctrl+C code 3221225786 / shell exit 130. Claims/build did not run in that attempt. | `npm-run-verify-final-attempt1.log` |
| CI-env mobile lint reproduction | Same nested-cmd interruption. | `lint-mobile-ci.log` |
| Direct Expo CLI diagnostic | Passed, confirming the lint check itself could execute. | `expo-lint-direct.log` |
| Git Bash without explicit Node path | Failed to find `node`; diagnosed the script-shell PATH requirement. | `lint-mobile-bash-shell.log` |
| Git Bash with Node path | Mobile lint passed. | `lint-mobile-bash-path.log` |
| Final complete verify with Git Bash and Node path | Passed every stage, including Expo lint and production build. | `npm-run-verify-final-attempt2.log` |

No `npm audit fix --force`, dependency downgrade, test exclusion, script weakening, or verification-gate change was performed.

## Independent remaining risks

### `X-Forwarded-For` trust boundary

`clientIp()` trusts the first `X-Forwarded-For` entry and falls back to `X-Real-IP`. If a direct client can supply either header without a trusted proxy overwriting or sanitizing it, the client can rotate spoofed values and evade per-IP throttling. The first-entry rule is safe only when the deployment's trusted proxy chain and header-sanitization behavior guarantee its provenance. No real-proxy or production-header test was performed.

### In-memory rate limiting

The limiter is per process. Restarting the process resets it, and multiple serverless/Node instances do not share counters, so the effective limit can be multiplied by deployment concurrency. Cleanup runs only when the map exceeds 2000 keys; many active or spoofed keys can remain resident and make cleanup scans expensive. A distributed, bounded rate limiter with a trusted client identity remains necessary for production-grade enforcement. No distributed or production load test was performed.

### Scope limits

Mobile typecheck and Expo lint passed as part of `verify`, but no mobile-device test was performed. No real proxy, production security, live StepFun provider, or real-client interruption test was performed or claimed.

## PR decision

- Old-implementation differentiation: **Passed (5 expected failures on old code).**
- Fixed API suite: **Passed (10/10).**
- Complete verify: **Passed (66 tests plus typecheck, lint, claims, and build).**
- Security gate weakening: **None.**
- Release state for this scoped change: **PR Ready for a Draft PR targeting `main`, with the independent residual risks above retained for review.**
