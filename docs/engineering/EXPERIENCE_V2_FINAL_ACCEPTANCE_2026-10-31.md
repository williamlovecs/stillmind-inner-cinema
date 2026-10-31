# StillMind Experience V2 最终验收与聚焦修复｜2026-10-31

## 结论与边界

本轮从 Draft PR #5 的 `c32d423c4eaa5e3f263d1679bb78eee0fd181fbd` 开始，在隔离分支 `review/experience-v2-final-20261031` 验收现有 Experience V2。新 PR 以 `feat/stillmind-experience-v2-20261031` 为 base，只包含本轮增量。

结论是：十二种方法在本地 Next 生产构建和 Expo Web 导出上均通过进入、真实交互、键盘暂停、暂停冻结、暂停锁定、停止、After-check、stopped 记录落盘及干净重进矩阵；本轮发现的暂停控制遗漏和小屏触控边界问题已做最小修复。未重新生成 Quiet Cinema，未重写十二法，未重复竞品研究。

最终 SHA 以新 Draft PR 顶部为准；最终验收摘要的 `testedGitSha` 必须与本分支 HEAD 一致。本报告不把提交前工作树结果冒充最终提交结果。

**未合并、未部署、未签名、未发布。工程验收通过不等于安全清零、真实设备验收、疗效验证或发布放行。**

## 本轮实际改动

| 发现 | 最小修复 | 保留的边界 |
| --- | --- | --- |
| Native 部分 `Chip` 在暂停时仍可改变方法内容 | 为呼吸显示、凝视位置、身体／环境、登出选择、边界、开放觉察、现实物品、纯文字等遗漏项传入 `disabled={paused}`；共享 `Chip` 显式传递 disabled 状态和样式 | 不改方法 ID、原句、引导语义、计时或停止流程 |
| Web 练习页部分链接边界约 38–40 CSS px | 首页、回到入口、方法库和参与测试链接使用 inline-flex 与最小 44 px 高度 | 不改路由和页面结构 |
| 观电影的空间层次可更安静、清晰 | 仅为 audience／witness 镜头补充银幕边框与克制阴影 | 不移动或改写原句，不增加自动运动，不改 Reduced Motion |
| `decode-uri-component<=0.5.0` 的 DoS 通告 | scoped override 从 `0.5.0` 调至 `0.5.1`，锁文件同步；实际链为 `expo-router@57.0.29 -> query-string@7.1.3 -> decode-uri-component@0.5.1` | 不升级 Expo／Router 大版本，不强制 audit fix |
| 原 V2 smoke 未逐法组合验证键盘、暂停锁定与重进 | 新增 `scripts/smoke-experience-v2-states.mjs`，保留原 smoke 不变 | 使用合成数据、一次性浏览器配置，阻断非本地请求 |

用户原句保护、安全门、同意、真实计时、暂停／停止、离线、本地存储、中性结果与 B/C 研究档案隔离均未改写。B/C 没有集成进本轮 A 产品。

## 十二法逐法验收矩阵

每行两端都实际执行：进入所选方法 → 完成下表交互 → 真实 Tab／Enter 键盘事件与可见焦点检查 → 键盘暂停并观察时钟冻结 → 暂停时用真实鼠标事件或键盘输入尝试修改并断言内容不变 → 继续 → 停止 → After-check → 跳过反馈 → 按 `methodId` 检查本机 stopped 记录 → 重新进入并检查初始状态。不是只检查 DOM 是否存在。

| 方法 | 本轮实际操作探针 | Web | Expo Web |
| --- | --- | --- | --- |
| 观电影法 `inner-cinema` | 切到“退远一点”，确认观众视角且仍是同一句话 | PASS | PASS |
| 呼吸法 `paced-breath` | 自主轻点数息，确认只记录实际次数 | PASS | PASS |
| 觉察法 `thought-watching` | 输入合成念头，隐藏后恢复 | PASS | PASS |
| 凝视法 `wide-gaze` | 切换物体边缘，确认明暗交界提示 | PASS | PASS |
| 内观法 `body-scan` | 从身体接触点改看周围环境 | PASS | PASS |
| 人称替代法 `person-shift` | 输入合成原句与本人亲眼所见事实，确认保留 | PASS | PASS |
| 登出法 `logout-pause` | 选择稍后回应时机，确认现实动作提示同步 | PASS | PASS |
| 宽恕法 `release` | 改变接触意愿再选择暂不处理，确认引导实际改变 | PASS | PASS |
| 合一法 `open-awareness` | 切换纯文字，确认允许不做任何标记 | PASS | PASS |
| 意识聚焦法 `grounded-action` | 改看现实物品，确认无需拍照或摄像头授权 | PASS | PASS |
| 稳定法 `trigger-journal` | 改看身边物品再返回静止屏幕对象 | PASS | PASS |
| 意识抽离法 `anchors` | 拉到更大空间后返回当前房间 | PASS | PASS |

汇总：12/12 方法 × 2 个 Web 运行端通过；8 个新增状态批次均为 `complete: true`、`failures: []`、`externalRequests: []`。原 V2 A–D 八批 Web／Expo Web 也全部通过。

## 小屏、键盘、可读性与动效范围

- 每个方法均在 390×844 和 320×740 CSS px 视口检查；根节点无横向溢出。
- 练习页可见 button／link 的 CSS 边界均不小于 44×44 px；这是对可见边界的自动断言，不是物理触控尺寸或完整 WCAG 审核。
- 每法发送真实 Tab 和 Enter：焦点元素可见、焦点指示非 `none` 且宽度至少 1 px，Enter 可暂停。不是完整屏幕阅读器或全站键盘审计。
- 新状态矩阵统一模拟 `prefers-reduced-motion: reduce`；原 Web smoke 另验证后台暂停计时和 CSS 动画、320 px Reduced Motion 下停止仍可点击。
- 本轮实际查看观电影 390、1440 和 Expo Web 320 截图：原句保持视觉中心，静止银幕光感更克制，停止和暂停保持可见。没有为视觉效果加入强制观看、自动声光或不可中止动效。

## 回归与构建结果

以下均在本轮修复代码上实际执行；最终提交后按同一命令重跑关键浏览器矩阵，摘要以最终 HEAD 绑定。

| 检查 | 结果 |
| --- | --- |
| `npm test` | PASS，148 项测试 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run check:claims` | PASS |
| `npm run build -- --webpack` | PASS，Next 生产构建 |
| `npm run check:release-readiness` | 工程检查 PASS；外部人工门槛继续开放 |
| `npm run doctor:mobile` | PASS，21/21 checks |
| `npm run build:mobile:ios` | PASS，静态 iOS bundle 导出；不是签名 IPA 或真机测试 |
| `npm run build:mobile:web` | PASS，Expo Web 静态导出 |
| `node scripts/smoke-web.mjs` | PASS，18 组 |
| `node scripts/smoke-adversarial.mjs` | PASS，10 组；含离线、异常输入、存储失败和 320 px 停止 |
| `npm run smoke:native` | PASS，15 组 Expo Web 场景 |
| `npm run smoke:product:web` | PASS，4 组收藏、真实 Session、导出和删除路径 |
| `npm run smoke:product:native` | PASS，3 组收藏、真实 Session 和导出路径 |
| 原 `smoke-experience-v2.mjs` A–D × Web／Expo Web | PASS，8/8 批次 |
| 新 `smoke-experience-v2-states.mjs` A–D × Web／Expo Web | PASS，8/8 批次，12/12 方法 |
| `npm run test:dependencies` | PASS，3/3；含 UTF-8、数组、异常编码与 xcode UUID 契约 |

早期一次 `npm run smoke:web` 组合命令在所有场景已打印 PASS 后触发外层 300 秒封装超时，因此未计作完整成功；随后将 `smoke-web.mjs` 与 `smoke-adversarial.mjs` 分开运行，两者均正常退出并通过。这是测试封装问题，不记作产品功能失败。

原始本轮日志位于本机被忽略的 `artifacts/v2-final-20261031/`；各浏览器 `summary.json` 记录通过项、异常、外部请求和 `testedGitSha`。失败历史日志不作为最终通过证据。

## 依赖风险核查

### 数字口径

交接文档中的 6 High／5 Low 是较早快照。本轮在同一代码起点重新执行 `npm audit --json`，基线为 **5 High／2 Low／26 Moderate／0 Critical，共 33 个受影响包条目**。定向 decoder 补丁后为 **2 High／2 Low／26 Moderate／0 Critical，共 30 个包条目**。

这些是 npm 按依赖传播列出的包条目，不是同等数量的独立 advisory，也不是已复现的产品攻击。

### 已安全处理

- 清除 `decode-uri-component` 的 GHSA-qr28-fpjm-wq7f 告警：`0.5.0 → 0.5.1`。
- `npm ls` 确认安装树实际使用补丁版本；依赖契约 3/3 通过，完整构建及双端回归通过。
- 没有使用 `npm audit fix --force`，没有关闭审计或降低 CI 严重级别。

### 未强行处理及原因

- 两个 High 包条目是 `@expo/cli` 与 `zod`，共同指向 `zod@3.25.76` 的 GHSA-mrhx-c7xc-m3w5（ oversized constrained collections 可造成内存耗尽）。
- 实际链包括 `expo@57.0.31 -> @expo/cli@57.0.32 -> zod@3.25.76`，以及 `eslint-config-next@16.4.3 -> eslint-plugin-react-hooks@7.1.1 -> zod@3.25.76`。不能用未经验证的 Zod 4 强制覆盖假装兼容修复。
- Low 包括 `deepmerge@4.3.1` 的 GHSA-gcqx-w48m-w2h4 及受影响的 Expo local build cache provider 包条目。
- Moderate 主要沿 Expo／ESLint 的 `glob`、`minimatch` 等工具链传播。npm 推荐的部分 `fixAvailable` 指向 Expo、Router、ESLint 的不兼容大版本变化；本轮未为清零而破坏 SDK 57／RN 0.86.3 或 lint 工具链。

`npm audit` 继续以非零状态作为剩余风险信号，发布门禁不因此获得安全放行。后续应在上游发布兼容补丁后单独升级并重跑完整矩阵。

## 截图证据

截图来自本轮真实本地运行，全部使用合成输入，不是营销图或真实用户数据。

- [观电影 Web 390 px](evidence/experience-v2-final-20261031/observer-audience-390.png)
- [观电影 Web 1440 px](evidence/experience-v2-final-20261031/observer-wide-1440.png)
- [观电影 Expo Web 320 px](evidence/experience-v2-final-20261031/inner-cinema-expo-320.png)
- [呼吸法 After-check · Expo Web](evidence/experience-v2-final-20261031/paced-breath-after-check-expo.png)
- [觉察法 After-check · Web](evidence/experience-v2-final-20261031/thought-watching-after-check-web.png)

## 剩余阻塞项与 NOT VERIFIED

1. **依赖风险未清零**：最终仍为 2 High／2 Low／26 Moderate；不称安全放行。
2. **真实设备 NOT VERIFIED**：未在真实 iPhone／Android／Safari／微信上运行；Expo Web 与 CSS px 模拟不等于真机。
3. **真实触摸 NOT VERIFIED**：本轮鼠标、键盘和 CSS 边界检查不等于手指触控、手势冲突或系统字体放大验收。
4. **辅助技术 NOT VERIFIED**：未实际运行 VoiceOver、TalkBack 或其他屏幕阅读器；焦点与语义检查不是完整无障碍认证。
5. **签名与发布 NOT VERIFIED**：未做 EAS 登录／项目关联、Apple Developer 签名、TestFlight／App Store 或公开部署。
6. **外部产品与法律门槛仍开放**：法律与内容权利审查、15 名种子用户、复用／效果、付费访谈仍需各自真实证据。
7. **长课程深度未扩写**：3／5／10 分钟仍复用既有引导并调整停留时长，不是十二套独立长课程。
8. **B/C 未集成**：本轮没有将研究档案或概念原型变成生产服务，也没有验证其内容权利。

## 交接

审查者可在独立工作树检查本 PR 相对 `feat/stillmind-experience-v2-20261031` 的增量。先阅读本报告，再审查源码与新增状态矩阵；不要合并 B/C 归档，不要把工程绿灯当作发布授权。若继续设备验收，沿用本报告的十二法矩阵，在真实 iPhone 上补录触摸、系统字体、VoiceOver、后台／恢复与停止可达性结果。
