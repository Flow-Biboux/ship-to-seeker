export type CheckId = "rpc" | "wallet" | "tx" | "sgt";

const ORDER: readonly CheckId[] = ["rpc", "wallet", "tx", "sgt"];

/** The check that still needs the user. A pass or an honest absence is settled. */
export function focusCheck(statuses: Record<CheckId, string>): CheckId | null {
  return (
    ORDER.find((id) => {
      const status = statuses[id];
      return status !== "pass" && status !== "absent";
    }) ?? null
  );
}
