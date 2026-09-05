# StillMind: Inner Cinema

StillMind 是一个非临床的日常自我观察练习原型。产品提供短时暂停、注意力与视角练习；不保证缓解效果，不诊断、治疗或替代现实中的支持。

## 当前实现（Web 与原生端请分开看）

| 能力 | Web | Expo 原生端 |
|---|---|---|
| 主入口 | 可选文字/语音、可选 1–5 自评 → 一分钟练习 | 独立原生入口 |
| 方法选择 | 本地规则，手动/URL 同样做开始资格检查 | 共享推荐逻辑；最终入口对齐仍需复核 |
| 三幕内容 | 本地 preset + 输入短摘录，不调用大模型 | 手动开始的观影法可在用户启用 AI 后调用模型；direct 路径仍离线 |
| 方法库 | 12 种方法保留；初次推荐限定核心集合 | 共享内容目录 |
| 记录 | 本机尝试、实际/计划时长、可缺失评分、中止及可选反馈 | 本地记录、回顾；原生结果/时长语义仍需同类审计 |
| 发布状态 | 本分支需 CI、浏览器回归与人工验收后再合并 | Expo 导出不是签名安装包；真机、TestFlight、App Store 待人工门槛 |

视觉参数只描述画面，不测量人的“入戏度”、稳定程度或实际呼吸。没有评分不等于“无变化”。结束不意味着有效，中止也无需填写反馈。

## 本地运行

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000`。复制 `.env.example` 为本地 `.env.local`；不要提交密钥。

```env
STEPFUN_API_KEY=
STEPFUN_MODEL=step-3.7-flash
```

Web 默认练习无需模型密钥。服务端 API 与原生可选调用点不能混称为 Web 每次实时生成。

## 验证

```bash
npm run test:audit
npm run verify:release
npm run smoke:web
```

`smoke:web` 使用 Node 22 原生 WebSocket 和本机 Chrome/Chromium，运行本地 production build；不访问公开部署或真实模型。先完成 `npm run build`。`CHROME_BIN` 可指定浏览器路径；浏览器不存在会明确失败，不伪报通过。

CI 会运行原有发布检查以及新增浏览器回归。绿色检查不是医疗效果、授权、真实 iOS 安装或市场验证的证明。

## 开发交接

- [Codex 接手说明](docs/engineering/CODEX_HANDOFF.md)：本次修复、验证结果位置、人工门槛、剩余工作。
- [工程审阅记录](docs/engineering/AUDIT_2026-09-06.md)：F01–F13 及落实范围。
- [原有部署说明](VERCEL_DEPLOY.md)
- [原有种子用户邀请](INVITATIONS.md)
- [人工与外部门槛](docs/HUMAN_GATES.md)

本次修复基于 `b4cf885`，在 `fix/audit-session-integrity-20260906` 分支中审阅。不自动合并 main，不发布正式版本。

## 数据与内容边界

`/privacy`、`/terms`、`/support` 描述实际数据处理。语音识别可能使用浏览器厂商云服务，不等于全本机处理。匿名事件需自愿选择，不发送原话或自由反馈。

相关资料的来源边界文件是内部约束，不是权利人的授权。涉及授权、发布者身份、可运行支持渠道与产品实际体验，仍需负责人确认；不得用检查脚本通过代替这些确认。
