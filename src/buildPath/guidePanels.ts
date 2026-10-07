export type GuidePanel = {
  title: string;
  body: string;
};

export const GUIDE_PANEL_COUNT = 3;

const GUIDE_PANELS: Record<string, readonly GuidePanel[]> = {
  "00": [
    {
      title: "Why",
      body: "You need a development build, not Expo Go. Mobile Wallet Adapter is native Android code. Generate from the Solana Mobile Expo template, run on an emulator or Seeker, and install an MWA wallet (Seed Vault is built in on Seeker).",
    },
    {
      title: "Do this",
      body: "npx create-expo-app … --template @solana-mobile/solana-mobile-expo-template\ncd the app\nnpm install\nnpm run android\n\nSet ANDROID_HOME if Gradle cannot find the SDK. Start the emulator before adb.",
    },
    {
      title: "Checkpoint",
      body: "The template opens on the device. Full guide: clock-in.biboux.com/start\n\nScroll this panel to the end, then Mark done.",
    },
  ],
  "01": [
    {
      title: "Why",
      body: "The phone asks a server (RPC). Devnet is practice SOL. Diagnostics posts getHealth to api.devnet.solana.com. ok → Connected. Anything else → Unreachable.",
    },
    {
      title: "Do this",
      body: "Three tabs: Diagnostics, Build Path, Explainer. One check card: Devnet RPC. Retry re-runs getHealth. Do not use Connection.getHealth on web3.js 1.99 — use fetch.",
    },
    {
      title: "Checkpoint",
      body: "You can name the three tabs and the RPC chip is green or red. Full guide: /m01\n\nScroll to the end, then Mark done.",
    },
  ],
  "02": [
    {
      title: "Why",
      body: "The app never holds keys. It sends an intent; Seed Vault or another MWA wallet approves; you get a public key.",
    },
    {
      title: "Do this",
      body: "useMobileWallet().connect() then show the first 4 and last 4 characters of the address. Catch user-rejected. No wallet found: install an MWA wallet APK on the emulator.",
    },
    {
      title: "Checkpoint",
      body: "Connect opens a wallet prompt; approve shows the key. Full guide: /m02\n\nScroll to the end, then Mark done.",
    },
  ],
  "03": [
    {
      title: "Why",
      body: "A connected key is idle until you airdrop, build a transfer, sign with MWA, and confirm on-chain.",
    },
    {
      title: "Do this",
      body: "requestAirdrop or faucet.solana.com. SystemProgram.transfer 0.001 SOL to yourself. Sign and send. confirmTransaction confirmed. Explorer ?cluster=devnet",
    },
    {
      title: "Checkpoint",
      body: "Explorer shows Confirmed. Blockhash expired → retry. Insufficient funds → airdrop first. Full guide: /m03\n\nScroll to the end, then Mark done.",
    },
  ],
  "04": [
    {
      title: "Why",
      body: "SGT is a non-transferable NFT minted with the Seeker. Your app only reads it. Mint address: official docs, not a blog.",
    },
    {
      title: "Do this",
      body: "Fetch token accounts on mainnet. Amount > 0 → Seeker verified. Else grey No SGT (emulator). SKR prize is a stretch.",
    },
    {
      title: "Checkpoint",
      body: "Diagnostics shows Seeker verified or No SGT, no crash. Full guide: /m04\n\nScroll to the end, then Mark done.",
    },
  ],
  "05": [
    {
      title: "Why",
      body: "Judges need a signed release APK, not a debug install from your laptop.",
    },
    {
      title: "Do this",
      body: "keytool keystore in your home directory. Passwords in ~/.gradle/gradle.properties. ./gradlew assembleRelease. adb install -r the APK. Never git the keystore.",
    },
    {
      title: "Checkpoint",
      body: "APK installs; Diagnostics still works. Then the submission guide. Full guide: /m05\n\nScroll to the end, then Mark done.",
    },
  ],
  "06": [
    {
      title: "Why",
      body: "Winners publish on the Solana dApp Store. The identity check is yours. Sign up yourself at publish.solanamobile.com. While KYC says in review, you cannot upload an APK yet. Submit CLOCK IN on Radiants without waiting for that.",
    },
    {
      title: "Do this",
      body: "Create the publisher account with your email. Read the Developer Agreement before you tick it. You must be 18+. Then submit KYC (person + government ID) or KYB (company). After approval: browser wallet with about 0.2 SOL, then the Submit a New App steps. Keep that wallet.",
    },
    {
      title: "Checkpoint",
      body: "The portal shows KYC or KYB submitted in your name. You still have the signed release APK. Full guide: clock-in.biboux.com/m06\n\nScroll to the end, then Mark done.",
    },
  ],
};

export function panelsForModule(moduleId: string): readonly GuidePanel[] {
  return GUIDE_PANELS[moduleId] ?? [];
}

export function canMarkDone({
  pageIndex,
  lastPanelScrolledToEnd,
}: {
  pageIndex: number;
  lastPanelScrolledToEnd: boolean;
}): boolean {
  return pageIndex === GUIDE_PANEL_COUNT - 1 && lastPanelScrolledToEnd;
}

/** @deprecated use canMarkDone */
export function canMarkModuleDone(seenCount: number, panelCount: number): boolean {
  return panelCount > 0 && seenCount >= panelCount;
}

export function moduleWebPath(moduleId: string): string {
  if (moduleId === "00") return "/start";
  return `/m${moduleId}`;
}
