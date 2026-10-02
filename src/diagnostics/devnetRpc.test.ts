import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEVNET_RPC_URL,
  RPC_HEALTH_METHOD,
  checkDevnetRpcHealth,
  chipFromHealthResponse,
} from "./devnetRpc.ts";

describe("chipFromHealthResponse", () => {
  it("marks an ok result as connected", () => {
    assert.equal(chipFromHealthResponse(200, { result: "ok" }), "connected");
  });

  it("marks a non-ok result as unreachable", () => {
    assert.equal(
      chipFromHealthResponse(200, { result: "behind" }),
      "unreachable",
    );
  });

  it("marks an RPC error as unreachable", () => {
    assert.equal(
      chipFromHealthResponse(200, { error: { code: -32005 } }),
      "unreachable",
    );
  });

  it("marks an HTTP error as unreachable", () => {
    assert.equal(chipFromHealthResponse(503, { result: "ok" }), "unreachable");
  });
});

describe("checkDevnetRpcHealth", () => {
  it("posts getHealth to devnet and reads the result", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    const fetchImpl: typeof fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedBody = String(init?.body ?? "");
      return new Response(JSON.stringify({ jsonrpc: "2.0", result: "ok", id: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const chip = await checkDevnetRpcHealth(fetchImpl);
    assert.equal(chip, "connected");
    assert.equal(capturedUrl, DEVNET_RPC_URL);
    assert.equal(JSON.parse(capturedBody).method, RPC_HEALTH_METHOD);
  });

  it("returns unreachable when the request fails", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("network down");
    };
    assert.equal(await checkDevnetRpcHealth(fetchImpl), "unreachable");
  });
});
