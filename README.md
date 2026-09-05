# StillMind: Inner Cinema

StillMind 是一个非临床的日常自我观察练习原型，提供短时暂停、注意力与视角练习。不保证缓解效果，不诊断、治疗或替代现实中的支持。

## 当前实现

| 能力 | Web | Expo 原生端 |
|---|---|---|
| 入口 | 可选文字/语音、可选1–5自评 | 可选文字/键盘听写、可选1–5自评 |
| 方法选择 | 本地规则，手选/URL也检查资格 | 共享资格检查，等待偏好和引导加载 |
| 三幕内容 | 本地preset + 输入摘录，不调用模型 | 手动开始且启用可选AI才调用；direct仍离线 |
| 方法库 | 12种方法与原素材保留 | 共享内容目录 |
| 会话 | 实际/计划时长、暂停、中止、缺失评分、可选反馈 | 对齐以上语义，取消过期生成、顺序化存储 |
| 发布 | 独立修复分支，未合并main | SDK57依赖验证不代替签名安装与真机 |

画面变化不是测量人的入戏度、稳定程度或真实呼吸。没有评分不等于无变化，结束不意味着有效，中止不要求填写反馈。

## 运行

```bash
npm ci
npm run dev
```

打开 http://localhost:3000 。本地配置可复制 .env.example 为 .env.local，不提交密钥。Web默认练习无需模型密钥。

```env
STEPFUN_API_KEY=
STEPFUN_MODEL=step-3.7-flash
```

原生可选AI通过服务端接口；不要把这个能力写成Web每次实时生成。

## 验证

```bash
npm run test
npm run verify:release
npm run smoke:web
npm run smoke:native
npm audit
```

浏览器回归要求Node22、Chrome/Chromium和预先构建。Web smoke使用Next production build；native smoke使用真实Expo Web export，均不调用付费模型或用户私密内容。它们不是实际iPhone/微信、签名安装或效果试验。

Expo57.0.20 / RN0.86.3的锁文件已独立验证。临时可写CI已删除，常规CI只读。两项scoped overrides和query-string导入桥接由真实调用测试覆盖，详见工程文档。npm audit无通告不表示绝对安全。

## 开发交接

当前入口：[CODEX_HANDOFF](docs/engineering/CODEX_HANDOFF.md)，分支 `fix/native-integrity-deps-20260906`，PR #3（包含PR #1）。

- [Web审阅](docs/engineering/AUDIT_2026-09-06.md)
- [原生修复与依赖说明](docs/engineering/NATIVE_REPAIR_2026-09-06.md)
- [历史依赖阻塞与当前处置](docs/engineering/NATIVE_DEPENDENCY_BLOCKER.md)
- [人工/外部门槛](docs/HUMAN_GATES.md)
- [部署说明](VERCEL_DEPLOY.md)
- [邀请文案](INVITATIONS.md)

原始main仍独立保留，不自动合并或正式发布。Actions source-handoff包含真实源码、SHA256 manifest和相对原main/PR1的补丁。不要使用之前仅含说明的旧候选ZIP。

## 数据与内容边界

隐私、条款及支持页面应与实际处理一致。浏览器/键盘语音可能使用第三方云识别，不能统一宣传为完全本机。分析分享自愿，不发送原话或自由反馈。

来源边界文档不是权利人的许可。版权、发布主体、可用支持渠道、真机、EAS/Apple签名、真人体验需分别确认；不能以脚本通过或文件数量代替。
