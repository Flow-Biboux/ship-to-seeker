export const BUILD_PATH_STORAGE_KEY = "ship-to-seeker.build-path.completed";

export type BuildModule = {
  id: string;
  title: string;
  detail: string;
};

/** Titles and blurbs from clock-in.biboux.com module list (00–06). */
export const BUILD_MODULES: readonly BuildModule[] = [
  {
    id: "00",
    title: "Setup that actually works",
    detail:
      "The Solana Mobile template, an emulator or a Seeker, a development build (not Expo Go).",
  },
  {
    id: "01",
    title: "Solana for JS devs + your first screen",
    detail:
      "Scaffold, three tabs, and a Devnet RPC health check. What an account is, in one screen.",
  },
  {
    id: "02",
    title: "Mobile Wallet Adapter",
    detail:
      "Connect and sign, including the Seed Vault Wallet on Seeker.",
  },
  {
    id: "03",
    title: "Your first transaction",
    detail: "Devnet airdrop, build, sign and send a transaction, confirm it.",
  },
  {
    id: "04",
    title: "Seeker-native features",
    detail:
      "Seeker Genesis Token verification, plus where SKR fits.",
  },
  {
    id: "05",
    title: "Ship it",
    detail: "Signed release APK, a 60-second demo video, a 5-slide pitch deck.",
  },
  {
    id: "06",
    title: "Start your publisher KYC",
    detail:
      "Create your own dApp Store account and submit KYC. The review wait is yours.",
  },
  {
    id: "07",
    title: "Wallet, key, seed phrase",
    detail: "The wallet holds keys. The app never sees the seed phrase or the private key.",
  },
  {
    id: "08",
    title: "SOL, tokens, and NFTs",
    detail: "Three different assets. SKR is the token. The Seeker Genesis Token is the NFT.",
  },
  {
    id: "09",
    title: "Read a transaction",
    detail: "Status, fees, compute, logs, and the ways a transaction fails.",
  },
  {
    id: "10",
    title: "When you do not need a program",
    detail: "RPC, wallet, and token reads stay in the app. A program is for shared on-chain state.",
  },
  {
    id: "11",
    title: "Token-2022 extensions",
    detail: "Why a normal token balance check misses the Seeker Genesis Token.",
  },
  {
    id: "12",
    title: "A success that did nothing",
    detail: "The transaction landed, and the thing you wanted still did not happen.",
  },
  {
    id: "13",
    title: "Listing assets",
    detail: "The signed APK, What's New, icon, and screenshots the publisher portal asks for.",
  },
];

/** Extra guides unlocked by holding any SKR in the connected wallet (mainnet). */
export const SKR_MODULES: readonly BuildModule[] = [
  {
    id: "S1",
    title: "Read SKR in your own app",
    detail: "Find a wallet's SKR balance with one RPC call and gate a feature on it.",
  },
  {
    id: "S2",
    title: "Debug any transaction from its logs",
    detail: "Fetch a transaction by signature, read the error and program logs, decode custom errors.",
  },
];

export function findModule(id: string): BuildModule | undefined {
  return [...BUILD_MODULES, ...SKR_MODULES].find((module) => module.id === id);
}

export function parseCompletedIds(raw: string | null): string[] {
  if (raw == null || raw.length === 0) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  const known = new Set(BUILD_MODULES.map((module) => module.id));
  return parsed.filter(
    (id): id is string => typeof id === "string" && known.has(id),
  );
}

/** Adds an id after every guide panel has been seen. Does not remove ids. */
export function markModuleCompleted(
  completed: readonly string[],
  id: string,
): string[] {
  if (completed.includes(id)) {
    return [...completed];
  }
  return [...completed, id];
}

export function toggleCompletedId(completed: readonly string[], id: string): string[] {
  if (completed.includes(id)) {
    return completed.filter((item) => item !== id);
  }
  return [...completed, id];
}
