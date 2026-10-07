import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { ScreenIntro } from "../components/ScreenIntro";
import {
  EXPLAIN_INPUT_CAP,
  requestExplanation,
  type ExplainResult,
} from "../explainer/explainError";

const SCREEN_PADDING = 16;

export function ExplainerScreen() {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const explain = async () => {
    setBusy(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const next = await requestExplanation(draft);
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
        subtitle="Paste an error, get a fix"
      />
      <TextInput
        mode="outlined"
        label="Error text"
        placeholder="Paste the log or error message"
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
        Explain
      </Button>
      {errorMessage != null ? (
        <Text variant="bodyMedium" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
      {result != null ? (
        <Card mode="outlined" style={styles.card}>
          <Card.Title title="What it means" />
          <Card.Content>
            <Text variant="bodyMedium">{result.explanation}</Text>
            <Text variant="titleSmall" style={styles.fixLabel}>
              How to fix it
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
  fixLabel: {
    marginTop: 12,
    marginBottom: 4,
  },
});
