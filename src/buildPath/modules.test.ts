import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canMarkModuleDone, panelHasCode, panelsForModule } from "./guidePanels.ts";
import {
  BUILD_MODULES,
  markModuleCompleted,
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

describe("guide panels", () => {
  it("gives every module at least five panels and keeps code out of the prose", () => {
    assert.equal(panelsForModule("00").map((panel) => panel.title).length, 6);
    assert.deepEqual(
      panelsForModule("00").map((panel) => panel.title),
      [
        "What you need",
        "Generate the app",
        "Don't use Expo Go",
        "Get a wallet on the device",
        "Checkpoint",
        "Common breakages",
      ],
    );
    for (const module of BUILD_MODULES) {
      const panels = panelsForModule(module.id);
      assert.ok(panels.length >= 5, module.id);
      assert.ok(
        panels.some((panel) => panelHasCode(panel)),
        `${module.id} has no code block`,
      );
    }
    const generate = panelsForModule("00")[1];
    assert.equal(generate?.blocks.some((block) => block.kind === "code"), true);
    assert.equal(
      generate?.blocks.some(
        (block) => block.kind === "text" && block.text.includes("npm create"),
      ),
      false,
    );
    assert.equal(canMarkModuleDone(5, 6), false);
    assert.equal(canMarkModuleDone(6, 6), true);
  });
});

describe("markModuleCompleted", () => {
  it("adds an id once", () => {
    assert.deepEqual(markModuleCompleted(["00"], "00"), ["00"]);
    assert.deepEqual(markModuleCompleted(["00"], "01"), ["00", "01"]);
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
