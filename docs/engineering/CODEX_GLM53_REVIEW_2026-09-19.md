# Codex 对 GLM53 深度 QA 的独立复核（2026-09-19）

## 结论

GLM53 在 `ef41838..31fe39a` 的主要修复成立：危机边界、数据库打开重试、Web 删除确认、练习语义和 smoke 归属保护均有真实实现与回归覆盖。未发现新的 P0/P1。

Codex 复核仍发现两条未闭合的异步失败路径，以及一处证据记录不一致。本轮已在独立分支 `review/codex-glm53-20260919` 修复，运行代码提交为 `5ff46caf8eacc9315def55d33f7686d37ea37423`。未 push、未 merge、未部署。

## 复核发现与修复

1. **提醒设置失败仍可能成为未处理 Promise。** `profile.tsx` 的提醒开关与时间切换没有捕获通知 API 或偏好持久化失败。现统一捕获并显示行内状态；文案不再错误承诺“本机没有改动”。
2. **单条历史删除失败仍无反馈。** `reflection.tsx` 允许异步删除 Promise 从确认回调逸出。现捕获失败，并明确提示记录可能仍留在本机。
3. **Web 数据导出过早释放 Blob URL。** 现给浏览器一个事件循环开始下载后再释放 URL。
4. **原生练习中 X 与“停止”语义重复。** 练习阶段只保留明确的“停止”；其他非练习页面仍保留关闭动作。秒数保留但降为低对比辅助信息。
5. **中文字体栈未声明。** Web 显式使用苹方、冬青黑、微软雅黑、Noto Sans SC 的系统回退顺序；不引入字体包或网络依赖。
6. **GLM 交付证据并非完全干净。** 原提交在 `.planning/glm53-deep-qa-20260916/progress.md` 留有尾部空白，导致 `git diff --check` 报警；文档提交仍标成未完成。现已修正。GLM 的 smoke 对应运行代码 `06052b9`、最终文档 HEAD `31fe39a`，两者应分开陈述。
7. **Expo Doctor 上游要求再次漂移。** `expo-doctor@latest` 在 2026-09-19 要求新的 SDK 57 补丁。仅对齐 `expo 57.0.24`、`@expo/metro-runtime 57.0.16`、`expo-notifications 57.0.20`、`expo-router 57.0.22`、`expo-sharing 57.0.21` 及相应锁文件解析，未升级 SDK/RN 大版本，也未排除检查。

## 当前运行验证

以下结果对应运行代码 SHA `5ff46caf8eacc9315def55d33f7686d37ea37423`：

- `npm run verify:release`：exit 0；132 个测试块通过，类型、lint、声明守卫、Next 生产构建、release/readiness 检查均通过；Expo Doctor 21/21；iOS 与 Expo Web 导出成功。
- `npm run smoke:web`：exit 0；18 组主流程 + 8 组对抗测试通过，`browserErrors=[]`。
- `npm run smoke:native`：exit 0；11 组 Expo Web 回归通过；新增断言确认练习阶段不存在重复的“关闭”动作；`failures=[]`，无外部请求。
- `npm audit --json`：0 条通告。
- `git diff --check`：通过。

本轮重新生成并实际查看：

- `artifacts/web-smoke/home-mobile.png`
- `artifacts/web-smoke/practice-mobile.png`
- `artifacts/native-web-smoke/native-home.png`
- `artifacts/native-web-smoke/native-practice.png`
- `artifacts/native-web-smoke/native-web-safety-boundary.png`
- `artifacts/native-web-smoke/native-web-delete-all.png`

另在 Codex 应用内浏览器实际走通首次边界确认、首页与一分钟练习入口。首页焦点单一，练习控制可见；本轮没有把自动化 PASS 代替视觉判断。

## 仍未被工程证明

- 未做真实 iPhone、微信内置浏览器、Android、VoiceOver/TalkBack 或大字号真机测试。
- 未完成 EAS 项目绑定、Apple Developer、签名、TestFlight 或 App Store 提交。
- 未完成内容授权、法律审阅、15 位种子用户、48-72 小时复用验证或至少 5 次付费访谈。
- 3/5/10 分钟仍主要是同脚本时长缩放；不能描述成独立长课程。
- 原生练习屏仍有“步骤编号 / 标题 / 舞台 / lens hint / 指令 / 安全替代”多层信息。截图可用，但是否合并标题与指令应作为种子用户实验，不继续按 AI 审美盲改。
- 高危语言规则只是词法边界，不是危机识别系统、医疗判断或安全保证。

## 边界

本轮没有改 12 法内容、B/C 模块、API 架构、主分支、远端分支或线上部署。工程绿色不等于内容授权、真实效果、安全认证或市场验证完成。
