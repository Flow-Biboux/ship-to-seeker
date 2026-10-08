import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_PROGRESS,
  computeXp,
  levelForXp,
  parseProgress,
  summarizeProgress,
  XP_GUIDE,
  XP_RPC,
  XP_WALLET,
} from "./progress.ts";
import { canMarkModuleDone, panelHasCode, panelsForModule } from "../buildPath/guidePanels.ts";
import { BUILD_MODULES, markModuleCompleted } from "../buildPath/modules.ts";

describe("guide panels", () => {
  it("gives every module course panels and a code block", () => {
    for (const module of BUILD_MODULES) {
      const panels = panelsForModule(module.id);
      assert.ok(panels.length >= 5, module.id);
      assert.ok(
        panels.some((panel) => panelHasCode(panel)),
        `${module.id} has no code block`,
      );
    }
    assert.equal(canMarkModuleDone(5, 6), false);
    assert.equal(canMarkModuleDone(6, 6), true);
  });
});

describe("computeXp", () => {
  it("does not double-count a module", () => {
    const once = computeXp({
      ...EMPTY_PROGRESS,
      completedGuideIds: ["00", "00"],
    });
    const twiceListed = computeXp({
      ...EMPTY_PROGRESS,
      completedGuideIds: ["00"],
    });
    assert.equal(once, twiceListed);
    assert.equal(once, XP_GUIDE);
  });

  it("adds verified checks", () => {
    assert.equal(
      computeXp({
        ...EMPTY_PROGRESS,
        rpcVerified: true,
        walletVerified: true,
      }),
      XP_RPC + XP_WALLET,
    );
  });
});

describe("levelForXp", () => {
  it("maps thresholds", () => {
    assert.equal(levelForXp(0).name, "Rookie");
    assert.equal(levelForXp(100).name, "Builder");
    assert.equal(levelForXp(250).name, "Shipper");
    assert.equal(levelForXp(400).name, "Seeker Pro");
  });
});

describe("markModuleCompleted", () => {
  it("adds an id once", () => {
    assert.deepEqual(markModuleCompleted(["00"], "00"), ["00"]);
    assert.deepEqual(markModuleCompleted(["00"], "01"), ["00", "01"]);
  });
});

describe("summarizeProgress", () => {
  it("counts finished modules and verified checks", () => {
    const summary = summarizeProgress({
      ...EMPTY_PROGRESS,
      completedGuideIds: ["00", "00", "02", "99"],
      rpcVerified: true,
      walletVerified: true,
    });
    assert.equal(summary.modulesDone, 2);
    assert.equal(summary.modulesTotal, 7);
    assert.equal(summary.checksDone, 2);
    assert.equal(summary.checksTotal, 4);
    assert.equal(
      summary.meaning,
      "2 of 7 modules finished. 2 of 4 checks verified.",
    );
  });
});

describe("parseProgress", () => {
  it("reads guide ids from either shape", () => {
    assert.deepEqual(parseProgress('{"completedGuideIds":["01"]}').completedGuideIds, [
      "01",
    ]);
    assert.deepEqual(parseProgress('{"completed":["00"]}').completedGuideIds, ["00"]);
  });
});
