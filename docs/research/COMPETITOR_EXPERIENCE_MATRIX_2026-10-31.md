# StillMind 竞品体验证据矩阵

日期：2026-10-31  
范围：Waking Up、The Way、Healthy Minds Program 的公开资料；服务于 Inner Cinema 2.0，不是完整产品审计。

## 证据边界

- 本轮只读取公开网页与公开帮助文档，没有登录账号、购买订阅、绕过付费权限、提取音频或复制商业产品的代码、课程与视觉资产。
- 「官方页面可读到」不等于「已在应用内实际操作」。下表把未核实的 Onboarding、暂停退出、练习后反思、动效与可访问性明确留空，不用推测补齐。
- Healthy Minds 官方页面本轮抓取失败；其相关描述仅来自第三方评测，不能当成官方功能确认。
- 本矩阵不含竞品截图；以来源链接作为许可范围内的证据。没有复制受保护原文。

## 可核实的体验决策

| 产品 | 信息架构与练习入口 | 学习路径与返回机制 | 注意力与个性化 | 本轮未核实 | 证据等级 |
| --- | --- | --- | --- | --- | --- |
| Waking Up | 官方帮助页列出 Home、Explore、My Library、More，并将内容组织为 Practice、Theory、Life；Home 有 Continue Listening。 | Practice／Theory／Life 把练习、理解与日常生活分开组织；Continue Listening 提供回到既有内容的入口。 | 官方 Routine 页面可读到每日练习的铃声、声音或静默选择，以及 Moments 和独立 Timer。 | 首次 Onboarding 的实际步数、完整播放器暂停退出、练后反思、动效和应用内可访问性。 | 官方公开帮助页与官网页面。 |
| The Way | 官方 FAQ 描述一条连续的长期路径，而非首次进入即面对大量平铺方法；路径包含 Sits、Retreats、Trails，练习前有 Talk。 | 官方称有 900+ 节练习，以阶段路径承接持续学习。 | 同一引导提供多种时长；公开 FAQ 有 7 天试用说明。 | Reflection Questions、暂停退出、完整首次流程、动效和可访问性均未在本轮核实，不能写成已确认功能。 | 官方 FAQ。 |
| Healthy Minds Program | 第三方评测描述课程与练习结合，并区分主动练习与静坐练习。 | 第三方评测描述 Foundation 后进入 Awareness、Connection、Insight、Purpose 的学习结构。 | 第三方评测提到练习时长与讲述者选择。 | 官方页面未成功读取；所有应用内行为、退出、反思、动效与可访问性均未核实。 | 仅第三方补充，未获官方确认。 |

来源：

1. Waking Up，[How is the app organized?](https://help.wakingup.com/article/76-how-is-the-app-organized)，2026-10-31 读取。
2. Waking Up，[Build a routine](https://www.wakingup.com/inside-the-app/routine)，2026-10-31 读取。
3. The Way，[FAQ](https://www.thewayapp.com/faq)，2026-10-31 读取。
4. VerywellMind，[Healthy Minds Program App: Tried and Tested](https://www.verywellmind.com/healthy-minds-program-app-tried-and-tested-7643594)，2026-10-31 读取；第三方评测。
5. Healthy Minds，[官方产品页](https://hminnovations.org/meditation-app)，本轮抓取失败，未作为功能事实来源。

## 对本轮实现的可执行启发

| 启发 | 在 StillMind 中的自主转译 | 明确不复制或不断言的内容 |
| --- | --- | --- |
| 练习、理解和返回入口应有清楚层级。 | 本轮只统一观电影的进入预览、练习场景和结束视觉，不扩展成课程平台。 | 不复制任何竞品课程、文字、音频、界面或私有接口。 |
| 初次使用不需要先理解一整套方法体系。 | 保留已有的单一推荐、方法资格约束和十二方法库；只改善当前方法的视觉层级。 | 不重写路由，不把长期路径包装成已验证留存机制。 |
| 用户应能控制刺激强度与观看方式。 | 保留「近一点／退远一点／再远一点」；只由用户触发可逆构图变化，提供减少动态、暂停与停止。 | 不做自动镜头表演，不宣称动画能测量或改善心理状态。 |
| 练后应保留选择，而不是强迫连续使用。 | 保留可跳过反馈、中性结束与随时退出，不增加强迫打卡。 | 不根据竞品页面推断 StillMind 的疗效、留存或商业结果。 |

## 结论

竞品资料支持的是信息层级、连续学习和用户控制等设计问题，不是某一套视觉样式或心理效果的证明。本轮把主要工作放在可运行的 Inner Cinema 2.0；上述资料只用于约束设计决策，具体代码、截图、验证与限制见 `docs/engineering/INNER_CINEMA_2_2026-10-31.md`。
