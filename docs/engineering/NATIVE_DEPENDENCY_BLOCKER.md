# 原生依赖阻塞与验证记录

## 已观察的 CI 结果

修复分支 `a99a0f9`，Actions run `33979627992`：

- 83 项测试（原有59 + 新增24）通过。
- Web/domain/content/mobile 类型检查、Web/mobile lint 通过。
- 扩大范围后的文案 guard、Next.js 生产构建、发布材料/EAS/App Store/GTM/来源边界检查通过。
- `expo-doctor@1.20.4`：20/22 通过，两项失败，完整 `verify:release` 因此为红色。不得称为全部检查通过。

日志：https://github.com/williamlovecs/stillmind-inner-cinema/actions/runs/33979627992

## 阻塞项

Doctor 报告当前锁定 `expo@56.0.18` / Hermes V1 `250829098.0.10` 涉及已知内存回归，并建议评估 SDK57 / React Native0.86.2 或之后的匹配版本。另报告11个Expo包的patch版本不匹配。这里是该次工具输出，不是本分支已完成的升级方案；迁移前应核实官方当前发布说明和设备兼容性。

本次会话修复没有改变依赖版本、overrides或lockfile。原生SDK升级会涉及新的回归面，不为使CI变绿而执行 `npm audit fix --force`，不忽略Doctor检查，不降级Doctor掩盖结果。

## npm audit

同一CI的JSON报告：23项（16 moderate、7 high、0 critical）。这是受影响包计数，不能等同于23个独立且可利用的线上漏洞。

报告中的high包括 @expo/metro、metro、metro-config、metro-transform-worker、browserslist、image-size、nanoid，存在依赖链重复计数。需按安装路径、实际调用方式和可用修复版本逐项判断。audit有建议重大变更甚至降级的候选，不能机械应用。

报告：https://github.com/williamlovecs/stillmind-inner-cinema/actions/runs/33979627992/artifacts/9973364629

没有这些风险已经解决、没有可利用路径或生产安全的保证。

## 接手顺序

1. 保存本分支的Web修复，不改main、不自动发布。
2. 在另一个原生依赖维护分支对齐Expo/RN/Hermes和lockfile；先读当前官方迁移与回归说明。
3. 用原有完整 `npm run verify:release` 验证，不排除失败检查；再做签名preview和iPhone真机测试。
4. 单独核验npm audit中的安全通告及实际依赖路径，记录解决/不适用的证据。
5. Web浏览器回归独立运行，避免原生Doctor阻止我们看到Web行为结果。这个拆分不豁免发布检查；发布job继续按真实结果失败。

CI会在完整验证失败时继续采集iOS/Web bundle导出证据，但导出成功也不是已签名可安装包。最终结果看最新PR，不以本记录覆盖更新的运行结果。
