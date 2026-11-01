# 当前进度与下一批工作｜2026-11-02

## 2026-11-02 双候选工程收尾

先看 `docs/engineering/CANDIDATE_ACCEPTANCE_2026-11-02.md`，再看旧历史状态。独立干净 Linux/Node22.14 验收基线 `e30ec3c822c14f1cc6f855eba693f7acc471e34a`：标准npm ci、真实依赖消费者/树、完整默认verify:release、Doctor21/21、iOS与Expo Web导出、high审计均通过。基线158单测；加入部署隔离合同后的当前源为160，不能混算。

候选修复分支的 Vercel Git自动部署已用官方 `git.deploymentEnabled` 精确关闭，main保持原行为；同步前已核验配置schema及实际项目根目录。最终同步/云端CI/无新增部署读回以 Draft PR#10 最新head和收尾记录为准，不能引用旧红灯或旧Preview冒充本轮结果。普通audit仍29条moderate/low，不是安全全清。

V4保持独立仓库/路线，新增只测试不部署CI和便携浏览器配置，不合并产品。下一阶段使用 `docs/research/CONTROLLED_CANDIDATE_TEST_2026-11-02.md`；用户目前不能配合手机，真实手机及3–5名成年人测试均未执行。不得把工程验收写成真人或疗效证据。

## 2026-11-01 V3 high 依赖跟进

本节优先于下方上一轮 audit 状态。仅本地修复分支前进，未 push、未合并、未部署；GitHub Draft PR #10 仍在 `51c1d33`。运行代码 `1bf8fc7ceb3919bbaedc2550f33f34030edc72b6`；红测 `8698ef9`。

- 两个 high 是 Zod 根问题和 @expo/cli 传递条目。定向覆盖 CLI 的 Zod 为4.6.7；锁文件仅 Zod 三项变化。Expo57.0.31、CLI57.0.32、RN0.86.3 保持不变，不做强制 SDK 降级。
- 先复现版本/超长约束数组断言失败，再验证9项依赖兼容测试通过，包含真实 Expo plugin/output/MCP schema。范围外的依赖-major override 风险已在报告说明，不能伪称 Expo 官方已支持所有可选集成。
- 默认完整 `npm run verify:release` exit0：158单测、类型/lint/声明与材料门禁、默认 Turbopack、Doctor21/21、iOS/Expo Web 导出。本轮 Web18+10组、Expo Web15组、两端各12法严格A-D状态、两端各4条数据路径全部通过，绑定同一修复代码SHA；关键截图已实际查看。
- 最终high门禁exit0，0critical/0high；普通audit仍exit1，有29包条目（27moderate/2low），不是audit0。执行总脚本因此保留exit1，不隐藏剩余风险。未运行新云端CI，避免 push 触发已连接的 Vercel Preview。
- 详情与本轮最终证据：`docs/engineering/ZOD_HIGH_REPAIR_2026-11-01.md`。真机、权限/授权、签名分发及真实用户验证仍未完成。

## 2026-11-01 V3 定向回归恢复

本节仅覆盖 V3 候选修复分支 `fix/v3-regression-recovery-20261101`，不是 main、V2 Final 或线上状态。基线 `790a591`；运行代码提交 `08c105dbb7f4950809d12db70a6b3834025e126f`。详情及红/绿证据见 `docs/engineering/POST_AUDIT_REPAIR_2026-11-01.md`。

- 四批 Expo Web 暂停回归先在 `704d85b` 复现失败，再恢复所有 Chip 的暂停禁用、可访问性和既有淡化状态；保留 V3 视觉与页面结构。V2 Final 同一严格脚本在 Web、Expo Web 各 12 法通过，非真机证明。
- 仅修复 decoder 0.5.0→0.5.1 及窄锁文件条目，实际 query-string 兼容测试通过；没有重复移植已有 API/SDK 修复。
- 153 项测试、类型、lint、声明检查、Webpack 构建、材料门禁、Doctor 21/21、iOS/Expo Web 导出通过。Web 18+10 组、Expo Web 15 组、两端各 12 法严格状态和各 4 条产品路径通过。没有把分项检查冒充完整默认 `verify:release` 命令通过。
- **audit 仍失败：30 个包条目，0 critical / 2 high / 26 moderate / 2 low**。保留原始告警及 CI 门禁，不称安全发布获准。
- 本轮为独立修复分支和 Draft PR 交付；不自动合并、部署、改动 V1/V2 或 E 盘 canonical。签名上架、内容许可、真机/微信/Safari 与真人效果仍未完成。以下旧历史状态不得作为本轮或线上验收。

先读本页，再看此目录的历史task_plan/progress/findings。旧complete/100%是当时工程或材料准备记录，不是用户验证、内容许可或三个模块都已完成的结论。

## 2026-10-03 Overall debug 与安全 QA

独立本地分支 `review/overall-debug-20261003`，接住 `ec218f3` 和此前 GLM/Codex 成果，复用已有审查 worktree。未推送、未合并、未部署；E 盘 canonical main 与 GLM worktree 保留原状。详见 `docs/engineering/OVERALL_DEBUG_2026-10-03.md`。

- 修复原生设置/历史读取互相牵连、偏好保存失败静默与收藏未捕获异常、部分删除过早重置 UI、提醒回调与删除竞态、分享缓存文件残留、外部链接失败、小屏 onboarding/时长换行和身体落点语义。
- Web 输入、评分和统计同意改为单次消费的原子草稿，写入失败不再串入旧原话/旧同意；手动编辑或选例子后拒绝迟到的语音回调。
- 运行提交 `260dd3b`：新增 12 项单元/契约回归，总计 144 项；完整 release 验证通过，包括类型、lint、Next 构建、Expo Doctor 21/21、iOS/Expo Web 导出。Web 28 组、Expo Web 15 组浏览器回归通过，零未捕获异常；关键手机/桌面截图已实际查看。截图发现的存储失败警告滚出视口问题已修复，并补视口和命中测试，不只检查 DOM 有文字。
- Next 同次线兼容升级至 16.3.8、brace-expansion 分支定向修复、Expo SDK 57 只对齐兼容补丁；没有 SDK 大版本迁移或 audit 强制修复。
- **安全门禁未通过**：此前 audit 0 已过时。本次消除 critical，仍有 braces 和 node-forge 两个上游暂无已发布补丁的 high 根通告。最终默认扫描和显式含开发依赖扫描均为 22 个 high 包条目；中间曾报告 63，保留全部证据，不把统计变化包装成额外修复。保留 audit 失败和 CI 门禁，不称公开发布已获安全放行。
- 不等于十二法最终深课程、B/C 完整交付、真机/屏幕阅读器/真实语音和通知验收；授权、EAS/Apple、种子用户效果和付费证据仍需外部验证。

## 2026-09-19 Codex 独立复核

分支 `review/codex-glm53-20260919`，基于 GLM53 最终提交 `31fe39a`；运行代码提交 `5ff46ca`。未推送、未合并、未部署。详见 `docs/engineering/CODEX_GLM53_REVIEW_2026-09-19.md`。

- 确认 GLM53 主要修复真实存在；未发现新的 P0/P1。
- 补齐提醒设置和单条历史删除的异步失败反馈，修正 Web 导出 URL 生命周期。
- 原生练习去除重复 X/停止入口，秒数降权；Web 补中文系统字体栈。
- `expo-doctor@latest` 的 SDK 57 补丁期望再次漂移，已仅对齐补丁；Doctor 21/21。
- 对运行 SHA `5ff46ca`：`verify:release` 全绿，Web 26 组、Expo Web 11 组 smoke 全绿，audit 0；本轮重新生成并实际查看关键手机截图。
- 真机、EAS/Apple、授权/法律、15 位种子用户和付费访谈仍是外部门槛；没有因为工程绿色而关闭。

## 2026-09-16 深度 QA 轮（GLM53）

分支 `review/glm53-deep-qa-20260916`（自 `ef41838` 的独立 worktree）。未推送、未合并 main、未部署。详见 `docs/engineering/GLM53_DEEP_QA_2026-09-16.md`。

- 修复 6 项 P1：react-native-web Alert 空实现导致 Web 构建上"清除所有本机数据"/单条删除/高危语言危机边界全部静默失效（改为全平台行内提示 + 浏览器确认）；SQLite 打开失败永久缓存（新增 database-opener 重试，node 测试覆盖）；**高危语言检测漏掉最自然求助表述**（"我现在无法保证自己的安全"因"的"字不命中正则、练习照常开始；口语动词同样漏检 —— 由新 native smoke 场景在真机导出上捕获，正则已扩展并测试先行）；smoke-adversarial 缺少 2a2a2a6 同类 owned-server 防护（已镜像）；native smoke 端口冲突即崩溃且不记录被测 SHA（端口可配置 + error 处理 + testedGitSha）。
- 修复 9 项 P2：练习全程无 h1、内观法目录步骤引导在双端都不渲染（现双端可见并有 smoke 断言）、凝视法 web"距上次点击"成绩感统计卡（移除，与 native 对齐为诚实点击数）、内观落点 40px→44px、weekly_review_opened 重复/漏发、首页旧原话残留可被误提交、starting timer 泄漏、方法详情深链时长漂移、导出数据 web 全坏。
- 测试 132 项（基线 127 + 新增 5）；Expo SDK 57 兼容补丁对齐至 doctor 要求（expo 57.0.23 等 3 个补丁，未改大版本）。
- 长时长 3/5/10 分钟仍是同脚本缩放（诚实披露在位，未伪装长课程）；三种高价值方法的阶段结构设计规格已写入 GLM53 报告，**未实现**，实现前需内容授权确认。
- B/C 仍未当作已交付；无真实 iPhone/微信/屏幕阅读器/真实用户验证；内容授权未动。

## 2026-09-12 安全与交互复核

当前本地修复分支 `fix/security-qa-20260912`，运行代码提交 `622e644`（安全依赖/API修复 `c83b9ab`、交互修复 `9e4d02f`、Web预览一致性 `680d98f`、原生单按钮高度 `622e644`）。测试服务归属修复 `2a1a2a6`。未推送、未合并main、未部署，线上版本不能据此视为已修复。

- Next升级16.3.3、sharp升级0.35.4，修复本次新发现的critical/high依赖通告；Expo57只做兼容补丁对齐至57.0.22，未重复SDK迁移。
- 两个公开API增加精确Origin策略、JSON请求约束和实例级总调用预算；仍不是鉴权或跨实例费用上限。CI不再忽略高危audit失败。
- UX05：移除按压驱动的“稳定度”，改成静止低刺激对象及可逆的现实物品引导。这是安全化改编，不是原典错觉图的完整复刻。
- UX07：觉察只记录主动选择，宽恕练习的接触意愿实际改变引导，聚焦使用真实环境物品而非假杯子。没有自动宣称心理效果。
- UX08：首次提示小屏可滚动；语音在隐藏/收起/退出时停止，过期回调不覆盖当前输入。浏览器替身测试不是实麦克风验证。
- UX09：不同长度明确标注复用同一引导、调整停留时长。**独立长课程深度仍未实现**，不能标成全部十二法最终产品级。
- 127项测试、release构建/类型/lint、Expo Doctor21/21及iOS/Expo Web导出通过；随后Web预览文案的小补丁另做构建与浏览器回归。详见 `docs/engineering/SECURITY_QA_2026-09-12.md` 及本轮closeout。

以下2026-09-07内容为历史快照；与本节冲突时以本节及实际提交为准。B/C独立资产、许可和真实用户证据没有因此完成。

## 本地接管更新（2026-09-07快照）

2026-09-07：已从远端核验的 `000e0ae` 创建独立分支 `fix/ux-observer-semantics-20260907`。E盘main和D盘历史工作树均保留在b4cf885，未覆盖、合并或部署。下方工程基准和待办表是交接时快照；本批变更见 `docs/engineering/UX_REPAIR_2026-09-07.md`。

- UX02/03/04/06：已实现第一批一致性修复，Web与Expo共用原句保护和观看对象定义。
- UX01：同一句话的观看构图由用户可逆选择，时间推进不自动选择视角。
- UX08：入口可直接开始，输入/评分及更多反馈可选展开；Web练习去掉重复标题和嵌套框，原生练习保留独立的可滚动内容区及退出控件。尚非所有屏幕阅读器/真机体验验收。
- UX05/07/09：未实施，本轮没有同时重写十二法。
- 本地确有B相关的WakeupHelper源码/发行目录，以及C的抽取语料和knowledge-pack。已确认文件存在，未运行其全量验收、未迁入StillMind、未上传原文；不能再称B/C只有StillMind里的几个页面。
- 用户已清除旧goal，本轮没有重建巨量goal。

## 交接版本快照（非本轮核验结果）

唯一接手分支：`fix/native-integrity-deps-20260906`，Draft PR #3直接对main。运行代码基准`0ba5edf7d46a113762c56e8137725d5241e7659b`；原main`b4cf885eae5105cb1266d82c040f8ecab7e168b9`。

基准CI `33988224046`：119项单元/契约测试，17组Next Web、5组Expo Web浏览器场景通过；类型/lint、构建、Expo Doctor及bundle导出通过，同次audit0。2026-09-07重新读回了PR/refs/Jobs，并重新校验186文件与完整Git tree；没有把新用户测试说成发生。本次只补交接文档；文档提交自己的CI看PR最新Checks。

## 已完成的工程修复（A为主）

| 工作 | 代码/证据入口 | 状态 |
| --- | --- | --- |
| 未评分不填默认值、实际与计划时长、结果中性、跳过反馈 | domain session、Web/native attempt、reset UI、session tests | implemented，基准测试通过 |
| 所有开始入口资格、暂停/后台、过期AI响应取消 | domain routing、Web reset、native session/hook | implemented，基准测试通过 |
| 存储错误可退出、串行写入、删除避免晚写复活 | safe-storage、native storage/serial tasks、AppProvider | implemented，基准测试通过 |
| 真实统计事件、晚同意不伪造开始、撤回取消 | analytics client/sink、events route、round2 tests | implemented，基准测试通过 |
| 模型来源标记、输出校验、字节/超时限制、限流状态容量 | cinema route、server-limits、provider/round2 tests | implemented；不代表真实供应商成功率或完整防滥用 |
| Expo57.0.20 / RN0.86.3、锁文件与scoped兼容处理 | package manifests、patch-query-string-cjs、dependency tests | implemented；不要从旧SDK56红灯重新迁移 |
| CSV缺失/重复/早期暂停、方法周报归因 | seed-user-analysis、domain review、round2 tests | implemented；没有真实15人数据 |
| 内测、权限矩阵、上架前置与旧审计材料 | docs/research、docs/app-store、docs/engineering | 文件已准备，不是外部审批已完成 |

## 新信息：已入档，未自动变为实现

A（历史App1）练习、B（历史App2）复盘、C（古零来源知识层）可独立或组合，见`../../docs/product/MODULES_AND_COMBINATIONS.md`。本仓库Reflection不等于完整B；元数据不等于生产C。保留长期观照/实践方向，不把一分钟入口当全部产品。

## 当前UX状态：实现不等于效果验收

| 优先批次 | 项目 | 验收 |
| --- | --- | --- |
| 已实现一致性修复 | UX02/03/04/06：移除伪百分比、保护原句、自然数息、空输入中性对象 | 本轮语义与浏览器回归；不代表真人体验验收 |
| 已实现首条体验，UX08部分完成 | UX01/08：观电影主体构图可逆；入口、播放器、结束减负 | 保留计时/停止/缺失评分；其余屏幕与辅助技术待验收 |
| 后续按反馈 | UX05/07/09：稳定法按压演示、实际聚焦对象、长时长内容深度 | 不把演示误当心理测量；不将同脚本拉长当丰富内容；不重写12套小游戏 |

原始审阅及实施回执：`../../docs/product/UX_INTERACTION_REVIEW_2026-09-06.md`。本批实现与实际检查结果见`docs/engineering/UX_REPAIR_2026-09-07.md`；未将UX05/07/09或真实效果标为完成。新增3项语义测试，总计122项。

## 阻塞和非工程门槛

内容许可与实际组合/人群；正确链接非开发者态可访问；私密支持渠道；真实Safari/微信/Android；EAS/Apple关联和签名；TestFlight/App Store；真实模型处理与预算；真人复用/付费。详见Issue #2。这些不由文档或测试绿色自动解决。

## 接手完成的定义

Codex能从仓库找到：当前代码、相应历史CI、全部必要设计/进度上下文、待做项、隐私与授权约束、测试命令、旧分支/旧包弃用说明。本轮达到的是交接可执行，不是B/C已交付或全部UX已修好。

第一次接管先核验用户电脑未提交工作及实际分支；遇到本地另有B/C成果先清点保留，禁止用此快照覆盖。之后每一项进度都附提交/测试/未验收内容，而不是再写“所有100%”。
