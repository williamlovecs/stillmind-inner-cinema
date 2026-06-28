# StillMind App Store Submission Runbook

Start with `SUBMISSION_PACKAGE.md` for App Store Connect copy, review notes, privacy-label draft, screenshot story, and pre-submit checklist. This runbook covers build and submission mechanics.

## Build Strategy

StillMind uses Expo/EAS so iOS builds can be produced from Windows in a cloud macOS environment. The app is native React Native, not a WebView wrapper.

Required external accounts:

- Apple Developer Program membership.
- App Store Connect app record.
- Expo account and EAS project linkage.
- Final support URL, privacy-policy URL, and support email.

Current public URL drafts:

- Support: `https://stillmind-inner-cinema.vercel.app/support`
- Privacy: `https://stillmind-inner-cinema.vercel.app/privacy`
- Terms: `https://stillmind-inner-cinema.vercel.app/terms`

Current support process:

- Non-sensitive product feedback routes to public GitHub issue templates.
- GitHub blank issues are disabled to reduce accidental disclosure of private trigger text.
- A monitored private support mailbox remains a human gate before broad App Store launch.

## Identifiers

- Working bundle identifier: `com.stillmind.innercinema`.
- URL scheme: `stillmind`.
- App name: `StillMind`.
- Subtitle hypothesis: `从剧情回到选择`.

The publisher must confirm bundle ID ownership before the first signed build. Changing it after release creates a different app.

## EAS Commands

Run from `mobile/` with Node >=20.19.4:

```powershell
npm run status:launch -- --live
npm run verify:release
npm run check:release-readiness
npm run check:eas
npx eas-cli login
npx eas-cli whoami
npx eas-cli project:init
npx eas-cli project:info
npx eas-cli build:configure
npx eas-cli build --platform ios --profile preview
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

Do not submit until the preview build has passed the real-device matrix.

## Real-Device Test Matrix

- Fresh install and onboarding.
- Skip text input and complete a local reset.
- All six modes and 1/3/5/10-minute route coverage.
- Pause, background, resume, stop, and complete.
- Airplane mode from launch through saved reflection.
- AI opt-in, success, timeout, malformed response, and fallback.
- Notification permission denied and granted.
- Haptics off, body focus off, breath change off, eyes-open preference.
- Dynamic Type, VoiceOver labels, Reduce Motion, high contrast.
- Individual session delete, export, delete all.
- Privacy and terms links.
- Public support link.
- Issue templates for bug reports, experience feedback, and safety/boundary feedback.
- Device restart persistence.

## App Review Guideline 4.2 Evidence

The native app provides utility beyond the Web demo:

- Offline twelve-method practice library.
- Deterministic local recommendation engine.
- Native haptics and local notifications.
- Local SQLite history and weekly reflection.
- Native sharing/export and device privacy controls.
- Accessibility alternatives and background/resume behavior.

## Privacy Answers Draft

For the first local-only free build, if no analytics SDK/account system is added:

- Data linked to identity: none.
- Tracking: no.
- User content sent to server: only when optional AI is enabled and the user requests AI cinema.
- Data retained by developer: none by design for AI requests; verify Vercel/provider logging before claiming this.
- Diagnostics: disclose only if the shipping build includes crash/analytics SDKs.

App Store Connect answers must be regenerated from the final binary, not copied blindly from this draft.

## Review Notes Draft

StillMind is a non-clinical general-wellness app. The reviewer can use all core functionality without an account, subscription, microphone, or AI. To test: choose a current state on Today, select one minute, begin the recommended practice, complete the after-check, choose a grounded action, and open Reflection. All of this works offline. Optional AI Inner Cinema is off by default and has deterministic fallback.

## Submission Gates

- [ ] App Store Connect copy reviewed against `SUBMISSION_PACKAGE.md`.
- [ ] Final 1024x1024 icon and splash assets.
- [ ] iPhone 6.9-inch and 6.5-inch screenshots; iPad only if supported.
- [ ] App description, keywords, category, age rating, copyright.
- [ ] Real support email and URLs.
- [ ] Privacy nutrition labels match binary.
- [ ] Export-compliance questions answered.
- [ ] Apple sign-in not required because no account exists.
- [ ] If purchases are enabled: products approved, restore works, terms/privacy linked.
- [ ] Xcode/iOS SDK requirements satisfied by EAS build image at submission time.
- [ ] TestFlight external testing notes and feedback channel ready.
