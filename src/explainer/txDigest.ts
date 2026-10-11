// Turns a pasted transaction signature into a short, readable digest for the Explainer.
// The digest never contains the signature itself: the server rejects long base58 strings as possible secrets.
const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";

export const DEVNET_RPC_URL = "https://api.devnet.solana.com";
export const TX_TIMEOUT_MS = 12_000;
const MAX_LOG_LINES = 40;
const LAMPORTS_PER_SOL = 1_000_000_000;

export type Cluster = "devnet" | "mainnet-beta";

export type TxLookup = {
  cluster: Cluster;
  succeeded: boolean;
  digest: string;
};

const SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{86,88}$/;

export function isTxSignature(text: string): boolean {
  return SIGNATURE.test(text.trim());
}

export function explorerUrl(signature: string, cluster: Cluster): string {
  const suffix = cluster === "devnet" ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/tx/${signature}${suffix}`;
}

type RpcTx = {
  slot?: number;
  blockTime?: number | null;
  meta?: {
    err?: unknown;
    fee?: number;
    logMessages?: string[] | null;
    preBalances?: number[];
    postBalances?: number[];
  } | null;
  transaction?: { message?: { accountKeys?: Array<string | { pubkey?: string }> } };
};

function keyAt(tx: RpcTx, index: number): string {
  const key = tx.transaction?.message?.accountKeys?.[index];
  return typeof key === "string" ? key : key?.pubkey ?? `account #${index}`;
}

/** Builds the text sent to the Explainer from a getTransaction (jsonParsed) result. */
export function buildDigest(tx: RpcTx, cluster: Cluster): { succeeded: boolean; digest: string } {
  const meta = tx.meta ?? {};
  const succeeded = meta.err == null;
  const lines: string[] = [
    `Solana transaction on ${cluster}. Explain what happened in plain English.`,
    `Status: ${succeeded ? "SUCCESS" : "FAILED"}`,
  ];
  if (!succeeded) lines.push(`Error: ${JSON.stringify(meta.err)}`);
  if (typeof meta.fee === "number") lines.push(`Fee: ${meta.fee} lamports`);
  if (tx.blockTime) lines.push(`Time: ${new Date(tx.blockTime * 1000).toISOString()}`);

  const pre = meta.preBalances ?? [];
  const post = meta.postBalances ?? [];
  const changes: string[] = [];
  for (let i = 0; i < Math.min(pre.length, post.length); i++) {
    const delta = post[i] - pre[i];
    if (delta !== 0) {
      changes.push(`  ${keyAt(tx, i)}: ${delta > 0 ? "+" : ""}${delta / LAMPORTS_PER_SOL} SOL`);
    }
  }
  if (changes.length > 0) lines.push("SOL balance changes:", ...changes);

  const logs = meta.logMessages ?? [];
  if (logs.length > 0) {
    lines.push("Program logs:", ...logs.slice(0, MAX_LOG_LINES));
    if (logs.length > MAX_LOG_LINES) lines.push(`… ${logs.length - MAX_LOG_LINES} more log lines`);
  }
  return { succeeded, digest: lines.join("\n") };
}

async function getTransaction(
  fetchImpl: typeof fetch,
  endpoint: string,
  signature: string,
): Promise<RpcTx | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TX_TIMEOUT_MS);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          signature,
          { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RPC returned HTTP ${response.status}`);
    const body = (await response.json()) as { result?: RpcTx | null; error?: { message?: string } };
    if (body.error) throw new Error(body.error.message ?? "RPC error");
    return body.result ?? null;
  } finally {
    clearTimeout(timer);
  }
}

/** Looks the signature up on devnet first, then mainnet. Null if neither cluster has it. */
export async function lookupTransaction(
  signature: string,
  fetchImpl: typeof fetch = fetch,
  endpoints: Record<Cluster, string> = { devnet: DEVNET_RPC_URL, "mainnet-beta": MAINNET_RPC_URL },
): Promise<TxLookup | null> {
  const clusters: Cluster[] = ["devnet", "mainnet-beta"];
  for (const cluster of clusters) {
    const tx = await getTransaction(fetchImpl, endpoints[cluster], signature.trim());
    if (tx) return { cluster, ...buildDigest(tx, cluster) };
  }
  return null;
}
