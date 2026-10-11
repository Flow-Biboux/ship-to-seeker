import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDigest, explorerUrl, isTxSignature, lookupTransaction } from "./txDigest.ts";

const SIG = "5".repeat(87);

describe("isTxSignature", () => {
  it("accepts an 87-char base58 string and rejects error text", () => {
    assert.equal(isTxSignature(` ${SIG} `), true);
    assert.equal(isTxSignature("Error: blockhash not found"), false);
    assert.equal(isTxSignature("0".repeat(87)), false);
  });
});

describe("explorerUrl", () => {
  it("adds the devnet cluster only on devnet", () => {
    assert.equal(explorerUrl(SIG, "devnet"), `https://explorer.solana.com/tx/${SIG}?cluster=devnet`);
    assert.equal(explorerUrl(SIG, "mainnet-beta"), `https://explorer.solana.com/tx/${SIG}`);
  });
});

describe("buildDigest", () => {
  it("describes a failure with logs and balance changes, without the signature", () => {
    const { succeeded, digest } = buildDigest(
      {
        meta: {
          err: { InstructionError: [0, { Custom: 1 }] },
          fee: 5000,
          logMessages: ["Program 11111111111111111111111111111111 failed"],
          preBalances: [2_000_000_000, 0],
          postBalances: [1_999_995_000, 0],
        },
        transaction: { message: { accountKeys: [{ pubkey: "Payer1" }, { pubkey: "Dest1" }] } },
      },
      "devnet",
    );
    assert.equal(succeeded, false);
    assert.match(digest, /Status: FAILED/);
    assert.match(digest, /Custom/);
    assert.match(digest, /Payer1: -0.000005 SOL/);
    assert.doesNotMatch(digest, new RegExp(SIG));
  });

  it("marks success", () => {
    assert.match(buildDigest({ meta: { err: null } }, "mainnet-beta").digest, /SUCCESS/);
  });
});

describe("lookupTransaction", () => {
  it("falls back to mainnet when devnet has nothing", async () => {
    const seen: string[] = [];
    const fake = (async (url: string) => {
      seen.push(url);
      const result = url === "main" ? { meta: { err: null } } : null;
      return new Response(JSON.stringify({ result }));
    }) as typeof fetch;
    const found = await lookupTransaction(SIG, fake, { devnet: "dev", "mainnet-beta": "main" });
    assert.deepEqual(seen, ["dev", "main"]);
    assert.equal(found?.cluster, "mainnet-beta");
    assert.equal(found?.succeeded, true);
  });

  it("returns null when neither cluster knows it", async () => {
    const fake = (async () => new Response(JSON.stringify({ result: null }))) as typeof fetch;
    assert.equal(await lookupTransaction(SIG, fake, { devnet: "a", "mainnet-beta": "b" }), null);
  });
});
