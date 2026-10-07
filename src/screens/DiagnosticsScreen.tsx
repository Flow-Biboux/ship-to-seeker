import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { ScreenIntro } from "../components/ScreenIntro";
import {
  RPC_UNREACHABLE_HINT,
  checkDevnetRpcHealth,
  type DevnetRpcChip,
} from "../diagnostics/devnetRpc";
import { useProgress } from "../xp/ProgressContext";

type CheckState = "checking" | DevnetRpcChip;

const SCREEN_PADDING = 16;
const CHIP_CONNECTED = "#1B7F3A";
const CHIP_UNREACHABLE = "#B42318";
const CHIP_CHECKING = "#5C6570";
const CHIP_LABEL = "#FFFFFF";

export function DiagnosticsScreen() {
  const { setRpcVerified } = useProgress();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<CheckState>("checking");

  useEffect(() => {
    let cancelled = false;
    setStatus("checking");

    checkDevnetRpcHealth()
      .then((next) => {
        if (!cancelled) {
          setStatus(next);
          setRpcVerified(next === "connected");
        }
      })
      .catch((error: unknown) => {
        console.warn("Devnet RPC check did not settle", error);
        if (!cancelled) {
          setStatus("unreachable");
          setRpcVerified(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  const chipLabel =
    status === "checking"
      ? "Checking"
      : status === "connected"
        ? "Connected"
        : "Unreachable";
  const chipColor =
    status === "connected"
      ? CHIP_CONNECTED
      : status === "unreachable"
        ? CHIP_UNREACHABLE
        : CHIP_CHECKING;

  return (
    <View style={styles.screen}>
      <ScreenIntro
        title="Diagnostics"
        subtitle="Check your Solana Mobile setup"
      />
      <Card mode="outlined">
        <Card.Title title="Devnet RPC" subtitle="getHealth on api.devnet.solana.com" />
        <Card.Content>
          <Chip
            style={{ backgroundColor: chipColor }}
            textStyle={styles.chipText}
          >
            {chipLabel}
          </Chip>
          {status === "unreachable" ? (
            <Text variant="bodyMedium" style={styles.hint}>
              {RPC_UNREACHABLE_HINT}
            </Text>
          ) : null}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained-tonal"
            onPress={retry}
            disabled={status === "checking"}
            loading={status === "checking"}
          >
            Retry
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: SCREEN_PADDING,
  },
  chipText: {
    color: CHIP_LABEL,
  },
  hint: {
    marginTop: 12,
  },
});
