import React, { useState } from "react";
import { Linking, ScrollView, StyleSheet } from "react-native";
import { Button, Card, Chip, Text, TextInput } from "react-native-paper";
import { ScreenIntro } from "../components/ScreenIntro";
import {
  EXPLAIN_INPUT_CAP,
  requestExplanation,
  type ExplainResult,
} from "../explainer/explainError";
import {
  explorerUrl,
  isTxSignature,
  lookupTransaction,
  type TxLookup,
} from "../explainer/txDigest";

const SCREEN_PADDING = 16;

export function ExplainerScreen() {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tx, setTx] = useState<{ signature: string; lookup: TxLookup } | null>(null);
  const isSignature = isTxSignature(draft);

  const explain = async () => {
    setBusy(true);
    setErrorMessage(null);
    setResult(null);
    setTx(null);
    try {
      let text = draft;
      if (isTxSignature(draft)) {
        const signature = draft.trim();
        const lookup = await lookupTransaction(signature);
        if (lookup == null) {
          throw new Error("Transaction not found on devnet or mainnet. Check the signature, or wait a few seconds if it was just sent.");
        }
        setTx({ signature, lookup });
        text = lookup.digest;
      }
      const next = await requestExplanation(text);
      setResult(next);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not reach the explainer";
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenIntro
        title="Explainer"
        subtitle="Paste an error or a transaction signature"
      />
      <TextInput
        mode="outlined"
        label={isSignature ? "Transaction signature" : "Error text or signature"}
        placeholder="Paste an error, a log, or a transaction signature"
        value={draft}
        onChangeText={(value) => setDraft(value.slice(0, EXPLAIN_INPUT_CAP))}
        multiline
        numberOfLines={8}
        style={styles.input}
      />
      <Text variant="bodySmall">
        {draft.length}/{EXPLAIN_INPUT_CAP}
      </Text>
      <Button
        mode="contained"
        onPress={() => {
          explain().catch((error: unknown) => {
            console.warn("Explainer request failed", error);
          });
        }}
        loading={busy}
        disabled={busy || draft.trim().length === 0}
        style={styles.button}
      >
        {isSignature ? "Explain transaction" : "Explain"}
      </Button>
      {errorMessage != null ? (
        <Text variant="bodyMedium" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
      {tx != null ? (
        <Card mode="outlined" style={styles.card}>
          <Card.Content style={styles.txRow}>
            <Chip compact icon={tx.lookup.succeeded ? "check" : "close"}>
              {tx.lookup.succeeded ? "Success" : "Failed"} · {tx.lookup.cluster}
            </Chip>
            <Text variant="bodySmall">
              {tx.signature.slice(0, 8)}…{tx.signature.slice(-8)}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              onPress={() => {
                Linking.openURL(explorerUrl(tx.signature, tx.lookup.cluster)).catch(
                  (error: unknown) => {
                    console.warn("Could not open Explorer", error);
                  },
                );
              }}
            >
              View on Explorer
            </Button>
          </Card.Actions>
        </Card>
      ) : null}
      {result != null ? (
        <Card mode="outlined" style={styles.card}>
          <Card.Title title={tx != null ? "What happened" : "What it means"} />
          <Card.Content>
            <Text variant="bodyMedium">{result.explanation}</Text>
            <Text variant="titleSmall" style={styles.fixLabel}>
              {tx?.lookup.succeeded ? "What to do next" : "How to fix it"}
            </Text>
            <Text variant="bodyMedium">{result.fix}</Text>
          </Card.Content>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: SCREEN_PADDING,
    paddingBottom: 32,
  },
  input: {
    minHeight: 160,
  },
  button: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  error: {
    marginTop: 12,
  },
  card: {
    marginTop: 16,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fixLabel: {
    marginTop: 12,
    marginBottom: 4,
  },
});
