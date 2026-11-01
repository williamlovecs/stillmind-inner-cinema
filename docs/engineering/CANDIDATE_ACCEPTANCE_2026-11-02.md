# V3 Candidate Acceptance And Deployment Isolation

No new product version, UI redesign, V3/V4 merge, production action or participant outreach. This closes engineering gaps before controlled usability work; it is not human-device, content-rights or public-release approval.

## Independent Baseline Acceptance

Starting baseline **`e30ec3c822c14f1cc6f855eba693f7acc471e34a`** was cloned cleanly, without node_modules/build caches, into a disposable D-drive source directory. A new resource-limited Linux container used pinned official Node22.14 image digest `1c18d9ab3af4585870b92e4dbc5cac5a0dc77dd13df1a5905cea89fc720eb05b`. Project dependencies and process-scoped npm/compile caches were bound to D. Existing services were not restarted or reset.

All five checks exit0: clean standard `npm ci`, actual Zod/Expo/decoder/UUID consumer contracts, dependency tree, complete default `npm run verify:release`, and `npm audit --audit-level=high --json`. Release includes158 unit tests, types/lint/claims/material guards, default Next build, Doctor21/21, iOS and Expo Web exports. No skipped check or Webpack substitution is used. Raw/version-bound receipts are in `evidence/linux-node22-20261102/`.

Zod remains4.6.7 through the scoped CLI override; SDK57/CLI57/RN0.86 versions remain unchanged. The prior Zod report explains the dependency-major override boundary and tests real consumers. Ordinary audit still has29 package entries (27 moderate,2 low), exit1. This is not audit0 or an OS/Node-runtime vulnerability assessment.

## Push Without Deploying

The linked Vercel project's root was read back as repository root and production branchmain. Root `vercel.json` explicitly sets only `fix/v3-regression-recovery-20261101` tofalse under `git.deploymentEnabled`. Configuration was checked against the live [official schema/documentation](https://vercel.com/docs/project-configuration/git-configuration) before push. No wildcardtrue rule, ignored build, legacy global disable or production setting change is used. Two regression contracts preserve this boundary.

The existing CI remains test/build/audit-only. It now retains strict-state/product-path artifacts and runs both product-path suites as well as Web/Expo Web strictA-D checks. With the two isolation contracts, final source has160 unit tests; independent e30 baseline has158. Do not mix those counts or call the earlier Windows receipt a Linux run.

Final hosted acceptance must use the current [Draft PR #10](https://github.com/williamlovecs/stillmind-inner-cinema/pull/10) HEAD, not old run41319684279. Actual final CI receipts and post-push provider readback are recorded in the PR closeout. GitHub may test a synthetic merge-view SHA; its tree must match the candidate before claiming same-source acceptance. This is not a main merge.

After synchronization, verify no new Vercel deployment ID for any newly pushed candidate commit. A missing build or a skipped check alone is insufficient evidence. No explicit deployment command, promotion, merge or force push is authorized in this task.

## Human Validation Remains Open

User cannot currently assist with phone preflight, so real iPhone/Android/Safari/WeChat/VoiceOver checks are **NOT RUN**. Expo Web/Chromium, responsive screenshots, exported iOS bundles and green CI are not substitutes. No3–5 participant study, benefit, retention or willingness-to-pay evidence was collected.

Use `docs/research/CONTROLLED_CANDIDATE_TEST_2026-11-02.md` and its blank CSV for the next phase. Pin two actual candidate SHAs/URLs, obtain content/participation permission, pass device/access checks, then compare understanding and operation burden with the same synthetic scenario and planned order. Do not send the old Preview as if it were the new candidate, claim clinical results, or developV5 from AI-only feedback.
