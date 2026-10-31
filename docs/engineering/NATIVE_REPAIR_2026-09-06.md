# 原生会话与依赖续修｜2026-09-06

分支 `fix/native-integrity-deps-20260906`，PR #3，基于PR #1的Web修复。不合并main、不主动正式发布、不重新定义产品。

## 原生会话实现

- 评分默认未填写；首页明确选择使用 ratingProvided 标记。旧链接的数字仅作推荐提示，不回填为用户自报。
- 共享纯时间函数记录实际活跃时长，另存计划时长。开始、结束、反馈顺序化保存同一ID；停止/放弃不记录为完成。
- 直接链接、手选、推荐及AI生成后共用开始资格检查，等待引导及偏好加载完成。
- 反馈、分数、复用意愿、行动均可不填。主观感觉另存 reportedResult；任一不适信号令结束文案保守；停止状态优先。行动选择不是完成证据。
- AI请求在离开、取消、输入变更或后台时取消。过期响应不能重新开始。默认/direct流程仍离线。
- 渲染实际返回的分镜instruction；2/3幕均保持所选总时长。生成契约1.1.0与既有离线1.0.0可区分。
- 暂停同步冻结时钟、按钮、输入及光圈；前台需主动继续；减少动效生效。
- 画面参数不叫心理百分比，身体点击不预填感受，念头模板明确为示例。
- 存储失败不阻断退出；保存与删除共用顺序队列，已删除ID不会被晚到反馈复活；并发分析身份和删除也有代际保护。
- 分析默认关；开始前同意才发送真实生命周期，晚同意只发送反馈；accepted:false不算入库，不发送原话或自由反馈。

## SDK57迁移与证据

run33983507595：只读candidate101352839025完整验证和Web回归通过，隔离writer101353597915只提交两个package.json和lockfile，commit3b024f3d069f5f2c1b4e1f102b88ab9273939535。

Expo57.0.20 / RN0.86.3，使用正式兼容清单、clean install、dedupe、再次npm ci，未跳过Doctor。after-audit.json当时total=0，所有等级0；这不是绝对安全证明。

### 两项精确依赖处理

xcode的uuid固定11.1.1并测试24位project ID。query-string7.1.3的decode-uri-component固定0.5.0以去除旧解码路径的通告项，但它转为ESM。直接覆盖曾导致decodeComponent不是函数；scripts/patch-query-string-cjs.mjs仅将require结果解析为default导出或原模块，不替换算法。

桥接检查明确版本及唯一原始import签名，幂等，签名变化会报错。postinstall和真实xcode/query-string调用测试保证干净安装可复现。后续Expo升级到兼容的新query-string后，重新验证并移除桥接、postinstall及不再需要的override，不能跳过脚本却宣称相同运行环境。

临时写入CI及迁移helper已移除，常规CI仅contents:read，checkout不保留凭据。

## 测试分层

原83项 + 原生14项 + 依赖实际调用3项；最终实际通过情况看Checks。Next production保留10组Chromium场景。Expo Web export新增5组真实UI场景：引导门槛、空评分/暂停/8秒退出、链接资格、自然60秒完成与更差反馈、存储异常。全为合成数据，非本机HTTP阻断。

这些不能证明iOS真机/签名/TestFlight/医疗效果/内容授权/模型线上成功率。真实seed用户不可用合成测试替代。

## 参考

- https://github.com/williamlovecs/stillmind-inner-cinema/actions/runs/33983507595
- https://github.com/williamlovecs/stillmind-inner-cinema/actions/runs/33983507595/artifacts/9974524732
- https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
- https://expo.dev/changelog/sdk-57
- https://github.com/advisories/GHSA-w5hq-g745-h8pq
- https://github.com/advisories/GHSA-vcc3-ghjq-m6fr
