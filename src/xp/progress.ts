const KNOWN_GUIDE_IDS = ["00", "01", "02", "03", "04", "05", "06"] as const;

export const XP_GUIDE = 10;
export const XP_RPC = 20;
export const XP_WALLET = 30;
export const XP_TX = 50;
export const XP_SGT = 100;
export const XP_MAX = 400;

export const LEVELS = [
  { name: "Rookie", min: 0 },
  { name: "Builder", min: 100 },
  { name: "Shipper", min: 250 },
  { name: "Seeker Pro", min: 400 },
] as const;

export type ProgressState = {
  completedGuideIds: string[];
  rpcVerified: boolean;
  walletVerified: boolean;
  txVerified: boolean;
  sgtVerified: boolean;
};

export const EMPTY_PROGRESS: ProgressState = {
  completedGuideIds: [],
  rpcVerified: false,
  walletVerified: false,
  txVerified: false,
  sgtVerified: false,
};

export function computeXp(state: ProgressState): number {
  const known = new Set<string>(KNOWN_GUIDE_IDS);
  const guides = state.completedGuideIds.filter((id) => known.has(id));
  const unique = [...new Set(guides)];
  let xp = unique.length * XP_GUIDE;
  if (state.rpcVerified) xp += XP_RPC;
  if (state.walletVerified) xp += XP_WALLET;
  if (state.txVerified) xp += XP_TX;
  if (state.sgtVerified) xp += XP_SGT;
  return Math.min(XP_MAX, xp);
}

export function levelForXp(xp: number): {
  name: string;
  min: number;
  nextMin: number | null;
  intoLevel: number;
  span: number;
} {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.min) current = level;
  }
  const index = LEVELS.findIndex((level) => level.name === current.name);
  const next = LEVELS[index + 1];
  const nextMin = next ? next.min : null;
  const span = nextMin == null ? 1 : nextMin - current.min;
  const intoLevel = nextMin == null ? 1 : Math.min(span, Math.max(0, xp - current.min));
  return { name: current.name, min: current.min, nextMin, intoLevel, span };
}

export function parseProgress(raw: string | null): ProgressState {
  if (raw == null || raw.length === 0) return { ...EMPTY_PROGRESS };
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState> & {
      completed?: string[];
    };
    const ids = Array.isArray(parsed.completedGuideIds)
      ? parsed.completedGuideIds
      : Array.isArray(parsed.completed)
        ? parsed.completed
        : [];
    const known = new Set<string>(KNOWN_GUIDE_IDS);
    return {
      completedGuideIds: ids.filter(
        (id): id is string => typeof id === "string" && known.has(id),
      ),
      rpcVerified: Boolean(parsed.rpcVerified),
      walletVerified: Boolean(parsed.walletVerified),
      txVerified: Boolean(parsed.txVerified),
      sgtVerified: Boolean(parsed.sgtVerified),
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}
