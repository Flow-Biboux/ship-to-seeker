import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXPLAIN_INPUT_CAP,
  EXPLAIN_URL,
  clipExplainInput,
  parseExplainResponse,
  requestExplanation,
} from "./explainError.ts";

describe("clipExplainInput", () => {
  it("caps the pasted error", () => {
    assert.equal(clipExplainInput("a".repeat(EXPLAIN_INPUT_CAP + 10)).length, EXPLAIN_INPUT_CAP);
  });
});

describe("parseExplainResponse", () => {
  it("reads explanation and fix", () => {
    assert.deepEqual(
      parseExplainResponse(200, { explanation: "why", fix: "how" }),
      { explanation: "why", fix: "how" },
    );
  });

  it("rejects a non-success status", () => {
    assert.throws(() => parseExplainResponse(429, { explanation: "a", fix: "b" }));
  });
});

describe("requestExplanation", () => {
  it("posts the clipped error to the explainer", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    const fetchImpl: typeof fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({ explanation: "RPC down", fix: "Retry devnet" }),
        { status: 200 },
      );
    };
    const result = await requestExplanation("x".repeat(EXPLAIN_INPUT_CAP + 5), fetchImpl);
    assert.equal(capturedUrl, EXPLAIN_URL);
    assert.equal(JSON.parse(capturedBody).error.length, EXPLAIN_INPUT_CAP);
    assert.equal(result.fix, "Retry devnet");
  });
});
