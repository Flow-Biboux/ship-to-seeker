import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { focusCheck } from "./focusCheck.ts";

describe("focusCheck", () => {
  it("picks the first unsettled check", () => {
    assert.equal(
      focusCheck({ rpc: "pass", wallet: "idle", tx: "idle", sgt: "idle" }),
      "wallet",
    );
  });

  it("treats a missing Genesis Token as settled", () => {
    assert.equal(
      focusCheck({ rpc: "pass", wallet: "pass", tx: "pass", sgt: "absent" }),
      null,
    );
  });
});
