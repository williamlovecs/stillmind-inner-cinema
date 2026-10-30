# StillMind Experience V2 工程交接｜2026-10-31

## 范围与分支

- A 产品分支：`feat/stillmind-experience-v2-20261031`。
- A 的实现基线：`4a7826a94966dbf65a2f100884b5b7387231be13`。
- 已完成的阶段提交：`bef384cad2afc53546192be55c261bcd2ee17658`（Quiet Cinema 与 11 种方法）、`d40a86a80cf85af3060284df648fcc7d88acff40`（完整本机产品路径）。
- 最终交接提交以分支 HEAD 和浏览器 `summary.json` 的 `testedGitSha` 为准；不要把未提交工作树测试当作提交测试。
- B/C 归档只读参考：`99af82ded63b311e717e91e756667cbed1239ec8`。没有合并进 A。
- 未推送、未合并 main、未部署、未签名、未调用付费模型。

## 已实现：A 产品

### 设计系统

- 方向：Quiet Cinema；Quiet Editorial 的层级 + Spatial Cinema 的克制空间构图，Tactile Awareness 仅用于按压反馈。
- 共享语义令牌：`packages/design-tokens/src/index.ts`。
- 规范：`docs/design/STILLMIND_DESIGN_SYSTEM_V2.md`。
- Web 语义样式：`src/app/experience-v2.css`、`src/components/ui.tsx`。
- Native 主题：`mobile/src/constants/theme.ts`、`mobile/src/components/stillmind/ui.tsx`。
- 深浅色、低刺激、间距、圆角、动效、触控尺寸、字体策略与 Reduced Motion 已落地；Web 与 React Native 不强行共享视图。

### 11 种新增交互，观电影复用原组件

| 批次 | 方法 | 真实交互 |
| --- | --- | --- |
| A | 呼吸、觉察、凝视 | 自愿数息与纯文字／静态水面；原句输入、标记、撤销、隐藏恢复；中心／边缘／空间构图 |
| B | 内观、人称替代、登出 | 自主选择接触点或环境；保留原句与旁观框架、本人填写事实和回应；隐藏恢复、返回时机、现实动作 |
| C | 宽恕、合一、意识聚焦 | 暂不处理／保持距离／只停止本次重播；主动标记开放注意；纸面整体／对象／细节及现实物品 |
| D | 稳定、意识抽离 | 低刺激视觉／纯文字／现实物品；房间／今天／更长时间／更大空间并返回当前房间 |

共用 Shell 与 registry：`src/components/methods/`、`mobile/src/components/stillmind/methods/`。保留真实计时、暂停、停止、资格、同意、After-check、原句、离线回退和中性结果。没有意识等级、觉醒进度、小我强度或疗效推断。

### 完整产品路径

- Web 方法库：真实类别／时长／收藏筛选，详情 Link 与收藏 button 分离。
- Native 方法库：在类别筛选上增加时长和“只看收藏”，直接使用既有偏好。
- Web／Native 首页：来自真实本机 Session 的最近练习与收藏快捷入口。
- Web `/reflection`：真实 Session + `buildWeeklyReview`，显示方法、次数、本人自报和下次练习；不是 B 的文档复盘。
- Web `/settings`：真实 JSON 导出、明确确认和失败反馈的本机数据清除，只删除显式 StillMind 键。
- Native Reflection 与 Profile 保留既有业务；仅校正偏好说明。
- 存储失败不伪装保存或删除成功；空数据不生成趋势。

主要文件：`src/lib/web-library.ts`、`src/components/MethodLibrary.tsx`、`TodayShortcuts.tsx`、`WebReflection.tsx`、`WebDataSettings.tsx`、`mobile/src/components/stillmind/NativePracticeShortcuts.tsx`。

## 独立官网与 B／C 概念

工作区独立目录：`../stillmind-experience-site`，不在 A 的 Next/Expo 路由中。

- 官网：原创 Quiet Cinema Hero、One thought, three perspectives、12 方法、产品路径、真实 App 截图、隐私／安全、FAQ、SEO／OG、真实本地／配置 CTA。
- B：合成文档入口、事件时间线、原始／整理对照、用户编辑确认、事实／解释／行动／结果分离。没有 AI 分析或 Word 后端。
- C：四条自行编写的合成概念，真实检索与关联、来源和证据状态。没有在线检索、公共 RAG、受保护原文或 `original_excerpt`。
- A+B+C Journey：全部合成，演示同意后才进入 B，C 可跳过，最终回到现实行动。没有账号绑定、生产数据共享或云同步。
- `source_framework` 没有等同于科学验证。

## 验证入口与证据

最终原始日志：`artifacts/experience-v2/logs/`。截图和 JSON 摘要：`artifacts/experience-v2/{web,native}/`。独立站点：`stillmind-experience-site/artifacts/site/`。

```bash
npm run test
npm run typecheck
npm run lint
npm run check:claims
npm run build -- --webpack
npm run check:release-readiness
npm run doctor:mobile
npm run build:mobile:ios
npm run build:mobile:web
npm run smoke:web
npm run smoke:native
npm run smoke:product:web
npm run smoke:product:native
npm audit --json

V2_BATCH=A V2_PLATFORM=web node scripts/smoke-experience-v2.mjs
V2_BATCH=B V2_PLATFORM=web node scripts/smoke-experience-v2.mjs
V2_BATCH=C V2_PLATFORM=web node scripts/smoke-experience-v2.mjs
V2_BATCH=D V2_PLATFORM=web node scripts/smoke-experience-v2.mjs
V2_BATCH=A V2_PLATFORM=native node scripts/smoke-experience-v2.mjs
V2_BATCH=B V2_PLATFORM=native node scripts/smoke-experience-v2.mjs
V2_BATCH=C V2_PLATFORM=native node scripts/smoke-experience-v2.mjs
V2_BATCH=D V2_PLATFORM=native node scripts/smoke-experience-v2.mjs
```

浏览器测试使用本地生产构建／Expo Web 导出、合成输入和一次性浏览器配置。非本地请求被阻断。`summary.json` 记录实际通过项、异常和 SHA；失败历史日志不被当作最终通过证据。独立官网运行 `npm test && npm run build && npm run smoke`。

## 性能与视觉证据

- 方法批次：Web／Native A/B/C/D，390px 主截图和 320px 小屏截图。
- 产品路径：空首页、收藏筛选、最近练习、复盘、设置、320 大字号和 1440 桌面。
- 旧版基线：`baseline-web`、`baseline-native`；同版本结果：各 batch 和 product-paths。
- 前后联系表与独立官网性能记录保存在 artifacts。性能记录不是公网 Lighthouse 或真实用户指标。
- 截图内 Session 和文本均为合成测试数据，不是用户案例。

## 未验证与阻塞

- 没有真实 iPhone／Android／Safari／微信、真实触摸、屏幕阅读器、真实麦克风、OS 通知、系统分享面板或签名发布验收。
- Expo Web 导出不能冒充真机证据；构建通过不能冒充效果、可访问性或内容权利验收。
- 3／5／10 分钟部分脚本仍复用既有引导并调整停留时长；不是十二套独立长课程。
- 当前 Windows 环境的默认 Turbopack 子进程存在 `program not found` 阻塞，因此 Web 生产构建使用 `npm run build -- --webpack`。没有通过关闭门禁掩盖它。
- `npm audit`、Expo Doctor 和 release 门禁以本轮原始日志为准；历史 zero、历史 22 high 或历史 Doctor 结果都不能作为当前结论。不得 `audit fix --force` 或降低 CI 严重级别。
- B／C 不是生产服务；归档中的衍生内容、摘要、来源结构和历史文档仍需专项权利审核。
- 无真实用户疗效、复用、付费或公开背书证据；无公开部署授权。

## Codex 集成

1. 在独立工作树检查此分支，不重置或覆盖其他工作树。审查 `git diff 4a7826a...HEAD`。
2. 只集成 A 分支源码；不要将 `archive/bc-safe-assets-20261031` 合并进 A。
3. 用 Node 22 安装锁定依赖并逐项重跑上述门禁。保留失败输出，尤其 audit、Doctor、Turbopack 和真机缺口。
4. 官网／概念作为独立目录评审；CTA 只在真实公开 URL 或明确本地入口上启用。
5. 经独立代码／语义复核后，再建立 Draft PR。不得自动合并 main、部署或上架。
