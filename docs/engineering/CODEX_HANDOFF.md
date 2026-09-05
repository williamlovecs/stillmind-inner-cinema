# Codex 接手说明｜Web + 原生会话修复与依赖维护

## 唯一接手入口

继续分支 `fix/native-integrity-deps-20260906`，Draft PR #3。它包含 PR #1 的完整 Web 修复，PR #3 现在直接以 main 为 base；不要再合并已分叉的 PR #1 或已关闭的 PR #4。

- 原始 main：`b4cf885eae5105cb1266d82c040f8ecab7e168b9`。
- Web 修复基准：`cfbbac68a4bb56b7f2fec8019bf34c832fc9dd68`，PR #1。
- 依赖验证后提交：`3b024f3d069f5f2c1b4e1f102b88ab9273939535`。
- 原生修复代码：`90cb8e01e8099f9db307a04cf4f8a04c8a42d58d`，最终状态须看最新 CI；不要以本文存在代替测试结果。

本轮未合并 main，未主动发布生产。GitHub/Vercel 自动 PR Preview 不等于正式发布。保护原代码指保留 main、可审阅分支与回退路径，不代表修复分支零改动或零风险。

此前聊天中的 `StillMind_Session_Trust_Candidate_20260906.zip` 实际只有交付说明，不是代码包，请弃用。真实代码以本分支和 Actions 的 `source-handoff` 为准；该包带源码逐文件哈希和相对原 main/PR #1 的补丁，不含 node_modules、密钥或字体文件。

## 第二轮新增入口

先读 `ROUND2_REVIEW_2026-09-06.md`；新增API边界、非法评分、周报归因、统计撤回和内测分析修复。此轮结果必须以最新head的CI为准，不能沿用6b944e6的100项通过。

执行材料：`docs/research/SEED_TEST_LAUNCH_PACK_ZH.md`、`CONTENT_RIGHTS_MATRIX.md`、`docs/app-store/PREFLIGHT_2026-09-06.md`。版权/真人/账号门槛仍未完成。

## 已做什么

Web 修复保留在 PR #1：可选评分、去伪测量、实际时长、暂停和后台控制、所有入口资格检查、中止/更差中性结束、存储失败退出、真实且自愿的生命周期事件。保留12种方法、原有图片、主路由和风格。

原生端已接入同类语义：可选评分、实际/计划时长、停止/放弃、顺序化保存、删除防止晚写复活、未选行动不预填、独立主观反馈、统一开始检查、AI取消与过期响应抑制、准确生成时长、实际分镜显示、暂停一致性与减少动效。详见 `NATIVE_REPAIR_2026-09-06.md`。

依赖按正式 SDK57 清单迁移到 Expo57.0.20 / RN0.86.3。验证后的锁文件通过 clean npm ci；npm audit 在验证运行中为0项。两项 scoped overrides 和 query-string ESM桥接的理由/移除条件见原生修复文档。不要运行 audit fix --force，不要把 audit0当成安全证明。

一次性依赖写入工作流和迁移脚本已删除。常规CI只有 contents:read；安装/构建不接触模型、Apple或部署密钥，不自动更新代码。

## 证据在哪里

- 依赖候选完整验证：Actions run 33983507595；候选 job 与唯一写入 job 均通过，artifact `native-dependency-evidence` / 9974524732。
- 原有 Web 扩展浏览器证据：run33981756042，10组；后续需在新依赖下重跑。
- 集成修复首次运行33984301878中100项测试通过，但新增 contentVersion literal 类型未同步导致 typecheck失败；修正为1.0.0/1.1.0显式版本并重跑，不能把该次失败写成通过。
- 最新集成运行见 PR #3 Checks，源码快照/manifest中的head必须与所引用的运行一致。
- Chromium 实际执行 Next production UI 与 Expo Web export UI；后者不是签名iOS/App Store/真机证明。

## 验证命令

先确认用户工作目录没有未提交修改，不要 reset --hard 或覆盖。首次取分支用 `git switch --track origin/fix/native-integrity-deps-20260906`；本地已有则 `git switch fix/native-integrity-deps-20260906`。

```bash
git status --short
git fetch origin
npm ci
npm run test
npm run verify:release
npm run smoke:web
npm run smoke:native
npm audit
```

浏览器回归需要 Node22 + Chrome/Chromium，可用 CHROME_BIN 指定；先完成构建。原生浏览器读取 `.expo-ci/web`，只用合成数据并阻断非本机请求。测试报告/截图只存 artifacts/ 或 Actions，不提交参与者信息。

## 合并前必须保留的人工门槛

1. iPhone Safari、微信内置浏览器、Android Chrome 的打开、键盘、语音、布局、停止、后台和减少动效测试。
2. Expo/EAS项目关联、Apple签名preview安装与真机验证、TestFlight/App Store审核。
3. 真实可选StepFun端到端调用（用户主动许可与已有服务端凭据）；模拟provider测试不是线上成功率，不打印key，不发私人材料。
4. 版权许可、发布主体、有效支持渠道和真实种子用户反馈。前后分数下降不是因果效果证明；无变化、更差、退出、未评分也应记录。
5. 用户明确同意后再审查合并/部署；不要自动merge任何PR。

## 不要再反复重做

不改产品方向、不强加多Agent、不扩方法库、不重新设计一套UI。没有填写不等于零/无变化；默认推荐分不能当自评；画面百分比不能叫心理测量；选行动不等于做完。默认/direct练习离线，不能宣传成每次都实时调用模型。不要隐藏真实灵修意图，也不要宣称保证效果或默认已获内容授权。
