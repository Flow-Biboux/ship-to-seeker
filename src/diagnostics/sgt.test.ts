import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SGT_GROUP_MINT_ADDRESS,
  SGT_METADATA_ADDRESS,
  findSgtMint,
  heldMints,
  isSgtMint,
} from "./sgt.ts";

const sgtInfo = {
  extensions: [
    { extension: "metadataPointer", state: { metadataAddress: SGT_METADATA_ADDRESS } },
    { extension: "tokenGroupMember", state: { group: SGT_GROUP_MINT_ADDRESS } },
  ],
};

function account(mint: string, amount: string) {
  return { account: { data: { parsed: { info: { mint, tokenAmount: { amount } } } } } };
}

describe("isSgtMint", () => {
  it("accepts the SGT metadata pointer plus group member", () => {
    assert.equal(isSgtMint(sgtInfo), true);
  });

  it("rejects a mint with only the metadata pointer", () => {
    assert.equal(isSgtMint({ extensions: [sgtInfo.extensions[0]] }), false);
  });

  it("rejects missing extensions", () => {
    assert.equal(isSgtMint(null), false);
    assert.equal(isSgtMint({}), false);
  });
});

describe("heldMints", () => {
  it("skips zero-balance accounts", () => {
    assert.deepEqual(heldMints([account("A", "1"), account("B", "0")]), ["A"]);
  });
});

describe("findSgtMint", () => {
  it("returns the SGT mint the wallet holds", async () => {
    const fake = (async (_url: string, init: RequestInit) => {
      const { method } = JSON.parse(String(init.body));
      const result =
        method === "getTokenAccountsByOwner"
          ? { value: [account("Other", "5"), account("Sgt", "1")] }
          : { value: [{ data: { parsed: { info: {} } } }, { data: { parsed: { info: sgtInfo } } }] };
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }));
    }) as typeof fetch;
    assert.equal(await findSgtMint("owner", fake), "Sgt");
  });

  it("returns null when no account is an SGT", async () => {
    const fake = (async () =>
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { value: [] } }))) as typeof fetch;
    assert.equal(await findSgtMint("owner", fake), null);
  });

  it("throws on an RPC error so the screen can say so", async () => {
    const fake = (async () =>
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { message: "busy" } }))) as typeof fetch;
    await assert.rejects(findSgtMint("owner", fake), /busy/);
  });
});
