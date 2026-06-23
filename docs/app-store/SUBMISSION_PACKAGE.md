# StillMind App Store Submission Package

Status: draft for App Store Connect entry. Final answers must be rechecked against the signed binary, current App Store Connect screens, and legal/privacy review.

Last checked against Apple public help pages: 2026-06-23.

Official reference pages:

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Upload app previews and screenshots: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/
- Manage app privacy: https://developer.apple.com/help/app-store-connect/manage-app-privacy/

## App Information

| Field | Draft value | Owner / gate |
| --- | --- | --- |
| Name | StillMind | Founder confirms final naming availability |
| Subtitle | 从剧情回到选择 | Founder/product |
| Bundle ID | `com.stillmind.innercinema` | Apple Developer account gate |
| SKU | `stillmind-inner-cinema-ios` | Founder can change before app record creation |
| Primary category | Health & Fitness | Product/legal review |
| Secondary category | Lifestyle | Product/legal review |
| Pricing | Free for first release | Commercial gate |
| Login required | No | Verified by product behavior |
| Test account | Not needed | App Review notes should state no account exists |
| Support URL | `https://stillmind-inner-cinema.vercel.app/support` | Production URL verified, private mailbox still pending |
| Privacy URL | `https://stillmind-inner-cinema.vercel.app/privacy` | Production URL verified |
| Marketing URL | `https://stillmind-inner-cinema.vercel.app/` | Optional |

## Promotional Text

当一句话、一条消息或一个念头把你拉进剧情，用一分钟看见反应、退到观众席，再决定下一步。

## Description

StillMind 是一个面向日常情绪触发和反复内耗的状态切换工具。

它不会分析你是谁，也不会替你下结论。你可以选择当下状态和可用时间，获得一个适合的短练习：把反应看成三幕内在电影、跟随轻缓呼吸、观看念头、暂停回复，或回到一件具体的小事。

完成练习后，你可以记录它是否有帮助，并在本地周报中看见哪些场景和方法反复出现。核心体验无需账号、无需网络，个人内容默认保存在设备上。

主要功能：

- 一分钟开始的即时 Reset
- 十二种可选择的观察与回归方法
- 按状态、时间和舒适偏好进行本地推荐
- 可暂停、停止和替换的方法引导
- 私密本地历史与周度回顾
- 自定义提醒、收藏、导出和删除
- 可选 AI 内在电影，关闭后不影响核心体验

StillMind 是一般健康与自我反思工具，不提供诊断、治疗、医疗或紧急支持。如果你处于危险中或无法保证自身安全，请联系当地紧急服务或可信任的人。

## Keywords

正念,内耗,情绪,过度思考,呼吸,觉察,反思,冥想,暂停,自我观察

## What's New

StillMind 首个原生版本：即时 Reset、十二种练习、本地推荐、私密历史、周度回顾、提醒与可选 AI 内在电影。

## App Review Notes

StillMind is a non-clinical general-wellness app. It does not diagnose, treat, monitor emergencies, or provide crisis response.

No account, subscription, microphone, or payment is required. All core flows work offline. Optional AI Inner Cinema is off by default and has deterministic fallback.

Suggested review flow:

1. Open the app and accept the non-clinical product boundary.
2. On Today, choose any current state and select one minute.
3. Start the recommended Reset practice.
4. Complete the after-check and choose a grounded action.
5. Open Reflection to see local history.
6. Open Profile to verify support, privacy, terms, export, and delete controls.

If the reviewer enables optional AI, the app sends only the current trigger text required for that request. If the network or provider fails, the app still returns local preset content.

## Privacy Nutrition Label Draft

This draft is intentionally conservative. Do not submit blindly; regenerate from the final binary and actual production logging/provider configuration.

### Tracking

- Tracking: No.
- Third-party advertising: No.
- Data broker or sale of data: No.

### Data Linked to the User

Draft answer: none.

Rationale: no account, no email, no persistent cross-app identifier, no advertising SDK, no payment in v1.

### Data Not Linked to the User

| Data type | Collected? | Purpose | Notes |
| --- | --- | --- | --- |
| User Content | Yes, only when optional AI is enabled and requested | App Functionality | Current trigger text may be sent through the server/API for a single AI Inner Cinema request. It is not linked to an account because there is no account. Verify provider/Vercel retention before final answer. |
| Diagnostics | No SDK in current binary | N/A | If crash reporting or analytics SDK is added, update this. |
| Usage Data | No external provider in current binary | N/A | Local practice history stays on device. Sanitized analytics adapter is inert until a provider is configured. |
| Identifiers | No | N/A | No advertising identifier or account identifier is used in v1. |
| Contact Info | No | N/A | No account or email field in v1. |

### Local-Only Data

These are stored on device and are not collected by the developer in v1:

- practice preferences;
- local session history;
- private notes;
- reminder hour;
- favorites and hidden methods;
- exported local JSON when the user manually shares it.

## Export Compliance Draft

StillMind uses standard platform networking/HTTPS and no custom cryptography in application code. Final export-compliance answers must be confirmed in App Store Connect for the actual signed build and dependencies.

## Age Rating Draft

Human/legal gate. Draft product stance:

- No unrestricted web access.
- No user-generated public feed.
- No gambling, contests, alcohol, tobacco, sexual content, or graphic violence.
- No medical treatment claims.
- Contains non-clinical emotional self-reflection content and explicit emergency-boundary copy.

Choose the final age rating from App Store Connect's questionnaire after legal/product review.

## Screenshot Set

Use real shipping UI. Do not use generated mockups for App Store screenshots unless they exactly represent product screens.

Required first-pass iPhone story:

1. Today: choose current state and one-minute reset.
2. Recommendation: transparent method choice and alternatives.
3. Reset player: Inner Cinema / thought subtitles / breathing orb.
4. Practice controls: pause, stop, background-safe state.
5. Completion: after-check and grounded action.
6. Reflection: private weekly review and local history.
7. Profile: export, delete, AI toggle, support, privacy, terms.

Copy overlays, if used, must stay modest:

- "一分钟，从剧情回到选择"
- "十二种方法，本地推荐"
- "私密历史，只在设备上"
- "可选 AI，关闭后仍可使用"

Do not claim clinical outcomes, awakening guarantees, consciousness ranking, trauma treatment, anxiety/depression treatment, or guaranteed calm.

## Pre-Submit Checklist

- [ ] `npm run verify:release` passes.
- [ ] `npm run check:claims` passes with no public medical, diagnosis, ranking, or guaranteed-outcome claims.
- [ ] EAS preview build installed on a real iPhone.
- [ ] Support, privacy, and terms URLs return 200.
- [ ] Private support mailbox is monitored or launch scope remains clearly limited.
- [ ] Reviewer can complete the core value without account, payment, microphone, or AI.
- [ ] Delete/export paths work on a real device.
- [ ] Optional AI disclosure matches the final production configuration.
- [ ] App privacy labels match actual binary behavior.
- [ ] App Store screenshots are from the shipping UI.
- [ ] Product copy contains no diagnosis, treatment, crisis-response, awakening guarantee, or consciousness-ranking claim.
