# StillMind V3 接管报告（2026-11-01）

## 0. 当前状态：仅供下一执行会话接管

**V3 尚未开始实现。** 本次只完成了已有安全修复的整理、V2 精确基线核验、GitHub 分支准备和本接管报告。

尚未完成：V2 实际运行与逐屏截图、15 个竞品 REA、开源代码 REA、V2 UX 审计、三套视觉方向、V3 设计系统、12 法 V3 交互实现、Web/Expo V3 自动化、V3 Draft PR。

不得把本报告或分支创建记录描述成 V3 产品已经完成。

## 1. GitHub 交付位置

仓库：`williamlovecs/stillmind-inner-cinema`

| 内容 | 分支 | 基线 |
|---|---|---|
| V3 接管报告 | `handoff/stillmind-v3-rea-20261101` | V2 `c32d423c4eaa5e3f263d1679bb78eee0fd181fbd` |
| 已完成 cinema API 安全修复 | `audit/2026-10-31` | main `b4cf885eae5105cb1266d82c040f8ecab7e168b9` |

V3 原始产品分支：`feat/stillmind-experience-v2-20261031`

V2 Draft PR：#5（下一执行会话应重新读取其当前状态，不依赖本报告推断）。

## 2. 精确版本与边界

- V2 目标提交已通过 GitHub API 核实为 `c32d423c4eaa5e3f263d1679bb78eee0fd181fbd`。
- 接管报告分支直接从 V2 分支创建，因此初始指向上述精确 SHA。
- 安全修复分支从 `main` 的 `b4cf885eae5105cb1266d82c040f8ecab7e168b9` 创建。
- **V2 接管分支不包含安全修复提交。** 如 V3 需要该修复，下一执行会话必须检查 V2 对应代码后单独移植并重新测试，不能假设两个分支代码相同。
- 未修改 `main`，未合并 PR，未部署，未创建 V3 实现分支，未覆盖任何现有工作树。

## 3. 已完成并上传的安全修复

问题：原 `POST /api/cinema` 只信任 `Content-Length`。缺少该头的请求可以绕过 4 KiB 限制，在 JSON 解析前没有按实际请求体字节数拒绝。

修复：通过请求体流累计真实字节数；超过 4,096 字节即取消读取并返回 `413 payload-too-large`，然后才允许 JSON 解析。

修改文件：

- `src/app/api/cinema/route.ts`
- `test/api-cinema.test.ts`

已观察的本地证据：

- 修复前新增回归：实际 `200`，预期 `413`，成功复现。
- 修复后 cinema 回归：4/4 通过。
- 仓库已有 10 个测试文件：合计 60/60 通过。
- 补丁已在 pristine `origin/main` worktree 上通过 `git apply --check`。
- 本地修复提交：`0349327c32b4a5e958ca6e360e98fe9bd051ec1d`。
- GitHub 安全修复分支提交：`32d2cd1ee4dda5a46ae796759618649dcb605b89`。

验证边界：未运行完整 typecheck、lint、Next.js 生产构建或移动端原生构建；未调用真实上游模型，未对生产环境做攻击性测试。GitHub 上传后的 CI 状态必须由下一执行会话单独读取。

## 4. 本次 V3 准备实际做了什么

1. 检查原工作区：原 StillMind 工作树干净，位于 `audit/2026-10-31`；当时没有其他工作树。
2. 检查分支和精确提交：GitHub API 返回的 V2 分支 SHA 与用户指定 SHA 一致。
3. 尝试直接 `git fetch`：两次均因 TLS handshake/connect error 失败。
4. 尝试 GitHub codeload 下载精确 V2 tarball：同样因 TLS handshake 失败。
5. 改用已授权 GitHub API 创建上述两个分支并上传交付内容。
6. 在当前可访问工作区按 `*REA*` 搜索，未找到用户点名的完整 `STILLMIND_REA_COMPETITOR_RESEARCH_2026-10-31.md`，因此**没有阅读或声称阅读该报告**。
7. 环境记录：Node `v24.21.0`，npm `11.12.1`；C 盘当时仅剩约 1.1 GB，可成为完整 Next/Expo 依赖安装和构建障碍。

除上述准备外，没有开展 V3 设计或代码工作。

## 5. 下一执行会话必须继续的产品任务

产品使命：StillMind 帮助用户在被念头、情绪或反应冲动带走时，暂停自动反应，通过适当观察练习获得一点选择空间，再回到现实生活。

核心闭环：`Trigger → Notice → Select Practice → Experience → Reflect → Choose Next Action → Return to Life`。

三层产品：

1. Immediate Reset：1–3 分钟、可停止、可跳过、可选择。
2. Practice Development：系统学习和反复练习 12 种方法。
3. Reflection & Learning：基于真实本机记录回顾，不做人格或意识等级评判。

必须保护：Safety Gate、方法资格、原句保护、显式同意、真实有效练习时间、暂停/后台、停止/中止、可跳过反馈、无评分不伪造数据、更不舒服的中性结果、保存失败提示、记录/导出/删除、可选 AI 来源与隐私边界、既有高价值回归。

主要实现对象仅为 A：StillMind 日常练习产品。不得擅自合并 B 潜催复盘工具或 C 古零知识层，不得上传未授权内容。

## 6. 推荐接管顺序

1. 从 V2 精确 SHA `c32d423c4eaa5e3f263d1679bb78eee0fd181fbd` 创建新的 `design/stillmind-rea-ui-v3-20261031` worktree；先检查当时所有工作树和未提交修改。
2. 阅读并遵守仓库 `AGENTS.md`，实际读取 V2 产品文档、12 法规格、V2 交接资料和可访问的完整 REA 报告；缺失就标记。
3. 实际启动 V2 Next.js 与 Expo Web，保存同内容、同 viewport 基线截图，完成 12 法和会话/持久化状态审计。
4. 完成 15 个竞品筛选、8 个深度 REA、7 个定向研究和至少两项额外开源项目审查；证据分级为 OBSERVED / OFFICIAL DOCUMENTED / THIRD-PARTY / INFERENCE / UNKNOWN / NOT VERIFIED。
5. 用同一真实长度中文文案、同设备尺寸制作 Quiet Editorial、Spatial Cinema、Tactile Stillness 三套各五屏方案，保存评分与否决理由。
6. 先把观电影、觉察/呼吸、登出法三个代表场景做成熟，再覆盖其余方法；为 12 法分别建立 Interaction Contract。
7. 表现层可以彻底重建，但不得为采用竞品架构而重写已验证的会话领域系统。
8. 最终所有测试必须指向同一 V3 SHA；保留失败和 NOT VERIFIED，不把浏览器模拟或 Expo Web 冒充真机验收。
9. 仅在独立 V3 分支提交并创建 Draft PR；不自动合并、不部署、不强推。

## 7. 用户任务书中的验收重点

- 研究必须改变设计，设计必须落实代码，代码必须实际验收。
- 不是换皮，不是 12 个小游戏，不把视觉状态伪装成心理效果。
- 首页、方法库、练习、结束、Reflection、设置与再次进入必须形成统一旅程。
- 每个按钮都有真实后果；无后端能力不得伪装为已接通。
- 保存失败、停止、无反馈、更不舒服、重试保存、后台、断网、空数据、大字体和 Reduced Motion 都要验证。
- 保存 V2 Before / V3 After 的同内容、同尺寸证据。
- 真实设备、真人可用性、心理效果、留存和商业验证没有执行时必须保持未验证。
- 用户任务书提到的 V2 CI 与依赖审计数字属于待复核输入；下一执行会话应读取实时检查，不得沿用为当前事实。

## 8. 交接结论

下一执行会话应从 V2 精确 SHA 开始真正的 Phase 0，而不是从本报告继续写概念文档。安全修复可独立审查；V3 产品实现尚未发生。所有完成度判断应以新提交、同版本截图、实际运行日志和 Draft PR 为准。
