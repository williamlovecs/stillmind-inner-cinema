# Phase 0 — V3 接管、基线与边界

日期：2026-11-01。分支：`design/stillmind-rea-ui-v3-20261101`。实现起点：V2 `c32d423c4eaa5e3f263d1679bb78eee0fd181fbd`；已验收实现提交：`96cd7c0a608842f8e9d946926961b62cd05e9d01`。本轮只补任务书缺口与验收，不重写已有 V3。

## 已核对

- 现有 Draft PR #7 的目标为 `feat/stillmind-experience-v2-20261031`，不修改 main，不合并，不生产发布。
- 保留十二法 ID、domain clock、安全与同意、原句保护、暂停／停止、离线、本机记录、After-check、导出／删除。
- A｜StillMind 是唯一实现对象；B／C 研究档案、独立官网和归档分支不在改动范围。
- 任务文件、研究、原型、截图、构建与日志均在 E 盘工作区；构建产物不因为生成而进入公开提交。
- 既有权威基线：[V2 UX 审计](../../design/V2_UX_AUDIT_V3_2026-11-01.md)、[V3 工程交接](../../engineering/EXPERIENCE_V3_HANDOFF_2026-11-01.md)、[产品规格](../../product/PRODUCT_SPEC.md)、[方法系统](../../product/METHOD_SYSTEM.md)。

## 范围结论

本轮新增的是第三开源对象、Stoic／Rosebud／Headspace／Daylio／Endel 的公开证据、三套五屏原型、严格前后对照、六条 JTBD、十六项 Reset 差距与最终 QA 索引。只有为补齐 768px 回归而扩展现有 smoke 脚本；不以文档代替未实现功能。

真实手机、屏幕阅读器、真实 OS 后台／通知、长课程、真人效果与发布许可保持 **NOT VERIFIED**。依赖审计和 GitHub 发布门禁未放行；push 只可能触发仓库既有 Vercel Preview，不是生产部署。
