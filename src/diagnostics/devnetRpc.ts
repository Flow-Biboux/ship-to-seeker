export const DEVNET_RPC_URL = "https://api.devnet.solana.com";
export const RPC_HEALTH_TIMEOUT_MS = 8_000;
export const RPC_UNREACHABLE_HINT =
  "Check your internet connection or try a different RPC endpoint";

export const RPC_HEALTH_METHOD = "getHealth";

export type DevnetRpcChip = "connected" | "unreachable";

type JsonRpcHealthBody = {
  result?: unknown;
  error?: unknown;
};

export function chipFromHealthResponse(
  httpStatus: number,
  body: JsonRpcHealthBody | null,
): DevnetRpcChip {
  if (httpStatus < 200 || httpStatus >= 300) {
    return "unreachable";
  }
  if (body == null || body.error != null) {
    return "unreachable";
  }
  return body.result === "ok" ? "connected" : "unreachable";
}

export async function checkDevnetRpcHealth(
  fetchImpl: typeof fetch = fetch,
  endpoint: string = DEVNET_RPC_URL,
): Promise<DevnetRpcChip> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_HEALTH_TIMEOUT_MS);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: RPC_HEALTH_METHOD,
      }),
      signal: controller.signal,
    });

    let body: JsonRpcHealthBody | null = null;
    try {
      body = (await response.json()) as JsonRpcHealthBody;
    } catch (parseError) {
      console.warn("Devnet RPC health response was not JSON", parseError);
      return "unreachable";
    }

    return chipFromHealthResponse(response.status, body);
  } catch (error) {
    console.warn("Devnet RPC health check failed", error);
    return "unreachable";
  } finally {
    clearTimeout(timer);
  }
}
