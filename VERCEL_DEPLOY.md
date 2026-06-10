# Vercel 部署指南

StillMind: Inner Cinema 部署到 Vercel 的完整步骤。

## 一次性准备

1. 注册 / 登录 [vercel.com](https://vercel.com)
2. 绑定 GitHub 账号（Vercel 需要访问 `williamlovecs/stillmind-inner-cinema` 仓库）
3. 完成账号设置（不需要绑卡，免费 plan 够用）

## 步骤

### 1. Import Project

- Vercel Dashboard → "Add New..." → "Project"
- 在 "Import Git Repository" 找到 `williamlovecs/stillmind-inner-cinema`
- 点击 "Import"

### 2. Project 配置

| 项 | 值 | 说明 |
|---|---|---|
| Project Name | `stillmind-inner-cinema` | 会决定默认域名 |
| Framework Preset | Next.js | 自动检测，不用改 |
| Root Directory | `./` | 默认 |
| Build Command | `npm run build` | 默认 |
| Output Directory | 默认（不填） | Next.js 自动 |
| Install Command | `npm install` | 默认 |
| Node.js Version | 20.x 或更高 | 默认应该 OK |

### 3. Environment Variables

展开 "Environment Variables"，**只加一个**（可选项）：

| Name | Value | 适用环境 |
|---|---|---|
| `STEPFUN_API_KEY` | (你的 StepFun key) | Production / Preview / Development |

**如果留空**：产品完全可用，只是分镜来自本地 `cinema-presets.ts` 模板（4 套分类：忽视/冲突/证明/默认）。这就是 pre-launch 给真人测试的推荐模式——稳定、零成本、不消耗配额。

**如果填了**：每次请求会调用 StepFun，可能延迟 2-8 秒，可能失败（fail-soft 走 preset）。

可选进阶：
- `STEPFUN_MODEL` = `step-3.7-flash`（默认）

### 4. Deploy

- 点击 "Deploy"
- 等 ~60-90 秒
- 看到 "Congratulations!" 就是成功了

### 5. 拿到 URL

Vercel 会给一个默认域名：

```
https://stillmind-inner-cinema.vercel.app
```

### 6. Smoke Test

打开 URL，验证：
- [ ] 看到 disclaimer modal
- [ ] 勾选后能进入主页
- [ ] "一键演示" 能完整跑完 4 步（home → cinema → perspective → observer → return）
- [ ] 浏览器 devtools Network → `/api/cinema` 看 response 里的 `source` 字段（应该是 `preset` 或 `stepfun`）
- [ ] 检查 `/privacy` 和 `/terms` 能正常打开

### 7. （可选）自定义域名

Vercel Project Settings → Domains → 添加你的域名
- 域名在 Cloudflare / Namecheap 等都行
- Vercel 会给 DNS 记录，复制过去
- 几小时内生效

## 部署后

- **每次 push 到 main** → Vercel 自动重新部署
- **PR** → 自动生成 preview URL（适合给真人测试用）
- **回滚** → Deployments tab → 选历史部署 → "Promote to Production"

## 常见问题

### Build 失败 "Module not found"

不会发生，本项目依赖很少（next / react / tailwind）。

### 部署后 disclaimer 弹窗不显示

清浏览器 localStorage，或开 incognito 重新访问。

### StepFun API 调不通

UI 不会挂——route.ts 已做 fail-soft，会自动回退到 preset 模式。

### 怎么查看部署日志

Vercel Project → Deployments → 点具体部署 → "Logs"。

## 成本

- **Vercel free plan**：100 GB 带宽/月，对早期测试够
- **StepFun API**：如启用，按 token 计费。建议 pre-launch 留空
- **域名**（可选）：~$10-15/年
