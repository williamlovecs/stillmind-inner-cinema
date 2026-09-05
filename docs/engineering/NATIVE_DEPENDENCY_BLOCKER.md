# 原生依赖阻塞记录｜历史问题与当前处置

## 当前结论

原有 Expo56/Hermes、版本不匹配与npm通告问题已在独立 `fix/native-integrity-deps-20260906` 分支处理，不再仅留一张待办。main没有升级。完整集成结果以PR #3的最新Checks为准；人工真机和正式发布仍未完成。

依赖验证运行 https://github.com/williamlovecs/stillmind-inner-cinema/actions/runs/33983507595 ：候选完整 verify:release 与 Web Chromium 回归通过，随后仅两个package.json与lockfile被写回分支，提交3b024f3d069f5f2c1b4e1f102b88ab9273939535。

目标Expo57.0.20、RN0.86.3，其余按已发布SDK manifest对齐；使用clean安装与dedupe，没有ignore Doctor或force升级。该次after-audit.json所有级别均为0；完整报告 artifact9974524732。0项通告不表示产品或全部供应链绝对安全。

两个scoped override及query-string CJS/ESM桥接有实际调用回归测试；详见 NATIVE_REPAIR_2026-09-06.md。一次性可写CI已移除，不保留自动维护写权限。

## 历史记录（不要当成当前结论）

先前 a99a0f9 / run33979627992：83项测试、类型、lint、Web构建和仓库检查通过；Expo Doctor20/22，失败为SDK56/Hermes内存回归警告和11个patch版本不匹配。npm audit当时23项受影响包（16 moderate、7high）。依赖链会重复计数，不等于23个独立可利用漏洞。

迁移中曾发现旧peer graph安装冲突、重复原生模块，以及decoder0.5的ESM导出与query-string7的CJS调用不兼容；分别通过干净求解、dedupe和仅导入层的桥接解决，没有弱化原检查。

## 仍需确认

真实设备、签名build、用户允许的线上模型调用、内容许可和发布批准不由依赖检查替代。继续看 Issue #2 与 CODEX_HANDOFF.md，不要凭这个历史文件重复降级回SDK56或把bundle导出当作上架。
