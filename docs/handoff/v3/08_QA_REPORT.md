# Phase 6 — QA、16 项 REA 验收与剩余阻塞

## 验收口径

最终命令必须指向 Draft PR #7 的最终 HEAD，而不是旧实现提交 `96cd7c0`。最终数值、日志与 JSON 由提交后的复验产生，并通过 PR 交接说明和独立 evidence 分支提供；本文件不预写“最终通过”。历史结果只用于定位覆盖，不冒充新 SHA。

执行范围：typecheck、lint、单元／契约、claims、Next Webpack production、Expo Web、iOS 静态 bundle、Web 主回归／对抗、Web 本机产品路径、Expo 主回归／本机产品路径、依赖审计、真实截图。没有设备就不把模拟器或 Expo Web 当真机。

## AT-01～AT-16 当前真实映射

状态含义：**Already Implemented**＝本轮已有代码与自动证据覆盖；**Partially Implemented**＝安全基础或部分场景存在，但任务书完整条件未关闭；**Missing**＝当前没有所需完整路径；**Device-Only**＝必须外部设备，不能用 Chromium 替代；**Not Applicable**＝有证据说明不适用。没有一项仅凭交接文档打勾。

| ID | 当前状态 | 已有证据与仍未关闭的差距 |
| --- | --- | --- |
| AT-01 安全门槛 | **Already Implemented（自动范围）** | domain 安全规则、Web／Expo 高强度与偏好限制已覆盖；外部危机支持的实际有效性不是自动测试结论。 |
| AT-02 最少必需输入 | **Already Implemented** | 空原句、空情绪、未评分可开始并完成；未答不补 same 或旧值。 |
| AT-03 原句与草稿隔离 | **Already Implemented（浏览器范围）** | 对抗测试覆盖旧草稿／同意隔离、迟到输入与 markup 原样；观电影／人称替代原句不变。真实语音权限为 Device-Only。 |
| AT-04 真实计时 | **Already Implemented** | domain clock、59.9／60 秒边界与自然完成；动画不累计有效时长。 |
| AT-05 用户暂停 | **Already Implemented** | Web／Expo 暂停冻结，继续后续接；暂停时不提前写完成。 |
| AT-06 后台与返回 | **Partially Implemented + Device-Only** | 真实浏览器标签切换会暂停且返回不自动播放；真实 iOS／Android OS 后台未执行。 |
| AT-07 取消与提前停止 | **Partially Implemented** | stopped／abandoned、有效时长和非完成语义已验；开始前取消没有统一 `cancelled` 状态，需确认“无历史退出”路径的完整合同。 |
| AT-08 反馈跳过 | **Already Implemented** | 自然完成与停止都能跳过；未答保持缺失，完成可保存。 |
| AT-09 worse／stopped 后果 | **Partially Implemented** | 中性结束、不推荐立即重练和周回顾降强度已存在；单次 worse 后首页替代与路径不推进的完整自动场景仍需补齐。 |
| AT-10 保存失败与幂等重试 | **Partially Implemented** | 失败提示、可退出、按 ID upsert 已有；缺少用户可见的原 Session 重试保存闭环及完成／停止重试的完整自动证据。 |
| AT-11 重载恢复 | **Missing（安全降级已存在）** | 重载会把进行中的 attempt 保守记为 abandoned，不伪造成 completed；没有 running／paused／completed_candidate／save_error 的可恢复状态机和真实时长恢复。 |
| AT-12 历史与周回顾真实性 | **Partially Implemented** | 空数据、真实停止记录、删除后重算已覆盖；保存失败草稿与全部混合数据集的周统计边界仍缺系统验收。 |
| AT-13 单一下一步与方法库 | **Partially Implemented** | 首次推荐和方法库可达；由于未完成 Session 恢复缺失，“继续优先于新开”未满足。 |
| AT-14 换法与再次进入 | **Partially Implemented** | 准备页换法不创建完成；重入新建 ID、旧记录不被覆盖已验；练习中“停止当前＋新建尝试”的连贯路径未完整覆盖。 |
| AT-15 可访问与安全出口 | **Partially Implemented + Device-Only** | 320px、大字号、键盘、焦点、Reduced Motion、停止与存储错误退出已有浏览器证据；VoiceOver／TalkBack／NVDA 未执行。 |
| AT-16 禁止推断与夸大 | **Already Implemented（本轮范围）** | claims 门禁、domain 结果与十二法合同禁止意识分、疗效和假稳定度；未来通知／课程仍需单独审查。 |

## 状态机 S0–S13 摘要

S0 推荐、S1 安全、S2 可选输入、S3 准备、S4 真实练习、S5 用户暂停、S6 浏览器后台、S7 停止、S8 自然结束、S9 可跳过反馈已有实现或部分实现。S10 原子保存／失败提示与 S12 可退出存在，但可见重试不足；S11 真实历史已存在；S13 完整恢复是主要缺口。现有 schema 的 `completed / stopped / abandoned` 不能直接当成任务书全部状态，需迁移方案与回退测试后才能扩展，不在本轮用文档强行改名。

## 必须保留的未验证与阻塞

- 真实 iPhone／Android、系统返回、触摸、Safari／微信、屏幕阅读器、原生通知和 OS 生命周期：**NOT VERIFIED**。
- iOS export 只是静态 bundle，不是签名 IPA、原生构建或真机验收。
- 当前依赖 advisories 和 GitHub release readiness 仍是发布阻塞，不能靠 UI 验收豁免。
- 长时长独立课程、外部内容授权、真人理解／复用／疗效、B／C 与商业验证均未关闭。

因此本轮可以交付“V3 工程候选＋明确缺口”，不能宣称完整 16 项验收或发布就绪。下一实现应从 AT-10／AT-11 的迁移设计开始，再关闭 AT-12～AT-14；每项小变更独立回归安全、计时、原句与删除。
