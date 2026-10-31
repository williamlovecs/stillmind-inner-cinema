# GLM53 深度 QA 任务计划（2026-09-16）

- 基准：`ef41838769d1eb69d1a1b50bae33f509f3600af8`（fix/security-qa-20260912）
- 工作分支：`review/glm53-deep-qa-20260916`（独立 worktree，不触碰来源分支与 E 盘 canonical main）
- 范围：A（沉寂小我练习）Web + Expo 客户端的深度 QA 与有证据修复。不创建 B/C 服务，不重写十二法，不新增依赖。

## 阶段

1. ✅ 基线核验：git 状态、worktree、依赖安装、127 项基线测试 / typecheck / lint 全绿。
2. ✅ 文档与代码审阅：AGENTS/CODEX_HANDOFF/CURRENT_STATE/MODULES/UX review/SECURITY_QA/UX_REPAIR + 全部核心源码（web 播放器、reset 页、home、API×2、domain session/routing/observation、content catalog、native reset/experience/storage/tabs）。
3. ✅ 分域审计：native 库与状态（子代理）+ 测试/smoke 覆盖（子代理）+ 亲自复验全部 P1 证据。
4. ✅ 修复循环（每步先失败测试，再修）：
   - commit `a40254a` `test:` 复现已证实缺陷
   - commit `403265b` `fix:` native Alert web 失效（数据删除/危机提示/记录删除/提醒反馈）+ SQLite 打开失败永久缓存
   - commit `e983d77` `fix:` web 交互与无障碍（内观步骤引导缺失、body-scan 触控目标、focusMode 缺 h1、wide-gaze 伪指标对齐 native）+ native 对齐
   - commit `3c2bfba` `fix:` QA harness（smoke-adversarial 归属防护、native smoke 端口/SHA）+ DisclaimerModal 焦点陷阱浏览器测试
   - commit `06052b9` `fix:` 高危语言检测漏掉自然求助表述（smoke:native 新场景在导出上捕获；测试先行）
   - commit 5 `docs:` 长时长内容设计规格 + QA 报告 + CURRENT_STATE + closeout
5. ✅ 完整验证 + 浏览器实测（owned 127.0.0.1 服务，testedGitSha=06052b9）+ 截图实际查看。

## 边界（遵守 AGENTS.md 与任务书）

不 push、不 merge、不 deploy、不真实 iPhone/微信、不真实用户、不动内容授权、不把 B/C 当已交付、不写"100% 完成"。
