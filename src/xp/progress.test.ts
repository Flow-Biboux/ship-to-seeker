import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_PROGRESS,
  computeXp,
  levelForXp,
  parseProgress,
  XP_GUIDE,
  XP_RPC,
  XP_WALLET,
} from "./progress.ts";
import { canMarkDone, GUIDE_PANEL_COUNT, panelsForModule } from "../buildPath/guidePanels.ts";
import { BUILD_MODULES, markModuleCompleted } from "../buildPath/modules.ts";

describe("guide panels", () => {
  it("is exactly 3 panels per module", () => {
    for (const module of BUILD_MODULES) {
      assert.equal(panelsForModule(module.id).length, GUIDE_PANEL_COUNT);
    }
  });

  it("enables mark done only on last page after scroll end", () => {
    assert.equal(
      canMarkDone({ pageIndex: 1, lastPanelScrolledToEnd: true }),
      false,
    );
    assert.equal(
      canMarkDone({ pageIndex: 2, lastPanelScrolledToEnd: false }),
      false,
    );
    assert.equal(
      canMarkDone({ pageIndex: 2, lastPanelScrolledToEnd: true }),
      true,
    );
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

describe("parseProgress", () => {
  it("reads guide ids from either shape", () => {
    assert.deepEqual(parseProgress('{"completedGuideIds":["01"]}').completedGuideIds, [
      "01",
    ]);
    assert.deepEqual(parseProgress('{"completed":["00"]}').completedGuideIds, ["00"]);
  });
});
