export const EXPLAIN_URL = "https://clock-in.biboux.com/api/explain";
export const EXPLAIN_INPUT_CAP = 4000;

export type ExplainResult = {
  explanation: string;
  fix: string;
};

export function clipExplainInput(text: string): string {
  return text.slice(0, EXPLAIN_INPUT_CAP);
}

export function parseExplainResponse(status: number, body: unknown): ExplainResult {
  if (status < 200 || status >= 300) {
    throw new Error(`Explainer returned HTTP ${status}`);
  }
  if (body == null || typeof body !== "object") {
    throw new Error("Explainer returned an unexpected response");
  }
  const record = body as Record<string, unknown>;
  const explanation = record.explanation;
  const fix = record.fix;
  if (typeof explanation !== "string" || typeof fix !== "string") {
    throw new Error("Explainer response is missing explanation or fix");
  }
  return { explanation, fix };
}

export async function requestExplanation(
  errorText: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ExplainResult> {
  const text = clipExplainInput(errorText).trim();
  if (text.length === 0) {
    throw new Error("Paste an error first");
  }
  const response = await fetchImpl(EXPLAIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ error: text }),
  });
  const raw: unknown = await response.json().catch(() => null);
  return parseExplainResponse(response.status, raw);
}
