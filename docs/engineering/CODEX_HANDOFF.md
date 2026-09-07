# Codex接管：工程基准、三模块结构与未实施UX

更新：2026-09-07。本页是统一入口；旧聊天、旧包和历史进度不能覆盖这里明确区分的事实/规划。

## 先读五份，不用重读整个聊天

1. 本页：分支、安全接手和验证。
2. `../../.planning/stillmind-complete-product/CURRENT_STATE.md`：已完成/待实施/外部门槛。
3. `../product/MODULES_AND_COMBINATIONS.md`：创始人新确认的A/B/C与七种组合。
4. `../product/UX_INTERACTION_REVIEW_2026-09-06.md`：UX01–UX09证据、建议与验收，尚未实施。
5. `HANDOFF_SYNC_2026-09-07.md`：附件、源码、私密文件、CI材料放在哪里。

## 唯一工程基线

- 仓库：`williamlovecs/stillmind-inner-cinema`
- 分支：`fix/native-integrity-deps-20260906`
- Draft PR #3直接对main，包含此前Web和原生修复；不要再次合并分叉PR #1或关闭的PR #4。
- 原main：`b4cf885eae5105cb1266d82c040f8ecab7e168b9`
- 最近运行代码基准：`0ba5edf7d46a113762c56e8137725d5241e7659b`
- 基准CI：`https://github.com/williamlovecs/stillmind-inner-cinema/actions/runs/33988224046`
- 119项测试、17组Next Web与5组Expo Web浏览器场景、类型/lint、Next构建、Expo Doctor和bundle导出通过；该次audit0。不是医学/授权/真实iPhone证明。
- 当前文档提交是上述基准的后续，不等于UX已开发；运行代码未改。读取实际HEAD和最新Checks区分历史/本轮，不把119项基准报告伪称一次新测试。

本次已重新校验186个源码文件及完整Git tree。实际新增文档后的head与回执见PR；不在这个文件里写需要自引用的SHA。原main不自动合并、不主动发布；已有Vercel集成可能自动产生Preview。

## 新信息：不要再误解范围

A=沉寂小我练习（历史App1），B=复盘工具（历史App2），C=按古零书籍/文章整理的知识层。三者可独立或组合，是产品结构，不是已有三套上线产品。当前本库重点实现A；Reflection不是B的文档上传分析产品；元数据不是C完整可检索服务。核验用户本地其他成果再下结论。

一分钟是A的轻入口，不是全部长期愿景。保留真实自我观察/观照/沉寂小我方向，但不把它包装成保证效果、人格标签或意识等级测量。技术独立与版权独立是两件事；不带C标记的版本也先审查脚本来源。

15人计划未证明已招募。社群用户不自动等于潜催内部；每批需明确组合/内容版本、实际身份和许可范围。外部可用范围未获确认时不自动扩大，内部身份也不自动构成授权。私人老师沟通与原PDF不入公共Git。

## 已有代码注释与测试：保留什么

| 目的 | 主要入口 |
| --- | --- |
| 实际时长、可缺失评分、真实结束 | packages/domain/src/session.ts；src/lib/practice-attempt.ts；原生attempt/session实现 |
| 开始资格、暂停、后台、过期生成 | packages/domain/src/routing.ts；src/app/reset/page.tsx；mobile/src/app/reset.tsx及相关lib/hooks |
| 保存失败和删除顺序 | src/lib/safe-storage.ts；mobile/src/state/AppProvider.tsx；mobile/src/storage与serial任务 |
| 来源诚实、请求限制、统计同意 | src/app/api/cinema/route.ts；src/app/api/events/route.ts；src/lib/server-limits.ts；两端analytics |
| 原方法与内容来源边界 | packages/content/src/practice-catalog.ts；docs/research/source_corpus_index.json；CONTENT_RIGHTS_MATRIX.md |
| 工程验收 | test/、packages/*/test/、scripts/smoke-web.mjs、smoke-adversarial.mjs、smoke-native-web.mjs |

依赖已在此前PR迁移到Expo57.0.20/RN0.86.3，保留lockfile和scoped兼容处理。理由见`NATIVE_REPAIR_2026-09-06.md`；不要根据旧SDK56错误重新做一次迁移。

## 尚未实现的UX，不要报已修

固定82%/18–38–76条；默认Will及全字替换；自然数息脚本对固定吸呼节拍；空输入认领负面念头；手动观影视角只改高亮而未改变主体构图；稳定按压演示、聚焦对象、阅读负担与长时长内容深度。详见UX审阅，上一轮“全部只剩外部门槛”的说法不能覆盖这些实际遗留。

下一批建议：先修UX02/03/04/06明确错配，再做UX01/08一条可逆、同一内容的观影体验与轻入口/结束。不要全盘换皮或十二种方法同时重写，不为“真AI”强加模型/摄像头/穿戴。保留原有安全/同意/退出/记录语义，并加语义回归：点了主体确实变化、不点也能结束、空输入不编造负面独白、原句不误改、无动画也可用。

## 安全接手步骤

先检查用户实际工作目录，不假设它就是当前GitHub分支：

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git worktree list
git fetch origin
```

有未提交修改或本地另有B/C成果时先清点保留；禁止reset --hard、自动stash、盲目ZIP覆盖或强推。工作树干净且无冲突时，已有本地分支用`git switch fix/native-integrity-deps-20260906`，仅远端有时用`git switch --track origin/fix/native-integrity-deps-20260906`。本地落后只允许确认后的fast-forward；有分叉先报告，不自动合并。

从核验后的接手head开一个可回退的小UX工作分支/新worktree，不从旧main重做；不是另建一套产品。不要在Codex线程里打印凭据或包含访问令牌的remote配置。

## 验证与交付

```bash
npm ci
npm run test
npm run verify:release
npm run smoke:web
npm run smoke:native
npm audit
```

浏览器命令需要Node22与Chrome/Chromium，按脚本使用production build和Expo Web export。没有环境就准确记录blocked，不删检查、降级Doctor或audit fix --force。默认只用合成数据；真实付费API、账户变更、签名、发送邀请、上传源文、商业发布分别需要明确许可。

每次交付：改了什么/提交SHA、通过和未跑的检查、同版本关键截图、剩余问题；更新CURRENT_STATE和对应UX状态。不把模拟测试冒充效果、用户留存、付款或授权。

## 仍需人工/外部确认

真实Safari/微信/Android；非开发者登录态链接；私密支持渠道；EAS/Apple及签名/审核；真实可选StepFun及处理/预算/网关；内容权利与发布主体；真实15人和随访/付费访谈。具体执行文件见SEED_TEST_LAUNCH_PACK_ZH、CONTENT_RIGHTS_MATRIX、PREFLIGHT_2026-09-06与Issue #2。

## 历史材料仍保留

`AUDIT_2026-09-06.md`、`NATIVE_REPAIR_2026-09-06.md`、`ROUND2_REVIEW_2026-09-06.md`记录两轮修复依据；NATIVE_DEPENDENCY_BLOCKER保存已解决的历史问题。旧.planning日志保留，不据其complete百分比推定当前所有产品/内容成熟。旧说明-only ZIP弃用；相对main与相对PR1的两份补丁不可同时盲目应用。
