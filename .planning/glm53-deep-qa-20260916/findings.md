# GLM53 深度 QA 发现清单（2026-09-16）

全部发现均在 `ef41838` 基准上亲自复核过代码或运行时证据。标注：平台 / 严重级 / 证据位置 / 处置。

## P1（本轮修复）

| ID | 区域 | 证据 | 影响 | 处置 |
| --- | --- | --- | --- | --- |
| N1 | mobile/Expo Web | `mobile/src/app/(tabs)/profile.tsx:58` 用 `Alert.alert` 确认"清除所有本机数据"；react-native-web 的 `Alert.alert()` 为空实现（node_modules/react-native-web/dist/exports/Alert/index.js 仅 `static alert() {}`）；mobile/app.json 配置了 web 输出 | Expo Web 构建上隐私删除控制完全失效 | 跨平台确认（web 用 window.confirm） |
| N2 | mobile/Expo Web | `mobile/src/app/(tabs)/index.tsx:73` 高危语言安全提示走 Alert；`:82` 无匹配练习提示同理 | Web 构建上危机边界提示不可见，开始按钮表现为死按钮 | web 内联 Surface 呈现 |
| N3 | mobile 原生 | `mobile/src/storage/database.ts:10` `databasePromise ??= openDatabaseAsync(...)`，reject 后永久缓存 | 一次瞬时打开失败 → 本 App 生命周期内所有读写失败，全部记录显示未保存 | 失败时重置缓存（database-opener.ts，node 测试覆盖） |
| S1 | 共享 domain（双端） | `packages/domain/src/safety.ts:3` 高危正则要求"安全"紧跟"无法保证(自己)?"；"我现在无法保证自己**的**安全"（含"的"）不命中 → 危机边界被绕过、练习照常开始；"没办法/不能/保证不了…安全"同样漏检 | 最自然求助表述绕过安全门（由新 native smoke 场景在 Expo 导出上捕获，见 progress 阶段 5） | 正则扩展同语义族表述；负例（"这个方法保证有效"）不命中；测试先行（routing.test.ts 先失败后通过），commit `06052b9` |
| T1 | QA harness | `scripts/smoke-adversarial.mjs:75-79` 无端口预检、无 `--hostname 127.0.0.1`、ready 仅凭 `fetch().ok`；smoke-web 已在 2a2a2a6 修复同类问题但 adversarial 未同步 | 端口被占用时可能测到无关服务，结果不可归属 | 镜像 smoke-web 的归属防护 |
| T2 | QA harness | `scripts/smoke-native-web.mjs:40` 固定 3200/9224 无 error 处理（EADDRINUSE 崩溃）、summary.json 不记录被测 SHA | 结果无法追溯到代码版本；冲突时未捕获异常 | 端口可配置 + error 处理 + 记录 testedGitSha |

## P2（本轮修复，低成本）

| ID | 区域 | 证据 | 影响 | 处置 |
| --- | --- | --- | --- | --- |
| W1 | Web 无障碍 | `src/app/reset/page.tsx` focusMode（precheck/practice/check/done）下侧栏 h1 不渲染，页面只有 h3 | 练习流程无 h1，读屏标题层级断裂 | focusMode 下补 sr-only h1 |
| W2 | Web/触控目标 | `ResetPracticePlayer.tsx:188` 内观法落点按钮 `h-10 w-10`=40px；native `MethodPracticeExperience.tsx:311` minHeight 40 | 低于 44px 触控标准 | 两端 ≥44px |
| W3 | 内容一致性 | practice-catalog 内观法步骤有逐段引导（"看见刚才那一幕。"等），但 Web `ThoughtBubbleEngine` inner-cinema 分支只渲染 lens.hint，步骤 instruction 全程不显示；native 同样以 lens.hint 替换 instruction（仅显示步骤 title） | 目录文案与实际呈现脱节，20-60 秒的段落引导缺失 | Web 渲染 step.instruction + native instruction 改为 step.instruction、lens hint 移到镜头按钮旁 |
| W4 | 伪指标观感 | Web wide-gaze 显示"距上次点击 Ns"大字统计卡（`ResetPracticePlayer.tsx:78`），native 只有"主动点击次数" | 与凝视法"点击不当成绩"原则有张力，且两端不一致 | 对齐 native：保留点击计数，移除秒数统计卡 |
| N4 | mobile/Expo Web | `reflection.tsx:84` 删除单条记录走 Alert；`:93` abandoned/未评分记录显示"已记录" | Web 上无法删除单条；未完成记录被标为"已记录" | 跨平台确认 + "未完成"文案 |
| N5 | mobile | `profile.tsx:40`（web 提醒 Alert）、`:16-24` exportData 无错误处理、`:14` toggle 未接 rejection | 静默失败 / unhandled rejection | web 内联提示 + try/catch |
| N6 | mobile | `reflection.tsx:43-45` weekly_review_opened 依赖 sessions 变化而非 focus | 练习完成返回时重复发送；再次进入漏发 | useFocusEffect |
| N7 | mobile | `index.tsx:100` setTimeout 未清理；练习完成后返回首页旧 trigger/activation 仍在输入框 | timer 泄漏；旧原话可能被再次提交（AI 开启时会再发送） | 清理 timer + 返回后清空草稿 |
| T3 | 测试缺口 | request-policy 协议/畸形 origin 边界、scaleVariant 步骤 kind 保序与未知方法 id、DisclaimerModal 焦点陷阱均无测试 | 回归无护栏 | 新增单元测试 + adversarial 浏览器组 |

## P3（低成本顺手修）

- N8 `method/[id].tsx:21` 深链晚解析时 minutes 不随 durations 重新同步 → 对齐 effect。
- N9 `reset.tsx:253` 安全链接缺 accessibilityRole="button"。
- N10 `reflection.tsx:84` 删除按钮触控目标约 38px → hitSlop 加大。
- N11 index 示例/状态折叠 Pressable 缺 accessibilityRole/State；profile Switch 缺 accessibilityLabel、ActionRow 缺 role；OnboardingGate 选择项缺 role/selected。
- W5 web body-scan 落点按钮无 aria-pressed 语义（role img 上叠加 button）→ 保持 aria-label，尺寸修复即可。

## 审计为 clean / 不改的关键语义（复验通过）

- web/native attempt 生命周期：未评分不填默认值、停止≠成功、真实活跃时长、晚同意只发反馈事件、串行写入不复活已删记录 —— 双端一致（native `nativeFeedbackResult` 额外把主观 feeling=worse 折入 result，属更保守的有意差异，文档记录，不改）。
- API：Origin/JSON 策略、有界 JSON 读取、实例级限流、provider 输出校验、高危语言 422、不截断高危后缀（S05）—— 测试在位。
- 隐私：两端 analytics 默认零请求；撤回 abort 在途；payload 无用户原文；无客户端 key；无 console 输出原文。
- 暂停语义：`[data-practice-paused="true"]` 冻结 CSS 动画；fieldset disabled 输入；web 后台自动暂停需显式继续；native AppState 同样。
- prefers-reduced-motion 全局降级存在（globals.css:299）。

## 明确不做 / 记录边界

- 长时长 3/5/10 分钟仍是同脚本缩放（诚实披露已在位）。**不**在本轮伪造"独立长课程"；内容设计规格写入最终报告。
- native smoke 无后台切换/大字号场景、smoke 文本选择器脆弱性 —— 记录为后续项，不在本轮大改 harness 结构。
- `mobile/src/lib/timeline.ts` 死代码 —— 本轮不删（避免无意义改动），记录。
