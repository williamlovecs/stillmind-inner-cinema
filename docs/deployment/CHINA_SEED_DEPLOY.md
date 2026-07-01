# StillMind China Seed-Test Deploy

Goal: get one WeChat-openable URL for seed users in mainland China. This is not the final production hosting plan.

## Recommended path: Zeabur Hong Kong

Use the same GitHub repo:

`williamlovecs/stillmind-inner-cinema`

Import settings:

- Framework: Next.js
- Root directory: `.`
- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`
- Port: `3000`
- Region: Hong Kong if available

Environment variables:

- Leave `STEPFUN_API_KEY` empty for the first seed test. The preset fallback keeps the 1-minute reset flow stable.
- Optional: `STEPFUN_MODEL=step-3.7-flash`

After deploy, open the URL inside WeChat and test:

1. Home loads within a few seconds.
2. Type one sentence.
3. Choose 0-10 intensity.
4. Tap `开始 1 分钟 Reset`.
5. Finish the practice and submit after-score feedback.

## Backup paths

- Tencent EdgeOne Pages
- Tencent CloudBase

Use the same commands above. For the current seed test, avoid ICP/domain work. Use the platform subdomain first, then send the link to 3-5 seed users.

## Seed-test rule

Do not keep polishing before the first user test. The only required metric is:

`before score -> after score -> would use again?`
