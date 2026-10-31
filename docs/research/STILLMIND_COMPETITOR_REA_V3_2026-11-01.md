# StillMind Experience V3 — 定向竞品 REA

日期：2026-11-01
基线：`c32d423c4eaa5e3f263d1679bb78eee0fd181fbd`
范围：13 个可比产品，8 个深入对象；表现层与交互抽象研究，不复制界面、课程、素材或专有实现。

## 证据边界

- **VERIFIED**：本轮亲自在公开网页观察到页面内容或操作结果。网页可读只证明网页本身。
- **OFFICIAL CLAIM**：官网、官方帮助或官方商店的产品描述；不是实测，也不是 StillMind 的效果证据。
- **STORE LISTING**：商店描述或版本记录；仅证明该文本存在。
- **SOURCE OBSERVED**：在固定 SHA 阅读公开源码；不证明应用在本机运行成功。
- **INFERENCE**：由证据得出的 StillMind 设计判断。
- **UNKNOWN / NOT VERIFIED**：没有足够证据／未实际操作；商店图、营销图不升级为运行证据。

所有移动 App 的首次启动、登录、付费后页面、播放器、暂停恢复、触控、声音、通知和权限均为 **NOT VERIFIED**。未登录付费账户，未绕过认证或技术保护，未收集用户私密内容。`agent-reach` 及社交 CLI 在本机不可用，因此本轮没有 Twitter、Reddit、小红书等社交讨论证据。多个官网与 Apple 页面读取失败，未用搜索摘要伪装完整浏览。

已先读 StillMind 的方法系统、模块边界、V2 设计／交接、既有竞品矩阵，以及 `research/rea-stillmind-2026-10-31/STILLMIND_REA_COMPETITOR_RESEARCH_2026-10-31.md`。后者作为此前公开资料研究继承，不冒充新的移动实测。

## 一、13 产品对照矩阵

| 产品 | 本轮可确认的产品任务 | 可以借鉴的抽象模式 | 不可据此断言 | 证据 |
|---|---|---|---|---|
| The Way | 单一顺序的长期练习路径 | 系统承担排序，默认下一步仍允许回看 | 首课输入、跳过、完成算法 | [官网](https://www.thewayapp.com/)；移动 **NOT VERIFIED** |
| Waking Up | 当下行动与 Practice / Theory / Life 内容发现分层 | Home、Explore、保存、设置各司其职 | 当前播放器和恢复精度 | [Explore](https://www.wakingup.com/features/explore?ref)、[Routine](https://www.wakingup.com/inside-the-app/routine)；移动 **NOT VERIFIED** |
| Healthy Minds Program | Awareness / Connection / Insight / Purpose 的长期学习 | 内容与练习分层，原理不挤占当下行动 | 真实课程导航、完成门槛 | [官网](https://www.humin.org/wellbeing-tools/app)；移动 **NOT VERIFIED** |
| Medito | 课程、Daily、睡眠、呼吸与计时 | 无账号低门槛；播放、下载、历史是不同状态 | 当前 App 实际体验与错误率 | [官网](https://meditofoundation.org/medito-app)、[免费说明](https://meditofoundation.org/free-meditation-app)；源码另见许可证报告 |
| one sec | 在打开目标应用前介入，再允许继续或取消 | 操作产生真实行为后果；取消也是有效结果 | StillMind 可继承其研究结果或效果数字 | [官网](https://one-sec.app/)、[研究摘要](https://pubmed.ncbi.nlm.nih.gov/36795756/)；实际介入 **NOT VERIFIED** |
| How We Feel | 情绪记录、相关背景、调节工具、长期回顾 | 同一条记录服务当下与以后；不把记录变成人格标签 | Today 的当前覆盖率、即时工具反馈 | [官网](https://howwefeel.org/)；Today **UNKNOWN / NOT VERIFIED** |
| Othership | 本轮未取得可复核的官方正文 | 只保留“群域课程／即时练习需分层”待验证问题 | 任何当前 UI、课程流程、呼吸效果 | 官网与商店读取失败；**UNKNOWN / NOT VERIFIED** |
| Balance | 每日回答经验、目标与障碍，组合个性化练习 | 少量输入改变后续建议；练习与单项探索分层 | 个性化等同疗效，或问题越多越好 | [官网](https://balanceapp.com/)；移动 **NOT VERIFIED** |
| Portal | 自然影像、空间音频与智能灯光组成环境 | 沉浸来自统一感官场，不是卡片堆叠 | 动效适合所有练习；静态模式当前行为 | [官网](https://portal.app/)；实际 App **NOT VERIFIED** |
| Stoic | 本轮未取得可复核的官方正文 | 只保留晨晚反思是否应使用同一记录的问题 | 当前文案、引导、提醒或付费结构 | 官网与搜索读取失败；**UNKNOWN / NOT VERIFIED** |
| Rosebud | 官方文章描述书写、后续提示与长期主题 | 回顾应回到用户自己的原句；允许不生成结论 | 其 AI 输出或安全机制可直接移植 | [官方说明](https://www.rosebud.app/blog/best-journal-for-mental-health)、[隐私对照说明](https://www.rosebud.app/blog/top-6-ai-journaling-app-for-mental-wellness)；App **NOT VERIFIED** |
| Insight Timer | 大型内容库；Saved 中区分进行中、已完成和保存课程 | 收藏不等于完成，继续入口有真实记录来源 | 内容数量本身等于练习价值 | [课程帮助](https://help.insighttimer.com/support/solutions/articles/67000719432-how-can-i-find-and-access-my-courses-on-insight-timer-)；移动 **NOT VERIFIED** |
| Calm | 官方公开播放入口与冥想、睡眠、音乐分类存在 | 主行动与内容分类分开 | 当前首次启动、播放器控制、跳过和恢复 | [官方公开入口](https://www.calm.com/app/player/u6rrX-vyUB)；移动 **NOT VERIFIED** |

## 二、八个深入对象：任务、后果与边界

### 1. The Way — 路径替代选择负担

- **用户任务**：跟随一个逐步展开的路径，而不是先比较几十种方法。**OFFICIAL CLAIM**。
- **操作与状态**：官网明确 “one single path / no decisions”；上一位报告的 FAQ／商店资料说明 Sit、Talk、路径位置、下载与收藏，但首次页和当前完成规则仍 **NOT VERIFIED**。
- **必须输入／可跳过**：当前首次输入、首课能否跳过、反思是否必填均 **UNKNOWN**。
- **真实后果**：路径位置、可继续内容、下载／收藏是状态；页面插画不是完成证明。
- **中止／恢复**：音频故障和恢复细节不可由官网推出。
- **StillMind 借鉴**：首次只给一个可解释的默认方法；方法库保留为明确出口，不强迫用户接受默认。
- **不复制**：Zen 权威、课程地图、反思原文、觉醒结果暗示。

### 2. Waking Up — 当下行动与内容学习不互相挤占

- **用户任务**：在 Home 进入每日练习／Moment／继续收听；在 Explore 选择 Practice、Theory、Life 或其他内容；在 My Library 找回保存内容。**OFFICIAL CLAIM**。
- **关键层级**：当前官方 Explore 页说明 Practice / Theory / Life 位于 Explore，而不是全部堆在 Home；Routine 页描述 Moment 是短练习，Timer 可独立使用。
- **输入与后果**：可选铃声、背景声、延长静默和时长会改变实际播放配置；收藏与播放列表改变后续可访问内容。真实控制仍 **NOT VERIFIED**。
- **恢复**：Continue Listening 属于状态恢复，而非另一张推荐卡。恢复精度、跨端同步和异常 **UNKNOWN**。
- **StillMind 借鉴**：首页解决“现在做什么”；方法库解决“如何练／为什么／如何带回生活”；历史提供可恢复的上下文。
- **不复制**：教师体系、付费策略、内容命名、音频课程。

### 3. one sec — 暂停之后必须有真实选择

- **用户任务**：在打开目标 App／网站前经过一个可配置干预，再决定是否继续。**OFFICIAL CLAIM**。
- **操作差异**：官网列出呼吸、镜面、对话反思、旋转手机、随机文本等；它们不是单纯换背景，但实际操作 **NOT VERIFIED**。
- **后果**：研究中的取消打开是有效行为结果，不是失败。特定田野实验数字不可外推为 StillMind 效果。**PUBLISHED EVIDENCE**，见上表链接。
- **中止／重入**：重新介入、延长使用与授权失败必须区分；本轮未验证系统行为。
- **StillMind 借鉴**：练习结束后提供回到当前任务、稍后再决定等现实出口；停止练习也保留中性出口。
- **不复制**：系统阻挡、强制摩擦、呼吸图形、效果数字。

### 4. How We Feel — 记录应回到用户手中

- **用户任务**：记录当下情绪，添加相关背景或日记，查看模式与调节策略。**OFFICIAL CLAIM**。
- **操作后果**：官网说明 Check-in、趋势与自助工具构成日记工作流；此前版本资料支持 Weekly Review 使用 Check-in tags。
- **反馈与跳过**：工具后是否立即反馈、如何跳过、是否改变后续推荐 **UNKNOWN**。不能把 Weekly Insights 反馈写成每次练习后反馈。
- **Today**：当前覆盖率、设计和是否仍分批测试 **UNKNOWN / NOT VERIFIED**。
- **StillMind 借鉴**：一次输入可服务本次建议与以后复盘；允许跳过文字、跳过反馈、不生成洞察。
- **不复制**：情绪色盘、健康数据关联、默认社交分享、人格化总结。

### 5. Healthy Minds Program — 长期路径需要内容层次

- **用户任务**：围绕 Awareness、Connection、Insight、Purpose 学习并练习。**OFFICIAL CLAIM**。
- **关键屏幕**：官网有主题介绍与公开试听；App 内首页、课表、练习页 **NOT VERIFIED**。
- **后果**：官方称提供最长 600 天免费练习；这不是本轮对课程内容、解锁或效果的验证。
- **StillMind 借鉴**：方法库可增加“目的／原理／实际练习”层次，让长期路径有解释而不制造等级。
- **不复制**：科学背书话术、专有课程、效果比例、 testimonial。

### 6. Medito — 内容入口和播放状态是不同问题

- **用户任务**：选择课程、Daily、睡眠、呼吸或 Timer；官网称无账号、无广告。**OFFICIAL CLAIM**。
- **播放与下载**：固定 SHA 源码显示，播放请求与实际播放状态分离；先检查本地路径再回退远端；下载有未下载、下载中、已下载状态；播放失败需要向调用方传播。**SOURCE OBSERVED**，不是运行验证。
- **完成与记录**：源码存在会话跟踪与统计更新，不能据此推断其完成阈值、界面文案或本机结果。
- **StillMind 借鉴**：保留现有 domain clock，新增“准备中／播放中／暂停／停止／完成／保存失败”的表现一致性；不自动把停止写成完成。
- **不复制**：Flutter 架构、Riverpod 代码、音频、图标、课程或统计模型。

### 7. Portal — 沉浸不等于控制更多

- **用户任务**：进入自然环境以工作、休息或睡眠；官网说明动态影像、空间音频、可选灯光。**OFFICIAL CLAIM**。
- **交互后果**：声音、画面和外部灯光属于真实环境配置；不是“氛围卡片”的视觉装饰。实际控制与退出 **NOT VERIFIED**。
- **StillMind 借鉴**：观电影只需要统一的对象、空间层次、字幕和退出；减少动态效果时保留同一信息与控制，不拿走练习内容。
- **不复制**：自然素材、空间音频、外部灯光集成、视觉构图。

### 8. Balance — 少而明确的输入改变下一次建议

- **用户任务**：回答关于经验、目标、障碍的问题，获得组合练习；另有 Singles 与技能进度。**OFFICIAL CLAIM**。
- **输入／后果**：每日回答影响后续音频组合；这意味着输入必须有可解释用途，不能为了表单完整而收集。
- **边界**：官方“更个性化和有效”是产品声称，不是本轮验证；实际问卷、跳过和修改历史 **NOT VERIFIED**。
- **StillMind 借鉴**：保留显式 Check-in 和推荐理由；历史只影响可解释的下一次入口，不暗中推断人格或病情。
- **不复制**：技能分数、 personalization 文案、问卷原文、音频库。

## 三、面向 V3 的可执行结论

1. **首屏一个默认下一步，不展示方法货架。** 默认说明来源，允许换法；首次无输入时不伪造自报评分。
2. **练习对象与控制分离。** 一页一个注意对象；暂停／停止固定可达；非必要方法解释收进准备阶段或可展开区域。
3. **不同方法采用不同参与强度。** 观电影／视角方法允许主动切换；身体扫描／开放觉察允许只观看文字；静观不需要持续点击。
4. **完成、停止、更差、未评分、保存失败分别呈现。** 中性结果不奖励重复，不把未答填成相同。
5. **历史记录不是成绩榜。** 只显示真实方法、时间、时长、状态和用户自愿填写的反馈；无记录不生成洞察。
6. **减少动态效果是同等体验。** 不用动画推断觉察、呼吸、稳定、宽恕或情绪变化；视觉对象不承担生物测量。

详细工程取舍、三种布局方向和十二法合同见同目录／设计目录的 V3 文档。本报告不构成对任何产品隐私、安全、疗效或商业表现的背书。
