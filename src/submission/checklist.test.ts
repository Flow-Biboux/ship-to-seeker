import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMPTY_PROGRESS } from "../xp/progress.ts";
import {
  buildChecklist,
  githubRepoShape,
  parseSubmissionUrls,
  type ProbeMap,
} from "./checklist.ts";

const SKIPPED: ProbeMap = {
  github: "skipped",
  video: "skipped",
  deck: "skipped",
  submission: "skipped",
};

function row(id: string, urls = {}, probes: Partial<ProbeMap> = {}, progress = EMPTY_PROGRESS) {
  const report = buildChecklist({
    urls: {
      github: "",
      video: "",
      deck: "",
      submission: "",
      ...urls,
    },
    probes: { ...SKIPPED, ...probes },
    progress,
  });
  const found = report.rows.find((item) => item.id === id);
  assert.ok(found, id);
  return { report, found };
}

describe("githubRepoShape", () => {
  it("accepts a public repo root", () => {
    assert.equal(githubRepoShape("https://github.com/Flow-Biboux/ship-to-seeker-app"), "ok");
    assert.equal(githubRepoShape("https://github.com/owner/repo.git"), "ok");
    assert.equal(githubRepoShape("https://www.github.com/owner/repo/"), "ok");
  });

  it("rejects profiles, files, and non-https", () => {
    assert.equal(githubRepoShape(""), "empty");
    assert.equal(githubRepoShape("https://github.com/owner"), "bad");
    assert.equal(githubRepoShape("https://github.com/owner/repo/blob/main/README.md"), "bad");
    assert.equal(githubRepoShape("http://github.com/owner/repo"), "bad");
  });
});

describe("buildChecklist", () => {
  it("lists empty packet fields as missing and never greens the APK", () => {
    const { report, found } = row("apk");
    assert.equal(found.tone, "unproven");
    assert.equal(found.blocker, true);
    assert.match(found.detail, /signed release APK/);
    assert.ok(report.missingBlockers.includes("GitHub repo"));
    assert.ok(report.missingBlockers.includes("Demo video"));
    assert.ok(report.missingBlockers.includes("Pitch deck"));
    assert.ok(report.missingBlockers.includes("Radiants submission"));
    assert.ok(report.missingBlockers.includes("Release APK"));
  });

  it("says looks-like until a probe returns success", () => {
    const shaped = row(
      "github",
      { github: "https://github.com/owner/repo" },
      { github: "skipped" },
    );
    assert.equal(shaped.found.tone, "unproven");
    assert.match(shaped.found.detail, /Looks like a public github.com\/owner\/repo link/);
    assert.match(shaped.found.detail, /not confirmed reachable/);
    assert.equal(shaped.found.blocker, true);

    const reached = row(
      "github",
      { github: "https://github.com/owner/repo" },
      { github: "reachable" },
    );
    assert.equal(reached.found.tone, "present");
    assert.match(reached.found.detail, /confirmed reachable/);
    assert.equal(reached.found.blocker, false);
  });

  it("does not treat a failed request as a confirmed link", () => {
    const { found } = row(
      "video",
      { video: "https://www.youtube.com/watch?v=abc" },
      { video: "unreachable" },
    );
    assert.equal(found.tone, "unproven");
    assert.match(found.detail, /YouTube/);
    assert.match(found.detail, /not confirmed reachable/);
  });

  it("keeps the deck missing until an https link is pasted", () => {
    const missing = row("deck");
    assert.equal(missing.found.tone, "missing");
    assert.match(missing.found.detail, /No deck file/);

    const pdf = row("deck", { deck: "https://example.com/pitch.pdf" });
    assert.match(pdf.found.detail, /PDF link/);
    assert.equal(pdf.found.tone, "unproven");
  });

  it("allows a missing Genesis Token and still lists open diagnostics", () => {
    const sgt = row("sgt");
    assert.equal(sgt.found.tone, "allowed");
    assert.equal(sgt.found.blocker, false);
    assert.equal(sgt.report.missingBlockers.includes("Seeker Genesis Token"), false);

    const rpc = row("rpc", {}, {}, { ...EMPTY_PROGRESS, walletVerified: true, txVerified: true });
    assert.equal(rpc.found.tone, "missing");
    assert.match(rpc.found.detail, /Devnet is allowed/);

    const modules = row("modules", {}, {}, {
      ...EMPTY_PROGRESS,
      completedGuideIds: ["00", "01"],
    });
    assert.match(modules.found.detail, /02, 03, 04, 05, 06/);
    assert.equal(modules.found.blocker, false);
  });
});

describe("parseSubmissionUrls", () => {
  it("drops unknown shapes", () => {
    assert.deepEqual(parseSubmissionUrls(null), {
      github: "",
      video: "",
      deck: "",
      submission: "",
    });
    assert.equal(parseSubmissionUrls('{"github":"https://github.com/a/b"}').github, "https://github.com/a/b");
    assert.equal(parseSubmissionUrls("not-json").deck, "");
  });
});
