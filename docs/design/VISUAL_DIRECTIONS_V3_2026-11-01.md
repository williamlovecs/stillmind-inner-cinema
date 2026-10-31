# StillMind V3 三种视觉方向与选型

日期：2026-11-01
比较对象：同一产品任务的真实 HTML 原型，不是竞品截图、生产功能或用户测试。
运行基线：`c32d423c4eaa5e3f263d1679bb78eee0fd181fbd`。

## 可比较的屏幕

三个方向使用同一组中文任务文案、同一组合成数据、同样的 1440×960 与 390×844 viewport；通过 `?screen=home|library|cinema|breath|reflection` 打开单屏。观电影三个视角会在原型中真实改变对象构图，自然数息明确“不点击也能完成”。原型不是生产功能，按钮中未接通的控制不代表产品能力。

原型：[A 折页路径](prototypes/A-folded-path.html) · [B 一间静室](prototypes/B-one-room.html) · [C 生长索引](prototypes/C-living-index.html)。

| 同一屏幕 | A｜折页路径 | B｜一间静室 | C｜生长索引 |
| --- | --- | --- | --- |
| 首页 | [桌面](../evidence/v3/directions/A-home-1440.png) · [窄屏](../evidence/v3/directions/A-home-390.png) | [桌面](../evidence/v3/directions/B-home-1440.png) · [窄屏](../evidence/v3/directions/B-home-390.png) | [桌面](../evidence/v3/directions/C-home-1440.png) · [窄屏](../evidence/v3/directions/C-home-390.png) |
| 方法库 | [桌面](../evidence/v3/directions/A-library-1440.png) · [窄屏](../evidence/v3/directions/A-library-390.png) | [桌面](../evidence/v3/directions/B-library-1440.png) · [窄屏](../evidence/v3/directions/B-library-390.png) | [桌面](../evidence/v3/directions/C-library-1440.png) · [窄屏](../evidence/v3/directions/C-library-390.png) |
| 观电影 | [桌面](../evidence/v3/directions/A-cinema-1440.png) · [窄屏](../evidence/v3/directions/A-cinema-390.png) | [桌面](../evidence/v3/directions/B-cinema-1440.png) · [窄屏](../evidence/v3/directions/B-cinema-390.png) | [桌面](../evidence/v3/directions/C-cinema-1440.png) · [窄屏](../evidence/v3/directions/C-cinema-390.png) |
| 自然数息 | [桌面](../evidence/v3/directions/A-breath-1440.png) · [窄屏](../evidence/v3/directions/A-breath-390.png) | [桌面](../evidence/v3/directions/B-breath-1440.png) · [窄屏](../evidence/v3/directions/B-breath-390.png) | [桌面](../evidence/v3/directions/C-breath-1440.png) · [窄屏](../evidence/v3/directions/C-breath-390.png) |
| 结束与反思 | [桌面](../evidence/v3/directions/A-reflection-1440.png) · [窄屏](../evidence/v3/directions/A-reflection-390.png) | [桌面](../evidence/v3/directions/B-reflection-1440.png) · [窄屏](../evidence/v3/directions/B-reflection-390.png) | [桌面](../evidence/v3/directions/C-reflection-1440.png) · [窄屏](../evidence/v3/directions/C-reflection-390.png) |

实际 Chromium 共生成 30 张新截图，全部在 Reduced Motion 下运行；断言每页只有一个活动屏幕、无根级横向溢出、无浏览器异常。证据索引：[capture-manifest.json](../evidence/v3/directions/capture-manifest.json)。已人工查看桌面和窄屏总览，并修正 A 方法链接默认蓝色、B 呼吸标题对比不足与 C 结束标题孤字换行后重新截图。它们是方向比较证据，不是十二法验收、真实手机测试或生产页面。

## 加权设计决策

以下是设计决策评分，不是用户评分、心理效果或市场验证。每个维度得分已包含任务书权重，满分 100。

| 方向 | 成熟度与辨识度 20 | 核心任务清晰 20 | 安静可持续 20 | 十二法适配 15 | 移动可访问性 15 | 工程成本 10 | 合计 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A｜折页路径 | 17 | 18 | 18 | 13 | 13 | 9 | **88** |
| B｜一间静室 | 18 | 17 | 16 | 12 | 10 | 7 | **80** |
| C｜生长索引 | 16 | 16 | 17 | 14 | 12 | 8 | **83** |

A 的阅读、默认行动和跨端实现最均衡；B 的空间主体最强，但全站暗色、长文和控件对比成本较高；C 的方法比较与回看最好，但密集索引不适合直接成为练习壳。因此最终选择不是单独“分数最高即全照抄”，而是 A 为系统、B 为练习空间、C 为索引节奏的可回退组合。

## 各自适合与不适合之处

### A｜折页路径

- 适合首次打开：当前行动和背景说明有主从，不必先读方法百科。
- 适合长期使用：输入、状态与偏好能按需展开，不必反复展示。
- 风险：大字标题断行过碎、装饰对象挤压行动。实现时限制标题宽度，中文按词组换行；320px 回到自然单列。

### B｜一间静室

- 适合练习中：注意对象、指导与退出边界最容易集中。
- 不适合全站暗色：方法比较、长文阅读和设置不应都变成观看空间。
- 风险：空间动效可能被误解为练习效果。只让用户操作改变构图；计时不自动制造“已觉察”演出。

### C｜生长索引

- 适合方法库与复盘：名称、用途、时长可扫描，收藏与详情有稳定位置。
- 不适合练习中：密集选项、输入和说明会形成表单感。
- 风险：网格与编号过多时仍像管理后台。生产实现只保留必要行线和序号。

## 最终选择：折页静室 / Still Room

**以 A 为全站主系统，吸收 B 的练习空间与 C 的方法索引。** 这不是三套配色混用，而是一套语义：

1. 暖纸、矿物墨色、鼠尾草绿是阅读与选择层；陶土色只用于主要行动和主动选择。
2. 练习中可以使用同一色系的暖灰黑，原句始终是对象，不用光效证明变化。
3. 卡片只在分组确有功能时出现；其余层级靠留白、字号、行线和排列。
4. 桌面非对称双栏，移动自然单列；首页不再居中的一张窄卡，准备页不再平铺整个方法目录。
5. 结束只保留一个状态标题，事实摘要与返回优先，种子反馈降为次级操作。

## 保留与淘汰

保留：现有十二法 ID、推荐解释、真实计时、暂停／停止、原句保护、可跳过反馈、缺失评分、中性结果、本机记录、偏好、安全门与减少动态效果。

淘汰：蓝紫 AI 渐变、发光圆环 logo、每段一张描边卡、准备页的三组宣传徽章、重复状态标题、以种子反馈抢占结束主出口。

## 验收依据

最终不是以本原型“通过”为结论，而是在生产 Web 与 Expo Web 上重新检查 320／390／768／1440、键盘、大字号、Reduced Motion、十二法与完整数据路径。真实手机、真实触摸、屏幕阅读器与微信浏览器未经执行均标为 `NOT VERIFIED`。
