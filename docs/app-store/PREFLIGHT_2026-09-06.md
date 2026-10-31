# 上架前置复核｜2026-09-06

状态：工程准备和待办已整理；未创建Apple/EAS账号、签名包、TestFlight组或App Store提交。本文覆盖旧SUBMISSION_PACKAGE中与当前行为不一致的假设，但不把草稿升级为事实。

## 仓库直接可见的配置

| 项目 | 当前值 | 仍需确认 |
| --- | --- | --- |
| App名/版本 | StillMind / 1.0.0 | 商店名称可用性、最终版本 |
| iOS Bundle ID | com.stillmind.innercinema | Apple团队是否拥有对应App ID |
| Android package | com.stillmind.innercinema | 最终发布主体 |
| EAS关联 | app.json未填owner/projectId | 登录正确组织后关联，不猜ID |
| preview | internal distribution、Node22.14.0 | iOS设备注册与签名；不是TestFlight包 |
| production | autoIncrement、Node22.14.0 | 远端build number、签名和提交信息 |
| optional AI origin | app.json extra.apiBaseUrl指向既有vercel.app | 测试前确认到底连接哪个部署；不拿正式key做回归 |
| analytics origin | EXPO_PUBLIC_STILLMIND_API_BASE_URL | 构建环境是否配置，不能只检查Web env |
| 支持渠道 | 公开GitHub问题 + 文档提示私密邮箱待补 | 能实际接收私密问题的渠道、响应负责人 |

原有资源与权限插件需要在签名产物中复核；不因源码没有某项权限就断言最终二进制没有SDK采集。Web语音来自浏览器；不能把这段说明直接当作原生麦克风权限说明。

## 两条分发路线不能混淆

内部分发preview用于注册设备上的安装验收；iOS需相应配置与签名。TestFlight需要面向商店的构建和App Store Connect准备，外部测试还涉及Beta App Review。Expo bundle export和浏览器模拟都不等于上述产物。[3][4]

账号负责人操作前先看git status、候选SHA与现有EAS/Apple项目。不要新建重复项目、付费账号或提交应用；本清单没有授予这些操作。

## 隐私标签：旧“没有采集/没有标识符”不能原样提交

| 实际路径 | 源码能证明什么 | 标签决定前的缺口 |
| --- | --- | --- |
| 默认离线练习 | 本机记录；未同意不发产品事件 | 核验最终构建/日志/SDK，不能仅凭无账号认定所有数据不关联 |
| 可选AI | 用户启用后相应操作发送必要文字 | 服务商实际保留、处理、网络日志及转发配置 |
| 可选analytics | 随机安装标识、会话标识、方法/状态/结果等发送到配置端点 | 需评估Usage Data、Identifiers、User Content/敏感内容的实际分类；随机ID不等于无标识符 |
| 私密支持 | 当前缺可验证渠道 | 提交内容、保留、删除/查询处理人 |

Apple要求按实际收集及第三方行为填写；“可选”本身不足以豁免，须满足全部例外条件。仅在设备上处理与离开设备后的处理应分别判断。[2] 不能凭本表替用户勾选最终App Privacy答案。

撤回分析同意现在会取消待发送与在途请求；服务商已经收到的数据不能靠取消网络请求删除。隐私页应提供实际可执行的数据请求渠道，不诱导用户在公开issue中披露私人内容。[1]

## 送审材料待办

- 用实际签名版本截图，记录对应版本和设备；不用宣传页当真实功能截图。
- Review notes写清无账号的离线流程、可选AI与回退、如何停止和删除数据，不把每次练习写成实时AI。
- 支持/隐私/条款在目标地区网络实测可访问，内容与实际构建一致。
- 完成版权矩阵；不把来源索引或脚本检查当授权。
- 真实设备测打开、键盘、后台、暂停、停止、减少动效、VoiceOver、通知开关、导出/删除；所有不适可退出。
- 年龄分级、出口合规、发布主体及地区要求由负责人对照最终问卷确认；本轮不替其作法律或医疗判定。

以上是送审准备，不保证审核通过。[1]

## 官方核对依据

本轮按2026-09-06读取的官方页面核对，后续提交时仍应复查。

[1] Apple App Review Guidelines，重点1.4/1.5、5.1、5.2：https://developer.apple.com/app-store/review/guidelines/
[2] Apple App Privacy Details：https://developer.apple.com/app-store/app-privacy-details/
[3] Expo internal distribution：https://docs.expo.dev/tutorial/eas/internal-distribution-builds/
[4] Expo TestFlight：https://docs.expo.dev/submit/testflight/
