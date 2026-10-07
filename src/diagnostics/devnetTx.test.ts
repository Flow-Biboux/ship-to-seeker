import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  confirmSignatureLanded,
  devnetTxFailureHint,
  readSignatureLanding,
  SignatureNeverLandedError,
} from "./devnetTx.ts";

const SIG = "5".repeat(88);

describe("readSignatureLanding", () => {
  it("passes a confirmed signature with no error", async () => {
    const reading = await readSignatureLanding(
      {
        async getSignatureStatuses() {
          return {
            context: { slot: 1 },
            value: [{ confirmationStatus: "confirmed", err: null }],
          };
        },
        async getTransaction() {
          throw new Error("getTransaction should not run after a landed status");
        },
      } as never,
      SIG,
    );
    assert.equal(reading.landing, "landed");
  });

  it("passes when status is missing but getTransaction shows success", async () => {
    const reading = await readSignatureLanding(
      {
        async getSignatureStatuses() {
          return { context: { slot: 1 }, value: [null] };
        },
        async getTransaction() {
          return { meta: { err: null } };
        },
      } as never,
      SIG,
    );
    assert.equal(reading.landing, "landed");
  });
});

describe("confirmSignatureLanded", () => {
  it("passes after a stale block height when the signature is confirmed", async () => {
    let reads = 0;
    await confirmSignatureLanded(
      {
        async getSignatureStatuses() {
          reads += 1;
          if (reads === 1) return { context: { slot: 1 }, value: [null] };
          return {
            context: { slot: 2 },
            value: [{ confirmationStatus: "finalized", err: null }],
          };
        },
        async getTransaction() {
          return null;
        },
        async getBlockHeight() {
          return 500;
        },
      } as never,
      SIG,
      100,
    );
    assert.equal(reads, 2);
  });

  it("fails when the signature never landed and the blockhash expired", async () => {
    await assert.rejects(
      () =>
        confirmSignatureLanded(
          {
            async getSignatureStatuses() {
              return { context: { slot: 1 }, value: [null] };
            },
            async getTransaction() {
              return null;
            },
            async getBlockHeight() {
              return 500;
            },
          } as never,
          SIG,
          100,
        ),
      (error: unknown) => {
        assert.ok(error instanceof SignatureNeverLandedError);
        assert.equal(error.signature, SIG);
        return true;
      },
    );
  });

  it("fails when the signature landed with an on-chain error", async () => {
    await assert.rejects(
      () =>
        confirmSignatureLanded(
          {
            async getSignatureStatuses() {
              return {
                context: { slot: 1 },
                value: [{ confirmationStatus: "confirmed", err: { InstructionError: [0, "Custom"] } }],
              };
            },
            async getTransaction() {
              throw new Error("unused");
            },
            async getBlockHeight() {
              throw new Error("unused");
            },
          } as never,
          SIG,
          100,
        ),
      /failed on-chain/,
    );
  });
});

describe("devnetTxFailureHint", () => {
  it("uses honest copy when the signature never landed", () => {
    const hint = devnetTxFailureHint(`Signature ${SIG} never landed before the blockhash expired.`);
    assert.match(hint, /never landed/);
    assert.doesNotMatch(hint, /Approve it faster/);
  });

  it("keeps the pre-sign blockhash hint for wallet expiry", () => {
    const hint = devnetTxFailureHint("Blockhash not found");
    assert.match(hint, /Approve it faster/);
  });
});
