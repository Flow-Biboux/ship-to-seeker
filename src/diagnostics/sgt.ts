// Seeker Genesis Token check, following docs.solanamobile.com/solana-mobile-stack/seeker-genesis-token:
// a Token-2022 mint whose metadata pointer and group member both point at the SGT group.
export const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
// The metadata address and group mint address are intentionally the same.
export const SGT_METADATA_ADDRESS = "GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te";
export const SGT_GROUP_MINT_ADDRESS = "GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te";
export const SGT_TIMEOUT_MS = 12_000;
const MINT_BATCH = 100;

type ParsedExtension = { extension?: string; state?: Record<string, unknown> };

/** True when a jsonParsed Token-2022 mint carries the SGT metadata pointer and group membership. */
export function isSgtMint(parsedMintInfo: unknown): boolean {
  const extensions = (parsedMintInfo as { extensions?: ParsedExtension[] } | null)
    ?.extensions;
  if (!Array.isArray(extensions)) return false;
  const pointer = extensions.find((ext) => ext.extension === "metadataPointer");
  const member = extensions.find((ext) => ext.extension === "tokenGroupMember");
  return (
    pointer?.state?.metadataAddress === SGT_METADATA_ADDRESS &&
    member?.state?.group === SGT_GROUP_MINT_ADDRESS
  );
}

/** Mints of Token-2022 accounts with a non-zero balance (an SGT transferred out leaves a 0 account). */
export function heldMints(tokenAccounts: unknown): string[] {
  if (!Array.isArray(tokenAccounts)) return [];
  const mints: string[] = [];
  for (const entry of tokenAccounts) {
    const info = entry?.account?.data?.parsed?.info;
    if (typeof info?.mint === "string" && info.tokenAmount?.amount !== "0") {
      mints.push(info.mint);
    }
  }
  return mints;
}

async function rpc(
  fetchImpl: typeof fetch,
  endpoint: string,
  method: string,
  params: unknown[],
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal,
  });
  if (!response.ok) throw new Error(`Mainnet RPC returned HTTP ${response.status}`);
  const body = (await response.json()) as { result?: unknown; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message ?? "Mainnet RPC error");
  return body.result;
}

/** Returns the SGT mint address the wallet currently holds, or null. Throws if mainnet RPC fails. */
export async function findSgtMint(
  owner: string,
  fetchImpl: typeof fetch = fetch,
  endpoint: string = MAINNET_RPC_URL,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SGT_TIMEOUT_MS);
  try {
    const accounts = (await rpc(
      fetchImpl,
      endpoint,
      "getTokenAccountsByOwner",
      [owner, { programId: TOKEN_2022_PROGRAM_ID }, { encoding: "jsonParsed" }],
      controller.signal,
    )) as { value?: unknown };
    const mints = heldMints(accounts?.value);
    for (let i = 0; i < mints.length; i += MINT_BATCH) {
      const batch = mints.slice(i, i + MINT_BATCH);
      const result = (await rpc(
        fetchImpl,
        endpoint,
        "getMultipleAccounts",
        [batch, { encoding: "jsonParsed" }],
        controller.signal,
      )) as { value?: Array<{ data?: { parsed?: { info?: unknown } } } | null> };
      const values = result?.value ?? [];
      for (let j = 0; j < values.length; j++) {
        if (isSgtMint(values[j]?.data?.parsed?.info)) return batch[j];
      }
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
