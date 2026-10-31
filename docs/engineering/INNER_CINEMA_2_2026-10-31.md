# Inner Cinema 2.0 实现、验证与 Codex 交接

日期：2026-10-31  
开发分支：`feat/inner-cinema-2-20261031`  
基线：`28b00040eb6cd718a9352804c7b2a105e98ff4da`（`review/overall-debug-20261003` 的已核验指向）  
范围：只升级 A 模块中的观电影法及其 Web 进入／结束视觉；不开发 B／C，不重写十二种方法，不合并 main，不部署。

## 1. 实际基线，而不是沿用旧结论

在修改源码前运行了基线测试、Web 与 Expo Web 浏览器回归并保留截图。基线已经有可逆的银幕宽度变化，不是「只换文字标签」。本次保留这个领域语义，补强画框、地面、座椅和空间层次。

基线证据：

- `artifacts/inner-cinema-2/baseline-verify.log`：144 项测试、双端类型、Lint 和公开声明检查通过。
- `artifacts/inner-cinema-2/baseline-smoke-web.log`：18 组主流程与 10 组对抗回归通过。
- `artifacts/inner-cinema-2/baseline-native-web.log`：Expo Web 导出和 15 组浏览器回归通过。
- `artifacts/inner-cinema-2/baseline-web/`、`baseline-native/`：修改前真实截图。
- `artifacts/inner-cinema-2/baseline-build-node22.log`：Node 22 下默认 Turbopack 构建因子进程启动失败。
- `artifacts/inner-cinema-2/baseline-build-webpack-diagnostic.log`：同一基线 Webpack 构建通过。

基线浏览器回归同时覆盖自然呼吸、念头观察、人称替代、可选输入、暂停停止、同意、中性结果、存储异常、安全边界和十二方法路由。浏览器通过不等于真机或疗效验证。

## 2. 已实现的代码

### Web

- 新增 `src/components/InnerCinemaScene.tsx`：
  - `InnerCinemaVisual` 复用同一银幕、画框、地面与座椅视觉；`InnerCinemaScene` 负责练习中的操作。
  - 角色／观众／见证继续使用共享 `OBSERVER_LENSES`，原句只渲染在银幕中，切换时不改写原句。
  - 保留「近一点／退远一点／再远一点」；支持方向键、Home、End、焦点随选择移动和 `aria-pressed`。
  - 原句区域可聚焦、可滚动；装饰性预览不重复暴露原句。
- 重写 `src/components/observer-cinema.css`：纯 CSS 轻量 2.5D，无 WebGL、无自动镜头；320px 布局、减少动态和增强对比媒体查询、紧凑预览／结束样式。
- 修改 `src/components/ResetPracticePlayer.tsx`：仅观电影分支接入受控场景，保留原有步骤、计时、暂停和停止。
- 修改 `src/app/reset/page.tsx`：观电影进入预览复用观众视角，结束页复用见证视角紧凑场景；不改会话、反馈和路由规则。

### Expo / React Native

- 新增 `mobile/src/components/stillmind/InnerCinemaScene.tsx`：使用 React Native Animated，只改变纵向位置和环境透明度；银幕宽度仍由共享 `OBSERVER_LENSES` 决定。
- 监听 `AccessibilityInfo` 的减少动态设置；读取失败时采用无动画；暂停时停止当前动画。
- 修改 `mobile/src/components/stillmind/MethodPracticeExperience.tsx`：只接入观电影原生场景，其余方法不动。
- 本轮没有扩展原生进入／结束页，避免把聚焦修改变成全 App 重设计。

### 验证代码

- 修改 `scripts/smoke-web.mjs`：捕获观电影进入页与结束页；以真实 CDP 键盘事件验证 End、Home、左右方向键、焦点移动和原句保持；检查装饰性结束场景不会重复暴露原句。
- 保留已有的可逆宽度、320px、减少动态、暂停停止、十二方法、安全和对抗回归。

## 3. 前后对比与真实截图

所有图来自本地生产构建或 Expo Web 导出，输入为合成测试内容，不含私人原句或受保护文本。

- 汇总对比：`artifacts/inner-cinema-2/web-before-after.png`、`native-before-after.png`。
- Web 基线／当前角色：`artifacts/inner-cinema-2/baseline-web/observer-near-390.png` → `artifacts/web-smoke/observer-near-390.png`。
- Web 基线／当前观众：`baseline-web/observer-audience-390.png` → `artifacts/web-smoke/observer-audience-390.png`。
- Web 当前进入：`artifacts/web-smoke/inner-cinema-entry-390.png`。
- Web 当前减少动态 320px：`artifacts/web-smoke/observer-reduced-motion-320.png`。
- Web 当前桌面：`artifacts/web-smoke/observer-wide-1440.png`。
- Web 当前观电影结束：`artifacts/web-smoke/inner-cinema-ended-390.png`。
- Expo Web 基线／当前角色：`artifacts/inner-cinema-2/baseline-native/native-observer-near.png` → `artifacts/native-web-smoke/native-observer-near.png`。
- Expo Web 基线／当前观众：`baseline-native/native-observer-audience.png` → `artifacts/native-web-smoke/native-observer-audience.png`。

观察结果：修改前后均能可逆改变银幕构图；新版本把「同一句话」固定为视觉主体，角色视角减少环境元素，观众／见证视角逐步显现画框、地面和座椅。截图只能证明视觉和交互实现，不能证明心理效果。

## 4. 验证账本

以下均为 2026-10-31 在当前源码树实际运行，不是复制 10 月 3 日历史结果。日志位于 `artifacts/inner-cinema-2/`。

| 检查 | 结果 | 日志 |
| --- | --- | --- |
| `npm run test` | 通过，144 项 | `final-test.log` |
| `npm run typecheck` | Web、Domain、Content、Mobile 全通过 | `final-typecheck.log` |
| `npm run lint` | Web、Mobile 通过 | `final-lint.log` |
| `npm run check:claims` | 词法检查通过，不代表安全或权利认证 | `final-claims.log` |
| `npm run check:release-readiness` | 工程门禁通过；外部发布门禁仍开放 | `final-release-readiness.log` |
| `next build --webpack` | 生产构建通过 | `final-build-webpack.log` |
| `npm run smoke:web` | 18 组主流程 + 10 组对抗全部通过；含键盘与结束页 | `final-web.log` |
| `npm run build:mobile:web && npm run smoke:native` | Expo Web 导出成功，15 组浏览器回归通过 | `final-native-web.log` |
| `npm run build:mobile:ios` | iOS 静态 bundle 导出通过；不是签名 IPA 或真机测试 | `final-mobile-ios.log` |
| `npm run doctor:mobile` | **未通过：20/21**；Expo 报告 10 个包有补丁版本差异 | `final-mobile-doctor.log` |
| `npm audit --json` | **有风险：16 项**，5 low、9 high、2 critical | `npm-audit.json` |
| 默认 `next build` / Turbopack | **环境阻塞**：子进程启动报 `program not found`；未削弱构建门禁 | `baseline-build-node22.log` |

发布检查仍明确保留 EAS 登录、Apple Developer、真机、法律、种子用户与付费访谈等外部事项。本次没有账号变更、签名、发布、真实用户研究或付费模型调用。

## 5. 已实现／模拟验证／未测试／阻塞

### 已实现

- Web 与 React Native 的观电影三视角轻量空间场景、可逆切换、原句保持。
- Web 进入／练习／结束的连续视觉，Web 键盘操作和减少动态。
- 原生减少动态监听与暂停停动画；保留现有暂停、停止、路由、同意、反馈和存储语义。

### 模拟验证

- Windows 上 Chrome 的生产构建自动化；390px、320px、1440px 视口。
- Expo **Web** 导出后的浏览器回归，以及 iOS **静态导出**。
- 移动视口和可点击控件测试不等于真实触摸、VoiceOver、设备性能或系统级可访问性验证。

### 未测试

- 物理 iPhone、Android、iPad、微信内置浏览器、真实屏幕阅读器和真实触摸。
- 签名 IPA／APK、TestFlight、App Store、部署后的线上行为。
- 新视觉的用户研究、心理疗效、留存提升或商业结果。
- 本轮没有做系统级动画帧率、低端设备性能或长句原生滚动专项验证。

### 阻塞

- 当前依赖审计为 16 项风险；没有运行 `npm audit fix --force`，也没有把历史数量当成当前结果。
- Expo Doctor 要求核对 10 个补丁版本；未擅自批量升级，需单独评估锁文件、兼容性和完整回归。
- 默认 Turbopack 构建受当前 Windows 子进程环境问题阻塞；Webpack 通过只是可用构建路径，不应当写成默认构建问题已修复。
- 所有真实设备和人工发布门禁仍开放，因此本次不是安全放行或上线批准。

## 6. Codex 接手指引

1. 从本分支和交付提交继续，不要回退到旧 PR #3 或直接从 main 重做；先核对 `git status`、`git log -1` 与工作树归属。
2. 先读本文、竞品证据矩阵和现有 `AGENTS.md`。保持修改聚焦观电影；不要顺手重写其他方法或开发 B／C。
3. 本地运行需要 Node 22 和 Chrome。仓库根目录：`npm run dev -- --hostname 127.0.0.1 --port 7100`；观电影直达测试路由：`/reset?method=inner-cinema&mode=looping&activation=2&direct=1`。
4. 修改场景时，Web 看 `src/components/InnerCinemaScene.tsx` 和 `observer-cinema.css`；原生看 `mobile/src/components/stillmind/InnerCinemaScene.tsx`。视角宽度和文案语义继续来自共享 Domain，不要在两端另造心理评分。
5. 若处理依赖或 Expo 补丁版本，另开聚焦变更，审查 `npm-audit.json` 和 Doctor 输出；不得用忽略规则掩盖问题。处理后重跑完整 `verify:release`、双端浏览器回归和真机矩阵。
6. 合并或推送前确认用户授权；保留安全、同意、原句、存储、暂停停止和中性结束测试。不要把 Expo Web 或静态导出描述为真机通过。
