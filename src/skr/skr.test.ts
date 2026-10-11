import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SKR_MINT, fetchSkrBalance, formatSkr, sumSkrRaw } from "./skr.ts";

const account = (mint: string, amount: string) => ({
  account: { data: { parsed: { info: { mint, tokenAmount: { amount } } } } },
});

describe("sumSkrRaw", () => {
  it("adds SKR accounts and ignores other mints", () => {
    assert.equal(
      sumSkrRaw([account(SKR_MINT, "1500000"), account("Other", "9"), account(SKR_MINT, "500000")]),
      2_000_000n,
    );
  });

  it("returns 0 for junk", () => {
    assert.equal(sumSkrRaw(null), 0n);
    assert.equal(sumSkrRaw([account(SKR_MINT, "abc")]), 0n);
  });
});

describe("formatSkr", () => {
  it("shows whole tokens", () => {
    assert.equal(formatSkr(1_234_000_000n), "1,234");
  });
});

describe("fetchSkrBalance", () => {
  it("filters by the SKR mint and sums the result", async () => {
    let sent: any;
    const fake = (async (_url: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ result: { value: [account(SKR_MINT, "3000000")] } }));
    }) as typeof fetch;
    assert.equal(await fetchSkrBalance("Owner111", fake), 3_000_000n);
    assert.deepEqual(sent.params[1], { mint: SKR_MINT });
  });
});
