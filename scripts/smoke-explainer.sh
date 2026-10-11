#!/usr/bin/env bash
# Smoke test for the Explainer backend path the app calls (src/explainer/explainError.ts → EXPLAIN_URL).
# Checks the live endpoint answers with { explanation, fix } for an error and for a transaction digest.
set -euo pipefail
URL="${EXPLAIN_URL:-https://clock-in.biboux.com/api/explain}"

check() {
  local label="$1" body="$2"
  local out
  out="$(curl -sS --max-time 30 -X POST "$URL" -H 'Content-Type: application/json' -d "$body")"
  echo "$out" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["explanation"] and d["fix"], d' \
    && echo "ok  - $label" || { echo "FAIL - $label: $out"; exit 1; }
}

check "error text" '{"error":"Error: blockhash not found"}'
check "transaction digest" '{"error":"Solana transaction on devnet. Explain what happened in plain English.\nStatus: FAILED\nError: {\"InstructionError\":[0,{\"Custom\":1}]}\nProgram logs:\nProgram log: Error: insufficient funds"}'
