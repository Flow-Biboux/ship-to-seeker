// SKR, the Solana Mobile token. Mint from solanamobile.com/blog/skr-is-live, checked on mainnet:
// a classic SPL Token mint with 6 decimals.
const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";

export const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";
export const SKR_DECIMALS = 6;
export const SKR_TIMEOUT_MS = 12_000;

/** Sums the raw SKR amount (base units) across a getTokenAccountsByOwner jsonParsed result. */
export function sumSkrRaw(tokenAccounts: unknown): bigint {
  if (!Array.isArray(tokenAccounts)) return 0n;
  let total = 0n;
  for (const entry of tokenAccounts) {
    const info = entry?.account?.data?.parsed?.info;
    const amount = info?.tokenAmount?.amount;
    if (info?.mint === SKR_MINT && typeof amount === "string" && /^\d+$/.test(amount)) {
      total += BigInt(amount);
    }
  }
  return total;
}

export function formatSkr(raw: bigint): string {
  const whole = raw / 10n ** BigInt(SKR_DECIMALS);
  return whole.toLocaleString("en-US");
}

/** Raw SKR balance (base units) the wallet holds on mainnet. Throws if the RPC fails. */
export async function fetchSkrBalance(
  owner: string,
  fetchImpl: typeof fetch = fetch,
  endpoint: string = MAINNET_RPC_URL,
): Promise<bigint> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SKR_TIMEOUT_MS);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [owner, { mint: SKR_MINT }, { encoding: "jsonParsed" }],
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Mainnet RPC returned HTTP ${response.status}`);
    const body = (await response.json()) as {
      result?: { value?: unknown };
      error?: { message?: string };
    };
    if (body.error) throw new Error(body.error.message ?? "Mainnet RPC error");
    return sumSkrRaw(body.result?.value);
  } finally {
    clearTimeout(timer);
  }
}
