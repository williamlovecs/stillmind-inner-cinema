# StillMind: Inner Cinema

StillMind 是一个非临床的情绪觉察工具。它把一次情绪触发转成三幕第三人称“内在电影”，再通过视角切换、60 秒观察者模式和一个现实行动，帮助用户在回应之前退回一步。

## 核心流程

`输入触发 → 三幕内在电影 → 角色/观众/见证视角 → Observer Mode → 回归行动`

## 产品边界

- 不诊断，不治疗，不定义用户。
- 不宣称替代心理咨询、医疗或紧急支持。
- 用户历史默认只保存在浏览器 `localStorage`。
- StepFun 是可选增强；没有 API key 时使用稳定 preset，完整流程仍可运行。

## 本地运行

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

## 环境变量

复制 `.env.example` 为 `.env.local`：

```env
STEPFUN_API_KEY=
STEPFUN_MODEL=step-3.7-flash
```

`STEPFUN_API_KEY` 可以留空。生产种子测试建议先用 preset 模式，减少网络与生成波动。

## 验证

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## 部署与 GTM

- 部署说明：[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)
- 种子用户邀约：[INVITATIONS.md](./INVITATIONS.md)
- GTM v1 决策与指标：[GTM_V1.md](./GTM_V1.md)

## 数据与法律页面

- `/privacy`
- `/terms`

正式规模化前，需要把 GitHub 反馈入口替换成长期支持邮箱，并重新审核隐私政策与第三方 AI 数据条款。
