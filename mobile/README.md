# StillMind Native App

Expo SDK 56 / React Native client for the complete StillMind practice system.

## Product surfaces

- Today: state selection and deterministic recommendation.
- Reset: safety gate, optional AI Inner Cinema, timed practice, after-check, grounded action.
- Practices: twelve offline methods, duration variants, favorites, and method hiding.
- Reflection: local history and low-sample-safe weekly review.
- Me: comfort settings, reminders, AI consent, export, deletion, privacy, and terms.

Core sessions work offline. AI is optional and falls back to local content.

## Local development

Use Node `>=20.19.4` from the repository root:

```powershell
npm install
npm --workspace mobile run start
```

Useful checks:

```powershell
npm run verify:release
npm run check:eas
npm run typecheck:mobile
npm run lint:mobile
npx expo-doctor mobile
npx expo export --platform ios --output-dir C:\tmp\stillmind-ios
```

## EAS / iOS

`eas.json` pins Node 22 for cloud builds. The final publisher must log in and link the project:

```powershell
cd mobile
npm run check:eas
npx eas-cli login
npx eas-cli whoami
npx eas-cli project:init
npx eas-cli project:info
npx eas-cli build --platform ios --profile preview
```

See `../docs/app-store/APP_STORE_SUBMISSION.md` and `../docs/HUMAN_GATES.md` before TestFlight or App Store submission.
