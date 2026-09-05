# Codex 接手说明｜会话与证据一致性修复

## 先读这个状态

基准 main：`b4cf885eae5105cb1266d82c040f8ecab7e168b9`。
本次工作在 `fix/audit-session-integrity-20260906`，不自动合并 main，不触发正式发布。请先看 PR 的实际检查结果，再做下一步；不要因为文件里写“有测试”就假定通过。

用户要求保护原代码。本分支保留方法目录、12种方法、视觉资产、路径和接口，不重做产品定位、不引入多 Agent、不改模型提供方、不新增依赖。已有 Next.js agent rules 保留。工程审阅见 `AUDIT_2026-09-06.md`。

## 已写入的改动

Web：去除画面假测量和固定身体感觉；评分可缺失；中止/变差/未评分分别结束；反馈可跳过；实际时间与计划时间分开；存储失败仍能退出。首页可不输入，语音提示可能云端识别。手动与 URL 开始路径检查同一套资格和偏好。

时钟和记录：`packages/domain/src/session.ts` 是纯函数；`src/lib/practice-attempt.ts` 负责开始、结束、反馈的幂等记录，不在 React state updater 中做副作用。`src/lib/safe-storage.ts` 处理不可用存储。Web 后台暂停、返回不自动继续；子体验同时暂停。

遥测：默认关；开始前同意才发送真实 start/end，晚同意不补报开始。新的随机 session_id 可关联分母，不含时间或文字。未填用 unreported；不写固定行动为用户行为。202 + accepted:false 不算数据接收成功。

验证：新增 session-integrity、provider 契约、claims guard 回归；CI 追加本地 production build 的 Chromium smoke。原有 verify:release 全部保留。原生端仅调整可选 AI 客户端等待预算，尚未把所有 Web 行为镜像过去。

## 如何继续

先确认本地没有用户未提交修改。不要 reset --hard，不要覆盖 main。

```bash
git fetch origin
git switch fix/audit-session-integrity-20260906
npm ci
npm run test:audit
npm run verify:release
npm run smoke:web
```

没有本地分支时使用 `git switch --track origin/fix/audit-session-integrity-20260906`。`smoke:web` 需要已构建的 Next 项目、Node22 和 Chrome/Chromium（可用 CHROME_BIN 指定）。本地截图/日志在 artifacts/web-smoke，不提交。CI 对应 artifact 名为 web-smoke。

作者环境不能连接 npm/GitHub 下载地址，完整依赖和构建由 PR CI 执行。本地针对性测试使用全局 TypeScript 转译和基准目录旗标快照；它们不是整仓集成测试。以 CI 的实际通过/失败日志为准。不要对外说“真机通过”或“真实 StepFun 成功率已验证”。

## 合并前人工验收

| 场景 | 验收 |
|---|---|
| 新浏览器 direct URL | 使用边界确认前不开始倒计时 |
| 空输入/未评分 | 可练；默认推荐值不保存为自评 |
| 约8秒停止60秒练习 | stopped；实际约8秒，计划60秒；可不反馈离开 |
| 暂停/切后台 | 数字、子交互、动画停止；主动继续才恢复 |
| before2/after4 | 更差结束；无“已经变好/获得观察位置”暗示 |
| 手动 inner-cinema + activation5 | 与目录限制一致，不开始 |
| 避开身体/呼吸或偏好睁眼 | 不被 URL 或选择方法绕过；允许退出或调整时长 |
| storage 写失败 | 结束与返回正常，提示未保存 |
| 未同意分析/晚同意 | 无提前请求/无伪造 start 分母；不发送原话和自由反馈 |
| 方法库和历史 | 原有目录/资产/旧记录可用 |

## 剩余任务，不要标已完成

1. iPhone Safari、微信内置浏览器、Android Chrome 的真实打开/键盘/语音/布局/减少动效/后台恢复。Chromium smoke 不能替代。
2. 原生 reset 与 MethodPracticeExperience 同类审计：手动资格、预填结果、实际时长、停止结束文案、fake visual metrics；把共享纯函数接入后另做真机 QA，不盲目复制整页。
3. 可选 AI 真实端到端测试（需用户同意及现有服务端环境），记录来源/失败/延迟；不要使用用户私人内容或打印密钥。Web 仍离线，不为名字强加调用。
4. F08 视觉素材在真实主路径中的位置仍是设计假设，等用户任务观察再决定，不继续加/删卡片互相覆盖。
5. 版权许可、发布主体、可用支持邮箱、Apple/EAS签名、TestFlight/App Store审核、真实种子反馈仍属人工门槛。
6. 一次前后自评分下降不是因果有效性证明；把无变化、更差、退出、未回答一并记录。旧记录可能含默认评分/计划时长，不能混算成新协议真实证据。

## 别再改变的约束

不强迫用户回忆或输入烦恼；不把停止解释为失败或继续练习的理由；不把动画百分比写成人的状态。1–5量表保持一致。公开 docs 不放私人聊天/访谈原话/版权原文/任何凭据。对真实灵修方向可透明说明，但不宣称保证觉醒或得到授权。
