# Codex 接手说明｜会话与证据一致性修复

## 先看结论：Web 已有回归证据，完整发布仍被阻塞

基准 main：`b4cf885eae5105cb1266d82c040f8ecab7e168b9`。
工作分支：`fix/audit-session-integrity-20260906`，Draft PR #1。
本次未合并 main，未主动执行生产发布。GitHub/Vercel 集成会自动建立 PR Preview；不能把“没有主动发布”误写成“没有任何部署”。

保护原代码指的是保留 main 与可审阅分支、保留目录/资产/原有能力，并不表示分支零修改或风险为零。此前分支已修改 Web 会话实现并提取播放器；本轮续做只增强浏览器回归和交接，不另起 UI 方案，不改依赖版本或 lockfile。

## 已核验的证据

| 对象 | 证据与结果 |
|---|---|
| 单元/契约测试 | 83项（原有59 + 新增24）在 run 33979627992 中通过；当时Web/domain/content/mobile类型检查及Web/mobile lint也通过 |
| Web生产构建 | run 33981756042 的独立 Web job 通过 |
| 扩展浏览器回归 | 分支 head `f2bca3bd065884d9efa307aebc565939b88adaa6`，run 33981756042，job 101348104375：10组场景全部通过 |
| 精确被测 checkout | `014b54a9057afaba170009ef30e2e1f877860e68`，GitHub 的临时PR合并测试提交，不是实际合并main |
| 浏览器证据 | artifact `web-smoke` / 9973980090；result.json.complete=true；browserErrors=[]；10张中文截图及合成事件记录 |
| 完整发布检查 | run 33981756042 的 Verify release readiness job 失败，不能标记 release ready |
| 原生bundle | 同轮失败后的iOS/Web导出证据采集步骤通过；这不是签名安装包/真机/TestFlight证据 |
| 依赖与原生阻塞 | 见 NATIVE_DEPENDENCY_BLOCKER.md 和 Issue #2；之前Doctor报告Hermes内存回归与11个Expo包patch不匹配，npm audit报告23个受影响包（16 moderate / 7 high） |

日志与证据：
- https://github.com/williamlovecs/stillmind-inner-cinema/actions/runs/33981756042
- https://github.com/williamlovecs/stillmind-inner-cinema/actions/runs/33981756042/artifacts/9973980090
- https://github.com/williamlovecs/stillmind-inner-cinema/actions/runs/33979627992
- https://github.com/williamlovecs/stillmind-inner-cinema/issues/2

以上结果只对所列SHA/运行成立。本文所在后续文档提交可能再次触发CI，以最新PR结果为准。当前作者容器DNS无法解析GitHub raw地址，完整依赖安装/构建/浏览器测试使用GitHub CI，不冒称在作者容器完成整仓构建。

## 本轮新增浏览器验证具体做了什么

1. 首次打开direct链接，在使用边界确认前不开始；停止后可跳过反馈。
2. 空输入与未选评分保持缺失；暂停不计活跃时间；约8秒停止不记录成60秒完成。
3. 手动/URL的高强度限制与呼吸偏好不能绕过最终开始检查。
4. 自然60秒结束先保存完成状态，再接可选反馈；2→4进入更差结束页，不建议立即重练。
5. 默认开始、停止及反馈均不发送产品分析请求。
6. 真正切换Chrome标签页（未伪造document.hidden）触发后台暂停，计时与CSS动画暂停；返回后仍需主动继续。
7. 开始前同意后发送3个真实开始事件；客户端路由离开只产生1个abandoned结束事件，与开始共享随机session_id。
8. 练后才同意只发送1个反馈，不补发开始；未答评分/复用意愿为unreported，未选择行动为空。该轮记录的5个网络事件全为合成测试数据。
9. 12个方法详情链接保留；390/1440宽度主页与选择页无根级横向溢出，不带direct参数浏览时不自动开始。不能据此推断所有内部布局都完美。
10. 模拟localStorage写失败，仍可停止、结束，并显示未保存。

截图已查看：主页、后台暂停、中止未评分、变差结束以及桌面选择页可读。截图确认不是用户满意度证明，仍有长标题换行与探索页文字密度可改；不因审美意见继续重构主流程。

## 已实现的修复及真实能力边界

Web：去除被称为入戏度/稳定度的动画假测量及固定身体感觉；评分可缺失；中止/变差/未评分分别结束；反馈可跳过；实际/计划时长分开；存储失败仍能退出。首页可不输入，语音提示可能由浏览器云端识别。

时钟与记录：`packages/domain/src/session.ts`为纯函数；`src/lib/practice-attempt.ts`负责开始/结束/反馈的幂等记录，不在React state updater里发送事件。`src/lib/safe-storage.ts`处理存储失败。后台返回不自动继续，动画与子交互同步暂停。

遥测：默认关；开始前同意才发真实start/end；晚同意不补分母；随机session_id只关联同次尝试，不含原话/自由反馈。202+accepted:false不当入库成功。客户端请求被观察到不等于生产分析服务已存储数据，本次未接生产PostHog。

Web主练习仍为本地规则与离线脚本，不调用大模型。原生手动观影的可选AI路径与Web不同；本分支仅调整原生客户端等待预算并增加provider模拟测试，没有证明真实生产模型调用成功率。没有花费真实模型token。

保持12种方法、现有素材、公有路由和原提供方。没有因工程检查通过就自动获得内容授权、科学有效性证明或临床安全认证。

## Codex 接手步骤

先查看 `git status`，保护未提交修改。不要reset --hard、覆盖main或自动合并/发布。先读AGENTS.md、本文、AUDIT_2026-09-06.md、NATIVE_DEPENDENCY_BLOCKER.md和PR/Issue中的最新证据。

```bash
git status
git fetch origin
git switch fix/audit-session-integrity-20260906
npm ci
npm run test:audit
npm run verify
npm run smoke:web
npm run verify:release
```

无本地分支时用 `git switch --track origin/fix/audit-session-integrity-20260906`。`smoke:web`需先构建Web、Node22及Chrome/Chromium；可用CHROME_BIN指定。截图/结果在artifacts/web-smoke，不能把合成测试写为真人反馈。

先分别运行Web验证再跑完整release，避免原生阻塞使你误以为Web没有被测过。完整release的失败不豁免、不隐藏；不用npm audit fix --force，也不通过忽略Doctor检查来变绿。

## 下一阶段仍未完成

- 原生依赖迁移：另开从当前修复成果派生的依赖维护分支，核实当前官方Expo/RN/Hermes迁移与安全通告，更新匹配版本和lockfile，再完整验证。日志建议的版本不是已批准升级方案。
- 原生播放器同类一致性修复：手动入口资格、评分来源、实际时长、中止/变差文案、视觉假测量；不要认为Web修复自动覆盖原生。
- iPhone Safari、微信内置浏览器、Android Chrome真机：键盘、语音、前后台、减少动效、退出、首次弹窗。当前Chromium为production测试，未覆盖development StrictMode重放，不宣称全平台回归通过。
- 真实AI端到端检查须在授权环境使用无隐私合成输入；日志不打印密钥；当前Web离线是能力事实，不为Agent标签强接模型。
- F08的主体验视觉素材位置仍待实际任务观察；目前素材有些只在预览中，不能宣传成完整电影生成。
- 版权授权、发布主体、有效私人支持渠道、Apple/EAS签名、TestFlight/App Store审核及真实种子测试仍由负责人确认。
- 老记录可能含默认评分/计划时长，不与新协议混算。一次评分下降不是因果效果证明；没变化、更差、中止、未回答、是否再用同样保留。

## 不再改变的约束

不强迫回忆或输入烦恼；不把不适解释为有效；不把停止解释成需要继续；不把动画数值冒充人的状态。保持1–5量表。公开仓库不放私人聊天、访谈原话、版权原文或凭据。可以透明表达灵修方向，但不保证觉醒，不假称得到授权。
