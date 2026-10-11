# Ship to Seeker

A companion app that helps developers check their Solana Mobile setup and ship their own Seeker dApp. Built in public for the Solana Mobile CLOCK IN hackathon: [clock-in.biboux.com](https://clock-in.biboux.com).

## Build it yourself

Day 1 walkthrough: [Module 01](https://clock-in.biboux.com/m01) (same page in the site repo: `m01.html`).

1. Scaffold with `npx create-expo-app ship-to-seeker-app --template @solana-mobile/solana-mobile-expo-template` (template 3.0.0).
2. Add three bottom tabs: Diagnostics, Build Path, Explainer (`headerShown: false`).
3. On Diagnostics, POST JSON-RPC `getHealth` to `https://api.devnet.solana.com` and show a green Connected or red Unreachable chip.

## Tabs

- **Diagnostics** — on-device checks. Day 1: Devnet RPC `getHealth`.
- **Build Path** — the 7-step build journey.
- **Explainer** — paste an error, get a fix.

## Run

This is an Expo development build (Android). Expo Go will not load Mobile Wallet Adapter.

```bash
npm install
npx expo start
```

Scaffolded from the public [`@solana-mobile/solana-mobile-expo-template`](https://www.npmjs.com/package/@solana-mobile/solana-mobile-expo-template).

## Release

v1.0.0 is the signed Android APK, package `com.biboux.shiptoseeker`. The same file is in Solana dApp Store review.

Download: [clock-in.biboux.com/apk-release](https://clock-in.biboux.com/apk-release)

GitHub release: [v1.0.0](https://github.com/Flow-Biboux/ship-to-seeker/releases/tag/v1.0.0)

Install on a Seeker or any Android phone: download the file, open it, and allow installs if Android asks.

## License

[MIT](LICENSE).

This project is an independent entry. It is not affiliated with Solana Mobile, Radiants, or the Solana Foundation.

## Dependency audit

- `tar` (critical) is overridden to 7.5.22, `postcss` to 8.5.29 and `@xmldom/xmldom` to 0.8.15 in `package.json` → `overrides`.
- Remaining `npm audit` highs come from build tools (Expo CLI, Metro, Jest, React Native codegen). They run on the developer's machine and are not bundled into the APK. Fixing them needs an Expo SDK upgrade, planned after CLOCK IN.
- `bigint-buffer` is removed: the app no longer depends on `@solana/spl-token` (the two program ids it used are inlined).
- `image-size` (via Metro) only reads the app's own image assets at build time. Its fix is a major version Metro does not support yet.
