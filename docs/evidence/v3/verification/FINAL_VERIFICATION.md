# StillMind V3 最终提交复验

## 被测版本与范围

- 被测提交：`790a591cf34618e77f1f0b396f1823bf9a852b70`。
- Draft PR：#7，`design/stillmind-rea-ui-v3-20261101` → `feat/stillmind-experience-v2-20261031`。
- 本文件与最终日志、JSON、截图提交到独立 `evidence/stillmind-v3-final-20261101` 分支；PR 被测 HEAD 不再为写入自引用 SHA 而改变。
- 所有新增构建、截图、日志、临时浏览器配置和命令输出均写入 E 盘工作区。未修改 main、B／C、独立官网，未合并或生产发布。

## 本地同 SHA 实际结果

| 命令／检查 | 结果 | 原始证据 |
| --- | --- | --- |
| `npm run typecheck` | 通过：Web、tokens、domain、content、mobile | [日志](logs/final-typecheck.log) |
| `npm run lint` | 通过：Web 与 Expo | [日志](logs/final-lint.log) |
| `npm test` | 148 项通过，0 failed | [日志](logs/final-unit.log) |
| `npm run check:claims` | 通过；仅为词法门禁 | [日志](logs/final-claims.log) |
| Next Webpack production build | 通过，26 个静态页面，含十二法详情 | [日志](logs/final-web-build.log) |
| `npm run build:mobile:web` | 通过，Expo Web 导出 12 个静态路由 | [日志](logs/final-mobile-web-build.log) |
| `npm run build:mobile:ios` | 通过，1797 modules，导出 4.5 MB HBC 与 metadata | [日志](logs/final-mobile-ios-build.log) |
| `npm run smoke:web` | 18 项主回归＋10 项对抗测试通过 | [日志](logs/final-web-smoke.log) · [JSON](web-smoke-result.json) |
| `npm run smoke:product:web` | 4 项本机产品路径通过 | [日志](logs/final-web-product-smoke.log) · [JSON](web-product-summary.json) |
| `npm run smoke:native` | 15 项 Expo Web 主回归通过 | [日志](logs/final-native-smoke.log) |
| `npm run smoke:product:native` | 3 项 Expo 本机产品路径通过 | [日志](logs/final-native-product-smoke.log) · [JSON](native-product-summary.json) |

三份最终 JSON 的 `testedGitSha` 都是 `790a591cf34618e77f1f0b396f1823bf9a852b70`，均为 `complete: true`。Web 主回归 `browserErrors: []`；两份产品路径均为 `failures: []`、`externalRequests: []`。性能字段只是本机单次浏览器记录，不是 Lighthouse、公网或真实用户指标。

iOS 结果只证明静态 bundle 导出，不证明签名 IPA、原生编译、系统生命周期或真实 iPhone 验收。

## 截图与同条件对照

- Web 主回归新增 390／768／1440 首页与准备页断言和截图；768 首页与准备页已实际打开查看，无新增视觉阻塞。
- 三方向五屏原型共 30 张图，已在此前轮次实际查看；本次未重写成生产功能或真人验证。
- 精确 V2 `c32d423c4eaa5e3f263d1679bb78eee0fd181fbd` 与最终 V3 的七组 14 张同条件图已重新生成。清单确认 `v3Sha` 为最终提交，且相同任务、输入、viewport、可控时钟、Reduced Motion、暂停状态和观电影原句；无外部请求或浏览器异常。[清单](../compare/capture-manifest.json) · [最终运行日志](logs/final-v2-v3-compare.log)
- V2 迁移依赖构建所需临时 `transpilePackages` 已恢复，对照工作树干净且仍固定于精确 V2 SHA。

## 最终 GitHub 检查

PR #7 HEAD 已核对为 `790a591cf34618e77f1f0b396f1823bf9a852b70`。GitHub Actions run `41235573413`：

- `Read-only source handoff`：通过。
- `Web production browser regression`：通过。
- `Verify release readiness`：失败，发布门禁未放行。
- `Vercel Preview Comments`：通过；这是仓库既有 Preview 集成，不是生产发布或真实设备验收。

## 依赖审计

最终实际执行 `npm audit --json`，命令以退出码 1 表示存在 advisories；该预期非零退出已单独记录，没有当作功能测试失败隐瞒。[原始 JSON](npm-audit.json)

- Critical：0
- High：5 个受影响包条目
- Moderate：26
- Low：2
- Total：33

High 名称为 `@expo/cli`、`decode-uri-component`、`expo-router`、`query-string`、`zod`，包含传递依赖链的重复影响，不等于五个独立漏洞。未执行 `audit fix --force`，未升级 Expo 大版本，未修改锁文件；当前没有发布安全放行。

## 未关闭的 AT 差距

- AT-10：**Partially Implemented**。缺少用户可见的原 Session 保存重试闭环。
- AT-11：**Missing**。缺少 running／paused／completed_candidate／save_error 的完整恢复；当前重载保守记为 abandoned。
- AT-12～15 仍有部分边界未关闭；AT-06／15 含 Device-Only。完整逐项映射见 PR 的 `docs/handoff/v3/08_QA_REPORT.md`。

因此结论是 **V3 工程候选＋明确缺口**，不是完整 16 项验收或发布就绪。

## NOT VERIFIED 与环境说明

- 真实 iPhone／Android、原生构建、真实触摸、系统返回和 OS 后台：**NOT VERIFIED**。
- Safari、微信内置浏览器、VoiceOver／TalkBack／NVDA 和完整无障碍审计：**NOT VERIFIED**。
- 真实麦克风、通知、分享、签名 IPA、TestFlight／应用商店：**NOT VERIFIED**。
- 真人理解、48–72 小时复用、心理疗效、留存、付费与临床结果：**NOT VERIFIED**。
- 十二套独立长时长课程及外部内容授权仍未关闭。
- 最后执行 `agent-reach check-update` 时环境返回 `command not found`；未把它写成更新成功，也未因此重复竞品研究。
- 测试脚本已关闭其拥有的本地服务器和一次性浏览器；没有停止用户原有 Chrome 或其他应用进程。
