# Phase 1 — 开源代码 REA 与许可证

完整报告：[开源代码 REA 与许可证边界](../../research/OPEN_SOURCE_REA_LICENSE_V3_2026-11-01.md)。

| 仓库 | 固定提交 | 技术栈 | 本轮用途 |
| --- | --- | --- | --- |
| Medito | `c7dbdaa8700f8138cb45319050405329217ef726` | Flutter | 播放、下载、历史与失败状态的职责分离 |
| Hey Linda | `42da556101efdb12debce6cae21d323a2b25b54e` | Expo / Redux | 收藏、活动、下载和持久化边界 |
| nyxkn/meditation | `56f56d0a2f2ec97aae04f852f8b5dc90dbf72b4c` | Flutter / Dart | wall-clock、生命周期、权限失败与测试缺口 |

只读源码，不复制代码或资产。Medito／Hey Linda 为 AGPL，nyxkn/meditation 为 GPL-3.0-only，且后者的图像、音频与 Android 资源另有许可边界。没有引入相关依赖，没有重写 StillMind 为 Flutter／Redux，也没有把公开可读误写为可商用素材。

三个 App 均未在本轮实际运行。nyxkn/meditation 的测试文件仍是计数器模板，因此不能声称其计时或通知已有测试覆盖。
