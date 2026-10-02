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

## License

[MIT](LICENSE).

This project is an independent entry. It is not affiliated with Solana Mobile, Radiants, or the Solana Foundation.
