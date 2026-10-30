# WakeupHelper UI Refresh 2026-06-29

状态：已完成视觉刷新；v3.2 public distribution 仍 ON HOLD。

## 设计方向

- 只借鉴“纸本/墨色/留白”的视觉气质，不引用《意识强度》正文内容。
- 不继续扩展《意识强度》附录功能。
- 附录入口在 UI 中显示为 `附录（授权中）`，并保持禁用。

## 改动

- 全局主题改为暖纸色画布、墨色文字、淡金点缀。
- 首页窗口加宽，日志区增加留白。
- 首页 `选择` / `开始` 按钮恢复可见且保留主次层级。
- About 页面扩大，署名不再挤出窗口。
- 链接色、菜单色、输入框/下拉框/日志框统一到纸本风格。

## 验证

- `dotnet build WakeupHelper.csproj`: PASS
- `dotnet build WakeupHelper.csproj -c Release`: PASS
- `FunctionalSmokeTests`: PASS
  - Tencent path: PASS
  - Feishu path: PASS
  - Consciousness appendix path: PASS
