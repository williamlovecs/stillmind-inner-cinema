# 当前进度与下一批工作｜2026-09-16

先读本页，再看此目录的历史task_plan/progress/findings。旧complete/100%是当时工程或材料准备记录，不是用户验证、内容许可或三个模块都已完成的结论。

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
