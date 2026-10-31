# Phase 3 — Still Room 设计系统

生产规范：[StillMind Design System V3](../../design/STILLMIND_DESIGN_SYSTEM_V3.md)。共享实现：`packages/design-tokens/src/index.ts`；Web 与 Expo 各自使用原生组件，不强行共享 DOM／CSS。

## 核心约束

- 暖纸、矿物墨色、低饱和绿和单一陶土行动色；练习观看空间可用暖灰黑。
- 默认一个决定，输入与长期说明按需展开；卡片只在确有分组功能时出现。
- 320px 起保持长中文可读、44×44 CSS px 触控目标与可见键盘焦点；Reduced Motion 保留同等内容和静态构图。
- 练习对象不是生物传感器。静止、缩放、计数和完成动画都不能生成稳定度、觉察分、呼吸准确率或治疗效果。
- 结束、停止、worse、未评分和保存失败分开表达；返回是普通出口。

本轮补充五屏方向证据，没有重新生成 Quiet Cinema，也没有改变十二法的业务含义。最终 768px 与 V2／V3 对照证据分别见 [08_QA_REPORT.md](08_QA_REPORT.md) 和 [09_BEFORE_AFTER.md](09_BEFORE_AFTER.md)。
