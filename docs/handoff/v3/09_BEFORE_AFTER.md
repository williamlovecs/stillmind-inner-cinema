# Phase 6 — V2／V3 同条件前后对照

## 对照口径

本组对照比较精确 V2 提交 `c32d423c4eaa5e3f263d1679bb78eee0fd181fbd` 与 Draft PR #7 的生产 Web 页面。每次截图的机器可读版本号见 [capture-manifest.json](../../evidence/v3/compare/capture-manifest.json)；最终 PR HEAD 的复验图随独立 evidence 分支提供。

七组共 14 张图均已实际打开查看。两侧使用相同的任务、URL 参数、空本机历史、已确认首次边界、合成输入和观电影原句“有一个念头”；观电影均处于暂停状态。每组 viewport、浏览器缩放、可控时钟与 Reduced Motion 设置一致。全部截图没有根级横向溢出、外部请求或浏览器运行异常，观电影原句在两侧一致。

这些是相同条件下的视觉与界面状态对照，不是真实用户研究、疗效比较、性能基准或真实手机验收。V3 没有把 V2 的功能或文字语义删减当成视觉改善。

## 七组对照

| 屏幕与 viewport | V2 Before | V3 After |
| --- | --- | --- |
| 空首页｜390×844 | [查看](../../evidence/v3/compare/v2/home-390.png) | [查看](../../evidence/v3/compare/v3/home-390.png) |
| 空首页｜768×1024 | [查看](../../evidence/v3/compare/v2/home-768.png) | [查看](../../evidence/v3/compare/v3/home-768.png) |
| 空首页｜1440×900 | [查看](../../evidence/v3/compare/v2/home-1440.png) | [查看](../../evidence/v3/compare/v3/home-1440.png) |
| 观电影准备｜768×1024 | [查看](../../evidence/v3/compare/v2/choose-768.png) | [查看](../../evidence/v3/compare/v3/choose-768.png) |
| 观电影暂停｜390×844 | [查看](../../evidence/v3/compare/v2/cinema-390.png) | [查看](../../evidence/v3/compare/v3/cinema-390.png) |
| 观电影暂停｜768×1024 | [查看](../../evidence/v3/compare/v2/cinema-768.png) | [查看](../../evidence/v3/compare/v3/cinema-768.png) |
| 观电影暂停｜1440×900 | [查看](../../evidence/v3/compare/v2/cinema-1440.png) | [查看](../../evidence/v3/compare/v3/cinema-1440.png) |

准备页使用 `inner-cinema / looping / activation=2`，不自动开始；练习页使用同一方法和状态并直接进入后暂停。测试输入均为合成数据，不包含用户私密记录。

## 可观察差异与边界

- 首页：V3 将默认行动与观看对象建立主从关系；桌面不再局限于居中的窄卡，窄屏和 768px 保持明确主出口。
- 准备页：V3 把当前方法、可选输入和开始动作组织成一条路径，不再让完整方法目录与开始任务同时竞争。
- 观电影：两侧都保留同一原句；V3 用暖纸、矿物墨色和纸幕构图区分观看对象与界面控制，不用动画推断心理变化。
- 暂停、停止和 Reduced Motion 不是装饰状态；真实计时与退出语义由对应浏览器回归另行验证。

## 构建限制披露

迁移到 E 盘后，V2 的本地 workspace 依赖需要临时加入 `transpilePackages` 才能完成只读对照构建。该临时配置在构建后已恢复，V2 工作树保持干净且仍固定于精确 SHA；没有把临时配置提交或当作 V2 源改动。V3 使用生产 Web 构建，Expo Web 不在这组 V2／V3 同条件对照中，旧 Expo 图未被冒充为严格基线。

复现脚本为 `artifacts/v3-capture-compare.mjs`（不纳入公开源码提交）。它只启动受控的本地 production server 和一次性 Chromium 配置，结束后关闭，不访问公网产品或真实用户数据。
