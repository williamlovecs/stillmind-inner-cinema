# StillMind Experience V3 验收与交接｜2026-11-01

## 结论与版本

- 分支：`design/stillmind-rea-ui-v3-20261101`。
- 起点：`c32d423c4eaa5e3f263d1679bb78eee0fd181fbd`，来自 `feat/stillmind-experience-v2-20261031`，不是 PR #6 的小修分支。
- 既有实现及其实际运行验收对应：`96cd7c0a608842f8e9d946926961b62cd05e9d01`，以下结果属于历史实现基线。
- 最终 PR HEAD 还包含补齐任务书证据的提交。最终 SHA、同 SHA 复验、CI 与剩余阻塞以 PR 最新交接说明和独立 `evidence/stillmind-v3-final-20261101` 分支为准，不用旧结果冒充最终复验。
- Draft PR 的目标分支必须为 `feat/stillmind-experience-v2-20261031`。不合并、不部署、不发布，不修改 main、B/C 研究档案或独立官网。

本轮完成 V3 全量表现层与信息架构重构，并复用既有十二法、domain clock、存储和安全逻辑。自动验收通过不等于真实手机、完整无障碍、心理疗效或发布许可；AT-10／AT-11 等任务书缺口仍未关闭。

## 已交付

### 折页静室 / Still Room

- 暖纸、矿物墨色、低饱和绿和单一陶土强调色；去掉主体验的蓝紫渐变、发光圆环和层层卡片。
- Web 首页桌面使用行动／观看对象双栏，移动端回到自然单列；Expo 首页采用同一语义而非强行共享视图。
- 共享令牌：`packages/design-tokens/src/index.ts`。Web 与 Expo 的主题、页面和组件同步更新。
- 规范：`docs/design/STILLMIND_DESIGN_SYSTEM_V3.md`；三套五屏原型及评分：`docs/design/VISUAL_DIRECTIONS_V3_2026-11-01.md`。
- 三套原型在相同中文内容、相同 390／1440 尺寸下实际渲染共 30 张图；不是只比较配色或概念图。方向 A 为全站系统，吸收 B 的空间关系与 C 的索引节奏。
- Phase 0–7 索引与最终十问：`docs/handoff/v3/CODEX_V3_HANDOFF.md`。

### 进入、准备、练习、结束与重入

- 默认只显示一个可解释的推荐起点，十二法保留在方法库，不要求首次用户先读完整目录。
- 状态、原句、强度和时长按需展开；未展开不是必填，不自动开始或同意。
- 练习只保留当前方法、真实时间、注意对象、当前指导和必要控制。
- After-check 可跳过；未答评分保持缺失。停止和 worse 使用中性状态，不推荐立即重练。
- 结束页只保留一个状态标题，返回是主出口；复制反馈和种子测试反馈降为次级操作。
- 方法库改为可扫描索引，方法详情、历史、支持、隐私、条款和种子测试页统一视觉与焦点状态。

### 十二法与观电影

- 保留全部 method ID 和独立交互渲染器，没有把十二种方法改成同一动画换标题。
- 观电影以同一原句、纸幕、座位和观看距离构成空间；三个观看位置可逆，键盘可操作，暂停时禁用切换。
- Reduced Motion 保留等价静态构图和信息，不用动画证明觉察、稳定、呼吸同步或心理变化。
- 逐法合同：`docs/product/METHOD_INTERACTION_CONTRACTS_V3.md`。本轮没有新增长时长独立课程或外部疗效证据。

### 明确保留的安全与数据语义

- 用户原句保护、高风险边界、首次同意、方法资格与身体／呼吸偏好限制。
- 真实活动计时、后台暂停、暂停／继续、停止、退出和重新进入。
- 离线脚本、本机记录、存储失败可退出、缺失评分、可选匿名事件、导出和删除。
- B/C 档案隔离；没有合并研究资产、调用付费模型或生成虚假外部数据。

## 实际验证结果

本节是实现提交 `96cd7c0a608842f8e9d946926961b62cd05e9d01` 的历史验收记录；最终 PR HEAD 的同 SHA 复验以 PR 最新交接说明和独立 evidence 分支为准。验证使用本地 Next production build、真实 Expo Web 静态导出、本机 Chrome/Chromium、一次性浏览器配置和合成测试输入。未把 Expo Web 当成真机。

| 检查 | 历史实现验收结果 | 证据 |
| --- | --- | --- |
| `npm run typecheck` | Web、design tokens、domain、content、mobile 全部通过 | [日志](../evidence/v3/verification/logs/static-unit-and-claims.log) |
| `npm run lint` | Web 与 Expo lint 全部通过 | 同上 |
| `npm test` | 148 项单元／契约测试全部通过，0 failed | 同上 |
| `npm run check:claims` | 通过；仅是词法门禁，不是安全或权利认证 | 同上 |
| Next Webpack production build | 成功，生成 26 个静态页面，含 12 个方法详情 | [构建日志](../evidence/v3/verification/logs/v3-web-build.log) |
| `npm run build:mobile:web` | 成功，Expo 导出 12 个静态路由 | [构建日志](../evidence/v3/verification/logs/v3-mobile-build.log) |
| `npm run build:mobile:ios` | 后续预提交复核成功导出静态 HBC bundle；不是 IPA、原生构建或真机测试 | [日志](../evidence/v3/verification/logs/v3-mobile-ios-build-precommit.log) |
| `npm run smoke:web` | 18 项主回归＋10 项对抗测试全部通过 | [日志](../evidence/v3/verification/logs/v3-web-smoke-committed.log)、[JSON](../evidence/v3/verification/web-smoke-result.json) |
| `npm run smoke:product:web` | 4 项真实本机产品路径全部通过 | [日志](../evidence/v3/verification/logs/v3-web-product-smoke-committed.log)、[JSON](../evidence/v3/verification/web-product-summary.json) |
| `npm run smoke:native` | 15 项 Expo Web 回归全部通过 | [日志](../evidence/v3/verification/logs/v3-native-smoke-committed.log) |
| `npm run smoke:product:native` | 3 项 Expo 本机产品路径全部通过 | [日志](../evidence/v3/verification/logs/v3-native-product-smoke-committed.log)、[JSON](../evidence/v3/verification/native-product-summary.json) |
| 公开页补充检查 | support、seed-test、privacy、terms、method detail 在 390px／Reduced Motion 下无根级横向溢出，无浏览器异常 | [日志](../evidence/v3/verification/logs/v3-public-smoke.log) |
| `git diff --check` | 通过 | 静态检查日志 |

上述历史 Web JSON 的 `testedGitSha` 均为 `96cd7c0a608842f8e9d946926961b62cd05e9d01`；`complete: true`、`browserErrors: []`。两份历史产品路径 JSON 均为 `complete: true`、`failures: []`、`externalRequests: []`。Expo 主回归以真实命令日志为准，不虚构不存在的 result JSON。最终提交复验必须重新生成并核对这些字段。

### 十二法与状态覆盖

Web 和 Expo Web 均逐一启动并停止以下方法，且验证了所选方法不是路由替换或标签伪造：

`inner-cinema`、`paced-breath`、`thought-watching`、`wide-gaze`、`body-scan`、`person-shift`、`logout-pause`、`release`、`open-awareness`、`grounded-action`、`trigger-journal`、`anchors`。

共同覆盖：320px 停止可达、真实计时、暂停／继续、未评分、八秒停止、worse、存储失败、原句保留、重新进入、离线、后台暂停、键盘、Reduced Motion、收藏筛选、复盘、导出和删除。自动逐法通过不代表每种方法都已完成真人体验或临床验证。AT-10 的原 Session 可见保存重试仍不完整，AT-11 的 running／paused／completed_candidate／save_error 恢复仍缺失；其余逐项状态见 `docs/handoff/v3/08_QA_REPORT.md`。

### 截图与原始结果

- V3 验收截图：`docs/evidence/v3/verification/`。历史实现含 Web 320／390／1440、Expo 320／390、十二法、首次边界、观电影、减少动态、长中文、停止、worse 和公开页面；最终复验新增 Web 390／768／1440 首页与准备页。
- 三方向五屏截图：`docs/evidence/v3/directions/`，30 张均已实际查看。
- 严格 V2／V3 同条件对照：`docs/evidence/v3/compare/`，七组共 14 张均已实际查看，说明见 `docs/handoff/v3/09_BEFORE_AFTER.md`。旧 `docs/evidence/v3/v2-baseline/` 不冒充严格同条件对照。
- 已人工查看代表性最终截图，重点检查首次边界弹窗、准备页、观电影、320px 控制、停止后状态、Expo 首页／引导和五个公开页面。
- 截图文字和 Session 均为合成测试数据，不是用户案例。性能字段只是本地单次浏览器记录，不是公网 Lighthouse 或真实用户指标。

## 构建环境说明

实际 Web 构建命令：

```bash
"/c/Program Files/nodejs/node.exe" node_modules/next/dist/bin/next build --webpack
```

本次该 Node 为 `v24.18.0`。浏览器测试显式设置本机 `CHROME_BIN`，使用本地 production server；测试结束后服务已关闭。

首次与 Expo 并行构建及随后单独重试曾遇到旧 `.next` 缓存相关的 `WasmHash._updateWithBuffer` 异常；删除生成目录 `.next` 后，相同 Webpack 构建成功。没有改依赖或关闭门禁掩盖它。

默认 `npm run build` 的 Turbopack 路线在此 Windows 环境历史上有子进程 `program not found` 阻塞，本轮最终验收没有宣称其通过。后续应在干净 Node 22 CI／开发机重跑默认构建与完整 release 门禁，不把当前 Webpack 成功扩展成全环境构建证明。

## GitHub PR CI 与自动 Preview

Draft PR #7 的首轮远端 CI 对应 `e1b749fb50fd3c00b8b1dd5021d12213bb6408c0`，workflow run 为 `41229045862`：

- `Read-only source handoff`：通过。
- `Web production browser regression`：通过；干净 Ubuntu／Node 22 环境的 `Build Web and exercise real browser paths` 步骤成功。
- `Verify release readiness`：失败于 `Capture dependency advisories`，后续 `Run release verification` 和 `Exercise actual Expo Web export` 被跳过。这是已披露的依赖审计门禁失败，不是 Web 功能回归失败。
- 仓库既有 Vercel 集成在 push 后自动完成 Preview；这不是手动生产部署或发布，也没有把该 Preview 当作真实设备／公网验收。

本交接追加提交补齐研究、设计文档、截图证据及 768px 回归覆盖；最终 PR HEAD 与对应 CI 以 GitHub 为准。不得把上述首轮 CI 结果冒充为新 HEAD 的完整发布放行。

## 依赖审计：仍未获得安全放行

2026-11-01 实际执行 `npm audit --json`，结果为：

- Critical：0
- High：5 个受影响包条目
- Moderate：26
- Low：2
- Total：33

原始结果：`docs/evidence/v3/verification/npm-audit.json`。数量是当前包条目，不应沿用旧报告的“6 High / 5 Low”，也不等于五个独立漏洞。

High 的具体链路：

1. `decode-uri-component@<=0.5.0`：`GHSA-qr28-fpjm-wq7f`，特制百分号编码可造成二次复杂度替换和拒绝服务。它经 `query-string` / `expo-router` 链出现；npm 给出的修复指向 `expo-router@58.0.29`，相对当前 SDK 57 是大版本升级。
2. `zod@<4.6.6`：`GHSA-mrhx-c7xc-m3w5`，验证超大受限集合时可能耗尽内存。它同时影响 `@expo/cli` 的工具链审计结果。
3. 五个 High 条目为 `@expo/cli`、`decode-uri-component`、`expo-router`、`query-string`、`zod`，包含上述依赖链的重复影响，不是五份独立 advisory。

未执行 `npm audit fix --force`，未升级 Expo 大版本，未修改锁文件，未声称这些风险已修复。安全后续应在隔离分支评估 Expo SDK 58 兼容升级，或取得上游对齐补丁后重新执行完整双端回归和审计。当前 PR 不是发布安全放行。

## NOT VERIFIED 与剩余阻塞

以下项目没有实际执行，全部 **NOT VERIFIED**：

- 真实 iPhone／Android、iOS／Android 原生构建、真实触摸和系统返回。
- Safari、微信内置浏览器及移动浏览器兼容性。
- VoiceOver／TalkBack／NVDA 等屏幕阅读器和完整无障碍审计。
- 真实麦克风权限、系统通知、系统分享面板和后台 OS 生命周期。
- 签名、TestFlight／应用商店、公开发布及部署。
- 真实用户疗效、复用、付费、临床结果或外部研究门槛。
- 十二套完全独立的长时长课程；既有长时长内容复用关系仍需单独深化。

`npm audit` 的 High 项、默认 Turbopack 环境问题和上述真机／无障碍缺口仍是交接阻塞，不得因视觉和自动浏览器验收通过而省略。

## 审查建议

1. 审查 `c32d423...96cd7c0` 的实现与历史证据，再查看最终交接提交及其独立 evidence 分支中的同 SHA 复验。
2. 优先检查准备页默认值、折叠选项、十二法路由、安全门、真实计时、After-check、存储失败和返回路径。
3. 在干净 Node 22 环境安装锁定依赖并重跑本文命令；补齐真实移动设备与读屏验收后，才能更新对应 `NOT VERIFIED`。
4. 另行处理 Expo 依赖链和长课程内容。不要自动合并 main、部署或把 B/C 档案并入 A。
