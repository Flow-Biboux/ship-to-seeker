export type RecallQuestion = {
  prompt: string;
  choices: readonly string[];
  answer: string;
  wrongHint: string;
};

const RECALL: Record<string, RecallQuestion> = {
  "00": {
    prompt: "What must be on the device before Connect can work?",
    choices: ["Expo Go", "A Mobile Wallet Adapter wallet", "A mainnet airdrop"],
    answer: "A Mobile Wallet Adapter wallet",
    wrongHint: "Expo Go cannot load the wallet adapter. The device needs an MWA wallet. Seeker already has Seed Vault.",
  },
  "01": {
    prompt: "What does a green Devnet RPC chip mean?",
    choices: ["The wallet signed", "getHealth returned ok", "Mainnet is down"],
    answer: "getHealth returned ok",
    wrongHint: "The chip only reports the devnet health call. It is not a wallet or a mainnet result.",
  },
  "02": {
    prompt: "Where does the private key stay when you connect?",
    choices: ["In the app", "In the wallet", "On the RPC"],
    answer: "In the wallet",
    wrongHint: "The app receives a public key after you approve. The key stays in Seed Vault or the other wallet.",
  },
  "03": {
    prompt: "A signature is on the explorer as confirmed. What should the app show?",
    choices: ["Failed, blockhash expired", "Confirmed", "No wallet found"],
    answer: "Confirmed",
    wrongHint: "A landed signature is a pass. Blockhash expiry is only when the signature never landed.",
  },
  "04": {
    prompt: "SKR and the Seeker Genesis Token are…",
    choices: ["The same mint", "A token and an NFT", "Both devnet airdrops"],
    answer: "A token and an NFT",
    wrongHint: "SKR is an SPL token. The Genesis Token is a Token-2022 NFT minted once per device.",
  },
  "05": {
    prompt: "Which file do you upload to the store?",
    choices: ["A debug APK from the laptop", "The signed release APK", "The keystore"],
    answer: "The signed release APK",
    wrongHint: "The keystore stays off git. The store wants the signed release file.",
  },
  "06": {
    prompt: "Who completes publisher KYC?",
    choices: ["Whoever built the course", "You, on your own account", "The wallet"],
    answer: "You, on your own account",
    wrongHint: "The identity check is yours. A review in someone else's portal does not unlock your upload.",
  },
  "07": {
    prompt: "Which of these never goes in the app?",
    choices: ["The public address", "The seed phrase", "A transaction signature"],
    answer: "The seed phrase",
    wrongHint: "The seed phrase recreates the keys. The app only sees an address after you approve.",
  },
  "08": {
    prompt: "What is the Seeker Genesis Token?",
    choices: ["SOL for fees", "An NFT, one per device", "The SKR mint"],
    answer: "An NFT, one per device",
    wrongHint: "SOL pays fees. SKR is the token. The Genesis Token is the NFT.",
  },
  "09": {
    prompt: "A fee of a few thousand lamports on a confirmed transaction means…",
    choices: ["The transaction failed", "The fee was paid and it landed", "You need a program"],
    answer: "The fee was paid and it landed",
    wrongHint: "Read status separately from the fee. A small fee on a confirmed row is a normal success.",
  },
  "10": {
    prompt: "When do you need your own program?",
    choices: ["To read a balance", "To connect a wallet", "When many people share state the client must not skip"],
    answer: "When many people share state the client must not skip",
    wrongHint: "Reads and wallet signatures use programs that already exist. Your program is for shared rules.",
  },
  "11": {
    prompt: "Why can a classic SPL balance check miss a Genesis Token?",
    choices: ["It is on devnet", "It is Token-2022", "The fee was too high"],
    answer: "It is Token-2022",
    wrongHint: "The Genesis Token lives on the Token-2022 program. The older token program does not list it.",
  },
  "12": {
    prompt: "The status is success and the account you care about did not change. What happened?",
    choices: ["The RPC is wrong", "It landed for a different account", "The seed phrase was copied"],
    answer: "It landed for a different account",
    wrongHint: "Success means the instructions finished. Check the balances of the account you meant.",
  },
  "13": {
    prompt: "A listing In Review means…",
    choices: ["The store approved it", "You submitted and you are waiting", "CLOCK IN is closed"],
    answer: "You submitted and you are waiting",
    wrongHint: "In Review is the store queue. It is not an approval and it is not the hackathon form.",
  },
  S1: {
    prompt: "A SKR gate should read which cluster?",
    choices: ["Devnet", "Mainnet", "The local emulator"],
    answer: "Mainnet",
    wrongHint: "SKR balances that matter are on mainnet, even if the rest of the app uses devnet.",
  },
  S2: {
    prompt: "Where do you see which program failed?",
    choices: ["The fee in lamports", "The logs", "The app icon"],
    answer: "The logs",
    wrongHint: "The fee is the cost. The logs name the program and the line that failed.",
  },
};

export function recallFor(moduleId: string): RecallQuestion | null {
  return RECALL[moduleId] ?? null;
}

export function isRecallCorrect(moduleId: string, choice: string | null): boolean {
  const question = recallFor(moduleId);
  if (question == null) return true;
  return choice === question.answer;
}
