# 交接材料与本地/GitHub一致性核验

核验日期：2026-09-07。范围：本对话可用附件、当前模型工作目录、GitHub指定仓库/分支。未访问William个人电脑的工作树、未提交代码或本地书库；不能据此说那些文件都已上传。

## 1. 已验证代码快照

仓库：`williamlovecs/stillmind-inner-cinema`。PR #3仍Draft/open，直接对main，未合并。接手分支`fix/native-integrity-deps-20260906`。本次开始时head为`0ba5edf7d46a113762c56e8137725d5241e7659b`；main为`b4cf885eae5105cb1266d82c040f8ecab7e168b9`。

重新读取CI `33988224046`的三个Jobs，均success；从本对话的`StillMind_Round2_Verified_20260906.zip`解出186个源码文件，逐个SHA256匹配Actions manifest；按完整文件/路径重建Git tree，结果`d46d8b67a38358a6287bc8e7957d97832c0d07f5`与远端对应提交一致。不是仅核对文件名，也没有把旧的notes-only ZIP当代码。

基准的119项、17+5组浏览器报告、audit0只属于该次运行。此次文档提交会产生新head；其Checks另行记录于PR和最终交付回执。运行源码/锁文件/测试不在本次文档变更范围内。

## 2. 每类材料放在哪里

| 本地/聊天材料 | GitHub接手入口 | 处理方式 |
| --- | --- | --- |
| 第二轮186文件源码包 | 当前分支完整树，非main | 已与原始head整树核对，无需再次提交ZIP/重复代码 |
| 原始审计与两轮修复说明 | AUDIT_2026-09-06、NATIVE_REPAIR、ROUND2_REVIEW | 已存在，保留历史与代码/测试注释；不把旧未修项状态覆盖新状态 |
| 完整StillMind_UX_Interaction_Review_20260906.md | docs/product/UX_INTERACTION_REVIEW_2026-09-06.md | 此次补为受版本管理文件；此前只有PR评论5557451201和聊天附件。内容仍标未实施 |
| App1/App2旧定义、三模块排列组合新信息 | docs/product/MODULES_AND_COMBINATIONS.md | 只上传可公开的结构与边界总结，不复制私人沟通 |
| 当前任务顺序与状态 | .planning/stillmind-complete-product/CURRENT_STATE.md | 新的当前入口；旧日志保留为历史 |
| Codex工程接手、进度、文件地图 | CODEX_HANDOFF、AGENTS、README | 此次对齐读取顺序、权威层级与未完成项 |
| 15人执行包/空模板/付费访谈 | docs/research/SEED_TEST_LAUNCH_PACK_ZH.md及既有模板 | 已存在；本次补组合与人群身份未确认说明 |
| 主持人小抄 | 以上执行包中的照读脚本与随访部分 | 实质内容已在库；本地TXT是便于发送副本，无需另造主版本 |
| 版权矩阵 | docs/research/CONTENT_RIGHTS_MATRIX.md | 已存在；此次补A/B/C组合并非自动授权的说明 |
| 上架复核 | docs/app-store/PREFLIGHT_2026-09-06.md | 已存在；不等于账户/签名/审核完成 |
| 给老师的计划草稿、原简版DOCX、私人聊天 | 仅私密交付/用户原附件 | 不上传原文到公开仓库；必要产品信息由模块文档接住。旧只讲A的草稿不得当最终全项目计划 |
| 书籍PDF、全文知识库、许可凭证、学员文档 | 用户本地/经授权的私密存储 | 明确不在公共源码上传范围；本轮不验证原文内容或许可 |
| CI截图/日志/依赖扫描/旧补丁 | Actions artifacts与本地证据包 | 不重复塞进源码。保留run与SHA；artifact可能到期，源码和摘要仍在Git |
| 旧宣传页、群二维码、现场录音 | 用户原附件 | 不是运行必需文件；不上传私人二维码/原录音，不把海报当最终UI证据 |
| 字体、密钥、环境文件、node_modules | 不上传 | 仅.env.example等无秘密模板保留 |

## 3. 明确不做的错误同步

不能同时套用“相对main”与“相对PR1”的两份补丁；不能用旧候选ZIP覆盖用户工作目录；不能把代码注释中的目标当实施证据；不能把研究层的“internal”字段当作公共仓库的访问控制；不能把B/C未出现在本库理解为用户完全没有其他资产。

`StillMind_Session_Trust_Candidate_20260906.zip`是已弃用的说明包。`StillMind_Verified_Repairs_20260906.zip`的6b944e6基准也不是最新运行代码；第二轮0ba5edf为本次文档交接的父基准。PR #1/已关闭PR #4不用作新的接手线。

## 4. 本次改动界限

只更新Markdown/进度/索引，不修改运行代码、数据schema、依赖、测试、工作流或部署设置。不把UX提案偷偷实现，不批量把其他本地资产发布。新增文件与修改文件的远端提交/tree由本次工具回执和PR记录证明；最新文件清单及SHA256在最终交付包中。

## 5. Codex在用户电脑上仍要完成的核验

读取实际git状态、当前分支及额外worktrees；保护未提交工作；确认本地源文件是否领先/落后于接手head。若存在独立B工具或C知识库，先定位、清点与核验权限，保留原件，不自动推到公共仓库。发现本地变动与此说明冲突时，以具体代码与用户最新说明为准，记录差异而不是强行对齐旧快照。
