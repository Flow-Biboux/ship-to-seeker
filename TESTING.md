# Testing

How each part of Ship to Seeker is verified, what runs in CI, and how to reproduce the on-device checks.

## What runs in CI (`.github/workflows/ci.yml`)

| Job | What it proves | Command |
|---|---|---|
| Unit tests + typecheck | Diagnostics, transaction, SGT, SKR, Explainer and progress logic | `npx tsc --noEmit -p . && npm test` |
| Native Android build | The Expo native project compiles to an APK on a clean machine (JDK 17) | `cd android && ./gradlew assembleDebug` |
| Explainer backend smoke test | The live endpoint the app calls answers errors and transaction digests with `{ explanation, fix }` | `bash scripts/smoke-explainer.sh` |

The debug APK is uploaded as a CI artifact. The signed release APK needs `android/keystore.properties` (never committed) and is built locally with `./gradlew assembleRelease`.

## Unit test coverage by integration

| Integration | Tests | What is checked |
|---|---|---|
| Devnet RPC | `src/diagnostics/devnetRpc.test.ts` | Health call, timeouts, error mapping |
| Transaction flow | `src/diagnostics/devnetTx.test.ts` | Confirmation polling, expired-blockhash vs landed signature, Explorer URL |
| Seeker Genesis Token | `src/diagnostics/sgt.test.ts` | Token-2022 metadata pointer + group member match, zero-balance accounts ignored |
| SKR gating | `src/skr/skr.test.ts` | Mint filter in the RPC call, balance sum, display |
| Explainer client | `src/explainer/explainError.test.ts` | Request shape, input cap, response parsing |
| Transaction Explainer | `src/explainer/txDigest.test.ts` | Signature detection, devnet→mainnet fallback, digest without the signature, Explorer URL per cluster |
| Build Path + XP | `src/buildPath/modules.test.ts`, `src/xp/progress.test.ts` | Panels, done-only-after-last-panel, XP and levels |

Network calls are injected (`fetchImpl`), so the tests run offline with fixed RPC responses.

## On-device checks (Mobile Wallet Adapter cannot run in CI)

MWA needs a real wallet app and a user approval, so these run by hand on a Seeker (Seed Vault Wallet) or an Android emulator with an MWA wallet installed.

1. Install: `adb install -r app-release.apk` (or download from https://clock-in.biboux.com/apk-release).
2. **Diagnostics → Devnet RPC → Retry.** Expected: green "Connected" and the devnet version.
3. **Wallet → Connect.** Expected: the wallet shows the "Ship to Seeker" authorization prompt; after approval the card is green and shows the shortened address.
4. **Devnet transaction → Send.** Expected: airdrop if needed, the wallet asks to sign a 0.001 SOL self-transfer, the card turns green, **Explorer** opens the confirmed transaction on `explorer.solana.com/?cluster=devnet`.
5. **Seeker Genesis Token → Check.** Expected on a Seeker: "Verified" with the SGT mint. Elsewhere: a clear "not found".
6. **Explainer → paste the signature from step 4 → Explain transaction.** Expected: "Success · devnet", **View on Explorer**, and a plain-English summary.
7. **Build Path → SKR holder guides.** Expected: unlocked with the SKR balance shown if the wallet holds SKR on mainnet, locked otherwise.

Recorded run on a Seeker (1.0.3): https://clock-in.biboux.com/presentation

## Dependency audit

See the "Dependency audit" section of the README.
