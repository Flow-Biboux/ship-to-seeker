const XP_URL = "https://clock-in.biboux.com/api/xp";

export function syncXp(publicKey: string, xp: number): void {
  fetch(XP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey, xp }),
  }).catch((error: unknown) => {
    console.warn("XP sync failed", error);
  });
}

export async function fetchRemoteXp(
  publicKey: string,
): Promise<number | null> {
  try {
    const response = await fetch(
      `${XP_URL}?publicKey=${encodeURIComponent(publicKey)}`,
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { xp?: number };
    return typeof body.xp === "number" ? body.xp : null;
  } catch (error: unknown) {
    console.warn("XP fetch failed", error);
    return null;
  }
}
