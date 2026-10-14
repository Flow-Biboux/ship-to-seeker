import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BUILD_MODULES, SKR_MODULES } from "./modules.ts";
import { isRecallCorrect, recallFor } from "./recall.ts";

describe("recallFor", () => {
  it("has one question for every guide", () => {
    for (const module of [...BUILD_MODULES, ...SKR_MODULES]) {
      const question = recallFor(module.id);
      assert.ok(question, module.id);
      assert.ok(question.choices.includes(question.answer), module.id);
    }
  });
});

describe("isRecallCorrect", () => {
  it("accepts only the answer", () => {
    assert.equal(isRecallCorrect("07", "The seed phrase"), true);
    assert.equal(isRecallCorrect("07", "The public address"), false);
  });

  it("does not block a module with no question", () => {
    assert.equal(isRecallCorrect("missing", null), true);
  });
});
