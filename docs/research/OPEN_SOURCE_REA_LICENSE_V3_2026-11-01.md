# 开源代码 REA 与许可证边界 — StillMind V3

日期：2026-11-01
结论：本轮只读公开源码，提炼状态与职责边界；**没有复制代码、组件、文案、课程、图像、音频或字体进入 StillMind**。以下不是法律意见；若以后改为复制或改编 AGPL 代码，必须先做独立许可证评审。

## 固定研究版本

| 仓库 | 固定提交 | 许可证实际读取结果 | 源码与许可证 |
|---|---|---|---|
| `meditohq/medito-app` | `c7dbdaa8700f8138cb45319050405329217ef726`，提交时间 2026-10-30 | 根 `LICENSE` 正文为 GNU Affero General Public License v3 | [源码](https://github.com/meditohq/medito-app/tree/c7dbdaa8700f8138cb45319050405329217ef726)、[LICENSE](https://github.com/meditohq/medito-app/blob/c7dbdaa8700f8138cb45319050405329217ef726/LICENSE) |
| `heylinda/heylinda-app` | `42da556101efdb12debce6cae21d323a2b25b54e`，提交时间 2026-07-19 | 根 `LICENSE` 正文为 GNU Affero General Public License v3 | [源码](https://github.com/heylinda/heylinda-app/tree/42da556101efdb12debce6cae21d323a2b25b54e)、[LICENSE](https://github.com/heylinda/heylinda-app/blob/42da556101efdb12debce6cae21d323a2b25b54e/LICENSE) |

许可证包含修改作品的 copyleft、对应源码提供义务，以及网络交互场景的源码提供条款。是否构成衍生／结合作品、义务覆盖范围和第三方资产许可是具体法律问题，不能由“公开可读”或“非商业使用”自动消解。本 PR 不引入两仓库代码或依赖，因此没有把 StillMind 重新许可为 AGPL。

## Medito：观察到的职责分离

**证据等级：SOURCE OBSERVED。未运行 Flutter App，所有界面、真实播放和平台行为 NOT VERIFIED。**

### 播放器与会话

阅读：

- `lib/providers/player/player_provider.dart`
- `lib/providers/player/audio_state_provider.dart`
- `lib/providers/player/download/audio_downloader_provider.dart`
- `lib/services/history/app_history_service.dart`（路径确认）
- `lib/utils/stats_updater.dart`（路径确认）

观察：

1. 播放请求与播放状态分别建模；切歌前清理旧的播放位置、完成标记等状态，避免把上一首的结束位置带进新会话。
2. 启动播放失败会向调用方传播，源码注释要求显示错误，避免进入一个看似正在播放、实际无声的页面。
3. 本地文件路径优先，远端地址作为回退；下载状态至少区分未下载、下载中、已下载，并保存进度。删除文件和更新已下载记录放在同一长寿命操作中。
4. 播放状态包含位置、时长、播放中、缓冲、跳转、完成等字段；平台音频回调向会话跟踪提供真实位置。
5. 这些代码证明一种实现思路，不证明当前商店版本行为、测试覆盖率或体验质量。

**抽象借鉴**：StillMind 继续复用自己的 domain session clock；表现层不得自行把动画结束当练习完成，不得把下载／加载／暂停混为“已完成”。准备失败、保存失败与停止均需可见且可退出。

**不采用**：Flutter / Riverpod 迁移、音频服务代码、文件命名、统计字段、80% 阈值、图标与课程数据。

## Hey Linda：观察到的记录与音频边界

**证据等级：SOURCE OBSERVED。未运行 Expo App，所有界面与播放行为 NOT VERIFIED。**

阅读：

- `screens/Play/index.tsx`
- `redux/meditationSlice.ts`
- `redux/store.ts`
- `screens/Home/`、`screens/Stats/`、`screens/Completed/`（目录确认）

观察：

1. 播放页分别持有音频对象、加载、播放中和位置／时长状态；播放完成事件写入活动记录并替换到完成页。
2. 播放源优先匹配本地下载文件，找不到时使用远端 URI；卸载时释放音频对象。
3. 收藏、活动时长与下载路径分别存储；持久化采用 Redux Persist + AsyncStorage，并带存储版本号。
4. 播放页的暂停只改变音频与播放状态，不能直接证明它拥有 StillMind 所需的停止、worse、未评分、保存失败和安全门语义。
5. 该实现是较早的 Expo / Redux 结构；它不是 StillMind 需要引入的新技术底座。

**抽象借鉴**：收藏与完成不是同一字段；媒体资源与完成记录不是同一生命周期；持久化需要明确版本与字段边界。

**不采用**：Redux 迁移、播放器组件、样式、图片、课程、音频、AsyncStorage 结构或完成逻辑。

## 对 V3 实现的具体约束

- 不新增 AGPL 依赖，不建立“借鉴组件”副本；所有 React / CSS / React Native 表现层在 StillMind 现有代码上重新实现。
- 复用现有 `@stillmind/domain`、内容目录、storage 和 attempt 语义，不用竞品状态模型覆盖本地安全逻辑。
- 新视觉只展示已有数据：方法、计时、暂停、停止、真实自报反馈、本地记录；不生成“稳定度”“觉察分”“呼吸准确率”“宽恕进度”。
- 播放器不虚构音频或下载能力；V3 当前是引导式练习，不因研究 Medito 就声称拥有音频课程。
- 后续若需要下载音频、真实课程或账户同步，单独立项验证内容授权、数据边界和失败恢复。
- 许可证全文留在上游链接，不把上游版权头错误附到原创 StillMind 文件；也不删除或弱化此研究记录。
