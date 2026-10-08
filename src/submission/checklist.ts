import type { ProgressState } from "../xp/progress";

export const SUBMISSION_URLS_KEY = "ship-to-seeker.submission-urls.v1";

export const CLOCK_IN_CLOSE_LABEL = "12 Oct 2026, 13:59 GMT+2";

const GITHUB_REPO =
  /^https:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

const REQUIRED_MODULE_IDS = ["00", "01", "02", "03", "04", "05", "06"] as const;

export type SubmissionUrls = {
  github: string;
  video: string;
  deck: string;
  submission: string;
};

export const EMPTY_SUBMISSION_URLS: SubmissionUrls = {
  github: "",
  video: "",
  deck: "",
  submission: "",
};

export type ProbeResult = "reachable" | "unreachable" | "skipped";

export type ProbeMap = Record<keyof SubmissionUrls, ProbeResult>;

export type RowTone = "present" | "missing" | "unproven" | "allowed";

export type ChecklistRow = {
  id: string;
  tone: RowTone;
  title: string;
  detail: string;
  blocker: boolean;
};

export type ChecklistReport = {
  rows: ChecklistRow[];
  missingBlockers: string[];
};

function trimmed(value: string): string {
  return value.trim();
}

export function parseSubmissionUrls(raw: string | null): SubmissionUrls {
  if (raw == null || raw.length === 0) return { ...EMPTY_SUBMISSION_URLS };
  try {
    const parsed = JSON.parse(raw) as Partial<SubmissionUrls>;
    return {
      github: typeof parsed.github === "string" ? parsed.github : "",
      video: typeof parsed.video === "string" ? parsed.video : "",
      deck: typeof parsed.deck === "string" ? parsed.deck : "",
      submission: typeof parsed.submission === "string" ? parsed.submission : "",
    };
  } catch {
    return { ...EMPTY_SUBMISSION_URLS };
  }
}

function httpsUrl(value: string): URL | null {
  const text = trimmed(value);
  if (text.length === 0) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username.length > 0 || url.password.length > 0) return null;
  return url;
}

export function githubRepoShape(value: string): "empty" | "bad" | "ok" {
  const text = trimmed(value);
  if (text.length === 0) return "empty";
  return GITHUB_REPO.test(text) ? "ok" : "bad";
}

function hostLooksLike(url: URL, hosts: readonly string[]): boolean {
  const host = url.hostname.toLowerCase();
  return hosts.some((item) => host === item || host.endsWith(`.${item}`));
}

function linkPhrase(
  shapeOk: boolean,
  probe: ProbeResult,
  looksLike: string,
): { tone: RowTone; detail: string } {
  if (!shapeOk) {
    return { tone: "missing", detail: looksLike };
  }
  if (probe === "reachable") {
    return {
      tone: "present",
      detail: `${looksLike} A request returned success, so this link is confirmed reachable.`,
    };
  }
  if (probe === "unreachable") {
    return {
      tone: "unproven",
      detail: `${looksLike} A request did not return success, so this is not confirmed reachable.`,
    };
  }
  return {
    tone: "unproven",
    detail: `${looksLike} Shape only — not confirmed reachable.`,
  };
}

function githubRow(value: string, probe: ProbeResult): ChecklistRow {
  const shape = githubRepoShape(value);
  if (shape === "empty") {
    return {
      id: "github",
      tone: "missing",
      title: "GitHub repo",
      detail: "Paste a public https://github.com/owner/repo link.",
      blocker: true,
    };
  }
  if (shape === "bad") {
    return {
      id: "github",
      tone: "missing",
      title: "GitHub repo",
      detail:
        "That is not a github.com/owner/repo link. Paste the repo root, not a file, issue, or profile.",
      blocker: true,
    };
  }
  const phrased = linkPhrase(true, probe, "Looks like a public github.com/owner/repo link.");
  return {
    id: "github",
    tone: phrased.tone,
    title: "GitHub repo",
    detail: `${phrased.detail} This check cannot see whether the repo is public beyond a successful response, or whether secrets are in the history.`,
    blocker: phrased.tone !== "present",
  };
}

function videoRow(value: string, probe: ProbeResult): ChecklistRow {
  const url = httpsUrl(value);
  if (trimmed(value).length === 0) {
    return {
      id: "video",
      tone: "missing",
      title: "Demo video",
      detail: "Paste an https link (YouTube, Loom, or any other https URL).",
      blocker: true,
    };
  }
  if (url == null) {
    return {
      id: "video",
      tone: "missing",
      title: "Demo video",
      detail: "The video link must be https.",
      blocker: true,
    };
  }
  let looks = "Looks like an https video link.";
  if (hostLooksLike(url, ["youtube.com", "youtu.be"])) {
    looks = "Looks like a YouTube link.";
  } else if (hostLooksLike(url, ["loom.com"])) {
    looks = "Looks like a Loom link.";
  }
  const phrased = linkPhrase(true, probe, looks);
  return {
    id: "video",
    tone: phrased.tone,
    title: "Demo video",
    detail: `${phrased.detail} This check does not watch the video or confirm it is about three minutes on a device.`,
    blocker: phrased.tone !== "present",
  };
}

function deckRow(value: string, probe: ProbeResult): ChecklistRow {
  const url = httpsUrl(value);
  if (trimmed(value).length === 0) {
    return {
      id: "deck",
      tone: "missing",
      title: "Pitch deck",
      detail:
        "No deck file lives in this app. Paste a Google Slides, Pitch, or PDF https link, or it stays missing.",
      blocker: true,
    };
  }
  if (url == null) {
    return {
      id: "deck",
      tone: "missing",
      title: "Pitch deck",
      detail: "The deck link must be https.",
      blocker: true,
    };
  }
  const path = url.pathname.toLowerCase();
  let looks = "Looks like an https deck link.";
  if (hostLooksLike(url, ["docs.google.com"]) && path.includes("/presentation")) {
    looks = "Looks like a Google Slides link.";
  } else if (hostLooksLike(url, ["pitch.com"])) {
    looks = "Looks like a Pitch link.";
  } else if (path.endsWith(".pdf")) {
    looks = "Looks like a PDF link.";
  }
  const phrased = linkPhrase(true, probe, looks);
  return {
    id: "deck",
    tone: phrased.tone,
    title: "Pitch deck",
    detail: phrased.detail,
    blocker: phrased.tone !== "present",
  };
}

function submissionRow(value: string, probe: ProbeResult): ChecklistRow {
  const url = httpsUrl(value);
  if (trimmed(value).length === 0) {
    return {
      id: "submission",
      tone: "missing",
      title: "Radiants submission",
      detail:
        "Paste the https link to your CLOCK IN submission on solanamobile.radiant.nexus if you have one. Close is " +
        CLOCK_IN_CLOSE_LABEL +
        ".",
      blocker: true,
    };
  }
  if (url == null) {
    return {
      id: "submission",
      tone: "missing",
      title: "Radiants submission",
      detail: "The submission link must be https.",
      blocker: true,
    };
  }
  const looks = hostLooksLike(url, ["radiant.nexus"])
    ? "Looks like a Radiants https link."
    : "Looks like an https submission link.";
  const phrased = linkPhrase(true, probe, looks);
  return {
    id: "submission",
    tone: phrased.tone,
    title: "Radiants submission",
    detail: `${phrased.detail} A reachable page is not proof the four fields are filled or that you signed the final agreement.`,
    blocker: phrased.tone !== "present",
  };
}

const PROBE_TIMEOUT_MS = 8000;

export async function probeHttpsUrl(url: string): Promise<"reachable" | "unreachable"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    let response = await fetch(url, { method: "HEAD", signal: controller.signal });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { method: "GET", signal: controller.signal });
    }
    return response.status >= 200 && response.status < 300 ? "reachable" : "unreachable";
  } catch (error: unknown) {
    console.warn("Submission URL probe failed", error);
    return "unreachable";
  } finally {
    clearTimeout(timer);
  }
}

export function buildChecklist(input: {
  urls: SubmissionUrls;
  probes: ProbeMap;
  progress: ProgressState;
}): ChecklistReport {
  const rows: ChecklistRow[] = [
    githubRow(input.urls.github, input.probes.github),
    videoRow(input.urls.video, input.probes.video),
    deckRow(input.urls.deck, input.probes.deck),
    submissionRow(input.urls.submission, input.probes.submission),
    {
      id: "apk",
      tone: "unproven",
      title: "Release APK",
      detail:
        "This installed app cannot prove the APK artifact. You still need the signed release APK file from the build to upload. Running this copy is not that file.",
      blocker: true,
    },
  ];

  const done = new Set(input.progress.completedGuideIds);
  const missingModules = REQUIRED_MODULE_IDS.filter((id) => !done.has(id));
  rows.push({
    id: "modules",
    tone: missingModules.length === 0 ? "present" : "missing",
    title: "Build path on this phone",
    detail:
      missingModules.length === 0
        ? "All modules 00–06 are ticked on this phone."
        : `Still open on this phone: ${missingModules.join(", ")}.`,
    blocker: false,
  });

  const checks: { id: string; done: boolean; title: string; missing: string }[] = [
    {
      id: "rpc",
      done: input.progress.rpcVerified,
      title: "Devnet RPC",
      missing: "Devnet RPC is not verified on this phone. Devnet is allowed for CLOCK IN.",
    },
    {
      id: "wallet",
      done: input.progress.walletVerified,
      title: "Wallet",
      missing: "Wallet connect is not verified on this phone.",
    },
    {
      id: "tx",
      done: input.progress.txVerified,
      title: "Devnet transaction",
      missing: "A devnet transaction is not verified on this phone. Devnet is allowed.",
    },
  ];
  for (const check of checks) {
    rows.push({
      id: check.id,
      tone: check.done ? "present" : "missing",
      title: check.title,
      detail: check.done ? "Verified on this phone." : check.missing,
      blocker: false,
    });
  }

  rows.push({
    id: "sgt",
    tone: input.progress.sgtVerified ? "present" : "allowed",
    title: "Seeker Genesis Token",
    detail: input.progress.sgtVerified
      ? "Verified on this phone."
      : "Not verified. That is allowed and does not block this checklist. dApp Store KYC is separate and is not part of this list.",
    blocker: false,
  });

  return {
    rows,
    missingBlockers: rows.filter((row) => row.blocker).map((row) => row.title),
  };
}
