import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BUILD_PATH_STORAGE_KEY,
  markModuleCompleted,
  parseCompletedIds,
} from "../buildPath/modules";
import { useAuthorization } from "../utils/useAuthorization";
import {
  EMPTY_PROGRESS,
  computeXp,
  parseProgress,
  type ProgressState,
} from "./progress";
import { syncXp } from "./syncXp";

export const PROGRESS_STORAGE_KEY = "ship-to-seeker.progress.v1";

type ProgressContextValue = {
  progress: ProgressState;
  xp: number;
  ready: boolean;
  completeGuide: (id: string) => void;
  setRpcVerified: (value: boolean) => void;
};

const Context = createContext<ProgressContextValue>({
  progress: EMPTY_PROGRESS,
  xp: 0,
  ready: false,
  completeGuide: () => {},
  setRpcVerified: () => {},
});

async function loadProgress(): Promise<ProgressState> {
  const raw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
  let state = parseProgress(raw);
  if (state.completedGuideIds.length === 0) {
    const legacy = await AsyncStorage.getItem(BUILD_PATH_STORAGE_KEY);
    const ids = parseCompletedIds(legacy);
    if (ids.length > 0) {
      state = { ...state, completedGuideIds: ids };
    }
  }
  return state;
}

function persist(state: ProgressState) {
  AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state)).catch(
    (error: unknown) => {
      console.warn("Progress did not save", error);
    },
  );
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { selectedAccount } = useAuthorization();
  const [progress, setProgress] = useState<ProgressState>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadProgress()
      .then((next) => {
        if (!cancelled) {
          setProgress(next);
          setReady(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Progress did not load", error);
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((fn: (current: ProgressState) => ProgressState) => {
    setProgress((current) => {
      const next = fn(current);
      persist(next);
      return next;
    });
  }, []);

  const completeGuide = useCallback(
    (id: string) => {
      patch((current) => ({
        ...current,
        completedGuideIds: markModuleCompleted(current.completedGuideIds, id),
      }));
    },
    [patch],
  );

  const setRpcVerified = useCallback(
    (value: boolean) => {
      patch((current) => ({ ...current, rpcVerified: value }));
    },
    [patch],
  );

  useEffect(() => {
    if (!selectedAccount) return;
    patch((current) =>
      current.walletVerified ? current : { ...current, walletVerified: true },
    );
  }, [selectedAccount, patch]);

  const xp = useMemo(() => computeXp(progress), [progress]);

  useEffect(() => {
    if (!ready || !selectedAccount) return;
    syncXp(selectedAccount.publicKey.toBase58(), xp);
  }, [ready, selectedAccount, xp]);

  const value = useMemo(
    () => ({ progress, xp, ready, completeGuide, setRpcVerified }),
    [progress, xp, ready, completeGuide, setRpcVerified],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useProgress() {
  return useContext(Context);
}
