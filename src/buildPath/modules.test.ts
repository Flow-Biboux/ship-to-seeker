import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BUILD_MODULES,
  parseCompletedIds,
  toggleCompletedId,
} from "./modules.ts";

describe("parseCompletedIds", () => {
  it("keeps only known module ids", () => {
    assert.deepEqual(parseCompletedIds('["00","99","02"]'), ["00", "02"]);
  });

  it("returns empty for missing or invalid storage", () => {
    assert.deepEqual(parseCompletedIds(null), []);
    assert.deepEqual(parseCompletedIds("not-json"), []);
    assert.deepEqual(parseCompletedIds('{"00":true}'), []);
  });
});

describe("toggleCompletedId", () => {
  it("adds then removes an id", () => {
    const added = toggleCompletedId([], "01");
    assert.deepEqual(added, ["01"]);
    assert.deepEqual(toggleCompletedId(added, "01"), []);
  });
});

describe("BUILD_MODULES", () => {
  it("lists modules 00 through 06", () => {
    assert.deepEqual(
      BUILD_MODULES.map((module) => module.id),
      ["00", "01", "02", "03", "04", "05", "06"],
    );
  });
});
