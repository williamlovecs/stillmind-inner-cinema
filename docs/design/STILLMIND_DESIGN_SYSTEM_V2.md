# StillMind Experience V2 · Quiet Cinema

## 已冻结的方向

本设计系统服务于现有 StillMind 练习，不是另一套平行产品。基线是已完成的观电影 2.0 提交 `4a7826a94966dbf65a2f100884b5b7387231be13`，保留其安全路由、计时、同意、存储和原句保护。

| 方向 | 核心表达 | 适用性 | 决策 |
| --- | --- | --- | --- |
| Quiet Editorial | 大幅留白、明确的阅读层级、素色分界 | 让初次用户快速理解一句引导，最适合长文与小屏 | 保留为信息层 |
| Spatial Cinema | 镜头、前后景、视角切换 | 与观电影和意识抽离的产品理念一致 | 保留为练习舞台，不泛化到表单 |
| Tactile Awareness | 可感知的按下、选择和边界反馈 | 有助于明确真实操作，不适合以动画暗示结果 | 仅用于按压反馈 |

最终选择 **Quiet Cinema**：Quiet Editorial 的清晰信息层级 + Spatial Cinema 的克制空间构图。没有 WebGL 依赖，没有心理等级、意识分数或自动结果推断。

## 共享语义令牌

源文件：`packages/design-tokens/src/index.ts`。Web 使用 `src/app/experience-v2.css`，原生使用 `mobile/src/constants/theme.ts`。

- 颜色：深／浅色语义色板；`accent` 只表示可选择的操作，`warm` 表示回到现实。
- 间距：6 / 10 / 16 / 24 / 32 / 48；不把装饰空间挤进一句引导。
- 圆角：10 / 14 / 20 / 28 / 999；仅舞台使用较大圆角。
- 高度：不以玻璃模糊和重阴影区分层级；使用表面、边框和留白。
- 动效：120ms 操作反馈、220ms 状态变化、420ms 场景切换；静止对象不强制动画。
- 可访问性：最小触控目标 44px，明显键盘焦点，文本不依赖颜色单独表达。

## 共享组件接口

- Web：`src/components/ui.tsx`：`AppHeader`、`Surface`、`ActionButton`、`ChoiceButton`。
- Native：`mobile/src/components/stillmind/ui.tsx`：`Screen`、`BrandHeader`、`Surface`、`PrimaryButton`、`SecondaryButton`、`Chip`、`SectionHeading`。
- Player：只由 `PracticePlayer` / `ExperienceShell` 负责步骤、计时和暂停上下文；每个方法拥有自己的本地操作状态。点击不是完成练习的必要条件。
- Method renderer registry：`src/components/methods/registry.tsx` 和 `mobile/src/components/stillmind/methods/registry.tsx`。

## 方法设计契约

1. 每种方法只有一个主要互动，操作后必须改变可见内容或引导，而不只是高亮。
2. 输入原句原样保留；空输入使用中性提示，不自动制造负面念头。
3. 按钮只记录用户主动选择，不声称“已经平静”“已经觉察”或“已经做到现实行动”。
4. 隐藏、切换、构图变化均可逆；暂停／停止／退出由父级时钟和路由继续负责。
5. 纯文字、现实物品和不看身体的替代必须可达。
6. Reduced Motion 下不靠动画传达必要信息；禁用动画后仍保留完整文字。

## 呈现策略

默认深色是 Quiet Cinema 的影院夜色。浅色令牌用于后续浅色呈现，不在本轮未经检查地开启。低刺激方法使用静态水面、纸面、方框或纯文字，不使用视错觉。移动端以原生视图实现相同语义，不共享 DOM 或 CSS。

## 验证与交接边界

每批实现后使用合成输入实际测试 Web 与 Expo Web，保留原始日志和 320／390px 截图；桌面代表页另测 1440px。Expo Web 不是物理手机、真实触摸或屏幕阅读器验收。任何概念 B／C 不进入正式 App 路由，也不复用本产品的真实练习记录。

Codex 接手时保留共享令牌、renderer registry 和原有业务边界；不要把 UI 本地状态移到 domain/session，不要把选择次数变成评分。
