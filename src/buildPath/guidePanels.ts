export type GuideBlock =
  | { kind: "text"; text: string }
  | { kind: "code"; code: string };

export type GuidePanel = {
  title: string;
  blocks: readonly GuideBlock[];
};

const GUIDE_PANELS: Record<string, readonly GuidePanel[]> = {
  "00": [
    {
      title: "What you need",
      blocks: [
        { kind: "text", text: "• Node.js (current LTS) and npm\n• Android Studio, with an Android emulator created in Device Manager. Or a Seeker / Android phone with USB debugging enabled.\n• A terminal and about 5 GB of free disk space (Android builds are heavy)" },
      ],
    },
    {
      title: "Generate the app",
      blocks: [
        { kind: "text", text: "Use the official generator and pick the Solana Mobile template when it asks:" },
        { kind: "code", code: "npm create solana-dapp@latest" },
        { kind: "text", text: "Then install and run it on Android:" },
        { kind: "code", code: "cd your-app-name\nnpm install\nnpm run android" },
        { kind: "text", text: "The first build takes a while. That's normal." },
      ],
    },
    {
      title: "Don't use Expo Go",
      blocks: [
        { kind: "text", text: "Mobile Wallet Adapter uses native Android code, which Expo Go can't load. npm run android builds a development build of your app instead, which is what you want." },
      ],
    },
    {
      title: "Get a wallet on the device",
      blocks: [
        { kind: "text", text: "• On a Seeker: the Seed Vault Wallet is built in. Nothing to install.\n• On an emulator: install a wallet that supports Mobile Wallet Adapter. The mobile-wallet-adapter repo includes a mock wallet for testing, or you can use an Android wallet app that supports it." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You're done with Module 00 when:\n• the template app opens on your device, and\n• tapping Connect opens the wallet and shows your address back in the app.\nPost a screenshot on X tagging @biboux_sol. I'll repost the people who make it." },
      ],
    },
    {
      title: "Common breakages",
      blocks: [
        { kind: "text", text: "• \"SDK location not found\" → set ANDROID_HOME to your Android SDK path (Android Studio → Settings → Android SDK shows it).\n• No device found → start the emulator first, or check adb devices lists your phone.\n• Connect does nothing / \"no wallet found\" → no wallet that supports Mobile Wallet Adapter is installed on the device (see step 3).\n• Something else? → send me the error. The most common ones get fixed in the daily drop." },
      ],
    },
  ],
  "01": [
    {
      title: "Three words you need today",
      blocks: [
        { kind: "text", text: "Your phone does not store the chain. It asks a server. That request is an RPC (remote procedure call): a JSON body over HTTPS, one method name, one answer." },
        { kind: "code", code: "phone (Diagnostics tab)\n| POST { \"jsonrpc\":\"2.0\", \"id\":1, \"method\":\"getHealth\" }\nv\nhttps://api.devnet.solana.com\n| { \"result\": \"ok\" } → green chip \"Connected\"\n| anything else, or the request fails → red chip \"Unreachable\"" },
        { kind: "text", text: "Devnet is Solana's public practice cluster. The SOL there is not the SOL people trade. We point the first check at https://api.devnet.solana.com so a broken experiment costs nothing. Mainnet is the cluster with real value; we only read it later.\nAn account is one record on the cluster, looked up by an address:" },
        { kind: "code", code: "account\naddress the public key you look up\nowner the program allowed to change its data\nlamports the balance (1 SOL = 1,000,000,000 lamports)\ndata bytes the owner program stores" },
        { kind: "text", text: "A wallet address is an account. A transaction is a signed list of changes to accounts. Today we do not read an account and we do not send a transaction. We only ask the cluster if its RPC is healthy. The wallet account shows up in the next module.\ngetHealth is a JSON-RPC method.\nThe template already depends on @solana/web3.js 1.99.0. That package's Connection class has no getHealth method (it is not in the installed package). The check uses fetch and posts the method name getHealth. A healthy node returns result: \"ok\"." },
      ],
    },
    {
      title: "Scaffold the app",
      blocks: [
        { kind: "text", text: "This build started from the public template @solana-mobile/solana-mobile-expo-template version 3.0.0 (Expo 52, React Native 0.76, React Navigation bottom tabs, React Native Paper). It already includes @solana-mobile/mobile-wallet-adapter-protocol-web3js. You do not add a Solana library for this module." },
        { kind: "code", code: "npx create-expo-app ship-to-seeker-app --template @solana-mobile/solana-mobile-expo-template\ncd ship-to-seeker-app\nnpm install" },
      ],
    },
    {
      title: "Development build, not Expo Go.",
      blocks: [
        { kind: "text", text: "Mobile Wallet Adapter needs native Android code. Expo Go cannot load it. Module 00's npm run android is how you put this on an emulator or a Seeker. You can still read the TypeScript on your laptop before that build finishes." },
        { kind: "text", text: "In app.json, set the display name and the package id:" },
        { kind: "code", code: "\"name\": \"Ship to Seeker\",\n\"slug\": \"ship-to-seeker\"" },
        { kind: "text", text: "and under android / ios:" },
        { kind: "code", code: "\"package\": \"com.biboux.shiptoseeker\"\n\"bundleIdentifier\": \"com.biboux.shiptoseeker\"" },
        { kind: "text", text: "If this is your own app, pick your own package name. Copying com.biboux.shiptoseeker only matches this repo.\nAdd an MIT LICENSE and, in the README, one line that the project is independent and is not affiliated with Solana Mobile, Radiants, or the Solana Foundation. Credit the template by name." },
      ],
    },
    {
      title: "Three tabs",
      blocks: [
        { kind: "text", text: "The template's stack in src/navigators/AppNavigator.tsx already has a home route and a Settings screen. Leave Settings there. The template top bar typechecks because navigation.navigate(\"Settings\") still exists. The three tabs set headerShown: false, so that top bar is not on these screens." },
        { kind: "code", code: "<Stack.Screen name=\"HomeStack\" component={HomeNavigator} />\n<Stack.Screen name=\"Settings\" component={SettingsScreen} />" },
        { kind: "text", text: "Replace src/navigators/HomeNavigator.tsx with three tabs. Icons are Feather from @expo/vector-icons (already installed with Expo: activity, list, message-circle)." },
        { kind: "code", code: "import { createBottomTabNavigator } from \"@react-navigation/bottom-tabs\";\nimport React from \"react\";\nimport Feather from \"@expo/vector-icons/Feather\";\nimport { BuildPathScreen } from \"../screens/BuildPathScreen\";\nimport { DiagnosticsScreen } from \"../screens/DiagnosticsScreen\";\nimport { ExplainerScreen } from \"../screens/ExplainerScreen\";\nconst Tab = createBottomTabNavigator();\ntype TabName = \"Diagnostics\" | \"Build Path\" | \"Explainer\";\nconst TAB_ICONS: Record<TabName, React.ComponentProps<typeof Feather>[\"name\"]> = {\nDiagnostics: \"activity\",\n\"Build Path\": \"list\",\nExplainer: \"message-circle\",\n};\nexport function HomeNavigator() {\nreturn (\n<Tab.Navigator\nscreenOptions={({ route }) => ({\nheaderShown: false,\ntabBarIcon: ({ color, size }) => (\n<Feather\nname={TAB_ICONS[route.name as TabName]}\nsize={size}\ncolor={color}\n/>\n),\n})}\n>\n<Tab.Screen name=\"Diagnostics\" component={DiagnosticsScreen} />\n<Tab.Screen name=\"Build Path\" component={BuildPathScreen} />\n<Tab.Screen name=\"Explainer\" component={ExplainerScreen} />\n</Tab.Navigator>\n);\n}" },
        { kind: "text", text: "Shared title block, src/components/ScreenIntro.tsx:" },
        { kind: "code", code: "import React from \"react\";\nimport { StyleSheet, View } from \"react-native\";\nimport { Text } from \"react-native-paper\";\nconst INTRO_GAP = 4;\nexport function ScreenIntro({\ntitle,\nsubtitle,\n}: {\ntitle: string;\nsubtitle: string;\n}) {\nreturn (\n<View style={styles.intro}>\n<Text variant=\"headlineMedium\">{title}</Text>\n<Text variant=\"bodyLarge\">{subtitle}</Text>\n</View>\n);\n}\nconst styles = StyleSheet.create({\nintro: {\ngap: INTRO_GAP,\nmarginBottom: 20,\n},\n});" },
        { kind: "text", text: "Build Path and Explainer are empty on purpose. The checklist and the error box come on later days." },
        { kind: "code", code: "// src/screens/BuildPathScreen.tsx\nimport React from \"react\";\nimport { StyleSheet, View } from \"react-native\";\nimport { ScreenIntro } from \"../components/ScreenIntro\";\nconst SCREEN_PADDING = 16;\nexport function BuildPathScreen() {\nreturn (\n<View style={styles.screen}>\n<ScreenIntro title=\"Build Path\" subtitle=\"Your 7-step build journey\" />\n</View>\n);\n}\nconst styles = StyleSheet.create({\nscreen: {\nflex: 1,\npadding: SCREEN_PADDING,\n},\n});" },
        { kind: "code", code: "// src/screens/ExplainerScreen.tsx\nimport React from \"react\";\nimport { StyleSheet, View } from \"react-native\";\nimport { ScreenIntro } from \"../components/ScreenIntro\";\nconst SCREEN_PADDING = 16;\nexport function ExplainerScreen() {\nreturn (\n<View style={styles.screen}>\n<ScreenIntro title=\"Explainer\" subtitle=\"Paste an error, get a fix\" />\n</View>\n);\n}\nconst styles = StyleSheet.create({\nscreen: {\nflex: 1,\npadding: SCREEN_PADDING,\n},\n});" },
        { kind: "text", text: "src/screens/index.ts re-exports the three screens. Leave the template's HomeScreen.tsx on disk. We stopped using it as the first screen; the Connect button comes back when we wire the wallet." },
      ],
    },
    {
      title: "Devnet RPC check",
      blocks: [
        { kind: "text", text: "src/diagnostics/devnetRpc.ts. Eight second timeout. Green only when HTTP is 2xx, the JSON has no error, and result is exactly \"ok\"." },
        { kind: "code", code: "export const DEVNET_RPC_URL = \"https://api.devnet.solana.com\";\nexport const RPC_HEALTH_TIMEOUT_MS = 8_000;\nexport const RPC_UNREACHABLE_HINT =\n\"Check your internet connection or try a different RPC endpoint\";\nexport const RPC_HEALTH_METHOD = \"getHealth\";\nexport type DevnetRpcChip = \"connected\" | \"unreachable\";\ntype JsonRpcHealthBody = {\nresult?: unknown;\nerror?: unknown;\n};\nexport function chipFromHealthResponse(\nhttpStatus: number,\nbody: JsonRpcHealthBody | null,\n): DevnetRpcChip {\nif (httpStatus < 200 || httpStatus >= 300) {\nreturn \"unreachable\";\n}\nif (body == null || body.error != null) {\nreturn \"unreachable\";\n}\nreturn body.result === \"ok\" ? \"connected\" : \"unreachable\";\n}\nexport async function checkDevnetRpcHealth(\nfetchImpl: typeof fetch = fetch,\nendpoint: string = DEVNET_RPC_URL,\n): Promise<DevnetRpcChip> {\nconst controller = new AbortController();\nconst timer = setTimeout(() => controller.abort(), RPC_HEALTH_TIMEOUT_MS);\ntry {\nconst response = await fetchImpl(endpoint, {\nmethod: \"POST\",\nheaders: { \"Content-Type\": \"application/json\" },\nbody: JSON.stringify({\njsonrpc: \"2.0\",\nid: 1,\nmethod: RPC_HEALTH_METHOD,\n}),\nsignal: controller.signal,\n});\nlet body: JsonRpcHealthBody | null = null;\ntry {\nbody = (await response.json()) as JsonRpcHealthBody;\n} catch (parseError) {\nconsole.warn(\"Devnet RPC health response was not JSON\", parseError);\nreturn \"unreachable\";\n}\nreturn chipFromHealthResponse(response.status, body);\n} catch (error) {\nconsole.warn(\"Devnet RPC health check failed\", error);\nreturn \"unreachable\";\n} finally {\nclearTimeout(timer);\n}\n}" },
        { kind: "text", text: "src/screens/DiagnosticsScreen.tsx runs that check when the screen mounts. Retry bumps a counter so the effect runs again. The chip is green Connected or red Unreachable. The hint shows only when the check fails." },
        { kind: "code", code: "import React, { useCallback, useEffect, useState } from \"react\";\nimport { StyleSheet, View } from \"react-native\";\nimport { Button, Card, Chip, Text } from \"react-native-paper\";\nimport { ScreenIntro } from \"../components/ScreenIntro\";\nimport {\nRPC_UNREACHABLE_HINT,\ncheckDevnetRpcHealth,\ntype DevnetRpcChip,\n} from \"../diagnostics/devnetRpc\";\ntype CheckState = \"checking\" | DevnetRpcChip;\nconst SCREEN_PADDING = 16;\nconst CHIP_CONNECTED = \"#1B7F3A\";\nconst CHIP_UNREACHABLE = \"#B42318\";\nconst CHIP_CHECKING = \"#5C6570\";\nconst CHIP_LABEL = \"#FFFFFF\";\nexport function DiagnosticsScreen() {\nconst [attempt, setAttempt] = useState(0);\nconst [status, setStatus] = useState<CheckState>(\"checking\");\nuseEffect(() => {\nlet cancelled = false;\nsetStatus(\"checking\");\ncheckDevnetRpcHealth()\n.then((next) => {\nif (!cancelled) {\nsetStatus(next);\n}\n})\n.catch((error: unknown) => {\nconsole.warn(\"Devnet RPC check did not settle\", error);\nif (!cancelled) {\nsetStatus(\"unreachable\");\n}\n});\nreturn () => {\ncancelled = true;\n};\n}, [attempt]);\nconst retry = useCallback(() => {\nsetAttempt((current) => current + 1);\n}, []);\nconst chipLabel =\nstatus === \"checking\"\n? \"Checking\"\n: status === \"connected\"\n? \"Connected\"\n: \"Unreachable\";\nconst chipColor =\nstatus === \"connected\"\n? CHIP_CONNECTED\n: status === \"unreachable\"\n? CHIP_UNREACHABLE\n: CHIP_CHECKING;\nreturn (\n<View style={styles.screen}>\n<ScreenIntro\ntitle=\"Diagnostics\"\nsubtitle=\"Check your Solana Mobile setup\"\n/>\n<Card mode=\"outlined\">\n<Card.Title title=\"Devnet RPC\" subtitle=\"getHealth on api.devnet.solana.com\" />\n<Card.Content>\n<Chip\nstyle={{ backgroundColor: chipColor }}\ntextStyle={styles.chipText}\n>\n{chipLabel}\n</Chip>\n{status === \"unreachable\" ? (\n<Text variant=\"bodyMedium\" style={styles.hint}>\n{RPC_UNREACHABLE_HINT}\n</Text>\n) : null}\n</Card.Content>\n<Card.Actions>\n<Button\nmode=\"contained-tonal\"\nonPress={retry}\ndisabled={status === \"checking\"}\nloading={status === \"checking\"}\n>\nRetry\n</Button>\n</Card.Actions>\n</Card>\n</View>\n);\n}\nconst styles = StyleSheet.create({\nscreen: {\nflex: 1,\npadding: SCREEN_PADDING,\n},\nchipText: {\ncolor: CHIP_LABEL,\n},\nhint: {\nmarginTop: 12,\n},\n});" },
        { kind: "text", text: "Optional check on your laptop, same rules as src/diagnostics/devnetRpc.test.ts:" },
        { kind: "code", code: "npm test\nnpx tsc --noEmit" },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You are done with Module 01 when you can say the three tab names out loud, and Diagnostics shows a chip for Devnet RPC:\n• Diagnostics — subtitle \"Check your Solana Mobile setup\". Chip Connected (green) or Unreachable (red). Retry runs the check again.\n• Build Path — \"Your 7-step build journey\".\n• Explainer — \"Paste an error, get a fix\".\nUnreachable with the hint \"Check your internet connection or try a different RPC endpoint\" still counts. That means the request failed or the body was not result: \"ok\". Public devnet is sometimes busy. Hit Retry." },
      ],
    },
    {
      title: "If it breaks",
      blocks: [
        { kind: "text", text: "• Red Unreachable immediately → the phone or emulator has no route to api.devnet.solana.com, or the node answered with an error. The chip logic treats any result other than \"ok\" as unreachable.\n• Type error on navigate(\"Settings\") → Settings is still a screen on the root stack. Put it back; do not delete it to \"clean up\" the tabs.\n• Expo Go opens a blank or incompatible app → use the development build from Module 00.\n• Something else? → send the error." },
      ],
    },
  ],
  "02": [
    {
      title: "How MWA works",
      blocks: [
        { kind: "text", text: "Your app does not hold keys. It sends an Android intent: “I need a wallet.” Seed Vault on Seeker, or any other MWA-compatible wallet, opens. The person taps approve. Your app gets back a public key. That is the whole handshake. Docs: docs.solanamobile.com." },
      ],
    },
    {
      title: "Install",
      blocks: [
        { kind: "text", text: "The Solana Mobile Expo template already includes these. If you are wiring them yourself:" },
        { kind: "code", code: "npm install @solana-mobile/mobile-wallet-adapter-protocol-web3js @solana/web3.js" },
      ],
    },
    {
      title: "Connect button",
      blocks: [
        { kind: "text", text: "The template hook is useMobileWallet in src/utils/useMobileWallet.tsx. connect() calls transact, then authorizeSession, and returns an Account with a publicKey (PublicKey from @solana/web3.js). Show the first four and last four characters of the base58 string." },
        { kind: "code", code: "import { Button, Text } from \"react-native-paper\";\nimport { useMobileWallet } from \"../utils/useMobileWallet\";\nimport { useAuthorization } from \"../utils/useAuthorization\";\nconst { connect } = useMobileWallet();\nconst { selectedAccount } = useAuthorization();\nasync function onConnect() {\ntry {\nconst account = await connect();\nconst base58 = account.publicKey.toBase58();\nconst short = base58.slice(0, 4) + \"…\" + base58.slice(-4);\nconsole.log(short);\n} catch (error) {\nconsole.warn(\"Connect failed\", error);\n}\n}\n<Button mode=\"contained\" onPress={onConnect}>Connect</Button>\n{selectedAccount ? (\n<Text>\n{selectedAccount.publicKey.toBase58().slice(0, 4)}\n…\n{selectedAccount.publicKey.toBase58().slice(-4)}\n</Text>\n) : null}" },
        { kind: "text", text: "useAuthorization keeps the chosen account. After a successful connect(), selectedAccount is that same account. Put this on the Diagnostics tab next to yesterday’s RPC chip." },
      ],
    },
    {
      title: "Common errors",
      blocks: [
        { kind: "text", text: "• No wallet found — install a wallet APK on the emulator (Seed Vault on a Seeker, or any MWA wallet on an AVD).\n• Connection refused — make sure the wallet app is running in the background, then try Connect again.\n• User rejected — expected. Catch it and leave the UI in the disconnected state. Do not crash." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You're done when:\ntapping Connect opens a wallet prompt, approving it shows your public key in the Diagnostics tab." },
      ],
    },
  ],
  "03": [
    {
      title: "Devnet airdrop",
      blocks: [
        { kind: "text", text: "On a Connection from @solana/web3.js, call requestAirdrop(publicKey, LAMPORTS_PER_SOL). Public airdrop is rate-limited. If it fails, open faucet.solana.com and paste the same address." },
        { kind: "code", code: "import { Connection, LAMPORTS_PER_SOL, PublicKey } from \"@solana/web3.js\";\nconst connection = new Connection(\"https://api.devnet.solana.com\", \"confirmed\");\nasync function airdrop(publicKey: PublicKey) {\ntry {\nconst sig = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);\nawait connection.confirmTransaction(sig, \"confirmed\");\n} catch (error) {\nconsole.warn(\"Airdrop failed, use the faucet\", error);\n}\n}" },
      ],
    },
    {
      title: "Build the transaction",
      blocks: [
        { kind: "text", text: "Send 0.001 SOL to yourself. That is 1_000_000 lamports. SystemProgram.transfer is enough." },
        { kind: "code", code: "import { SystemProgram, Transaction } from \"@solana/web3.js\";\nconst lamports = 1_000_000; // 0.001 SOL\nconst tx = new Transaction().add(\nSystemProgram.transfer({\nfromPubkey: publicKey,\ntoPubkey: publicKey,\nlamports,\n}),\n);\ntx.feePayer = publicKey;\ntx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;" },
      ],
    },
    {
      title: "Sign and send with MWA",
      blocks: [
        { kind: "text", text: "Use the template hook. The method name in useMobileWallet is signAndSendTransaction (check the file on disk). Pass the transaction; the wallet signs; you get a signature string back. Show it in Diagnostics." },
      ],
    },
    {
      title: "Confirm",
      blocks: [
        { kind: "text", text: "await connection.confirmTransaction(signature, \"confirmed\"). Then open Explorer:" },
        { kind: "code", code: "https://explorer.solana.com/tx/SIGNATURE?cluster=devnet" },
      ],
    },
    {
      title: "Common errors",
      blocks: [
        { kind: "text", text: "• Blockhash expired — the tx sat too long. Fetch a new blockhash and retry.\n• Insufficient funds — airdrop or faucet first, then send 0.001 SOL.\n• User rejected — expected. Catch it and do not crash. Same as Module 02." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You're done when: you can see your transaction on Solana Explorer devnet with status Confirmed." },
      ],
    },
  ],
  "04": [
    {
      title: "What is SGT",
      blocks: [
        { kind: "text", text: "The Seeker Genesis Token is a non-transferable NFT in the wallet that came with the phone, minted by Solana Mobile at purchase. Your app only reads whether it is there. It does not mint one. Use the mint and check steps on docs.solanamobile.com (Seeker Genesis Token). Do not copy a mint address from a random blog." },
      ],
    },
    {
      title: "Check for SGT",
      blocks: [
        { kind: "text", text: "Connect the wallet, then fetch token accounts owned by that address on mainnet (SGT is not a devnet toy). If a token account for the documented SGT mint has amount > 0, show a green chip Seeker verified. Otherwise grey No SGT found (emulator or non-Seeker device)." },
        { kind: "code", code: "// Pseudocode — mint from the official SGT docs, not from this page\nconst accounts = await connection.getParsedTokenAccountsByOwner(owner, {\nmint: sgtMintFromDocs,\n});\nconst hasSgt = accounts.value.some((row) => {\nconst amt = row.account.data.parsed.info.tokenAmount.uiAmount;\nreturn amt != null && amt > 0;\n});" },
      ],
    },
    {
      title: "What to do with it",
      blocks: [
        { kind: "text", text: "You can gate a feature, show a badge, or unlock content. Keep it simple for now: just the badge on Diagnostics. Do not crash if the check fails." },
      ],
    },
    {
      title: "SKR integration",
      blocks: [
        { kind: "text", text: "The $10k SKR prize needs SKR token integration. That is a stretch after CLOCK IN submit. Start at docs.solanamobile.com and search SKR. Do not block the APK on it." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You're done when: the Diagnostics tab shows Seeker verified (on device) or No SGT (on emulator), with no crash." },
      ],
    },
  ],
  "05": [
    {
      title: "Generate a keystore",
      blocks: [
        { kind: "text", text: "You create this. Never commit it. Never put the password in git." },
        { kind: "code", code: "keytool -genkeypair -v -storetype PKCS12 -keystore ~/ship-to-seeker-release.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000" },
      ],
    },
    {
      title: "Configure signing via env, not a tracked file",
      blocks: [
        { kind: "text", text: "Point Gradle at the keystore with properties in ~/.gradle/gradle.properties (user home, not the repo):" },
        { kind: "code", code: "SHIP_TO_SEEKER_STORE_FILE=/home/you/ship-to-seeker-release.keystore\nSHIP_TO_SEEKER_STORE_PASSWORD=...\nSHIP_TO_SEEKER_KEY_ALIAS=upload\nSHIP_TO_SEEKER_KEY_PASSWORD=..." },
        { kind: "text", text: "Wire those names in android/app/build.gradle release signingConfig. Do not check in keystore.properties or *.jks." },
      ],
    },
    {
      title: "Build the release APK",
      blocks: [
        { kind: "code", code: "cd android && ./gradlew assembleRelease" },
        { kind: "text", text: "Or eas build --platform android --profile preview / --profile production. EAS free tier is slow — start it before you sleep. The APK lands under android/app/build/outputs/apk/release/ for a local Gradle build." },
      ],
    },
    {
      title: "Test the release build",
      blocks: [
        { kind: "code", code: "adb install -r android/app/build/outputs/apk/release/app-release.apk" },
        { kind: "text", text: "Run every Diagnostics check on this build, not the dev client." },
      ],
    },
    {
      title: "Common errors",
      blocks: [
        { kind: "text", text: "• Keystore not found — check the absolute path in gradle.properties.\n• Build failed on EAS — logs at expo.dev.\n• App crashes on launch — missing env or a native module not in the release profile." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You're done when: the APK installs cleanly, all three Diagnostics checks pass, and you have a file you can attach to the CLOCK IN submission.\nReady? → Submission guide" },
      ],
    },
  ],
  "06": [
    {
      title: "Do this on your account",
      blocks: [
        { kind: "text", text: "Sign up yourself at the portal. Use your email. Use your ID. A third party reviews it. While it says in review, you cannot upload an APK yet. That wait is normal. Submit CLOCK IN on Radiants without waiting for KYC." },
      ],
    },
    {
      title: "Open the portal",
      blocks: [
        { kind: "text", text: "Go to the publisher portal and create the account with your email. Read the Developer Agreement before you tick it. You must be 18+." },
        { kind: "code", code: "https://publish.solanamobile.com" },
      ],
    },
    {
      title: "Submit KYC or KYB",
      blocks: [
        { kind: "text", text: "After login, fill the publisher profile and start verification.\n• KYC if you publish as a person. Have a government ID ready.\n• KYB if you publish as a company. Have the company documents the form asks for.\nThe check is run by a verification provider Solana Mobile designates. Enter accurate details. They can ask for more documents and can keep the portal locked until it clears. Review mail comes to the email you signed up with, including from publishersupport@dappstore.solanamobile.com." },
      ],
    },
    {
      title: "What you do not need yet",
      blocks: [
        { kind: "text", text: "Leave the APK upload until KYC is approved. After that, the official path is: connect a browser wallet (Phantom, Solflare, or Backpack) with about 0.2 SOL for fees and storage, pick a storage provider (ArDrive is the documented default), add the dApp, then submit a signed release APK. That wallet is the one you must keep for every later version of the same app. Steps: Submit a New App." },
      ],
    },
    {
      title: "CLOCK IN vs the store",
      blocks: [
        { kind: "text", text: "Submit the hackathon on solanamobile.radiant.nexus with your APK, public repo, demo, and deck. The store listing is a separate queue (docs say review results usually in 3–5 business days after you submit the app). Devnet apps are accepted for CLOCK IN. Do not wait on KYC to submit the hackathon." },
      ],
    },
    {
      title: "Checkpoint",
      blocks: [
        { kind: "text", text: "You have a publisher account in your name, and the portal shows KYC or KYB submitted (pending or approved). You still have the signed release APK from Module 05. Submission guide →" },
      ],
    },
  ],
};

export function panelsForModule(moduleId: string): readonly GuidePanel[] {
  return GUIDE_PANELS[moduleId] ?? [];
}

export function panelHasCode(panel: GuidePanel): boolean {
  return panel.blocks.some((block) => block.kind === "code");
}

/** True once every panel has been opened. Mark done stays off until then. */
export function canMarkModuleDone(seenCount: number, panelCount: number): boolean {
  return panelCount > 0 && seenCount >= panelCount;
}

export function moduleWebPath(moduleId: string): string {
  if (moduleId === "00") return "/start";
  return `/m${moduleId}`;
}
